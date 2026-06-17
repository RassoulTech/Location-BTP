/* ==========================================================
   NDIOBEEN GUI LOGISTIQUE — modèles d'e-mails HTML
   Tables + styles inline (compatibilité clients mail),
   responsive ≤ 600 px, identité or champagne / pierre sombre.
   ========================================================== */

const GOLD = "#CA8A04";
const GOLD_LIGHT = "#E7B94C";
const BG = "#0c0a09";
const CARD = "#161312";
const TEXT = "#faf9f7";
const MUTED = "#a8a29e";
const HAIRLINE = "rgba(250,249,247,0.12)";

const esc = s => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

const money = n => Number(n).toLocaleString("fr-FR") + " FCFA";

const fmtDate = iso => new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});

/* ---------- Gabarit commun ---------- */
function layout({ title, preheader, bodyHtml }) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<style>
  @media only screen and (max-width: 620px) {
    .container { width: 100% !important; }
    .px { padding-left: 20px !important; padding-right: 20px !important; }
    .stack { display: block !important; width: 100% !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${BG};">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BG};">
  <tr><td align="center" style="padding:32px 12px;">
    <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;">

      <!-- En-tête -->
      <tr><td align="center" style="padding:0 0 24px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="width:44px;height:44px;border:1px solid ${GOLD};border-radius:50%;text-align:center;vertical-align:middle;
                     font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${GOLD_LIGHT};">T</td>
          <td style="padding-left:12px;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${TEXT};">
            NDIOBEEN <span style="font-style:italic;color:${GOLD_LIGHT};">GUI LOGISTIQUE</span></td>
        </tr></table>
      </td></tr>

      <!-- Filet doré -->
      <tr><td style="height:3px;background:linear-gradient(90deg,${GOLD_LIGHT},${GOLD});border-radius:3px;font-size:0;">&nbsp;</td></tr>

      <!-- Corps -->
      <tr><td class="px" style="background-color:${CARD};border:1px solid ${HAIRLINE};border-top:none;
                                 border-radius:0 0 14px 14px;padding:36px 40px;">
        ${bodyHtml}
      </td></tr>

      <!-- Pied -->
      <tr><td align="center" style="padding:28px 16px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.7;color:${MUTED};">
        NDIOBEEN GUI LOGISTIQUE — Location &amp; vente de matériel de levage<br>
        Zone industrielle SODIDA, Avenue Bourguiba, Dakar, Sénégal<br>
        <a href="https://wa.me/221782953780?text=${encodeURIComponent('Bonjour,\n\nJe souhaite obtenir des informations concernant vos matériels et vos services.\n\nPouvez-vous me renseigner sur les solutions disponibles et m\'orienter selon mon besoin ?\n\nMerci d\'avance.\n\nCordialement.') }" style="color:${GOLD_LIGHT};text-decoration:none;" target="_blank" rel="noopener">+221 78 295 37 80</a> ·
        Conciergerie 24/7<br><br>
        <span style="color:#6b6560;">Site de démonstration — cet e-mail a été généré automatiquement, merci de ne pas y répondre.</span>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

const h2 = t => `<h2 style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-weight:600;
  font-size:26px;line-height:1.2;color:${TEXT};">${t}</h2>`;
const overline = t => `<p style="margin:0 0 14px;font-family:'Courier New',monospace;font-size:11px;
  letter-spacing:3px;text-transform:uppercase;color:${GOLD};">${t}</p>`;
const para = t => `<p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;
  line-height:1.7;color:${MUTED};">${t}</p>`;
const row = (label, value, opts = {}) => `
  <tr>
    <td style="padding:9px 0;font-family:'Courier New',monospace;font-size:11px;letter-spacing:2px;
               text-transform:uppercase;color:${MUTED};vertical-align:top;white-space:nowrap;">${label}</td>
    <td align="right" style="padding:9px 0 9px 18px;font-family:Arial,Helvetica,sans-serif;font-size:14px;
               color:${opts.gold ? GOLD_LIGHT : TEXT};font-weight:${opts.bold ? "700" : "400"};">${value}</td>
  </tr>`;
const box = inner => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background-color:rgba(250,249,247,0.04);border:1px solid ${HAIRLINE};border-radius:10px;margin:0 0 22px;">
    <tr><td style="padding:18px 22px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${inner}</table></td></tr>
  </table>`;
const refBadge = ref => `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;"><tr>
    <td style="background:linear-gradient(135deg,${GOLD_LIGHT},${GOLD});border-radius:999px;
               padding:10px 26px;font-family:'Courier New',monospace;font-size:14px;font-weight:700;
               letter-spacing:2px;color:#14100a;">${esc(ref)}</td>
  </tr></table>`;

/* ---------- E-mails réservation ---------- */
function quoteRows(q) {
  if (q.mode === "vente") {
    return `
      ${row(`${esc(q.name)} — prix d'achat unitaire`, money(q.unit))}
      ${row("Quantité", `× ${q.qty}`)}
      ${q.delivery ? row("Livraison &amp; déchargement", money(q.delivery)) : ""}
      ${row(`TVA ${Math.round(q.tvaRate * 100)} %`, money(q.tva))}
      <tr><td colspan="2" style="border-top:1px solid ${GOLD};font-size:0;height:1px;">&nbsp;</td></tr>
      ${row("Total TTC estimé", money(q.ttc), { gold: true, bold: true })}`;
  }
  return `
    ${row(`${esc(q.name)} × ${q.qty} — ${q.days} jour${q.days > 1 ? "s" : ""}`, money(q.base))}
    ${q.discount ? row(`Tarif dégressif (−${q.rate * 100} %)`, "−" + money(q.discount)) : ""}
    ${q.delivery ? row("Livraison prioritaire A/R", money(q.delivery)) : ""}
    ${row(`TVA ${Math.round(q.tvaRate * 100)} %`, money(q.tva))}
    <tr><td colspan="2" style="border-top:1px solid ${GOLD};font-size:0;height:1px;">&nbsp;</td></tr>
    ${row("Total TTC", money(q.ttc), { gold: true, bold: true })}`;
}

function bookingClientEmail(b, q) {
  const firstName = esc(b.name.split(" ")[0]);

  if (q.mode === "vente") {
    const remise = b.delivery === "livraison"
      ? `Livraison &amp; déchargement —<br>${esc(b.address)}, ${esc(b.city)}`
      : "Enlèvement en agence — Dakar (SODIDA)";
    return layout({
      title: "Votre devis d'achat",
      preheader: `Devis d'achat ${b.ref} — ${q.name} × ${b.qty}.`,
      bodyHtml: `
        ${overline("Devis d'achat")}
        ${h2(`Merci, ${firstName}.`)}
        ${para("Votre demande d'achat est enregistrée. Un ingénieur commercial NDIOBEEN GUI LOGISTIQUE vous adresse un devis ferme sous 24 heures ouvrées — disponibilité, délais de livraison, garantie constructeur et mise en service comprises.")}
        ${refBadge(b.ref)}
        ${box(`
          ${row("Matériel", `${esc(q.name)} × ${b.qty}`)}
          ${row("Remise", remise)}
          ${row("Acompte indicatif", money(q.deposit) + " <span style='color:" + MUTED + ";'>(30 % à la commande)</span>")}
        `)}
        ${box(quoteRows(q))}
        ${para(`Le montant ci-dessus est une estimation TTC. Le devis ferme — garantie, mise en service et formation opérateur en option — vous parviendra signé sous 24 h.`)}
        ${para(`Une question ? Contactez-nous sur WhatsApp : <a href="https://wa.me/221782953780?text=${encodeURIComponent(`Bonjour,\n\nJe vous contacte au sujet de la demande ${b.ref} — ${q.name} × ${b.qty}. Pouvez-vous me confirmer la disponibilité et les prochaines étapes ?\n\nMerci.\n\nCordialement.`)}" style="color:${GOLD_LIGHT};" target="_blank" rel="noopener">+221 78 295 37 80</a>.`)}
      `,
    });
  }

  const dispo = b.delivery === "livraison"
    ? `Livraison prioritaire avant 7 h —<br>${esc(b.address)}, ${esc(b.city)}`
    : "Retrait en agence — Dakar (SODIDA), Rufisque ou Thiès";
  return layout({
    title: "Votre réservation est confirmée",
    preheader: `Réservation ${b.ref} confirmée — ${q.name}, du ${fmtDate(b.start)} au ${fmtDate(b.end)}.`,
    bodyHtml: `
      ${overline("Réservation confirmée")}
      ${h2(`Merci, ${firstName}.`)}
      ${para("Votre réservation est enregistrée. Votre concierge dédié vous contactera avant la mise à disposition pour régler chaque détail.")}
      ${refBadge(b.ref)}
      ${box(`
        ${row("Matériel", `${esc(q.name)} × ${b.qty}`)}
        ${row("Début", esc(fmtDate(b.start)))}
        ${row("Fin", esc(fmtDate(b.end)))}
        ${row("Mise à dispo", dispo)}
        ${row("Caution", money(q.caution) + " <span style='color:" + MUTED + ";'>(empreinte non débitée)</span>")}
      `)}
      ${box(quoteRows(q))}
      ${para(`Présentez la référence <strong style="color:${GOLD_LIGHT};">${esc(b.ref)}</strong> avec une pièce d'identité (CNI ou passeport). Le règlement s'effectue à la remise du matériel — espèces, virement, Wave ou Orange Money.`)}
      ${para(`Un imprévu ? La conciergerie répond 24/7 sur WhatsApp : <a href="https://wa.me/221782953780?text=${encodeURIComponent('Bonjour,\n\nJe vous contacte au sujet de ma réservation. Pouvez-vous m\'aider ?\n\nMerci d\'avance.\n\nCordialement.') }" style="color:${GOLD_LIGHT};" target="_blank" rel="noopener">+221 78 295 37 80</a>.`)}
    `,
  });
}

