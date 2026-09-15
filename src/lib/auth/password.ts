import "server-only";
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/* ==========================================================
   Hachage des mots de passe (CDC §11, §43).

   scrypt du module `node:crypto` : robuste, recommande, et
   surtout sans dependance native a compiler — ce qui compte
   ici, l'environnement de developpement etant sous Windows.

   Format stocke : scrypt$N$r$p$sel$cle   (le tout en base64url)
   Les parametres voyagent avec le hachage : on pourra les
   durcir plus tard sans invalider les comptes existants.
   ========================================================== */

const scrypt = promisify(scryptCb) as (
  password: string | Buffer, salt: string | Buffer, keylen: number, options: object,
) => Promise<Buffer>;

const N = 32768;   // cout CPU/memoire
const r = 8;       // taille de bloc
const p = 1;       // parallelisme
const KEYLEN = 64;
const SALT_BYTES = 16;

/* scrypt a besoin d'environ 128 * N * r octets. */
const MAX_MEMORY = 256 * N * r;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const key = await scrypt(password.normalize("NFKC"), salt, KEYLEN, {
    N, r, p, maxmem: MAX_MEMORY,
  });
  return [
    "scrypt", N, r, p,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, nRaw, rRaw, pRaw, saltRaw, keyRaw] = parts;
  const n = Number(nRaw), rr = Number(rRaw), pp = Number(pRaw);
  if (!Number.isInteger(n) || !Number.isInteger(rr) || !Number.isInteger(pp)) return false;

  const salt = Buffer.from(saltRaw ?? "", "base64url");
  const expected = Buffer.from(keyRaw ?? "", "base64url");
  if (salt.length === 0 || expected.length === 0) return false;

  const actual = await scrypt(password.normalize("NFKC"), salt, expected.length, {
    N: n, r: rr, p: pp, maxmem: 256 * n * rr,
  });

  /* Comparaison a temps constant : sinon la duree de la reponse
     renseigne un attaquant sur le nombre d'octets corrects. */
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
