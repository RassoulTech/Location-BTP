"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  customers, equipmentTypes, equipmentUnits, maintenanceRecords,
  rentalItems, rentalReturns, rentals,
} from "@/db/schema";
import { requirePermission, requireUser } from "@/lib/auth/guard";
import { availableUnits } from "@/lib/availability";
import { logActivity } from "@/lib/audit";
import { buildReference } from "@/lib/format";
import { assertLeadTime, computeRentalQuote } from "@/lib/pricing";
import { nextSequence } from "@/lib/sequence";
import { getPricingSettings } from "@/lib/settings";
import {
  RENTAL_ITEM_TRANSITIONS, RENTAL_TRANSITIONS, assertTransition,
  type RentalItemStatus, type RentalStatus,
} from "@/lib/status";
import { fieldErrors, rentalRequestSchema, returnSchema } from "@/lib/validation";
import { BusinessError, failure, success, toActionState, type ActionState } from "./state";

/* ==========================================================
   Locations — parcours complet (CDC §19 a §24)

   Principes tenus par ce fichier :
   - le devis est recalcule ici, jamais repris du navigateur ;
   - une demande reserve immediatement des exemplaires reels, donc
     elle bloque la machine des l'envoi ;
   - chaque changement d'etat passe par assertTransition() ;
   - tout s'execute dans une transaction, journal compris.
   ========================================================== */

async function loadRental(id: string) {
  const [rental] = await db.select().from(rentals).where(eq(rentals.id, id)).limit(1);
  if (!rental) throw new BusinessError("Location introuvable.");
  return rental;
}

/** Fiche client rattachee au compte connecte. */
async function customerOfUser(userId: string) {
  const [customer] = await db.select().from(customers)
    .where(eq(customers.userId, userId)).limit(1);
  if (!customer) {
    throw new BusinessError(
      "Aucune fiche client n'est rattachee a votre compte. Contactez la conciergerie.",
    );
  }
  return customer;
}

/* ---------- Creation d'une demande ---------- */

