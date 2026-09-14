import { index, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { equipmentUnits } from "./equipment";
import { daterange } from "./rentals";

/* ==========================================================
   Registre d'occupation des exemplaires — CŒUR DE L'INTEGRITE

   Une seule table dit, pour chaque unite physique, quelles periodes
   sont prises. Elle est alimentee automatiquement par des triggers
   PostgreSQL depuis rental_items ET maintenance_records : aucun
   chemin applicatif ne peut l'oublier ou la contourner.

   La contrainte d'exclusion posee dessus rend physiquement impossible :
     - deux locations qui se chevauchent sur la meme machine (CDC §18)
     - une location pendant une immobilisation atelier (CDC §16, §25)
     - une course entre deux requetes simultanees (CDC §78)

   La contrainte EXCLUDE, les fonctions et les triggers sont definis
   dans drizzle/0001_business_constraints.sql — drizzle-kit ne sait pas
   les exprimer. NE PAS les supprimer lors d'une regeneration.
   ========================================================== */

export const unitOccupancies = pgTable(
  "unit_occupancies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    unitId: uuid("unit_id").notNull().references(() => equipmentUnits.id, { onDelete: "cascade" }),
    /** 'rental_items' ou 'maintenance_records' */
    sourceTable: text("source_table").notNull(),
    sourceId: uuid("source_id").notNull(),
    period: daterange("period").notNull(),
  },
  (t) => [
    uniqueIndex("unit_occupancies_source_key").on(t.sourceTable, t.sourceId),
    index("unit_occupancies_unit_idx").on(t.unitId),
  ],
);

export const unitOccupanciesRelations = relations(unitOccupancies, ({ one }) => ({
  unit: one(equipmentUnits, { fields: [unitOccupancies.unitId], references: [equipmentUnits.id] }),
}));
