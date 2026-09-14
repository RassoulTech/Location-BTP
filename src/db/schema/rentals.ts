import {
  bigint, customType, date, index, integer, pgTable, text, timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import {
  deliveryModeEnum, rateBasisEnum, rentalItemStatusEnum, rentalStatusEnum,
} from "./enums";
import { customers, addresses } from "./customers";
import { equipmentTypes, equipmentUnits } from "./equipment";
import { users } from "./auth";

/** Type PostgreSQL daterange — pas de primitive Drizzle equivalente. */
export const daterange = customType<{ data: string; driverData: string }>({
  dataType: () => "daterange",
});

/* ==========================================================
   Locations (CDC §19 a §24)

   Une demande (rentals) porte l'entete : client, dates souhaitees,
   livraison, montants, statut. Chaque ligne (rental_items) reserve
   UNE unite physique sur UNE periode.

   C'est au niveau de rental_items que la base empeche physiquement
   la double reservation — voir drizzle/9999_business_constraints.sql :

     EXCLUDE USING gist (unit_id WITH =, period WITH &&)
     WHERE (status IN ('reserved','confirmed','active'))

   La colonne `period` est GENEREE par PostgreSQL a partir de
   start_date et end_date : l'application ne peut pas la desynchroniser.
   ========================================================== */

export const rentals = pgTable(
  "rentals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Reference lisible : LOC-2026-0042. */
    reference: text("reference").notNull(),
    customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "restrict" }),
    status: rentalStatusEnum("status").notNull().default("pending"),

    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),

    deliveryMode: deliveryModeEnum("delivery_mode").notNull().default("pickup"),
    deliveryAddressId: uuid("delivery_address_id").references(() => addresses.id, { onDelete: "set null" }),
    /** Adresse libre quand le chantier n'est pas une adresse enregistree. */
    siteAddress: text("site_address"),
    siteCity: text("site_city"),

    /* --- Montants en FCFA, recalcules cote serveur a chaque ecriture (CDC §45) --- */
    subtotalAmount: bigint("subtotal_amount", { mode: "number" }).notNull().default(0),
    discountAmount: bigint("discount_amount", { mode: "number" }).notNull().default(0),
    deliveryAmount: bigint("delivery_amount", { mode: "number" }).notNull().default(0),
    taxAmount: bigint("tax_amount", { mode: "number" }).notNull().default(0),
    totalAmount: bigint("total_amount", { mode: "number" }).notNull().default(0),
    depositAmount: bigint("deposit_amount", { mode: "number" }).notNull().default(0),

    customerNote: text("customer_note"),
    internalNote: text("internal_note"),

    /* --- Tracabilite de la validation administrative (CDC §21, §23) --- */
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    decidedBy: uuid("decided_by").references(() => users.id, { onDelete: "set null" }),
    rejectionReason: text("rejection_reason"),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("rentals_reference_key").on(t.reference),
    index("rentals_customer_idx").on(t.customerId),
    index("rentals_status_idx").on(t.status),
    index("rentals_dates_idx").on(t.startDate, t.endDate),
  ],
);

export const rentalItems = pgTable(
  "rental_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rentalId: uuid("rental_id").notNull().references(() => rentals.id, { onDelete: "cascade" }),
    /** Le modele demande — conserve meme si l'unite change. */
    typeId: uuid("type_id").notNull().references(() => equipmentTypes.id, { onDelete: "restrict" }),
    /** L'exemplaire effectivement bloque. NULL tant que rien n'est affecte. */
    unitId: uuid("unit_id").references(() => equipmentUnits.id, { onDelete: "restrict" }),
    status: rentalItemStatusEnum("status").notNull().default("reserved"),

    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    /** Genere par PostgreSQL : daterange(start_date, end_date, '[]'). */
    period: daterange("period").generatedAlwaysAs(
      sql`daterange(start_date, end_date, '[]')`,
    ),

    /* --- Tarif fige a la validation, jamais relu du client --- */
    rateBasis: rateBasisEnum("rate_basis").notNull().default("daily"),
    unitRate: bigint("unit_rate", { mode: "number" }).notNull(),
    billedUnits: integer("billed_units").notNull(),
    lineAmount: bigint("line_amount", { mode: "number" }).notNull(),
    depositAmount: bigint("deposit_amount", { mode: "number" }).notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("rental_items_rental_idx").on(t.rentalId),
    index("rental_items_unit_idx").on(t.unitId),
    index("rental_items_type_idx").on(t.typeId),
  ],
);

/** Retour d'un exemplaire (CDC §24). Tracable, avec etat et dommages. */
export const rentalReturns = pgTable(
  "rental_returns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rentalItemId: uuid("rental_item_id").notNull().references(() => rentalItems.id, { onDelete: "cascade" }),
    returnedAt: timestamp("returned_at", { withTimezone: true }).notNull().defaultNow(),
    receivedBy: uuid("received_by").references(() => users.id, { onDelete: "set null" }),
    hourMeter: integer("hour_meter"),
    damageDescription: text("damage_description"),
    damageAmount: bigint("damage_amount", { mode: "number" }).notNull().default(0),
    /** true lorsque le retour declenche une immobilisation pour maintenance. */
    requiresMaintenance: integer("requires_maintenance").notNull().default(0),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("rental_returns_item_idx").on(t.rentalItemId)],
);

export const rentalsRelations = relations(rentals, ({ one, many }) => ({
  customer: one(customers, { fields: [rentals.customerId], references: [customers.id] }),
  items: many(rentalItems),
}));

export const rentalItemsRelations = relations(rentalItems, ({ one, many }) => ({
  rental: one(rentals, { fields: [rentalItems.rentalId], references: [rentals.id] }),
  type: one(equipmentTypes, { fields: [rentalItems.typeId], references: [equipmentTypes.id] }),
  unit: one(equipmentUnits, { fields: [rentalItems.unitId], references: [equipmentUnits.id] }),
  returns: many(rentalReturns),
}));

export const rentalReturnsRelations = relations(rentalReturns, ({ one }) => ({
  item: one(rentalItems, { fields: [rentalReturns.rentalItemId], references: [rentalItems.id] }),
}));
