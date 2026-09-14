"use client";

import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { scheduleMaintenanceAction } from "@/lib/actions/maintenance";

export function MaintenanceForm({ units }: { units: { id: string; code: string }[] }) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <ActionForm action={scheduleMaintenanceAction} resetOnSuccess>
      {(state) => (
        <>
          <Field label="Exemplaire" name="unitId" required error={state.errors?.unitId}>
            <Select id="unitId" name="unitId" required defaultValue="">
              <option value="" disabled>Choisir…</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.code}</option>)}
            </Select>
          </Field>

          <Field label="Intitule" name="title" required error={state.errors?.title}>
            <Input id="title" name="title" required maxLength={120}
                   placeholder="Revision 500 h, remplacement flexible…" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Du" name="startDate" required error={state.errors?.startDate}>
              <Input id="startDate" name="startDate" type="date" required defaultValue={today} />
            </Field>
            <Field label="Au" name="endDate" required error={state.errors?.endDate}>
              <Input id="endDate" name="endDate" type="date" required defaultValue={today} />
            </Field>
          </div>

          <Field label="Cout estime" name="cost" hint="En FCFA">
            <Input id="cost" name="cost" type="number" min={0} defaultValue={0} />
          </Field>

          <Field label="Description" name="description">
            <Textarea id="description" name="description" maxLength={2000} />
          </Field>

          <p className="text-[12px] text-ink-3">
            La machine sera refusee a la location sur cette periode, meme si une
            demande arrive en meme temps.
          </p>

          <SubmitButton>Planifier</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
