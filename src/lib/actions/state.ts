/* Etat renvoye par toutes les actions serveur, consomme par
   `useActionState` cote formulaire. */

export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
  /** Valeurs utiles renvoyees par l'action (reference creee...). */
  data?: Record<string, string>;
};

export function failure(message: string, errors?: Record<string, string>): ActionState {
  return { ok: false, message, errors };
}

export function success(message?: string, data?: Record<string, string>): ActionState {
  return { ok: true, message, data };
}

export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessError";
  }
}

/**
 * Convertit une exception en message lisible, sans jamais
 * laisser fuiter un detail technique vers le navigateur
 * (CDC §43, §59).
 */
export function toActionState(err: unknown): ActionState {
  if (err instanceof Error) {
    const known = [
      "BusinessError", "ForbiddenError", "UnauthenticatedError",
      "PricingError", "InvalidTransitionError",
    ];
    if (known.includes(err.name)) return failure(err.message);

    if (err.name === "DatabaseNotConfiguredError") {
      return failure("Le service est momentanément indisponible. Réessayez dans un instant.");
    }
    if (err.message.includes("duplicate key")) {
      return failure("Cette valeur existe déjà.");
    }
  }
  console.error("[action]", err);
  return failure("Une erreur est survenue. Réessayez.");
}
