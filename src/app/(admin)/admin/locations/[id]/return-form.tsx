"use client";

import { useState } from "react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Input, Textarea } from "@/components/ui";
import { registerReturnAction } from "@/lib/actions/rentals";

/** Retour d'un exemplaire (CDC §24) — etat, compteur, dommages. */
export function ReturnForm({ rentalItemId, unitCode }: {
  rentalItemId: string; unitCode: string;
}) {
  const [open, setOpen] = useState(false);
  const [damaged, setDamaged] = useState(false);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)}
              className="border border-rule-firm px-3 py-1.5 text-[12.5px] font-semibold text-ink hover:bg-surface-2">
        Enregistrer le retour {unitCode && `de ${unitCode}`}
      </button>
    );
  }

  return (
    <ActionForm action={registerReturnAction} hidden={{ rentalItemId }}>
      {(state) => (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Compteur horaire" name="hourMeter" hint="Releve au retour"
                   error={state.errors?.hourMeter}>
              <Input id="hourMeter" name="hourMeter" type="number" min={0} />
            </Field>
            <Field label="Montant des dommages" name="damageAmount" hint="En FCFA, 0 si aucun"
                   error={state.errors?.damageAmount}>
              <Input id="damageAmount" name="damageAmount" type="number" min={0} defaultValue={0} />
            </Field>
          </div>

          <label className="flex items-start gap-2.5 text-[13px] text-ink-2">
            <input type="checkbox" name="requiresMaintenance" className="mt-0.5"
                   onChange={(e) => setDamaged(e.currentTarget.checked)} />
            <span>
              Immobiliser pour maintenance
              <span className="block text-[12px] text-ink-3">
                Cree une intervention et rend la machine non louable jusqu'a sa cloture.
              </span>
            </span>
          </label>

          {damaged && (
            <Field label="Constat" name="damageDescription" error={state.errors?.damageDescription}>
              <Textarea id="damageDescription" name="damageDescription"
                        placeholder="Ce qui a ete constate a la reception…" />
            </Field>
          )}

          <Field label="Observations" name="notes">
            <Textarea id="notes" name="notes" />
          </Field>

          <div className="flex gap-2">
            <SubmitButton>Valider le retour</SubmitButton>
            <button type="button" onClick={() => setOpen(false)}
                    className="border border-rule-firm px-3.5 py-2 text-[13px] font-semibold text-ink-2">
              Annuler
            </button>
          </div>
        </>
      )}
    </ActionForm>
  );
}
