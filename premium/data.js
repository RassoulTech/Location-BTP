/* ==========================================================
   NDIOBEEN GUI LOGISTIQUE — parc de levage & manutention + illustrations produit
   Leader sénégalais : location ET vente — tarifs location FCFA/jour · prix d'achat FCFA
   ========================================================== */

// ---------- Illustrations SVG (duotone or/graphite) ----------
const _D = "#2b2724", _D2 = "#4a443d", _HUB = "#9a907f", _GL = "#aebfc7";

function _scene(p, inner) {
  return `<svg class="illus" viewBox="0 0 240 170" aria-hidden="true">
    <defs><linearGradient id="g${p}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f0c969"/><stop offset="1" stop-color="#b07c0c"/>
    </linearGradient></defs>
    <ellipse cx="120" cy="153" rx="90" ry="9" fill="#000" opacity=".16"/>
    ${inner}
  </svg>`;
}
const _wheel = (cx, cy, r) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${_D}"/>
   <circle cx="${cx}" cy="${cy}" r="${r * 0.45}" fill="${_HUB}"/>
   <circle cx="${cx}" cy="${cy}" r="${r * 0.18}" fill="${_D}"/>`;

const ART = {
  forklift(p, electric = false) {
    const G = `url(#g${p})`;
    return _scene(p, `
      <rect x="176" y="26" width="6" height="106" rx="2" fill="${_D}"/>
      <rect x="188" y="26" width="6" height="106" rx="2" fill="${_D}"/>
      <rect x="174" y="48" width="22" height="5" fill="${_D2}"/>
      <rect x="174" y="84" width="22" height="5" fill="${_D2}"/>
      <rect x="194" y="106" width="7" height="30" rx="2" fill="${_D2}"/>
      <path d="M201 136h36a3 3 0 0 1 0 7h-42z" fill="${_D2}"/>
      <rect x="44" y="92" width="22" height="36" rx="7" fill="${G}"/>
      <rect x="60" y="86" width="104" height="42" rx="10" fill="${G}"/>
      <rect x="138" y="94" width="20" height="26" rx="4" fill="#00000022"/>
      ${electric
        ? `<rect x="60" y="112" width="104" height="7" fill="#00000022"/><circle cx="57" cy="102" r="5" fill="${_D2}"/>`
        : `<rect x="52" y="54" width="6" height="36" rx="2" fill="${_D2}"/>`}
      <rect x="80" y="36" width="6" height="54" fill="${_D}"/>
      <rect x="128" y="36" width="6" height="54" fill="${_D}"/>
      <rect x="74" y="30" width="66" height="8" rx="4" fill="${_D}"/>
      <rect x="90" y="44" width="34" height="26" rx="3" fill="${_GL}" opacity=".5"/>
      <rect x="94" y="68" width="24" height="12" rx="4" fill="${_D2}"/>
      ${_wheel(146, 130, 18)}${_wheel(76, 132, 14)}`);
  },
  forkliftE(p) { return ART.forklift(p, true); },

  telehandler(p) {
    const G = `url(#g${p})`;
    return _scene(p, `
      <path d="M46 100 196 38l14 11L64 114z" fill="${G}" stroke="${_D}" stroke-width="2"/>
      <rect x="202" y="44" width="8" height="24" rx="2" fill="${_D2}"/>
      <path d="M208 64h30a3 3 0 0 1 0 7h-36z" fill="${_D2}"/>
      <rect x="36" y="94" width="116" height="36" rx="9" fill="${G}"/>
      <rect x="52" y="60" width="38" height="36" rx="5" fill="${_D}"/>
      <rect x="57" y="65" width="28" height="24" rx="2" fill="${_GL}" opacity=".5"/>
      ${_wheel(66, 130, 18)}${_wheel(134, 130, 18)}`);
  },

  palletManual(p) {
    const G = `url(#g${p})`;
    return _scene(p, `
      <path d="M62 102 38 50" stroke="${_D}" stroke-width="6" stroke-linecap="round"/>
      <rect x="24" y="40" width="28" height="9" rx="4.5" fill="${_D}"/>
      <rect x="54" y="98" width="20" height="36" rx="6" fill="${G}"/>
      <rect x="70" y="124" width="114" height="9" rx="3" fill="${G}"/>
      <circle cx="172" cy="139" r="6" fill="${_D}"/><circle cx="172" cy="139" r="2.5" fill="${_HUB}"/>
      ${_wheel(64, 139, 10)}`);
  },

  palletElectric(p) {
    const G = `url(#g${p})`;
    return _scene(p, `
      <path d="M58 90 36 56" stroke="${_D}" stroke-width="6" stroke-linecap="round"/>
      <rect x="22" y="47" width="28" height="9" rx="4.5" fill="${_D}"/>
      <rect x="46" y="88" width="40" height="48" rx="9" fill="${G}"/>
      <circle cx="66" cy="98" r="4.5" fill="${_GL}"/>
      <rect x="86" y="124" width="100" height="9" rx="3" fill="${G}"/>
      <circle cx="174" cy="139" r="6" fill="${_D}"/><circle cx="174" cy="139" r="2.5" fill="${_HUB}"/>
      ${_wheel(66, 140, 9)}`);
  },

  stacker(p) {
    const G = `url(#g${p})`;
    return _scene(p, `
      <rect x="92" y="22" width="6" height="110" rx="2" fill="${_D}"/>
      <rect x="104" y="22" width="6" height="110" rx="2" fill="${_D}"/>
      <rect x="90" y="42" width="22" height="5" fill="${_D2}"/>
      <rect x="102" y="82" width="8" height="22" fill="${_D2}"/>
      <rect x="108" y="92" width="68" height="7" rx="2" fill="${G}"/>
      <rect x="98" y="130" width="84" height="6" rx="3" fill="${_D2}"/>
      <circle cx="174" cy="140" r="6" fill="${_D}"/><circle cx="174" cy="140" r="2.5" fill="${_HUB}"/>
      <rect x="48" y="78" width="44" height="56" rx="8" fill="${G}"/>
      <path d="M54 78 32 46" stroke="${_D}" stroke-width="6" stroke-linecap="round"/>
      <rect x="20" y="37" width="26" height="9" rx="4.5" fill="${_D}"/>
      ${_wheel(70, 140, 9)}`);
  },

  orderPicker(p) {
    const G = `url(#g${p})`;
    return _scene(p, `
      <rect x="142" y="18" width="6" height="100" fill="${_D}"/>
      <rect x="154" y="18" width="6" height="100" fill="${_D}"/>
      <rect x="140" y="36" width="22" height="5" fill="${_D2}"/>
      <path d="M98 64V42h44v22" stroke="${_D2}" stroke-width="4" fill="none"/>
      <rect x="94" y="62" width="52" height="9" rx="2" fill="${G}"/>
      <rect x="92" y="110" width="78" height="28" rx="8" fill="${G}"/>
      <rect x="170" y="120" width="42" height="7" rx="2" fill="${_D2}"/>
      ${_wheel(112, 142, 9)}${_wheel(152, 142, 9)}`);
  },

  scissor(p) {
    const G = `url(#g${p})`;
    return _scene(p, `
      <path d="M62 38V20h116v18" stroke="${_D2}" stroke-width="4" fill="none"/>
      <rect x="56" y="36" width="128" height="10" rx="3" fill="${G}"/>
      <g stroke="${_D}" stroke-width="6" stroke-linecap="round">
        <path d="M64 88 176 48M64 48 176 88M64 128 176 88M64 88 176 128"/>
      </g>
      <rect x="54" y="124" width="132" height="18" rx="6" fill="${G}"/>
      ${_wheel(82, 147, 9)}${_wheel(160, 147, 9)}`);
  },

  boom(p) {
    const G = `url(#g${p})`;
    return _scene(p, `
      <rect x="26" y="116" width="76" height="24" rx="8" fill="${G}"/>
      <rect x="42" y="102" width="28" height="16" rx="4" fill="${_D2}"/>
      <path d="M56 108 116 56" stroke="url(#g${p})" stroke-width="11" stroke-linecap="round"/>
      <path d="M116 56 186 38" stroke="url(#g${p})" stroke-width="11" stroke-linecap="round"/>
      <circle cx="116" cy="56" r="7" fill="${_D}"/>
      <path d="M184 26h36v22h-36z" fill="none" stroke="${_D}" stroke-width="4"/>
      <rect x="182" y="46" width="40" height="6" rx="2" fill="${_D}"/>
      ${_wheel(46, 142, 11)}${_wheel(88, 142, 11)}`);
  },

  shopCrane(p) {
    const G = `url(#g${p})`;
    return _scene(p, `
      <rect x="36" y="138" width="130" height="8" rx="4" fill="${_D2}"/>
      <rect x="56" y="64" width="12" height="78" rx="3" fill="${G}"/>
      <path d="M62 72 176 54" stroke="url(#g${p})" stroke-width="11" stroke-linecap="round"/>
      <path d="M78 118 122 70" stroke="${_D2}" stroke-width="7" stroke-linecap="round"/>
      <path d="M172 58v26" stroke="${_D}" stroke-width="3" stroke-dasharray="4 3"/>
      <path d="M172 86c9 2 9 13 0 14c-5 1-9-3-7-7" fill="none" stroke="${_D}" stroke-width="4"/>
      ${_wheel(52, 148, 7)}${_wheel(152, 148, 7)}`);
  },

  liftTable(p) {
    const G = `url(#g${p})`;
    return _scene(p, `
      <path d="M62 66 44 30" stroke="${_D}" stroke-width="5" stroke-linecap="round"/>
      <rect x="32" y="22" width="24" height="8" rx="4" fill="${_D}"/>
      <rect x="56" y="64" width="128" height="10" rx="3" fill="${G}"/>
      <g stroke="${_D}" stroke-width="6" stroke-linecap="round">
        <path d="M66 118 174 78M66 78 174 118"/>
      </g>
      <rect x="60" y="116" width="120" height="14" rx="6" fill="${G}"/>
      ${_wheel(80, 139, 8)}${_wheel(160, 139, 8)}`);
  },

  gantry(p) {
    const G = `url(#g${p})`;
    return _scene(p, `
      <polygon points="52,46 64,46 46,142 34,142" fill="${_D2}"/>
      <polygon points="176,46 188,46 206,142 194,142" fill="${_D2}"/>
      <rect x="36" y="38" width="168" height="12" rx="4" fill="${G}"/>
      <rect x="108" y="50" width="24" height="10" rx="3" fill="${_D}"/>
      <path d="M120 60v34" stroke="${_D}" stroke-width="3" stroke-dasharray="4 3"/>
      <path d="M120 94c9 2 9 13 0 14c-5 1-9-3-7-7" fill="none" stroke="${_D}" stroke-width="4"/>
      <rect x="24" y="140" width="28" height="6" rx="3" fill="${_D}"/>
      <rect x="188" y="140" width="28" height="6" rx="3" fill="${_D}"/>`);
  },
};

