import "server-only";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string, salt: Buffer, keylen: number, options: object,
) => Promise<Buffer>;

/* ==========================================================
   Hachage des mots de passe (CDC §11)

   scrypt, fourni par Node — aucune dependance native a compiler,
   donc rien a installer de plus sous Windows, macOS ou Linux.
   Parametres : N=2^15, r=8, p=1 — recommandation OWASP.

   Format stocke : scrypt$N$r$p$<sel base64>$<cle base64>
   Le format porte ses parametres : on pourra les durcir plus tard
   sans invalider les mots de passe existants.
   ========================================================== */

const N = 32_768, R = 8, P = 1, KEYLEN = 32, SALTLEN = 16;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(SALTLEN);
  const key = await scrypt(plain.normalize("NFKC"), salt, KEYLEN, {
    N, r: R, p: P, maxmem: 128 * N * R * 2,
  });
  return ["scrypt", N, R, P, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(plain: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const n = Number(parts[1]), r = Number(parts[2]), p = Number(parts[3]);
  const salt = Buffer.from(parts[4]!, "base64");
  const expected = Buffer.from(parts[5]!, "base64");
  if (!Number.isFinite(n) || !Number.isFinite(r) || !Number.isFinite(p)) return false;

  const actual = await scrypt(plain.normalize("NFKC"), salt, expected.length, {
    N: n, r, p, maxmem: 128 * n * r * 2,
  });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** Regles minimales. Volontairement simples : longueur avant complexite. */
export function passwordIssue(plain: string): string | null {
  if (plain.length < 10) return "Le mot de passe doit faire au moins 10 caracteres.";
  if (plain.length > 200) return "Mot de passe trop long.";
  if (!/[a-zA-Z]/.test(plain) || !/[0-9]/.test(plain)) {
    return "Le mot de passe doit contenir au moins une lettre et un chiffre.";
  }
  return null;
}
