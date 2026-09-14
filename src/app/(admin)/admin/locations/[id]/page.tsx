import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  customers, equipmentTypes, equipmentUnits, rentalItems, rentalReturns, rentals, users,
} from "@/db/schema";
import { requirePermissionPage, has } from "@/lib/auth/guard";
import { formatDate, formatDateTime, money } from "@/lib/format";
import {
  DELIVERY_LABELS, RATE_BASIS_LABELS, RENTAL_ITEM_LABELS, RENTAL_LABELS,
} from "@/lib/labels";
import { RENTAL_TRANSITIONS } from "@/lib/status";
import {
  activateRentalAction, approveRentalAction, cancelRentalAction,
  completeRentalAction, confirmRentalAction, rejectRentalAction,
} from "@/lib/actions/rentals";
import { ActionForm, SubmitButton } from "@/components/action-form";
import {
  Alert, Badge, ButtonLink, Field, PageHeader, Panel, Textarea,
} from "@/components/ui";
import { ReturnForm } from "./return-form";

export const dynamic = "force-dynamic";

export default async function RentalDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePermissionPage("rentals.view", `/admin/locations/${id}`);

  const [row] = await db.select({ rental: rentals, customer: customers })
    .from(rentals)
    .innerJoin(customers, eq(customers.id, rentals.customerId))
    .where(eq(rentals.id, id)).limit(1);
  if (!row) notFound();

  const { rental, customer } = row;

  const [lines, decider] = await Promise.all([
    db.select({
      item: rentalItems, typeName: equipmentTypes.name,
      unitCode: equipmentUnits.code, unitStatus: equipmentUnits.status,
    })
      .from(rentalItems)
      .innerJoin(equipmentTypes, eq(equipmentTypes.id, rentalItems.typeId))
      .leftJoin(equipmentUnits, eq(equipmentUnits.id, rentalItems.unitId))
      .where(eq(rentalItems.rentalId, rental.id)),
    rental.decidedBy
      ? db.select({ firstName: users.firstName, lastName: users.lastName })
          .from(users).where(eq(users.id, rental.decidedBy)).limit(1)
      : Promise.resolve([]),
  ]);

  const returns = lines.length
    ? await db.select().from(rentalReturns)
        .where(eq(rentalReturns.rentalItemId, lines[0]!.item.id))
    : [];

  const status = RENTAL_LABELS[rental.status];
  const can = (to: string) =>
    (RENTAL_TRANSITIONS[rental.status] as readonly string[]).includes(to);
  const mayValidate = has(user, "rentals.validate");
  const mayReturn = has(user, "rentals.return");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Location"
        title={rental.reference}
        description={
          <>
            {customer.companyName ?? `${customer.contactFirstName} ${customer.contactLastName}`}
            {" · "}{customer.reference}{" · "}{customer.phone}
          </>
        }
        actions={<ButtonLink href="/admin/locations">Retour a la liste</ButtonLink>}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Badge tone={status?.tone}>{status?.label ?? rental.status}</Badge>
        <span className="text-[13.5px] text-ink-2">
          {formatDate(rental.startDate)} → {formatDate(rental.endDate)}
        </span>
        <span className="text-[13.5px] text-ink-3">{DELIVERY_LABELS[rental.deliveryMode]}</span>
      </div>

      {rental.rejectionReason && (
        <Alert tone="danger" title="Demande rejetee">{rental.rejectionReason}</Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="flex flex-col gap-6">
          <Panel title="Exemplaires affectes"
                 description="Chaque ligne bloque une machine precise sur la periode.">
            <ul className="flex flex-col gap-px bg-rule">
              {lines.map((l) => {
                const ls = RENTAL_ITEM_LABELS[l.item.status];
                return (
                  <li key={l.item.id} className="bg-surface px-3.5 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-ink">
                          {l.unitCode ?? "Non affecte"}
                          <span className="ml-2 font-normal text-ink-3">{l.typeName}</span>
                        </p>
                        <p className="tabular mt-0.5 text-[12.5px] text-ink-3">
                          {RATE_BASIS_LABELS[l.item.rateBasis]} · {l.item.billedUnits} ×{" "}
                          {money(l.item.unitRate)} = {money(l.item.lineAmount)}
                        </p>
                      </div>
                      <Badge tone={ls?.tone}>{ls?.label ?? l.item.status}</Badge>
                    </div>

                    {mayReturn && l.item.status === "active" && (
                      <div className="mt-3 border-t border-rule pt-3">
                        <ReturnForm rentalItemId={l.item.id} unitCode={l.unitCode ?? ""} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </Panel>

          {rental.customerNote && (
            <Panel title="Precisions du client">
              <p className="whitespace-pre-line text-[14px] text-ink-2">{rental.customerNote}</p>
            </Panel>
          )}

          {returns.length > 0 && (
            <Panel title="Retours enregistres">
              <ul className="flex flex-col gap-2 text-[13.5px]">
                {returns.map((r) => (
                  <li key={r.id} className="border-b border-rule pb-2 last:border-0">
                    <p className="text-ink-2">
                      {formatDateTime(r.returnedAt)}
                      {r.hourMeter != null && ` · ${r.hourMeter} h compteur`}
                      {r.damageAmount > 0 && ` · dommages ${money(r.damageAmount)}`}
                    </p>
                    {r.damageDescription && (
                      <p className="mt-0.5 text-ink-3">{r.damageDescription}</p>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Montants" description="Calcules par le serveur a la creation.">
            <dl className="flex flex-col text-[13.5px]">
              {([
                ["Sous-total", rental.subtotalAmount],
                ["Remise duree", rental.discountAmount ? -rental.discountAmount : 0],
                ["Livraison", rental.deliveryAmount],
                ["TVA", rental.taxAmount],
                ["Total TTC", rental.totalAmount],
                ["Caution", rental.depositAmount],
              ] as [string, number][])
                .filter(([label, v]) => v !== 0 || label === "Total TTC")
                .map(([label, value]) => (
                  <div key={label}
                       className={`flex items-baseline justify-between gap-4 border-b border-rule py-2 last:border-0 ${
                         label === "Total TTC" ? "font-semibold text-ink" : "text-ink-3"
                       }`}>
                    <dt>{label}</dt>
                    <dd className="tabular font-medium text-ink-2">{money(value)}</dd>
                  </div>
                ))}
            </dl>
          </Panel>

          {mayValidate && (
            <Panel title="Decision" description="Les transitions impossibles ne sont pas proposees.">
              <div className="flex flex-col gap-3">
                {can("approved") && (
                  <ActionForm action={approveRentalAction} hidden={{ rentalId: rental.id }}
                              className="contents">
                    <SubmitButton>Approuver la demande</SubmitButton>
                  </ActionForm>
                )}
                {can("confirmed") && (
                  <ActionForm action={confirmRentalAction} hidden={{ rentalId: rental.id }}
                              className="contents">
                    <SubmitButton>Confirmer</SubmitButton>
                  </ActionForm>
                )}
                {can("active") && (
                  <ActionForm action={activateRentalAction} hidden={{ rentalId: rental.id }}
                              className="contents">
                    <SubmitButton>Marquer sortie du materiel</SubmitButton>
                  </ActionForm>
                )}
                {can("completed") && (
                  <ActionForm action={completeRentalAction} hidden={{ rentalId: rental.id }}
                              className="contents">
                    <SubmitButton>Cloturer</SubmitButton>
                  </ActionForm>
                )}
                {can("cancelled") && (
                  <ActionForm action={cancelRentalAction} hidden={{ rentalId: rental.id }}
                              className="contents">
                    <SubmitButton tone="danger">Annuler</SubmitButton>
                  </ActionForm>
                )}

                {can("rejected") && (
                  <div className="border-t border-rule pt-3">
                    <ActionForm action={rejectRentalAction} hidden={{ rentalId: rental.id }}>
                      {(state) => (
                        <>
                          <Field label="Motif du rejet" name="reason" required
                                 error={state.errors?.reason}
                                 hint="Communique au client dans son espace.">
                            <Textarea id="reason" name="reason" required minLength={5}
                                      placeholder="Materiel deja engage, dates incompatibles…" />
                          </Field>
                          <SubmitButton tone="danger">Rejeter la demande</SubmitButton>
                        </>
                      )}
                    </ActionForm>
                  </div>
                )}

                {(RENTAL_TRANSITIONS[rental.status] as readonly string[]).length === 0 && (
                  <p className="text-[13px] text-ink-3">
                    Cette location est dans un etat final : plus aucune transition
                    n'est possible.
                  </p>
                )}
              </div>
            </Panel>
          )}

          <Panel title="Tracabilite">
            <dl className="flex flex-col text-[13px]">
              <Line label="Demande envoyee" value={formatDateTime(rental.submittedAt)} />
              <Line label="Decision" value={rental.decidedAt ? formatDateTime(rental.decidedAt) : "—"} />
              <Line label="Decidee par"
                    value={decider[0] ? `${decider[0].firstName} ${decider[0].lastName}` : "—"} />
              <Line label="Annulee le" value={rental.cancelledAt ? formatDateTime(rental.cancelledAt) : "—"} />
            </dl>
            <p className="mt-3 text-[12.5px] text-ink-3">
              Le detail complet des actions est dans le{" "}
              <Link href="/admin/journal" className="underline">journal d'activite</Link>.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule py-2 last:border-0">
      <dt className="text-ink-3">{label}</dt>
      <dd className="font-medium text-ink-2">{value}</dd>
    </div>
  );
}
