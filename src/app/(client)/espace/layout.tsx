import Link from "next/link";
import { requireUserPage, isStaff } from "@/lib/auth/guard";
import { logoutAction } from "@/lib/actions/auth";
import { NavList } from "@/components/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Brand } from "@/components/ui";

export const dynamic = "force-dynamic";

const ITEMS = [
  { href: "/espace", label: "Tableau de bord" },
  { href: "/espace/locations", label: "Mes locations" },
  { href: "/espace/profil", label: "Mon profil" },
];

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage("/espace");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-[1100px] items-center gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="mr-auto"><Brand /></Link>
          <span className="hidden font-mono text-[0.72rem] uppercase tracking-[0.14em] text-soft md:inline">
            {user.firstName} {user.lastName}
          </span>
          <ThemeToggle />
          {isStaff(user) && (
            <Link href="/admin"
                  className="hidden rounded-full border border-hairline px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted transition-colors hover:border-gold hover:text-gold-2 sm:inline-block">
              Administration
            </Link>
          )}
          <form action={logoutAction}>
            <button type="submit"
                    className="rounded-full border border-hairline px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted transition-colors hover:border-err hover:text-err">
              Déconnexion
            </button>
          </form>
        </div>
        <div className="mx-auto max-w-[1100px] px-3 sm:px-5">
          <NavList items={ITEMS} orientation="horizontal" />
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-10 sm:px-6">{children}</main>
    </div>
  );
}
