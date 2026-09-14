import type { ReactNode } from "react";
import Link from "next/link";
import type { Tone } from "@/lib/labels";

/* ==========================================================
   Briques d'interface. Volontairement peu nombreuses : meme
   rayon, meme filet, memes espacements d'un ecran a l'autre.
   Toutes les couleurs passent par les jetons de globals.css,
   donc les deux themes fonctionnent sans effort supplementaire.
   ========================================================== */

const cx = (...v: unknown[]) => v.filter((x): x is string => typeof x === "string" && x.length > 0).join(" ");

/* ---------- Surfaces ---------- */

export function Panel({
  title, description, actions, children, className,
}: {
  title?: ReactNode; description?: ReactNode; actions?: ReactNode;
  children: ReactNode; className?: string;
}) {
  return (
    <section className={cx("border border-rule bg-surface", className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-rule px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold tracking-tight text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-ink-3">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </header>
      )}
      <div className="px-4 py-4 sm:px-5">{children}</div>
    </section>
  );
}

export function StatTile({ label, value, hint, tone = "neutral" }: {
  label: string; value: ReactNode; hint?: string; tone?: Tone;
}) {
  const color =
    tone === "ok" ? "text-ok" : tone === "danger" ? "text-danger"
    : tone === "warn" ? "text-gold" : tone === "info" ? "text-info" : "text-ink";
  return (
    <div className="bg-surface px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.09em] text-ink-3">{label}</p>
      <p className={cx("tabular mt-1.5 text-[26px] font-bold leading-none tracking-tight", color)}>
        {value}
      </p>
      {hint && <p className="mt-1.5 text-[12px] text-ink-3">{hint}</p>}
    </div>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-px border border-rule bg-rule [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
      {children}
    </div>
  );
}

/* ---------- Statuts ---------- */

const TONES: Record<Tone, string> = {
  neutral: "bg-surface-2 text-ink-3 border-rule",
  ok:      "bg-ok-soft text-ok border-transparent",
  warn:    "bg-gold-soft text-gold border-transparent",
  danger:  "bg-danger-soft text-danger border-transparent",
  info:    "bg-info-soft text-info border-transparent",
};

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cx(
      "inline-flex items-center whitespace-nowrap rounded-sm border px-2 py-0.5 text-[11px] font-semibold",
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
         className={cx("border px-4 py-3 text-[13px]", TONES[tone])}>
      {title && <p className="font-semibold">{title}</p>}
      {children && <div className={cx(title ? "mt-1" : "", "leading-relaxed")}>{children}</div>}
    </div>
  );
}

/* ---------- Actions ---------- */

type ButtonTone = "primary" | "default" | "danger" | "ghost";

const BUTTON: Record<ButtonTone, string> = {
  primary: "bg-ink text-paper border-ink hover:opacity-90",
  default: "bg-surface text-ink border-rule-firm hover:bg-surface-2",
  danger:  "bg-surface text-danger border-danger hover:bg-danger-soft",
  ghost:   "bg-transparent text-ink-2 border-transparent hover:bg-surface-2",
};

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap border px-3.5 py-2 " +
  "text-[13px] font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-50";

export function Button({
  tone = "default", type = "button", className, children, ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: ButtonTone }) {
  return (
    <button type={type} className={cx(BUTTON_BASE, BUTTON[tone], className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({
  href, tone = "default", className, children,
}: { href: string; tone?: ButtonTone; className?: string; children: ReactNode }) {
  return (
    <Link href={href} className={cx(BUTTON_BASE, BUTTON[tone], className)}>
      {children}
    </Link>
  );
}

/* ---------- Formulaires ---------- */

const CONTROL =
  "w-full border border-rule-firm bg-surface px-3 py-2 text-[14px] text-ink " +
  "placeholder:text-ink-3 disabled:opacity-60";

export function Field({
  label, name, error, hint, required, children,
}: {
  label: string; name: string; error?: string; hint?: string;
  required?: boolean; children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-[12px] font-semibold text-ink-2">
        {label}
        {required && <span className="text-danger" aria-hidden> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[12px] text-ink-3">{hint}</p>}
      {error && <p className="text-[12px] font-medium text-danger">{error}</p>}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(CONTROL, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(CONTROL, "min-h-[90px] resize-y", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(CONTROL, "appearance-none pr-8", props.className)} />;
}

/* ---------- Tableaux ---------- */

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="-mx-4 overflow-x-auto sm:-mx-5">
      <div className="inline-block min-w-full px-4 align-middle sm:px-5">{children}</div>
    </div>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return <table className="w-full min-w-[560px] border-collapse text-[13.5px]">{children}</table>;
}

export function Th({ children, align = "left" }: { children?: ReactNode; align?: "left" | "right" }) {
  return (
    <th className={cx(
      "border-b border-rule-firm pb-2 pr-4 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3",
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
      "border-b border-rule py-2.5 pr-4 align-top text-ink-2",
      align === "right" && "pr-0 text-right",
      className,
    )}>
      {children}
    </td>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border border-dashed border-rule-firm px-5 py-10 text-center">
      <p className="text-[14px] font-semibold text-ink">{title}</p>
      {children && <div className="mx-auto mt-1.5 max-w-md text-[13px] text-ink-3">{children}</div>}
    </div>
  );
}

/* ---------- En-tete de page ---------- */

export function PageHeader({ eyebrow, title, description, actions }: {
  eyebrow?: string; title: string; description?: ReactNode; actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-5">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.13em] text-gold">
            {eyebrow}
          </p>
        )}
        <h1 className="text-balance text-[26px] font-bold leading-tight tracking-tight text-ink sm:text-[30px]">
          {title}
        </h1>
        {description && <p className="mt-2 max-w-2xl text-[14px] text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export { cx };
