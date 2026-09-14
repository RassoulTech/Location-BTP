import type { Metadata } from "next";
import { isDbConfigured } from "@/db";
import { DatabaseNotConfigured } from "@/components/db-not-configured";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Location & vente de materiel BTP",
    template: "%s — Location & vente de materiel BTP",
  },
  description:
    "Location et vente de materiel et d'equipements de construction : " +
    "disponibilite en temps reel, demande en ligne, suivi de vos locations.",
};

/** Applique le theme memorise avant le premier rendu, pour eviter le flash. */
const THEME_BOOT = `try{var t=localStorage.getItem("btp-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body>{isDbConfigured() ? children : <DatabaseNotConfigured />}</body>
    </html>
  );
}
