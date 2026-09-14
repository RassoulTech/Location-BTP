import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Input, Panel } from "@/components/ui";
import { registerAction } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Creer un compte" };

export default async function RegisterPage() {
  if (await currentUser()) redirect("/espace");

  return (
    <Panel title="Creer un compte" description="Votre fiche client est creee en meme temps.">
      <ActionForm action={registerAction}>
        {(state) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Prenom" name="firstName" required error={state.errors?.firstName}>
                <Input id="firstName" name="firstName" required autoComplete="given-name" />
              </Field>
              <Field label="Nom" name="lastName" required error={state.errors?.lastName}>
                <Input id="lastName" name="lastName" required autoComplete="family-name" />
              </Field>
            </div>
            <Field label="Entreprise" name="companyName" hint="Laissez vide si vous etes un particulier">
              <Input id="companyName" name="companyName" autoComplete="organization" />
            </Field>
            <Field label="Adresse e-mail" name="email" required error={state.errors?.email}>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </Field>
            <Field label="Telephone" name="phone" required error={state.errors?.phone}>
              <Input id="phone" name="phone" type="tel" required autoComplete="tel"
                     placeholder="+221 …" />
            </Field>
            <Field label="Mot de passe" name="password" required
                   hint="10 caracteres minimum, avec au moins une lettre et un chiffre"
                   error={state.errors?.password}>
              <Input id="password" name="password" type="password" required
                     autoComplete="new-password" minLength={10} />
            </Field>
            <SubmitButton>Creer mon compte</SubmitButton>
          </>
        )}
      </ActionForm>

      <p className="mt-5 border-t border-rule pt-4 text-[13px] text-ink-3">
        Deja inscrit ?{" "}
        <Link href="/connexion" className="font-medium text-ink underline">Se connecter</Link>
      </p>
    </Panel>
  );
}
