import { storage } from "./storage";
import { type CharacterInstance, type CharacterStats } from "@shared/schema";

interface PvPSnapshot {
  character: CharacterInstance;
  baseChar: any;
  workingStats: CharacterStats;
  hp: number;
  maxHp: number;
  effects: string[];
  statusEffects: any[];
}

interface BattleStep {
  type: string;
  description: string;
  values?: any;
}

export class PvPEngine {
  async simulateBattle(challengerId: string, opponentId: string, challengerCharId: string, opponentCharId: string): Promise<any> {
    // Get characters and create working snapshots
    const challengerChar = await storage.getCharacterInstance(challengerCharId);
    const opponentChar = await storage.getCharacterInstance(opponentCharId);
    
    if (!challengerChar || !opponentChar) {
      throw new Error("Characters not found");
    }

    const challengerBase = await storage.getBaseCharacter(challengerChar.baseCharacterId);
    const opponentBase = await storage.getBaseCharacter(opponentChar.baseCharacterId);

    if (!challengerBase || !opponentBase) {
      throw new Error("Base characters not found");
    }

    // Create battle snapshots with item effects applied
    const challenger: PvPSnapshot = {
      character: challengerChar,
      baseChar: challengerBase,
      workingStats: this.applyItemEffects({ ...challengerChar.currentStats }, challengerChar.items),
      hp: challengerChar.currentStats.sta,
      maxHp: challengerChar.currentStats.sta,
      effects: [...challengerChar.items],
      statusEffects: [],
    };

    const opponent: PvPSnapshot = {
      character: opponentChar,
      baseChar: opponentBase,
      workingStats: this.applyItemEffects({ ...opponentChar.currentStats }, opponentChar.items),
      hp: opponentChar.currentStats.sta,
      maxHp: opponentChar.currentStats.sta,
      effects: [...opponentChar.items],
      statusEffects: [],
    };

    const battleLog: BattleStep[] = [];
    let winner: string | null = null;
    let rounds = 0;
    const maxRounds = 10;

    // Initiative Check
    const initiativeResult = this.resolveOpposedCheck(
      challenger.workingStats.agi,
      opponent.workingStats.agi,
      "Initiative"
    );
    
    let firstActor = initiativeResult.success ? challenger : opponent;
    let secondActor = initiativeResult.success ? opponent : challenger;

    battleLog.push({
      type: "initiative",
      description: `${firstActor.character.baseCharacterId} gains initiative`,
      values: initiativeResult
    });

    // Main battle loop
    while (winner === null && rounds < maxRounds) {
      rounds++;
      
      // Apply regeneration effects
      if (firstActor.baseChar.signatureAbility === "regeneration_seal_gated") {
        const regenAmount = Math.floor(firstActor.maxHp * 0.1);
        firstActor.hp = Math.min(firstActor.maxHp, firstActor.hp + regenAmount);
        battleLog.push({
          type: "regeneration",
          description: `${firstActor.baseChar.name} regenerates ${regenAmount} HP`,
          values: { amount: regenAmount, newHp: firstActor.hp }
        });
      }

      if (secondActor.baseChar.signatureAbility === "regeneration_seal_gated") {
        const regenAmount = Math.floor(secondActor.maxHp * 0.1);
        secondActor.hp = Math.min(secondActor.maxHp, secondActor.hp + regenAmount);
        battleLog.push({
          type: "regeneration",
          description: `${secondActor.baseChar.name} regenerates ${regenAmount} HP`,
          values: { amount: regenAmount, newHp: secondActor.hp }
        });
      }

      // First actor's turn
      const firstActionResult = this.executeAbility(firstActor, secondActor, battleLog);
      if (firstActionResult.winner) {
        winner = firstActionResult.winner;
        break;
      }

      // Check for KO
      if (secondActor.hp <= 0) {
        // Special handling for regenerative characters
        if (secondActor.baseChar.signatureAbility === "regeneration_seal_gated") {
          const sealResult = this.attemptSeal(firstActor, secondActor);
          battleLog.push({
            type: "seal_attempt",
            description: sealResult.description,
            values: sealResult
          });
          
          if (sealResult.success) {
            winner = firstActor === challenger ? challengerId : opponentId;
            battleLog.push({
              type: "victory",
              description: `${firstActor.baseChar.name} successfully seals ${secondActor.baseChar.name}`,
            });
          } else {
            // Regeneration saves from KO
            secondActor.hp = Math.floor(secondActor.maxHp * 0.3);
            battleLog.push({
              type: "regeneration_save",
              description: `${secondActor.baseChar.name}'s regeneration prevents defeat`,
              values: { newHp: secondActor.hp }
            });
          }
        } else {
          winner = firstActor === challenger ? challengerId : opponentId;
          battleLog.push({
            type: "ko",
            description: `${secondActor.baseChar.name} is defeated`,
          });
        }
      }

      if (winner) break;

      // Second actor's turn
      const secondActionResult = this.executeAbility(secondActor, firstActor, battleLog);
      if (secondActionResult.winner) {
        winner = secondActionResult.winner === firstActor.character.userId ? challengerId : opponentId;
        break;
      }

      // Check for KO
      if (firstActor.hp <= 0) {
        if (firstActor.baseChar.signatureAbility === "regeneration_seal_gated") {
          const sealResult = this.attemptSeal(secondActor, firstActor);
          battleLog.push({
            type: "seal_attempt",
            description: sealResult.description,
            values: sealResult
          });
          
          if (sealResult.success) {
            winner = secondActor === challenger ? challengerId : opponentId;
            battleLog.push({
              type: "victory",
              description: `${secondActor.baseChar.name} successfully seals ${firstActor.baseChar.name}`,
            });
          } else {
            firstActor.hp = Math.floor(firstActor.maxHp * 0.3);
            battleLog.push({
              type: "regeneration_save",
              description: `${firstActor.baseChar.name}'s regeneration prevents defeat`,
              values: { newHp: firstActor.hp }
            });
          }
        } else {
          winner = secondActor === challenger ? challengerId : opponentId;
          battleLog.push({
            type: "ko", 
            description: `${firstActor.baseChar.name} is defeated`,
          });
        }
      }
    }

    // Handle draw
    if (winner === null) {
      battleLog.push({
        type: "draw",
        description: "Battle ends in a draw after maximum rounds",
      });
    }

    // Generate narrative
    const narration = this.generateNarration(battleLog, challenger, opponent);

    // Save match
    const match = await storage.createPvpMatch({
      challenger: challengerId,
      opponent: opponentId,
      challengerCharacter: challengerCharId,
      opponentCharacter: opponentCharId,
      winner,
      battleLog,
      narration,
    });

    return {
      match,
      winner,
      battleLog,
      narration,
      challenger: challenger.character,
      opponent: opponent.character,
    };
  }

