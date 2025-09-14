import { storage } from "./storage";
import { type ContentBlock, type CharacterInstance } from "@shared/schema";

export class ContentSystem {
  // Initialize content blocks for different characters and scenarios
  async initializeContent() {
    await this.createKyuuContent();
    await this.createShimiContent();
    await this.createDreymiContent();
    await this.createUniversalContent();
  }

  private async createKyuuContent() {
    const kyuuBlocks: Omit<ContentBlock, 'id'>[] = [
      {
        label: "Flowing Waters Meditation",
        kind: "training",
        weight: 100,
        primaryTag: "rest",
        characterRestriction: "kyuu",
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 1,
        maxDay: 14,
        preFlair: null,
        postFlair: "You sit by a gentle stream, letting the water's rhythm guide your breathing. The flowing energy strengthens your body and mind, preparing you for greater challenges ahead.",
        statGains: { sta: 4, wil: 3 },
        coinGain: 50,
        setFlags: [],
        unsetFlags: [],
        grantItems: [],
        removeItems: [],
        openShop: false,
        injuryRisk: 0,
        healInjuries: false,
        seasonId: "2025S1",
      },
      {
        label: "Tidal Surge Training",
        kind: "training",
        weight: 80,
        primaryTag: "power",
        characterRestriction: "kyuu",
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 1,
        maxDay: 14,
        preFlair: null,
        postFlair: "You channel the power of rushing tides, feeling raw strength flow through your essence. Your magical attunement deepens as you learn to control the surging energies.",
        statGains: { mag: 5, wit: 3, str: 2 },
        coinGain: 75,
        setFlags: [],
        unsetFlags: [],
        grantItems: [],
        removeItems: [],
        openShop: false,
        injuryRisk: 5,
        healInjuries: false,
        seasonId: "2025S1",
      },
      {
        label: "Mysterious Pool Discovery",
        kind: "event",
        weight: 30,
        primaryTag: "risk",
        characterRestriction: "kyuu",
        requiresFlags: [],
        excludesFlags: ["pool_blessed"],
        requiresItems: [],
        minDay: 3,
        maxDay: 12,
        preFlair: "You discover a shimmering pool deep in the forest. Ancient runes glow around its edge, and the water seems to call to your very essence. The air thrums with mystical energy.",
        postFlair: "The mystical waters surge through you, awakening dormant potential. Your magical essence expands dramatically, and you feel a profound connection to ancient powers.",
        statGains: { mag: 8, wit: 5, luk: 3 },
        coinGain: 200,
        setFlags: ["pool_blessed"],
        unsetFlags: [],
        grantItems: ["essence_crystal"],
        removeItems: [],
        openShop: false,
        injuryRisk: 15,
        healInjuries: false,
        seasonId: "2025S1",
      },
      {
        label: "Regenerative Rest",
        kind: "training",
        weight: 90,
        primaryTag: "healing",
        characterRestriction: "kyuu",
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 1,
        maxDay: 14,
        preFlair: null,
        postFlair: "You focus on your natural regenerative abilities, feeling your body mend and strengthen. The healing energy suffuses every cell, enhancing your endurance.",
        statGains: { sta: 6, wil: 2 },
        coinGain: 40,
        setFlags: [],
        unsetFlags: [],
        grantItems: [],
        removeItems: [],
        openShop: false,
        injuryRisk: 0,
        healInjuries: true,
        seasonId: "2025S1",
      }
    ];

    for (const block of kyuuBlocks) {
      // Check if block already exists
      const existing = await storage.getContentBlocks();
      if (!existing.find(b => b.label === block.label && b.characterRestriction === block.characterRestriction)) {
        await this.createContentBlock(block);
      }
    }
  }

