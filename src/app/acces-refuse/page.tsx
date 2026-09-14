import Link from "next/link";

export const metadata = { title: "Acces refuse" };

export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-gold">
        Acces refuse
      </p>
      <h1 className="text-[26px] font-bold tracking-tight text-ink">
        Cette page ne vous est pas ouverte
      </h1>
      <p className="mt-3 text-[14px] text-ink-2">
        Votre compte n'a pas la permission requise. Si vous pensez que c'est une
        erreur, demandez a un administrateur de verifier votre role.
      </p>
      <div className="mt-6 flex gap-3">
        <Link href="/espace"
              className="border border-ink bg-ink px-4 py-2 text-[13px] font-semibold text-paper">
          Mon espace
        </Link>
        <Link href="/" className="border border-rule-firm px-4 py-2 text-[13px] font-semibold text-ink">
          Accueil
        </Link>
      </div>
    </main>
  );
}
