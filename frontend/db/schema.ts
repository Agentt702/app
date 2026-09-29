import { integer, jsonb, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const bookmarks = pgTable("bookmarks", {
  deviceId: text("device_id").notNull(),
  prophetId: text("prophet_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [primaryKey({ columns: [table.deviceId, table.prophetId] })]);

export const kidsProgress = pgTable("kids_progress", {
  deviceId: text("device_id").primaryKey(),
  currentLevel: integer("current_level").default(1).notNull(),
  levels: jsonb("levels").$type<Record<string, { stars: number; correct: number; completed_at: string }>>().default({}).notNull(),
});
