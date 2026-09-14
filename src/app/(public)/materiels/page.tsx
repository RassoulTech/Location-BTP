import Link from "next/link";
import type { Metadata } from "next";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { equipmentCategories, equipmentTypes } from "@/db/schema";
import { availabilityByType, fleetByType } from "@/lib/availability";
import { addDays, formatDate, moneyShort, todayISO } from "@/lib/format";
import { Badge, EmptyState, PageHeader, Panel } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Le parc materiel",
  description:
    "Engins de chantier disponibles a la location : disponibilite calculee " +
    "sur la periode demandee, exemplaire par exemplaire.",
};

type Search = { du?: string; au?: string; categorie?: string };

export default async function CataloguePage({
  searchParams,
}: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const start = /^\d{4}-\d{2}-\d{2}$/.test(sp.du ?? "") ? sp.du! : addDays(todayISO(), 1);
  const end = /^\d{4}-\d{2}-\d{2}$/.test(sp.au ?? "") && sp.au! >= start
    ? sp.au! : addDays(start, 6);

  const [categories, rows, free, fleet] = await Promise.all([
    db.select().from(equipmentCategories).orderBy(asc(equipmentCategories.position), asc(equipmentCategories.name)),
    db.select({
      id: equipmentTypes.id, slug: equipmentTypes.slug, name: equipmentTypes.name,
      brand: equipmentTypes.brand, model: equipmentTypes.model,
      shortDescription: equipmentTypes.shortDescription,
      dailyRate: equipmentTypes.dailyRate, weeklyRate: equipmentTypes.weeklyRate,
      salePrice: equipmentTypes.salePrice, isSellable: equipmentTypes.isSellable,
      categoryId: equipmentTypes.categoryId, categoryName: equipmentCategories.name,
      categorySlug: equipmentCategories.slug,
    })
      .from(equipmentTypes)
      .innerJoin(equipmentCategories, eq(equipmentCategories.id, equipmentTypes.categoryId))
      .where(eq(equipmentTypes.isPublished, 1))
      .orderBy(asc(equipmentCategories.position), asc(equipmentTypes.name)),
    availabilityByType({ startDate: start, endDate: end }),
    fleetByType(),
  ]);

  const filtered = sp.categorie
    ? rows.filter((r) => r.categorySlug === sp.categorie)
    : rows;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Le parc"
        title="Materiel de chantier"
        description={
          <>
            La disponibilite affichee est calculee pour la periode du{" "}
            <strong>{formatDate(start)}</strong> au <strong>{formatDate(end)}</strong>,
            locations et immobilisations d'atelier comprises.
          </>
        }
      />

      <Panel title="Periode et filtre">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="du" className="text-[12px] font-semibold text-ink-2">Du</label>
            <input id="du" name="du" type="date" defaultValue={start} min={todayISO()}
                   className="border border-rule-firm bg-surface px-3 py-2 text-[14px] text-ink" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="au" className="text-[12px] font-semibold text-ink-2">Au</label>
            <input id="au" name="au" type="date" defaultValue={end} min={start}
                   className="border border-rule-firm bg-surface px-3 py-2 text-[14px] text-ink" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="categorie" className="text-[12px] font-semibold text-ink-2">Categorie</label>
            <select id="categorie" name="categorie" defaultValue={sp.categorie ?? ""}
                    className="border border-rule-firm bg-surface px-3 py-2 text-[14px] text-ink">
              <option value="">Toutes</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
          <button type="submit"
                  className="border border-ink bg-ink px-4 py-2 text-[13px] font-semibold text-paper hover:opacity-90">
            Actualiser
          </button>
        </form>
      </Panel>

      {filtered.length === 0 ? (
        <EmptyState title="Aucun materiel publie">
          {rows.length > 0
            ? "Aucun materiel dans cette categorie. Essayez « Toutes »."
            : "Le catalogue se remplit depuis l'administration : creez une categorie, un modele, puis publiez-le."}
        </EmptyState>
      ) : (
        <ul className="grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const available = free.get(t.id) ?? 0;
            const total = fleet.get(t.id)?.total ?? 0;
            return (
              <li key={t.id} className="bg-surface">
                <Link href={`/materiels/${t.slug}?du=${start}&au=${end}`}
                      className="flex h-full flex-col p-4 hover:bg-surface-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-ink-3">{t.categoryName}</p>
                    <Badge tone={available > 0 ? "ok" : total > 0 ? "danger" : "neutral"}>
                      {total === 0 ? "Aucun exemplaire"
                        : available > 0 ? `${available} / ${total} libre${available > 1 ? "s" : ""}`
                        : "Complet"}
                    </Badge>
                  </div>
                  <p className="mt-1.5 text-[16px] font-semibold leading-snug text-ink">{t.name}</p>
                  {(t.brand || t.model) && (
                    <p className="text-[13px] text-ink-3">{[t.brand, t.model].filter(Boolean).join(" ")}</p>
                  )}
                  {t.shortDescription && (
                    <p className="mt-2 line-clamp-2 text-[13px] text-ink-2">{t.shortDescription}</p>
                  )}
                  <div className="mt-auto pt-4 text-[14px]">
                    <p className="tabular font-semibold text-ink">
                      {t.dailyRate ? `${moneyShort(t.dailyRate)} / jour` : "Tarif sur demande"}
                    </p>
                    {t.isSellable === 1 && t.salePrice && (
                      <p className="tabular mt-0.5 text-[13px] text-ink-3">
                        Achat : {moneyShort(t.salePrice)}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
