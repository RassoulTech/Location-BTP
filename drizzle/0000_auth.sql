-- ==========================================================
-- Etape 1 — comptes, roles, permissions, sessions, clients.
--
-- Ecrit a la main pour rester lisible et rejouable. Les
-- contraintes portent le sens metier : une adresse e-mail est
-- unique, un jeton de session est unique, une fiche client a
-- toujours un numero.
-- ==========================================================

CREATE TYPE "customer_type" AS ENUM ('company', 'individual');

CREATE TABLE "users" (
  "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"             text NOT NULL,
  "password_hash"     text NOT NULL,
  "first_name"        text NOT NULL,
  "last_name"         text NOT NULL,
  "phone"             text,
  "is_active"         boolean NOT NULL DEFAULT true,
  "email_verified_at" timestamptz,
  "last_login_at"     timestamptz,
  "created_at"        timestamptz NOT NULL DEFAULT now(),
  "updated_at"        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "users_email_chk" CHECK (position('@' in "email") > 1)
);
CREATE UNIQUE INDEX "users_email_key" ON "users" (lower("email"));

CREATE TABLE "roles" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug"        text NOT NULL,
  "name"        text NOT NULL,
  "description" text,
  "is_system"   boolean NOT NULL DEFAULT true,
  "created_at"  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "roles_slug_key" ON "roles" ("slug");

CREATE TABLE "permissions" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "slug"        text NOT NULL,
  "resource"    text NOT NULL,
  "action"      text NOT NULL,
  "description" text
);
CREATE UNIQUE INDEX "permissions_slug_key" ON "permissions" ("slug");

CREATE TABLE "user_roles" (
  "user_id"    uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "role_id"    uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  "granted_at" timestamptz NOT NULL DEFAULT now(),
  "granted_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  PRIMARY KEY ("user_id", "role_id")
);
CREATE INDEX "user_roles_role_idx" ON "user_roles" ("role_id");

CREATE TABLE "role_permissions" (
  "role_id"       uuid NOT NULL REFERENCES "roles"("id") ON DELETE CASCADE,
  "permission_id" uuid NOT NULL REFERENCES "permissions"("id") ON DELETE CASCADE,
  PRIMARY KEY ("role_id", "permission_id")
);

CREATE TABLE "sessions" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"    uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "ip_address" text,
  "user_agent" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions" ("token_hash");
CREATE INDEX "sessions_user_idx" ON "sessions" ("user_id");
CREATE INDEX "sessions_expiry_idx" ON "sessions" ("expires_at");

CREATE TABLE "customers" (
  "id"                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "reference"          text NOT NULL,
  "type"               "customer_type" NOT NULL DEFAULT 'company',
  "user_id"            uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "company_name"       text,
  "contact_first_name" text NOT NULL,
  "contact_last_name"  text NOT NULL,
  "email"              text,
  "phone"              text NOT NULL,
  "ninea"              text,
  "rccm"               text,
  "notes"              text,
  "created_at"         timestamptz NOT NULL DEFAULT now(),
  "updated_at"         timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX "customers_reference_key" ON "customers" ("reference");
CREATE INDEX "customers_user_idx" ON "customers" ("user_id");
CREATE INDEX "customers_email_idx" ON "customers" ("email");
