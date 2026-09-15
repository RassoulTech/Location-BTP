import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Connexion" };

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>;
}) {
  const [user, sp] = await Promise.all([currentUser(), searchParams]);
  const suite = sp.suite?.startsWith("/") && !sp.suite.startsWith("//") ? sp.suite : "";
  if (user) redirect(suite || "/espace");

  return (
    <div className="auth-card">
      <p className="overline">Espace client</p>
      <h1>Bon <em>retour.</em></h1>
      <p className="section-lede">
        Retrouvez vos demandes, vos locations en cours et vos documents.
      </p>

      <LoginForm suite={suite} />

      <p className="auth-foot">
        Pas encore de compte&nbsp;? <Link href="/inscription">Créer mon espace</Link>
      </p>
    </div>
  );
}
