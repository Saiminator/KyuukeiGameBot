import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Character Stats Schema
export const characterStatsSchema = z.object({
  str: z.number().min(1).max(999),
  agi: z.number().min(1).max(999), 
  sta: z.number().min(1).max(999),
  mag: z.number().min(1).max(999),
  wit: z.number().min(1).max(999),
  wil: z.number().min(1).max(999),
  cha: z.number().min(1).max(999),
  luk: z.number().min(1).max(999),
});

export type CharacterStats = z.infer<typeof characterStatsSchema>;

// Base character definitions
export const baseCharacters = pgTable("base_characters", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  baseStats: jsonb("base_stats").$type<CharacterStats>().notNull(),
  signatureAbility: text("signature_ability").notNull(),
  growthWeights: jsonb("growth_weights").$type<CharacterStats>().notNull(),
  canShop: boolean("can_shop").default(true),
});

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  discordId: varchar("discord_id").unique().notNull(),
  username: text("username").notNull(),
  lastRoll: timestamp("last_roll", { withTimezone: true }),
  coins: integer("coins").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Character instances (rolled candidates and locked cards)
export const characterInstances = pgTable("character_instances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  baseCharacterId: varchar("base_character_id").references(() => baseCharacters.id).notNull(),
  currentStats: jsonb("current_stats").$type<CharacterStats>().notNull(),
  rollPercentages: jsonb("roll_percentages").$type<CharacterStats>().notNull(),
  tier: text("tier").notNull(), // D, C, B, A, S
  averagePercentage: integer("average_percentage").notNull(),
  cotdUsed: boolean("cotd_used").default(false),
  status: text("status").notNull(), // "candidate", "training", "locked"
  trainingDay: integer("training_day").default(0),
  maxTrainingDays: integer("max_training_days").default(14),
  items: text("items").array().default([]),
  flags: text("flags").array().default([]),
  coins: integer("coins").default(0),
  injuries: text("injuries").array().default([]),
  seasonId: text("season_id").default("2025S1"),
  isActivePvP: boolean("is_active_pvp").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lockedAt: timestamp("locked_at", { withTimezone: true }),
});

// Training/Event content blocks
export const contentBlocks = pgTable("content_blocks", {
  id: varchar("id").primaryKey(),
  label: text("label").notNull(),
  kind: text("kind").notNull(), // "training" or "event"
  weight: integer("weight").default(100),
  primaryTag: text("primary_tag"), // for diversity control
  characterRestriction: text("character_restriction"), // null = any character
  requiresFlags: text("requires_flags").array().default([]),
  excludesFlags: text("excludes_flags").array().default([]),
  requiresItems: text("requires_items").array().default([]),
  minDay: integer("min_day").default(1),
  maxDay: integer("max_day").default(14),
  preFlair: text("pre_flair"), // shown in menu for events
  postFlair: text("post_flair"), // shown after selection
  statGains: jsonb("stat_gains").$type<Partial<CharacterStats>>(),
  coinGain: integer("coin_gain").default(0),
  setFlags: text("set_flags").array().default([]),
  unsetFlags: text("unset_flags").array().default([]),
  grantItems: text("grant_items").array().default([]),
  removeItems: text("remove_items").array().default([]),
  openShop: boolean("open_shop").default(false),
  injuryRisk: integer("injury_risk").default(0), // 0-100 percentage
  healInjuries: boolean("heal_injuries").default(false),
  seasonId: text("season_id").default("2025S1"),
});

// Shop definitions
export const shops = pgTable("shops", {
  id: varchar("id").primaryKey(),
  label: text("label").notNull(),
  description: text("description"),
  characterRestriction: text("character_restriction"),
  seasonId: text("season_id").default("2025S1"),
});

// Items
export const items = pgTable("items", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  tags: text("tags").array().default([]),
  characterRestriction: text("character_restriction"),
  price: integer("price").default(0),
  stockPerRun: integer("stock_per_run"), // null = unlimited
  stockGlobal: integer("stock_global"), // null = unlimited
  pvpEffect: text("pvp_effect"), // description of PvP effect
  shopOnly: boolean("shop_only").default(true),
  seasonId: text("season_id").default("2025S1"),
});

// Shop inventory (links shops to items with specific prices/stock)
export const shopInventory = pgTable("shop_inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shopId: varchar("shop_id").references(() => shops.id).notNull(),
  itemId: varchar("item_id").references(() => items.id).notNull(),
  price: integer("price").notNull(),
  stockPerRun: integer("stock_per_run"),
  stockGlobal: integer("stock_global"),
  requiresFlags: text("requires_flags").array().default([]),
  requiresItems: text("requires_items").array().default([]),
});

// Training sessions (active training state)
export const trainingSessions = pgTable("training_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  characterInstanceId: varchar("character_instance_id").references(() => characterInstances.id).notNull(),
  currentDay: integer("current_day").default(1),
  lastTrainingTag: text("last_training_tag"), // for diversity control
  eventPityCounter: integer("event_pity_counter").default(0),
  isWaitingForChoice: boolean("is_waiting_for_choice").default(false),
  currentOptions: jsonb("current_options").$type<string[]>(), // content block IDs
  lastMessageId: text("last_message_id"), // Discord message ID to disable old messages
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// PvP matches
export const pvpMatches = pgTable("pvp_matches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  challenger: varchar("challenger").references(() => users.id).notNull(),
  opponent: varchar("opponent").references(() => users.id).notNull(),
  challengerCharacter: varchar("challenger_character").references(() => characterInstances.id).notNull(),
  opponentCharacter: varchar("opponent_character").references(() => characterInstances.id).notNull(),
  winner: varchar("winner").references(() => users.id),
  battleLog: jsonb("battle_log").$type<any>(),
  narration: text("narration"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Character of the Day
export const characterOfTheDay = pgTable("character_of_the_day", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  characterId: varchar("character_id").references(() => baseCharacters.id).notNull(),
  date: text("date").notNull(), // YYYY-MM-DD format
  seasonId: text("season_id").default("2025S1"),
});

// Discord message tracking for interactive components
export const discordMessages = pgTable("discord_messages", {
  id: varchar("id").primaryKey(),
  messageId: varchar("message_id").unique().notNull(),
  channelId: varchar("channel_id").notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  messageType: text("message_type").notNull(), // "roll", "training", "shop", "collection", "pvp"
  relatedId: varchar("related_id"), // ID of related entity (training session, character, etc.)
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCharacterInstanceSchema = createInsertSchema(characterInstances).omit({ id: true, createdAt: true });
export const insertContentBlockSchema = createInsertSchema(contentBlocks);
export const insertTrainingSessionSchema = createInsertSchema(trainingSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPvpMatchSchema = createInsertSchema(pvpMatches).omit({ id: true, createdAt: true });

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type CharacterInstance = typeof characterInstances.$inferSelect;
export type BaseCharacter = typeof baseCharacters.$inferSelect;
export type ContentBlock = typeof contentBlocks.$inferSelect;
export type Item = typeof items.$inferSelect;
export type Shop = typeof shops.$inferSelect;
export type TrainingSession = typeof trainingSessions.$inferSelect;
export type PvpMatch = typeof pvpMatches.$inferSelect;
