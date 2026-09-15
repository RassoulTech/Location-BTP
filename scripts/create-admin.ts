import "dotenv/config";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { Pool as PgPool } from "pg";
import ws from "ws";
import { randomBytes, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";

/* ==========================================================
   Cree (ou met a jour) un compte du personnel.

   Usage :
     npm run db:admin -- <email> <prenom> <nom> <motdepasse> [role]

   Le role vaut `super_admin` par defaut. Le mot de passe n'est
   jamais affiche ni journalise ; seul son hachage est ecrit.

   Ce script duplique volontairement la fonction de hachage de
   `src/lib/auth/password.ts` : ce module porte `server-only`
   et ne peut pas etre importe hors du serveur Next. Les
   parametres doivent rester identiques des deux cotes.
   ========================================================== */

const scrypt = promisify(scryptCb) as (
  p: string | Buffer, s: string | Buffer, k: number, o: object,
) => Promise<Buffer>;

const N = 32768, r = 8, p = 1, KEYLEN = 64;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, KEYLEN, {
    N, r, p, maxmem: 256 * N * r,
  });
  return ["scrypt", N, r, p, salt.toString("base64url"), key.toString("base64url")].join("$");
}

const [email, firstName, lastName, password, role = "super_admin"] = process.argv.slice(2);

if (!email || !firstName || !lastName || !password) {
  console.error(
    "Usage : npm run db:admin -- <email> <prenom> <nom> <motdepasse> [role]\n" +
    "Roles : super_admin, admin, manager, commercial, comptable, technicien",
  );
  process.exit(1);
}
if (password.length < 10) {
  console.error("Mot de passe trop court : 10 caracteres minimum.");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquante.");
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
    const roleRes = await client.query("SELECT id FROM roles WHERE slug = $1", [role]);
    if (roleRes.rowCount === 0) {
      throw new Error(`Role inconnu : ${role}. Lancez d'abord \`npm run db:seed\`.`);
    }
    const roleId = roleRes.rows[0].id;

    await client.query("BEGIN");

    const hash = await hashPassword(password!);
    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, is_active)
       VALUES (lower($1), $2, $3, $4, true)
       ON CONFLICT (lower(email)) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             first_name = EXCLUDED.first_name,
             last_name = EXCLUDED.last_name,
             is_active = true,
             updated_at = now()
       RETURNING id`,
      [email, hash, firstName, lastName],
    );
    const userId = userRes.rows[0].id;

    await client.query(
      `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, roleId],
    );

    await client.query("COMMIT");
    console.log(`Compte ${email} pret, role ${role}.`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
