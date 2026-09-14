"use client";

import { useActionState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Alert, Button } from "@/components/ui";
import type { ActionState } from "@/lib/actions/state";

/* ==========================================================
   Enveloppe de formulaire.

   Un seul composant client pour tous les formulaires : il porte
   l'etat (chargement, succes, erreur) et laisse les champs etre
   rendus cote serveur. Les erreurs par champ sont exposees via
   `state.errors` et lues par le parent.
   ========================================================== */

export function SubmitButton({ children, tone = "primary" }: {
  children: ReactNode;
  tone?: "primary" | "default" | "danger";
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" tone={tone} disabled={pending} aria-busy={pending}>
      {pending ? "Envoi…" : children}
    </Button>
  );
}

export function ActionForm({
  action, children, hidden, className, resetOnSuccess,
}: {
  action: (prev: ActionState, form: FormData) => Promise<ActionState>;
  children: ReactNode | ((state: ActionState) => ReactNode);
  hidden?: Record<string, string>;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, {} as ActionState);

  return (
    <form
      action={formAction}
      className={className ?? "flex flex-col gap-4"}
      key={resetOnSuccess && state.ok ? "reset" : "form"}
    >
      {hidden && Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}

      {state.message && (
        <Alert tone={state.ok ? "ok" : "danger"}>{state.message}</Alert>
      )}

      {typeof children === "function" ? children(state) : children}
    </form>
  );
}
