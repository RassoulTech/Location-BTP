import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

/* ==========================================================
   Client base de donnees

   Pilote `neon-serverless` (WebSocket) et non `neon-http` :
   le pilote HTTP ne supporte PAS les transactions, et le cahier
   des charges en exige pour toute operation critique (§34).

   La connexion est ouverte PARESSEUSEMENT : sans DATABASE_URL,
   l'application se construit et se deploie quand meme, et affiche
   un ecran « configuration requise » au lieu de planter au build.
   ========================================================== */

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "La base de donnees n'est pas configuree : la variable d'environnement " +
      "DATABASE_URL est absente.",
    );
    this.name = "DatabaseNotConfiguredError";
  }
}

export const isDbConfigured = (): boolean => Boolean(process.env.DATABASE_URL);

// Node fournit WebSocket depuis la v22 ; on complete sinon.
if (typeof globalThis.WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

/** Une seule pool par processus, y compris entre les rechargements du mode dev. */
const globalForDb = globalThis as unknown as {
  __btpPool?: Pool;
  __btpDb?: ReturnType<typeof drizzle<typeof schema>>;
};

function connect() {
  if (!process.env.DATABASE_URL) throw new DatabaseNotConfiguredError();
  if (globalForDb.__btpDb) return globalForDb.__btpDb;

  const pool =
    globalForDb.__btpPool ??
    new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  const instance = drizzle(pool, { schema });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__btpPool = pool;
    globalForDb.__btpDb = instance;
  }
  return instance;
}

type DrizzleDb = ReturnType<typeof connect>;

/**
 * Meme surface qu'un client Drizzle, mais la connexion n'est ouverte
 * qu'au premier appel reel. `import { db }` ne touche pas au reseau.
 */
export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop, receiver) {
    const value = Reflect.get(connect() as object, prop, receiver);
    return typeof value === "function" ? value.bind(connect()) : value;
  },
}) as DrizzleDb;

export type Db = DrizzleDb;
/** Type accepte aussi bien par `db` que par le `tx` d'une transaction. */
export type Executor = Db | Parameters<Parameters<Db["transaction"]>[0]>[0];

/** Ferme la pool — utilise par les scripts en ligne de commande. */
export async function closePool(): Promise<void> {
  await globalForDb.__btpPool?.end();
}

export { schema };