export async function createRentalRequestAction(
  _prev: ActionState, form: FormData,
): Promise<ActionState> {
  try {
    const user = await requirePermission("rentals.create");

    const parsed = rentalRequestSchema.safeParse({
      typeId: form.get("typeId"),
      startDate: form.get("startDate"),
      endDate: form.get("endDate"),
      quantity: form.get("quantity"),
      deliveryMode: form.get("deliveryMode"),
      siteAddress: form.get("siteAddress"),
      siteCity: form.get("siteCity"),
      customerNote: form.get("customerNote"),
    });
    if (!parsed.success) return failure("Verifiez les champs.", fieldErrors(parsed.error));
    const input = parsed.data;

    const settings = await getPricingSettings();
    assertLeadTime(input.startDate, settings.minLeadDays);

    const [type] = await db.select().from(equipmentTypes)
      .where(eq(equipmentTypes.id, input.typeId)).limit(1);
    if (!type) throw new BusinessError("Materiel introuvable.");
    if (!type.isRentable) throw new BusinessError("Ce materiel n'est pas propose a la location.");

    // Le montant qui sera enregistre vient d'ici, pas du formulaire.
    const quote = computeRentalQuote({
      rates: type,
      startDate: input.startDate,
      endDate: input.endDate,
      quantity: input.quantity,
      withDelivery: input.deliveryMode === "delivery",
      settings,
    });

    const free = await availableUnits({
      typeId: type.id, startDate: input.startDate, endDate: input.endDate,
    });
    if (free.length < input.quantity) {
      throw new BusinessError(
        free.length === 0
          ? "Aucun exemplaire n'est disponible sur cette periode."
          : `Seulement ${free.length} exemplaire(s) disponible(s) sur cette periode.`,
      );
    }

    const customer = await customerOfUser(user.id);
    const chosen = free.slice(0, input.quantity);
    const perUnit = Math.round(quote.lines.lineAmount / input.quantity);
    const perUnitDeposit = Math.round(quote.deposit / input.quantity);

    const reference = await db.transaction(async (tx) => {
      const seq = await nextSequence(tx, rentals, "LOC");
      const ref = buildReference("LOC", seq);

      const [rental] = await tx.insert(rentals).values({
        reference: ref,
        customerId: customer.id,
        status: "pending",
        startDate: input.startDate,
        endDate: input.endDate,
        deliveryMode: input.deliveryMode,
        siteAddress: input.siteAddress || null,
        siteCity: input.siteCity || null,
        subtotalAmount: quote.subtotal,
        discountAmount: quote.discount,
        deliveryAmount: quote.delivery,
        taxAmount: quote.vat,
        totalAmount: quote.total,
        depositAmount: quote.deposit,
        customerNote: input.customerNote || null,
      }).returning({ id: rentals.id });

      // Une ligne par exemplaire : c'est la contrainte d'exclusion
      // sur unit_occupancies qui arbitre en cas de simultaneite.
      await tx.insert(rentalItems).values(
        chosen.map((unit) => ({
          rentalId: rental!.id,
          typeId: type.id,
          unitId: unit.id,
          status: "reserved" as const,
          startDate: input.startDate,
          endDate: input.endDate,
          rateBasis: quote.lines.rateBasis,
          unitRate: quote.lines.unitRate,
          billedUnits: quote.lines.billedUnits,
          lineAmount: perUnit,
          depositAmount: perUnitDeposit,
        })),
      );

      await logActivity({
        actor: user, action: "rental.request", entityType: "rentals", entityId: rental!.id,
        after: { reference: ref, total: quote.total, units: chosen.map((u) => u.code) },
        tx,
      });

      return ref;
    });

    revalidatePath("/espace/locations");
    revalidatePath("/admin/locations");
    return success(
      `Demande ${reference} enregistree. ${chosen.length} exemplaire(s) reserve(s) ` +
      `en attente de validation.`,
    );
  } catch (err) {
    return toActionState(err);
  }
}

/* ---------- Decisions administratives ---------- */

async function changeRentalStatus(params: {
  rentalId: string;
  to: RentalStatus;
  itemsTo?: RentalItemStatus;
  unitStatus?: "available" | "rented" | "reserved";
  permission: Parameters<typeof requirePermission>[0];
  action: string;
  extra?: Partial<typeof rentals.$inferInsert>;
}) {
  const user = await requirePermission(params.permission);
  const rental = await loadRental(params.rentalId);

  assertTransition("La location", RENTAL_TRANSITIONS, rental.status, params.to);

  await db.transaction(async (tx) => {
    await tx.update(rentals)
      .set({ status: params.to, updatedAt: new Date(), ...params.extra })
      .where(eq(rentals.id, rental.id));

    if (params.itemsTo) {
      const items = await tx.select().from(rentalItems)
        .where(eq(rentalItems.rentalId, rental.id));

      for (const item of items) {
        if (item.status === "returned" || item.status === "cancelled") continue;
        assertTransition("La ligne de location", RENTAL_ITEM_TRANSITIONS, item.status, params.itemsTo!);
      }

      await tx.update(rentalItems)
        .set({ status: params.itemsTo, updatedAt: new Date() })
        .where(and(
          eq(rentalItems.rentalId, rental.id),
          inArray(rentalItems.status, ["reserved", "confirmed", "active"]),
        ));

      if (params.unitStatus) {
        const unitIds = items.map((i) => i.unitId).filter((v): v is string => Boolean(v));
        if (unitIds.length) {
          await tx.update(equipmentUnits)
            .set({ status: params.unitStatus, updatedAt: new Date() })
            .where(and(
              inArray(equipmentUnits.id, unitIds),
              // On ne sort jamais une machine de l'atelier par effet de bord.
              inArray(equipmentUnits.status, ["available", "reserved", "rented"]),
            ));
        }
      }
    }

    await logActivity({
      actor: user, action: params.action, entityType: "rentals", entityId: rental.id,
      before: { status: rental.status }, after: { status: params.to, ...params.extra }, tx,
    });
  });

  revalidatePath("/admin/locations");
  revalidatePath(`/admin/locations/${rental.id}`);
  revalidatePath("/espace/locations");
}

