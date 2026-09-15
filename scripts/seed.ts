import "dotenv/config";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { Pool as PgPool } from "pg";
import ws from "ws";
import { PERMISSIONS, ROLES, permissionsOfRole, type RoleSlug } from "../src/lib/permissions.js";

/* ==========================================================
   Synchronise la base a partir du catalogue de roles et de
   permissions de `src/lib/permissions.ts`.

   Idempotent : on peut le relancer autant de fois qu'on veut.
   Ajouter une permission = l'ajouter dans le catalogue, puis
   relancer ce script.

   Il n'insere AUCUNE donnee commerciale : ni prix, ni
   materiel, ni coordonnees (CDC §92).
   ========================================================== */

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquante. Renseignez-la dans .env.local.");
  process.exit(1);
}

const isNeon = /\.neon\.tech(?::|\/|$)/i.test(url);
if (isNeon && typeof globalThis.WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

const pool = isNeon
  ? new NeonPool({ connectionString: url })
  : new PgPool({ connectionString: url });

async function main() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    /* --- Permissions --- */
    const permEntries = Object.entries(PERMISSIONS);
    for (const [slug, description] of permEntries) {
      const [resource, action] = slug.split(".");
      await client.query(
        `INSERT INTO permissions (slug, resource, action, description)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description`,
        [slug, resource, action, description],
      );
    }

    /* --- Roles --- */
    for (const [slug, role] of Object.entries(ROLES)) {
      await client.query(
        `INSERT INTO roles (slug, name, description, is_system)
         VALUES ($1, $2, $3, true)
         ON CONFLICT (slug) DO UPDATE
           SET name = EXCLUDED.name, description = EXCLUDED.description`,
        [slug, role.name, role.description],
      );
    }

    /* --- Rattachements role → permissions ---
       On repart du catalogue : une permission retiree du
       fichier est retiree du role, sinon un droit supprime
       resterait accorde indefiniment. */
    for (const slug of Object.keys(ROLES) as RoleSlug[]) {
      const wanted = permissionsOfRole(slug);
      await client.query(
        `DELETE FROM role_permissions rp
          USING roles r, permissions p
          WHERE rp.role_id = r.id AND rp.permission_id = p.id
            AND r.slug = $1 AND NOT (p.slug = ANY($2::text[]))`,
        [slug, wanted],
      );
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id)
         SELECT r.id, p.id FROM roles r, permissions p
          WHERE r.slug = $1 AND p.slug = ANY($2::text[])
         ON CONFLICT DO NOTHING`,
        [slug, wanted],
      );
    }

    await client.query("COMMIT");

    const { rows } = await client.query(
      `SELECT r.slug, count(rp.permission_id)::int AS n
         FROM roles r LEFT JOIN role_permissions rp ON rp.role_id = r.id
        GROUP BY r.slug ORDER BY n DESC`,
    );
    console.log(`${permEntries.length} permissions, ${rows.length} roles :`);
    for (const r of rows) console.log(`  ${String(r.slug).padEnd(13)} ${r.n} permissions`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
