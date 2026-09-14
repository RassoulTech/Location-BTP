import Link from "next/link";
import { requireUserPage, isStaff } from "@/lib/auth/guard";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import { NavList } from "@/components/nav";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = "force-dynamic";

const ITEMS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/locations", label: "Locations" },
  { href: "/admin/materiels", label: "Parc materiel" },
  { href: "/admin/maintenance", label: "Maintenance" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/journal", label: "Journal" },
  { href: "/admin/parametres", label: "Parametres" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage("/admin");
  if (!isStaff(user)) redirect("/acces-refuse");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-5 py-3">
          <Link href="/admin" className="mr-auto flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center bg-gold text-[15px] font-bold text-paper">
              A
            </span>
            <span className="text-[13.5px] font-bold uppercase tracking-[0.06em] text-ink">
              Administration
            </span>
          </Link>
          <span className="hidden text-[13px] text-ink-3 md:inline">
            {user.firstName} {user.lastName} · {user.roles.join(", ")}
          </span>
          <ThemeToggle />
          <Link href="/"
                className="hidden border border-rule-firm px-3 py-2 text-[13px] font-semibold text-ink hover:bg-surface-2 sm:inline-block">
            Site public
          </Link>
          <form action={logoutAction}>
            <button type="submit"
                    className="border border-rule-firm px-3 py-2 text-[13px] font-semibold text-ink-2 hover:bg-surface-2">
              Deconnexion
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-5 py-6 lg:flex-row lg:gap-8">
        <aside className="lg:w-52 lg:shrink-0">
          <div className="lg:sticky lg:top-6">
            <div className="hidden lg:block"><NavList items={ITEMS} /></div>
            <div className="lg:hidden"><NavList items={ITEMS} orientation="horizontal" /></div>
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
