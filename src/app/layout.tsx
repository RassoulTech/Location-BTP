import type { Metadata } from "next";
import { isDbConfigured } from "@/db";
import { DatabaseNotConfigured } from "@/components/db-not-configured";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "NDIOBEEN GUI LOGISTIQUE — Location & vente de matériel BTP à Dakar",
    template: "%s — NDIOBEEN GUI LOGISTIQUE",
  },
  description:
    "Location et vente de matériel BTP et de levage à Dakar : grues mobiles, " +
    "pelles hydrauliques, manitous télescopiques, chargeuses, tractopelles et " +
    "bulldozers. Disponibilité calculée en direct, exemplaire par exemplaire.",
  openGraph: {
    type: "website",
    locale: "fr_SN",
    siteName: "NDIOBEEN GUI LOGISTIQUE",
    images: ["/machines/og.webp"],
  },
};

/* Thème mémorisé appliqué avant le premier rendu.
   Sombre par défaut, comme la version précédente du site. */
const THEME_BOOT =
  `try{var t=localStorage.getItem("ndiobeen-theme");` +
  `document.documentElement.dataset.theme=(t==="light"||t==="dark")?t:"dark"}` +
  `catch(e){document.documentElement.dataset.theme="dark"}`;

/* Les trois polices de la charte, chargées comme sur le site existant. */
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
      </head>
      <body>{isDbConfigured() ? children : <DatabaseNotConfigured />}</body>
    </html>
  );
}
