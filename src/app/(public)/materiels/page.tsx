import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { equipmentCategories, equipmentTypes } from "@/db/schema";
import { availabilityByType, fleetByType } from "@/lib/availability";
import { addDays, formatDate, moneyShort, todayISO } from "@/lib/format";
import { Badge, EmptyState, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "La flotte",
  description:
    "Grues mobiles, pelles hydrauliques, manitous télescopiques, chargeuses, " +
    "tractopelles, bulldozers et camions bennes : disponibilité calculée sur la " +
    "période demandée, exemplaire par exemplaire.",
};

type Search = { du?: string; au?: string; categorie?: string };
const isDate = (v?: string) => Boolean(v && /^\d{4}-\d{2}-\d{2}$/.test(v));

export default async function CataloguePage({
  searchParams,
}: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const start = isDate(sp.du) ? sp.du! : addDays(todayISO(), 1);
  const end = isDate(sp.au) && sp.au! >= start ? sp.au! : addDays(start, 6);

  const [categories, rows, free, fleet] = await Promise.all([
    db.select().from(equipmentCategories)
      .orderBy(asc(equipmentCategories.position), asc(equipmentCategories.name)),
    db.select({
      id: equipmentTypes.id, slug: equipmentTypes.slug, name: equipmentTypes.name,
      shortDescription: equipmentTypes.shortDescription,
      dailyRate: equipmentTypes.dailyRate, salePrice: equipmentTypes.salePrice,
      isSellable: equipmentTypes.isSellable,
      categoryName: equipmentCategories.name, categorySlug: equipmentCategories.slug,
    })
      .from(equipmentTypes)
      .innerJoin(equipmentCategories, eq(equipmentCategories.id, equipmentTypes.categoryId))
      .where(eq(equipmentTypes.isPublished, 1))
      .orderBy(asc(equipmentCategories.position), asc(equipmentTypes.name)),
    availabilityByType({ startDate: start, endDate: end }),
    fleetByType(),
  ]);

  const filtered = sp.categorie ? rows.filter((r) => r.categorySlug === sp.categorie) : rows;

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow="La flotte"
        title={<>Des machines <em>choisies une à une.</em></>}
        description={
          <>
            Disponibilité calculée pour la période du <strong className="font-normal text-text">
            {formatDate(start)}</strong> au <strong className="font-normal text-text">
            {formatDate(end)}</strong> — locations en cours et immobilisations d&rsquo;atelier comprises.
          </>
        }
      />

      {/* Barre de période et filtre */}
      <form method="get" className="glass-card flex flex-wrap items-end gap-5 px-6 py-5">
        <div className="flex flex-col gap-2">
          <label htmlFor="du" className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted">
            Du
          </label>
          <input id="du" name="du" type="date" defaultValue={start} min={todayISO()}
                 className="rounded-[10px] border border-hairline bg-[var(--input-bg)] px-4 py-2.5 font-sans text-[0.9rem] font-light text-text" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="au" className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted">
            Au
          </label>
          <input id="au" name="au" type="date" defaultValue={end} min={start}
                 className="rounded-[10px] border border-hairline bg-[var(--input-bg)] px-4 py-2.5 font-sans text-[0.9rem] font-light text-text" />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="categorie" className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted">
            Catégorie
          </label>
          <select id="categorie" name="categorie" defaultValue={sp.categorie ?? ""}
                  className="rounded-[10px] border border-hairline bg-[var(--input-bg)] px-4 py-2.5 font-sans text-[0.9rem] font-light text-text">
            <option value="">Toutes</option>
            {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <button type="submit"
                className="gold-grad min-h-[44px] rounded-full px-7 font-sans text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[#14100a]">
          Actualiser
        </button>
      </form>

      {filtered.length === 0 ? (
        <EmptyState title="Aucun matériel dans cette sélection">
          {rows.length > 0
            ? "Essayez « Toutes » dans le filtre de catégorie."
            : "Le catalogue se remplit depuis l'administration."}
        </EmptyState>
      ) : (
        <ul className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(290px,1fr))]">
          {filtered.map((t) => {
            const libres = free.get(t.id) ?? 0;
            const total = fleet.get(t.id)?.total ?? 0;
            return (
              <li key={t.id}>
                <Link href={`/materiels/${t.slug}?du=${start}&au=${end}`}
                      className="glass-card group flex h-full flex-col overflow-hidden transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-hairline-gold">
                  <div className="relative aspect-[4/3] overflow-hidden"
                       style={{ background: "var(--photo-bg)" }}>
                    <Image src={`/machines/${t.slug}.webp`} alt={t.name}
                           width={1024} height={1024}
                           className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <span className="absolute right-3 top-3">
                      <Badge tone={libres > 0 ? "ok" : total > 0 ? "danger" : "neutral"}>
                        {total === 0 ? "Aucun exemplaire"
                          : libres > 0 ? `${libres} / ${total} libre${libres > 1 ? "s" : ""}`
                          : "Complet"}
                      </Badge>
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <p className="overline">{t.categoryName}</p>
                    <h2 className="mt-2.5 font-serif text-[1.5rem] leading-tight">{t.name}</h2>
                    {t.shortDescription && (
                      <p className="mt-2.5 text-[0.86rem] font-light leading-relaxed text-muted">
                        {t.shortDescription}
                      </p>
                    )}
                    <div className="mt-auto pt-6">
                      <p className="tabular font-serif text-[1.35rem] text-gold-2">
                        {t.dailyRate ? moneyShort(t.dailyRate) : "Tarif sur demande"}
                        {t.dailyRate && (
                          <span className="ml-1.5 font-sans text-[0.72rem] font-light uppercase tracking-[0.14em] text-soft">
                            / jour
                          </span>
                        )}
                      </p>
                      {t.isSellable === 1 && t.salePrice && (
                        <p className="tabular mt-1 text-[0.78rem] font-light text-soft">
                          Achat : {moneyShort(t.salePrice)}
                        </p>
                      )}
                    </div>
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
