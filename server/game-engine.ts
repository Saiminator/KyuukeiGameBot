import { storage } from "./storage";
import { type CharacterInstance, type CharacterStats, type BaseCharacter, type ContentBlock } from "@shared/schema";

export class GameEngine {
  // Generate hourly roll candidates
  async generateRollCandidates(userId: string, count: number = 5): Promise<CharacterInstance[]> {
    const user = await storage.getUser(userId);
    if (!user) throw new Error("User not found");

    const baseCharacters = await storage.getBaseCharacters();
    const today = new Date().toISOString().split('T')[0];
    const cotdCharacterId = await storage.getCharacterOfTheDay(today);
    
    const candidates: CharacterInstance[] = [];

    for (let i = 0; i < count; i++) {
      // Randomly select a base character
      const baseChar = baseCharacters[Math.floor(Math.random() * baseCharacters.length)];
      
      // Roll stats (70-115% range)
      const rollPercentages: CharacterStats = {
        str: Math.floor(Math.random() * 46) + 70, // 70-115
        agi: Math.floor(Math.random() * 46) + 70,
        sta: Math.floor(Math.random() * 46) + 70,
        mag: Math.floor(Math.random() * 46) + 70,
        wit: Math.floor(Math.random() * 46) + 70,
        wil: Math.floor(Math.random() * 46) + 70,
        cha: Math.floor(Math.random() * 46) + 70,
        luk: Math.floor(Math.random() * 46) + 70,
      };

      // Apply COTD bonus if applicable
      const isCOTD = cotdCharacterId === baseChar.id;
      if (isCOTD) {
        // Add +10pp to each stat, capped at 115%
        Object.keys(rollPercentages).forEach(stat => {
          rollPercentages[stat as keyof CharacterStats] = Math.min(115, rollPercentages[stat as keyof CharacterStats] + 10);
        });
      }

      // Calculate final stats by applying percentages to base stats
      const currentStats: CharacterStats = {
        str: Math.min(999, Math.floor(baseChar.baseStats.str * rollPercentages.str / 100)),
        agi: Math.min(999, Math.floor(baseChar.baseStats.agi * rollPercentages.agi / 100)),
        sta: Math.min(999, Math.floor(baseChar.baseStats.sta * rollPercentages.sta / 100)),
        mag: Math.min(999, Math.floor(baseChar.baseStats.mag * rollPercentages.mag / 100)),
        wit: Math.min(999, Math.floor(baseChar.baseStats.wit * rollPercentages.wit / 100)),
        wil: Math.min(999, Math.floor(baseChar.baseStats.wil * rollPercentages.wil / 100)),
        cha: Math.min(999, Math.floor(baseChar.baseStats.cha * rollPercentages.cha / 100)),
        luk: Math.min(999, Math.floor(baseChar.baseStats.luk * rollPercentages.luk / 100)),
      };

      // Calculate tier based on average percentage
      const avgPercentage = Math.floor(
        (rollPercentages.str + rollPercentages.agi + rollPercentages.sta + rollPercentages.mag + 
         rollPercentages.wit + rollPercentages.wil + rollPercentages.cha + rollPercentages.luk) / 8
      );

      let tier: string;
      if (avgPercentage >= 110) tier = "S";
      else if (avgPercentage >= 100) tier = "A";
      else if (avgPercentage >= 90) tier = "B";
      else if (avgPercentage >= 80) tier = "C";
      else tier = "D";

      const candidate = await storage.createCharacterInstance({
        userId,
        baseCharacterId: baseChar.id,
        currentStats,
        rollPercentages,
        tier,
        averagePercentage: avgPercentage,
        cotdUsed: isCOTD,
        status: "candidate",
        trainingDay: 0,
        maxTrainingDays: 14,
        items: [],
        flags: [],
        coins: 0,
        injuries: [],
        seasonId: "2025S1",
        isActivePvP: false,
        lockedAt: null,
      });

      candidates.push(candidate);
    }

    return candidates;
  }

