/* ==========================================================
   Catalogue des roles et des permissions (CDC §12, §13).

   Source de verite unique : `npm run db:seed` synchronise la
   base a partir de ce fichier. Ajouter une permission = l'ajouter
   ici, puis relancer le seed.

   Regle non negociable (CDC §44) : toute operation sensible
   appelle `requirePermission()` cote serveur. Masquer un bouton
   ne protege rien.

   Ce catalogue couvre deja tout le perimetre du cahier des
   charges, meme si les ecrans correspondants arrivent aux
   etapes suivantes : les roles n'auront pas a etre refaits.
   ========================================================== */

export const PERMISSIONS = {
  "users.view": "Consulter les utilisateurs internes",
  "users.create": "Créer un utilisateur interne",
  "users.update": "Modifier un utilisateur interne",
  "users.disable": "Désactiver un utilisateur interne",
  "roles.view": "Consulter les rôles et permissions",
  "roles.assign": "Attribuer un rôle à un utilisateur",

  "customers.view": "Consulter les clients",
  "customers.create": "Créer un client",
  "customers.update": "Modifier un client",

  "equipment.view": "Consulter le parc matériel",
  "equipment.create": "Créer un modèle ou un exemplaire",
  "equipment.update": "Modifier un modèle ou un exemplaire",
  "equipment.delete": "Retirer un modèle ou un exemplaire",
  "equipment.pricing": "Modifier les tarifs du parc",

  "rentals.view": "Consulter les locations",
  "rentals.view_own": "Consulter ses propres locations",
  "rentals.create": "Créer une demande de location",
  "rentals.validate": "Valider ou rejeter une demande",
  "rentals.assign_unit": "Affecter un exemplaire à une location",
  "rentals.return": "Enregistrer un retour",
  "rentals.cancel": "Annuler une location",

  "orders.view": "Consulter les commandes",
  "orders.view_own": "Consulter ses propres commandes",
  "orders.create": "Créer une commande",
  "orders.update": "Modifier une commande",
  "orders.cancel": "Annuler une commande",

  "products.view": "Consulter les produits",
  "products.create": "Créer un produit",
  "products.update": "Modifier un produit",
  "stock.view": "Consulter les stocks",
  "stock.adjust": "Ajuster un stock",

  "payments.view": "Consulter les paiements",
  "payments.view_own": "Consulter ses propres paiements",
  "payments.create": "Enregistrer un paiement",
  "payments.validate": "Valider un paiement",

  "invoices.view": "Consulter les factures",
  "invoices.view_own": "Consulter ses propres factures",
  "invoices.create": "Émettre une facture",

  "documents.view": "Consulter les documents",
  "documents.view_own": "Consulter ses propres documents",
  "documents.upload": "Déposer un document",

  "maintenance.view": "Consulter la maintenance",
  "maintenance.create": "Planifier une intervention",
  "maintenance.update": "Mettre à jour une intervention",

  "contact.view": "Consulter les messages de contact",
  "contact.update": "Traiter un message de contact",

  "reports.view": "Consulter les statistiques et rapports",
  "logs.view": "Consulter le journal d'activité",
  "settings.view": "Consulter les paramètres",
  "settings.update": "Modifier les paramètres",
} as const;

export type Permission = keyof typeof PERMISSIONS;

const ALL = Object.keys(PERMISSIONS) as Permission[];

export const ROLES = {
  super_admin: {
    name: "Super administrateur",
    description: "Accès complet, y compris rôles et paramètres.",
    permissions: "*" as const,
  },
  admin: {
    name: "Administrateur",
    description: "Gestion courante de la plateforme, hors gestion des rôles.",
    permissions: ALL.filter(
      (p) => !["roles.assign", "users.create", "users.disable"].includes(p),
    ),
  },
  manager: {
    name: "Manager",
    description: "Pilotage de l'activité : parc, locations, commandes, rapports.",
    permissions: [
      "customers.view", "customers.create", "customers.update",
      "equipment.view", "equipment.create", "equipment.update", "equipment.pricing",
      "rentals.view", "rentals.validate", "rentals.assign_unit", "rentals.return",
      "rentals.cancel",
      "orders.view", "orders.update", "orders.cancel",
      "products.view", "products.update", "stock.view", "stock.adjust",
      "payments.view", "invoices.view", "documents.view",
      "maintenance.view", "maintenance.create", "maintenance.update",
      "contact.view", "contact.update",
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
      "contact.view", "contact.update",
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
    description: "Parc, état des exemplaires et interventions.",
    permissions: [
      "equipment.view", "equipment.update",
      "rentals.view", "rentals.return",
      "maintenance.view", "maintenance.create", "maintenance.update",
      "documents.view", "documents.upload",
    ] satisfies Permission[],
  },
  client: {
    name: "Client",
    description: "Espace client : ses demandes, ses locations, ses documents.",
    permissions: [
      "rentals.view_own", "rentals.create",
      "orders.view_own", "orders.create",
      "payments.view_own", "invoices.view_own",
      "documents.view_own",
    ] satisfies Permission[],
  },
} as const;

export type RoleSlug = keyof typeof ROLES;

/** Les roles qui donnent acces a l'administration. */
export const STAFF_ROLES: RoleSlug[] = [
  "super_admin", "admin", "manager", "commercial", "comptable", "technicien",
];

export function permissionsOfRole(slug: RoleSlug): Permission[] {
  const role = ROLES[slug];
  return role.permissions === "*" ? ALL : [...role.permissions];
}
