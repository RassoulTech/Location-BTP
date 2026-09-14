import Link from "next/link";
import { requireUserPage, isStaff } from "@/lib/auth/guard";
import { logoutAction } from "@/lib/actions/auth";
import { NavList } from "@/components/nav";
import { ThemeToggle } from "@/components/theme-toggle";

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
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-5 py-3">
          <Link href="/" className="mr-auto flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center bg-ink text-[15px] font-bold text-paper">B</span>
            <span className="text-[13.5px] font-bold uppercase tracking-[0.06em] text-ink">
              Espace client
            </span>
          </Link>
          <span className="hidden text-[13px] text-ink-3 sm:inline">
            {user.firstName} {user.lastName}
          </span>
          <ThemeToggle />
          {isStaff(user) && (
            <Link href="/admin"
                  className="border border-rule-firm px-3 py-2 text-[13px] font-semibold text-ink hover:bg-surface-2">
              Administration
            </Link>
          )}
          <form action={logoutAction}>
            <button type="submit"
                    className="border border-rule-firm px-3 py-2 text-[13px] font-semibold text-ink-2 hover:bg-surface-2">
              Deconnexion
            </button>
          </form>
        </div>
        <div className="mx-auto max-w-5xl px-4">
          <NavList items={ITEMS} orientation="horizontal" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8">{children}</main>
    </div>
  );
}
