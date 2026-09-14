/** Ecran affiche tant que la base n'est pas branchee (CDC §101, §53). */
export function DatabaseNotConfigured() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-5 py-12">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-gold">
        Configuration requise
      </p>
      <h1 className="text-balance text-[27px] font-bold leading-tight tracking-tight text-ink">
        La base de donnees n'est pas encore branchee
      </h1>
      <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">
        L'application est deployee et fonctionne, mais la variable
        d'environnement{" "}
        <code className="border border-rule bg-surface px-1.5 py-0.5 text-[13px]">
          DATABASE_URL
        </code>{" "}
        n'est pas definie sur cet environnement. Aucune donnee ne peut donc
        etre lue.
      </p>

      <ol className="mt-6 flex list-decimal flex-col gap-2.5 border border-rule bg-surface px-6 py-5 pl-9 text-[14px] text-ink-2">
        <li>Vercel &rsaquo; projet &rsaquo; Settings &rsaquo; Environment Variables</li>
        <li>
          Ajouter <strong className="text-ink">DATABASE_URL</strong> — la chaine
          de connexion Neon du projet <strong className="text-ink">location-btp</strong>,
          version « pooled »
        </li>
        <li>
          Ajouter <strong className="text-ink">AUTH_SECRET</strong>
        </li>
        <li>
          Cocher les environnements concernes — <strong className="text-ink">Production</strong>{" "}
          et <strong className="text-ink">Preview</strong> sont deux reglages distincts
        </li>
        <li>Redeployer</li>
      </ol>

      <p className="mt-5 text-[13px] text-ink-3">
        La chaine de connexion contient un mot de passe : elle se colle
        uniquement dans Vercel, jamais dans le code ni dans le depot.
      </p>
    </main>
  );
}
