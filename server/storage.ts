import { type User, type InsertUser, type CharacterInstance, type BaseCharacter, type ContentBlock, type TrainingSession, type Item, type PvpMatch, type CharacterStats } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Characters
  getBaseCharacters(): Promise<BaseCharacter[]>;
  getBaseCharacter(id: string): Promise<BaseCharacter | undefined>;
  getCharacterInstance(id: string): Promise<CharacterInstance | undefined>;
  getUserCharacters(userId: string, status?: string): Promise<CharacterInstance[]>;
  createCharacterInstance(character: Omit<CharacterInstance, 'id' | 'createdAt'>): Promise<CharacterInstance>;
  updateCharacterInstance(id: string, updates: Partial<CharacterInstance>): Promise<CharacterInstance | undefined>;
  getUserActivePvPCharacter(userId: string): Promise<CharacterInstance | undefined>;

  // Content & Training
  getContentBlock(id: string): Promise<ContentBlock | undefined>;
  getContentBlocks(characterId?: string, day?: number): Promise<ContentBlock[]>;
  getTrainingSession(userId: string): Promise<TrainingSession | undefined>;
  createTrainingSession(session: Omit<TrainingSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrainingSession>;
  updateTrainingSession(id: string, updates: Partial<TrainingSession>): Promise<TrainingSession | undefined>;
  deleteTrainingSession(id: string): Promise<void>;

  // Items & Shop
  getItems(): Promise<Item[]>;
  getItem(id: string): Promise<Item | undefined>;

  // PvP
  createPvpMatch(match: Omit<PvpMatch, 'id' | 'createdAt'>): Promise<PvpMatch>;
  getUserPvpMatches(userId: string, limit?: number): Promise<PvpMatch[]>;

  // Character of the Day
  getCharacterOfTheDay(date: string): Promise<string | undefined>;
  setCharacterOfTheDay(date: string, characterId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private baseCharacters: Map<string, BaseCharacter> = new Map();
  private characterInstances: Map<string, CharacterInstance> = new Map();
  private contentBlocks: Map<string, ContentBlock> = new Map();
  private trainingSessions: Map<string, TrainingSession> = new Map();
  private items: Map<string, Item> = new Map();
  private pvpMatches: Map<string, PvpMatch> = new Map();
  private cotdMap: Map<string, string> = new Map(); // date -> characterId

  constructor() {
    this.initializeBaseData();
  }

  private initializeBaseData() {
    // Initialize base characters - updated from kyuukei.com
    const kyuu: BaseCharacter = {
      id: "kyuu",
      name: "Kyuu",
      description: "Slime girl with orb control, regeneration and effective immortality",
      baseStats: { str: 150, agi: 250, sta: 400, mag: 180, wit: 220, wil: 350, cha: 200, luk: 450 },
      signatureAbility: "orb_regeneration",
      growthWeights: { str: 1.0, agi: 1.2, sta: 1.6, mag: 1.1, wit: 1.2, wil: 1.4, cha: 1.1, luk: 1.5 },
      canShop: true,
    };

    const shimi: BaseCharacter = {
      id: "shimi", 
      name: "Shimi",
      description: "Lightning-fast transformation specialist",
      baseStats: { str: 200, agi: 350, sta: 200, mag: 180, wit: 280, wil: 250, cha: 120, luk: 300 },
      signatureAbility: "transform_multi_gate",
      growthWeights: { str: 1.3, agi: 1.5, sta: 1.0, mag: 1.1, wit: 1.4, wil: 1.1, cha: 0.9, luk: 1.2 },
      canShop: true,
    };

    const dreymi: BaseCharacter = {
      id: "dreymi",
      name: "Dreymi", 
      description: "Vampire-succubus hybrid with hypnotic eyes and charm abilities",
      baseStats: { str: 180, agi: 220, sta: 280, mag: 320, wit: 240, wil: 300, cha: 480, luk: 320 },
      signatureAbility: "vampire_succubus_hybrid",
      growthWeights: { str: 1.1, agi: 1.2, sta: 1.3, mag: 1.4, wit: 1.2, wil: 1.3, cha: 1.6, luk: 1.3 },
      canShop: true,
    };

    const via: BaseCharacter = {
      id: "via",
      name: "Via",
      description: "Fire magic research specialist with deep magical knowledge",
      baseStats: { str: 100, agi: 150, sta: 200, mag: 400, wit: 380, wil: 250, cha: 180, luk: 240 },
      signatureAbility: "fire_spirit_blessing",
      growthWeights: { str: 0.8, agi: 1.0, sta: 1.1, mag: 1.6, wit: 1.5, wil: 1.2, cha: 1.0, luk: 1.1 },
      canShop: true,
    };

    const pon: BaseCharacter = {
      id: "pon",
      name: "Pon",
      description: "Elite cat demi-human assassin with Copy-Cat ability theft",
      baseStats: { str: 280, agi: 420, sta: 250, mag: 150, wit: 320, wil: 280, cha: 120, luk: 300 },
      signatureAbility: "copy_cat_steal",
      growthWeights: { str: 1.4, agi: 1.6, sta: 1.2, mag: 0.9, wit: 1.4, wil: 1.3, cha: 0.8, luk: 1.3 },
      canShop: true,
    };

    const elaine: BaseCharacter = {
      id: "elaine",
      name: "Elaine Sternbruch",
      description: "Space magic prodigy specializing in star creation and gravity manipulation",
      baseStats: { str: 120, agi: 180, sta: 200, mag: 450, wit: 400, wil: 320, cha: 220, luk: 280 },
      signatureAbility: "stellar_gravity_control",
      growthWeights: { str: 0.9, agi: 1.1, sta: 1.0, mag: 1.7, wit: 1.6, wil: 1.4, cha: 1.1, luk: 1.2 },
      canShop: true,
    };

    const kaji: BaseCharacter = {
      id: "kaji",
      name: "Kaji",
      description: "Ancient dragon researcher obsessed with knowledge and physics",
      baseStats: { str: 380, agi: 200, sta: 350, mag: 320, wit: 450, wil: 400, cha: 150, luk: 250 },
      signatureAbility: "dragon_knowledge_seeker",
      growthWeights: { str: 1.5, agi: 1.0, sta: 1.4, mag: 1.4, wit: 1.7, wil: 1.5, cha: 0.8, luk: 1.1 },
      canShop: true,
    };

    const yura: BaseCharacter = {
      id: "yura",
      name: "Yura Saite",
      description: "Reclusive thread magic specialist controlling dolls and objects",
      baseStats: { str: 100, agi: 160, sta: 180, mag: 380, wit: 350, wil: 320, cha: 80, luk: 200 },
      signatureAbility: "thread_manipulation",
      growthWeights: { str: 0.8, agi: 1.0, sta: 0.9, mag: 1.6, wit: 1.5, wil: 1.4, cha: 0.6, luk: 1.0 },
      canShop: true,
    };

    const ryn: BaseCharacter = {
      id: "ryn",
      name: "Ryn",
      description: "Physical enhancement tank warrior and frontline protector",
      baseStats: { str: 480, agi: 280, sta: 450, mag: 200, wit: 220, wil: 380, cha: 180, luk: 220 },
      signatureAbility: "physical_enhancement_tank",
      growthWeights: { str: 1.8, agi: 1.3, sta: 1.7, mag: 1.0, wit: 1.1, wil: 1.5, cha: 0.9, luk: 1.1 },
      canShop: true,
    };

    const memo: BaseCharacter = {
      id: "memo",
      name: "Memo",
      description: "Ethereal fairy of pure mana with possession and memory theft",
      baseStats: { str: 50, agi: 300, sta: 120, mag: 500, wit: 420, wil: 450, cha: 350, luk: 380 },
      signatureAbility: "ethereal_possession",
      growthWeights: { str: 0.5, agi: 1.4, sta: 0.8, mag: 1.8, wit: 1.6, wil: 1.7, cha: 1.4, luk: 1.5 },
      canShop: true,
    };

    const shizu: BaseCharacter = {
      id: "shizu",
      name: "Shizu",
      description: "Water spirit blessed with limitless mana generation",
      baseStats: { str: 150, agi: 200, sta: 300, mag: 520, wit: 280, wil: 350, cha: 220, luk: 320 },
      signatureAbility: "limitless_water_mana",
      growthWeights: { str: 0.9, agi: 1.1, sta: 1.3, mag: 1.9, wit: 1.3, wil: 1.4, cha: 1.1, luk: 1.4 },
      canShop: true,
    };

    const mizue: BaseCharacter = {
      id: "mizue",
      name: "Mizue von Lichtspiel",
      description: "Eccentric academy headmaster with social manipulation and null magic",
      baseStats: { str: 120, agi: 180, sta: 220, mag: 350, wit: 450, wil: 320, cha: 480, luk: 300 },
      signatureAbility: "social_null_mastery",
      growthWeights: { str: 0.8, agi: 1.0, sta: 1.1, mag: 1.4, wit: 1.7, wil: 1.3, cha: 1.8, luk: 1.3 },
      canShop: true,
    };

    const lyn: BaseCharacter = {
      id: "lyn",
      name: "Lyn",
      description: "Non-magical merchant leader relying on enchanted equipment and trade expertise",
      baseStats: { str: 120, agi: 180, sta: 200, mag: 80, wit: 420, wil: 280, cha: 380, luk: 350 },
      signatureAbility: "merchant_equipment_mastery",
      growthWeights: { str: 0.9, agi: 1.1, sta: 1.0, mag: 0.6, wit: 1.6, wil: 1.2, cha: 1.5, luk: 1.4 },
      canShop: true,
    };

    const mika: BaseCharacter = {
      id: "mika",
      name: "Mika",
      description: "Future sight cat demi-human with enhanced durability from harsh training",
      baseStats: { str: 220, agi: 380, sta: 320, mag: 180, wit: 280, wil: 300, cha: 150, luk: 420 },
      signatureAbility: "future_sight_precognition",
      growthWeights: { str: 1.2, agi: 1.5, sta: 1.4, mag: 1.0, wit: 1.3, wil: 1.3, cha: 0.9, luk: 1.6 },
      canShop: true,
    };

    const sera: BaseCharacter = {
      id: "sera",
      name: "Sera",
      description: "Wind spirit bound spellblade with enhanced physicality",
      baseStats: { str: 350, agi: 400, sta: 320, mag: 380, wit: 280, wil: 350, cha: 200, luk: 280 },
      signatureAbility: "wind_spirit_spellblade",
      growthWeights: { str: 1.5, agi: 1.6, sta: 1.4, mag: 1.5, wit: 1.2, wil: 1.4, cha: 1.0, luk: 1.2 },
      canShop: true,
    };

    const ibuki: BaseCharacter = {
      id: "ibuki",
      name: "Ibuki Weitschall",
      description: "Academy announcer with mana mark communication network",
      baseStats: { str: 100, agi: 150, sta: 180, mag: 280, wit: 380, wil: 250, cha: 450, luk: 220 },
      signatureAbility: "mana_mark_communication",
      growthWeights: { str: 0.7, agi: 0.9, sta: 0.9, mag: 1.3, wit: 1.5, wil: 1.2, cha: 1.7, luk: 1.1 },
      canShop: true,
    };

    // Set all characters
    this.baseCharacters.set("kyuu", kyuu);
    this.baseCharacters.set("shimi", shimi);
    this.baseCharacters.set("dreymi", dreymi);
    this.baseCharacters.set("via", via);
    this.baseCharacters.set("pon", pon);
    this.baseCharacters.set("elaine", elaine);
    this.baseCharacters.set("kaji", kaji);
    this.baseCharacters.set("yura", yura);
    this.baseCharacters.set("ryn", ryn);
    this.baseCharacters.set("memo", memo);
    this.baseCharacters.set("shizu", shizu);
    this.baseCharacters.set("mizue", mizue);
    this.baseCharacters.set("lyn", lyn);
    this.baseCharacters.set("mika", mika);
    this.baseCharacters.set("sera", sera);
    this.baseCharacters.set("ibuki", ibuki);

    // Initialize training content blocks
    this.initializeContentBlocks();
    this.initializeItems();
  }

  private initializeContentBlocks() {
    const trainingBlocks: ContentBlock[] = [
      {
        id: "flowing_waters",
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
        postFlair: "You sit by a gentle stream, letting the water's rhythm guide your breathing. Your endurance and mental fortitude grow stronger.",
        statGains: { sta: 14, wil: 8, mag: 5 },
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
        id: "mysterious_pool",
        label: "Mysterious Pool Discovery", 
        kind: "event",
        weight: 50,
        primaryTag: "risk",
        characterRestriction: "kyuu",
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 3,
        maxDay: 12,
        preFlair: "You discover a shimmering pool deep in the forest. Ancient runes glow around its edge, and the water seems to call to your very essence.",
        postFlair: "The mystical waters surge through you, awakening dormant potential. You feel your magical essence expand dramatically.",
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
        id: "spirit_merchant",
        label: "Visit the Spirit Merchant",
        kind: "training", 
        weight: 80,
        primaryTag: "shop",
        characterRestriction: null,
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 2,
        maxDay: 14,
        preFlair: null,
        postFlair: "The wandering merchant shares tales of distant lands, sharpening your wits while showing you rare wares.",
        statGains: { wit: 12, cha: 7, luk: 3 },
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
      // Additional training options for all characters
      {
        id: "combat_training",
        label: "Combat Training",
        kind: "training",
        weight: 90,
        primaryTag: "strength",
        characterRestriction: null,
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 1,
        maxDay: 14,
        preFlair: null,
        postFlair: "You practice combat techniques and physical conditioning. Your strength and agility improve.",
        statGains: { str: 15, agi: 9, sta: 4 },
        coinGain: 40,
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
        id: "magic_studies",
        label: "Arcane Studies",
        kind: "training", 
        weight: 85,
        primaryTag: "magic",
        characterRestriction: null,
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 1,
        maxDay: 14,
        preFlair: null,
        postFlair: "You study ancient texts and practice spellcasting. Your magical power and wisdom expand.",
        statGains: { mag: 16, wit: 8, wil: 5 },
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
        id: "social_practice",
        label: "Social Practice",
        kind: "training",
        weight: 80,
        primaryTag: "charisma",
        characterRestriction: null,
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 1,
        maxDay: 14,
        preFlair: null,
        postFlair: "You practice conversation and charm techniques. Your charisma and luck improve.",
        statGains: { cha: 14, wil: 7, luk: 3 },
        coinGain: 35,
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
        id: "endurance_run",
        label: "Endurance Training",
        kind: "training",
        weight: 95,
        primaryTag: "stamina", 
        characterRestriction: null,
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 1,
        maxDay: 14,
        preFlair: null,
        postFlair: "You push your physical limits through intense endurance exercises. Your stamina and willpower strengthen.",
        statGains: { sta: 17, str: 10, agi: 4 },
        coinGain: 30,
        setFlags: [],
        unsetFlags: [],
        grantItems: [],
        removeItems: [],
        openShop: false,
        injuryRisk: 8,
        healInjuries: false,
        seasonId: "2025S1",
      },
      {
        id: "meditation",
        label: "Deep Meditation",
        kind: "training",
        weight: 75,
        primaryTag: "will",
        characterRestriction: null,
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 1,
        maxDay: 14,
        preFlair: null,
        postFlair: "You enter a deep meditative state, strengthening your mental fortitude and inner focus.",
        statGains: { wil: 15, wit: 9, mag: 4 },
        coinGain: 25,
        setFlags: [],
        unsetFlags: [],
        grantItems: [],
        removeItems: [],
        openShop: false,
        injuryRisk: 0,
        healInjuries: true,
        seasonId: "2025S1",
      },
      {
        id: "treasure_hunt",
        label: "Treasure Hunt",
        kind: "event",
        weight: 60,
        primaryTag: "luck",
        characterRestriction: null,
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 1,
        maxDay: 14,
        preFlair: "You hear rumors of hidden treasure nearby. The adventure calls to you!",
        postFlair: "Your search pays off! You find valuable items and your luck improves from the experience.",
        statGains: { luk: 5, agi: 2 },
        coinGain: 150,
        setFlags: [],
        unsetFlags: [],
        grantItems: [],
        removeItems: [],
        openShop: false,
        injuryRisk: 12,
        healInjuries: false,
        seasonId: "2025S1",
      },
      // Shimi-specific training content based on her noble background and transformation abilities
      {
        id: "noble_etiquette",
        label: "Noble Etiquette Practice",
        kind: "training",
        weight: 70,
        primaryTag: "charisma",
        characterRestriction: "shimi",
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 1,
        maxDay: 14,
        preFlair: null,
        postFlair: "You practice the refined mannerisms of nobility, your natural superiority shining through.",
        statGains: { cha: 13, wil: 7, wit: 4 },
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
        id: "mana_experimentation",
        label: "Desperate Mana Experiments",
        kind: "event",
        weight: 40,
        primaryTag: "risk",
        characterRestriction: "shimi",
        requiresFlags: [],
        excludesFlags: ["mana_awakened"],
        requiresItems: [],
        minDay: 3,
        maxDay: 10,
        preFlair: "Frustration builds as you recall your magical failures. Perhaps... more desperate measures are needed.",
        postFlair: "The experiments push you to your limits. Your mana core strains, but something dark stirs within...",
        statGains: { mag: 18, wil: 12, wit: 5, luk: -1 },
        coinGain: 100,
        setFlags: ["mana_awakened"],
        unsetFlags: [],
        grantItems: [],
        removeItems: [],
        openShop: false,
        injuryRisk: 20,
        healInjuries: false,
        seasonId: "2025S1",
      },
      {
        id: "transformation_study",
        label: "Study Transformation Arts",
        kind: "training",
        weight: 65,
        primaryTag: "magic",
        characterRestriction: "shimi",
        requiresFlags: ["mana_awakened"],
        excludesFlags: [],
        requiresItems: [],
        minDay: 5,
        maxDay: 14,
        preFlair: null,
        postFlair: "You delve into the forbidden arts of transformation, feeling the black sludge respond to your will.",
        statGains: { mag: 16, wit: 9, cha: 6 },
        coinGain: 80,
        setFlags: [],
        unsetFlags: [],
        grantItems: ["transformation_notes"],
        removeItems: [],
        openShop: false,
        injuryRisk: 0,
        healInjuries: false,
        seasonId: "2025S1",
      },
      {
        id: "superiority_complex",
        label: "Assert Your Superiority",
        kind: "event",
        weight: 50,
        primaryTag: "pride",
        characterRestriction: "shimi",
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 1,
        maxDay: 14,
        preFlair: "Someone dares to question your abilities. How utterly foolish of them.",
        postFlair: "You remind them of their place. The satisfaction of being acknowledged as superior fills you with twisted pleasure.",
        statGains: { cha: 15, wil: 11, str: 5 },
        coinGain: 75,
        setFlags: [],
        unsetFlags: [],
        grantItems: [],
        removeItems: [],
        openShop: false,
        injuryRisk: 0,
        healInjuries: false,
        seasonId: "2025S1",
      },
      // Money-making options
      {
        id: "merchant_work",
        label: "Work for Local Merchants",
        kind: "training",
        weight: 70,
        primaryTag: "money",
        characterRestriction: null,
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 1,
        maxDay: 14,
        preFlair: null,
        postFlair: "You assist local merchants with their daily tasks, earning coins while improving your wit and charisma.",
        statGains: { cha: 12, wit: 8, luk: 3 },
        coinGain: 150,
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
        id: "bounty_hunting",
        label: "Bounty Hunting",
        kind: "training",
        weight: 65,
        primaryTag: "money",
        characterRestriction: null,
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 3,
        maxDay: 14,
        preFlair: null,
        postFlair: "You track down wanted criminals for bounty rewards. Dangerous but profitable work.",
        statGains: { str: 14, agi: 11, wit: 6 },
        coinGain: 200,
        setFlags: [],
        unsetFlags: [],
        grantItems: [],
        removeItems: [],
        openShop: false,
        injuryRisk: 15,
        healInjuries: false,
        seasonId: "2025S1",
      },
      {
        id: "street_performing",
        label: "Street Performing",
        kind: "training",
        weight: 75,
        primaryTag: "money",
        characterRestriction: null,
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 1,
        maxDay: 14,
        preFlair: null,
        postFlair: "You entertain crowds with your talents, earning tips while building confidence and charm.",
        statGains: { cha: 16, luk: 9, wil: 4 },
        coinGain: 120,
        setFlags: [],
        unsetFlags: [],
        grantItems: [],
        removeItems: [],
        openShop: false,
        injuryRisk: 0,
        healInjuries: false,
        seasonId: "2025S1",
      },
      // Additional events for variety
      {
        id: "mysterious_stranger",
        label: "Encounter with a Mysterious Stranger",
        kind: "event",
        weight: 30,
        primaryTag: "mystery",
        characterRestriction: null,
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 2,
        maxDay: 12,
        preFlair: "A hooded figure approaches you with an unusual proposition...",
        postFlair: "The stranger's words linger in your mind. You feel changed by the encounter.",
        statGains: { wil: 15, wit: 10, mag: 5 },
        coinGain: 100,
        setFlags: ["met_stranger"],
        unsetFlags: [],
        grantItems: [],
        removeItems: [],
        openShop: false,
        injuryRisk: 5,
        healInjuries: false,
        seasonId: "2025S1",
      },
      {
        id: "ancient_ruins",
        label: "Explore Ancient Ruins",
        kind: "event", 
        weight: 35,
        primaryTag: "exploration",
        characterRestriction: null,
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 4,
        maxDay: 14,
        preFlair: "You discover ruins from a forgotten civilization. The air crackles with ancient magic...",
        postFlair: "The ruins hold secrets that enhance your understanding of magic and history.",
        statGains: { mag: 17, wit: 12, luk: 3 },
        coinGain: 80,
        setFlags: [],
        unsetFlags: [],
        grantItems: ["ancient_scroll"],
        removeItems: [],
        openShop: false,
        injuryRisk: 10,
        healInjuries: false,
        seasonId: "2025S1",
      },
      {
        id: "tavern_brawl",
        label: "Tavern Brawl",
        kind: "event",
        weight: 40,
        primaryTag: "combat",
        characterRestriction: null,
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 1,
        maxDay: 14,
        preFlair: "A disagreement at the local tavern escalates into a full brawl!",
        postFlair: "You emerge from the chaos stronger but a bit worse for wear.",
        statGains: { str: 14, sta: 11, agi: 6 },
        coinGain: 60,
        setFlags: [],
        unsetFlags: [],
        grantItems: [],
        removeItems: [],
        openShop: false,
        injuryRisk: 20,
        healInjuries: false,
        seasonId: "2025S1",
      },
      {
        id: "lucky_find",
        label: "Lucky Discovery",
        kind: "event",
        weight: 25,
        primaryTag: "luck",
        characterRestriction: null,
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 1,
        maxDay: 14,
        preFlair: "Your keen eyes spot something valuable that others have missed...",
        postFlair: "Fortune favors you today! Your find brings both wealth and confidence.",
        statGains: { luk: 18, cha: 8, wit: 4 },
        coinGain: 250,
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
        id: "spiritual_meditation",
        label: "Spiritual Meditation",
        kind: "event",
        weight: 45,
        primaryTag: "spirit",
        characterRestriction: null,
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 2,
        maxDay: 14,
        preFlair: "You find a sacred grove that emanates peaceful energy...",
        postFlair: "The meditation session brings inner peace and spiritual growth.",
        statGains: { wil: 16, mag: 9, sta: 5 },
        coinGain: 50,
        setFlags: [],
        unsetFlags: [],
        grantItems: [],
        removeItems: [],
        openShop: false,
        injuryRisk: 0,
        healInjuries: true,
        seasonId: "2025S1",
      },
      {
        id: "guild_commission",
        label: "Guild Commission Work",
        kind: "training",
        weight: 80,
        primaryTag: "money",
        characterRestriction: null,
        requiresFlags: [],
        excludesFlags: [],
        requiresItems: [],
        minDay: 2,
        maxDay: 14,
        preFlair: null,
        postFlair: "You complete various tasks for the adventurer's guild, earning recognition and coin.",
        statGains: { wit: 13, str: 8, agi: 5 },
        coinGain: 180,
        setFlags: [],
        unsetFlags: [],
        grantItems: [],
        removeItems: [],
        openShop: false,
        injuryRisk: 8,
        healInjuries: false,
        seasonId: "2025S1",
      }
    ];

    trainingBlocks.forEach(block => {
      this.contentBlocks.set(block.id, block);
    });
  }

  private initializeItems() {
    const gameItems: Item[] = [
      {
        id: "sealing_threads",
        name: "Sealing Threads",
        description: "Mystical threads that enhance sealing abilities. Provides +15% to all seal checks and +10pp to Will resistance.",
        tags: ["pvp", "seal", "defense"],
        characterRestriction: null,
        price: 750,
        stockPerRun: 1,
        stockGlobal: null,
        pvpEffect: "+15% seal checks, +10pp Will resistance",
        shopOnly: true,
        seasonId: "2025S1",
      },
      {
        id: "anti_regen_blade", 
        name: "Anti-Regen Blade",
        description: "A weapon forged to counter regenerative abilities. Allows instant defeat of regenerating opponents when landing a critical hit.",
        tags: ["pvp", "finisher", "weapon"],
        characterRestriction: null,
        price: 1200,
        stockPerRun: 2,
        stockGlobal: null,
        pvpEffect: "Anti-regen finisher on critical hit",
        shopOnly: true,
        seasonId: "2025S1",
      },
      {
        id: "essence_potion",
        name: "Essence Potion", 
        description: "A concentrated elixir that enhances training effectiveness. Next training option gains +2 to all stat gains.",
        tags: ["training", "boost", "consumable"],
        characterRestriction: null,
        price: 400,
        stockPerRun: null,
        stockGlobal: null,
        pvpEffect: null,
        shopOnly: true,
        seasonId: "2025S1",
      },
      {
        id: "essence_crystal",
        name: "Essence Crystal",
        description: "A rare crystal formed from mystical waters. Provides magical attunement in battle.",
        tags: ["rare", "magic", "quest"],
        characterRestriction: null,
        price: 0,
        stockPerRun: null,
        stockGlobal: null,
        pvpEffect: "+5 to all magical checks",
        shopOnly: false,
        seasonId: "2025S1",
      }
    ];

    gameItems.forEach(item => {
      this.items.set(item.id, item);
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.discordId === discordId);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      lastRoll: null,
      coins: 0,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates };
    this.users.set(id, updated);
    return updated;
  }

  // Character methods
  async getBaseCharacters(): Promise<BaseCharacter[]> {
    return Array.from(this.baseCharacters.values());
  }

  async getBaseCharacter(id: string): Promise<BaseCharacter | undefined> {
    return this.baseCharacters.get(id);
  }

  async getCharacterInstance(id: string): Promise<CharacterInstance | undefined> {
    return this.characterInstances.get(id);
  }

  async getUserCharacters(userId: string, status?: string): Promise<CharacterInstance[]> {
    return Array.from(this.characterInstances.values())
      .filter(char => char.userId === userId && (!status || char.status === status));
  }

  async createCharacterInstance(character: Omit<CharacterInstance, 'id' | 'createdAt'>): Promise<CharacterInstance> {
    const id = randomUUID();
    const instance: CharacterInstance = {
      ...character,
      id,
      createdAt: new Date(),
      lockedAt: null,
    };
    this.characterInstances.set(id, instance);
    return instance;
  }

  async updateCharacterInstance(id: string, updates: Partial<CharacterInstance>): Promise<CharacterInstance | undefined> {
    const instance = this.characterInstances.get(id);
    if (!instance) return undefined;
    const updated = { ...instance, ...updates };
    this.characterInstances.set(id, updated);
    return updated;
  }

  async getUserActivePvPCharacter(userId: string): Promise<CharacterInstance | undefined> {
    return Array.from(this.characterInstances.values())
      .find(char => char.userId === userId && char.isActivePvP && char.status === 'locked');
  }

  // Training methods
  async getContentBlock(id: string): Promise<ContentBlock | undefined> {
    return this.contentBlocks.get(id);
  }

  async getContentBlocks(characterId?: string, day?: number): Promise<ContentBlock[]> {
    return Array.from(this.contentBlocks.values())
      .filter(block => 
        (!characterId || !block.characterRestriction || block.characterRestriction === characterId) &&
        (!day || (day >= (block.minDay || 1) && day <= (block.maxDay || 14)))
      );
  }

  async getTrainingSession(userId: string): Promise<TrainingSession | undefined> {
    return Array.from(this.trainingSessions.values()).find(session => session.userId === userId);
  }

  async createTrainingSession(session: Omit<TrainingSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrainingSession> {
    const id = randomUUID();
    const newSession: TrainingSession = {
      ...session,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.trainingSessions.set(id, newSession);
    return newSession;
  }

  async updateTrainingSession(id: string, updates: Partial<TrainingSession>): Promise<TrainingSession | undefined> {
    const session = this.trainingSessions.get(id);
    if (!session) return undefined;
    const updated = { ...session, ...updates, updatedAt: new Date() };
    this.trainingSessions.set(id, updated);
    return updated;
  }

  async deleteTrainingSession(id: string): Promise<void> {
    this.trainingSessions.delete(id);
  }

  // Item methods
  async getItems(): Promise<Item[]> {
    return Array.from(this.items.values());
  }

  async getItem(id: string): Promise<Item | undefined> {
    return this.items.get(id);
  }

  // PvP methods
  async createPvpMatch(match: Omit<PvpMatch, 'id' | 'createdAt'>): Promise<PvpMatch> {
    const id = randomUUID();
    const newMatch: PvpMatch = {
      ...match,
      id,
      createdAt: new Date(),
    };
    this.pvpMatches.set(id, newMatch);
    return newMatch;
  }

  async getUserPvpMatches(userId: string, limit: number = 10): Promise<PvpMatch[]> {
    return Array.from(this.pvpMatches.values())
      .filter(match => match.challenger === userId || match.opponent === userId)
      .sort((a, b) => (b.createdAt || new Date()).getTime() - (a.createdAt || new Date()).getTime())
      .slice(0, limit);
  }

  // Character of the Day
  async getCharacterOfTheDay(date: string): Promise<string | undefined> {
    return this.cotdMap.get(date);
  }

  async setCharacterOfTheDay(date: string, characterId: string): Promise<void> {
    this.cotdMap.set(date, characterId);
  }
}

export const storage = new MemStorage();