export async function approveRentalAction(
  _prev: ActionState, form: FormData,
): Promise<ActionState> {
  try {
    const id = String(form.get("rentalId") ?? "");
    await changeRentalStatus({
      rentalId: id, to: "approved", permission: "rentals.validate",
      action: "rental.approve",
      extra: { decidedAt: new Date() },
    });
    return success("Demande approuvee.");
  } catch (err) {
    return toActionState(err);
  }
}

export async function rejectRentalAction(
  _prev: ActionState, form: FormData,
): Promise<ActionState> {
  try {
    const id = String(form.get("rentalId") ?? "");
    const reason = String(form.get("reason") ?? "").trim();
    if (reason.length < 5) {
      return failure("Indiquez le motif du rejet.", { reason: "Motif trop court." });
    }
    // Les lignes passent en `cancelled` : les exemplaires sont liberes
    // par le trigger, immediatement relouables.
    await changeRentalStatus({
      rentalId: id, to: "rejected", itemsTo: "cancelled", unitStatus: "available",
      permission: "rentals.validate", action: "rental.reject",
      extra: { decidedAt: new Date(), rejectionReason: reason },
    });
    return success("Demande rejetee, exemplaires liberes.");
  } catch (err) {
    return toActionState(err);
  }
}

export async function confirmRentalAction(
  _prev: ActionState, form: FormData,
): Promise<ActionState> {
  try {
    await changeRentalStatus({
      rentalId: String(form.get("rentalId") ?? ""),
      to: "confirmed", itemsTo: "confirmed", unitStatus: "reserved",
      permission: "rentals.validate", action: "rental.confirm",
    });
    return success("Location confirmee.");
  } catch (err) {
    return toActionState(err);
  }
}

export async function activateRentalAction(
  _prev: ActionState, form: FormData,
): Promise<ActionState> {
  try {
    await changeRentalStatus({
      rentalId: String(form.get("rentalId") ?? ""),
      to: "active", itemsTo: "active", unitStatus: "rented",
      permission: "rentals.validate", action: "rental.activate",
    });
    return success("Materiel sorti, location en cours.");
  } catch (err) {
    return toActionState(err);
  }
}

export async function cancelRentalAction(
  _prev: ActionState, form: FormData,
): Promise<ActionState> {
  try {
    const id = String(form.get("rentalId") ?? "");
    const user = await requireUser();
    const rental = await loadRental(id);

    // Un client peut annuler sa propre demande tant qu'elle n'est pas sortie.
    const isOwner = await db.select({ id: customers.id }).from(customers)
      .where(and(eq(customers.id, rental.customerId), eq(customers.userId, user.id)))
      .limit(1);

    if (!isOwner.length) {
      await requirePermission("rentals.cancel");
    } else if (!["pending", "approved", "awaiting_payment"].includes(rental.status)) {
      throw new BusinessError(
        "Cette location ne peut plus etre annulee en ligne. Contactez la conciergerie.",
      );
    }

    await changeRentalStatus({
      rentalId: id, to: "cancelled", itemsTo: "cancelled", unitStatus: "available",
      permission: isOwner.length ? "rentals.create" : "rentals.cancel",
      action: "rental.cancel",
      extra: { cancelledAt: new Date() },
    });
    return success("Location annulee, exemplaires liberes.");
  } catch (err) {
    return toActionState(err);
  }
}

/* ---------- Retour d'un exemplaire (CDC §24) ---------- */