  private async createShimiContent() {
    const shimiBlocks: Omit<ContentBlock, 'id'>[] = [
      {
        label: "Lightning Speed Drills",
        kind: "training",
        weight: 100,
        primaryTag: "speed",
        characterRestriction: "shimi",
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 1,
        maxDay: 14,
        preFlair: null,
        postFlair: "Electric energy crackles around you as you push your speed to new limits. Your movements become fluid lightning, nearly impossible to track or counter.",
        statGains: { agi: 5, wit: 3 },
        coinGain: 60,
        setFlags: [],
        unsetFlags: [],
        grantItems: [],
        removeItems: [],
        openShop: false,
        injuryRisk: 0,
        healInjuries: false,
        seasonId: "2025S1",
      },
      {
        label: "Transformation Focus",
        kind: "training",
        weight: 90,
        primaryTag: "control",
        characterRestriction: "shimi",
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 1,
        maxDay: 14,
        preFlair: null,
        postFlair: "You practice the delicate art of transformation, learning to bend reality itself. Your control over magical energies strengthens as you master the complex techniques.",
        statGains: { mag: 4, wit: 4, wil: 2 },
        coinGain: 70,
        setFlags: [],
        unsetFlags: [],
        grantItems: [],
        removeItems: [],
        openShop: false,
        injuryRisk: 0,
        healInjuries: false,
        seasonId: "2025S1",
      },
      {
        label: "Electrical Storm Encounter",
        kind: "event",
        weight: 25,
        primaryTag: "power",
        characterRestriction: "shimi",
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 5,
        maxDay: 12,
        preFlair: "A violent electrical storm erupts overhead. Lightning strikes all around you, and you feel an irresistible urge to embrace the raw power coursing through the air.",
        postFlair: "You dance with the lightning itself, absorbing its chaotic energy. The storm's power becomes yours, dramatically enhancing your speed and magical prowess.",
        statGains: { agi: 7, mag: 6, luk: 4 },
        coinGain: 150,
        setFlags: ["storm_touched"],
        unsetFlags: [],
        grantItems: ["lightning_essence"],
        removeItems: [],
        openShop: false,
        injuryRisk: 20,
        healInjuries: false,
        seasonId: "2025S1",
      }
    ];

    for (const block of shimiBlocks) {
      const existing = await storage.getContentBlocks();
      if (!existing.find(b => b.label === block.label && b.characterRestriction === block.characterRestriction)) {
        await this.createContentBlock(block);
      }
    }
  }

  private async createDreymiContent() {
    const dreymiBlocks: Omit<ContentBlock, 'id'>[] = [
      {
        label: "Charm Practice",
        kind: "training",
        weight: 100,
        primaryTag: "social",
        characterRestriction: "dreymi",
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 1,
        maxDay: 14,
        preFlair: null,
        postFlair: "You practice the subtle arts of charm and persuasion, learning to weave enchantments with mere words and gestures. Your charismatic presence grows more compelling.",
        statGains: { cha: 5, wil: 3 },
        coinGain: 55,
        setFlags: [],
        unsetFlags: [],
        grantItems: [],
        removeItems: [],
        openShop: false,
        injuryRisk: 0,
        healInjuries: false,
        seasonId: "2025S1",
      },
      {
        label: "Dream Walking",
        kind: "training",
        weight: 80,
        primaryTag: "magic",
        characterRestriction: "dreymi",
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 1,
        maxDay: 14,
        preFlair: null,
        postFlair: "You venture into the realm of dreams and subconscious thoughts, learning to navigate the ethereal landscape. Your magical understanding deepens.",
        statGains: { mag: 4, wit: 3, cha: 2 },
        coinGain: 65,
        setFlags: [],
        unsetFlags: [],
        grantItems: [],
        removeItems: [],
        openShop: false,
        injuryRisk: 0,
        healInjuries: false,
        seasonId: "2025S1",
      },
      {
        label: "Enchanted Garden Discovery",
        kind: "event",
        weight: 35,
        primaryTag: "charm",
        characterRestriction: "dreymi",
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 4,
        maxDay: 10,
        preFlair: "You stumble upon a hidden garden where flowers sing and butterflies whisper secrets. The very air shimmers with enchantment, calling to your charming nature.",
        postFlair: "The enchanted garden recognizes your kindred spirit, blessing you with its magical essence. Your charm becomes irresistible, and your magical power grows.",
        statGains: { cha: 8, mag: 5, wil: 3 },
        coinGain: 180,
        setFlags: ["garden_blessed"],
        unsetFlags: [],
        grantItems: ["charm_crystal"],
        removeItems: [],
        openShop: false,
        injuryRisk: 5,
        healInjuries: false,
        seasonId: "2025S1",
      }
    ];

    for (const block of dreymiBlocks) {
      const existing = await storage.getContentBlocks();
      if (!existing.find(b => b.label === block.label && b.characterRestriction === block.characterRestriction)) {
        await this.createContentBlock(block);
      }
    }
  }

