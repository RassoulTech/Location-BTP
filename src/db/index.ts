import "server-only";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-serverless";
import { Pool as PgPool } from "pg";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import ws from "ws";
import * as schema from "./schema";

/* ==========================================================
   Client de base de donnees.

   Deux pilotes, une seule interface :

   - Neon (production) → `neon-serverless`, en WebSocket. Pas
     `neon-http` : le pilote HTTP ne sait pas faire de
     transaction, alors que le cahier des charges en exige
     (CDC §34).
   - PostgreSQL classique (developpement) → `node-postgres`.
     C'est ce qui permet de developper et de tester en local
     sans dependre du reseau, et de rejouer les memes migrations
     avant de toucher a la base reelle (CDC §69).

   Le pilote est choisi d'apres l'hote de la chaine de
   connexion. Le reste de l'application ne voit aucune
   difference.

   La connexion est PARESSEUSE : tant qu'aucune requete n'est
   faite, rien n'est ouvert. C'est ce qui permet au build de
   passer sans `DATABASE_URL`.
   ========================================================== */

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super(
      "DATABASE_URL n'est pas définie. L'application ne peut lire aucune donnée " +
      "tant que la base n'est pas branchée.",
    );
    this.name = "DatabaseNotConfiguredError";
  }
}

export const isDbConfigured = (): boolean => Boolean(process.env.DATABASE_URL);

/* En Node classique le pilote Neon a besoin d'une implementation
   de WebSocket ; sur Vercel elle est native. */
if (typeof globalThis.WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

type DrizzleDb = ReturnType<typeof drizzleNeon<typeof schema>>;

const globalForDb = globalThis as unknown as {
  __btpPool?: { end: () => Promise<void> };
  __btpDb?: DrizzleDb;
};

const isNeonUrl = (url: string) => /\.neon\.tech(?::|\/|$)/i.test(url);

function connect(): DrizzleDb {
  if (globalForDb.__btpDb) return globalForDb.__btpDb;

  const url = process.env.DATABASE_URL;
  if (!url) throw new DatabaseNotConfiguredError();

  let pool: { end: () => Promise<void> };
  let db: DrizzleDb;

  if (isNeonUrl(url)) {
    const p = new NeonPool({ connectionString: url });
    pool = p;
    db = drizzleNeon(p, { schema });
  } else {
    const p = new PgPool({ connectionString: url });
    pool = p;
    db = drizzlePg(p, { schema }) as unknown as DrizzleDb;
  }

  /* En developpement, Next recharge les modules a chaque
     modification : sans ce cache global on ouvrirait un pool
     par rechargement. */
  globalForDb.__btpPool = pool;
  globalForDb.__btpDb = db;
  return db;
}

/** Proxy : la connexion ne s'ouvre qu'au premier acces reel. */
export const db = new Proxy({} as DrizzleDb, {
  get(_target, prop, receiver) {
    const real = connect();
    const value = Reflect.get(real as object, prop, receiver);
    return typeof value === "function" ? value.bind(real) : value;
  },
}) as DrizzleDb;

export type Executor = DrizzleDb | Parameters<Parameters<DrizzleDb["transaction"]>[0]>[0];

export async function closePool(): Promise<void> {
  await globalForDb.__btpPool?.end();
  globalForDb.__btpPool = undefined;
  globalForDb.__btpDb = undefined;
}
