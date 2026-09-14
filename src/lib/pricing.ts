import "server-only";
import { daysBetween } from "./format";
import type { PricingSettings } from "./settings";

/* ==========================================================
   Calcul du devis de location — SOURCE DE VERITE (CDC §22, §45)

   Le navigateur peut afficher une estimation, mais c'est cette
   fonction, executee cote serveur a partir des tarifs en base,
   qui produit le montant enregistre. Aucun montant recu du client
   n'est jamais repris tel quel.

   Tous les montants sont des entiers en FCFA.
   ========================================================== */

export type RateSource = {
  dailyRate: number | null;
  weeklyRate: number | null;
  monthlyRate: number | null;
  depositAmount: number | null;
};

export type QuoteLine = {
  rateBasis: "daily" | "weekly" | "monthly";
  unitRate: number;
  billedUnits: number;
  days: number;
  lineAmount: number;
  depositAmount: number;
};

export type Quote = {
  days: number;
  quantity: number;
  lines: QuoteLine;
  subtotal: number;
  discountBp: number;
  discount: number;
  delivery: number;
  taxableBase: number;
  vatRateBp: number;
  vat: number;
  total: number;
  deposit: number;
};

export class PricingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PricingError";
  }
}

/**
 * Choisit la base tarifaire la plus avantageuse pour le client
 * parmi celles qui sont renseignees, puis applique la remise duree.
 */
export function computeRentalQuote(params: {
  rates: RateSource;
  startDate: string;
  endDate: string;
  quantity: number;
  withDelivery: boolean;
  settings: PricingSettings;
}): Quote {
  const { rates, startDate, endDate, quantity, withDelivery, settings } = params;

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    throw new PricingError("Quantite invalide (1 a 20).");
  }
  const days = daysBetween(startDate, endDate);
  if (!Number.isFinite(days) || days < 1) {
    throw new PricingError("La date de fin doit etre posterieure ou egale au debut.");
  }
  if (days > 365) {
    throw new PricingError("Une location ne peut pas depasser 365 jours.");
  }

  const candidates: QuoteLine[] = [];
  const push = (
    basis: QuoteLine["rateBasis"], rate: number | null, span: number,
  ) => {
    if (rate == null || rate <= 0) return;
    const units = Math.ceil(days / span);
    candidates.push({
      rateBasis: basis, unitRate: rate, billedUnits: units, days,
      lineAmount: rate * units * quantity,
      depositAmount: (rates.depositAmount ?? 0) * quantity,
    });
  };
  push("daily", rates.dailyRate, 1);
  push("weekly", rates.weeklyRate, 7);
  push("monthly", rates.monthlyRate, 30);

  if (!candidates.length) {
    throw new PricingError(
      "Aucun tarif de location n'est renseigne pour ce materiel. " +
      "Renseignez-le dans l'administration avant d'accepter des demandes.",
    );
  }

  const line = candidates.reduce((a, b) => (b.lineAmount < a.lineAmount ? b : a));

  const discountBp =
    days >= 30 ? settings.discountMonthBp :
    days >= 7 ? settings.discountWeekBp : 0;

  const subtotal = line.lineAmount;
  const discount = Math.round((subtotal * discountBp) / 10_000);
  const delivery = withDelivery ? settings.deliveryFlatFee : 0;
  const taxableBase = subtotal - discount + delivery;
  const vat = Math.round((taxableBase * settings.vatRateBp) / 10_000);

  return {
    days, quantity, lines: line,
    subtotal, discountBp, discount, delivery,
    taxableBase, vatRateBp: settings.vatRateBp, vat,
    total: taxableBase + vat,
    deposit: line.depositAmount,
  };
}

/** Verifie que la date de debut respecte le delai minimum. */
export function assertLeadTime(startDate: string, minLeadDays: number): void {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(`${startDate}T00:00:00`);
  const diff = Math.round((start.getTime() - today.getTime()) / 86_400_000);
  if (diff < minLeadDays) {
    throw new PricingError(
      minLeadDays <= 0
        ? "La date de debut ne peut pas etre passee."
        : `La location commence au plus tot dans ${minLeadDays} jour(s).`,
    );
  }
}
