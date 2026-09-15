"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/* ==========================================================
   Ossature des espaces prives.

   La barre flottante du site est conservee telle quelle — meme
   verre depoli, meme monogramme, meme bascule clair/sombre —
   mais elle ne porte QUE l'identite et le compte.

   La navigation de section vit sur une seconde ligne, en
   pastilles. Raison mesuree : la barre du site est pleine a un
   pixel pres avec cinq liens ; l'administration en compte sept.
   Les y entasser les faisait deborder. Les pastilles reprennent
   le vocabulaire des filtres du catalogue, defilent
   horizontalement sur telephone, et acceptent autant de
   sections que necessaire.
   ========================================================== */

export function AppHeader({
  context, home, logout,
}: {
  context: string;
  home: string;
  logout: () => Promise<void>;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("ndiobeen-theme", next); } catch { /* navigation privee */ }
  };

  return (
    <header className={`nav-shell${scrolled ? " is-scrolled" : ""}`}>
      <Link className="brand" href={home}>
        <span className="brand-monogram">N</span>
        <span className="brand-word">NDIOBEEN <em>GUI LOGISTIQUE</em></span>
      </Link>
      <span className="nav-context">{context}</span>

      <Link className="nav-account is-ghost" href="/" title="Retour au site public">
        Site public
      </Link>

      <button className="theme-toggle" aria-label="Changer de thème" onClick={toggleTheme}>
        <svg className="icon-sun" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
        </svg>
        <svg className="icon-moon" viewBox="0 0 24 24">
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z" />
        </svg>
      </button>

      <form action={logout}>
        <button type="submit" className="nav-logout">Déconnexion</button>
      </form>
    </header>
  );
}

/** Navigation de section, en pastilles. */
export function AppTabs({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  const root = items[0]?.href ?? "/";

  return (
    <nav className="app-tabs" aria-label="Sections">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== root && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`app-tab${active ? " is-active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