  private async createUniversalContent() {
    const universalBlocks: Omit<ContentBlock, 'id'>[] = [
      {
        label: "Visit the Spirit Merchant",
        kind: "training",
        weight: 70,
        primaryTag: "shop",
        characterRestriction: null,
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 2,
        maxDay: 14,
        preFlair: null,
        postFlair: "The wandering merchant shares tales of distant lands and ancient artifacts, sharpening your wits while showing you rare wares from across the realms.",
        statGains: { wit: 2 },
        coinGain: 75,
        setFlags: [],
        unsetFlags: [],
        grantItems: [],
        removeItems: [],
        openShop: true,
        injuryRisk: 0,
        healInjuries: false,
        seasonId: "2025S1",
      },
      {
        label: "Physical Conditioning",
        kind: "training",
        weight: 85,
        primaryTag: "strength",
        characterRestriction: null,
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 1,
        maxDay: 14,
        preFlair: null,
        postFlair: "Through rigorous physical training, you build muscle and improve your coordination. Your body becomes a more capable vessel for your growing power.",
        statGains: { str: 4, agi: 2 },
        coinGain: 45,
        setFlags: [],
        unsetFlags: [],
        grantItems: [],
        removeItems: [],
        openShop: false,
        injuryRisk: 0,
        healInjuries: false,
        seasonId: "2025S1",
      },
      {
        label: "Meditation and Focus",
        kind: "training",
        weight: 80,
        primaryTag: "mental",
        characterRestriction: null,
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 1,
        maxDay: 14,
        preFlair: null,
        postFlair: "Deep meditation clears your mind and strengthens your resolve. You feel more centered and capable of withstanding mental challenges.",
        statGains: { wil: 4, wit: 2 },
        coinGain: 40,
        setFlags: [],
        unsetFlags: [],
        grantItems: [],
        removeItems: [],
        openShop: false,
        injuryRisk: 0,
        healInjuries: false,
        seasonId: "2025S1",
      },
      {
        label: "Ancient Ruins Exploration",
        kind: "event",
        weight: 40,
        primaryTag: "discovery",
        characterRestriction: null,
        requiresFlags: [],
        excludesFlags: ["ruins_explored"],
        requiresItems: [],
        minDay: 6,
        maxDay: 13,
        preFlair: "You discover ancient ruins partially buried in the earth. Strange symbols glow faintly on weathered stones, and you sense powerful magic emanating from within.",
        postFlair: "The ruins reveal their secrets to you, ancient knowledge flowing into your mind. You emerge with greater understanding and a valuable artifact.",
        statGains: { wit: 6, mag: 4, luk: 5 },
        coinGain: 250,
        setFlags: ["ruins_explored"],
        unsetFlags: [],
        grantItems: ["ancient_relic"],
        removeItems: [],
        openShop: false,
        injuryRisk: 12,
        healInjuries: false,
        seasonId: "2025S1",
      },
      {
        label: "Dangerous Beast Encounter",
        kind: "event",
        weight: 20,
        primaryTag: "combat",
        characterRestriction: null,
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 3,
        maxDay: 12,
        preFlair: "A massive, scarred beast blocks your path, its eyes glowing with malevolent intelligence. You must fight or flee, but either choice will test your limits.",
        postFlair: "The battle was fierce, but you emerge victorious and stronger. The beast's defeat proves your growing power, though the wounds will take time to heal.",
        statGains: { str: 8, agi: 6, sta: 4 },
        coinGain: 300,
        setFlags: ["beast_slayer"],
        unsetFlags: [],
        grantItems: ["beast_fang"],
        removeItems: [],
        openShop: false,
        injuryRisk: 30,
        healInjuries: false,
        seasonId: "2025S1",
      }
    ];

    for (const block of universalBlocks) {
      const existing = await storage.getContentBlocks();
      if (!existing.find(b => b.label === block.label && b.characterRestriction === block.characterRestriction)) {
        await this.createContentBlock(block);
      }
    }
  }

