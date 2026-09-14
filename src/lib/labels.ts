/* Libelles francais des statuts, avec leur couleur semantique. */

export type Tone = "neutral" | "ok" | "warn" | "danger" | "info";

export const RENTAL_LABELS: Record<string, { label: string; tone: Tone }> = {
  pending:          { label: "En attente",        tone: "warn" },
  approved:         { label: "Approuvee",         tone: "info" },
  rejected:         { label: "Rejetee",           tone: "danger" },
  awaiting_payment: { label: "Paiement attendu",  tone: "warn" },
  confirmed:        { label: "Confirmee",         tone: "info" },
  active:           { label: "En cours",          tone: "ok" },
  returned:         { label: "Rendue",            tone: "neutral" },
  completed:        { label: "Cloturee",          tone: "neutral" },
  cancelled:        { label: "Annulee",           tone: "neutral" },
};

export const RENTAL_ITEM_LABELS: Record<string, { label: string; tone: Tone }> = {
  reserved:  { label: "Reservee",  tone: "warn" },
  confirmed: { label: "Confirmee", tone: "info" },
  active:    { label: "Sortie",    tone: "ok" },
  returned:  { label: "Rendue",    tone: "neutral" },
  cancelled: { label: "Annulee",   tone: "neutral" },
};

export const ORDER_LABELS: Record<string, { label: string; tone: Tone }> = {
  pending:    { label: "En attente",    tone: "warn" },
  confirmed:  { label: "Confirmee",     tone: "info" },
  paid:       { label: "Payee",         tone: "ok" },
  processing: { label: "En preparation",tone: "info" },
  shipped:    { label: "Expediee",      tone: "info" },
  delivered:  { label: "Livree",        tone: "ok" },
  completed:  { label: "Cloturee",      tone: "neutral" },
  cancelled:  { label: "Annulee",       tone: "neutral" },
};

export const PAYMENT_LABELS: Record<string, { label: string; tone: Tone }> = {
  pending:    { label: "En attente",  tone: "warn" },
  processing: { label: "En cours",    tone: "info" },
  successful: { label: "Encaisse",    tone: "ok" },
  failed:     { label: "Echoue",      tone: "danger" },
  cancelled:  { label: "Annule",      tone: "neutral" },
  refunded:   { label: "Rembourse",   tone: "neutral" },
};

export const UNIT_STATUS_LABELS: Record<string, { label: string; tone: Tone }> = {
  available:   { label: "Disponible",   tone: "ok" },
  reserved:    { label: "Reserve",      tone: "warn" },
  rented:      { label: "En location",  tone: "info" },
  maintenance: { label: "Maintenance",  tone: "danger" },
  unavailable: { label: "Indisponible", tone: "neutral" },
};

export const UNIT_CONDITION_LABELS: Record<string, string> = {
  new: "Neuf", good: "Bon", fair: "Correct", poor: "Use", out_of_service: "Hors service",
};

export const MAINTENANCE_LABELS: Record<string, { label: string; tone: Tone }> = {
  scheduled:   { label: "Planifiee",  tone: "warn" },
  in_progress: { label: "En cours",   tone: "info" },
  completed:   { label: "Terminee",   tone: "ok" },
  cancelled:   { label: "Annulee",    tone: "neutral" },
};

export const DELIVERY_LABELS: Record<string, string> = {
  pickup: "Retrait en agence",
  delivery: "Livraison sur site",
};

export const RATE_BASIS_LABELS: Record<string, string> = {
  daily: "Journalier", weekly: "Hebdomadaire", monthly: "Mensuel",
};

export const PAYMENT_PROVIDER_LABELS: Record<string, string> = {
  cash: "Especes", bank_transfer: "Virement", wave: "Wave",
  orange_money: "Orange Money", card: "Carte", other: "Autre",
};