export async function registerReturnAction(
  _prev: ActionState, form: FormData,
): Promise<ActionState> {
  try {
    const user = await requirePermission("rentals.return");

    const parsed = returnSchema.safeParse({
      rentalItemId: form.get("rentalItemId"),
      hourMeter: form.get("hourMeter") || undefined,
      damageDescription: form.get("damageDescription"),
      damageAmount: form.get("damageAmount") || undefined,
      requiresMaintenance: form.get("requiresMaintenance") === "on",
      notes: form.get("notes"),
    });
    if (!parsed.success) return failure("Verifiez les champs.", fieldErrors(parsed.error));
    const input = parsed.data;

    const [item] = await db.select().from(rentalItems)
      .where(eq(rentalItems.id, input.rentalItemId)).limit(1);
    if (!item) throw new BusinessError("Ligne de location introuvable.");

    assertTransition("La ligne de location", RENTAL_ITEM_TRANSITIONS, item.status, "returned");

    await db.transaction(async (tx) => {
      await tx.insert(rentalReturns).values({
        rentalItemId: item.id,
        receivedBy: user.id,
        hourMeter: input.hourMeter ?? null,
        damageDescription: input.damageDescription || null,
        damageAmount: input.damageAmount ?? 0,
        requiresMaintenance: input.requiresMaintenance ? 1 : 0,
        notes: input.notes || null,
      });

      // `returned` libere l'exemplaire via le trigger d'occupation.
      await tx.update(rentalItems)
        .set({ status: "returned", updatedAt: new Date() })
        .where(eq(rentalItems.id, item.id));

      if (item.unitId) {
        await tx.update(equipmentUnits).set({
          status: input.requiresMaintenance ? "maintenance" : "available",
          hourMeter: input.hourMeter ?? undefined,
          updatedAt: new Date(),
        }).where(eq(equipmentUnits.id, item.unitId));

        // Un retour avec dommages ouvre une intervention, qui occupe
        // a son tour la machine et l'empeche d'etre relouee.
        if (input.requiresMaintenance) {
          const today = new Date().toISOString().slice(0, 10);
          await tx.insert(maintenanceRecords).values({
            unitId: item.unitId,
            status: "scheduled",
            title: "Controle apres retour",
            description: input.damageDescription || "Immobilisation demandee au retour.",
            startDate: today,
            endDate: today,
            cost: input.damageAmount ?? 0,
            hourMeter: input.hourMeter ?? null,
          });
        }
      }

      // Toutes les lignes rendues -> la location passe a `returned`.
      const siblings = await tx.select({ status: rentalItems.status }).from(rentalItems)
        .where(eq(rentalItems.rentalId, item.rentalId));
      const allBack = siblings.every((s) => s.status === "returned" || s.status === "cancelled");

      if (allBack) {
        const [rental] = await tx.select().from(rentals)
          .where(eq(rentals.id, item.rentalId)).limit(1);
        if (rental && rental.status === "active") {
          assertTransition("La location", RENTAL_TRANSITIONS, rental.status, "returned");
          await tx.update(rentals)
            .set({ status: "returned", updatedAt: new Date() })
            .where(eq(rentals.id, rental.id));
        }
      }

      await logActivity({
        actor: user, action: "rental.return", entityType: "rental_items", entityId: item.id,
        before: { status: item.status },
        after: {
          status: "returned",
          hourMeter: input.hourMeter ?? null,
          damages: input.damageAmount ?? 0,
          maintenance: Boolean(input.requiresMaintenance),
        },
        tx,
      });
    });

    revalidatePath("/admin/locations");
    revalidatePath("/admin/materiels");
    return success(
      input.requiresMaintenance
        ? "Retour enregistre. L'exemplaire part en maintenance et n'est plus louable."
        : "Retour enregistre. L'exemplaire est de nouveau disponible.",
    );
  } catch (err) {
    return toActionState(err);
  }
}

export async function completeRentalAction(
  _prev: ActionState, form: FormData,
): Promise<ActionState> {
  try {
    await changeRentalStatus({
      rentalId: String(form.get("rentalId") ?? ""),
      to: "completed", permission: "rentals.validate", action: "rental.complete",
    });
    return success("Location cloturee.");
  } catch (err) {
    return toActionState(err);
  }
}