// ---------- Parc levage & manutention — listes officielles (6 matériels) ----------
const EQUIPMENTS = [
  { id: "grue-mobile", name: "Grue mobile", cat: "Grues", price: 220000, sale: 98000000, caution: 2500000, sectors: ["BTP","Levage"], spec: "Grue mobile polyvalente pour levage sur chantier", img: "img/grue-mobile.jpg", art: "shopCrane", stock: 3 },
    { id: "pelle-hydraulique", name: "Pelle hydraulique", cat: "Pelles", price: 180000, sale: 72000000, caution: 1800000, sectors: ["BTP","Terrassement"], spec: "Pelle hydraulique sur chenilles pour excavation", img: "img/telescopique.jpg", art: "boom", stock: 3 },
    { id: "manitou-telescopique", name: "Manitou télescopique", cat: "Manitou", price: 140000, sale: 48000000, caution: 1500000, sectors: ["BTP","Logistique"], spec: "Chariot télescopique Manitou pour manutention et élevage", img: "img/telescopique.jpg", art: "telehandler", stock: 3 },
    { id: "chargeuse", name: "Chargeuse sur pneus", cat: "Chargeuses", price: 160000, sale: 64000000, caution: 1800000, sectors: ["BTP","Terrassement"], spec: "Chargeuse sur pneus pour chargement et déplacement de matériaux", img: "img/chariot-diesel.jpg", art: "telehandler", stock: 3 },
    { id: "tractopelle", name: "Tractopelle", cat: "Tractopelles", price: 150000, sale: 58000000, caution: 1700000, sectors: ["BTP","Travaux"], spec: "Tractopelle polyvalent pour terrassement et rétro", img: "img/telescopique.jpg", art: "boom", stock: 3 },
    { id: "bulldozer", name: "Bulldozer", cat: "Bulldozers", price: 240000, sale: 120000000, caution: 3000000, sectors: ["BTP","Terrassement"], spec: "Bulldozer pour terrassement, nivellement et poussée de matériaux", img: "img/hero.jpg", art: "shopCrane", stock: 3 },
];

