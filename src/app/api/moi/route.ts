import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";
import { isStaff } from "@/lib/auth/guard";

/* ==========================================================
   Etat du compte, pour la barre de navigation du site public.

   Le site est servi en fichiers statiques : il ne peut pas
   savoir qui est connecte au moment du rendu. Cette route lui
   repond en une ligne, sans jamais exposer autre chose que le
   prenom — ni identifiant, ni role detaille, ni permission.
   ========================================================== */

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentUser();

  return NextResponse.json(
    user
      ? { signedIn: true, firstName: user.firstName, staff: isStaff(user) }
      : { signedIn: false },
    { headers: { "Cache-Control": "no-store, private" } },
  );
}
