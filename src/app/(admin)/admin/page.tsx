import Link from "next/link";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  activityLogs, customers, equipmentUnits, maintenanceRecords, rentals,
} from "@/db/schema";
import { requireUserPage } from "@/lib/auth/guard";
import { formatDate, formatDateTime, money, todayISO } from "@/lib/format";
import { RENTAL_LABELS } from "@/lib/labels";
import {
  Alert, Badge, ButtonLink, EmptyState, PageHeader, Panel,
  StatGrid, StatTile, Table, TableWrap, Td, Th,
} from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Tableau de bord" };

export default async function AdminDashboard() {
  await requireUserPage("/admin");

  const [rentalStats, unitStats, customerCount, pending, recentLogs, endingSoon] =
    await Promise.all([
      db.select({
        status: rentals.status,
        n: sql<number>`count(*)::int`,
        total: sql<number>`coalesce(sum(${rentals.totalAmount}),0)::bigint`,
      }).from(rentals).groupBy(rentals.status),

      db.select({
        status: equipmentUnits.status, n: sql<number>`count(*)::int`,
      }).from(equipmentUnits).groupBy(equipmentUnits.status),

      db.select({ n: sql<number>`count(*)::int` }).from(customers),

      db.select({
        id: rentals.id, reference: rentals.reference, startDate: rentals.startDate,
        endDate: rentals.endDate, totalAmount: rentals.totalAmount,
        submittedAt: rentals.submittedAt, customer: customers.reference,
        companyName: customers.companyName,
        contactLastName: customers.contactLastName,
      })
        .from(rentals)
        .innerJoin(customers, eq(customers.id, rentals.customerId))
        .where(eq(rentals.status, "pending"))
        .orderBy(desc(rentals.submittedAt)).limit(8),

      db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(8),

      db.select({
        id: rentals.id, reference: rentals.reference, endDate: rentals.endDate,
        customer: customers.reference,
      })
        .from(rentals)
        .innerJoin(customers, eq(customers.id, rentals.customerId))
        .where(and(eq(rentals.status, "active"), gte(rentals.endDate, todayISO())))
        .orderBy(rentals.endDate).limit(6),
    ]);

  const nb = (statuses: string[]) =>
    rentalStats.filter((r) => statuses.includes(r.status)).reduce((a, r) => a + r.n, 0);
  const units = (statuses: string[]) =>
    unitStats.filter((u) => statuses.includes(u.status)).reduce((a, u) => a + u.n, 0);

  const revenue = rentalStats
    .filter((r) => ["active", "returned", "completed"].includes(r.status))
    .reduce((a, r) => a + Number(r.total), 0);

  const totalUnits = unitStats.reduce((a, u) => a + u.n, 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Administration"
        title="Vue d'ensemble"
        description="Tous les chiffres ci-dessous sont lus dans la base. Aucune valeur de demonstration."
        actions={<ButtonLink href="/admin/locations" tone="gold">Voir les locations</ButtonLink>}
      />

      <StatGrid>
        <StatTile label="A valider" value={nb(["pending"])} tone={nb(["pending"]) ? "warn" : "neutral"}
                  hint="Demandes en attente" />
        <StatTile label="En cours" value={nb(["active"])} tone="ok" hint="Materiel sorti" />
        <StatTile label="Parc" value={totalUnits} hint="Exemplaires enregistres" />
        <StatTile label="Disponibles" value={units(["available"])} tone="ok"
                  hint="Hors atelier, hors location" />
        <StatTile label="Atelier" value={units(["maintenance"])}
                  tone={units(["maintenance"]) ? "danger" : "neutral"} hint="Non louables" />
        <StatTile label="Clients" value={customerCount[0]?.n ?? 0} />
      </StatGrid>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <Panel
          title="Demandes a valider"
          description="Chaque demande bloque deja un exemplaire : traitez-les vite."
          actions={<ButtonLink href="/admin/locations?statut=pending">Tout voir</ButtonLink>}
        >
          {pending.length === 0 ? (
            <EmptyState title="Rien a valider">
              Les nouvelles demandes apparaitront ici des leur envoi.
            </EmptyState>
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Reference</Th><Th>Client</Th><Th>Periode</Th>
                    <Th align="right">Total TTC</Th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((r) => (
                    <tr key={r.id}>
                      <Td>
                        <Link href={`/admin/locations/${r.id}`}
                              className="font-semibold text-ink hover:underline">
                          {r.reference}
                        </Link>
                        <span className="block text-[12px] text-ink-3">
                          {formatDateTime(r.submittedAt)}
                        </span>
                      </Td>
                      <Td>{r.companyName ?? r.contactLastName}</Td>
                      <Td>{formatDate(r.startDate)} → {formatDate(r.endDate)}</Td>
                      <Td align="right" className="tabular font-semibold text-ink">
                        {money(r.totalAmount)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </Panel>

        <div className="flex flex-col gap-6">
          <Panel title="Retours attendus">
            {endingSoon.length === 0 ? (
              <p className="text-[13.5px] text-ink-3">Aucune location en cours.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {endingSoon.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 text-[13.5px]">
                    <Link href={`/admin/locations/${r.id}`} className="font-medium text-ink hover:underline">
                      {r.reference}
                    </Link>
                    <Badge tone={r.endDate <= todayISO() ? "danger" : "info"}>
                      {formatDate(r.endDate)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Chiffre engage">
            <p className="tabular text-[28px] font-bold leading-none text-ink">{money(revenue)}</p>
            <p className="mt-2 text-[13px] text-ink-3">
              Total TTC des locations sorties, rendues ou cloturees. Hors demandes
              en attente et hors annulations.
            </p>
          </Panel>
        </div>
      </div>

      <Panel
        title="Activite recente"
        actions={<ButtonLink href="/admin/journal">Journal complet</ButtonLink>}
      >
        {recentLogs.length === 0 ? (
          <p className="text-[13.5px] text-ink-3">Aucune action enregistree.</p>
        ) : (
          <ul className="flex flex-col">
            {recentLogs.map((log) => (
              <li key={log.id}
                  className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule py-2 text-[13px] last:border-0">
                <span className="font-medium text-ink-2">
                  {log.action}
                  <span className="ml-2 font-normal text-ink-3">{log.entityType}</span>
                </span>
                <span className="text-ink-3">
                  {log.actorLabel ?? "Systeme"} · {formatDateTime(log.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {totalUnits === 0 && (
        <Alert tone="info" title="Le parc est vide">
          Commencez par creer une categorie, un modele de materiel, puis au moins
          un exemplaire physique dans{" "}
          <Link href="/admin/materiels" className="underline">Parc materiel</Link>.
          Sans exemplaire, aucune location n'est possible.
        </Alert>
      )}
    </div>
  );
}
