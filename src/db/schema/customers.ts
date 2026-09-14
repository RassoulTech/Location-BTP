import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { customerTypeEnum } from "./enums";
import { users } from "./auth";

/* ==========================================================
   Clients (CDC §38) — entite metier distincte du compte de connexion.
   Un client peut exister sans compte (cree par le commercial),
   et un compte peut exister sans client (utilisateur interne).
   ========================================================== */

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Numero client lisible, genere a la creation (ex. CLI-2026-0042). */
    reference: text("reference").notNull(),
    type: customerTypeEnum("type").notNull().default("company"),
    /** Rattachement optionnel a un compte de connexion. */
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    companyName: text("company_name"),
    contactFirstName: text("contact_first_name").notNull(),
    contactLastName: text("contact_last_name").notNull(),
    email: text("email"),
    phone: text("phone").notNull(),
    /** Identifiants legaux senegalais, saisis quand ils sont connus. */
    ninea: text("ninea"),
    rccm: text("rccm"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("customers_reference_key").on(t.reference),
    index("customers_user_idx").on(t.userId),
    index("customers_phone_idx").on(t.phone),
  ],
);

export const addresses = pgTable(
  "addresses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
    label: text("label"),
    line1: text("line1").notNull(),
    line2: text("line2"),
    city: text("city").notNull(),
    region: text("region"),
    country: text("country").notNull().default("SN"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("addresses_customer_idx").on(t.customerId)],
);

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, { fields: [customers.userId], references: [users.id] }),
  addresses: many(addresses),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  customer: one(customers, { fields: [addresses.customerId], references: [customers.id] }),
}));
