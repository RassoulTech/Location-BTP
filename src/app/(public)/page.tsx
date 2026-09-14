import Image from "next/image";
import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { equipmentCategories, equipmentTypes } from "@/db/schema";
import { fleetByType } from "@/lib/availability";
import { moneyShort } from "@/lib/format";
import { Badge, ButtonLink, EmptyState, Panel } from "@/components/ui";

export const dynamic = "force-dynamic";

const ENGAGEMENTS = [
  {
    titre: "Disponibilité en direct",
    texte:
      "Calculée sur la période exacte que vous demandez, exemplaire par exemplaire — " +
      "locations en cours et immobilisations d'atelier comprises.",
    icone: (
      <path d="M7 3v3M17 3v3M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM4 10h16" />
    ),
  },
  {
    titre: "Devis sur nos tarifs",
    texte:
      "Durée, remises, livraison et TVA : le montant affiché est celui qui sera facturé. " +
      "Rien n'est recalculé après coup.",
    icone: <path d="M12 3v18M7 7h7a3 3 0 0 1 0 6H7m0 0h8a3 3 0 0 1 0 6H7" />,
  },
  {
    titre: "De la demande au retour",
    texte:
      "Chaque étape est datée et consultable depuis votre espace : validation, sortie, " +
      "retour, clôture.",
    icone: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3.5 2" />
      </>
    ),
  },
];

