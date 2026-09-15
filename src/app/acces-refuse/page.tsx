import Link from "next/link";

export const metadata = { title: "Accès refusé" };

export default function AccesRefusePage() {
  return (
    <main className="auth-shell">
      <div className="auth-card">
        <p className="overline">Accès refusé</p>
        <h1>Cette page ne vous est <em>pas ouverte.</em></h1>
        <p className="section-lede">
          Votre compte existe bien, mais il n&rsquo;a pas les droits nécessaires pour cette
          section. Si c&rsquo;est une erreur, demandez à un administrateur de vérifier
          votre rôle.
        </p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link className="btn btn-gold" href="/espace">Mon espace</Link>
          <Link className="btn btn-line" href="/">Retour au site</Link>
        </div>
      </div>
    </main>
  );
}
