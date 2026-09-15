import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { currentUser } from "@/lib/auth/session";
import { RegisterForm } from "@/components/auth-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Créer mon espace" };

export default async function InscriptionPage() {
  if (await currentUser()) redirect("/espace");

  return (
    <div className="auth-card">
      <p className="overline">Espace client</p>
      <h1>Créez votre <em>espace.</em></h1>
      <p className="section-lede">
        Vos coordonnées sont enregistrées une fois pour toutes&nbsp;: vos prochaines
        demandes se font en trois étapes au lieu de quatre. Aucun paiement en ligne.
      </p>

      <RegisterForm />

      <p className="auth-foot">
        Déjà inscrit&nbsp;? <Link href="/connexion">Se connecter</Link>
      </p>
    </div>
  );
}
