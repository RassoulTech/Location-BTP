import {
  bigint, date, index, integer, pgTable, text, timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { unitConditionEnum, unitStatusEnum } from "./enums";

/* ==========================================================
   Parc materiel (CDC §14, §15, §16)

   DECISION STRUCTURANTE : le modele commercial et l'exemplaire
   physique sont deux tables distinctes.

     equipment_types  → « Pelle hydraulique CAT 320 »  (tarifs, photos)
     equipment_units  → « CAT320-001 », « CAT320-002 » (serie, etat)

   Une location se rattache TOUJOURS a une unite, jamais a un type.
   C'est ce qui rend la disponibilite calculable et la maintenance
   tracable exemplaire par exemplaire.

   Montants : entiers en FCFA (devise sans sous-unite). Aucun flottant.
   ========================================================== */

export const equipmentCategories = pgTable(
  "equipment_categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("equipment_categories_slug_key").on(t.slug)],
);

export const equipmentTypes = pgTable(
  "equipment_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    categoryId: uuid("category_id").notNull().references(() => equipmentCategories.id, { onDelete: "restrict" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    brand: text("brand"),
    model: text("model"),
    shortDescription: text("short_description"),
    description: text("description"),

    /* --- Tarification (CDC §22). Source de verite unique, cote base. --- */
    dailyRate: bigint("daily_rate", { mode: "number" }),
    weeklyRate: bigint("weekly_rate", { mode: "number" }),
    monthlyRate: bigint("monthly_rate", { mode: "number" }),
    depositAmount: bigint("deposit_amount", { mode: "number" }),
    salePrice: bigint("sale_price", { mode: "number" }),

    /** Une machine peut etre louable, vendable, ou les deux. */
    isRentable: integer("is_rentable").notNull().default(1),
    isSellable: integer("is_sellable").notNull().default(0),
    isPublished: integer("is_published").notNull().default(0),

    /* --- Contenu public (CDC §48) --- */
    primaryImagePath: text("primary_image_path"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("equipment_types_slug_key").on(t.slug),
    index("equipment_types_category_idx").on(t.categoryId),
  ],
);

export const equipmentUnits = pgTable(
  "equipment_units",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    typeId: uuid("type_id").notNull().references(() => equipmentTypes.id, { onDelete: "restrict" }),
    /** Identifiant interne lisible sur la machine : CAT320-001. */
    code: text("code").notNull(),
    serialNumber: text("serial_number"),
    status: unitStatusEnum("status").notNull().default("available"),
    condition: unitConditionEnum("condition").notNull().default("good"),
    location: text("location"),
    /** Compteur horaire releve au dernier retour. */
    hourMeter: integer("hour_meter").notNull().default(0),
    acquiredOn: date("acquired_on", { mode: "string" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("equipment_units_code_key").on(t.code),
    index("equipment_units_type_idx").on(t.typeId),
    index("equipment_units_status_idx").on(t.status),
  ],
);

export const equipmentCategoriesRelations = relations(equipmentCategories, ({ many }) => ({
  types: many(equipmentTypes),
}));

export const equipmentTypesRelations = relations(equipmentTypes, ({ one, many }) => ({
  category: one(equipmentCategories, {
    fields: [equipmentTypes.categoryId],
    references: [equipmentCategories.id],
  }),
  units: many(equipmentUnits),
}));

export const equipmentUnitsRelations = relations(equipmentUnits, ({ one }) => ({
  type: one(equipmentTypes, { fields: [equipmentUnits.typeId], references: [equipmentTypes.id] }),
}));
