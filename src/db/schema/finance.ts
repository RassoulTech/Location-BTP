import {
  bigint, date, index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { invoiceStatusEnum, paymentProviderEnum, paymentStatusEnum } from "./enums";
import { customers } from "./customers";
import { rentals } from "./rentals";
import { orders } from "./sales";
import { users } from "./auth";

/* ==========================================================
   Paiements et factures (CDC §35, §36, §37)

   Aucun fournisseur de paiement n'est branche a ce jour.
   La table est prete, l'integration reste a faire — rien ici
   ne doit laisser croire qu'un encaissement reel fonctionne.

   Un paiement se rattache a une location OU a une commande :
   exactement un des deux (CHECK payments_target_chk).
   ========================================================== */

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull(),
    customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "restrict" }),
    rentalId: uuid("rental_id").references(() => rentals.id, { onDelete: "set null" }),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),

    status: paymentStatusEnum("status").notNull().default("pending"),
    provider: paymentProviderEnum("provider").notNull().default("cash"),
    amount: bigint("amount", { mode: "number" }).notNull(),
    currency: text("currency").notNull().default("XOF"),

    /** Identifiant chez le fournisseur, quand il y en aura un. */
    providerReference: text("provider_reference"),
    /** Reponse brute du fournisseur, conservee pour rapprochement. */
    providerPayload: jsonb("provider_payload"),

    paidAt: timestamp("paid_at", { withTimezone: true }),
    failureReason: text("failure_reason"),
    recordedBy: uuid("recorded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("payments_reference_key").on(t.reference),
    index("payments_customer_idx").on(t.customerId),
    index("payments_rental_idx").on(t.rentalId),
    index("payments_order_idx").on(t.orderId),
    index("payments_status_idx").on(t.status),
  ],
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Numero de facture — sequence continue, jamais reutilisee. */
    number: text("number").notNull(),
    customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "restrict" }),
    rentalId: uuid("rental_id").references(() => rentals.id, { onDelete: "set null" }),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),

    status: invoiceStatusEnum("status").notNull().default("draft"),
    issuedOn: date("issued_on", { mode: "string" }),
    dueOn: date("due_on", { mode: "string" }),

    subtotalAmount: bigint("subtotal_amount", { mode: "number" }).notNull().default(0),
    taxRate: bigint("tax_rate_bp", { mode: "number" }).notNull().default(1800),
    taxAmount: bigint("tax_amount", { mode: "number" }).notNull().default(0),
    totalAmount: bigint("total_amount", { mode: "number" }).notNull().default(0),
    paidAmount: bigint("paid_amount", { mode: "number" }).notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("invoices_number_key").on(t.number),
    index("invoices_customer_idx").on(t.customerId),
    index("invoices_status_idx").on(t.status),
  ],
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  customer: one(customers, { fields: [payments.customerId], references: [customers.id] }),
  rental: one(rentals, { fields: [payments.rentalId], references: [rentals.id] }),
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  customer: one(customers, { fields: [invoices.customerId], references: [customers.id] }),
  rental: one(rentals, { fields: [invoices.rentalId], references: [rentals.id] }),
  order: one(orders, { fields: [invoices.orderId], references: [orders.id] }),
}));
