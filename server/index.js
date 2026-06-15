/* ==========================================================
   NDIOBEEN GUI LOGISTIQUE — serveur web + API
   Sert le site (../premium) et expose :
     POST /api/bookings  → location OU devis d'achat : e-mails + notification
     POST /api/contact   → accusé de réception + notification
   Sécurité : tarifs recalculés côté serveur, validation stricte,
   limitation de débit par IP, honeypot anti-spam, en-têtes durcis.
   ========================================================== */

require("dotenv").config({ path: require("path").join(__dirname, ".env") });
const path = require("path");
const fs = require("fs");
const express = require("express");
const { sendMail } = require("./mailer");
const tpl = require("./templates");

const app = express();
const PORT = Number(process.env.PORT || 8765);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "commercial@ndiobeen-logistique.sn";
const DATA_DIR = path.join(__dirname, "data");
fs.mkdirSync(DATA_DIR, { recursive: true });

/* ---------- Référentiel tarifaire (source de vérité serveur) ---------- */
const CATALOG = {
  "chariot-diesel":   { name: "Chariot élévateur diesel 3,5 T",   price: 65000,  sale: 22000000, caution: 1500000, stock: 6 },
  "chariot-elec":     { name: "Chariot élévateur électrique 2 T", price: 55000,  sale: 19500000, caution: 1200000, stock: 4 },
  "telescopique":     { name: "Chariot télescopique 14 m",        price: 120000, sale: 58000000, caution: 2500000, stock: 2 },
  "transpal-manuel":  { name: "Transpalette manuel 2,5 T",        price: 8000,   sale: 350000,   caution: 100000,  stock: 14 },
  "transpal-elec":    { name: "Transpalette électrique 2 T",      price: 25000,  sale: 4500000,  caution: 500000,  stock: 8 },
  "gerbeur":          { name: "Gerbeur électrique 1,6 T",         price: 35000,  sale: 7500000,  caution: 750000,  stock: 5 },
  "preparateur":      { name: "Préparateur de commandes 5 m",     price: 45000,  sale: 12000000, caution: 1000000, stock: 3 },
  "nacelle-ciseaux":  { name: "Nacelle ciseaux 10 m",             price: 60000,  sale: 14000000, caution: 800000,  stock: 7 },
  "nacelle-artic":    { name: "Nacelle articulée 16 m",           price: 100000, sale: 38000000, caution: 1500000, stock: 4 },
  "grue-atelier":     { name: "Grue d'atelier 2 T",               price: 20000,  sale: 1200000,  caution: 300000,  stock: 9 },
  "table-elevatrice": { name: "Table élévatrice 800 kg",          price: 15000,  sale: 900000,   caution: 250000,  stock: 11 },
  "palan-portique":   { name: "Palan électrique 1 T + portique",  price: 30000,  sale: 2200000,  caution: 600000,  stock: 0 },
};
const DELIVERY_COST = 40000;
const TVA_RATE = 0.18;
const DEPOSIT_RATE = 0.30; // acompte à la commande (vente)

/* ---------- Disponibilité dynamique (parc − ventes − locations en cours) ----------
   Le parc total de chaque machine est CATALOG[id].stock. Une VENTE retire l'unité
   définitivement ; une LOCATION la rend indisponible jusqu'à sa date de fin, puis
   l'unité « revient » d'elle-même (recalcul à chaque lecture, sans tâche planifiée). */
let BOOKINGS = [];
function loadBookings() {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, "bookings.jsonl"), "utf8");
    BOOKINGS = raw.split("\n").filter(Boolean)
      .map(l => { try { return JSON.parse(l); } catch (_) { return null; } })
      .filter(Boolean);
  } catch (_) { BOOKINGS = []; }
}
const todayISO = () => new Date().toISOString().slice(0, 10);
function availabilityMap() {
  const today = todayISO();
  const used = {};
  for (const b of BOOKINGS) {
    if (!b || !CATALOG[b.equip]) continue;
    const qty = Math.max(0, Math.trunc(Number(b.qty)) || 0);
    if (!qty) continue;
    // Vente : définitif. Location : occupe l'unité jusqu'à sa date de fin incluse.
    if (b.mode === "vente" || (b.end && b.end >= today)) used[b.equip] = (used[b.equip] || 0) + qty;
  }
  const out = {};
  for (const [id, it] of Object.entries(CATALOG)) out[id] = Math.max(0, it.stock - (used[id] || 0));
  return out;
}
const availabilityOf = id => availabilityMap()[id] ?? 0;
loadBookings();

