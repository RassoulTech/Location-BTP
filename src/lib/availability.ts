import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/* ==========================================================
   Disponibilite (CDC §17)

   Calcul cote serveur, toujours. Le front peut afficher un
   indicateur, il ne decide rien.

   La source est `unit_occupancies` : la table alimentee par
   triggers depuis les locations ET la maintenance. Une unite est
   libre sur une periode si aucune occupation ne la chevauche et
   si son statut ne l'exclut pas du service.
   ========================================================== */

export type AvailableUnit = {
  id: string;
  code: string;
  serialNumber: string | null;
  condition: string;
  location: string | null;
};

/** Statuts d'exemplaire qui interdisent toute location, quelle que soit la periode. */
const OUT_OF_SERVICE = ["maintenance", "unavailable"] as const;

/**
 * Exemplaires d'un modele reellement louables sur la periode.
 * `excludeRentalItemId` permet de replanifier une ligne existante
 * sans qu'elle se bloque elle-meme.
 */
export async function availableUnits(params: {
  typeId: string;
  startDate: string;
  endDate: string;
  excludeRentalItemId?: string;
}): Promise<AvailableUnit[]> {
  const { typeId, startDate, endDate, excludeRentalItemId } = params;

  const result = await db.execute<AvailableUnit>(sql`
    SELECT u.id, u.code, u.serial_number AS "serialNumber",
           u.condition::text AS condition, u.location
    FROM equipment_units u
    WHERE u.type_id = ${typeId}
      AND u.status NOT IN (${sql.raw(OUT_OF_SERVICE.map((s) => `'${s}'`).join(","))})
      AND NOT EXISTS (
        SELECT 1 FROM unit_occupancies o
        WHERE o.unit_id = u.id
          AND o.period && daterange(${startDate}::date, ${endDate}::date, '[]')
          AND (${excludeRentalItemId ?? null}::uuid IS NULL
               OR NOT (o.source_table = 'rental_items'
                       AND o.source_id = ${excludeRentalItemId ?? null}::uuid))
      )
    ORDER BY u.code
  `);
  return result.rows;
}

/** Nombre d'exemplaires libres, par modele, sur une periode. */
export async function availabilityByType(params: {
  startDate: string;
  endDate: string;
}): Promise<Map<string, number>> {
  const result = await db.execute<{ type_id: string; free: number }>(sql`
    SELECT u.type_id, count(*)::int AS free
    FROM equipment_units u
    WHERE u.status NOT IN ('maintenance', 'unavailable')
      AND NOT EXISTS (
        SELECT 1 FROM unit_occupancies o
        WHERE o.unit_id = u.id
          AND o.period && daterange(${params.startDate}::date, ${params.endDate}::date, '[]')
      )
    GROUP BY u.type_id
  `);
  return new Map(result.rows.map((r) => [r.type_id, r.free]));
}

/** Parc total et exemplaires en service, par modele — pour le catalogue public. */
export async function fleetByType(): Promise<Map<string, { total: number; inService: number }>> {
  const result = await db.execute<{ type_id: string; total: number; in_service: number }>(sql`
    SELECT type_id,
           count(*)::int AS total,
           count(*) FILTER (WHERE status NOT IN ('maintenance','unavailable'))::int AS in_service
    FROM equipment_units
    GROUP BY type_id
  `);
  return new Map(result.rows.map((r) => [r.type_id, { total: r.total, inService: r.in_service }]));
}

/**
 * Verifie qu'une unite precise est libre sur la periode.
 * A appeler avant d'affecter — la contrainte d'exclusion reste
 * le garde-fou final, mais ceci permet un message lisible.
 */
export async function isUnitFree(params: {
  unitId: string;
  startDate: string;
  endDate: string;
  excludeRentalItemId?: string;
}): Promise<boolean> {
  const result = await db.execute<{ busy: number }>(sql`
    SELECT count(*)::int AS busy
    FROM unit_occupancies o
    WHERE o.unit_id = ${params.unitId}
      AND o.period && daterange(${params.startDate}::date, ${params.endDate}::date, '[]')
      AND (${params.excludeRentalItemId ?? null}::uuid IS NULL
           OR NOT (o.source_table = 'rental_items'
                   AND o.source_id = ${params.excludeRentalItemId ?? null}::uuid))
  `);
  return (result.rows[0]?.busy ?? 0) === 0;
}
