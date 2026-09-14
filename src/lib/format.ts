/* Formatage — FCFA sans sous-unite, dates francaises. */

export const money = (n: number | null | undefined): string =>
  n == null ? "—" : `${n.toLocaleString("fr-FR")} FCFA`;

/** Format compact pour les gros montants : 98 M FCFA, 1,8 M FCFA. */
export const moneyShort = (n: number | null | undefined): string => {
  if (n == null) return "—";
  if (n >= 1_000_000) {
    const m = n / 1_000_000;
    return `${Number.isInteger(m) ? m : m.toFixed(1).replace(".", ",")} M FCFA`;
  }
  return money(n);
};

export const bpToPercent = (bp: number): string =>
  `${(bp / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

export const formatDate = (v: string | Date | null | undefined): string => {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(`${v.slice(0, 10)}T00:00:00`) : v;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatDateTime = (v: Date | string | null | undefined): string => {
  if (!v) return "—";
  const d = typeof v === "string" ? new Date(v) : v;
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

/** Nombre de jours factures, bornes incluses. */
export const daysBetween = (start: string, end: string): number =>
  Math.round(
    (new Date(`${end}T00:00:00`).getTime() - new Date(`${start}T00:00:00`).getTime()) / 86_400_000,
  ) + 1;

export const todayISO = (): string => new Date().toISOString().slice(0, 10);

export const addDays = (iso: string, n: number): string => {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Reference lisible : LOC-2026-0042. */
export const buildReference = (prefix: string, n: number): string =>
  `${prefix}-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;