function bookingAdminEmail(b, q) {
  const isSale = q.mode === "vente";
  return layout({
    title: isSale ? `Nouveau devis d'achat ${b.ref}` : `Nouvelle réservation ${b.ref}`,
    preheader: `${b.name} — ${q.name} × ${b.qty}, ${money(q.ttc)} TTC.`,
    bodyHtml: `
      ${overline("Notification interne")}
      ${h2(isSale ? "Nouvelle demande d'achat" : "Nouvelle réservation")}
      ${refBadge(b.ref)}
      ${box(`
        ${row("Client", esc(b.name) + (b.company ? " — " + esc(b.company) : ""))}
        ${row("Type", b.clientType === "pro" ? "Professionnel" : "Particulier")}
        ${row("E-mail", esc(b.email)) }
        ${row("Téléphone", esc(b.phone))}
        ${row("Matériel", `${esc(q.name)} × ${b.qty}`)}
        ${isSale
          ? row("Remise", b.delivery === "livraison" ? `Livraison — ${esc(b.address)}, ${esc(b.city)}` : "Enlèvement en agence")
          : row("Période", `${esc(fmtDate(b.start))} → ${esc(fmtDate(b.end))} (${q.days} j)`)}
        ${isSale ? "" : row("Mise à dispo", b.delivery === "livraison" ? `Livraison — ${esc(b.address)}, ${esc(b.city)}` : "Retrait en agence")}
        ${isSale ? row("Acompte (30 %)", money(q.deposit)) : row("Caution", money(q.caution))}
      `)}
      ${box(quoteRows(q))}
    `,
  });
}

