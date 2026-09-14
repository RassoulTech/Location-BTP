import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { equipmentCategories, equipmentTypes } from "@/db/schema";
import { fleetByType } from "@/lib/availability";
import { moneyShort } from "@/lib/format";
import { getCompanySettings } from "@/lib/settings";
import { Badge, ButtonLink, EmptyState, Panel } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [company, types, fleet] = await Promise.all([
    getCompanySettings(),
    db.select({
      id: equipmentTypes.id,
      slug: equipmentTypes.slug,
      name: equipmentTypes.name,
      brand: equipmentTypes.brand,
      shortDescription: equipmentTypes.shortDescription,
      dailyRate: equipmentTypes.dailyRate,
      category: equipmentCategories.name,
    })
      .from(equipmentTypes)
      .innerJoin(equipmentCategories, eq(equipmentCategories.id, equipmentTypes.categoryId))
      .where(and(eq(equipmentTypes.isPublished, 1), eq(equipmentTypes.isRentable, 1)))
      .orderBy(desc(equipmentTypes.updatedAt))
      .limit(6),
    fleetByType(),
  ]);

  const categoryRows = await db
    .select({ count: sql<number>`count(*)::int` }).from(equipmentCategories);
  const categoryCount = categoryRows[0]?.count ?? 0;

  return (
    <div className="flex flex-col gap-14">
      <section className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
            Location &amp; vente de materiel de chantier
          </p>
          <h1 className="text-balance text-[34px] font-bold leading-[1.1] tracking-tight text-ink sm:text-[44px]">
            Le bon engin, sur le bon chantier, a la bonne date.
          </h1>
          <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-ink-2">
            Chaque machine du parc est suivie exemplaire par exemplaire.
            Quand vous reservez, c'est un engin precis qui vous est affecte —
            plus de double reservation, plus de promesse intenable.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <ButtonLink href="/materiels" tone="primary">Voir le parc</ButtonLink>
            <ButtonLink href="/connexion">Espace client</ButtonLink>
          </div>
        </div>

        <div className="grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-1">
          <div className="bg-surface px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.09em] text-ink-3">
              Disponibilite
            </p>
            <p className="mt-1.5 text-[15px] font-semibold text-ink">Calculee en direct</p>
            <p className="mt-1 text-[13px] text-ink-3">
              Sur la periode exacte que vous demandez, exemplaire par exemplaire.
            </p>
          </div>
          <div className="bg-surface px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.09em] text-ink-3">
              Devis
            </p>
            <p className="mt-1.5 text-[15px] font-semibold text-ink">Calcule sur nos tarifs</p>
            <p className="mt-1 text-[13px] text-ink-3">
              Duree, remises, livraison et TVA — le montant affiche est celui
              qui sera facture.
            </p>
          </div>
          <div className="bg-surface px-5 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.09em] text-ink-3">
              Suivi
            </p>
            <p className="mt-1.5 text-[15px] font-semibold text-ink">De la demande au retour</p>
            <p className="mt-1 text-[13px] text-ink-3">
              Chaque etape est datee et consultable depuis votre espace.
            </p>
          </div>
        </div>
      </section>

      <Panel
        title="Materiel disponible a la location"
        description={
          types.length
            ? "Selection du parc publie."
            : "Le catalogue public s'affichera ici des que du materiel sera publie."
        }
        actions={types.length ? <ButtonLink href="/materiels">Tout le parc</ButtonLink> : null}
      >
        {types.length === 0 ? (
          <EmptyState title="Aucun materiel publie pour le moment">
            {categoryCount === 0
              ? "Le catalogue est vide. Il se remplit depuis l'administration, categorie par categorie."
              : "Du materiel existe mais n'est pas encore publie."}
          </EmptyState>
        ) : (
          <ul className="grid gap-px bg-rule sm:grid-cols-2 lg:grid-cols-3">
            {types.map((t) => {
              const stock = fleet.get(t.id);
              return (
                <li key={t.id} className="bg-surface">
                  <Link href={`/materiels/${t.slug}`} className="flex h-full flex-col p-4 hover:bg-surface-2">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-ink-3">{t.category}</p>
                    <p className="mt-1.5 text-[16px] font-semibold leading-snug text-ink">{t.name}</p>
                    {t.brand && <p className="text-[13px] text-ink-3">{t.brand}</p>}
                    {t.shortDescription && (
                      <p className="mt-2 line-clamp-2 text-[13px] text-ink-2">{t.shortDescription}</p>
                    )}
                    <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                      <span className="tabular text-[14px] font-semibold text-ink">
                        {t.dailyRate ? `${moneyShort(t.dailyRate)} / jour` : "Tarif sur demande"}
                      </span>
                      <Badge tone={stock && stock.inService > 0 ? "ok" : "neutral"}>
                        {stock ? `${stock.inService} en service` : "0 exemplaire"}
                      </Badge>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {!company.legalName && (
        <p className="text-[13px] text-ink-3">
          Les informations de l'entreprise — raison sociale, adresse, telephones,
          zones desservies — ne sont pas encore renseignees. Elles se saisissent
          dans <Link href="/admin/parametres" className="underline">Administration &rsaquo; Parametres</Link>,
          et rien n'est affiche tant qu'elles ne le sont pas.
        </p>
      )}
    </div>
  );
}
