import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { requireUserPage } from "@/lib/auth/guard";
import { formatDateTime } from "@/lib/format";
import { Alert, Badge, PageHeader, Panel } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon profil" };

export default async function ProfilePage() {
  const user = await requireUserPage("/espace/profil");
  const [customer] = await db.select().from(customers)
    .where(eq(customers.userId, user.id)).limit(1);

  const rows: [string, string | null][] = [
    ["Nom", `${user.firstName} ${user.lastName}`],
    ["Adresse e-mail", user.email],
    ["Telephone", customer?.phone ?? null],
    ["Entreprise", customer?.companyName ?? null],
    ["Reference client", customer?.reference ?? null],
    ["NINEA", customer?.ninea ?? null],
    ["RCCM", customer?.rccm ?? null],
    ["Compte cree le", customer ? formatDateTime(customer.createdAt) : null],
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader eyebrow="Espace client" title="Mon profil" />

      <Panel title="Informations">
        <dl className="flex flex-col">
          {rows.map(([label, value]) => (
            <div key={label}
                 className="flex flex-wrap items-baseline justify-between gap-4 border-b border-rule py-2.5 last:border-0">
              <dt className="text-[13px] text-ink-3">{label}</dt>
              <dd className="text-[14px] font-medium text-ink">{value ?? "—"}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      <Panel title="Roles">
        <div className="flex flex-wrap gap-2">
          {user.roles.map((r) => <Badge key={r}>{r}</Badge>)}
        </div>
        <p className="mt-3 text-[13px] text-ink-3">
          {user.permissions.size} permission(s) accordee(s). Les roles se modifient
          uniquement depuis l'administration.
        </p>
      </Panel>

      <Alert tone="info" title="Modification des informations">
        La modification en ligne du profil arrive avec le module clients.
        En attendant, une correction se demande a la conciergerie.
      </Alert>
    </div>
  );
}