export default async function HomePage() {
  const [types, fleet] = await Promise.all([
    db.select({
      id: equipmentTypes.id, slug: equipmentTypes.slug, name: equipmentTypes.name,
      shortDescription: equipmentTypes.shortDescription,
      dailyRate: equipmentTypes.dailyRate, salePrice: equipmentTypes.salePrice,
      isSellable: equipmentTypes.isSellable, category: equipmentCategories.name,
    })
      .from(equipmentTypes)
      .innerJoin(equipmentCategories, eq(equipmentCategories.id, equipmentTypes.categoryId))
      .where(and(eq(equipmentTypes.isPublished, 1), eq(equipmentTypes.isRentable, 1)))
      .orderBy(asc(equipmentCategories.position), asc(equipmentTypes.name))
      .limit(6),
    fleetByType(),
  ]);

  const parc = [...fleet.values()].reduce((a, f) => a + f.total, 0);

  return (
    <div className="flex flex-col gap-24">
      {/* ======= Ouverture ======= */}
      <section className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <p className="overline">NDIOBEEN GUI LOGISTIQUE — Dakar, Sénégal</p>
          <h1 className="mt-6 text-balance font-serif text-[clamp(2.6rem,7vw,4.4rem)] leading-[1.04]">
            Le levage,<br />
            <em>du chantier à l&rsquo;entrepôt.</em>
          </h1>
          <p className="mt-7 max-w-xl text-[1.02rem] font-light leading-relaxed text-muted">
            Location et vente de matériel BTP et de levage pour les professionnels du
            bâtiment, de l&rsquo;industrie et de la logistique. Grues mobiles, pelles
            hydrauliques, manitous télescopiques, chargeuses, tractopelles et bulldozers —
            chaque machine suivie exemplaire par exemplaire.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <ButtonLink href="/materiels" tone="gold">Voir la flotte</ButtonLink>
            <ButtonLink href="/connexion">Espace client</ButtonLink>
          </div>

          {parc > 0 && (
            <div className="mt-12 flex flex-wrap gap-10 border-t border-hairline pt-8">
              <div>
                <p className="tabular font-serif text-[2.4rem] leading-none text-gold-2">{parc}</p>
                <p className="overline mt-2">Exemplaires au parc</p>
              </div>
              <div>
                <p className="tabular font-serif text-[2.4rem] leading-none text-gold-2">
                  {fleet.size}
                </p>
                <p className="overline mt-2">Modèles disponibles</p>
              </div>
            </div>
          )}
        </div>

        {/* Photographie de tête */}
        <div className="relative">
          <div
            className="relative overflow-hidden rounded-card border border-hairline"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <Image
              src="/machines/grue-mobile.webp"
              alt="Grue mobile en opération sur un chantier"
              width={1024} height={1024} priority
              className="h-full w-full object-cover"
            />
          </div>
          <div className="nav-blur absolute -bottom-5 left-6 rounded-card border border-hairline-gold px-5 py-3">
            <p className="overline">Grue mobile</p>
            <p className="mt-1 font-serif text-[1.2rem]">Levage sur chantier</p>
          </div>
        </div>
      </section>

      {/* ======= Engagements ======= */}
      <section>
        <p className="overline">01 — Notre façon de travailler</p>
        <h2 className="mt-5 max-w-2xl text-balance font-serif text-[clamp(1.9rem,4.5vw,2.8rem)]">
          Avant la machine, <em>le service.</em>
        </h2>
        <div className="mt-10 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
          {ENGAGEMENTS.map((e) => (
            <article key={e.titre} className="glass-card px-7 py-8">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none"
                   stroke="var(--gold-2)" strokeWidth="1.6" strokeLinecap="round"
                   strokeLinejoin="round" aria-hidden>
                {e.icone}
              </svg>
              <h3 className="mt-5 font-serif text-[1.45rem]">{e.titre}</h3>
              <p className="mt-3 text-[0.9rem] font-light leading-relaxed text-muted">{e.texte}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ======= La flotte ======= */}
      <section>
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="overline">02 — La flotte</p>
            <h2 className="mt-5 text-balance font-serif text-[clamp(1.9rem,4.5vw,2.8rem)]">
              Des machines <em>choisies une à une.</em>
            </h2>
          </div>
          {types.length > 0 && <ButtonLink href="/materiels">Toute la flotte</ButtonLink>}
        </div>

        {types.length === 0 ? (
          <div className="mt-10">
            <EmptyState title="Aucun matériel publié pour le moment">
              Le catalogue se remplit depuis l&rsquo;administration.
            </EmptyState>
          </div>
        ) : (
          <ul className="mt-10 grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(290px,1fr))]">
            {types.map((t) => {
              const stock = fleet.get(t.id);
              return (
                <li key={t.id}>
                  <Link href={`/materiels/${t.slug}`}
                        className="glass-card group flex h-full flex-col overflow-hidden transition-[border-color,transform] duration-500 hover:-translate-y-1 hover:border-hairline-gold">
                    <div className="relative aspect-[4/3] overflow-hidden"
                         style={{ background: "var(--photo-bg)" }}>
                      <Image
                        src={`/machines/${t.slug}.webp`}
                        alt={t.name}
                        width={1024} height={1024}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <span className="absolute right-3 top-3">
                        <Badge tone={stock && stock.inService > 0 ? "ok" : "neutral"}>
                          {stock ? `${stock.inService} en service` : "—"}
                        </Badge>
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <p className="overline">{t.category}</p>
                      <h3 className="mt-2.5 font-serif text-[1.5rem] leading-tight">{t.name}</h3>
                      {t.shortDescription && (
                        <p className="mt-2.5 text-[0.86rem] font-light leading-relaxed text-muted">
                          {t.shortDescription}
                        </p>
                      )}
                      <div className="mt-auto flex items-end justify-between gap-4 pt-6">
                        <span className="tabular font-serif text-[1.3rem] text-gold-2">
                          {t.dailyRate ? `${moneyShort(t.dailyRate)}` : "Sur demande"}
                          {t.dailyRate && (
                            <span className="ml-1.5 font-sans text-[0.72rem] font-light uppercase tracking-[0.14em] text-soft">
                              / jour
                            </span>
                          )}
                        </span>
                        {t.isSellable === 1 && t.salePrice && (
                          <span className="tabular text-[0.78rem] font-light text-soft">
                            Achat {moneyShort(t.salePrice)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ======= Appel ======= */}
      <section className="glass-card px-8 py-14 text-center sm:px-14">
        <p className="overline">03 — Réservation</p>
        <h2 className="mx-auto mt-5 max-w-2xl text-balance font-serif text-[clamp(1.9rem,4.5vw,2.8rem)]">
          Un besoin clair, <em>un engin réservé.</em>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-[0.95rem] font-light leading-relaxed text-muted">
          Choisissez vos dates, nous bloquons immédiatement un exemplaire précis.
          Plus de double réservation, plus de promesse intenable.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-4">
          <ButtonLink href="/materiels" tone="gold">Réserver une machine</ButtonLink>
          <ButtonLink href="/contact">Nous contacter</ButtonLink>
        </div>
      </section>
    </div>
  );
}
