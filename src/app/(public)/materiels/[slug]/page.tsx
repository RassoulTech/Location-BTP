import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { equipmentCategories, equipmentTypes } from "@/db/schema";
import { availableUnits, fleetByType } from "@/lib/availability";
import { currentUser } from "@/lib/auth/session";
import { addDays, formatDate, money, moneyShort, todayISO } from "@/lib/format";
import { UNIT_CONDITION_LABELS } from "@/lib/labels";
import { PricingError, computeRentalQuote } from "@/lib/pricing";
import { getPricingSettings } from "@/lib/settings";
import { Alert, Badge, ButtonLink, Panel, PageHeader } from "@/components/ui";
import { RentalRequestForm } from "./request-form";

export const dynamic = "force-dynamic";

async function loadType(slug: string) {
  const [row] = await db.select({
    type: equipmentTypes, categoryName: equipmentCategories.name,
  })
    .from(equipmentTypes)
    .innerJoin(equipmentCategories, eq(equipmentCategories.id, equipmentTypes.categoryId))
    .where(eq(equipmentTypes.slug, slug))
    .limit(1);
  return row;
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
): Promise<Metadata> {
  const { slug } = await params;
  const row = await loadType(slug);
  if (!row || row.type.isPublished !== 1) return { title: "Materiel introuvable" };
  return {
    title: row.type.seoTitle ?? row.type.name,
    description: row.type.seoDescription ?? row.type.shortDescription ?? undefined,
  };
}

