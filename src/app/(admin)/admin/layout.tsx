import { redirect } from "next/navigation";
import { isStaff, requireUserPage } from "@/lib/auth/guard";
import { logoutAction } from "@/lib/actions/auth";
import { AppHeader, AppTabs } from "@/components/app-header";

export const dynamic = "force-dynamic";

const ITEMS = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/demandes", label: "Demandes" },
  { href: "/admin/locations", label: "Locations" },
  { href: "/admin/parc", label: "Parc" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/parametres", label: "Paramètres" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserPage("/admin");
  if (!isStaff(user)) redirect("/acces-refuse");

  return (
    <>
      <AppHeader context="Administration" home="/admin" logout={logoutAction} />
      <main className="app-shell is-wide">
        <AppTabs items={ITEMS} />
        {children}
      </main>
    </>
  );
}