  private applyItemEffects(stats: CharacterStats, items: string[]): CharacterStats {
    const modifiedStats = { ...stats };
    
    // Apply item bonuses (simplified)
    items.forEach(itemId => {
      if (itemId === "sealing_threads") {
        // +10pp to Will for seal resistance
        modifiedStats.wil += Math.floor(modifiedStats.wil * 0.1);
      }
      // Add more item effects as needed
    });

    return modifiedStats;
  }

  private resolveOpposedCheck(stat1: number, stat2: number, checkType: string) {
    const total = stat1 + stat2;
    const chance1 = stat1 / total;
    const roll = Math.random();
    
    return {
      success: roll < chance1,
      chance: Math.floor(chance1 * 100),
      roll: Math.floor(roll * 100),
      stat1,
      stat2,
      type: checkType
    };
  }

  private executeAbility(attacker: PvPSnapshot, defender: PvPSnapshot, battleLog: BattleStep[]): { winner?: string } {
    switch (attacker.baseChar.signatureAbility) {
      case "transform_multi_gate":
        return this.executeTransform(attacker, defender, battleLog);
      case "charm_drain_snowball":
        return this.executeCharmDrain(attacker, defender, battleLog);
      case "regeneration_seal_gated":
      default:
        return this.executeBasicAttack(attacker, defender, battleLog);
    }
  }

