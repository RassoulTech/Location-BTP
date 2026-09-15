import type { Metadata } from "next";
import "./app.css";

/* Ossature des ecrans applicatifs (connexion, espace client,
   administration). Le site public, lui, garde ses propres
   fichiers HTML et ne passe pas par ici. */

export const metadata: Metadata = {
  title: { default: "NDIOBEEN GUI LOGISTIQUE", template: "%s — NDIOBEEN GUI LOGISTIQUE" },
  robots: { index: false, follow: false },
};

/* Le theme memorise par le site public est applique avant le
   premier rendu, pour qu'il n'y ait aucun clignotement au
   passage du site vers l'espace client. */
const THEME_BOOT =
  `try{var t=localStorage.getItem("ndiobeen-theme");` +
  `document.documentElement.dataset.theme=(t==="light"||t==="dark")?t:"dark"}` +
  `catch(e){document.documentElement.dataset.theme="dark"}`;

const FONTS =
  "https://fonts.googleapis.com/css2?" +
  "family=Cormorant:ital,wght@0,400;0,500;0,600;0,700;1,500;1,600&" +
  "family=Montserrat:wght@300;400;500;600;700&" +
  "family=DM+Mono:wght@400;500&display=swap";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
        {/* La charte du site, servie depuis `public/` : un seul
            fichier, exactement celui des pages publiques. */}
        <link rel="stylesheet" href="/premium.css" />
        <link rel="icon" type="image/png" sizes="512x512" href="/img/icone.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
