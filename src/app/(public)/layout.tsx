import Link from "next/link";
import { currentUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/guard";
import { getCompanySettings } from "@/lib/settings";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";

const LINKS = [
  { href: "/materiels", label: "Materiels" },
  { href: "/contact", label: "Contact" },
];

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [user, company] = await Promise.all([currentUser(), getCompanySettings()]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-rule bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
          <Link href="/" className="mr-auto flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center bg-ink text-[15px] font-bold text-paper">
              B
            </span>
            <span className="text-[14px] font-bold uppercase tracking-[0.06em] text-ink">
              {company.legalName ?? "Materiel BTP"}
            </span>
          </Link>

          <nav className="hidden gap-1 sm:flex" aria-label="Navigation principale">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href}
                    className="px-3 py-2 text-[13.5px] font-medium text-ink-2 hover:text-ink">
                {l.label}
              </Link>
            ))}
          </nav>

          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-2">
              {isStaff(user) && (
                <Link href="/admin"
                      className="hidden border border-rule-firm px-3 py-2 text-[13px] font-semibold text-ink hover:bg-surface-2 sm:inline-block">
                  Administration
                </Link>
              )}
              <Link href="/espace"
                    className="border border-ink bg-ink px-3 py-2 text-[13px] font-semibold text-paper hover:opacity-90">
                Mon espace
              </Link>
            </div>
          ) : (
            <Link href="/connexion"
                  className="border border-ink bg-ink px-3 py-2 text-[13px] font-semibold text-paper hover:opacity-90">
              Connexion
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10">{children}</main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-wrap items-start justify-between gap-6 px-5 py-8 text-[13px] text-ink-3">
          <div>
            <p className="font-semibold text-ink-2">
              {company.legalName ?? "Location & vente de materiel BTP"}
            </p>
            {company.address && <p className="mt-1 whitespace-pre-line">{company.address}</p>}
            {company.phones && <p className="mt-1">{company.phones}</p>}
            {!company.legalName && (
              <p className="mt-1 max-w-sm">
                Les informations legales de l'entreprise seront affichees ici
                une fois renseignees dans l'administration.
              </p>
            )}
          </div>
          <nav className="flex flex-col gap-1.5" aria-label="Pied de page">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-ink-2">{l.label}</Link>
            ))}
            <Link href="/connexion" className="hover:text-ink-2">Espace client</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
