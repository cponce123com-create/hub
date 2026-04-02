import { pgTable, serial, text, timestamp, json, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const companiesTable = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ruc: text("ruc"),
  logo: text("logo"),
  currency: text("currency").notNull().default("PEN"),
  industry: text("industry"),
  address: text("address"),
  email: text("email"),
  phone: text("phone"),
  activeModules: json("active_modules").$type<string[]>().notNull().default(["finance", "hr", "attendance", "documents", "announcements"]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCompanySchema = createInsertSchema(companiesTable).omit({ id: true, createdAt: true });
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Company = typeof companiesTable.$inferSelect;