const CATEGORIES = ["Tout", ...new Set(EQUIPMENTS.map(e => e.cat))];

const CATEGORIES = ["Tout", ...new Set(EQUIPMENTS.map(e => e.cat))];
const SECTORS = ["BTP", "Industrie", "Logistique"];

// Disponibilité dérivée du nombre en stock (plus de statut manuel)
const stockBucket = n => (n <= 0 ? "epuise" : n <= 3 ? "limite" : "dispo");
const STOCK_BUCKETS = {
  dispo:  { label: "En stock",     cls: "badge-dispo",   color: "var(--ok)" },
  limite: { label: "Stock limité", cls: "badge-limite",  color: "var(--gold-2)" },
  epuise: { label: "Épuisé",       cls: "badge-demande", color: "var(--err)" },
};
// Badge montré au client : le nombre exact, ou « Épuisé »
const stockBadge = n => ({
  cls: STOCK_BUCKETS[stockBucket(n)].cls,
  label: n <= 0 ? "Épuisé" : `${n} en stock`,
});

const DELIVERY_COST = 40000; // FCFA HT — forfait Dakar et environs
const TVA = 0.18;            // TVA Sénégal
const DEPOSIT_RATE = 0.30;   // Acompte à la commande pour un achat (vente)

const money = n => n.toLocaleString("fr-FR") + " FCFA";
// Format compact pour les gros montants (cartes, accroches) : 58 M, 19,5 M, 1,2 M…
const moneyShort = n => {
  if (n >= 1e6) {
    const m = n / 1e6;
    return (Number.isInteger(m) ? m : m.toFixed(1).replace(".", ",")) + " M FCFA";
  }
  return money(n);
};

