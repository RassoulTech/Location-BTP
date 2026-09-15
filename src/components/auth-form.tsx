"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, registerAction } from "@/lib/actions/auth";
import type { ActionState } from "@/lib/actions/state";

/* ==========================================================
   Formulaires de connexion et d'inscription.

   Memes classes que les formulaires du site (`.field`,
   `.error`, `.btn btn-gold`) : l'utilisateur ne change pas
   d'univers en franchissant la connexion.

   Deux points de conception qui comptent :

   1. Les champs sont ecrits ici, dans le composant client, et
      non passes depuis la page : une fonction de rendu ne
      traverse pas la frontiere serveur/client.

   2. Les champs sont CONTROLES. React 19 reinitialise un
      formulaire apres l'execution de son action : avec des
      champs non controles, une simple erreur de saisie effacait
      tout ce qui avait ete tape. Sur un telephone, au bord d'un
      chantier, c'est l'abandon assure.
   ========================================================== */

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={`btn btn-gold${pending ? " is-loading" : ""}`}
      disabled={pending}
      aria-busy={pending}
    >
      {pending ? "Un instant… " : label}
    </button>
  );
}

function Field({
  label, name, error, hint, children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`field${error ? " has-error" : ""}`}>
      <label htmlFor={name}>{label}</label>
      {children}
      {error && <p className="error is-visible" id={`${name}-error`}>{error}</p>}
      {hint && !error && <p className="hint">{hint}</p>}
    </div>
  );
}

function Message({ state }: { state: ActionState }) {
  if (!state.message || state.ok) return null;
  return <p className="form-err" role="alert">{state.message}</p>;
}

/** Attributs communs a un champ controle relie a son erreur. */
function bind(name: string, error: string | undefined) {
  return {
    id: name,
    name,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? `${name}-error` : undefined,
  } as const;
}

/* ---------- Connexion ---------- */

export function LoginForm({ suite }: { suite: string }) {
  const [state, action] = useActionState<ActionState, FormData>(loginAction, {});
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const err = (k: string) => state.errors?.[k];

  return (
    <form className="contact-form" action={action} noValidate>
      <input type="hidden" name="suite" value={suite} />

      <Field label="Adresse e-mail" name="email" error={err("email")}>
        <input
          {...bind("email", err("email"))}
          type="email" required autoFocus
          autoComplete="email" autoCapitalize="none" spellCheck={false}
          placeholder="nom@domaine.sn"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <Field label="Mot de passe" name="password" error={err("password")}>
        <input
          {...bind("password", err("password"))}
          type="password" required autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      <Submit label="Se connecter" />
      <Message state={state} />
    </form>
  );
}

/* ---------- Inscription ---------- */

const EMPTY = {
  firstName: "", lastName: "", companyName: "",
  email: "", phone: "", password: "",
};

export function RegisterForm() {
  const [state, action] = useActionState<ActionState, FormData>(registerAction, {});
  const [values, setValues] = useState(EMPTY);
  const err = (k: string) => state.errors?.[k];

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  return (
    <form className="contact-form" action={action} noValidate>
      <div className="field-row">
        <Field label="Prénom *" name="firstName" error={err("firstName")}>
          <input
            {...bind("firstName", err("firstName"))}
            type="text" required autoComplete="given-name"
            value={values.firstName} onChange={set("firstName")}
          />
        </Field>
        <Field label="Nom *" name="lastName" error={err("lastName")}>
          <input
            {...bind("lastName", err("lastName"))}
            type="text" required autoComplete="family-name"
            value={values.lastName} onChange={set("lastName")}
          />
        </Field>
      </div>

      <Field
        label="Société" name="companyName" error={err("companyName")}
        hint="Laissez vide si vous êtes un particulier"
      >
        <input
          {...bind("companyName", err("companyName"))}
          type="text" autoComplete="organization"
          value={values.companyName} onChange={set("companyName")}
        />
      </Field>

      <Field label="Adresse e-mail *" name="email" error={err("email")}>
        <input
          {...bind("email", err("email"))}
          type="email" required autoComplete="email"
          autoCapitalize="none" spellCheck={false} placeholder="nom@domaine.sn"
          value={values.email} onChange={set("email")}
        />
      </Field>

      <Field label="Téléphone *" name="phone" error={err("phone")}>
        <input
          {...bind("phone", err("phone"))}
          type="tel" required autoComplete="tel"
          placeholder="+221 77 123 45 67"
          value={values.phone} onChange={set("phone")}
        />
      </Field>

      <Field
        label="Mot de passe *" name="password" error={err("password")}
        hint="10 caractères minimum"
      >
        <input
          {...bind("password", err("password"))}
          type="password" required autoComplete="new-password" minLength={10}
          value={values.password} onChange={set("password")}
        />
      </Field>

      <Submit label="Créer mon espace" />
      <Message state={state} />
    </form>
  );
}