  private async createContentBlock(block: Omit<ContentBlock, 'id'>) {
    const id = `${block.kind}_${block.label.toLowerCase().replace(/\s+/g, '_')}`;
    const contentBlock: ContentBlock = { ...block, id };
    
    // In a real implementation, this would persist to the database
    // For now, the MemStorage will handle it
    console.log(`Created content block: ${contentBlock.id}`);
  }

  // Get weighted random selection of content blocks
  async getTrainingOptions(character: CharacterInstance, day: number, lastTag?: string): Promise<ContentBlock[]> {
    const baseChar = await storage.getBaseCharacter(character.baseCharacterId);
    if (!baseChar) throw new Error("Base character not found");

    const availableBlocks = await storage.getContentBlocks(baseChar.id, day);
    
    // Filter by requirements
    const eligibleBlocks = availableBlocks.filter(block => {
      // Check flag requirements
      if (block.requiresFlags.length > 0 && !block.requiresFlags.every(flag => character.flags.includes(flag))) {
        return false;
      }
      if (block.excludesFlags.length > 0 && block.excludesFlags.some(flag => character.flags.includes(flag))) {
        return false;
      }
      // Check item requirements
      if (block.requiresItems.length > 0 && !block.requiresItems.every(item => character.items.includes(item))) {
        return false;
      }
      return true;
    });

    if (eligibleBlocks.length === 0) {
      return [];
    }

    // Separate events from regular training
    const events = eligibleBlocks.filter(block => block.kind === "event");
    const regularTraining = eligibleBlocks.filter(block => block.kind === "training");

    // Determine event count based on pity and probability
    let eventCount = 0;
    const session = await storage.getTrainingSession(character.userId);
    const pityCounter = session?.eventPityCounter || 0;

    if (pityCounter >= 5) {
      eventCount = 1; // Pity: guarantee at least 1 event
    } else {
      const roll = Math.random() * 100;
      if (roll < 70) eventCount = 0;
      else if (roll < 95) eventCount = 1;
      else eventCount = 2;
    }

    const selectedOptions: ContentBlock[] = [];

    // Add events first
    if (eventCount > 0 && events.length > 0) {
      const weightedEvents = this.weightedRandomSelection(events, Math.min(eventCount, events.length));
      selectedOptions.push(...weightedEvents);
    }

    // Fill remaining slots with regular training
    const remainingSlots = 3 - selectedOptions.length;
    if (remainingSlots > 0 && regularTraining.length > 0) {
      // Avoid repeating same primary tag
      let availableTraining = regularTraining;
      if (lastTag) {
        availableTraining = regularTraining.filter(block => block.primaryTag !== lastTag);
        if (availableTraining.length === 0) {
          availableTraining = regularTraining; // fallback
        }
      }

      const weightedTraining = this.weightedRandomSelection(availableTraining, Math.min(remainingSlots, availableTraining.length));
      selectedOptions.push(...weightedTraining);
    }

    return selectedOptions.slice(0, 3);
  }

  private weightedRandomSelection(blocks: ContentBlock[], count: number): ContentBlock[] {
    if (blocks.length <= count) return blocks;

    const totalWeight = blocks.reduce((sum, block) => sum + block.weight, 0);
    const selected: ContentBlock[] = [];
    const remaining = [...blocks];

    for (let i = 0; i < count && remaining.length > 0; i++) {
      const roll = Math.random() * remaining.reduce((sum, block) => sum + block.weight, 0);
      let currentWeight = 0;
      
      for (let j = 0; j < remaining.length; j++) {
        currentWeight += remaining[j].weight;
        if (roll <= currentWeight) {
          selected.push(remaining[j]);
          remaining.splice(j, 1);
          break;
        }
      }
    }

    return selected;
  }
}

export const contentSystem = new ContentSystem();
