import { sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, users } from "@/db/schema";
import { requireUserPage } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Administration" };

/** Compte reellement les lignes : aucune statistique inventee (CDC §56). */
async function count(table: typeof users | typeof customers): Promise<number> {
  const rows = await db.execute<{ n: number }>(sql`SELECT count(*)::int AS n FROM ${table}`);
  return (rows.rows as { n: number }[])[0]?.n ?? 0;
}

export default async function AdminPage() {
  const user = await requireUserPage("/admin");
  const [nbUsers, nbCustomers] = await Promise.all([count(users), count(customers)]);

  return (
    <>
      <header className="section-head reveal in">
        <p className="overline">Administration</p>
        <h1>Tableau de <em>bord.</em></h1>
        <p className="section-lede">
          Connecté en tant que {user.firstName} {user.lastName} — rôles&nbsp;:{" "}
          {user.roles.join(", ") || "aucun"}.
        </p>
      </header>

      <section className="section">
        <dl className="hero-kpi">
          <div><dt>{nbCustomers}</dt><dd>fiches clients</dd></div>
          <div><dt>{nbUsers}</dt><dd>comptes</dd></div>
          <div><dt>{user.permissions.length}</dt><dd>permissions actives</dd></div>
        </dl>

        <div className="sig-card" style={{ marginTop: "2rem" }}>
          <h3>Étape 1 sur 5 — la connexion</h3>
          <p>
            Comptes, rôles, permissions et sessions sont en place. Les écrans de gestion
            (demandes, locations, parc, clients, messages) arrivent à l&rsquo;étape 2 ;
            le branchement du site public à l&rsquo;étape 3.
          </p>
        </div>
      </section>
    </>
  );
}
