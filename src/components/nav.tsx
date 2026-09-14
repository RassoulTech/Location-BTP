"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Navigation latérale (administration) ou horizontale (espace client). */
export function NavList({
  items, orientation = "vertical",
}: {
  items: { href: string; label: string }[];
  orientation?: "vertical" | "horizontal";
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation"
      className={orientation === "vertical"
        ? "flex flex-col gap-1"
        : "-mx-2 flex gap-1 overflow-x-auto px-2 pb-2"}
    >
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/admin" && item.href !== "/espace" &&
           pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={[
              "whitespace-nowrap rounded-full px-4 py-2.5 font-mono text-[0.7rem]",
              "uppercase tracking-[0.14em] transition-colors",
              active
                ? "bg-[var(--glass-2)] text-gold-2"
                : "text-soft hover:bg-[var(--glass)] hover:text-muted",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
