import { pgTable, serial, text, timestamp, integer, date, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { companiesTable } from "./companies";

export const employeesTable = pgTable("employees", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull().references(() => companiesTable.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  documentId: text("document_id").notNull(),
  position: text("position").notNull(),
  area: text("area").notNull(),
  site: text("site"),
  contractType: text("contract_type").notNull().default("indefinite"),
  status: text("status").notNull().default("active"),
  startDate: date("start_date").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  notes: text("notes"),
  avatar: text("avatar"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("employees_company_status_idx").on(table.companyId, table.status),
  index("employees_company_firstname_idx").on(table.companyId, table.firstName),
]);

export const insertEmployeeSchema = createInsertSchema(employeesTable).omit({ id: true, createdAt: true });
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employeesTable.$inferSelect;
