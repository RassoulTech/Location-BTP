import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, rentals } from "@/db/schema";
import { requirePermissionPage } from "@/lib/auth/guard";
import { formatDate, money } from "@/lib/format";
import {
  Badge, EmptyState, PageHeader, Panel, Table, TableWrap, Td, Th,
} from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Clients" };

export default async function AdminCustomersPage({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  await requirePermissionPage("customers.view", "/admin/clients");
  const sp = await searchParams;

  const rows = await db.select({
    customer: customers,
    rentalCount: sql<number>`count(${rentals.id})::int`,
    engaged: sql<number>`coalesce(sum(${rentals.totalAmount}) FILTER (
      WHERE ${rentals.status} IN ('confirmed','active','returned','completed')), 0)::bigint`,
    lastRental: sql<string | null>`max(${rentals.startDate})::text`,
  })
    .from(customers)
    .leftJoin(rentals, eq(rentals.customerId, customers.id))
    .groupBy(customers.id)
    .orderBy(desc(customers.createdAt))
    .limit(300);

  const q = sp.q?.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) =>
        [r.customer.reference, r.customer.companyName, r.customer.contactFirstName,
         r.customer.contactLastName, r.customer.phone, r.customer.email]
          .filter(Boolean).join(" ").toLowerCase().includes(q))
    : rows;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Administration"
        title="Clients"
        description="Fiches clients et volume d'activite associe."
      />

      <Panel title="Recherche">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
            <label htmlFor="q" className="text-[12px] font-semibold text-ink-2">
              Nom, reference, telephone
            </label>
            <input id="q" name="q" defaultValue={sp.q ?? ""}
                   className="w-full border border-rule-firm bg-surface px-3 py-2 text-[14px] text-ink" />
          </div>
          <button type="submit"
                  className="border border-ink bg-ink px-4 py-2 text-[13px] font-semibold text-paper">
            Rechercher
          </button>
        </form>
      </Panel>

      <Panel title={`${filtered.length} client(s)`}>
        {filtered.length === 0 ? (
          <EmptyState title="Aucun client">
            Une fiche client est creee automatiquement a chaque inscription.
          </EmptyState>
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Reference</Th><Th>Client</Th><Th>Contact</Th>
                  <Th>Locations</Th><Th align="right">Engage</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ customer: c, rentalCount, engaged, lastRental }) => (
                  <tr key={c.id}>
                    <Td>
                      <span className="font-semibold text-ink">{c.reference}</span>
                      <Badge tone="neutral">
                        {c.type === "company" ? "Entreprise" : "Particulier"}
                      </Badge>
                    </Td>
                    <Td>
                      {c.companyName ?? `${c.contactFirstName} ${c.contactLastName}`}
                      {c.companyName && (
                        <span className="block text-[12px] text-ink-3">
                          {c.contactFirstName} {c.contactLastName}
                        </span>
                      )}
                    </Td>
                    <Td>
                      {c.phone}
                      {c.email && <span className="block text-[12px] text-ink-3">{c.email}</span>}
                    </Td>
                    <Td>
                      <span className="tabular">{rentalCount}</span>
                      {lastRental && (
                        <span className="block text-[12px] text-ink-3">
                          derniere : {formatDate(lastRental)}
                        </span>
                      )}
                    </Td>
                    <Td align="right" className="tabular font-semibold text-ink">
                      {money(Number(engaged))}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Panel>
    </div>
  );
}
