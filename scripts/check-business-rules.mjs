/* ==========================================================
   Verification des regles metier pures — sans base de donnees.
   Devis, bases tarifaires, remises, transitions de statut.

     node scripts/check-business-rules.mjs
   ========================================================== */
import assert from "node:assert/strict";

/* Copies des tables de transition de src/lib/status.ts.
   Si elles divergent, ce script doit etre mis a jour aussi. */
const RENTAL = {
  pending: ["approved", "rejected", "cancelled"],
  approved: ["awaiting_payment", "confirmed", "cancelled"],
  rejected: [], awaiting_payment: ["confirmed", "cancelled"],
  confirmed: ["active", "cancelled"], active: ["returned"],
  returned: ["completed"], completed: [], cancelled: [],
};
const ORDER = {
  pending: ["confirmed", "cancelled"], confirmed: ["paid", "cancelled"],
  paid: ["processing", "cancelled"], processing: ["shipped", "cancelled"],
  shipped: ["delivered"], delivered: ["completed"], completed: [], cancelled: [],
};

const days = (a, b) =>
  Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 86400000) + 1;

function quote({ rates, start, end, qty, delivery, s }) {
  const d = days(start, end);
  const cands = [];
  const add = (basis, rate, span) => {
    if (!rate) return;
    const units = Math.ceil(d / span);
    cands.push({ basis, rate, units, amount: rate * units * qty });
  };
  add("daily", rates.dailyRate, 1);
  add("weekly", rates.weeklyRate, 7);
  add("monthly", rates.monthlyRate, 30);
  const line = cands.reduce((a, b) => (b.amount < a.amount ? b : a));
  const discountBp = d >= 30 ? s.discountMonthBp : d >= 7 ? s.discountWeekBp : 0;
  const subtotal = line.amount;
  const discount = Math.round((subtotal * discountBp) / 10000);
  const del = delivery ? s.deliveryFlatFee : 0;
  const base = subtotal - discount + del;
  const vat = Math.round((base * s.vatRateBp) / 10000);
  return { d, line, subtotal, discount, delivery: del, vat, total: base + vat };
}

const S = {
  vatRateBp: 1800, deliveryFlatFee: 40000,
  discountWeekBp: 1000, discountMonthBp: 2000, minLeadDays: 1,
};

let n = 0;
const test = (name, fn) => { fn(); n++; console.log(`  ok  ${name}`); };

console.log("Devis de location");

test("bornes incluses : du 1er au 10 = 10 jours", () => {
  assert.equal(days("2026-10-01", "2026-10-10"), 10);
});

test("un seul jour est facture 1 jour", () => {
  assert.equal(days("2026-10-01", "2026-10-01"), 1);
});

test("3 jours a 180 000 = 540 000, sans remise", () => {
  const q = quote({
    rates: { dailyRate: 180000 }, start: "2026-10-01", end: "2026-10-03",
    qty: 1, delivery: false, s: S,
  });
  assert.equal(q.subtotal, 540000);
  assert.equal(q.discount, 0);
  assert.equal(q.vat, 97200);
  assert.equal(q.total, 637200);
});

test("10 jours declenchent la remise hebdomadaire de 10 %", () => {
  const q = quote({
    rates: { dailyRate: 180000 }, start: "2026-10-01", end: "2026-10-10",
    qty: 1, delivery: false, s: S,
  });
  assert.equal(q.subtotal, 1800000);
  assert.equal(q.discount, 180000);
  assert.equal(q.total, 1800000 - 180000 + Math.round(1620000 * 0.18));
});

test("35 jours declenchent la remise mensuelle de 20 %", () => {
  const q = quote({
    rates: { dailyRate: 100000 }, start: "2026-10-01", end: "2026-11-04",
    qty: 1, delivery: false, s: S,
  });
  assert.equal(q.d, 35);
  assert.equal(q.discount, Math.round(q.subtotal * 0.2));
});

test("la base la moins chere est retenue : 7 jours -> tarif hebdo", () => {
  const q = quote({
    rates: { dailyRate: 100000, weeklyRate: 500000 },
    start: "2026-10-01", end: "2026-10-07", qty: 1, delivery: false, s: S,
  });
  assert.equal(q.line.basis, "weekly");
  assert.equal(q.subtotal, 500000);
});

test("la quantite multiplie bien la ligne", () => {
  const a = quote({ rates: { dailyRate: 120000 }, start: "2026-10-01", end: "2026-10-05", qty: 1, delivery: false, s: S });
  const b = quote({ rates: { dailyRate: 120000 }, start: "2026-10-01", end: "2026-10-05", qty: 3, delivery: false, s: S });
  assert.equal(b.subtotal, a.subtotal * 3);
});

test("la livraison s'ajoute avant la TVA", () => {
  const a = quote({ rates: { dailyRate: 100000 }, start: "2026-10-01", end: "2026-10-02", qty: 1, delivery: false, s: S });
  const b = quote({ rates: { dailyRate: 100000 }, start: "2026-10-01", end: "2026-10-02", qty: 1, delivery: true, s: S });
  assert.equal(b.total - a.total, 40000 + Math.round(40000 * 0.18));
});

test("tous les montants sont des entiers", () => {
  const q = quote({
    rates: { dailyRate: 123457 }, start: "2026-10-01", end: "2026-10-11",
    qty: 3, delivery: true, s: S,
  });
  for (const [k, v] of Object.entries(q)) {
    if (typeof v === "number") assert.ok(Number.isInteger(v), `${k} = ${v}`);
  }
});

console.log("\nTransitions de statut");

test("une demande rejetee ne peut pas devenir active", () => {
  assert.ok(!RENTAL.rejected.includes("active"));
  assert.equal(RENTAL.rejected.length, 0);
});

test("une location annulee est un etat final", () => {
  assert.equal(RENTAL.cancelled.length, 0);
});

test("on ne peut pas sortir le materiel sans confirmation", () => {
  assert.ok(!RENTAL.pending.includes("active"));
  assert.ok(!RENTAL.approved.includes("active"));
  assert.ok(RENTAL.confirmed.includes("active"));
});

test("une location en cours ne peut plus etre annulee", () => {
  assert.ok(!RENTAL.active.includes("cancelled"));
});

test("une commande annulee ne repart pas en traitement", () => {
  assert.equal(ORDER.cancelled.length, 0);
});

test("une commande livree ne peut pas etre annulee", () => {
  assert.ok(!ORDER.delivered.includes("cancelled"));
});

test("aucun statut ne boucle sur lui-meme", () => {
  for (const [from, tos] of Object.entries({ ...RENTAL, ...ORDER })) {
    assert.ok(!tos.includes(from), `${from} -> ${from}`);
  }
});

console.log(`\n${n} verification(s) passee(s).`);
