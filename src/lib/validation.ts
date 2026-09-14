import { z } from "zod";

/* Schemas partages. La validation client sert l'experience,
   celle-ci — cote serveur — fait foi (CDC §54). */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const isoDate = z.string().regex(ISO_DATE, "Date invalide (AAAA-MM-JJ).");

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, "Adresse e-mail invalide.")
  .max(150)
  .email("Adresse e-mail invalide.");

export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Numero de telephone invalide.")
  .max(30)
  .refine((v) => v.replace(/\D/g, "").length >= 7, "Numero de telephone invalide.");

export const nameSchema = z.string().trim().min(2, "Champ trop court.").max(80);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Mot de passe requis.").max(200),
});

export const registerSchema = z.object({
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  companyName: z.string().trim().max(120).optional().or(z.literal("")),
  password: z.string().min(10, "Au moins 10 caracteres.").max(200),
});

export const rentalRequestSchema = z
  .object({
    typeId: z.string().uuid("Materiel invalide."),
    startDate: isoDate,
    endDate: isoDate,
    quantity: z.coerce.number().int().min(1, "Au moins 1.").max(20, "Au plus 20."),
    deliveryMode: z.enum(["pickup", "delivery"]),
    siteAddress: z.string().trim().max(200).optional().or(z.literal("")),
    siteCity: z.string().trim().max(80).optional().or(z.literal("")),
    customerNote: z.string().trim().max(1000).optional().or(z.literal("")),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "La date de fin doit suivre la date de debut.",
    path: ["endDate"],
  })
  .refine(
    (v) => v.deliveryMode === "pickup" || ((v.siteAddress ?? "").length >= 5 && (v.siteCity ?? "").length >= 2),
    { message: "Adresse de livraison incomplete.", path: ["siteAddress"] },
  );

export const equipmentTypeSchema = z.object({
  categoryId: z.string().uuid("Categorie requise."),
  name: nameSchema.max(120),
  brand: z.string().trim().max(80).optional().or(z.literal("")),
  model: z.string().trim().max(80).optional().or(z.literal("")),
  shortDescription: z.string().trim().max(300).optional().or(z.literal("")),
  description: z.string().trim().max(4000).optional().or(z.literal("")),
  dailyRate: z.coerce.number().int().min(0).max(1_000_000_000).optional(),
  weeklyRate: z.coerce.number().int().min(0).max(1_000_000_000).optional(),
  monthlyRate: z.coerce.number().int().min(0).max(1_000_000_000).optional(),
  depositAmount: z.coerce.number().int().min(0).max(1_000_000_000).optional(),
  salePrice: z.coerce.number().int().min(0).max(1_000_000_000).optional(),
  isRentable: z.coerce.boolean().optional(),
  isSellable: z.coerce.boolean().optional(),
  isPublished: z.coerce.boolean().optional(),
});

export const equipmentUnitSchema = z.object({
  typeId: z.string().uuid(),
  code: z.string().trim().min(2, "Code requis.").max(40),
  serialNumber: z.string().trim().max(80).optional().or(z.literal("")),
  condition: z.enum(["new", "good", "fair", "poor", "out_of_service"]),
  status: z.enum(["available", "reserved", "rented", "maintenance", "unavailable"]),
  location: z.string().trim().max(120).optional().or(z.literal("")),
  hourMeter: z.coerce.number().int().min(0).max(1_000_000).optional(),
  acquiredOn: isoDate.optional().or(z.literal("")),
});

export const maintenanceSchema = z
  .object({
    unitId: z.string().uuid(),
    title: z.string().trim().min(3, "Intitule requis.").max(120),
    description: z.string().trim().max(2000).optional().or(z.literal("")),
    startDate: isoDate,
    endDate: isoDate,
    cost: z.coerce.number().int().min(0).max(1_000_000_000).optional(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: "La date de fin doit suivre la date de debut.",
    path: ["endDate"],
  });

export const returnSchema = z.object({
  rentalItemId: z.string().uuid(),
  hourMeter: z.coerce.number().int().min(0).max(1_000_000).optional(),
  damageDescription: z.string().trim().max(2000).optional().or(z.literal("")),
  damageAmount: z.coerce.number().int().min(0).max(1_000_000_000).optional(),
  requiresMaintenance: z.coerce.boolean().optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

/** Transforme une erreur zod en messages par champ, pour l'affichage. */
export function fieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
