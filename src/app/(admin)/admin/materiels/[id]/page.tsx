import { notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  equipmentCategories, equipmentTypes, equipmentUnits, maintenanceRecords, unitOccupancies,
} from "@/db/schema";
import { requirePermissionPage, has } from "@/lib/auth/guard";
import { formatDate, money } from "@/lib/format";
import { MAINTENANCE_LABELS, UNIT_CONDITION_LABELS, UNIT_STATUS_LABELS } from "@/lib/labels";
import {
  Alert, Badge, ButtonLink, EmptyState, PageHeader, Panel,
  Table, TableWrap, Td, Th,
} from "@/components/ui";
import { EquipmentTypeForm } from "../type-form";
import { UnitForm } from "./unit-form";
import { MaintenanceForm } from "./maintenance-form";

export const dynamic = "force-dynamic";

export default async function EquipmentTypePage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requirePermissionPage("equipment.view", `/admin/materiels/${id}`);

  const [type] = await db.select().from(equipmentTypes)
    .where(eq(equipmentTypes.id, id)).limit(1);
  if (!type) notFound();

  const [categories, units, occupancies, maintenance] = await Promise.all([
    db.select({ id: equipmentCategories.id, name: equipmentCategories.name })
      .from(equipmentCategories).orderBy(asc(equipmentCategories.name)),
    db.select().from(equipmentUnits)
      .where(eq(equipmentUnits.typeId, id)).orderBy(asc(equipmentUnits.code)),
    db.select().from(unitOccupancies),
    db.select({ record: maintenanceRecords, unitCode: equipmentUnits.code })
      .from(maintenanceRecords)
      .innerJoin(equipmentUnits, eq(equipmentUnits.id, maintenanceRecords.unitId))
      .where(eq(equipmentUnits.typeId, id))
      .orderBy(desc(maintenanceRecords.startDate)).limit(20),
  ]);

  const busy = new Map<string, number>();
  for (const o of occupancies) busy.set(o.unitId, (busy.get(o.unitId) ?? 0) + 1);

  const mayEdit = has(user, "equipment.update");
  const mayMaintain = has(user, "maintenance.create");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Parc materiel"
        title={type.name}
        description={[type.brand, type.model].filter(Boolean).join(" ") || undefined}
        actions={<ButtonLink href="/admin/materiels">Retour au parc</ButtonLink>}
      />

      {units.length === 0 && (
        <Alert tone="warn" title="Aucun exemplaire physique">
          Ce modele ne peut pas etre loue tant qu'aucun exemplaire n'est enregistre.
          Une location se rattache toujours a une machine precise, jamais a un modele.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-start">
        <div className="flex flex-col gap-6">
          <Panel
            title={`${units.length} exemplaire(s)`}
            description="Chaque ligne est une machine reelle, avec son numero de serie et son historique."
          >
            {units.length === 0 ? (
              <EmptyState title="Parc vide pour ce modele" />
            ) : (
              <TableWrap>
                <Table>
                  <thead>
                    <tr>
                      <Th>Code</Th><Th>N° de serie</Th><Th>Etat</Th>
                      <Th>Statut</Th><Th align="right">Compteur</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((u) => {
                      const s = UNIT_STATUS_LABELS[u.status];
                      const occupied = busy.get(u.id) ?? 0;
                      return (
                        <tr key={u.id}>
                          <Td>
                            <span className="font-semibold text-ink">{u.code}</span>
                            {u.location && (
                              <span className="block text-[12px] text-ink-3">{u.location}</span>
                            )}
                          </Td>
                          <Td>{u.serialNumber ?? "—"}</Td>
                          <Td>{UNIT_CONDITION_LABELS[u.condition] ?? u.condition}</Td>
                          <Td>
                            <Badge tone={s?.tone}>{s?.label ?? u.status}</Badge>
                            {occupied > 0 && (
                              <span className="mt-1 block text-[12px] text-ink-3">
                                {occupied} periode(s) bloquee(s)
                              </span>
                            )}
                          </Td>
                          <Td align="right" className="tabular">{u.hourMeter} h</Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </TableWrap>
            )}
          </Panel>

          <Panel title="Maintenance" description="Une intervention planifiee rend la machine non louable.">
            {maintenance.length === 0 ? (
              <p className="text-[13.5px] text-ink-3">Aucune intervention enregistree.</p>
            ) : (
              <ul className="flex flex-col">
                {maintenance.map(({ record, unitCode }) => {
                  const s = MAINTENANCE_LABELS[record.status];
                  return (
                    <li key={record.id}
                        className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule py-2.5 text-[13.5px] last:border-0">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">
                          {unitCode} — {record.title}
                        </p>
                        <p className="text-[12.5px] text-ink-3">
                          {formatDate(record.startDate)} → {formatDate(record.endDate)}
                          {record.cost > 0 && ` · ${money(record.cost)}`}
                        </p>
                      </div>
                      <Badge tone={s?.tone}>{s?.label ?? record.status}</Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          {mayEdit && (
            <>
              <Panel title="Ajouter un exemplaire">
                <UnitForm typeId={type.id} />
              </Panel>

              {units.length > 0 && mayMaintain && (
                <Panel title="Planifier une intervention">
                  <MaintenanceForm
                    units={units.map((u) => ({ id: u.id, code: u.code }))}
                  />
                </Panel>
              )}

              <Panel title="Modifier le modele">
                <EquipmentTypeForm categories={categories} defaults={type} />
              </Panel>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
