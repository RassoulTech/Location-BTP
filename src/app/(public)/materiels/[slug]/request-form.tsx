"use client";

import { useState } from "react";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { createRentalRequestAction } from "@/lib/actions/rentals";

export function RentalRequestForm({
  typeId, startDate, endDate, maxQuantity, minDate,
}: {
  typeId: string; startDate: string; endDate: string;
  maxQuantity: number; minDate: string;
}) {
  const [delivery, setDelivery] = useState<"pickup" | "delivery">("pickup");
  const [start, setStart] = useState(startDate);

  return (
    <ActionForm action={createRentalRequestAction} hidden={{ typeId }} resetOnSuccess>
      {(state) => (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Debut" name="startDate" required error={state.errors?.startDate}>
              <Input id="startDate" name="startDate" type="date" required
                     min={minDate} defaultValue={startDate}
                     onChange={(e) => setStart(e.currentTarget.value)} />
            </Field>
            <Field label="Fin" name="endDate" required error={state.errors?.endDate}>
              <Input id="endDate" name="endDate" type="date" required
                     min={start} defaultValue={endDate} />
            </Field>
          </div>

          <Field label="Nombre d'exemplaires" name="quantity" required
                 hint={`${maxQuantity} disponible(s) sur cette periode`}
                 error={state.errors?.quantity}>
            <Input id="quantity" name="quantity" type="number" required
                   min={1} max={maxQuantity} defaultValue={1} />
          </Field>

          <Field label="Mise a disposition" name="deliveryMode" required>
            <Select id="deliveryMode" name="deliveryMode" defaultValue="pickup"
                    onChange={(e) => setDelivery(e.currentTarget.value as "pickup" | "delivery")}>
              <option value="pickup">Retrait en agence</option>
              <option value="delivery">Livraison sur site</option>
            </Select>
          </Field>

          {delivery === "delivery" && (
            <div className="grid gap-4 sm:grid-cols-[1.6fr_1fr]">
              <Field label="Adresse du chantier" name="siteAddress" required
                     error={state.errors?.siteAddress}>
                <Input id="siteAddress" name="siteAddress" required maxLength={200}
                       placeholder="Lieu-dit, rue, reperes" />
              </Field>
              <Field label="Ville" name="siteCity" required error={state.errors?.siteCity}>
                <Input id="siteCity" name="siteCity" required maxLength={80} />
              </Field>
            </div>
          )}

          <Field label="Precisions" name="customerNote" error={state.errors?.customerNote}>
            <Textarea id="customerNote" name="customerNote" maxLength={1000}
                      placeholder="Acces au chantier, horaires, besoin d'un operateur…" />
          </Field>

          <div className="flex items-center justify-between gap-3">
            <p className="text-[12px] text-ink-3">
              L'exemplaire est reserve des l'envoi, en attente de validation.
            </p>
            <SubmitButton>Envoyer la demande</SubmitButton>
          </div>
        </>
      )}
    </ActionForm>
  );
}
