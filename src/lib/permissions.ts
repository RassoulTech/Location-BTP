/* ==========================================================
   Catalogue des permissions et des roles (CDC §12, §13)

   Source de verite unique. Le script scripts/seed.ts synchronise
   la base a partir de ce fichier : ajouter une permission ici puis
   relancer `npm run db:seed` suffit.

   Regle absolue (CDC §44) : toute operation sensible appelle
   requirePermission() cote serveur. Masquer un bouton ne protege rien.
   ========================================================== */

export const PERMISSIONS = {
  "users.view": "Consulter les utilisateurs internes",
  "users.create": "Creer un utilisateur interne",
  "users.update": "Modifier un utilisateur interne",
  "users.disable": "Desactiver un utilisateur interne",
  "roles.view": "Consulter les roles et permissions",
  "roles.assign": "Attribuer un role a un utilisateur",

  "customers.view": "Consulter les clients",
  "customers.create": "Creer un client",
  "customers.update": "Modifier un client",

  "equipment.view": "Consulter le parc materiel",
  "equipment.create": "Creer un modele ou un exemplaire",
  "equipment.update": "Modifier un modele ou un exemplaire",
  "equipment.delete": "Supprimer un modele ou un exemplaire",
  "equipment.pricing": "Modifier les tarifs du parc",

  "rentals.view": "Consulter les locations",
  "rentals.view_own": "Consulter ses propres locations",
  "rentals.create": "Creer une demande de location",
  "rentals.validate": "Valider ou rejeter une demande",
  "rentals.assign_unit": "Affecter un exemplaire a une location",
  "rentals.return": "Enregistrer un retour",
  "rentals.cancel": "Annuler une location",

  "orders.view": "Consulter les commandes",
  "orders.view_own": "Consulter ses propres commandes",
  "orders.create": "Creer une commande",
  "orders.update": "Modifier une commande",
  "orders.cancel": "Annuler une commande",

  "products.view": "Consulter les produits",
  "products.create": "Creer un produit",
  "products.update": "Modifier un produit",
  "stock.view": "Consulter les stocks",
  "stock.adjust": "Ajuster un stock",

  "payments.view": "Consulter les paiements",
  "payments.view_own": "Consulter ses propres paiements",
  "payments.create": "Enregistrer un paiement",
  "payments.validate": "Valider un paiement",

  "invoices.view": "Consulter les factures",
  "invoices.view_own": "Consulter ses propres factures",
  "invoices.create": "Emettre une facture",

  "documents.view": "Consulter les documents",
  "documents.view_own": "Consulter ses propres documents",
  "documents.upload": "Deposer un document",

  "maintenance.view": "Consulter la maintenance",
  "maintenance.create": "Planifier une intervention",
  "maintenance.update": "Mettre a jour une intervention",

  "reports.view": "Consulter les statistiques et rapports",
  "logs.view": "Consulter le journal d'activite",
  "settings.view": "Consulter les parametres",
  "settings.update": "Modifier les parametres",
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ROLES = {
  super_admin: {
    name: "Super administrateur",
    description: "Acces complet, y compris roles et parametres.",
    permissions: "*" as const,
  },
  admin: {
    name: "Administrateur",
    description: "Gestion courante de la plateforme, hors gestion des roles.",
    permissions: (Object.keys(PERMISSIONS) as Permission[]).filter(
      (p) => !["roles.assign", "users.create", "users.disable"].includes(p),
    ),
  },
  manager: {
    name: "Manager",
    description: "Pilotage de l'activite : parc, locations, commandes, rapports.",
    permissions: [
      "customers.view", "customers.create", "customers.update",
      "equipment.view", "equipment.create", "equipment.update", "equipment.pricing",
      "rentals.view", "rentals.validate", "rentals.assign_unit", "rentals.return", "rentals.cancel",
      "orders.view", "orders.update", "orders.cancel",
      "products.view", "products.update", "stock.view", "stock.adjust",
      "payments.view", "invoices.view", "documents.view",
      "maintenance.view", "maintenance.create", "maintenance.update",
      "reports.view", "logs.view", "settings.view",
    ] satisfies Permission[],
  },
  commercial: {
    name: "Commercial",
    description: "Relation client, demandes de location et commandes.",
    permissions: [
      "customers.view", "customers.create", "customers.update",
      "equipment.view",
      "rentals.view", "rentals.create", "rentals.assign_unit",
      "orders.view", "orders.create", "orders.update",
      "products.view", "stock.view",
      "payments.view", "invoices.view", "documents.view", "documents.upload",
    ] satisfies Permission[],
  },
  comptable: {
    name: "Comptable",
    description: "Paiements, factures et rapports financiers.",
    permissions: [
      "customers.view",
      "rentals.view", "orders.view",
      "payments.view", "payments.create", "payments.validate",
      "invoices.view", "invoices.create",
      "documents.view", "reports.view",
    ] satisfies Permission[],
  },
  technicien: {
    name: "Technicien",
    description: "Parc, retours et maintenance.",
    permissions: [
      "equipment.view", "equipment.update",
      "rentals.view", "rentals.return",
      "maintenance.view", "maintenance.create", "maintenance.update",
      "documents.view", "documents.upload",
    ] satisfies Permission[],
  },
  client: {
    name: "Client",
    description: "Espace client : ses propres demandes et documents.",
    permissions: [
      "equipment.view",
      "rentals.view_own", "rentals.create",
      "orders.view_own", "orders.create",
      "payments.view_own", "invoices.view_own", "documents.view_own",
    ] satisfies Permission[],
  },
} as const;

export type RoleSlug = keyof typeof ROLES;

/** Les roles ci-dessus sont systeme : non supprimables depuis l'interface. */
export const SYSTEM_ROLES = Object.keys(ROLES) as RoleSlug[];

export function permissionsOf(role: RoleSlug): Permission[] {
  const def = ROLES[role];
  return def.permissions === "*"
    ? (Object.keys(PERMISSIONS) as Permission[])
    : [...def.permissions];
}
