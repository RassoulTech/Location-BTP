import { z } from "zod";

/* ==========================================================
   Schemas partages.

   La validation cote navigateur sert le confort ; celle-ci,
   executee sur le serveur, fait foi (CDC §54).
   ========================================================== */

/* Volontairement une expression reguliere plutot qu'un
   validateur maison : elle est stable d'une version de zod a
   l'autre et suffit a ecarter les saisies manifestement
   fautives. La verification reelle d'une adresse passe par
   l'envoi d'un message, pas par une regle syntaxique. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, "Adresse e-mail invalide.")
  .max(150, "Adresse e-mail trop longue.")
  .regex(EMAIL_RE, "Adresse e-mail invalide (ex. nom@domaine.sn).");

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Ce champ est trop court.")
  .max(80, "Ce champ est trop long.");

export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Numéro de téléphone invalide.")
  .max(30, "Numéro de téléphone invalide.")
  .refine((v) => v.replace(/\D/g, "").length >= 7, "Numéro de téléphone invalide.");

/**
 * Longueur d'abord : c'est la seule exigence qui augmente
 * reellement la resistance. On ecarte en plus les mots de passe
 * qui ne sont qu'une repetition d'un meme caractere.
 */
export const passwordSchema = z
  .string()
  .min(10, "Au moins 10 caractères.")
  .max(200, "Mot de passe trop long.")
  .refine((v) => new Set(v).size >= 4, "Mot de passe trop répétitif.");

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
  password: passwordSchema,
});

/** Erreurs par champ, dans la forme attendue par les formulaires. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