/* ---------- E-mails contact ---------- */
function contactAckEmail(c) {
  return layout({
    title: "Message bien reçu",
    preheader: "Votre message est entre les mains de la conciergerie — réponse sous 2 h ouvrées.",
    bodyHtml: `
      ${overline("Conciergerie")}
      ${h2(`Bien reçu, ${esc(c.name.split(" ")[0])}.`)}
      ${para("Votre message est entre les mains de notre conciergerie. Un interlocuteur dédié vous répond sous 2 heures ouvrées (lun–ven 7 h 30 – 18 h 30, sam 8 h – 13 h).")}
      ${box(row("Votre message", `<em style="color:${MUTED};">« ${esc(c.message)} »</em>`))}
      ${para(`Urgence ? Contactez la conciergerie sur WhatsApp : <a href="https://wa.me/221782953780?text=${encodeURIComponent('👋 Bonjour, je vous contacte en urgence. Pouvez-vous répondre dès que possible, s\'il vous plaît ?') }" style="color:${GOLD_LIGHT};" target="_blank" rel="noopener">+221 78 295 37 80</a> — la conciergerie répond 24/7.`)}
    `,
  });
}

function contactAdminEmail(c) {
  return layout({
    title: "Nouveau message de contact",
    preheader: `${c.name} — ${c.message.slice(0, 80)}`,
    bodyHtml: `
      ${overline("Notification interne")}
      ${h2("Nouveau message")}
      ${box(`
        ${row("Nom", esc(c.name))}
        ${row("E-mail", esc(c.email)) }
        ${c.phone ? row("Téléphone", esc(c.phone)) : ""}
      `)}
      ${box(row("Message", `<span style="color:${TEXT};white-space:pre-wrap;">${esc(c.message)}</span>`))}
    `,
  });
}

/* ---------- Versions texte ---------- */
function bookingClientText(b, q) {
  if (q.mode === "vente") {
    return [
      `NDIOBEEN GUI LOGISTIQUE — Devis d'achat`,
      ``,
      `Référence : ${b.ref}`,
      `Matériel : ${q.name} × ${b.qty}`,
      `Remise : ${b.delivery === "livraison" ? "Livraison — " + b.address + ", " + b.city : "Enlèvement en agence"}`,
      `Total TTC estimé : ${money(q.ttc)}`,
      `Acompte indicatif : ${money(q.deposit)} (30 % à la commande)`,
      ``,
      `Devis ferme sous 24 h ouvrées — +221 78 295 37 80`,
    ].join("\n");
  }
  return [
    `NDIOBEEN GUI LOGISTIQUE — Réservation confirmée`,
    ``,
    `Référence : ${b.ref}`,
    `Matériel : ${q.name} × ${b.qty}`,
    `Période : ${fmtDate(b.start)} → ${fmtDate(b.end)} (${q.days} j)`,
    `Mise à disposition : ${b.delivery === "livraison" ? "Livraison — " + b.address + ", " + b.city : "Retrait en agence"}`,
    `Total TTC : ${money(q.ttc)}`,
    `Caution : ${money(q.caution)} (empreinte non débitée)`,
    ``,
    `Conciergerie 24/7 : +221 78 295 37 80`,
  ].join("\n");
}

module.exports = {
  bookingClientEmail, bookingAdminEmail,
  contactAckEmail, contactAdminEmail,
  bookingClientText,
};
