import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Players represent volleyball players with their stats
export const players = pgTable("players", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  division: text("division").notNull(), // "east" or "west"
  team: text("team").notNull(),
  speed: integer("speed").notNull(),
  power: integer("power").notNull(),
  avatarUrl: text("avatar_url").notNull(),
});

export const insertPlayerSchema = createInsertSchema(players).pick({
  name: true,
  division: true,
  team: true,
  speed: true,
  power: true,
  avatarUrl: true,
});

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type Player = typeof players.$inferSelect;

// Matches track volleyball matches between teams
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  westPlayer1Id: integer("west_player1_id").notNull(),
  westPlayer2Id: integer("west_player2_id").notNull(),
  eastPlayer1Id: integer("east_player1_id").notNull(),
  eastPlayer2Id: integer("east_player2_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isComplete: boolean("is_complete").default(false).notNull(),
  winningDivision: text("winning_division"),
  mvpPlayerId: integer("mvp_player_id"),
  westScore: integer("west_score").default(0),
  eastScore: integer("east_score").default(0),
});

export const insertMatchSchema = createInsertSchema(matches).pick({
  westPlayer1Id: true,
  westPlayer2Id: true,
  eastPlayer1Id: true,
  eastPlayer2Id: true,
});

export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;

// Sets track the individual sets within a match
export const sets = pgTable("sets", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  setNumber: integer("set_number").notNull(),
  westScore: integer("west_score").notNull().default(0),
  eastScore: integer("east_score").notNull().default(0),
  winningDivision: text("winning_division"),
  isComplete: boolean("is_complete").default(false).notNull(),
});

export const insertSetSchema = createInsertSchema(sets).pick({
  matchId: true,
  setNumber: true,
});

export const updateSetSchema = createInsertSchema(sets).pick({
  westScore: true,
  eastScore: true,
  winningDivision: true,
  isComplete: true,
});

export type InsertSet = z.infer<typeof insertSetSchema>;
export type UpdateSet = z.infer<typeof updateSetSchema>;
export type Set = typeof sets.$inferSelect;

// Game logs track events during a match
export const gameLogs = pgTable("game_logs", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  setId: integer("set_id").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertGameLogSchema = createInsertSchema(gameLogs).pick({
  matchId: true,
  setId: true,
  message: true,
});

export type InsertGameLog = z.infer<typeof insertGameLogSchema>;
export type GameLog = typeof gameLogs.$inferSelect;
