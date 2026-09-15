/* ==========================================================
   NDIOBEEN GUI LOGISTIQUE — transport e-mail
   Production : SMTP professionnel via .env (SendGrid, Resend,
   Mailgun, Amazon SES, Gmail… — tous exposent un relais SMTP).
   Développement : sans identifiants, bascule automatique sur
   Ethereal (boîte de test Nodemailer) avec URL de prévisualisation.
   ========================================================== */

const nodemailer = require("nodemailer");

let transporterPromise = null;
let demoMode = false;

function isConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

async function getTransporter() {
  if (transporterPromise) return transporterPromise;

  if (isConfigured()) {
    demoMode = false;
    transporterPromise = Promise.resolve(nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    }));
    console.log(`[mailer] SMTP configuré : ${process.env.SMTP_HOST}`);
  } else {
    demoMode = true;
    transporterPromise = nodemailer.createTestAccount().then(acc => {
      console.log("[mailer] Aucun SMTP configuré — mode DÉMO Ethereal actif.");
      console.log("[mailer] Les e-mails sont visibles via les URL de prévisualisation retournées.");
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: { user: acc.user, pass: acc.pass },
      });
    });
  }
  return transporterPromise;
}

/**
 * Envoie un e-mail. Retourne { messageId, previewUrl? }.
 * `previewUrl` n'existe qu'en mode démo (Ethereal).
 */
async function sendMail({ to, subject, html, text, replyTo }) {
  const transporter = await getTransporter();
  const from = process.env.MAIL_FROM || '"NDIOBEEN GUI LOGISTIQUE" <no-reply@ndiobeen-logistique.sn>';
  const info = await transporter.sendMail({ from, to, subject, html, text, replyTo });
  const previewUrl = demoMode ? nodemailer.getTestMessageUrl(info) || undefined : undefined;
  if (previewUrl) console.log(`[mailer] ${subject} → ${to} | aperçu : ${previewUrl}`);
  else console.log(`[mailer] ${subject} → ${to} | id : ${info.messageId}`);
  return { messageId: info.messageId, previewUrl };
}

module.exports = { sendMail, isConfigured, get demoMode() { return demoMode; } };
