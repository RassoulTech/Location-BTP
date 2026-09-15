import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { requireUserPage } from "@/lib/auth/guard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Espace client" };

export default async function EspacePage() {
  const user = await requireUserPage("/espace");
  const [customer] = await db.select().from(customers)
    .where(eq(customers.userId, user.id)).limit(1);

  return (
    <>
      <header className="section-head reveal in">
        <p className="overline">Espace client</p>
        <h1>Bonjour <em>{user.firstName}.</em></h1>
        <p className="section-lede">
          Vos demandes, vos locations et vos documents, au même endroit.
        </p>
      </header>

      <section className="section">
        <dl className="hero-kpi">
          <div>
            <dt>0</dt>
            <dd>demandes en attente</dd>
          </div>
          <div>
            <dt>0</dt>
            <dd>locations en cours</dd>
          </div>
          <div>
            <dt>{customer?.reference ?? "—"}</dt>
            <dd>votre numéro client</dd>
          </div>
        </dl>

        {/* Tant que le parcours de reservation n'est pas branche sur la
            base (etape 3), on le dit au lieu d'afficher un faux tableau. */}
        <div className="sig-card" style={{ marginTop: "2rem" }}>
          <h3>Vos demandes arrivent bientôt ici</h3>
          <p>
            Le suivi des demandes de location est en cours de branchement. En attendant,
            vos demandes passent par la page{" "}
            <Link href="/reservation">Réservation</Link> du site et par la conciergerie.
          </p>
        </div>
      </section>
    </>
  );
}
