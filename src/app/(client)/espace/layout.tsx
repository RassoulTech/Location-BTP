import { requireUserPage } from "@/lib/auth/guard";
import { logoutAction } from "@/lib/actions/auth";
import { AppHeader, AppTabs } from "@/components/app-header";

export const dynamic = "force-dynamic";

const ITEMS = [
  { href: "/espace", label: "Tableau de bord" },
  { href: "/espace/demandes", label: "Mes demandes" },
  { href: "/espace/locations", label: "Mes locations" },
  { href: "/espace/documents", label: "Mes documents" },
  { href: "/espace/profil", label: "Mon profil" },
];

export default async function EspaceLayout({ children }: { children: React.ReactNode }) {
  await requireUserPage("/espace");

  return (
    <>
      <AppHeader context="Espace client" home="/espace" logout={logoutAction} />
      <main className="app-shell">
        <AppTabs items={ITEMS} />
        {children}
      </main>
    </>
  );
}