  // Start training session
  async startTraining(characterInstanceId: string): Promise<{ session: any, options: ContentBlock[] }> {
    const character = await storage.getCharacterInstance(characterInstanceId);
    if (!character) throw new Error("Character not found");

    // Update character status to training
    await storage.updateCharacterInstance(characterInstanceId, { status: "training", trainingDay: 1 });

    // Create training session
    const session = await storage.createTrainingSession({
      userId: character.userId,
      characterInstanceId,
      currentDay: 1,
      lastTrainingTag: null,
      eventPityCounter: 0,
      isWaitingForChoice: true,
      currentOptions: [],
      lastMessageId: null,
    });

    // Generate training options
    const options = await this.generateTrainingOptions(character, session);
    
    // Update session with options
    await storage.updateTrainingSession(session.id, {
      currentOptions: options.map(o => o.id)
    });

    return { session, options };
  }

  // Generate training options for current day
  async getTrainingOptionsByIds(ids: string[]): Promise<ContentBlock[]> {
    const options = [];
    for (const id of ids) {
      const block = await storage.getContentBlock(id);
      if (block) {
        options.push(block);
      }
    }
    return options;
  }

  async generateTrainingOptions(character: CharacterInstance, session: any): Promise<ContentBlock[]> {
    const baseChar = await storage.getBaseCharacter(character.baseCharacterId);
    if (!baseChar) throw new Error("Base character not found");

    // Get available content blocks
    const availableBlocks = await storage.getContentBlocks(baseChar.id, session.currentDay);
    
    // Filter by requirements
    const eligibleBlocks = availableBlocks.filter(block => {
      const characterFlags = character.flags || [];
      const characterItems = character.items || [];
      
      // Check flag requirements
      if (block.requiresFlags && block.requiresFlags.length > 0 && !block.requiresFlags.every(flag => characterFlags.includes(flag))) {
        return false;
      }
      if (block.excludesFlags && block.excludesFlags.length > 0 && block.excludesFlags.some(flag => characterFlags.includes(flag))) {
        return false;
      }
      // Check item requirements
      if (block.requiresItems && block.requiresItems.length > 0 && !block.requiresItems.every(item => characterItems.includes(item))) {
        return false;
      }
      return true;
    });

    if (eligibleBlocks.length === 0) {
      throw new Error("No eligible training blocks available");
    }

    // Determine event frequency (70% = 0 events, 25% = 1 event, 5% = 2 events)
    let eventCount = 0;
    if (session.eventPityCounter >= 5) {
      // Pity: guarantee at least 1 event after 5 days without events
      eventCount = 1;
    } else {
      const roll = Math.random() * 100;
      if (roll < 70) eventCount = 0;
      else if (roll < 95) eventCount = 1;
      else eventCount = 2;
    }

    // Separate events from regular training
    const events = eligibleBlocks.filter(block => block.kind === "event");
    const regularTraining = eligibleBlocks.filter(block => block.kind === "training");

    const selectedOptions: ContentBlock[] = [];

    // Add events first
    if (eventCount > 0 && events.length > 0) {
      const shuffledEvents = events.sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.min(eventCount, shuffledEvents.length); i++) {
        selectedOptions.push(shuffledEvents[i]);
      }
    }

    // Fill remaining slots with regular training
    const remainingSlots = 3 - selectedOptions.length;
    if (remainingSlots > 0 && regularTraining.length > 0) {
      // Avoid repeating same primary tag back-to-back
      let availableTraining = regularTraining;
      if (session.lastTrainingTag) {
        availableTraining = regularTraining.filter(block => block.primaryTag !== session.lastTrainingTag);
        if (availableTraining.length === 0) {
          availableTraining = regularTraining; // fallback if no alternatives
        }
      }

      const shuffledTraining = availableTraining.sort(() => Math.random() - 0.5);
      for (let i = 0; i < Math.min(remainingSlots, shuffledTraining.length); i++) {
        selectedOptions.push(shuffledTraining[i]);
      }
    }

