/* ==========================================================
   NDIOBEEN GUI LOGISTIQUE — ossature commune
   bannière promo · navigation · thème dark/light · footer
   ========================================================== */

const PAGES = [
  ["index.html", "Accueil"],
  ["services.html", "Services"],
  ["flotte.html", "La Flotte"],
  ["reservation.html", "Réservation"],
  ["contact.html", "Contact"],
];

const CURRENT_PAGE = (location.pathname.split("/").pop() || "index.html");

/* ---------- Notifications toast ---------- */
window.toast = (msg, type = "info") => {
  let zone = document.querySelector(".toast-zone");
  if (!zone) {
    zone = document.createElement("div");
    zone.className = "toast-zone";
    zone.setAttribute("aria-live", "polite");
    document.body.appendChild(zone);
  }
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.setAttribute("role", "status");
  t.textContent = msg;
  zone.appendChild(t);
  setTimeout(() => { t.classList.add("out"); setTimeout(() => t.remove(), 450); }, 5000);
};

/* ---------- Client API (timeout 20 s, erreurs lisibles) ---------- */
window.api = async (path, body) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20000);
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) {
      throw new Error(data.error || `Erreur serveur (${res.status}).`);
    }
    return data;
  } catch (err) {
    if (err.name === "AbortError") throw new Error("Le serveur ne répond pas. Vérifiez votre connexion et réessayez.");
    if (err instanceof TypeError) throw new Error("Connexion impossible au serveur. Réessayez dans un instant.");
    throw err;
  } finally {
    clearTimeout(timer);
  }
};

document.addEventListener("DOMContentLoaded", () => {

  // ---------- Header ----------
  const header = document.createElement("header");
  header.className = "nav-shell";
  header.id = "navShell";
  header.innerHTML = `
    <a class="brand" href="index.html">
      <span class="brand-monogram">N</span>
      <span class="brand-word">NDIOBEEN <em>GUI LOGISTIQUE</em></span>
    </a>
    <nav class="nav-links" id="navLinks" aria-label="Navigation principale">
      ${PAGES.map(([href, label]) =>
        `<a href="${href}"${href === CURRENT_PAGE ? ' aria-current="page"' : ""}>${label}</a>`).join("")}
    </nav>
    <button class="theme-toggle" id="themeToggle" aria-label="Changer de thème">
      <svg class="icon-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg>
      <svg class="icon-moon" viewBox="0 0 24 24"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z"/></svg>
    </button>
    <a class="nav-cta" href="https://wa.me/221782953780" target="_blank" rel="noopener">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>
+221 78 295 37 80
    </a>
    <button class="nav-burger" id="burger" aria-label="Ouvrir le menu" aria-expanded="false"><span></span><span></span></button>`;
  document.body.insertBefore(header, document.querySelector("main"));

  // ---------- Footer ----------
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-id">
        <p class="footer-brand">NDIOBEEN <em>GUI LOGISTIQUE</em></p>
        <p class="footer-slogan">Leader sénégalais de la location &amp; de la vente de matériel de levage — BTP, industrie et logistique.</p>
      </div>
      <nav aria-label="Navigation pied de page">
        ${PAGES.slice(1).map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}
      </nav>
      <small>© ${new Date().getFullYear()} NDIOBEEN GUI LOGISTIQUE — Dakar, Sénégal. Tous droits réservés.</small>
    </div>`;
  document.body.appendChild(footer);

  // ---------- Thème dark / light ----------
  const toggle = document.getElementById("themeToggle");
  toggle.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("ndiobeen-theme", next);
  });

  // ---------- Navigation : scroll + burger ----------
  const navShell = document.getElementById("navShell");
  addEventListener("scroll", () => {
    navShell.classList.toggle("is-scrolled", scrollY > 30);
  }, { passive: true });

  const burger = document.getElementById("burger");
  const navLinks = document.getElementById("navLinks");
  burger.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", open);
  });

  // ---------- Apparitions au scroll ----------
  const io = new IntersectionObserver(entries => {
    entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));

  // ---------- Compteurs animés ----------
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ioCount = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      ioCount.unobserve(en.target);
      const target = +en.target.dataset.count;
      if (reduceMotion) { en.target.textContent = target; return; }
      const t0 = performance.now();
      const tick = now => {
        const p = Math.min(1, (now - t0) / 1200);
        en.target.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll("[data-count]").forEach(el => ioCount.observe(el));
});
