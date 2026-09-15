import {
  boolean, index, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ==========================================================
   Etape 1 — comptes, roles, permissions, sessions, clients.

   Le reste du modele metier (parc, exemplaires, locations,
   occupations, ventes, paiements) arrive aux etapes suivantes.
   On ne cree ici que ce que la connexion exige reellement.
   ========================================================== */

export const customerTypeEnum = pgEnum("customer_type", ["company", "individual"]);

/** Compte de connexion. Distinct de la fiche client (CDC §38). */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    /** Format : scrypt$N$r$p$sel$cle — jamais le mot de passe. */
    passwordHash: text("password_hash").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone"),
    /** On desactive un compte, on ne le supprime pas (CDC §39, §96). */
    isActive: boolean("is_active").notNull().default(true),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("users_email_key").on(t.email)],
);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** super_admin, admin, manager, commercial, comptable, technicien, client */
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    /** Un role systeme ne se supprime pas depuis l'interface. */
    isSystem: boolean("is_system").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("roles_slug_key").on(t.slug)],
);

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Forme « ressource.action » : equipment.create, rentals.validate... */
    slug: text("slug").notNull(),
    resource: text("resource").notNull(),
    action: text("action").notNull(),
    description: text("description"),
  },
  (t) => [uniqueIndex("permissions_slug_key").on(t.slug)],
);

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
    grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
    grantedBy: uuid("granted_by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.roleId] }),
    index("user_roles_role_idx").on(t.roleId),
  ],
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id").notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] })],
);

/**
 * Sessions en base, revocables une par une (CDC §11, §43).
 * Le cookie ne porte qu'un jeton aleatoire ; seul son SHA-256
 * est stocke, donc une fuite de cette table ne permet pas de
 * se connecter.
 */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("sessions_token_key").on(t.tokenHash),
    index("sessions_user_idx").on(t.userId),
  ],
);

/**
 * Fiche client (CDC §38). Elle peut exister sans compte — une
 * demande faite sans inscription en cree une — et un compte
 * interne n'en a pas.
 */
export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Numero lisible : CLI-2026-0042. */
    reference: text("reference").notNull(),
    type: customerTypeEnum("type").notNull().default("company"),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    companyName: text("company_name"),
    contactFirstName: text("contact_first_name").notNull(),
    contactLastName: text("contact_last_name").notNull(),
    email: text("email"),
    phone: text("phone").notNull(),
    ninea: text("ninea"),
    rccm: text("rccm"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("customers_reference_key").on(t.reference),
    index("customers_user_idx").on(t.userId),
    index("customers_email_idx").on(t.email),
  ],
);

/* ---------- Relations ---------- */

export const usersRelations = relations(users, ({ many, one }) => ({
  roles: many(userRoles),
  sessions: many(sessions),
  customer: one(customers, { fields: [users.id], references: [customers.userId] }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [userRoles.roleId], references: [roles.id] }),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId], references: [permissions.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const customersRelations = relations(customers, ({ one }) => ({
  user: one(users, { fields: [customers.userId], references: [users.id] }),
}));
