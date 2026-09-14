import type { Metadata } from "next";
import { getCompanySettings } from "@/lib/settings";
import { Alert, ButtonLink, Panel, PageHeader } from "@/components/ui";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage() {
  const company = await getCompanySettings();
  const lines = [
    ["Raison sociale", company.legalName],
    ["Adresse", company.address],
    ["Telephone", company.phones],
    ["E-mail", company.emails],
    ["Horaires", company.openingHours],
    ["Zones desservies", company.serviceAreas],
    ["NINEA", company.ninea],
    ["RCCM", company.rccm],
  ].filter(([, v]) => Boolean(v)) as [string, string][];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Contact"
        title="Nous joindre"
        description="Une demande de location ou d'achat se fait depuis votre espace client. Pour tout le reste, voici nos coordonnees."
        actions={<ButtonLink href="/materiels" tone="gold">Voir le parc</ButtonLink>}
      />

      <Panel title="Coordonnees">
        {lines.length === 0 ? (
          <Alert tone="neutral" title="Coordonnees non renseignees">
            Les informations de l'entreprise n'ont pas encore ete saisies.
            Elles s'ajoutent dans Administration &rsaquo; Parametres, et rien
            n'est affiche ici tant qu'elles ne sont pas confirmees — aucune
            adresse ni aucun numero n'est invente.
          </Alert>
        ) : (
          <dl className="flex flex-col">
            {lines.map(([label, value]) => (
              <div key={label}
                   className="flex flex-wrap items-baseline justify-between gap-4 border-b border-rule py-2.5 last:border-0">
                <dt className="text-[13px] text-ink-3">{label}</dt>
                <dd className="whitespace-pre-line text-right text-[14px] font-medium text-ink">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </Panel>
    </div>
  );
}
