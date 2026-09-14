import { config } from "dotenv";
config({ path: ".env.local" });
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL manquant. Copiez .env.example vers .env.local et renseignez-le.");
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
  verbose: true,
  strict: true,
});
