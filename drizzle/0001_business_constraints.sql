-- ==========================================================
-- Contraintes metier que drizzle-kit ne sait pas exprimer.
-- Migration ecrite a la main, versionnee, rejouable.
--
-- 1. Extension btree_gist
-- 2. Contrainte d'exclusion anti-double-reservation
-- 3. Triggers qui alimentent le registre d'occupation
-- 4. Contraintes CHECK metier
--
-- NE PAS SUPPRIMER lors d'une regeneration drizzle-kit.
-- ==========================================================

--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS btree_gist;

--> statement-breakpoint
-- ----------------------------------------------------------
-- 1. Anti-double-reservation (CDC §17, §18, §25, §78)
--    Deux periodes ne peuvent pas se chevaucher sur la meme unite.
--    Garanti par PostgreSQL, pas par du code applicatif : aucune
--    course entre requetes simultanees ne peut passer au travers.
-- ----------------------------------------------------------
ALTER TABLE "unit_occupancies"
  DROP CONSTRAINT IF EXISTS "unit_occupancies_no_overlap";

--> statement-breakpoint
ALTER TABLE "unit_occupancies"
  ADD CONSTRAINT "unit_occupancies_no_overlap"
  EXCLUDE USING gist ("unit_id" WITH =, "period" WITH &&);

--> statement-breakpoint
-- ----------------------------------------------------------
-- 2. Alimentation automatique depuis rental_items
--    Statuts occupants : reserved, confirmed, active.
--    Tout autre statut (returned, cancelled) libere l'unite.
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_occupancy_from_rental_item()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    DELETE FROM unit_occupancies
      WHERE source_table = 'rental_items' AND source_id = OLD.id;
    RETURN OLD;
  END IF;

  IF (NEW.unit_id IS NOT NULL
      AND NEW.status IN ('reserved', 'confirmed', 'active')) THEN
    INSERT INTO unit_occupancies (unit_id, source_table, source_id, period)
      VALUES (NEW.unit_id, 'rental_items', NEW.id,
              daterange(NEW.start_date, NEW.end_date, '[]'))
      ON CONFLICT (source_table, source_id)
      DO UPDATE SET unit_id = EXCLUDED.unit_id, period = EXCLUDED.period;
  ELSE
    DELETE FROM unit_occupancies
      WHERE source_table = 'rental_items' AND source_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_rental_item_occupancy ON "rental_items";

--> statement-breakpoint
CREATE TRIGGER trg_rental_item_occupancy
  AFTER INSERT OR UPDATE OR DELETE ON "rental_items"
  FOR EACH ROW EXECUTE FUNCTION sync_occupancy_from_rental_item();

--> statement-breakpoint
-- ----------------------------------------------------------
-- 3. Alimentation automatique depuis maintenance_records
--    Une machine programmee ou en cours d'intervention occupe
--    son creneau : elle ne peut donc pas etre louee dessus.
-- ----------------------------------------------------------
CREATE OR REPLACE FUNCTION sync_occupancy_from_maintenance()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    DELETE FROM unit_occupancies
      WHERE source_table = 'maintenance_records' AND source_id = OLD.id;
    RETURN OLD;
  END IF;

  IF (NEW.status IN ('scheduled', 'in_progress')) THEN
    INSERT INTO unit_occupancies (unit_id, source_table, source_id, period)
      VALUES (NEW.unit_id, 'maintenance_records', NEW.id,
              daterange(NEW.start_date, NEW.end_date, '[]'))
      ON CONFLICT (source_table, source_id)
      DO UPDATE SET unit_id = EXCLUDED.unit_id, period = EXCLUDED.period;
  ELSE
    DELETE FROM unit_occupancies
      WHERE source_table = 'maintenance_records' AND source_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_maintenance_occupancy ON "maintenance_records";

--> statement-breakpoint
CREATE TRIGGER trg_maintenance_occupancy
  AFTER INSERT OR UPDATE OR DELETE ON "maintenance_records"
  FOR EACH ROW EXECUTE FUNCTION sync_occupancy_from_maintenance();

--> statement-breakpoint
-- ----------------------------------------------------------
-- 4. Contraintes CHECK metier (CDC §33)
-- ----------------------------------------------------------
ALTER TABLE "rentals"
  ADD CONSTRAINT "rentals_dates_chk" CHECK ("end_date" >= "start_date");

--> statement-breakpoint
ALTER TABLE "rental_items"
  ADD CONSTRAINT "rental_items_dates_chk" CHECK ("end_date" >= "start_date");

--> statement-breakpoint
ALTER TABLE "rental_items"
  ADD CONSTRAINT "rental_items_units_chk" CHECK ("billed_units" > 0);

--> statement-breakpoint
ALTER TABLE "maintenance_records"
  ADD CONSTRAINT "maintenance_dates_chk" CHECK ("end_date" >= "start_date");

--> statement-breakpoint
-- Une ligne de commande vise un produit OU un type de machine, jamais les deux.
ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_target_chk"
  CHECK (("product_id" IS NOT NULL)::int + ("type_id" IS NOT NULL)::int = 1);

--> statement-breakpoint
ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_quantity_chk" CHECK ("quantity" > 0);

--> statement-breakpoint
-- Un paiement se rattache a une location OU a une commande, jamais aux deux.
ALTER TABLE "payments"
  ADD CONSTRAINT "payments_target_chk"
  CHECK (("rental_id" IS NOT NULL)::int + ("order_id" IS NOT NULL)::int = 1);

--> statement-breakpoint
ALTER TABLE "payments"
  ADD CONSTRAINT "payments_amount_chk" CHECK ("amount" > 0);

--> statement-breakpoint
-- Le stock physique et le stock reserve ne peuvent pas devenir negatifs (CDC §28).
ALTER TABLE "products"
  ADD CONSTRAINT "products_stock_chk"
  CHECK ("quantity_on_hand" >= 0 AND "quantity_reserved" >= 0);

--> statement-breakpoint
ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_paid_chk" CHECK ("paid_amount" >= 0);
