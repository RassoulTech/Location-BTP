/* ==========================================================
   Verification de bout en bout du parcours de connexion.

   On ne verifie pas que « ca compile » : on ouvre un vrai
   navigateur, on remplit les vrais formulaires, et on controle
   ce que la base contient apres coup (CDC §63, §64, §101).

   Usage : node scripts/test-auth.mjs [baseUrl]
   ========================================================== */

import { chromium } from "playwright";
import pg from "pg";

const BASE = process.argv[2] ?? "http://localhost:3211";
const DB = process.env.DATABASE_URL ?? "postgresql://postgres@127.0.0.1:5433/btp";

const sql = new pg.Pool({ connectionString: DB });
const q = async (text, params) => (await sql.query(text, params)).rows;

let passed = 0, failed = 0;
const check = (label, ok, detail = "") => {
  if (ok) { passed++; console.log(`  ok   ${label}`); }
  else { failed++; console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`); }
};

const unique = `test.${Date.now()}@exemple.sn`;

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
});

async function section(title) { console.log(`\n${title}`); }

try {
  /* ---------- 1. Le site public n'a pas bouge ---------- */
  await section("Site public");
  {
    const page = await browser.newPage();
    for (const [path, marker] of [
      ["/", "Le levage,"],
      ["/services", "notre matière première"],
      ["/flotte", "choisies une à une"],
      ["/reservation", "un échange direct"],
      ["/contact", "votre projet"],
    ]) {
      const res = await page.goto(BASE + path, { waitUntil: "domcontentloaded" });
      const html = await page.content();
      check(`${path} servie et intacte`, res.status() === 200 && html.includes(marker));
    }
    /* La barre du site est bien construite par ui.js. */
    await page.goto(BASE + "/", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".nav-shell .brand-monogram", { timeout: 10000 });
    check("la barre de navigation se construit", await page.locator(".nav-shell .brand-monogram").count() === 1);
    /* La charte est chargee : on lit une variable de premium.css.
       (Les polices Google ne sont pas joignables depuis ce
       conteneur, on ne teste donc pas la police effective.) */
    check("la charte premium.css est appliquee", await page.evaluate(
      () => getComputedStyle(document.documentElement).getPropertyValue("--gold").trim() === "#ca8a04",
    ));
    await page.close();
  }

  /* ---------- 2. Les espaces prives sont fermes ---------- */
  await section("Protection des espaces prives");
  {
    const page = await browser.newPage();
    await page.goto(BASE + "/espace", { waitUntil: "domcontentloaded" });
    check("/espace renvoie vers la connexion", page.url().includes("/connexion?suite=%2Fespace"));
    await page.goto(BASE + "/admin", { waitUntil: "domcontentloaded" });
    check("/admin renvoie vers la connexion", page.url().includes("/connexion?suite=%2Fadmin"));
    await page.close();
  }

  /* ---------- 3. Inscription ---------- */
  await section("Inscription d'un client");
  {
    const page = await browser.newPage();
    await page.goto(BASE + "/inscription", { waitUntil: "domcontentloaded" });

    /* Validation serveur : un mot de passe trop court doit etre refuse. */
    await page.fill("#firstName", "Awa");
    await page.fill("#lastName", "Diallo");
    await page.fill("#email", unique);
    await page.fill("#phone", "+221 77 123 45 67");
    await page.fill("#password", "court");
    await page.click("button[type=submit]");
    await page.waitForTimeout(1200);
    check("mot de passe trop court refuse cote serveur",
      (await page.locator(".field.has-error").count()) > 0 && page.url().includes("/inscription"));

    /* Inscription valide. */
    await page.fill("#password", "MotDePasseSolide2026");
    await page.click("button[type=submit]");
    await page.waitForURL("**/espace", { timeout: 20000, waitUntil: "domcontentloaded" });
    check("redirection vers l'espace client", page.url().endsWith("/espace"));
    check("le prenom apparait", (await page.locator("h1").innerText()).includes("Awa"));

    const users = await q("SELECT id, email, password_hash FROM users WHERE email = $1", [unique]);
    check("le compte existe en base", users.length === 1);
    check("le mot de passe est hache, pas stocke en clair",
      Boolean(users[0]) && users[0].password_hash.startsWith("scrypt$")
      && !users[0].password_hash.includes("MotDePasseSolide2026"));

    const custs = await q("SELECT reference, email FROM customers WHERE email = $1", [unique]);
    check("la fiche client est creee avec le compte", custs.length === 1,
      custs.length ? "" : "aucune fiche");
    check("elle porte un numero client", Boolean(custs[0]?.reference?.startsWith("CLI-")));

    const roles = await q(
      `SELECT r.slug FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = $1`,
      [users[0]?.id],
    );
    check("le role client est attribue", roles.length === 1 && roles[0].slug === "client");

    const sess = await q("SELECT token_hash FROM sessions WHERE user_id = $1", [users[0]?.id]);
    check("une session est ouverte en base", sess.length === 1);
    check("seul le hachage du jeton est stocke",
      Boolean(sess[0]) && /^[0-9a-f]{64}$/.test(sess[0].token_hash));

    /* ---------- 4. Un client n'entre pas dans l'administration ---------- */
    await section("Cloisonnement des roles");
    await page.goto(BASE + "/admin", { waitUntil: "domcontentloaded" });
    check("un client est refuse sur /admin", page.url().includes("/acces-refuse"));

    /* ---------- 5. Deconnexion ---------- */
    await section("Deconnexion");
    await page.goto(BASE + "/espace", { waitUntil: "domcontentloaded" });
    await page.click("button.nav-logout");
    await page.waitForTimeout(1500);
    const after = await q("SELECT count(*)::int AS n FROM sessions WHERE user_id = $1", [users[0]?.id]);
    check("la session est revoquee en base", after[0].n === 0);
    await page.goto(BASE + "/espace", { waitUntil: "domcontentloaded" });
    check("l'espace est de nouveau ferme", page.url().includes("/connexion"));
    await page.close();
  }

  /* ---------- 6. Connexion du personnel ---------- */
  await section("Connexion du personnel");
  {
    const page = await browser.newPage();
    await page.goto(BASE + "/connexion", { waitUntil: "domcontentloaded" });

    await page.fill("#email", "dionemhd1@gmail.com");
    await page.fill("#password", "MauvaisMotDePasse");
    await page.click("button[type=submit]");
    await page.waitForTimeout(1500);
    const msg = await page.locator(".form-err").innerText().catch(() => "");
    check("mot de passe errone refuse", page.url().includes("/connexion"));
    check("le message ne dit pas si le compte existe",
      msg.includes("Adresse e-mail ou mot de passe incorrect"), msg);

    await page.fill("#password", "BtpDakar2026!");
    await page.click("button[type=submit]");
    await page.waitForURL("**/admin", { timeout: 20000, waitUntil: "domcontentloaded" });
    check("le personnel arrive sur l'administration", page.url().endsWith("/admin"));
    check("les permissions sont chargees",
      (await page.locator(".hero-kpi").innerText()).includes("50"));
    await page.close();
  }

  /* ---------- 7. Une adresse deja prise ---------- */
  await section("Adresse deja utilisee");
  {
    const page = await browser.newPage();
    await page.goto(BASE + "/inscription", { waitUntil: "domcontentloaded" });
    await page.fill("#firstName", "Autre");
    await page.fill("#lastName", "Personne");
    await page.fill("#email", unique);
    await page.fill("#phone", "+221 78 000 00 00");
    await page.fill("#password", "MotDePasseSolide2026");
    await page.click("button[type=submit]");
    await page.waitForTimeout(1500);
    check("un second compte sur la meme adresse est refuse", page.url().includes("/inscription"));
    const n = await q("SELECT count(*)::int AS n FROM users WHERE email = $1", [unique]);
    check("aucun doublon en base", n[0].n === 1);
    await page.close();
  }
} finally {
  await browser.close();
  await sql.end();
}

console.log(`\n${passed} verification(s) passee(s), ${failed} echec(s).`);
process.exit(failed === 0 ? 0 : 1);