    return selectedOptions.slice(0, 3);
  }

  // Apply training choice
  async applyTrainingChoice(userId: string, blockId: string): Promise<{ character: CharacterInstance, session: any, result: any }> {
    const session = await storage.getTrainingSession(userId);
    if (!session) throw new Error("Training session not found");

    const character = await storage.getCharacterInstance(session.characterInstanceId);
    if (!character) throw new Error("Character not found");

    const blocks = await storage.getContentBlocks();
    const block = blocks.find(b => b.id === blockId);
    if (!block) throw new Error("Content block not found");

    const baseChar = await storage.getBaseCharacter(character.baseCharacterId);
    if (!baseChar) throw new Error("Base character not found");

    // Apply stat gains (scaled by character growth weights)
    const newStats = { ...character.currentStats };
    if (block.statGains) {
      Object.entries(block.statGains).forEach(([stat, gain]) => {
        if (gain && stat in newStats) {
          const growthWeight = baseChar.growthWeights[stat as keyof CharacterStats];
          const scaledGain = Math.floor(gain * growthWeight);
          newStats[stat as keyof CharacterStats] = Math.min(999, newStats[stat as keyof CharacterStats] + scaledGain);
        }
      });
    }

    // Apply other effects
    const newFlags = [...(character.flags || [])];
    if (block.setFlags) {
      block.setFlags.forEach(flag => {
        if (!newFlags.includes(flag)) newFlags.push(flag);
      });
    }
    if (block.unsetFlags) {
      block.unsetFlags.forEach(flag => {
        const index = newFlags.indexOf(flag);
        if (index > -1) newFlags.splice(index, 1);
      });
    }

    const newItems = [...(character.items || [])];
    if (block.grantItems) {
      block.grantItems.forEach(item => {
        if (!newItems.includes(item)) newItems.push(item);
      });
    }
    if (block.removeItems) {
      block.removeItems.forEach(item => {
        const index = newItems.indexOf(item);
        if (index > -1) newItems.splice(index, 1);
      });
    }

    const newCoins = (character.coins || 0) + (block.coinGain || 0);

    // Handle injuries
    let newInjuries = [...(character.injuries || [])];
    if (block.healInjuries) {
      newInjuries = [];
    } else if (block.injuryRisk && block.injuryRisk > 0) {
      const roll = Math.random() * 100;
      if (roll < block.injuryRisk) {
        const injuryTypes = ["bruised", "strained", "exhausted"];
        const injury = injuryTypes[Math.floor(Math.random() * injuryTypes.length)];
        if (!newInjuries.includes(injury)) {
          newInjuries.push(injury);
        }
      }
    }

    // Update character
    const updatedCharacter = await storage.updateCharacterInstance(character.id, {
      currentStats: newStats,
      flags: newFlags,
      items: newItems,
      coins: newCoins,
      injuries: newInjuries,
      trainingDay: (character.trainingDay || 0) + 1,
    });

    if (!updatedCharacter) throw new Error("Failed to update character");

    // Update session
    const eventPityCounter = block.kind === "event" ? 0 : (session.eventPityCounter || 0) + 1;
    const lastTrainingTag = block.kind === "training" ? block.primaryTag : session.lastTrainingTag;

    let updatedSession;
    if ((updatedCharacter.trainingDay || 0) >= (updatedCharacter.maxTrainingDays || 14)) {
      // Training complete - lock character
      await storage.updateCharacterInstance(character.id, { 
        status: "locked", 
        lockedAt: new Date() 
      });
      await storage.deleteTrainingSession(session.id);
      updatedSession = null;
    } else {
      updatedSession = await storage.updateTrainingSession(session.id, {
        currentDay: updatedCharacter.trainingDay || 1,
        eventPityCounter,
        lastTrainingTag,
        isWaitingForChoice: !block.openShop, // if opening shop, don't wait for choice
        currentOptions: [],
      });
    }

    return {
      character: updatedCharacter,
      session: updatedSession,
      result: {
        block,
        statGains: block.statGains,
        coinGain: block.coinGain,
        newItems: block.grantItems,
        openShop: block.openShop,
        postFlair: block.postFlair,
      }
    };
  }

  // Check if user can roll (hourly cooldown)
  canUserRoll(user: any): boolean {
    if (!user.lastRoll) return true;
    const hoursSinceLastRoll = (Date.now() - user.lastRoll.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastRoll >= 1;
  }

  // Get tier color class
  getTierColorClass(tier: string): string {
    switch (tier) {
      case "S": return "tier-s";
      case "A": return "tier-a";
      case "B": return "tier-b";
      case "C": return "tier-c";
      case "D": return "tier-d";
      default: return "tier-d";
    }
  }
}

export const gameEngine = new GameEngine();
