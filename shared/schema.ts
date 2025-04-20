import { pgTable, text, serial, integer, timestamp, boolean, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  isVerified: boolean("is_verified").default(false).notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  verificationToken: text("verification_token"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Game server schema
export const servers = pgTable("servers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  game: text("game").notNull(),
  ip: text("ip").notNull(),
  port: integer("port").notNull(),
  region: text("region").notNull(),
  userId: integer("user_id").notNull().references(() => users.id),
  isFeatured: boolean("is_featured").default(false).notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
  isOnline: boolean("is_online").default(false).notNull(),
  currentPlayers: integer("current_players").default(0).notNull(),
  maxPlayers: integer("max_players").default(0).notNull(),
  currentMap: text("current_map"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Vote schema
export const votes = pgTable("votes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  serverId: integer("server_id").notNull().references(() => servers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Game type schema
export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  shortName: text("short_name").notNull().unique(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  servers: many(servers),
  votes: many(votes),
}));

export const serversRelations = relations(servers, ({ one, many }) => ({
  user: one(users, {
    fields: [servers.userId],
    references: [users.id],
  }),
  votes: many(votes),
}));

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(users, {
    fields: [votes.userId],
    references: [users.id],
  }),
  server: one(servers, {
    fields: [votes.serverId],
    references: [servers.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users)
  .omit({ id: true, isVerified: true, isAdmin: true, verificationToken: true, createdAt: true });

export const insertServerSchema = createInsertSchema(servers)
  .omit({ 
    id: true, 
    isApproved: true, 
    isFeatured: true, 
    isOnline: true, 
    currentPlayers: true, 
    maxPlayers: true, 
    currentMap: true,
    lastUpdated: true,
    createdAt: true
  });

export const insertVoteSchema = createInsertSchema(votes)
  .omit({ id: true, createdAt: true });

export const insertGameSchema = createInsertSchema(games)
  .omit({ id: true });

// Login schema
export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

// Extended schemas for validation
export const registerUserSchema = insertUserSchema.extend({
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val === true, { message: "You must agree to the terms" }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const serverSearchSchema = z.object({
  search: z.string().optional(),
  game: z.string().optional(),
  region: z.string().optional(),
  status: z.string().optional(),
  sort: z.enum(["votes", "players", "newest", "name"]).default("votes"),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(9),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertServer = z.infer<typeof insertServerSchema>;
export type Server = typeof servers.$inferSelect;

export type InsertVote = z.infer<typeof insertVoteSchema>;
export type Vote = typeof votes.$inferSelect;

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;

export type LoginCredentials = z.infer<typeof loginSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type ServerSearch = z.infer<typeof serverSearchSchema>;
