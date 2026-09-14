"use client";

import { ActionForm, SubmitButton } from "@/components/action-form";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { saveEquipmentTypeAction } from "@/lib/actions/equipment";

type Category = { id: string; name: string };

export type TypeDefaults = {
  id?: string; categoryId?: string; name?: string; brand?: string | null;
  model?: string | null; shortDescription?: string | null; description?: string | null;
  dailyRate?: number | null; weeklyRate?: number | null; monthlyRate?: number | null;
  depositAmount?: number | null; salePrice?: number | null;
  isRentable?: number; isSellable?: number; isPublished?: number;
};

export function EquipmentTypeForm({ categories, defaults }: {
  categories: Category[]; defaults?: TypeDefaults;
}) {
  const d = defaults ?? {};
  const num = (v: number | null | undefined) => (v == null ? "" : String(v));

  return (
    <ActionForm action={saveEquipmentTypeAction}
                hidden={d.id ? { id: d.id } : undefined}
                resetOnSuccess={!d.id}>
      {(state) => (
        <>
          <Field label="Categorie" name="categoryId" required error={state.errors?.categoryId}>
            <Select id="categoryId" name="categoryId" required defaultValue={d.categoryId ?? ""}>
              <option value="" disabled>Choisir…</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>

          <Field label="Nom du modele" name="name" required error={state.errors?.name}>
            <Input id="name" name="name" required maxLength={120} defaultValue={d.name ?? ""}
                   placeholder="Pelle hydraulique 20 t" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Marque" name="brand">
              <Input id="brand" name="brand" maxLength={80} defaultValue={d.brand ?? ""} />
            </Field>
            <Field label="Modele constructeur" name="model">
              <Input id="model" name="model" maxLength={80} defaultValue={d.model ?? ""} />
            </Field>
          </div>

          <Field label="Accroche" name="shortDescription" hint="Une phrase, affichee dans le catalogue">
            <Input id="shortDescription" name="shortDescription" maxLength={300}
                   defaultValue={d.shortDescription ?? ""} />
          </Field>

          <Field label="Description" name="description">
            <Textarea id="description" name="description" maxLength={4000}
                      defaultValue={d.description ?? ""} />
          </Field>

          <fieldset className="border border-rule p-3.5">
            <legend className="px-1.5 text-[12px] font-semibold text-ink-2">
              Tarifs en FCFA — laissez vide si non applicable
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Journalier" name="dailyRate" error={state.errors?.dailyRate}>
                <Input id="dailyRate" name="dailyRate" type="number" min={0}
                       defaultValue={num(d.dailyRate)} />
              </Field>
              <Field label="Hebdomadaire" name="weeklyRate">
                <Input id="weeklyRate" name="weeklyRate" type="number" min={0}
                       defaultValue={num(d.weeklyRate)} />
              </Field>
              <Field label="Mensuel" name="monthlyRate">
                <Input id="monthlyRate" name="monthlyRate" type="number" min={0}
                       defaultValue={num(d.monthlyRate)} />
              </Field>
              <Field label="Caution" name="depositAmount">
                <Input id="depositAmount" name="depositAmount" type="number" min={0}
                       defaultValue={num(d.depositAmount)} />
              </Field>
              <Field label="Prix de vente" name="salePrice">
                <Input id="salePrice" name="salePrice" type="number" min={0}
                       defaultValue={num(d.salePrice)} />
              </Field>
            </div>
            <p className="mt-2 text-[12px] text-ink-3">
              Le devis retient automatiquement la base la plus avantageuse pour le client.
            </p>
          </fieldset>

          <div className="flex flex-wrap gap-4 text-[13px] text-ink-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isRentable" defaultChecked={(d.isRentable ?? 1) === 1} />
              Louable
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isSellable" defaultChecked={d.isSellable === 1} />
              Vendable
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isPublished" defaultChecked={d.isPublished === 1} />
              Publie sur le site
            </label>
          </div>

          <SubmitButton>{d.id ? "Enregistrer" : "Creer le modele"}</SubmitButton>
        </>
      )}
    </ActionForm>
  );
}