// ---------- Indicatifs téléphoniques & masques de saisie ----------
// mask : regroupement des chiffres nationaux · len : [min, max] chiffres
const COUNTRIES = [
  { code: "SN", name: "Sénégal",             dial: "+221", mask: [2, 3, 2, 2],    len: [9, 9] },
  { code: "CI", name: "Côte d'Ivoire",       dial: "+225", mask: [2, 2, 2, 2, 2], len: [10, 10] },
  { code: "ML", name: "Mali",                dial: "+223", mask: [2, 2, 2, 2],    len: [8, 8] },
  { code: "GN", name: "Guinée",              dial: "+224", mask: [3, 2, 2, 2],    len: [9, 9] },
  { code: "GM", name: "Gambie",              dial: "+220", mask: [3, 4],          len: [7, 7] },
  { code: "MR", name: "Mauritanie",          dial: "+222", mask: [2, 2, 2, 2],    len: [8, 8] },
  { code: "BF", name: "Burkina Faso",        dial: "+226", mask: [2, 2, 2, 2],    len: [8, 8] },
  { code: "BJ", name: "Bénin",               dial: "+229", mask: [2, 2, 2, 2],    len: [8, 10] },
  { code: "TG", name: "Togo",                dial: "+228", mask: [2, 2, 2, 2],    len: [8, 8] },
  { code: "NE", name: "Niger",               dial: "+227", mask: [2, 2, 2, 2],    len: [8, 8] },
  { code: "NG", name: "Nigéria",             dial: "+234", mask: [3, 3, 4],       len: [10, 10] },
  { code: "GH", name: "Ghana",               dial: "+233", mask: [2, 3, 4],       len: [9, 9] },
  { code: "CM", name: "Cameroun",            dial: "+237", mask: [1, 2, 2, 2, 2], len: [9, 9] },
  { code: "MA", name: "Maroc",               dial: "+212", mask: [1, 2, 2, 2, 2], len: [9, 9] },
  { code: "FR", name: "France",              dial: "+33",  mask: [1, 2, 2, 2, 2], len: [9, 9] },
  { code: "BE", name: "Belgique",            dial: "+32",  mask: [3, 2, 2, 2],    len: [8, 9] },
  { code: "GB", name: "Royaume-Uni",         dial: "+44",  mask: [4, 3, 3],       len: [10, 10] },
  { code: "US", name: "États-Unis / Canada", dial: "+1",   mask: [3, 3, 4],       len: [10, 10] },
];

// ---------- Villes desservies (livraison région de Dakar) ----------
const CITIES = [
  "Dakar", "Pikine", "Guédiawaye", "Rufisque", "Keur Massar",
  "Bargny", "Diamniadio", "Sébikotane", "Sangalkam", "Yène", "Thiès",
];

// ---------- Domaines e-mail courants (suggestion anti-faute) ----------
const EMAIL_DOMAINS = [
  "gmail.com", "yahoo.fr", "yahoo.com", "hotmail.com", "hotmail.fr",
  "outlook.com", "outlook.fr", "orange.sn", "icloud.com", "live.fr",
];

// Si une photo manque, on retombe sur l'illustration dessinée
window.__artFallback = (img, art, p) => { img.parentElement.innerHTML = ART[art](p); };
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
