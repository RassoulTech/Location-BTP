import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserPage, isStaff } from "@/lib/auth/guard";
import { logoutAction } from "@/lib/actions/auth";
import { NavList } from "@/components/nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { Brand } from "@/components/ui";

export const dynamic = "force-dynamic";

const ITEMS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/locations", label: "Locations" },
  { href: "/admin/materiels", label: "Parc matériel" },
  { href: "/admin/maintenance", label: "Maintenance" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/journal", label: "Journal" },
  { href: "/admin/parametres", label: "Paramètres" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage("/admin");
  if (!isStaff(user)) redirect("/acces-refuse");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-hairline">
        <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-4 sm:px-6">
          <Link href="/admin" className="mr-auto flex items-center gap-4">
            <Brand />
            <span className="hidden border-l border-hairline pl-4 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-gold lg:inline">
              Administration
            </span>
          </Link>
          <span className="hidden font-mono text-[0.7rem] uppercase tracking-[0.12em] text-soft xl:inline">
            {user.firstName} {user.lastName} · {user.roles.join(", ")}
          </span>
          <ThemeToggle />
          <Link href="/"
                className="hidden rounded-full border border-hairline px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted transition-colors hover:border-gold hover:text-gold-2 sm:inline-block">
            Site public
          </Link>
          <form action={logoutAction}>
            <button type="submit"
                    className="rounded-full border border-hairline px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.14em] text-muted transition-colors hover:border-err hover:text-err">
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row lg:gap-10">
        <aside className="lg:w-56 lg:shrink-0">
          <div className="lg:sticky lg:top-8">
            <div className="hidden lg:block"><NavList items={ITEMS} /></div>
            <div className="lg:hidden"><NavList items={ITEMS} orientation="horizontal" /></div>
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
