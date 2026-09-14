"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { requirePermission } from "@/lib/auth/guard";
import { logActivity } from "@/lib/audit";
import { success, toActionState, type ActionState } from "./state";

/* Parametres d'exploitation. Une valeur vide reste vide : on
   n'invente jamais une information d'entreprise (CDC §92). */

export async function saveSettingsAction(
  _prev: ActionState, form: FormData,
): Promise<ActionState> {
  try {
    const user = await requirePermission("settings.update");

    const rows = await db.select().from(settings);
    let changed = 0;

    for (const row of rows) {
      if (!form.has(row.key)) continue;
      const raw = String(form.get(row.key) ?? "").trim();
      const next = raw === "" ? null : (/^-?\d+$/.test(raw) ? Number(raw) : raw);
      if (JSON.stringify(next) === JSON.stringify(row.value)) continue;

      await db.update(settings)
        .set({ value: next as never, updatedBy: user.id, updatedAt: new Date() })
        .where(eq(settings.key, row.key));

      await logActivity({
        actor: user, action: "settings.update", entityType: "settings",
        before: { key: row.key, value: row.value }, after: { key: row.key, value: next },
      });
      changed++;
    }

    revalidatePath("/admin/parametres");
    revalidatePath("/", "layout");
    return success(changed ? `${changed} parametre(s) enregistre(s).` : "Aucun changement.");
  } catch (err) {
    return toActionState(err);
  }
}
