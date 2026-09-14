import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { equipmentTypes, equipmentUnits, maintenanceRecords } from "@/db/schema";
import { requirePermissionPage, has } from "@/lib/auth/guard";
import { formatDate, money } from "@/lib/format";
import { MAINTENANCE_LABELS } from "@/lib/labels";
import { MAINTENANCE_TRANSITIONS } from "@/lib/status";
import { setMaintenanceStatusAction } from "@/lib/actions/maintenance";
import { ActionForm, SubmitButton } from "@/components/action-form";
import {
  Badge, EmptyState, PageHeader, Panel, Table, TableWrap, Td, Th,
} from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Maintenance" };

const NEXT_LABEL: Record<string, string> = {
  in_progress: "Demarrer", completed: "Terminer", cancelled: "Annuler",
};

export default async function MaintenancePage() {
  const user = await requirePermissionPage("maintenance.view", "/admin/maintenance");
  const mayUpdate = has(user, "maintenance.update");

  const rows = await db.select({
    record: maintenanceRecords, unitCode: equipmentUnits.code, typeName: equipmentTypes.name,
  })
    .from(maintenanceRecords)
    .innerJoin(equipmentUnits, eq(equipmentUnits.id, maintenanceRecords.unitId))
    .innerJoin(equipmentTypes, eq(equipmentTypes.id, equipmentUnits.typeId))
    .orderBy(desc(maintenanceRecords.startDate))
    .limit(200);

  const open = rows.filter((r) => ["scheduled", "in_progress"].includes(r.record.status));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Administration"
        title="Maintenance"
        description="Une intervention ouverte occupe l'exemplaire : il ne peut pas etre loue sur la periode, meme par une demande simultanee."
      />

      <Panel title={`${open.length} intervention(s) ouverte(s)`}>
        {rows.length === 0 ? (
          <EmptyState title="Aucune intervention">
            Les interventions se planifient depuis la fiche d'un modele de materiel,
            ou se creent automatiquement lors d'un retour avec dommages.
          </EmptyState>
        ) : (
          <TableWrap>
            <Table>
              <thead>
                <tr>
                  <Th>Exemplaire</Th><Th>Intervention</Th><Th>Periode</Th>
                  <Th>Statut</Th><Th align="right">Cout</Th>
                  {mayUpdate && <Th align="right">Action</Th>}
                </tr>
              </thead>
              <tbody>
                {rows.map(({ record, unitCode, typeName }) => {
                  const s = MAINTENANCE_LABELS[record.status];
                  const next = MAINTENANCE_TRANSITIONS[record.status] ?? [];
                  return (
                    <tr key={record.id}>
                      <Td>
                        <span className="font-semibold text-ink">{unitCode}</span>
                        <span className="block text-[12px] text-ink-3">{typeName}</span>
                      </Td>
                      <Td>
                        {record.title}
                        {record.description && (
                          <span className="block text-[12px] text-ink-3">{record.description}</span>
                        )}
                      </Td>
                      <Td>{formatDate(record.startDate)} → {formatDate(record.endDate)}</Td>
                      <Td><Badge tone={s?.tone}>{s?.label ?? record.status}</Badge></Td>
                      <Td align="right" className="tabular">{money(record.cost)}</Td>
                      {mayUpdate && (
                        <Td align="right">
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {next.map((to) => (
                              <ActionForm key={to} action={setMaintenanceStatusAction}
                                          hidden={{ id: record.id, status: to }}
                                          className="contents">
                                <SubmitButton tone={to === "cancelled" ? "danger" : "default"}>
                                  {NEXT_LABEL[to] ?? to}
                                </SubmitButton>
                              </ActionForm>
                            ))}
                          </div>
                        </Td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableWrap>
        )}
      </Panel>
    </div>
  );
}
