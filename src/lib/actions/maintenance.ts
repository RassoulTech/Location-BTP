"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { equipmentUnits, maintenanceRecords } from "@/db/schema";
import { requirePermission } from "@/lib/auth/guard";
import { logActivity } from "@/lib/audit";
import { MAINTENANCE_TRANSITIONS, assertTransition, type MaintenanceStatus } from "@/lib/status";
import { fieldErrors, maintenanceSchema } from "@/lib/validation";
import { BusinessError, failure, success, toActionState, type ActionState } from "./state";

/* ==========================================================
   Maintenance (CDC §25)

   Une intervention `scheduled` ou `in_progress` occupe l'exemplaire
   via le trigger : la machine devient non louable sur la periode,
   sans qu'aucun code de location n'ait a le savoir.
   ========================================================== */

export async function scheduleMaintenanceAction(
  _prev: ActionState, form: FormData,
): Promise<ActionState> {
  try {
    const user = await requirePermission("maintenance.create");

    const parsed = maintenanceSchema.safeParse({
      unitId: form.get("unitId"),
      title: form.get("title"),
      description: form.get("description"),
      startDate: form.get("startDate"),
      endDate: form.get("endDate"),
      cost: String(form.get("cost") ?? "").trim() || undefined,
    });
    if (!parsed.success) return failure("Verifiez les champs.", fieldErrors(parsed.error));
    const d = parsed.data;

    await db.transaction(async (tx) => {
      const [row] = await tx.insert(maintenanceRecords).values({
        unitId: d.unitId,
        status: "scheduled",
        title: d.title,
        description: d.description || null,
        startDate: d.startDate,
        endDate: d.endDate,
        technicianId: user.id,
        cost: d.cost ?? 0,
      }).returning({ id: maintenanceRecords.id });

      await logActivity({
        actor: user, action: "maintenance.schedule", entityType: "maintenance_records",
        entityId: row!.id,
        after: { unitId: d.unitId, from: d.startDate, to: d.endDate, title: d.title },
        tx,
      });
    });

    revalidatePath("/admin/maintenance");
    revalidatePath("/admin/materiels");
    return success("Intervention planifiee. L'exemplaire n'est plus louable sur la periode.");
  } catch (err) {
    return toActionState(err);
  }
}

export async function setMaintenanceStatusAction(
  _prev: ActionState, form: FormData,
): Promise<ActionState> {
  try {
    const user = await requirePermission("maintenance.update");
    const id = String(form.get("id") ?? "");
    const to = String(form.get("status") ?? "") as MaintenanceStatus;

    const [record] = await db.select().from(maintenanceRecords)
      .where(eq(maintenanceRecords.id, id)).limit(1);
    if (!record) throw new BusinessError("Intervention introuvable.");

    assertTransition("L'intervention", MAINTENANCE_TRANSITIONS, record.status, to);

    await db.transaction(async (tx) => {
      await tx.update(maintenanceRecords)
        .set({ status: to, updatedAt: new Date() })
        .where(eq(maintenanceRecords.id, id));

      // Fin d'intervention : la machine redevient disponible, et le
      // trigger a deja libere sa periode.
      if (to === "completed" || to === "cancelled") {
        await tx.update(equipmentUnits)
          .set({ status: "available", updatedAt: new Date() })
          .where(eq(equipmentUnits.id, record.unitId));
      }

      await logActivity({
        actor: user, action: `maintenance.${to}`, entityType: "maintenance_records",
        entityId: id, before: { status: record.status }, after: { status: to }, tx,
      });
    });

    revalidatePath("/admin/maintenance");
    revalidatePath("/admin/materiels");
    return success("Intervention mise a jour.");
  } catch (err) {
    return toActionState(err);
  }
}
