import type { NextConfig } from "next";

/* ==========================================================
   Le site existant EST la racine web.

   Ses fichiers vivent dans `public/` tels quels — memes noms,
   memes chemins relatifs qu'aujourd'hui, ou `vercel.json`
   declarait `outputDirectory: "premium"`. On ne les reecrit
   pas : on leur donne des URL propres et on branche le reste
   de l'application autour.
   ========================================================== */

const PAGES: [string, string][] = [
  ["/", "/index.html"],
  ["/services", "/services.html"],
  ["/flotte", "/flotte.html"],
  ["/reservation", "/reservation.html"],
  ["/contact", "/contact.html"],
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  /* `pg` charge des modules optionnels au demarrage : on le
     laisse hors du bundle serveur. */
  serverExternalPackages: ["pg"],

  async rewrites() {
    return {
      /* `beforeFiles` : ces regles passent avant les routes de
         l'application, donc `/` sert bien la page d'origine. */
      beforeFiles: PAGES.map(([source, destination]) => ({ source, destination })),
      afterFiles: [],
      fallback: [],
    };
  },

  async headers() {
    return [
      {
        /* Les espaces prives ne sont jamais indexes (CDC §48). */
        source: "/:path(admin|espace|connexion|inscription)/:rest*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        /* Reprise du cache long sur les images, comme le vercel.json d'origine. */
        source: "/img/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
