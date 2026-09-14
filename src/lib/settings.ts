import "server-only";
import { inArray } from "drizzle-orm";
import { db } from "@/db";
import { settings } from "@/db/schema";

/* ==========================================================
   Parametres d'exploitation (CDC §92, §102)

   Rien de commercial n'est invente ici. Les seules valeurs par
   defaut sont structurelles ou legales :
     - TVA 18 % : taux legal senegalais
     - devise XOF : le FCFA
     - delai minimum 1 jour : contrainte de fonctionnement
   Les remises et le forfait de livraison valent 0 tant que
   l'entreprise ne les a pas confirmes — jamais un montant invente.
   ========================================================== */

export type PricingSettings = {
  vatRateBp: number;
  currency: string;
  deliveryFlatFee: number;
  discountWeekBp: number;
  discountMonthBp: number;
  minLeadDays: number;
  /** Cles encore vides — l'administration doit les renseigner. */
  unset: string[];
};

const DEFAULTS = {
  "billing.vat_rate_bp": 1800,
  "billing.currency": "XOF",
  "delivery.flat_fee": 0,
  "rental.discount_week_bp": 0,
  "rental.discount_month_bp": 0,
  "rental.min_lead_days": 1,
} as const;

const KEYS = Object.keys(DEFAULTS);

function asNumber(v: unknown, fallback: number): number {
  const n = typeof v === "string" ? Number(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export async function getPricingSettings(): Promise<PricingSettings> {
  const rows = await db.select().from(settings).where(inArray(settings.key, KEYS));
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const unset = KEYS.filter((k) => map.get(k) == null);

  return {
    vatRateBp: asNumber(map.get("billing.vat_rate_bp"), DEFAULTS["billing.vat_rate_bp"]),
    currency: (map.get("billing.currency") as string) ?? DEFAULTS["billing.currency"],
    deliveryFlatFee: asNumber(map.get("delivery.flat_fee"), DEFAULTS["delivery.flat_fee"]),
    discountWeekBp: asNumber(map.get("rental.discount_week_bp"), DEFAULTS["rental.discount_week_bp"]),
    discountMonthBp: asNumber(map.get("rental.discount_month_bp"), DEFAULTS["rental.discount_month_bp"]),
    minLeadDays: asNumber(map.get("rental.min_lead_days"), DEFAULTS["rental.min_lead_days"]),
    unset,
  };
}

export async function getCompanySettings() {
  const keys = [
    "company.legal_name", "company.ninea", "company.rccm", "company.address",
    "company.phones", "company.emails", "company.opening_hours", "company.service_areas",
  ];
  const rows = await db.select().from(settings).where(inArray(settings.key, keys));
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const get = (k: string) => {
    const v = map.get(k);
    return typeof v === "string" && v.trim() ? v.trim() : null;
  };
  return {
    legalName: get("company.legal_name"),
    ninea: get("company.ninea"),
    rccm: get("company.rccm"),
    address: get("company.address"),
    phones: get("company.phones"),
    emails: get("company.emails"),
    openingHours: get("company.opening_hours"),
    serviceAreas: get("company.service_areas"),
  };
}
