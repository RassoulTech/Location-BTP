/* Captures d'ecran des parcours, pour relecture. */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3214";
const OUT = process.argv[3] ?? "/mnt/user-data/outputs/captures";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});

/** Les animations d'apparition sont neutralisees pour la capture. */
const REVEAL = `document.querySelectorAll(".reveal").forEach(e => e.classList.add("in"));`;

async function shot(page, name, { full = false } = {}) {
  await page.waitForTimeout(900);
  await page.evaluate(REVEAL);
  await page.waitForTimeout(400);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  console.log("  ", name);
}

const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
const page = await ctx.newPage();

console.log("Captures :");

// Site public, visiteur
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".nav-account", { timeout: 10000 });
await shot(page, "01-accueil-visiteur");

// Connexion / inscription
await page.goto(BASE + "/connexion", { waitUntil: "domcontentloaded" });
await shot(page, "02-connexion");
await page.goto(BASE + "/inscription", { waitUntil: "domcontentloaded" });
await shot(page, "03-inscription");

// Erreur de saisie : les champs sont conserves
await page.fill("#firstName", "Awa");
await page.fill("#lastName", "Diallo");
await page.fill("#email", "awa@exemple");
await page.fill("#phone", "+221 77 123 45 67");
await page.fill("#password", "court");
await page.click("button[type=submit]");
await page.waitForTimeout(1800);
await shot(page, "04-inscription-erreurs-champs-conserves");

// Espace client
const email = `demo.${Date.now()}@exemple.sn`;
await page.fill("#email", email);
await page.fill("#password", "MotDePasseSolide2026");
await page.click("button[type=submit]");
await page.waitForURL("**/espace", { timeout: 20000, waitUntil: "domcontentloaded" });
await shot(page, "05-espace-client");

// La barre du site affiche « Mon espace » une fois connecte
await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(1500);
await shot(page, "06-accueil-connecte");

// Administration
const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const admin = await ctx2.newPage();
await admin.goto(BASE + "/connexion", { waitUntil: "domcontentloaded" });
await admin.fill("#email", "dionemhd1@gmail.com");
await admin.fill("#password", "BtpDakar2026!");
await admin.click("button[type=submit]");
await admin.waitForURL("**/admin", { timeout: 20000, waitUntil: "domcontentloaded" });
await shot(admin, "07-administration");
await admin.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await admin.waitForTimeout(1500);
await shot(admin, "08-accueil-personnel");

// Version telephone
const ctxM = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
const mob = await ctxM.newPage();
await mob.goto(BASE + "/", { waitUntil: "domcontentloaded" });
await mob.waitForSelector(".nav-account", { timeout: 10000 });
await shot(mob, "09-accueil-telephone");
await mob.goto(BASE + "/connexion", { waitUntil: "domcontentloaded" });
await shot(mob, "10-connexion-telephone");

await browser.close();
console.log(`\nEcrans dans ${OUT}`);
