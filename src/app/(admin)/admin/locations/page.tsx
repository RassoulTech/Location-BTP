import Link from "next/link";
import { desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { customers, rentals } from "@/db/schema";
import { requirePermissionPage } from "@/lib/auth/guard";
import { formatDate, formatDateTime, money } from "@/lib/format";
import { DELIVERY_LABELS, RENTAL_LABELS } from "@/lib/labels";
import {
  Badge, EmptyState, PageHeader, Panel, Table, TableWrap, Td, Th,
} from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Locations" };

const STATUSES = Object.keys(RENTAL_LABELS);

export default async function AdminRentalsPage({
  searchParams,
}: { searchParams: Promise<{ statut?: string; q?: string }> }) {
  await requirePermissionPage("rentals.view", "/admin/locations");
  const sp = await searchParams;

  const filters: SQL[] = [];
  if (sp.statut && STATUSES.includes(sp.statut)) {
    filters.push(eq(rentals.status, sp.statut as typeof rentals.$inferSelect["status"]));
  }
  if (sp.q?.trim()) {
    const q = `%${sp.q.trim()}%`;
    const clause = or(
      ilike(rentals.reference, q),
      ilike(customers.reference, q),
      ilike(customers.companyName, q),
      ilike(customers.contactLastName, q),
    );
    if (clause) filters.push(clause);
  }

  const rows = await db.select({
    id: rentals.id, reference: rentals.reference, status: rentals.status,
    startDate: rentals.startDate, endDate: rentals.endDate,
    deliveryMode: rentals.deliveryMode, totalAmount: rentals.totalAmount,
    submittedAt: rentals.submittedAt,
    customerRef: customers.reference, companyName: customers.companyName,
    contactFirstName: customers.contactFirstName, contactLastName: customers.contactLastName,
  })
    .from(rentals)
    .innerJoin(customers, eq(customers.id, rentals.customerId))
    .where(filters.length ? (filters.length === 1 ? filters[0] : undefined) : undefined)
    .orderBy(desc(rentals.submittedAt))
    .limit(200);

  const filtered = rows.filter((r) => {
    if (sp.statut && STATUSES.includes(sp.statut) && r.status !== sp.statut) return false;
    if (sp.q?.trim()) {
      const q = sp.q.trim().toLowerCase();
      const hay = [r.reference, r.customerRef, r.companyName, r.contactLastName]
        .filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Administration"
        title="Locations"
        description="Demandes, validations, sorties et retours."
      />

      <Panel title="Recherche et filtre">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
            <label htmlFor="q" className="text-[12px] font-semibold text-ink-2">Recherche</label>
            <input id="q" name="q" defaultValue={sp.q ?? ""}
                   placeholder="Reference, client…"
                   className="w-full border border-rule-firm bg-surface px-3 py-2 text-[14px] text-ink" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="statut" className="text-[12px] font-semibold text-ink-2">Statut</label>
            <select id="statut" name="statut" defaultValue={sp.statut ?? ""}
                    className="border border-rule-firm bg-surface px-3 py-2 text-[14px] text-ink">
              <option value="">Tous</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{RENTAL_LABELS[s]?.label ?? s}</option>
              ))}
            </select>
          </div>
          <button type="submit"
                  className="border border-ink bg-ink px-4 py-2 text-[13px] font-semibold text-paper">
            Filtrer
          </button>
        </form>
      </Panel>

      <Panel title={`${filtered.length} location(s)`}>
        {filtered.length === 0 ? (
          <EmptyState title="Aucune location">
            Aucun resultat pour ce filtre.
          </EmptyState>
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Reference</Th><Th>Client</Th><Th>Periode</Th>
                  <Th>Mise a dispo.</Th><Th>Statut</Th><Th align="right">Total TTC</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => {
                  const s = RENTAL_LABELS[r.status];
                  return (
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
                      <Td>
                        {r.companyName ?? `${r.contactFirstName} ${r.contactLastName}`}
                        <span className="block text-[12px] text-ink-3">{r.customerRef}</span>
                      </Td>
                      <Td>{formatDate(r.startDate)} → {formatDate(r.endDate)}</Td>
                      <Td>{DELIVERY_LABELS[r.deliveryMode]}</Td>
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
