/* ==========================================================
   NDIOBEEN GUI LOGISTIQUE — logique des pages
   Filtres premium · combobox · validation temps réel ·
   téléphone international · envoi d'e-mails via l'API
   ========================================================== */

document.addEventListener("DOMContentLoaded", async () => {

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const WHATSAPP_NUMBER = "221782953780";

  function whatsappUrl({
    equipment,
    image,
    requestType = "Information",
    name,
    phone,
    email,
    company,
    comment,
    qty,
    start,
    end,
    delivery,
  } = {}) {
    const lines = [
      "Bonjour,",
      "",
      `Type de demande : ${requestType}`,
    ];
    if (equipment) lines.push(`Matériel : ${equipment}`);
    if (image) {
      const url = image.startsWith("http") ? image : `${location.origin}/${image.replace(/^\/+/, "")}`;
      lines.push(`Photo du matériel : ${url}`);
    }
    if (qty) lines.push(`Quantité souhaitée : ${qty}`);
    if (start || end) lines.push(`Période souhaitée : ${start || "à préciser"} au ${end || "à préciser"}`);
    if (delivery) lines.push(`Mise à disposition : ${delivery}`);
    lines.push("");
    if (name) lines.push(`Nom : ${name}`);
    if (company) lines.push(`Entreprise : ${company}`);
    if (phone) lines.push(`Téléphone : ${phone}`);
    if (email) lines.push(`E-mail : ${email}`);
    if (comment) lines.push("", "Commentaire :", comment);
    lines.push("", "Merci de me recontacter afin que nous puissions échanger sur cette demande.");
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
  }

  function openWhatsApp(url) {
    const win = window.open(url, "_blank", "noopener");
    if (!win) location.href = url;
  }

  /* ════════════════ Stock en direct (serveur) ════════════════ */
  // Le serveur est la source de vérité ; sans serveur (file://) on garde le stock du catalogue.
  let liveStock = null;
  async function loadStock() {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 3000);
      const res = await fetch("/api/stock", { signal: ctrl.signal });
      clearTimeout(timer);
      if (res.ok) liveStock = await res.json();
    } catch (_) { /* pas de serveur : stock statique du catalogue */ }
  }
  const stockOf = e => (liveStock && typeof liveStock[e.id] === "number") ? liveStock[e.id] : e.stock;
  await loadStock();

  /* ════════════════ Composants génériques ════════════════ */

  const CHEVRON = `<svg class="sb-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;
  const CHECK = `<svg class="so-check" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>`;

  /** Select personnalisé accessible (bouton + listbox). */
  function makeSelect(host, { options, value, onChange, label }) {
    let open = false, active = -1;
    host.classList.add("select");
    host.innerHTML = `
      <button type="button" class="select-btn" aria-haspopup="listbox" aria-expanded="false"
              ${label ? `aria-label="${label}"` : ""}><span class="sb-label"></span>${CHEVRON}</button>
      <div class="select-menu" role="listbox" tabindex="-1"></div>`;
    const btn = host.querySelector(".select-btn");
    const lbl = host.querySelector(".sb-label");
    const menu = host.querySelector(".select-menu");

    function renderMenu() {
      menu.innerHTML = options.map((o, i) => `
        <button type="button" class="select-opt" role="option" data-i="${i}"
                aria-selected="${o.value === value}">
          ${CHECK}<span>${o.label}</span>${o.sub ? `<span class="so-sub">${o.sub}</span>` : ""}
        </button>`).join("");
    }
    function setValue(v, fire = true) {
      value = v;
      const o = options.find(x => x.value === v);
      lbl.textContent = o ? (o.short ?? o.label) : "";
      renderMenu();
      if (fire && onChange) onChange(v);
    }
    function setOpen(o) {
      open = o;
      host.classList.toggle("open", o);
      btn.setAttribute("aria-expanded", o);
      if (o) { active = options.findIndex(x => x.value === value); highlight(); }
    }
    function highlight() {
      menu.querySelectorAll(".select-opt").forEach((el, i) => el.classList.toggle("active", i === active));
      const el = menu.querySelector(".select-opt.active");
      if (el) el.scrollIntoView({ block: "nearest" });
    }
    btn.addEventListener("click", () => setOpen(!open));
    btn.addEventListener("keydown", e => {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key) && !open) { e.preventDefault(); setOpen(true); }
    });
    menu.addEventListener("click", e => {
      const opt = e.target.closest(".select-opt");
      if (opt) { setValue(options[+opt.dataset.i].value); setOpen(false); btn.focus(); }
    });
    host.addEventListener("keydown", e => {
      if (!open) return;
      if (e.key === "Escape") { setOpen(false); btn.focus(); }
      else if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active + 1, options.length - 1); highlight(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); highlight(); }
      else if (e.key === "Enter") { e.preventDefault(); if (active >= 0) { setValue(options[active].value); setOpen(false); btn.focus(); } }
    });
    document.addEventListener("click", e => { if (!host.contains(e.target)) setOpen(false); });
    setValue(value, false);
    return { get value() { return value; }, set: v => setValue(v, false) };
  }

  /** Validation en temps réel : douce avant le 1er blur, immédiate ensuite. */
  function liveValidate(input, validate) {
    const field = input.closest(".field");
    let touched = false;
    const run = () => {
      const msg = validate(input.value);
      const empty = !input.value.trim();
      field.classList.toggle("has-error", touched && !!msg);
      field.classList.toggle("has-ok", !msg && !empty);
      input.setAttribute("aria-invalid", touched && !!msg ? "true" : "false");
      const err = field.querySelector(".error");
      if (err && typeof msg === "string" && msg) err.textContent = msg;
      return !msg;
    };
    input.addEventListener("blur", () => { touched = true; run(); });
    input.addEventListener("input", () => { if (touched) run(); else field.classList.toggle("has-ok", !validate(input.value) && !!input.value.trim()); });
    return { check: () => { touched = true; return run(); } };
  }

  function addOkIcon(input) {
    if (input.closest(".input-wrap")) return;
    const wrap = document.createElement("div");
    wrap.className = "input-wrap";
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    wrap.insertAdjacentHTML("beforeend", `
      <span class="f-ico" aria-hidden="true"><svg viewBox="0 0 24 24"><path class="ico-ok" d="m5 13 4 4 10-11"/></svg></span>`);
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /** Suggestion de domaine en cas de faute de frappe (gmial.com → gmail.com). */
  function emailSuggestion(value) {
    const at = value.lastIndexOf("@");
    if (at < 1) return null;
    const domain = value.slice(at + 1).toLowerCase();
    if (!domain || EMAIL_DOMAINS.includes(domain)) return null;
    const dist = (a, b) => {
      if (Math.abs(a.length - b.length) > 2) return 9;
      const m = [...Array(a.length + 1)].map((_, i) => [i, ...Array(b.length).fill(0)]);
      for (let j = 0; j <= b.length; j++) m[0][j] = j;
      for (let i = 1; i <= a.length; i++)
        for (let j = 1; j <= b.length; j++)
          m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      return m[a.length][b.length];
    };
    const best = EMAIL_DOMAINS.map(d => [d, dist(domain, d)]).sort((x, y) => x[1] - y[1])[0];
    return best && best[1] > 0 && best[1] <= 2 ? value.slice(0, at + 1) + best[0] : null;
  }

  /** Champ téléphone international : indicatif + masque par pays. */
  function makePhoneField(dialHost, input, defaultCode = "SN") {
    let country = COUNTRIES.find(c => c.code === defaultCode);
    const sel = makeSelect(dialHost, {
      label: "Indicatif téléphonique",
      options: COUNTRIES.map(c => ({ value: c.code, label: `${c.name}`, sub: c.dial, short: c.dial })),
      value: defaultCode,
      onChange: code => {
        country = COUNTRIES.find(c => c.code === code);
        input.placeholder = mask("7".repeat(Math.min(country.len[0], 10)));
        format();
        input.focus();
      },
    });
    const digits = () => input.value.replace(/\D/g, "").slice(0, country.len[1]);
    const mask = d => {
      let out = [], i = 0;
      for (const g of country.mask) { if (i >= d.length) break; out.push(d.slice(i, i + g)); i += g; }
      if (i < d.length) out.push(d.slice(i));
      return out.join(" ");
    };
    const format = () => { input.value = mask(digits()); };
    input.addEventListener("input", format);
    input.placeholder = country.code === "SN" ? "77 123 45 67" : mask("7".repeat(country.len[0]));
    return {
      isValid() { const n = digits().length; return n >= country.len[0] && n <= country.len[1]; },
      e164() { return `${country.dial} ${mask(digits())}`; },
      lenHint() { return country.len[0] === country.len[1] ? `${country.len[0]} chiffres` : `${country.len[0]} à ${country.len[1]} chiffres`; },
    };
  }

  function setLoading(btn, on) {
    btn.classList.toggle("is-loading", on);
    btn.disabled = on;
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = "Envoi en cours… "; }
    else if (btn.dataset.label) { btn.textContent = btn.dataset.label; }
  }

  /* ════════════════ Slider du hero (accueil) ════════════════ */
  const slider = $("#heroSlider");
  if (slider) {
    const picks = ["grue-mobile", "pelle-hydraulique", "manitou-telescopique"]
      .map(id => EQUIPMENTS.find(e => e.id === id));
    slider.innerHTML = `
      ${picks.map((e, i) => `
        <div class="slide${i === 0 ? " is-active" : ""}">
          <div class="slide-photo">${e.img
            ? `<img src="${e.img}" alt="${e.name}"${i ? ' loading="lazy"' : ""} onerror="__artFallback(this,'${e.art}','${e.id}-slfb')">`
            : ART[e.art](e.id + "-sl")}</div>
          <div class="slide-cap">
            <div><strong>${e.name}</strong><span>${e.spec}</span></div>
            <a class="btn btn-line" href="reservation.html?machine=${e.id}">Demander des infos</a>
          </div>
        </div>`).join("")}
      <div class="slider-nav">
        <button class="sl-arrow" data-dir="-1" aria-label="Machine précédente"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
        <div class="sl-dots" role="tablist">
          ${picks.map((e, i) => `<button class="sl-dot${i === 0 ? " is-active" : ""}" data-i="${i}" aria-label="Voir ${e.name}"></button>`).join("")}
        </div>
        <button class="sl-arrow" data-dir="1" aria-label="Machine suivante"><svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg></button>
      </div>`;

    let idx = 0, timer = null;
    const slides = [...slider.querySelectorAll(".slide")];
    const dots = [...slider.querySelectorAll(".sl-dot")];
    const show = n => {
      idx = (n + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle("is-active", i === idx));
      dots.forEach((d, i) => d.classList.toggle("is-active", i === idx));
    };
    const auto = () => { if (!reduceMotion) timer = setInterval(() => show(idx + 1), 5500); };
    const stop = () => clearInterval(timer);
    slider.querySelectorAll(".sl-arrow").forEach(b =>
      b.addEventListener("click", () => { stop(); show(idx + +b.dataset.dir); auto(); }));
    dots.forEach(d => d.addEventListener("click", () => { stop(); show(+d.dataset.i); auto(); }));
    slider.addEventListener("mouseenter", stop);
    slider.addEventListener("mouseleave", () => { stop(); auto(); });
    auto();
  }

  /* ════════════════ Cartes machines ════════════════ */
  function cardHTML(e, i = 0, mode = "location") {
    const sale = mode === "vente";
    const intent = sale ? "Achat sur demande" : "Location sur demande";
    const cta = sale ? "Demander un devis" : "Demander une location";
    const aria = sale
      ? `Demander des informations d'achat pour ${e.name}`
      : `Demander des informations de location pour ${e.name}`;
    return `
    <article class="card" data-reserve="${e.id}" data-mode="${mode}" tabindex="0" role="button" style="--i:${i}"
             aria-label="${aria}">
      <div class="card-photo">${e.img
        ? `<img src="${e.img}" alt="${e.name}" loading="lazy" onerror="__artFallback(this,'${e.art}','${e.id}-fb')">`
        : ART[e.art](e.id)}</div>
      <div class="card-top">
        <span class="card-cat">${e.cat}</span>
      </div>
      <h3 class="card-title">${e.name}</h3>
      <p class="card-spec">${e.spec}</p>
      <div class="card-foot">
        <div class="request-wrap">
          <span class="request-kicker">${intent}</span>
          <span class="request-copy">Un conseiller confirme les conditions sur WhatsApp.</span>
        </div>
        <button class="btn btn-gold card-cta" type="button" aria-label="${cta}">${cta}</button>
      </div>
    </article>`;
  }
  function bindCards(root) {
    const go = card => location.href = "reservation.html?machine=" + card.dataset.reserve +
      (card.dataset.mode === "vente" ? "&mode=vente" : "");
    root.addEventListener("click", ev => {
      const card = ev.target.closest("[data-reserve]");
      if (card) go(card);
    });
    root.addEventListener("keydown", ev => {
      const card = ev.target.closest("[data-reserve]");
      if (card && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); go(card); }
    });
  }

  const featured = $("#featuredGrid");
  if (featured) {
    featured.innerHTML = ["grue-mobile", "manitou-telescopique", "chargeuse"]
      .map((id, i) => cardHTML(EQUIPMENTS.find(e => e.id === id), i)).join("");
    bindCards(featured);
  }

  /* ════════════════ Catalogue : filtres premium + bascule location/vente ════════════════ */
  const grid = $("#catalogGrid");
  if (grid) {
    const state = { mode: "location", cats: new Set(), sectors: new Set(), q: "", sort: "featured" };

    // — Recherche instantanée
    const searchInput = $("#searchInput");
    const searchClear = $("#searchClear");
    let debounce;
    searchInput.addEventListener("input", () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => { state.q = searchInput.value.trim().toLowerCase(); render(); }, 120);
      searchClear.hidden = !searchInput.value;
    });
    searchClear.addEventListener("click", () => {
      searchInput.value = ""; state.q = ""; searchClear.hidden = true; render(); searchInput.focus();
    });

    // — Bascule Location / Vente
    const modeSwitch = $("#modeSwitch");
    const modeCaption = $("#modeCaption");

    // — Puces catégories (multi-sélection)
    const catBox = $("#catChips");
    CATEGORIES.slice(1).forEach(cat => {
      const n = EQUIPMENTS.filter(e => e.cat === cat).length;
      catBox.insertAdjacentHTML("beforeend", `
        <button type="button" class="chip" data-cat="${cat}" aria-pressed="false">
          <span class="chip-check"><svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg></span>
          ${cat}<span class="chip-count">${n}</span>
        </button>`);
    });
    catBox.addEventListener("click", e => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      const cat = chip.dataset.cat;
      state.cats.has(cat) ? state.cats.delete(cat) : state.cats.add(cat);
      chip.setAttribute("aria-pressed", state.cats.has(cat));
      render();
    });

    // — Puces secteurs (multi-sélection)
    const sectorBox = $("#sectorChips");
    if (sectorBox) {
      SECTORS.forEach(s => {
        const n = EQUIPMENTS.filter(e => e.sectors.includes(s)).length;
        sectorBox.insertAdjacentHTML("beforeend", `
          <button type="button" class="chip" data-sector="${s}" aria-pressed="false">
            <span class="chip-check"><svg viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg></span>
            ${s}<span class="chip-count">${n}</span>
          </button>`);
      });
      sectorBox.addEventListener("click", e => {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        const s = chip.dataset.sector;
        state.sectors.has(s) ? state.sectors.delete(s) : state.sectors.add(s);
        chip.setAttribute("aria-pressed", state.sectors.has(s));
        render();
      });
    }

    // Disponibilité: badges removed (no admin page to manage stock) — UI does not show availability filters.

    function setMode(m, doRender = true) {
      state.mode = m === "vente" ? "vente" : "location";
      if (modeSwitch) modeSwitch.querySelectorAll(".mode-opt").forEach(b => {
        const on = b.dataset.mode === state.mode;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on);
      });
      if (modeCaption) modeCaption.textContent = state.mode === "vente"
        ? "Selectionnez un materiel pour lancer une demande d'achat sur WhatsApp."
        : "Selectionnez un materiel pour lancer une demande de location sur WhatsApp.";
      if (doRender) render();
    }
    if (modeSwitch) modeSwitch.addEventListener("click", e => {
      const b = e.target.closest(".mode-opt");
      if (b) setMode(b.dataset.mode);
    });

    // — Tri
    const sortSel = makeSelect($("#sortSelect"), {
      label: "Trier le catalogue",
      value: "featured",
      options: [
        { value: "featured",   label: "Sélection maison" },
        { value: "name",       label: "Nom A → Z" },
        { value: "cat",        label: "Catégorie" },
      ],
      onChange: v => { state.sort = v; render(); },
    });

    // — Réinitialisation
    const resetBtn = $("#resetFilters");
    resetBtn.addEventListener("click", () => {
      state.cats.clear(); state.sectors.clear(); state.q = "";
      state.sort = "featured";
      searchInput.value = ""; searchClear.hidden = true;
      sortSel.set("featured");
      $$(".chip[aria-pressed]").forEach(c => c.setAttribute("aria-pressed", "false"));
      render();
    });

    function isFiltered() {
      return state.cats.size || state.sectors.size || state.q || state.sort !== "featured";
    }

    function render() {
      let list = EQUIPMENTS.filter(e =>
        (!state.cats.size || state.cats.has(e.cat)) &&
        (!state.sectors.size || e.sectors.some(s => state.sectors.has(s))) &&
        (!state.q || (e.name + " " + e.spec + " " + e.cat + " " + e.sectors.join(" ")).toLowerCase().includes(state.q))
      );
      if (state.sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name, "fr"));
      if (state.sort === "cat") list = [...list].sort((a, b) => a.cat.localeCompare(b.cat, "fr") || a.name.localeCompare(b.name, "fr"));

      grid.innerHTML = list.map((e, i) => cardHTML(e, Math.min(i, 8), state.mode)).join("");
      $("#catalogEmpty").hidden = list.length > 0;
      $("#resultsNote").innerHTML = `<b>${list.length}</b> machine${list.length > 1 ? "s" : ""} ${isFiltered() ? "correspondante" + (list.length > 1 ? "s" : "") : "au parc"}`;
      resetBtn.hidden = !isFiltered();
    }

    // — Pré-sélections depuis l'URL : ?secteur=… & ?mode=vente
    const params = new URLSearchParams(location.search);
    const preSector = params.get("secteur");
    if (preSector && sectorBox) {
      const match = SECTORS.find(s => s.toLowerCase() === preSector.toLowerCase());
      if (match) {
        state.sectors.add(match);
        const chip = sectorBox.querySelector(`[data-sector="${match}"]`);
        if (chip) chip.setAttribute("aria-pressed", "true");
      }
    }
    setMode(params.get("mode") === "vente" ? "vente" : "location", false);
    render();
    bindCards(grid);
  }

  /* ════════════════ FAQ ════════════════ */
  $$(".faq-item").forEach(item => {
    const q = item.querySelector(".faq-q");
    q.addEventListener("click", () => {
      const open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", open);
    });
  });

  /* ════════════════ Assistant de réservation ════════════════ */
  const wizard = $("#wizard");
  if (wizard) initWizard();

  function initWizard() {
    const wEquip = $("#wEquip"); // input hidden : id machine
    const wQty = $("#wQty");
    const wStart = $("#wStart");
    const wEnd = $("#wEnd");

    /* — Mode location ↔ vente (demande d'achat) — */
    let wMode = new URLSearchParams(location.search).get("mode") === "vente" ? "vente" : "location";
    const wModeSwitch = $("#wModeSwitch");
    const datesRow = $("#datesRow");
    const step2Form = $('form[data-panel="2"]');
    const step2Title = step2Form ? step2Form.querySelector("h3") : null;
    const step2Label = $('.step[data-step="2"] span');
    const cglText = $("#cglText");
    const confirmBtn = $("#wConfirmBtn");
    const successOverline = $("#successOverline");

    function setWizardMode(m) {
      wMode = m === "vente" ? "vente" : "location";
      const sale = wMode === "vente";
      if (wModeSwitch) wModeSwitch.querySelectorAll(".mode-opt").forEach(b => {
        const on = b.dataset.mode === wMode;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", on);
      });
      if (datesRow) datesRow.hidden = sale;
      wStart.required = wEnd.required = !sale;
      if (step2Title) step2Title.textContent = sale ? "Livraison & mise en service" : "Dates & mise à disposition";
      if (step2Label) step2Label.textContent = sale ? "Livraison" : "Dates";
      if (cglText) cglText.textContent = sale
        ? "J'accepte d'etre contacte sur WhatsApp pour finaliser ma demande d'achat."
        : "J'accepte d'etre contacte sur WhatsApp pour finaliser ma demande de location.";
      if (confirmBtn) confirmBtn.textContent = sale ? "Contacter sur WhatsApp" : "Contacter sur WhatsApp";
      onEquipChange();
      updateQuote();
    }
    if (wModeSwitch) wModeSwitch.addEventListener("click", e => {
      const b = e.target.closest(".mode-opt");
      if (b) setWizardMode(b.dataset.mode);
    });

    /* — Combobox machine avec recherche instantanée — */
    const combo = $("#equipCombo");
    const cbInput = $("#wEquipInput");
    const cbMenu = $("#equipList");
    let cbActive = -1, cbItems = [];

    function cbRender(q = "") {
      cbItems = EQUIPMENTS.filter(e =>
        !q || (e.name + " " + e.cat + " " + e.spec).toLowerCase().includes(q.toLowerCase()));
      cbMenu.innerHTML = cbItems.length ? cbItems.map((e, i) => `
        <button type="button" class="select-opt cb-opt" role="option" data-id="${e.id}" data-i="${i}"
                aria-selected="${e.id === wEquip.value}">
          ${e.img ? `<img src="${e.img}" alt="" loading="lazy">` : `<span class="cb-art">${ART[e.art](e.id + "-cb")}</span>`}
          <span><span class="cb-name">${e.name}</span><span class="cb-cat">${e.cat}</span></span>
          <span class="cb-action">${wMode === "vente" ? "Achat" : "Location"}</span>
        </button>`).join("")
        : `<p class="cb-empty">Aucune machine ne correspond.</p>`;
      cbActive = -1;
    }
    function cbOpen(o) {
      combo.classList.toggle("open", o);
      cbInput.setAttribute("aria-expanded", o);
      cbMenu.hidden = false; // visibilité gérée par .open (animation)
      if (o) cbRender(cbInput.value === selectedName() ? "" : cbInput.value);
    }
    const selectedName = () => EQUIPMENTS.find(e => e.id === wEquip.value)?.name || "";
    function cbSelect(id) {
      wEquip.value = id;
      cbInput.value = selectedName();
      cbOpen(false);
      onEquipChange();
    }
    cbInput.addEventListener("focus", () => { cbOpen(true); cbInput.select(); });
    cbInput.addEventListener("input", () => { cbOpen(true); cbRender(cbInput.value); });
    cbInput.addEventListener("keydown", e => {
      if (e.key === "Escape") { cbOpen(false); }
      else if (e.key === "ArrowDown") { e.preventDefault(); if (!combo.classList.contains("open")) cbOpen(true); cbActive = Math.min(cbActive + 1, cbItems.length - 1); cbHighlight(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); cbActive = Math.max(cbActive - 1, 0); cbHighlight(); }
      else if (e.key === "Enter") { e.preventDefault(); if (cbActive >= 0) cbSelect(cbItems[cbActive].id); }
    });
    function cbHighlight() {
      cbMenu.querySelectorAll(".cb-opt").forEach((el, i) => el.classList.toggle("active", i === cbActive));
      const el = cbMenu.querySelector(".cb-opt.active");
      if (el) el.scrollIntoView({ block: "nearest" });
    }
    cbMenu.addEventListener("click", e => {
      const opt = e.target.closest(".cb-opt");
      if (opt) cbSelect(opt.dataset.id);
    });
    document.addEventListener("click", e => { if (!combo.contains(e.target)) cbOpen(false); });
    cbInput.addEventListener("blur", () => { setTimeout(() => { if (!combo.contains(document.activeElement)) { cbInput.value = selectedName(); } }, 150); });

    /* — Stepper quantité (plafonné au stock disponible) — */
    const qtyMax = () => { const e = getEquip(); const s = e ? stockOf(e) : 10; return s > 0 ? Math.min(10, s) : 1; };
    $$(".stepper button").forEach(b => b.addEventListener("click", () => {
      wQty.value = Math.min(qtyMax(), Math.max(1, (+wQty.value || 1) + (+b.dataset.step)));
      wQty.dispatchEvent(new Event("change"));
    }));
    wQty.addEventListener("change", () => {
      const max = qtyMax();
      wQty.value = Math.min(max, Math.max(1, Math.trunc(+wQty.value) || 1));
      $$(".stepper button").forEach(b =>
        b.disabled = (+b.dataset.step === -1 && +wQty.value <= 1) || (+b.dataset.step === 1 && +wQty.value >= max));
      updateQuote();
    });
    wQty.dispatchEvent(new Event("change"));

    /* — Dates — */
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const inOneYear = new Date(Date.now() + 366 * 86400000).toISOString().slice(0, 10);
    wStart.min = tomorrow; wStart.max = inOneYear;
    wEnd.min = tomorrow; wEnd.max = inOneYear;

    let currentStep = 1;
    let isSubmittingBooking = false;

    function goToStep(n) {
      currentStep = n;
      $$(".panel").forEach(p => p.classList.toggle("is-active", +p.dataset.panel === n));
      $$(".step").forEach(s => {
        const sn = +s.dataset.step;
        s.classList.toggle("is-active", sn === n);
        s.classList.toggle("is-done", sn < n || n === 5);
      });
      if (n === 2) updateQuote();
      if (n === 4) renderRecap();
    }

    $$("[data-prev]").forEach(b => b.addEventListener("click", () => goToStep(currentStep - 1)));

    function setError(id, on) {
      const field = document.getElementById(id)?.closest(".field");
      if (field) { field.classList.toggle("has-error", on); if (on) field.classList.remove("has-ok"); }
      const msg = document.querySelector(`[data-error="${id}"]`);
      if (msg && !field) msg.classList.toggle("is-visible", on);
    }

    const getEquip = () => EQUIPMENTS.find(e => e.id === wEquip.value);

    function getDays() {
      const a = new Date(wStart.value), b = new Date(wEnd.value);
      if (isNaN(a) || isNaN(b)) return 0;
      return Math.round((b - a) / 86400000) + 1; // jours calendaires inclus
    }

    function getQuote() {
      const e = getEquip();
      const qty = Math.max(1, +wQty.value || 1);
      if (!e) return null;
      if (wMode === "vente") return { mode: "vente", e, qty };

      const days = getDays();
      if (days < 1) return null;
      return { mode: "location", e, qty, days };
    }

    function updateQuote() {
      const q = getQuote();
      const box = $("#quoteBox");
      const note = $("#durationNote");
      if (note) {
        if (wMode === "vente") { note.hidden = true; }
        else {
          const d = getDays();
          note.hidden = d < 1;
          if (d >= 1) note.textContent = `${d} jour${d > 1 ? "s" : ""} selectionne${d > 1 ? "s" : ""}`;
        }
      }
      if (!q) { box.hidden = true; return; }
      box.hidden = false;
      const delivery = document.querySelector("[name=wDelivery]:checked").value === "livraison"
        ? "Livraison souhaitee"
        : "Retrait en agence";
      box.innerHTML = `
        <div class="quote-request">
          <span>${q.mode === "vente" ? "Demande d'achat" : "Demande de location"}</span>
          <strong>${q.e.name} x ${q.qty}</strong>
          <p>${q.mode === "vente"
            ? "Un conseiller reprend votre besoin sur WhatsApp pour confirmer la disponibilite, les options et les conditions."
            : `Periode : ${q.days} jour${q.days > 1 ? "s" : ""}. ${delivery}. Un conseiller finalise les conditions sur WhatsApp.`}</p>
        </div>`;
    }

    ["change", "input"].forEach(evt => {
      wStart.addEventListener(evt, () => { wEnd.min = wStart.value || tomorrow; updateQuote(); });
      wEnd.addEventListener(evt, updateQuote);
    });
    $$("[name=wDelivery]").forEach(r => r.addEventListener("change", updateQuote));

    function onEquipChange() {
      const e = getEquip();
      const box = $("#equipPreview");
      if (!e) { box.hidden = true; return; }
      box.hidden = false;
      box.innerHTML = `
        <div class="p-art">${e.img
          ? `<img src="${e.img}" alt="${e.name}" loading="lazy" onerror="__artFallback(this,'shopCrane','${e.id}-pvfb')">`
          : ART[e.art](e.id + "-pv")}</div>
        <div><div class="p-name">${e.name}</div>        <div class="p-spec">${e.spec}</div></div>
        <div class="p-action">${wMode === "vente" ? "Achat" : "Location"} sur WhatsApp</div>`;
      setError("wEquip", false);
      wQty.dispatchEvent(new Event("change")); // recadre la quantité selon le stock
      updateQuote();
    }

    $$("[name=wDelivery]").forEach(r => r.addEventListener("change", () => {
      $("#addressField").hidden = !document.querySelector("[name=wDelivery][value=livraison]").checked;
    }));

    /* — Champs intelligents (étape 3) — */
    const wName = $("#wName"), wEmail = $("#wEmail"), wPhone = $("#wPhone"), wAddress = $("#wAddress"), wCity = $("#wCity"), wMsg = $("#wMsg");
    [wName, wEmail, wAddress, wCity].forEach(addOkIcon);

    // Datalist villes
    const cityList = $("#cityList");
    if (cityList) cityList.innerHTML = CITIES.map(c => `<option value="${c}">`).join("");

    const phone = makePhoneField($("#wDial"), wPhone, "SN");

    const vName = liveValidate(wName, v => v.trim().length >= 2 ? "" : "Indiquez votre nom complet.");
    const vEmail = liveValidate(wEmail, v => {
      if (!EMAIL_RE.test(v.trim())) return "Adresse e-mail invalide (ex. nom@domaine.sn).";
      return "";
    });
    const vPhone = liveValidate(wPhone, () => phone.isValid() ? "" : `Numéro incomplet — ${phone.lenHint()} attendus.`);
    const vAddress = liveValidate(wAddress, v =>
      !document.querySelector("[name=wDelivery][value=livraison]").checked || v.trim().length >= 5
        ? "" : "Indiquez l'adresse précise du site (rue, zone, repère).");
    const vCity = liveValidate(wCity, v =>
      !document.querySelector("[name=wDelivery][value=livraison]").checked || v.trim().length >= 2
        ? "" : "Indiquez la ville de livraison.");

    // Suggestion de domaine e-mail
    const emailHint = $("#emailHint");
    wEmail.addEventListener("blur", () => {
      const sug = emailSuggestion(wEmail.value.trim());
      emailHint.hidden = !sug;
      if (sug) emailHint.innerHTML = `Vouliez-vous dire <button type="button">${sug}</button> ?`;
    });
    emailHint.addEventListener("click", e => {
      if (e.target.tagName === "BUTTON") {
        wEmail.value = e.target.textContent;
        emailHint.hidden = true;
        vEmail.check();
      }
    });

    /* — Validation par étape — */
    const validators = {
      1() {
        const e = getEquip();
        const msg = document.querySelector('[data-error="wEquip"]');
        if (!e) { if (msg) msg.textContent = "Sélectionnez une machine dans la liste."; setError("wEquip", true); return false; }
        if (stockOf(e) <= 0) { if (msg) msg.textContent = "Matériel actuellement épuisé — contactez-nous pour les délais."; setError("wEquip", true); return false; }
        setError("wEquip", false);
        return true;
      },
      2() {
        if (wMode === "vente") return true; // pas de dates pour un achat
        const days = getDays();
        const startOk = wStart.value && wStart.value >= tomorrow;
        const endOk = wEnd.value && days >= 1;
        setError("wStart", !startOk);
        setError("wEnd", startOk && !endOk);
        return startOk && endOk;
      },
      3() {
        const checks = [vName.check(), vEmail.check(), vPhone.check(), vAddress.check(), vCity.check()];
        return checks.every(Boolean);
      },
      4() {
        const ok = $("#wCgl").checked;
        document.querySelector('[data-error="wCgl"]').classList.toggle("is-visible", !ok);
        return ok;
      },
    };

    $$("form.panel").forEach(form => {
      form.addEventListener("submit", ev => {
        ev.preventDefault();
        const n = +form.dataset.panel;
        if (!validators[n]()) return;
        if (n < 4) { goToStep(n + 1); return; }
        confirmBooking(form.querySelector("button[type=submit]"));
      });
    });

    function renderRecap() {
      const q = getQuote();
      if (!q) { goToStep(2); return; }
      const delivery = document.querySelector("[name=wDelivery]:checked").value;
      const fmt = d => new Date(d).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
      const client = `${wName.value}${$("#wCompany").value ? " — " + $("#wCompany").value : ""}`;
      const deliveryLabel = delivery === "livraison" ? "Livraison souhaitee" : "Retrait en agence";
      const comment = wMsg?.value.trim();
      if (q.mode === "vente") {
        $("#recapBox").innerHTML = `
          <dl>
            <dt>Matériel</dt><dd>${q.e.name} × ${q.qty}</dd>
            <dt>Demande</dt><dd>Achat du materiel</dd>
            <dt>Mise a dispo</dt><dd>${delivery === "livraison" ? "Livraison : " + wAddress.value + ", " + wCity.value : deliveryLabel}</dd>
            <dt>Client</dt><dd>${client}</dd>
            <dt>Contact</dt><dd>${wEmail.value} · ${phone.e164()}</dd>
            ${comment ? `<dt>Commentaire</dt><dd>${comment}</dd>` : ""}
          </dl>
          <div class="recap-total"><span>Prochaine etape</span><strong>WhatsApp</strong></div>`;
      } else {
        $("#recapBox").innerHTML = `
          <dl>
            <dt>Matériel</dt><dd>${q.e.name} × ${q.qty}</dd>
            <dt>Période</dt><dd>du ${fmt(wStart.value)} au ${fmt(wEnd.value)} (${q.days} j)</dd>
            <dt>Mise à dispo</dt><dd>${delivery === "livraison" ? "Livraison : " + wAddress.value + ", " + wCity.value : deliveryLabel}</dd>
            <dt>Client</dt><dd>${client}</dd>
            <dt>Contact</dt><dd>${wEmail.value} · ${phone.e164()}</dd>
            ${comment ? `<dt>Commentaire</dt><dd>${comment}</dd>` : ""}
          </dl>
          <div class="recap-total"><span>Prochaine etape</span><strong>WhatsApp</strong></div>`;
      }
    }

    async function confirmBooking(btn) {
      if (isSubmittingBooking) return; // prévention double soumission
      const sale = wMode === "vente";
      setLoading(btn, true);
      isSubmittingBooking = true;
      try {
        const q = getQuote();
        if (!q) throw new Error("Complétez les informations de votre demande.");

        // Run step validators to ensure client-side correctness
        if (typeof validators === "object") {
          if (!validators[1]() || !validators[2]() || !validators[3]() || !validators[4]()) {
            throw new Error("Corrigez les erreurs du formulaire avant de poursuivre.");
          }
        }

        const deliveryValue = document.querySelector("[name=wDelivery]:checked").value;
        const delivery = deliveryValue === "livraison"
          ? `Livraison souhaitee${wAddress.value.trim() || wCity.value.trim() ? " : " + [wAddress.value.trim(), wCity.value.trim()].filter(Boolean).join(", ") : ""}`
          : "Retrait en agence";

        // Build WhatsApp URL locally to avoid dependency on server
        const url = whatsappUrl({
          equipment: q.e.name,
          image: q.e.img,
          requestType: sale ? "Achat" : "Location",
          name: wName.value.trim(),
          company: $("#wCompany").value.trim(),
          phone: phone.e164(),
          email: wEmail.value.trim(),
          comment: wMsg?.value.trim(),
          qty: q.qty,
          start: sale ? "" : wStart.value,
          end: sale ? "" : wEnd.value,
          delivery,
        });

        const ref = "WA-" + Date.now().toString(36).toUpperCase();
        try {
          const all = JSON.parse(localStorage.getItem("ndiobeen-bookings") || "[]");
          all.push({ ref, mode: wMode, equip: wEquip.value, createdAt: new Date().toISOString() });
          localStorage.setItem("ndiobeen-bookings", JSON.stringify(all));
        } catch (_) { /* stockage local indisponible : sans incidence */ }

        // Update UI and open WhatsApp immediately
        if (successOverline) successOverline.textContent = sale ? "Demande d'achat prête" : "Demande de location prête";
        $("#successRef").textContent = "Conversation WhatsApp";
        $("#successMsg").textContent = sale
          ? `Merci ${wName.value.trim().split(" ")[0]}. Votre message d'achat est prêt.`
          : `Merci ${wName.value.trim().split(" ")[0]}. Votre message de location est prêt.`;
        const demo = $("#successDemo");
        demo.hidden = false;
        demo.innerHTML = `<a class="btn btn-gold" href="${url}" target="_blank" rel="noopener">Ouvrir WhatsApp</a>`;
        goToStep(5);
        openWhatsApp(url);

        // Fire-and-forget: send booking to server for record without blocking user flow
        try {
          const logPayload = {
            mode: wMode,
            equip: wEquip.value,
            qty: q.qty,
            start: sale ? "" : wStart.value,
            end: sale ? "" : wEnd.value,
            delivery: deliveryValue === "livraison" ? "livraison" : "retrait",
            name: wName.value.trim(),
            company: $("#wCompany").value.trim(),
            email: wEmail.value.trim(),
            phone: phone.e164(),
            address: wAddress.value.trim(),
            city: wCity.value.trim(),
            message: wMsg?.value.trim(),
            ref,
          };
          if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(logPayload)], { type: "application/json" });
            navigator.sendBeacon("/api/bookings", blob);
          } else {
            fetch("/api/bookings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(logPayload), keepalive: true }).catch(() => { });
          }
        } catch (_) { /* ignore logging errors */ }

      } catch (err) {
        toast(err.message || "Erreur lors de la validation.", "err");
      } finally {
        setLoading(btn, false);
        isSubmittingBooking = false;
      }
    }

    $("#newBooking").addEventListener("click", () => {
      $$("form.panel").forEach(f => f.reset());
      wEquip.value = "";
      cbInput.value = "";
      $("#equipPreview").hidden = true;
      $("#quoteBox").hidden = true;
      $("#addressField").hidden = true;
      $$(".field").forEach(f => f.classList.remove("has-ok", "has-error"));
      goToStep(1);
    });

    // Pré-sélection depuis ?machine=…
    const pre = new URLSearchParams(location.search).get("machine");
    if (pre && EQUIPMENTS.some(e => e.id === pre)) cbSelect(pre);
    cbRender();

    // Active le mode (location/vente) selon ?mode= et rafraîchit l'UI
    setWizardMode(wMode);
  }

  /* ════════════════ Formulaire de contact ════════════════ */
  const contactForm = $("#contactForm");
  if (contactForm) {
    let isContactSubmitting = false;
    const cName = $("#cName"), cEmail = $("#cEmail"), cMsg = $("#cMsg"), cPhone = $("#cPhone");
    [cName, cEmail].forEach(addOkIcon);
    const vName = liveValidate(cName, v => v.trim().length >= 2 ? "" : "Indiquez votre nom.");
    const vEmail = liveValidate(cEmail, v => EMAIL_RE.test(v.trim()) ? "" : "Adresse e-mail invalide (ex. nom@domaine.sn).");
    const vMsg = liveValidate(cMsg, v => v.trim().length >= 5 ? "" : "Décrivez votre besoin en quelques mots.");
    const phone = cPhone ? makePhoneField($("#cDial"), cPhone, "SN") : null;

    contactForm.addEventListener("submit", async ev => {
      ev.preventDefault();
      if (isContactSubmitting) return; // prévention double soumission
      if (![vName.check(), vEmail.check(), vMsg.check()].every(Boolean)) return;
      const btn = contactForm.querySelector("button[type=submit]");
      setLoading(btn, true);
      isContactSubmitting = true;
      try {
        // Build WhatsApp URL locally and open it immediately after client validation
        const url = whatsappUrl({
          equipment: "Demande generale",
          requestType: "Information",
          name: cName.value.trim(),
          phone: phone && cPhone.value.trim() ? phone.e164() : "",
          email: cEmail.value.trim(),
          comment: cMsg.value.trim(),
        });

        const ok = $("#contactOk");
        ok.hidden = false;
        ok.innerHTML = `Message prêt — WhatsApp va s'ouvrir avec votre demande : <a class="btn btn-gold" href="${url}" target="_blank" rel="noopener">Ouvrir WhatsApp</a>`;
        // Open WhatsApp immediately — no blocking server call
        openWhatsApp(url);
        contactForm.reset();
        contactForm.querySelectorAll(".field").forEach(f => f.classList.remove("has-ok", "has-error"));
        toast("Votre message WhatsApp est prêt.", "ok");

        // Fire-and-forget: send contact to server for records/notifications
        try {
          const contactPayload = {
            name: cName.value.trim(),
            email: cEmail.value.trim(),
            phone: phone && cPhone.value.trim() ? phone.e164() : "",
            message: cMsg.value.trim(),
          };
          if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(contactPayload)], { type: "application/json" });
            navigator.sendBeacon("/api/contact", blob);
          } else {
            fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(contactPayload), keepalive: true }).catch(() => { });
          }
        } catch (_) { /* ignore background logging errors */ }

      } catch (err) {
        toast(err.message || "Erreur lors de l'envoi", "err");
      } finally {
        setLoading(btn, false);
        isContactSubmitting = false;
      }
    });
  }
});
