import Link from "next/link";
import { currentUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/guard";
import { getCompanySettings } from "@/lib/settings";
import { ThemeToggle } from "@/components/theme-toggle";
import { Brand } from "@/components/ui";

export const dynamic = "force-dynamic";

const LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/materiels", label: "La flotte" },
  { href: "/contact", label: "Contact" },
];

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [user, company] = await Promise.all([currentUser(), getCompanySettings()]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Barre flottante en verre dépoli, comme sur le site. */}
      <header className="fixed left-1/2 top-4 z-50 w-[min(1180px,calc(100%-32px))] -translate-x-1/2">
        <div className="nav-blur flex items-center gap-6 rounded-card border border-hairline px-5 py-2.5">
          <Link href="/" className="mr-auto shrink-0">
            <Brand />
          </Link>

          <nav className="hidden gap-7 lg:flex" aria-label="Navigation principale">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href}
                    className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-muted transition-colors hover:text-gold-2">
                {l.label}
              </Link>
            ))}
          </nav>

          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-2.5">
              {isStaff(user) && (
                <Link href="/admin"
                      className="hidden rounded-full border border-hairline px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted transition-colors hover:border-gold hover:text-gold-2 sm:inline-block">
                  Administration
                </Link>
              )}
              <Link href="/espace"
                    className="gold-grad rounded-full px-5 py-2 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#14100a]">
                Mon espace
              </Link>
            </div>
          ) : (
            <Link href="/connexion"
                  className="gold-grad rounded-full px-5 py-2 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[#14100a]">
              Connexion
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1180px] flex-1 px-4 pb-24 pt-32 sm:px-6">
        {children}
      </main>

      <footer className="border-t border-hairline">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-start justify-between gap-10 px-4 py-12 sm:px-6">
          <div className="max-w-sm">
            <p className="font-serif text-[1.15rem] font-semibold tracking-[0.04em]">
              NDIOBEEN <em className="italic font-medium text-gold-2">GUI LOGISTIQUE</em>
            </p>
            {company.address && (
              <p className="mt-3 whitespace-pre-line text-[0.85rem] font-light text-muted">
                {company.address}
              </p>
            )}
            {company.phones && (
              <p className="mt-1.5 font-mono text-[0.8rem] tracking-[0.06em] text-muted">
                {company.phones}
              </p>
            )}
            {company.openingHours && (
              <p className="mt-3 text-[0.8rem] font-light text-soft">{company.openingHours}</p>
            )}
          </div>

          <nav className="flex flex-col gap-2.5" aria-label="Pied de page">
            {LINKS.slice(1).map((l) => (
              <Link key={l.href} href={l.href}
                    className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-muted transition-colors hover:text-gold-2">
                {l.label}
              </Link>
            ))}
            <Link href="/espace"
                  className="font-mono text-[0.72rem] uppercase tracking-[0.18em] text-muted transition-colors hover:text-gold-2">
              Espace client
            </Link>
          </nav>
        </div>
        <div className="border-t border-hairline px-4 py-5 text-center sm:px-6">
          <p className="font-mono text-[0.68rem] uppercase tracking-[0.2em] text-soft">
            © {new Date().getFullYear()} NDIOBEEN GUI LOGISTIQUE — Dakar, Sénégal
          </p>
        </div>
      </footer>
    </div>
  );
}
