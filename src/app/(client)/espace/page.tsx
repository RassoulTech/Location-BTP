import Link from "next/link";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, rentals } from "@/db/schema";
import { requireUserPage } from "@/lib/auth/guard";
import { formatDate, money } from "@/lib/format";
import { RENTAL_LABELS } from "@/lib/labels";
import { Alert, Badge, ButtonLink, EmptyState, PageHeader, Panel, StatGrid, StatTile, Table, TableWrap, Td, Th } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tableau de bord" };

export default async function ClientDashboard() {
  const user = await requireUserPage("/espace");

  const [customer] = await db.select().from(customers)
    .where(eq(customers.userId, user.id)).limit(1);

  if (!customer) {
    return (
      <>
        <PageHeader eyebrow="Espace client" title={`Bonjour ${user.firstName}`} />
        <Alert tone="warn" title="Aucune fiche client rattachee">
          Votre compte existe, mais il n'est relie a aucune fiche client — ce qui
          arrive pour un compte interne. Une demande de location doit partir d'une
          fiche client.
        </Alert>
      </>
    );
  }

  const [recent, counts] = await Promise.all([
    db.select().from(rentals)
      .where(eq(rentals.customerId, customer.id))
      .orderBy(desc(rentals.submittedAt)).limit(6),
    db.select({
      status: rentals.status,
      n: sql<number>`count(*)::int`,
      total: sql<number>`coalesce(sum(${rentals.totalAmount}),0)::bigint`,
    })
      .from(rentals).where(eq(rentals.customerId, customer.id))
      .groupBy(rentals.status),
  ]);

  const by = (statuses: string[]) =>
    counts.filter((c) => statuses.includes(c.status)).reduce((a, c) => a + c.n, 0);

  const engaged = counts
    .filter((c) => ["confirmed", "active", "returned"].includes(c.status))
    .reduce((a, c) => a + Number(c.total), 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={`Client ${customer.reference}`}
        title={`Bonjour ${user.firstName}`}
        description="Vos demandes, leur statut et ce qui vous attend."
        actions={<ButtonLink href="/materiels" tone="gold">Louer du materiel</ButtonLink>}
      />

      <StatGrid>
        <StatTile label="En attente" value={by(["pending"])} tone="warn"
                  hint="Demandes a valider" />
        <StatTile label="En cours" value={by(["active"])} tone="ok"
                  hint="Materiel sorti" />
        <StatTile label="A venir" value={by(["approved", "awaiting_payment", "confirmed"])}
                  tone="info" hint="Validees, pas encore sorties" />
        <StatTile label="Engage" value={money(engaged)}
                  hint="Total TTC des locations en cours" />
      </StatGrid>

      <Panel
        title="Dernieres demandes"
        actions={recent.length ? <ButtonLink href="/espace/locations">Tout voir</ButtonLink> : null}
      >
        {recent.length === 0 ? (
          <EmptyState title="Aucune demande pour le moment">
            Choisissez une machine dans le parc : un exemplaire vous est reserve
            des l'envoi de la demande.{" "}
            <Link href="/materiels" className="underline">Voir le parc</Link>
          </EmptyState>
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Reference</Th><Th>Periode</Th><Th>Statut</Th>
                  <Th align="right">Total TTC</Th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => {
                  const s = RENTAL_LABELS[r.status];
                  return (
                    <tr key={r.id}>
                      <Td>
                        <Link href={`/espace/locations`} className="font-semibold text-ink hover:underline">
                          {r.reference}
                        </Link>
                      </Td>
                      <Td>{formatDate(r.startDate)} → {formatDate(r.endDate)}</Td>
                      <Td><Badge tone={s?.tone}>{s?.label ?? r.status}</Badge></Td>
                      <Td align="right" className="tabular font-semibold text-ink">
                        {money(r.totalAmount)}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Panel>
    </div>
  );
}
