import Link from "next/link";

/* Ossature des ecrans de connexion : la barre du site, reduite
   a la marque, pour qu'on sache toujours ou l'on se trouve. */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="nav-shell">
        <a className="brand" href="/">
          <span className="brand-monogram">N</span>
          <span className="brand-word">NDIOBEEN <em>GUI LOGISTIQUE</em></span>
        </a>
        <Link className="nav-account is-ghost" href="/">
          Retour au site
        </Link>
      </header>
      <main className="auth-shell">{children}</main>
    </>
  );
}
