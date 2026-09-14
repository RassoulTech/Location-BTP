"use client";

import Link from "next/link";
import { useEffect } from "react";

/* Frontiere d'erreur globale. Distingue le cas « base non configuree »
   du reste, parce que c'est le seul qui se repare en une minute. */

export default function ErrorBoundary({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  const notConfigured =
    error.name === "DatabaseNotConfiguredError" ||
    error.message.includes("DATABASE_URL");

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-12">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-gold">
        {notConfigured ? "Configuration requise" : "Erreur"}
      </p>
      <h1 className="text-balance text-[26px] font-bold leading-tight tracking-tight text-ink">
        {notConfigured
          ? "La base de donnees n'est pas encore branchee"
          : "Cette page n'a pas pu s'afficher"}
      </h1>

      {notConfigured ? (
        <>
          <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">
            L'application est bien deployee, mais la variable d'environnement{" "}
            <code className="border border-rule bg-surface px-1.5 py-0.5 text-[13px]">
              DATABASE_URL
            </code>{" "}
            n'est pas definie. Sans elle, aucune donnee ne peut etre lue.
          </p>
          <ol className="mt-5 flex list-decimal flex-col gap-2 pl-5 text-[14px] text-ink-2">
            <li>Ouvrir le projet sur Vercel &rsaquo; Settings &rsaquo; Environment Variables</li>
            <li>
              Ajouter <strong>DATABASE_URL</strong> avec la chaine de connexion
              Neon du projet <strong>location-btp</strong> (version « pooled »)
            </li>
            <li>Redeployer</li>
          </ol>
          <p className="mt-5 text-[13px] text-ink-3">
            La chaine contient un mot de passe : elle se colle uniquement dans
            Vercel, jamais dans le code ni dans le depot.
          </p>
        </>
      ) : (
        <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">
          Une erreur inattendue s'est produite. Le detail technique est dans les
          journaux du serveur.
          {error.digest && (
            <span className="mt-2 block text-[12.5px] text-ink-3">
              Reference : {error.digest}
            </span>
          )}
        </p>
      )}

      <div className="mt-7 flex flex-wrap gap-3">
        <button type="button" onClick={reset}
                className="border border-ink bg-ink px-4 py-2 text-[13px] font-semibold text-paper">
          Reessayer
        </button>
        <Link href="/"
              className="border border-rule-firm px-4 py-2 text-[13px] font-semibold text-ink">
          Accueil
        </Link>
      </div>
    </main>
  );
}
