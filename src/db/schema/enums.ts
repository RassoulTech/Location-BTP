import { pgEnum } from "drizzle-orm/pg-core";

/* ==========================================================
   Statuts metier — types ENUM PostgreSQL, pas des chaines libres.
   Les transitions autorisees sont declarees dans src/lib/status.ts
   et verifiees avant chaque changement d'etat.
   ========================================================== */

/** Compte interne ou client. Desactiver plutot que supprimer (CDC §39, §96). */
export const userStatusEnum = pgEnum("user_status", ["active", "disabled"]);

export const customerTypeEnum = pgEnum("customer_type", ["individual", "company"]);

/** Etat d'un exemplaire physique (CDC §16). */
export const unitStatusEnum = pgEnum("unit_status", [
  "available",
  "reserved",
  "rented",
  "maintenance",
  "unavailable",
]);

/** Etat d'usure constate, independant de la disponibilite. */
export const unitConditionEnum = pgEnum("unit_condition", [
  "new",
  "good",
  "fair",
  "poor",
  "out_of_service",
]);

/** Cycle de vie d'une demande de location (CDC §20). */
export const rentalStatusEnum = pgEnum("rental_status", [
  "pending",
  "approved",
  "rejected",
  "awaiting_payment",
  "confirmed",
  "active",
  "returned",
  "completed",
  "cancelled",
]);

/**
 * Etat d'une ligne de location, rattachee a UNE unite physique.
 * Seuls reserved / confirmed / active occupent la machine : c'est
 * exactement le filtre de la contrainte d'exclusion anti-chevauchement.
 */
export const rentalItemStatusEnum = pgEnum("rental_item_status", [
  "reserved",
  "confirmed",
  "active",
  "returned",
  "cancelled",
]);

/** Cycle de vie d'une commande de vente (CDC §27). */
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "completed",
  "cancelled",
]);

/** Statut de paiement — distinct du statut de commande ou de location (CDC §36). */
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "processing",
  "successful",
  "failed",
  "cancelled",
  "refunded",
]);

/** Fournisseur de paiement. Aucun n'est branche a ce jour (CDC §35, §68). */
export const paymentProviderEnum = pgEnum("payment_provider", [
  "cash",
  "bank_transfer",
  "wave",
  "orange_money",
  "card",
  "other",
]);

/** Type de mouvement de stock (CDC §29). */
export const stockMovementTypeEnum = pgEnum("stock_movement_type", [
  "purchase",
  "sale",
  "adjustment",
  "return",
  "damage",
  "loss",
]);

export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "scheduled",
  "in_progress",
  "completed",
  "cancelled",
]);

/** Documents rattaches a une entite metier (CDC §37). */
export const documentTypeEnum = pgEnum("document_type", [
  "quote",
  "rental_contract",
  "invoice",
  "receipt",
  "delivery_note",
  "return_note",
  "other",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "issued",
  "paid",
  "partially_paid",
  "cancelled",
]);

export const deliveryModeEnum = pgEnum("delivery_mode", ["pickup", "delivery"]);

/** Periode de tarification appliquee a une ligne de location (CDC §22). */
export const rateBasisEnum = pgEnum("rate_basis", ["daily", "weekly", "monthly"]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "in_app",
  "email",
  "sms",
  "whatsapp",
]);
