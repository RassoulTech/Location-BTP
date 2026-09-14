/* ==========================================================
   Machines a etats (CDC §20, §27, §36, §77)

   Chaque statut a une signification precise et un jeu de
   transitions autorisees, declare ici et nulle part ailleurs.
   Aucune ecriture ne change un statut sans passer par
   assertTransition() : une demande rejetee ne peut pas devenir
   active, une commande annulee ne peut pas repartir en traitement.
   ========================================================== */

type Graph<S extends string> = Readonly<Record<S, readonly S[]>>;

export type RentalStatus =
  | "pending" | "approved" | "rejected" | "awaiting_payment"
  | "confirmed" | "active" | "returned" | "completed" | "cancelled";

export const RENTAL_TRANSITIONS: Graph<RentalStatus> = {
  pending: ["approved", "rejected", "cancelled"],
  approved: ["awaiting_payment", "confirmed", "cancelled"],
  rejected: [],
  awaiting_payment: ["confirmed", "cancelled"],
  confirmed: ["active", "cancelled"],
  active: ["returned"],
  returned: ["completed"],
  completed: [],
  cancelled: [],
};

export type RentalItemStatus =
  | "reserved" | "confirmed" | "active" | "returned" | "cancelled";

export const RENTAL_ITEM_TRANSITIONS: Graph<RentalItemStatus> = {
  reserved: ["confirmed", "cancelled"],
  confirmed: ["active", "cancelled"],
  active: ["returned"],
  returned: [],
  cancelled: [],
};

/** Statuts pendant lesquels l'exemplaire est indisponible. */
export const OCCUPYING_RENTAL_ITEM_STATUSES: readonly RentalItemStatus[] = [
  "reserved", "confirmed", "active",
];

export type OrderStatus =
  | "pending" | "confirmed" | "paid" | "processing"
  | "shipped" | "delivered" | "completed" | "cancelled";

export const ORDER_TRANSITIONS: Graph<OrderStatus> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["paid", "cancelled"],
  paid: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["completed"],
  completed: [],
  cancelled: [],
};

export type PaymentStatus =
  | "pending" | "processing" | "successful" | "failed" | "cancelled" | "refunded";

export const PAYMENT_TRANSITIONS: Graph<PaymentStatus> = {
  pending: ["processing", "cancelled", "failed"],
  processing: ["successful", "failed"],
  successful: ["refunded"],
  failed: ["pending"],
  cancelled: [],
  refunded: [],
};

export type MaintenanceStatus = "scheduled" | "in_progress" | "completed" | "cancelled";

export const MAINTENANCE_TRANSITIONS: Graph<MaintenanceStatus> = {
  scheduled: ["in_progress", "cancelled"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

/** Statuts pendant lesquels l'exemplaire est immobilise a l'atelier. */
export const OCCUPYING_MAINTENANCE_STATUSES: readonly MaintenanceStatus[] = [
  "scheduled", "in_progress",
];

export class InvalidTransitionError extends Error {
  constructor(
    readonly entity: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Transition impossible : ${entity} ne peut pas passer de « ${from} » a « ${to} ».`);
    this.name = "InvalidTransitionError";
  }
}

export function canTransition<S extends string>(
  graph: Graph<S>, from: S, to: S,
): boolean {
  return (graph[from] ?? []).includes(to);
}

/**
 * Verifie une transition avant ecriture. A appeler dans la meme
 * transaction que la mise a jour, jamais depuis le client.
 */
export function assertTransition<S extends string>(
  entity: string, graph: Graph<S>, from: S, to: S,
): void {
  if (from === to) return;
  if (!canTransition(graph, from, to)) {
    throw new InvalidTransitionError(entity, from, to);
  }
}
