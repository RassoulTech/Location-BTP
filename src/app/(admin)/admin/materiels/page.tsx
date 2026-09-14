import Link from "next/link";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { equipmentCategories, equipmentTypes, equipmentUnits } from "@/db/schema";
import { requirePermissionPage, has } from "@/lib/auth/guard";
import { moneyShort } from "@/lib/format";
import { createCategoryAction } from "@/lib/actions/equipment";
import { ActionForm, SubmitButton } from "@/components/action-form";
import {
  Alert, Badge, EmptyState, Field, Input, PageHeader, Panel,
  Table, TableWrap, Td, Textarea, Th,
} from "@/components/ui";
import { EquipmentTypeForm } from "./type-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Parc materiel" };

export default async function AdminEquipmentPage() {
  const user = await requirePermissionPage("equipment.view", "/admin/materiels");
  const mayCreate = has(user, "equipment.create");

  const [categories, types, unitCounts] = await Promise.all([
    db.select().from(equipmentCategories)
      .orderBy(asc(equipmentCategories.position), asc(equipmentCategories.name)),
    db.select({
      id: equipmentTypes.id, name: equipmentTypes.name, brand: equipmentTypes.brand,
      model: equipmentTypes.model, dailyRate: equipmentTypes.dailyRate,
      salePrice: equipmentTypes.salePrice, isPublished: equipmentTypes.isPublished,
      isRentable: equipmentTypes.isRentable, isSellable: equipmentTypes.isSellable,
      categoryName: equipmentCategories.name,
    })
      .from(equipmentTypes)
      .innerJoin(equipmentCategories, eq(equipmentCategories.id, equipmentTypes.categoryId))
      .orderBy(asc(equipmentCategories.position), asc(equipmentTypes.name)),
    db.select({
      typeId: equipmentUnits.typeId,
      total: sql<number>`count(*)::int`,
      available: sql<number>`count(*) FILTER (WHERE ${equipmentUnits.status} = 'available')::int`,
    }).from(equipmentUnits).groupBy(equipmentUnits.typeId),
  ]);

  const counts = new Map(unitCounts.map((u) => [u.typeId, u]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Administration"
        title="Parc materiel"
        description="Un modele porte les tarifs et le contenu public. Les exemplaires physiques se gerent dans sa fiche."
      />

      {categories.length === 0 && (
        <Alert tone="info" title="Commencez par une categorie">
          Un modele de materiel appartient toujours a une categorie. Creez-en une
          ci-dessous, puis ajoutez vos machines.
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.6fr] lg:items-start">
        {mayCreate && (
          <div className="flex flex-col gap-6">
            <Panel title="Nouvelle categorie">
              <ActionForm action={createCategoryAction} resetOnSuccess>
                {(state) => (
                  <>
                    <Field label="Nom" name="name" required error={state.errors?.name}>
                      <Input id="name" name="name" required maxLength={80}
                             placeholder="Pelles, Grues, Camions…" />
                    </Field>
                    <Field label="Description" name="description">
                      <Textarea id="description" name="description" maxLength={300} />
                    </Field>
                    <SubmitButton>Creer la categorie</SubmitButton>
                  </>
                )}
              </ActionForm>
            </Panel>

            {categories.length > 0 && (
              <Panel title="Nouveau modele">
                <EquipmentTypeForm categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
              </Panel>
            )}
          </div>
        )}

        <Panel title={`${types.length} modele(s)`}>
          {types.length === 0 ? (
            <EmptyState title="Aucun modele">
              Creez une categorie puis un modele. Sans exemplaire physique rattache,
              un modele ne peut pas etre loue.
            </EmptyState>
          ) : (
            <TableWrap>
              <Table>
                <thead>
                  <tr>
                    <Th>Modele</Th><Th>Categorie</Th><Th>Exemplaires</Th>
                    <Th>Etat</Th><Th align="right">Tarif / jour</Th>
                  </tr>
                </thead>
                <tbody>
                  {types.map((t) => {
                    const c = counts.get(t.id);
                    return (
                      <tr key={t.id}>
                        <Td>
                          <Link href={`/admin/materiels/${t.id}`}
                                className="font-semibold text-ink hover:underline">
                            {t.name}
                          </Link>
                          {(t.brand || t.model) && (
                            <span className="block text-[12px] text-ink-3">
                              {[t.brand, t.model].filter(Boolean).join(" ")}
                            </span>
                          )}
                        </Td>
                        <Td>{t.categoryName}</Td>
                        <Td>
                          {c ? (
                            <span className="tabular">
                              {c.available} / {c.total} libre{c.available > 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="text-danger">Aucun</span>
                          )}
                        </Td>
                        <Td>
                          <div className="flex flex-wrap gap-1.5">
                            <Badge tone={t.isPublished ? "ok" : "neutral"}>
                              {t.isPublished ? "Publie" : "Brouillon"}
                            </Badge>
                            {t.isRentable === 1 && <Badge tone="info">Location</Badge>}
                            {t.isSellable === 1 && <Badge tone="warn">Vente</Badge>}
                          </div>
                        </Td>
                        <Td align="right" className="tabular font-semibold text-ink">
                          {t.dailyRate ? moneyShort(t.dailyRate) : "—"}
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableWrap>
          )}
        </Panel>
      </div>
    </div>
  );
}
