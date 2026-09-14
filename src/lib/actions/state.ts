/** Etat renvoye par toutes les actions serveur, consomme par useActionState. */
export type ActionState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export const EMPTY: ActionState = {};

export function failure(message: string, errors?: Record<string, string>): ActionState {
  return { ok: false, message, errors };
}

export function success(message?: string): ActionState {
  return { ok: true, message };
}

/** Convertit une exception en message lisible sans fuiter de detail technique. */
export function toActionState(err: unknown): ActionState {
  if (err instanceof Error) {
    const known = [
      "ForbiddenError", "UnauthenticatedError", "PricingError",
      "InvalidTransitionError", "BusinessError",
    ];
    if (known.includes(err.name)) return failure(err.message);
    if (err.message.includes("unit_occupancies_no_overlap")) {
      return failure(
        "Cet exemplaire est deja pris sur cette periode (location ou maintenance). " +
        "Choisissez-en un autre ou changez les dates.",
      );
    }
    if (err.message.includes("duplicate key")) {
      return failure("Cette valeur existe deja.");
    }
  }
  console.error("[action]", err);
  return failure("Une erreur est survenue. Reessayez.");
}

export class BusinessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BusinessError";
  }
}
