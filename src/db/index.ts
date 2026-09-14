import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

/* ==========================================================
   Client base de donnees

   Pilote `neon-serverless` (WebSocket) et non `neon-http` :
   le pilote HTTP ne supporte PAS les transactions, et le cahier
   des charges en exige pour toute operation critique (§34).
   Reservation, stock, paiement, retour : tout passe par
   db.transaction().
   ========================================================== */

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL manquant. Copiez .env.example vers .env.local et renseignez la chaine Neon.",
  );
}

// Node fournit WebSocket depuis la v22 ; on complete sinon.
if (typeof globalThis.WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

/** Une seule pool par processus, y compris entre les rechargements du mode dev. */
const globalForDb = globalThis as unknown as { __btpPool?: Pool };

const pool =
  globalForDb.__btpPool ??
  new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

if (process.env.NODE_ENV !== "production") globalForDb.__btpPool = pool;

export const db = drizzle(pool, { schema });
export type Db = typeof db;
/** Type accepte aussi bien par `db` que par le `tx` d'une transaction. */
export type Executor = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];
export { schema, pool };
