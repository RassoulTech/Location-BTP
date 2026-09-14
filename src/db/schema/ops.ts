import {
  bigint, date, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { documentTypeEnum, maintenanceStatusEnum, notificationChannelEnum } from "./enums";
import { equipmentUnits } from "./equipment";
import { users } from "./auth";

/* ==========================================================
   Exploitation : maintenance, documents, notifications,
   journal d'activite, parametres (CDC §25, §37, §40, §41, §42)
   ========================================================== */

/**
 * Maintenance (CDC §25). Une intervention immobilise l'exemplaire
 * sur une periode : la meme contrainte d'exclusion que les locations
 * s'y applique, donc une machine en atelier ne peut pas etre louee.
 */
export const maintenanceRecords = pgTable(
  "maintenance_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    unitId: uuid("unit_id").notNull().references(() => equipmentUnits.id, { onDelete: "cascade" }),
    status: maintenanceStatusEnum("status").notNull().default("scheduled"),
    title: text("title").notNull(),
    description: text("description"),
    startDate: date("start_date", { mode: "string" }).notNull(),
    endDate: date("end_date", { mode: "string" }).notNull(),
    technicianId: uuid("technician_id").references(() => users.id, { onDelete: "set null" }),
    cost: bigint("cost", { mode: "number" }).notNull().default(0),
    hourMeter: integer("hour_meter"),
    nextServiceDue: date("next_service_due", { mode: "string" }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("maintenance_unit_idx").on(t.unitId),
    index("maintenance_status_idx").on(t.status),
  ],
);

/**
 * Documents (CDC §37, §47). Le fichier n'est jamais servi depuis un
 * dossier public : une route verifie les droits avant de le renvoyer.
 * entity_type / entity_id rattachent le document a son entite metier.
 */
export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: documentTypeEnum("type").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    fileName: text("file_name").notNull(),
    storagePath: text("storage_path").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    /** 0 = prive (defaut). Aucun document client n'est public par defaut. */
    isPublic: integer("is_public").notNull().default(0),
    uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("documents_entity_idx").on(t.entityType, t.entityId)],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    channel: notificationChannelEnum("channel").notNull().default("in_app"),
    /** Cle de gabarit, ex. rental.approved — le texte vit dans le code. */
    template: text("template").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    readAt: timestamp("read_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.readAt)],
);

/**
 * Journal d'activite (CDC §40, §95). Qui, quoi, quand, sur quelle
 * ressource, etat avant et apres. Ecrit dans la meme transaction que
 * l'operation qu'il decrit — sinon il ment.
 */
export const activityLogs = pgTable(
  "activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    /** Conserve meme si le compte est supprime plus tard. */
    actorLabel: text("actor_label"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    before: jsonb("before"),
    after: jsonb("after"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("activity_logs_entity_idx").on(t.entityType, t.entityId),
    index("activity_logs_actor_idx").on(t.actorId),
    index("activity_logs_created_idx").on(t.createdAt),
  ],
);

/**
 * Parametres (CDC §81, §92, §102). Les informations reelles de
 * l'entreprise — adresse, telephone, NINEA, zones desservies, TVA,
 * forfait de livraison — vivent ici, vides tant qu'elles ne sont pas
 * confirmees. Rien n'est invente dans le code.
 */
export const settings = pgTable(
  "settings",
  {
    key: text("key").primaryKey(),
    value: jsonb("value"),
    label: text("label").notNull(),
    description: text("description"),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("settings_key_key").on(t.key)],
);

export const maintenanceRecordsRelations = relations(maintenanceRecords, ({ one }) => ({
  unit: one(equipmentUnits, { fields: [maintenanceRecords.unitId], references: [equipmentUnits.id] }),
  technician: one(users, { fields: [maintenanceRecords.technicianId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));
