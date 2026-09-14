"use client";

import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Input, Select } from "@/components/ui";
import { saveEquipmentUnitAction } from "@/lib/actions/equipment";
import { UNIT_CONDITION_LABELS, UNIT_STATUS_LABELS } from "@/lib/labels";

export function UnitForm({ typeId }: { typeId: string }) {
  return (
    <ActionForm action={saveEquipmentUnitAction} hidden={{ typeId }} resetOnSuccess>
      {(state) => (
        <>
          <Field label="Code interne" name="code" required
                 hint="Celui peint sur la machine, ex. CAT320-001"
                 error={state.errors?.code}>
            <Input id="code" name="code" required maxLength={40} placeholder="CAT320-001" />
          </Field>

          <Field label="Numero de serie" name="serialNumber" error={state.errors?.serialNumber}>
            <Input id="serialNumber" name="serialNumber" maxLength={80} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Etat" name="condition" required>
              <Select id="condition" name="condition" defaultValue="good">
                {Object.entries(UNIT_CONDITION_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </Select>
            </Field>
            <Field label="Statut" name="status" required>
              <Select id="status" name="status" defaultValue="available">
                {Object.entries(UNIT_STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l.label}</option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Emplacement" name="location">
              <Input id="location" name="location" maxLength={120} placeholder="Depot, chantier…" />
            </Field>
            <Field label="Compteur horaire" name="hourMeter">
              <Input id="hourMeter" name="hourMeter" type="number" min={0} defaultValue={0} />
            </Field>
          </div>

          <Field label="Date d'acquisition" name="acquiredOn">
            <Input id="acquiredOn" name="acquiredOn" type="date" />
          </Field>

          <SubmitButton>Ajouter l'exemplaire</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