/* ---------- Middlewares ---------- */
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.set({
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  });
  next();
});
app.use(express.json({ limit: "32kb" }));

// Limitation de débit : 8 requêtes / 10 min / IP sur l'API
const hits = new Map();
function rateLimit(req, res, next) {
  const ip = req.ip || "?";
  const now = Date.now();
  const windowMs = 10 * 60 * 1000;
  const list = (hits.get(ip) || []).filter(t => now - t < windowMs);
  if (list.length >= 8) {
    return res.status(429).json({ ok: false, error: "Trop de requêtes. Réessayez dans quelques minutes." });
  }
  list.push(now);
  hits.set(ip, list);
  next();
}

/* ---------- Validation ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (v, max = 200) => String(v ?? "").replace(/[\r\n\t]+/g, " ").trim().slice(0, max);
const isISODate = v => /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v + "T00:00:00"));

function computeQuote({ equip, qty, start, end, delivery, mode }) {
  const item = CATALOG[equip];
  if (!item) return { error: "Machine inconnue." };
  qty = Math.trunc(Number(qty));
  if (!(qty >= 1 && qty <= 10)) return { error: "Quantité invalide (1 à 10)." };
  const deliveryCost = delivery === "livraison" ? DELIVERY_COST : 0;

  // ----- Vente : devis d'achat (ni dates ni caution) -----
  if (mode === "vente") {
    const base = item.sale * qty;
    const ht = base + deliveryCost;
    const tva = Math.round(ht * TVA_RATE);
    const ttc = ht + tva;
    return {
      mode: "vente", name: item.name, qty,
      unit: item.sale, base, delivery: deliveryCost,
      ht, tva, tvaRate: TVA_RATE, ttc,
      deposit: Math.round(ttc * DEPOSIT_RATE),
    };
  }

  // ----- Location (défaut) -----
  if (!isISODate(start) || !isISODate(end)) return { error: "Dates invalides." };
  const t0 = new Date(start + "T00:00:00"), t1 = new Date(end + "T00:00:00");
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (t0 <= today) return { error: "La location commence au plus tôt demain." };
  const days = Math.round((t1 - t0) / 86400000) + 1;
  if (days < 1 || days > 365) return { error: "La date de fin doit être après le début (1 an max)." };
  const base = item.price * days * qty;
  const rate = days >= 30 ? 0.20 : days >= 7 ? 0.10 : 0;
  const discount = Math.round(base * rate);
  const ht = base - discount + deliveryCost;
  const tva = Math.round(ht * TVA_RATE);
  return {
    mode: "location",
    name: item.name, qty, days, base, rate, discount,
    delivery: deliveryCost, ht, tva, tvaRate: TVA_RATE, ttc: ht + tva,
    caution: item.caution * qty,
  };
}

function appendJsonl(file, obj) {
  fs.appendFile(path.join(DATA_DIR, file), JSON.stringify(obj) + "\n", err => {
    if (err) console.error(`[data] écriture ${file} :`, err.message);
  });
}

/* ---------- API : réservation ---------- */
app.post("/api/bookings", rateLimit, async (req, res) => {
  try {
    const b = req.body || {};
    if (clean(b.website)) return res.json({ ok: true, ref: "TRL-OK" }); // honeypot : on fait semblant

    const booking = {
      mode: b.mode === "vente" ? "vente" : "location",
      equip: clean(b.equip, 40),
      qty: b.qty,
      start: clean(b.start, 10),
      end: clean(b.end, 10),
      delivery: b.delivery === "livraison" ? "livraison" : "retrait",
      clientType: b.clientType === "part" ? "part" : "pro",
      name: clean(b.name, 80),
      company: clean(b.company, 80),
      email: clean(b.email, 120).toLowerCase(),
      phone: clean(b.phone, 30),
      address: clean(b.address, 160),
      city: clean(b.city, 60),
    };

    if (booking.name.length < 2) return res.status(400).json({ ok: false, error: "Nom invalide." });
    if (!EMAIL_RE.test(booking.email)) return res.status(400).json({ ok: false, error: "Adresse e-mail invalide." });
    if (booking.phone.replace(/\D/g, "").length < 7) return res.status(400).json({ ok: false, error: "Téléphone invalide." });
    if (booking.delivery === "livraison" && (booking.address.length < 5 || booking.city.length < 2)) {
      return res.status(400).json({ ok: false, error: "Adresse de livraison incomplète." });
    }

    const quote = computeQuote(booking);
    if (quote.error) return res.status(400).json({ ok: false, error: quote.error });

    // Contrôle de la disponibilité (parc − ventes − locations en cours)
    booking.qty = quote.qty;
    const avail = availabilityOf(booking.equip);
    if (avail < quote.qty) {
      return res.status(409).json({ ok: false, error: avail > 0
        ? `Stock insuffisant — il reste ${avail} unité${avail > 1 ? "s" : ""} en stock.`
        : "Matériel actuellement épuisé — contactez-nous pour les délais." });
    }

    const isSale = quote.mode === "vente";
    booking.ref = (isSale ? "TRL-V-" : "TRL-L-") + new Date().getFullYear() + "-" +
      String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    booking.createdAt = new Date().toISOString();

    // Préparer le message WhatsApp de finalisation (remplace l'envoi d'e-mails)
    const waNumber = "221782953780"; // numéro fourni
    const waBase = `https://wa.me/${waNumber}?text=`;
    const msg = isSale
      ? `Bonjour, je souhaite finaliser mon devis d\'achat ${booking.ref} — ${quote.name} × ${quote.qty}. Nom: ${booking.name}; Tél: ${booking.phone}; E-mail: ${booking.email}.`
      : `Bonjour, je souhaite finaliser ma réservation ${booking.ref} — ${quote.name} × ${quote.qty} du ${booking.start} au ${booking.end}. Nom: ${booking.name}; Tél: ${booking.phone}; E-mail: ${booking.email}.`;
    const whatsappUrl = waBase + encodeURIComponent(msg);

    // Enregistre la commande (journal + mémoire) une fois confirmée
    const record = { ...booking, totalTTC: quote.ttc };
    appendJsonl("bookings.jsonl", record);
    BOOKINGS.push(record);

    res.json({ ok: true, ref: booking.ref, totalTTC: quote.ttc, stock: availabilityOf(booking.equip), whatsappUrl });
  } catch (err) {
    console.error("[bookings]", err);
    res.status(500).json({ ok: false, error: "L'envoi de la confirmation a échoué. Réessayez ou appelez la conciergerie." });
  }
});

