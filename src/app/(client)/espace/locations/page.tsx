import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { customers, equipmentTypes, rentalItems, rentals } from "@/db/schema";
import { requireUserPage } from "@/lib/auth/guard";
import { formatDate, money } from "@/lib/format";
import { DELIVERY_LABELS, RENTAL_ITEM_LABELS, RENTAL_LABELS } from "@/lib/labels";
import { cancelRentalAction } from "@/lib/actions/rentals";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Alert, Badge, ButtonLink, EmptyState, PageHeader, Panel } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mes locations" };

const CANCELLABLE = ["pending", "approved", "awaiting_payment"];

export default async function ClientRentalsPage() {
  const user = await requireUserPage("/espace/locations");

  const [customer] = await db.select().from(customers)
    .where(eq(customers.userId, user.id)).limit(1);

  if (!customer) {
    return (
      <>
        <PageHeader eyebrow="Espace client" title="Mes locations" />
        <Alert tone="warn">Aucune fiche client n'est rattachee a votre compte.</Alert>
      </>
    );
  }

  const rows = await db.select().from(rentals)
    .where(eq(rentals.customerId, customer.id))
    .orderBy(desc(rentals.submittedAt));

  const lines = rows.length
    ? await db
        .select({ item: rentalItems, typeName: equipmentTypes.name })
        .from(rentalItems)
        .innerJoin(equipmentTypes, eq(equipmentTypes.id, rentalItems.typeId))
        .where(inArray(rentalItems.rentalId, rows.map((r) => r.id)))
    : [];

  const itemsByRental = new Map<string, typeof lines>();
  for (const line of lines) {
    const list = itemsByRental.get(line.item.rentalId) ?? [];
    list.push(line);
    itemsByRental.set(line.item.rentalId, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Espace client"
        title="Mes locations"
        description="Chaque demande, son statut et les exemplaires qui vous sont affectes."
        actions={<ButtonLink href="/materiels" tone="gold">Nouvelle demande</ButtonLink>}
      />

      {rows.length === 0 ? (
        <EmptyState title="Aucune location">
          Vos demandes apparaitront ici des la premiere envoyee.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((r) => {
            const s = RENTAL_LABELS[r.status];
            const rentalLines = itemsByRental.get(r.id) ?? [];
            return (
              <Panel
                key={r.id}
                title={
                  <span className="flex flex-wrap items-center gap-2.5">
                    {r.reference}
                    <Badge tone={s?.tone}>{s?.label ?? r.status}</Badge>
                  </span>
                }
                description={`${formatDate(r.startDate)} → ${formatDate(r.endDate)} · ${DELIVERY_LABELS[r.deliveryMode]}`}
                actions={
                  CANCELLABLE.includes(r.status) ? (
                    <ActionForm action={cancelRentalAction} hidden={{ rentalId: r.id }}
                                className="contents">
                      <SubmitButton tone="danger">Annuler</SubmitButton>
                    </ActionForm>
                  ) : null
                }
              >
                <div className="grid gap-5 sm:grid-cols-[1.4fr_1fr]">
                  <div>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
                      Materiel affecte
                    </p>
                    {rentalLines.length === 0 ? (
                      <p className="text-[13.5px] text-ink-3">Aucun exemplaire affecte.</p>
                    ) : (
                      <ul className="flex flex-col gap-1.5">
                        {rentalLines.map((l) => {
                          const ls = RENTAL_ITEM_LABELS[l.item.status];
                          return (
                            <li key={l.item.id} className="flex items-center justify-between gap-3 text-[13.5px]">
                              <span className="text-ink-2">{l.typeName}</span>
                              <Badge tone={ls?.tone}>{ls?.label ?? l.item.status}</Badge>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    {r.siteAddress && (
                      <p className="mt-3 text-[13px] text-ink-3">
                        Livraison : {r.siteAddress}{r.siteCity ? `, ${r.siteCity}` : ""}
                      </p>
                    )}
                    {r.rejectionReason && (
                      <p className="mt-3 text-[13px] font-medium text-danger">
                        Motif du rejet : {r.rejectionReason}
                      </p>
                    )}
                  </div>

                  <dl className="flex flex-col text-[13.5px]">
                    {[
                      ["Sous-total", money(r.subtotalAmount)],
                      ...(r.discountAmount ? [["Remise", `− ${money(r.discountAmount)}`]] : []),
                      ...(r.deliveryAmount ? [["Livraison", money(r.deliveryAmount)]] : []),
                      ["TVA", money(r.taxAmount)],
                      ["Total TTC", money(r.totalAmount)],
                      ...(r.depositAmount ? [["Caution", money(r.depositAmount)]] : []),
                    ].map(([label, value]) => (
                      <div key={label}
                           className={`flex items-baseline justify-between gap-4 border-b border-rule py-1.5 last:border-0 ${
                             label === "Total TTC" ? "font-semibold text-ink" : "text-ink-3"
                           }`}>
                        <dt>{label}</dt>
                        <dd className="tabular font-medium text-ink-2">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