  private executeTransform(attacker: PvPSnapshot, defender: PvPSnapshot, battleLog: BattleStep[]): { winner?: string } {
    // Multi-gate transform sequence: Approach -> Grapple -> Overwrite -> Anti-flinch -> Will
    
    // Gate 1: Approach (Agi+Wit)
    const approachCheck = this.resolveOpposedCheck(
      attacker.workingStats.agi + attacker.workingStats.wit,
      defender.workingStats.agi + defender.workingStats.wit,
      "Transform Approach"
    );
    
    battleLog.push({
      type: "transform_gate",
      description: `${attacker.baseChar.name} attempts transformation approach`,
      values: approachCheck
    });

    if (!approachCheck.success) {
      // Failed approach, fall back to basic attack
      return this.executeBasicAttack(attacker, defender, battleLog);
    }

    // Gate 2: Grapple (Str+Agi)
    const grappleCheck = this.resolveOpposedCheck(
      attacker.workingStats.str + attacker.workingStats.agi,
      defender.workingStats.str + defender.workingStats.agi,
      "Transform Grapple"
    );

    battleLog.push({
      type: "transform_gate",
      description: `${attacker.baseChar.name} attempts to grapple for transformation`,
      values: grappleCheck
    });

    if (!grappleCheck.success) {
      return this.executeBasicAttack(attacker, defender, battleLog);
    }

    // Gate 3: Overwrite (Wit+Mag)
    const overwriteCheck = this.resolveOpposedCheck(
      attacker.workingStats.wit + attacker.workingStats.mag,
      defender.workingStats.wit + defender.workingStats.mag,
      "Transform Overwrite"
    );

    battleLog.push({
      type: "transform_gate",
      description: `${attacker.baseChar.name} begins transformation overwrite`,
      values: overwriteCheck
    });

    if (!overwriteCheck.success) {
      return this.executeBasicAttack(attacker, defender, battleLog);
    }

    // Gate 4: Anti-flinch (foe Agi vs Shimi Agi)
    const flinchCheck = this.resolveOpposedCheck(
      attacker.workingStats.agi,
      defender.workingStats.agi,
      "Anti-flinch"
    );

    battleLog.push({
      type: "transform_gate",
      description: `${defender.baseChar.name} attempts to flinch away from transformation`,
      values: { ...flinchCheck, success: !flinchCheck.success } // Invert for defender
    });

    if (flinchCheck.success) {
      // Defender flinched away
      return this.executeBasicAttack(attacker, defender, battleLog);
    }

    // Gate 5: Final Will check (Wil+Wit vs Wil+Wit)
    let defenderWill = defender.workingStats.wil + defender.workingStats.wit;
    
    // Apply sealing thread bonus if defender has it
    if (defender.effects.includes("sealing_threads")) {
      defenderWill += Math.floor(defenderWill * 0.15); // +15% bonus
      battleLog.push({
        type: "item_effect",
        description: `${defender.baseChar.name}'s Sealing Threads provide Will resistance`,
      });
    }

    const willCheck = this.resolveOpposedCheck(
      attacker.workingStats.wil + attacker.workingStats.wit,
      defenderWill,
      "Transform Will"
    );

    battleLog.push({
      type: "transform_gate",
      description: `${attacker.baseChar.name} attempts final transformation override`,
      values: willCheck
    });

    if (willCheck.success) {
      battleLog.push({
        type: "signature_victory",
        description: `${attacker.baseChar.name} successfully transforms ${defender.baseChar.name}`,
      });
      return { winner: attacker.character.userId };
    }

    // All gates passed but final will failed - continue fight
    return this.executeBasicAttack(attacker, defender, battleLog);
  }

  private executeCharmDrain(attacker: PvPSnapshot, defender: PvPSnapshot, battleLog: BattleStep[]): { winner?: string } {
    // Charm check (Cha vs Wil)
    const charmCheck = this.resolveOpposedCheck(
      attacker.workingStats.cha,
      defender.workingStats.wil,
      "Charm"
    );

    battleLog.push({
      type: "charm_attempt",
      description: `${attacker.baseChar.name} attempts to charm ${defender.baseChar.name}`,
      values: charmCheck
    });

    if (charmCheck.success) {
      // Apply charm debuff and drain
      const drainAmount = Math.floor(attacker.workingStats.cha * 0.1);
      defender.hp -= drainAmount;
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + Math.floor(drainAmount * 0.5));

      // Track charm stacks (simplified)
      let charmStacks = attacker.statusEffects.filter(e => e.type === "charm").length + 1;
      attacker.statusEffects.push({ type: "charm", target: defender.character.id });

      battleLog.push({
        type: "charm_drain",
        description: `Charm drains ${drainAmount} HP and heals ${attacker.baseChar.name}`,
        values: { damage: drainAmount, heal: Math.floor(drainAmount * 0.5), stacks: charmStacks }
      });

      // Check for domination (simplified: 3+ charm stacks)
      if (charmStacks >= 3) {
        const lockCheck = this.resolveOpposedCheck(
          attacker.workingStats.wit,
          defender.workingStats.wil,
          "Domination Lock"
        );

        battleLog.push({
          type: "domination_attempt",
          description: `${attacker.baseChar.name} attempts to dominate ${defender.baseChar.name}`,
          values: lockCheck
        });

        if (lockCheck.success) {
          battleLog.push({
            type: "signature_victory",
            description: `${attacker.baseChar.name} dominates ${defender.baseChar.name} completely`,
          });
          return { winner: attacker.character.userId };
        }
      }
    }

