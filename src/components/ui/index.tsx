import type { ReactNode } from "react";
import Link from "next/link";
import type { Tone } from "@/lib/labels";

/* ==========================================================
   Briques d'interface — charte NDIOBEEN GUI LOGISTIQUE.

   Mêmes règles partout : site public, espace client,
   administration. Titres Cormorant, texte Montserrat,
   surtitres DM Mono, cartes 14 px sur verre dépoli,
   boutons pilule, or en dégradé.
   ========================================================== */

const cx = (...v: unknown[]) =>
  v.filter((x): x is string => typeof x === "string" && x.length > 0).join(" ");

/* ---------- Surfaces ---------- */

export function Panel({
  title, description, actions, children, className,
}: {
  title?: ReactNode; description?: ReactNode; actions?: ReactNode;
  children: ReactNode; className?: string;
}) {
  return (
    <section className={cx("glass-card overflow-hidden", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-hairline px-5 py-4 sm:px-6">
          <div className="min-w-0">
            {title && (
              <h2 className="font-serif text-[1.35rem] leading-tight text-text">{title}</h2>
            )}
            {description && (
              <p className="mt-1 text-[0.86rem] font-light text-muted">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </header>
      )}
      <div className="px-5 py-5 sm:px-6">{children}</div>
    </section>
  );
}

export function StatTile({ label, value, hint, tone = "neutral" }: {
  label: string; value: ReactNode; hint?: string; tone?: Tone;
}) {
  const color =
    tone === "ok" ? "text-ok" : tone === "danger" ? "text-err"
    : tone === "warn" ? "text-gold-2" : tone === "info" ? "text-info" : "text-text";
  return (
    <div className="glass-card px-5 py-4">
      <p className="overline">{label}</p>
      <p className={cx("tabular mt-2 font-serif text-[2rem] leading-none", color)}>{value}</p>
      {hint && <p className="mt-2 text-[0.8rem] font-light text-soft">{hint}</p>}
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(170px,1fr))]">
      {children}
    </div>
  );
}

/* ---------- Statuts ---------- */

const TONES: Record<Tone, string> = {
  neutral: "border-hairline text-muted",
  ok:      "border-transparent bg-ok/15 text-ok",
  warn:    "border-transparent bg-gold/18 text-gold-2",
  danger:  "border-transparent bg-err/15 text-err",
  info:    "border-transparent bg-info/15 text-info",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cx(
      "inline-flex items-center whitespace-nowrap rounded-full border px-3 py-1",
      "font-mono text-[0.68rem] uppercase tracking-[0.12em]",
      TONES[tone],
    )}>
      {children}
    </span>
  );
}

export function Alert({ tone = "info", title, children }: {
  tone?: Tone; title?: ReactNode; children?: ReactNode;
}) {
  return (
    <div role={tone === "danger" ? "alert" : "status"}
         className={cx("rounded-card border px-5 py-4 text-[0.9rem] font-light", TONES[tone])}>
      {title && <p className="font-serif text-[1.1rem] font-semibold">{title}</p>}
      {children && <div className={cx(title ? "mt-1.5" : "", "leading-relaxed")}>{children}</div>}
    </div>
  );
}

/* ---------- Actions ---------- */

type ButtonTone = "gold" | "line" | "danger" | "ghost";

const BUTTON_BASE =
  "inline-flex min-h-[44px] items-center justify-center gap-2 whitespace-nowrap rounded-full " +
  "border px-6 py-2.5 font-sans text-[0.74rem] font-semibold uppercase tracking-[0.18em] " +
  "transition-[transform,box-shadow,background-color,border-color,color] duration-300 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const BUTTON: Record<ButtonTone, string> = {
  gold:   "gold-grad border-transparent text-[#14100a] shadow-[0_12px_36px_rgba(202,138,4,0.25)] hover:-translate-y-0.5",
  line:   "border-hairline-gold bg-transparent text-text hover:border-gold hover:text-gold-2",
  danger: "border-err/50 bg-transparent text-err hover:bg-err/10",
  ghost:  "border-transparent bg-transparent text-muted hover:text-text",
};

export function Button({
  tone = "line", type = "button", className, children, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone }) {
  return (
    <button type={type} className={cx(BUTTON_BASE, BUTTON[tone], className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href, tone = "line", className, children, target,
}: {
  href: string; tone?: ButtonTone; className?: string;
  children: ReactNode; target?: string;
}) {
  return (
    <Link href={href} target={target} className={cx(BUTTON_BASE, BUTTON[tone], className)}>
      {children}
    </Link>
  );
}

/* ---------- Formulaires ---------- */

const CONTROL =
  "w-full rounded-[10px] border border-hairline bg-[var(--input-bg)] px-4 py-3 " +
  "font-sans text-[0.92rem] font-light text-text placeholder:text-soft " +
  "transition-colors focus:border-hairline-gold focus:bg-[var(--input-bg-2)] disabled:opacity-60";

export function Field({
  label, name, error, hint, required, children,
}: {
  label: string; name: string; error?: string; hint?: string;
  required?: boolean; children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name}
             className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted">
        {label}
        {required && <span className="text-gold" aria-hidden> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[0.78rem] font-light text-soft">{hint}</p>}
      {error && <p className="text-[0.78rem] font-medium text-err">{error}</p>}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(CONTROL, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(CONTROL, "min-h-[110px] resize-y", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(CONTROL, "appearance-none pr-10", props.className)} />;
}

/* ---------- Tableaux ---------- */

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-5 overflow-x-auto sm:-mx-6">
      <div className="inline-block min-w-full px-5 align-middle sm:px-6">{children}</div>
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return <table className="w-full min-w-[560px] border-collapse text-[0.9rem] font-light">{children}</table>;
}

export function Th({ children, align = "left" }: { children?: ReactNode; align?: "left" | "right" }) {
  return (
    <th className={cx(
      "border-b border-hairline pb-3 pr-4 font-mono text-[0.66rem] font-normal",
      "uppercase tracking-[0.16em] text-soft",
      align === "right" && "pr-0 text-right",
    )}>
      {children}
    </th>
  );
}

export function Td({ children, align = "left", className }: {
  children?: ReactNode; align?: "left" | "right"; className?: string;
}) {
  return (
    <td className={cx(
      "border-b border-hairline py-3.5 pr-4 align-top text-muted",
      align === "right" && "pr-0 text-right",
      className,
    )}>
      {children}
    </td>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-hairline px-6 py-12 text-center">
      <p className="font-serif text-[1.3rem] text-text">{title}</p>
      {children && (
        <div className="mx-auto mt-2 max-w-md text-[0.88rem] font-light text-muted">{children}</div>
      )}
    </div>
  );
}

/* ---------- En-tête de page ---------- */

export function PageHeader({ eyebrow, title, description, actions }: {
  eyebrow?: string; title: ReactNode; description?: ReactNode; actions?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-hairline pb-6">
      <div className="min-w-0">
        {eyebrow && <p className="overline mb-3">{eyebrow}</p>}
        <h1 className="text-balance font-serif text-[2.1rem] leading-[1.06] sm:text-[2.6rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-3 max-w-2xl text-[0.95rem] font-light leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
    </header>
  );
}

/* ---------- Marque ---------- */

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-full border border-hairline-gold font-serif text-[1.35rem] font-semibold text-gold-2">
        N
      </span>
      {!compact && (
        <span className="whitespace-nowrap font-serif text-[1.15rem] font-semibold tracking-[0.04em]">
          NDIOBEEN <em className="font-medium not-italic text-gold-2 italic">GUI LOGISTIQUE</em>
        </span>
      )}
    </span>
  );
}

export { cx };