export default async function EquipmentPage({
  params, searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ du?: string; au?: string }>;
}) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const row = await loadType(slug);
  if (!row || row.type.isPublished !== 1) notFound();

  const type = row.type;
  const start = /^\d{4}-\d{2}-\d{2}$/.test(sp.du ?? "") ? sp.du! : addDays(todayISO(), 1);
  const end = /^\d{4}-\d{2}-\d{2}$/.test(sp.au ?? "") && sp.au! >= start ? sp.au! : addDays(start, 6);

  const [user, settings, units, fleet] = await Promise.all([
    currentUser(),
    getPricingSettings(),
    availableUnits({ typeId: type.id, startDate: start, endDate: end }),
    fleetByType(),
  ]);

  let quote = null;
  let quoteError: string | null = null;
  try {
    quote = computeRentalQuote({
      rates: type, startDate: start, endDate: end,
      quantity: 1, withDelivery: false, settings,
    });
  } catch (err) {
    quoteError = err instanceof PricingError ? err.message : "Tarification indisponible.";
  }

  const stock = fleet.get(type.id);
  const canRequest = user?.permissions.has("rentals.create") ?? false;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow={row.categoryName}
        title={type.name}
        description={type.shortDescription ?? undefined}
        actions={<ButtonLink href={`/materiels?du=${start}&au=${end}`}>Retour au parc</ButtonLink>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        <div className="flex flex-col gap-6">
          {type.description && (
            <Panel title="Description">
              <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-ink-2">
                {type.description}
              </p>
            </Panel>
          )}

          <Panel
            title="Disponibilite sur la periode"
            description={`Du ${formatDate(start)} au ${formatDate(end)}`}
          >
            {stock == null || stock.total === 0 ? (
              <Alert tone="neutral">
                Aucun exemplaire de ce modele n'est encore enregistre dans le parc.
              </Alert>
            ) : units.length === 0 ? (
              <Alert tone="danger" title="Complet sur cette periode">
                Les {stock.total} exemplaire(s) sont deja pris — location en cours
                ou immobilisation d'atelier. Decalez les dates, ou contactez-nous.
              </Alert>
            ) : (
              <>
                <p className="mb-3 text-[13.5px] text-ink-2">
                  <strong className="text-ink">{units.length}</strong> exemplaire(s) libre(s)
                  sur {stock.total} au parc.
                </p>
                <ul className="grid gap-px border border-rule bg-rule sm:grid-cols-2">
                  {units.slice(0, 6).map((u) => (
                    <li key={u.id} className="flex items-center justify-between gap-3 bg-surface px-3.5 py-2.5">
                      <div className="min-w-0">
                        <p className="text-[13.5px] font-semibold text-ink">{u.code}</p>
                        {u.location && <p className="text-[12px] text-ink-3">{u.location}</p>}
                      </div>
                      <Badge tone="ok">{UNIT_CONDITION_LABELS[u.condition] ?? u.condition}</Badge>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <Panel title="Tarifs">
            {quoteError ? (
              <Alert tone="warn">{quoteError}</Alert>
            ) : (
              <dl className="flex flex-col gap-0">
                {[
                  ["Journalier", type.dailyRate],
                  ["Hebdomadaire", type.weeklyRate],
                  ["Mensuel", type.monthlyRate],
                  ["Caution", type.depositAmount],
                  ...(type.isSellable === 1 ? [["Prix d'achat", type.salePrice] as const] : []),
                ].map(([label, value]) => value ? (
                  <div key={label as string}
                       className="flex items-baseline justify-between gap-4 border-b border-rule py-2 last:border-0">
                    <dt className="text-[13px] text-ink-3">{label}</dt>
                    <dd className="tabular text-[14px] font-semibold text-ink">
                      {moneyShort(value as number)}
                    </dd>
                  </div>
                ) : null)}
              </dl>
            )}
          </Panel>

          {quote && (
            <Panel
              title="Estimation"
              description={`${quote.days} jour(s), 1 exemplaire, retrait en agence`}
            >
              <dl className="flex flex-col gap-0 text-[13.5px]">
                <Row label={`Location (${quote.lines.billedUnits} × ${money(quote.lines.unitRate)})`}
                     value={money(quote.subtotal)} />
                {quote.discount > 0 && (
                  <Row label={`Remise duree (${quote.discountBp / 100} %)`}
                       value={`− ${money(quote.discount)}`} />
                )}
                <Row label={`TVA ${quote.vatRateBp / 100} %`} value={money(quote.vat)} />
                <Row label="Total TTC" value={money(quote.total)} strong />
                {quote.deposit > 0 && (
                  <Row label="Caution (restituee)" value={money(quote.deposit)} />
                )}
              </dl>
              <p className="mt-3 text-[12px] text-ink-3">
                Montant recalcule cote serveur a l'envoi de la demande. La livraison,
                si vous la choisissez, s'ajoute au total.
              </p>
            </Panel>
          )}

          {canRequest ? (
            units.length > 0 ? (
              <Panel title="Demander cette machine">
                <RentalRequestForm
                  typeId={type.id}
                  startDate={start}
                  endDate={end}
                  maxQuantity={Math.min(units.length, 20)}
                  minDate={addDays(todayISO(), settings.minLeadDays)}
                />
              </Panel>
            ) : null
          ) : (
            <Panel title="Reserver">
              <p className="text-[13.5px] text-ink-2">
                Connectez-vous pour envoyer une demande. Un exemplaire precis vous
                est alors reserve immediatement, en attente de validation.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <ButtonLink href={`/connexion?suite=/materiels/${type.slug}`} tone="gold">
                  Se connecter
                </ButtonLink>
                <ButtonLink href="/inscription">Creer un compte</ButtonLink>
              </div>
            </Panel>
          )}
        </div>
      </div>

      <p className="text-[12.5px] text-ink-3">
        Une question sur ce materiel ?{" "}
        <Link href="/contact" className="underline">Contactez-nous</Link>.
      </p>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-rule py-2 last:border-0">
      <dt className={strong ? "font-semibold text-ink" : "text-ink-3"}>{label}</dt>
      <dd className={`tabular ${strong ? "text-[15px] font-bold text-ink" : "font-medium text-ink-2"}`}>
        {value}
      </dd>
    </div>
  );
}
