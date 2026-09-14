import { desc } from "drizzle-orm";
import { db } from "@/db";
import { activityLogs } from "@/db/schema";
import { requirePermissionPage } from "@/lib/auth/guard";
import { formatDateTime } from "@/lib/format";
import { EmptyState, PageHeader, Panel } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Journal d'activite" };

function Diff({ label, value }: { label: string; value: unknown }) {
  if (value == null) return null;
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">{label}</p>
      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap break-words border border-rule bg-surface-2 px-2.5 py-2 text-[12px] leading-relaxed text-ink-2">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

export default async function ActivityLogPage({
  searchParams,
}: { searchParams: Promise<{ q?: string }> }) {
  await requirePermissionPage("logs.view", "/admin/journal");
  const sp = await searchParams;

  const rows = await db.select().from(activityLogs)
    .orderBy(desc(activityLogs.createdAt)).limit(200);

  const q = sp.q?.trim().toLowerCase();
  const filtered = q
    ? rows.filter((r) =>
        [r.action, r.entityType, r.actorLabel].filter(Boolean).join(" ").toLowerCase().includes(q))
    : rows;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Administration"
        title="Journal d'activite"
        description="Qui a fait quoi, quand, sur quelle ressource — et l'etat avant/apres quand il est pertinent."
      />

      <Panel title="Recherche">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
            <label htmlFor="q" className="text-[12px] font-semibold text-ink-2">
              Action, ressource ou auteur
            </label>
            <input id="q" name="q" defaultValue={sp.q ?? ""}
                   placeholder="rental.approve, equipment, …"
                   className="w-full border border-rule-firm bg-surface px-3 py-2 text-[14px] text-ink" />
          </div>
          <button type="submit"
                  className="border border-ink bg-ink px-4 py-2 text-[13px] font-semibold text-paper">
            Filtrer
          </button>
        </form>
      </Panel>

      <Panel title={`${filtered.length} entree(s)`} description="200 dernieres actions.">
        {filtered.length === 0 ? (
          <EmptyState title="Journal vide">
            Les actions importantes s'enregistrent automatiquement : validation,
            rejet, retour, changement de tarif, modification de parametre.
          </EmptyState>
        ) : (
          <ul className="flex flex-col">
            {filtered.map((log) => (
              <li key={log.id} className="border-b border-rule py-3 last:border-0">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <p className="text-[13.5px] font-semibold text-ink">
                    {log.action}
                    <span className="ml-2 font-normal text-ink-3">
                      {log.entityType}{log.entityId ? ` · ${log.entityId.slice(0, 8)}` : ""}
                    </span>
                  </p>
                  <p className="text-[12.5px] text-ink-3">
                    {log.actorLabel ?? "Systeme"} · {formatDateTime(log.createdAt)}
                  </p>
                </div>
                {(log.before != null || log.after != null) ? (
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    <Diff label="Avant" value={log.before} />
                    <Diff label="Apres" value={log.after} />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