    // Continue with basic attack
    return this.executeBasicAttack(attacker, defender, battleLog);
  }

  private executeBasicAttack(attacker: PvPSnapshot, defender: PvPSnapshot, battleLog: BattleStep[]): { winner?: string } {
    // Basic damage exchange (Str/Mag vs Agi/Sta)
    const attackStat = Math.max(attacker.workingStats.str, attacker.workingStats.mag);
    const defenseStat = Math.max(defender.workingStats.agi, defender.workingStats.sta);
    
    const damageCheck = this.resolveOpposedCheck(attackStat, defenseStat, "Attack");
    
    let damage = 0;
    if (damageCheck.success) {
      // Calculate damage (capped to prevent one-shots)
      damage = Math.min(
        Math.floor(defender.maxHp * 0.3), // Cap at 30% of max HP
        Math.floor(attackStat * 0.15) // Base damage
      );
      defender.hp -= damage;
    }

    battleLog.push({
      type: "basic_attack",
      description: `${attacker.baseChar.name} attacks for ${damage} damage`,
      values: { ...damageCheck, damage }
    });

    return {};
  }

  private attemptSeal(attacker: PvPSnapshot, target: PvPSnapshot) {
    // Seal check (Wit+Mag vs Wit+Wil)
    let attackerSeal = attacker.workingStats.wit + attacker.workingStats.mag;
    
    // Apply sealing thread bonus if attacker has it
    if (attacker.effects.includes("sealing_threads")) {
      attackerSeal += Math.floor(attackerSeal * 0.15);
    }

    const sealCheck = this.resolveOpposedCheck(
      attackerSeal,
      target.workingStats.wit + target.workingStats.wil,
      "Seal"
    );

    return {
      ...sealCheck,
      description: `${attacker.baseChar.name} attempts to seal ${target.baseChar.name}'s regeneration`,
    };
  }

  private generateNarration(battleLog: BattleStep[], challenger: PvPSnapshot, opponent: PvPSnapshot): string {
    const lines: string[] = [];
    
    lines.push(`**Battle Chronicle: ${challenger.baseChar.name} vs ${opponent.baseChar.name}**\n`);
    
    for (const step of battleLog) {
      switch (step.type) {
        case "initiative":
          lines.push(`🎯 **Initiative:** ${step.description} (${step.values.stat1} vs ${step.values.stat2})`);
          break;
        case "transform_gate":
          lines.push(`⚡ **${step.values.type}:** ${step.description} - ${step.values.success ? 'SUCCESS' : 'FAILED'} (${step.values.chance}%)`);
          break;
        case "charm_attempt":
          lines.push(`💖 **Charm:** ${step.description} - ${step.values.success ? 'SUCCESS' : 'FAILED'} (${step.values.chance}%)`);
          break;
        case "charm_drain":
          lines.push(`🩸 **Drain:** ${step.description}`);
          break;
        case "seal_attempt":
          lines.push(`🔒 **Seal:** ${step.description} - ${step.values.success ? 'SUCCESS' : 'FAILED'} (${step.values.chance}%)`);
          break;
        case "basic_attack":
          lines.push(`⚔️ **Attack:** ${step.description} (${step.values.chance}%)`);
          break;
        case "regeneration":
          lines.push(`💚 **Regeneration:** ${step.description}`);
          break;
        case "signature_victory":
          lines.push(`👑 **Victory:** ${step.description}`);
          break;
        case "ko":
          lines.push(`💀 **KO:** ${step.description}`);
          break;
        case "draw":
          lines.push(`🤝 **Draw:** ${step.description}`);
          break;
      }
    }

    return lines.join('\n');
  }
}

export const pvpEngine = new PvPEngine();
