"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { equipmentCategories, equipmentTypes, equipmentUnits } from "@/db/schema";
import { requirePermission } from "@/lib/auth/guard";
import { logActivity } from "@/lib/audit";
import { equipmentTypeSchema, equipmentUnitSchema, fieldErrors } from "@/lib/validation";
import { BusinessError, failure, success, toActionState, type ActionState } from "./state";

const slugify = (v: string) =>
  v.normalize("NFD").replace(/[̀-ͯ]/g, "")
   .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

/* ---------- Categories ---------- */

export async function createCategoryAction(
  _prev: ActionState, form: FormData,
): Promise<ActionState> {
  try {
    const user = await requirePermission("equipment.create");
    const name = String(form.get("name") ?? "").trim();
    if (name.length < 2) return failure("Nom requis.", { name: "Nom trop court." });

    const [row] = await db.insert(equipmentCategories)
      .values({ name, slug: slugify(name), description: String(form.get("description") ?? "").trim() || null })
      .returning({ id: equipmentCategories.id });

    await logActivity({
      actor: user, action: "category.create", entityType: "equipment_categories",
      entityId: row!.id, after: { name },
    });
    revalidatePath("/admin/materiels");
    return success(`Categorie « ${name} » creee.`);
  } catch (err) {
    return toActionState(err);
  }
}

/* ---------- Modeles ---------- */

function parseType(form: FormData) {
  const num = (k: string) => {
    const v = String(form.get(k) ?? "").trim();
    return v === "" ? undefined : v;
  };
  return equipmentTypeSchema.safeParse({
    categoryId: form.get("categoryId"),
    name: form.get("name"),
    brand: form.get("brand"),
    model: form.get("model"),
    shortDescription: form.get("shortDescription"),
    description: form.get("description"),
    dailyRate: num("dailyRate"),
    weeklyRate: num("weeklyRate"),
    monthlyRate: num("monthlyRate"),
    depositAmount: num("depositAmount"),
    salePrice: num("salePrice"),
    isRentable: form.get("isRentable") === "on",
    isSellable: form.get("isSellable") === "on",
    isPublished: form.get("isPublished") === "on",
  });
}

export async function saveEquipmentTypeAction(
  _prev: ActionState, form: FormData,
): Promise<ActionState> {
  try {
    const id = String(form.get("id") ?? "");
    const user = await requirePermission(id ? "equipment.update" : "equipment.create");

    const parsed = parseType(form);
    if (!parsed.success) return failure("Verifiez les champs.", fieldErrors(parsed.error));
    const d = parsed.data;

    // Modifier un tarif est une action a part : elle exige sa propre permission
    // et laisse une trace explicite dans le journal (CDC §40).
    const values = {
      categoryId: d.categoryId,
      name: d.name,
      brand: d.brand || null,
      model: d.model || null,
      shortDescription: d.shortDescription || null,
      description: d.description || null,
      dailyRate: d.dailyRate ?? null,
      weeklyRate: d.weeklyRate ?? null,
      monthlyRate: d.monthlyRate ?? null,
      depositAmount: d.depositAmount ?? null,
      salePrice: d.salePrice ?? null,
      isRentable: d.isRentable ? 1 : 0,
      isSellable: d.isSellable ? 1 : 0,
      isPublished: d.isPublished ? 1 : 0,
      updatedAt: new Date(),
    };

    if (id) {
      const [before] = await db.select().from(equipmentTypes)
        .where(eq(equipmentTypes.id, id)).limit(1);
      if (!before) throw new BusinessError("Materiel introuvable.");

      const pricingChanged =
        before.dailyRate !== values.dailyRate || before.weeklyRate !== values.weeklyRate ||
        before.monthlyRate !== values.monthlyRate || before.salePrice !== values.salePrice ||
        before.depositAmount !== values.depositAmount;
      if (pricingChanged) await requirePermission("equipment.pricing");

      await db.update(equipmentTypes).set(values).where(eq(equipmentTypes.id, id));
      await logActivity({
        actor: user, action: pricingChanged ? "equipment.pricing_change" : "equipment.update",
        entityType: "equipment_types", entityId: id,
        before: {
          name: before.name, dailyRate: before.dailyRate, weeklyRate: before.weeklyRate,
          monthlyRate: before.monthlyRate, salePrice: before.salePrice,
          depositAmount: before.depositAmount,
        },
        after: {
          name: values.name, dailyRate: values.dailyRate, weeklyRate: values.weeklyRate,
          monthlyRate: values.monthlyRate, salePrice: values.salePrice,
          depositAmount: values.depositAmount,
        },
      });
      revalidatePath(`/admin/materiels/${id}`);
      revalidatePath("/admin/materiels");
      return success("Materiel mis a jour.");
    }

    if (d.dailyRate || d.weeklyRate || d.monthlyRate || d.salePrice) {
      await requirePermission("equipment.pricing");
    }
    const [row] = await db.insert(equipmentTypes)
      .values({ ...values, slug: slugify(`${d.name}-${d.model ?? ""}`) || slugify(d.name) })
      .returning({ id: equipmentTypes.id });

    await logActivity({
      actor: user, action: "equipment.create", entityType: "equipment_types",
      entityId: row!.id, after: { name: d.name },
    });
    revalidatePath("/admin/materiels");
    return success(`Materiel « ${d.name} » cree.`);
  } catch (err) {
    return toActionState(err);
  }
}

/* ---------- Exemplaires physiques ---------- */

export async function saveEquipmentUnitAction(
  _prev: ActionState, form: FormData,
): Promise<ActionState> {
  try {
    const id = String(form.get("id") ?? "");
    const user = await requirePermission(id ? "equipment.update" : "equipment.create");

    const parsed = equipmentUnitSchema.safeParse({
      typeId: form.get("typeId"),
      code: form.get("code"),
      serialNumber: form.get("serialNumber"),
      condition: form.get("condition"),
      status: form.get("status"),
      location: form.get("location"),
      hourMeter: String(form.get("hourMeter") ?? "").trim() || undefined,
      acquiredOn: String(form.get("acquiredOn") ?? "").trim() || undefined,
    });
    if (!parsed.success) return failure("Verifiez les champs.", fieldErrors(parsed.error));
    const d = parsed.data;

    const values = {
      typeId: d.typeId,
      code: d.code.toUpperCase(),
      serialNumber: d.serialNumber || null,
      condition: d.condition,
      status: d.status,
      location: d.location || null,
      hourMeter: d.hourMeter ?? 0,
      acquiredOn: d.acquiredOn || null,
      updatedAt: new Date(),
    };

    if (id) {
      const [before] = await db.select().from(equipmentUnits)
        .where(eq(equipmentUnits.id, id)).limit(1);
      if (!before) throw new BusinessError("Exemplaire introuvable.");
      await db.update(equipmentUnits).set(values).where(eq(equipmentUnits.id, id));
      await logActivity({
        actor: user, action: "unit.update", entityType: "equipment_units", entityId: id,
        before: { code: before.code, status: before.status, condition: before.condition },
        after: { code: values.code, status: values.status, condition: values.condition },
      });
    } else {
      const [row] = await db.insert(equipmentUnits).values(values)
        .returning({ id: equipmentUnits.id });
      await logActivity({
        actor: user, action: "unit.create", entityType: "equipment_units",
        entityId: row!.id, after: { code: values.code },
      });
    }

    revalidatePath(`/admin/materiels/${d.typeId}`);
    revalidatePath("/admin/materiels");
    return success(id ? "Exemplaire mis a jour." : `Exemplaire ${values.code} ajoute.`);
  } catch (err) {
    return toActionState(err);
  }
}
