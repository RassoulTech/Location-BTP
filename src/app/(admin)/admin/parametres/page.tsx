import { asc } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { requirePermissionPage, has } from "@/lib/auth/guard";
import { formatDateTime } from "@/lib/format";
import { saveSettingsAction } from "@/lib/actions/settings";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Alert, EmptyState, Field, Input, PageHeader, Panel } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Parametres" };

const GROUPS: { prefix: string; title: string; description: string }[] = [
  {
    prefix: "company.",
    title: "Entreprise",
    description:
      "Ces informations alimentent le site public. Tant qu'un champ est vide, " +
      "rien n'est affiche a sa place — aucune donnee n'est inventee.",
  },
  {
    prefix: "billing.",
    title: "Facturation",
    description: "Taux en points de base : 1800 = 18 %.",
  },
  {
    prefix: "delivery.",
    title: "Livraison",
    description: "Forfait applique quand le client choisit la livraison sur site.",
  },
  {
    prefix: "rental.",
    title: "Location",
    description:
      "Remises de duree en points de base et delai minimum avant le debut " +
      "d'une location. 0 signifie aucune remise.",
  },
];

export default async function SettingsPage() {
  const user = await requirePermissionPage("settings.view", "/admin/parametres");
  const mayEdit = has(user, "settings.update");

  const rows = await db.select().from(settings).orderBy(asc(settings.key));
  const empty = rows.filter((r) => r.value == null).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Administration"
        title="Parametres"
        description="Les informations reelles de l'entreprise et les regles de tarification."
      />

      {rows.length === 0 ? (
        <EmptyState title="Aucun parametre">
          Lancez <code className="font-mono">npm run db:seed</code> pour creer les
          cles attendues.
        </EmptyState>
      ) : (
        <>
          {empty > 0 && (
            <Alert tone="warn" title={`${empty} parametre(s) non renseigne(s)`}>
              Les champs vides restent vides sur le site public. Renseignez-les
              avec les informations reelles de l'entreprise — ne mettez pas de
              valeur provisoire qui serait prise pour exacte.
            </Alert>
          )}

          <ActionForm action={saveSettingsAction}>
            {() => (
              <>
                {GROUPS.map((group) => {
                  const groupRows = rows.filter((r) => r.key.startsWith(group.prefix));
                  if (!groupRows.length) return null;
                  return (
                    <Panel key={group.prefix} title={group.title} description={group.description}>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {groupRows.map((row) => (
                          <Field key={row.key} label={row.label} name={row.key}
                                 hint={row.description ?? undefined}>
                            <Input
                              id={row.key}
                              name={row.key}
                              defaultValue={row.value == null ? "" : String(row.value)}
                              disabled={!mayEdit}
                              placeholder="Non renseigne"
                            />
                          </Field>
                        ))}
                      </div>
                    </Panel>
                  );
                })}

                {mayEdit && <SubmitButton>Enregistrer les parametres</SubmitButton>}
              </>
            )}
          </ActionForm>

          <p className="text-[12.5px] text-ink-3">
            Derniere modification enregistree :{" "}
            {formatDateTime(
              rows.map((r) => r.updatedAt).sort((a, b) => b.getTime() - a.getTime())[0] ?? null,
            )}
            . Chaque changement est trace dans le journal d'activite.
          </p>
        </>
      )}
    </div>
  );
}
