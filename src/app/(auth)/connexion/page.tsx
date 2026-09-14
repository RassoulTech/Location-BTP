import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Input, Panel } from "@/components/ui";
import { loginAction } from "@/lib/actions/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: { searchParams: Promise<{ suite?: string }> }) {
  const [user, sp] = await Promise.all([currentUser(), searchParams]);
  if (user) redirect(sp.suite?.startsWith("/") ? sp.suite : "/espace");

  return (
    <Panel title="Connexion" description="Accedez a vos demandes, locations et documents.">
      <ActionForm action={loginAction} hidden={{ suite: sp.suite ?? "" }}>
        {(state) => (
          <>
            <Field label="Adresse e-mail" name="email" required error={state.errors?.email}>
              <Input id="email" name="email" type="email" required autoComplete="email" autoFocus />
            </Field>
            <Field label="Mot de passe" name="password" required error={state.errors?.password}>
              <Input id="password" name="password" type="password" required
                     autoComplete="current-password" />
            </Field>
            <SubmitButton>Se connecter</SubmitButton>
          </>
        )}
      </ActionForm>

      <p className="mt-5 border-t border-rule pt-4 text-[13px] text-ink-3">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium text-ink underline">Creer un compte</Link>
      </p>
    </Panel>
  );
}
