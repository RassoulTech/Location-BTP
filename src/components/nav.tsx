"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Navigation laterale (admin) ou horizontale (espace client). */
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
        ? "flex flex-col gap-0.5"
        : "-mx-1 flex gap-0.5 overflow-x-auto pb-1"}
    >
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/admin" && item.href !== "/espace" && pathname.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={[
              "whitespace-nowrap px-3 py-2 text-[13.5px] font-medium",
              active
                ? "bg-surface-2 text-ink"
                : "text-ink-3 hover:bg-surface-2 hover:text-ink-2",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