/* ---------- API : contact ---------- */
app.post("/api/contact", rateLimit, async (req, res) => {
  try {
    const c = {
      name: clean(req.body?.name, 80),
      email: clean(req.body?.email, 120).toLowerCase(),
      phone: clean(req.body?.phone, 30),
      message: String(req.body?.message ?? "").trim().slice(0, 2000),
    };
    if (clean(req.body?.website)) return res.json({ ok: true }); // honeypot

    if (c.name.length < 2) return res.status(400).json({ ok: false, error: "Nom invalide." });
    if (!EMAIL_RE.test(c.email)) return res.status(400).json({ ok: false, error: "Adresse e-mail invalide." });
    if (c.message.length < 5) return res.status(400).json({ ok: false, error: "Message trop court." });

    appendJsonl("contacts.jsonl", { ...c, createdAt: new Date().toISOString() });

    // Préparer un lien WhatsApp pour la prise de contact (remplace l'envoi d'e-mails)
    const waNumber = "221782953780";
    const waBase = `https://wa.me/${waNumber}?text=`;
    const msg = `Bonjour, je vous contacte depuis le site — ${c.name} : ${c.message}. Tél: ${c.phone}; E-mail: ${c.email}.`;
    const whatsappUrl = waBase + encodeURIComponent(msg);

    res.json({ ok: true, whatsappUrl });
  } catch (err) {
    console.error("[contact]", err);
    res.status(500).json({ ok: false, error: "L'envoi a échoué. Réessayez ou appelez la conciergerie." });
  }
});

/* ---------- API : disponibilité en direct ---------- */
app.get("/api/stock", (req, res) => res.json(availabilityMap()));

/* ---------- Site statique ---------- */
const SITE_DIR = path.join(__dirname, "..", "premium");
app.use(express.static(SITE_DIR, { extensions: ["html"] }));

app.listen(PORT, () => {
  console.log(`[server] NDIOBEEN GUI LOGISTIQUE sur http://localhost:${PORT}`);
  console.log(`[server] Notifications internes → ${ADMIN_EMAIL}`);
});
