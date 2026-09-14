import {
  bigint, index, integer, pgTable, text, timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { deliveryModeEnum, orderStatusEnum, stockMovementTypeEnum } from "./enums";
import { customers, addresses } from "./customers";
import { equipmentTypes } from "./equipment";
import { users } from "./auth";

/* ==========================================================
   Vente (CDC §26 a §30)

   products couvre les consommables et pieces vendus a l'unite.
   Une machine vendue reste un equipment_type : la ligne de commande
   pointe alors vers type_id plutot que product_id — exactement un
   des deux est renseigne (contrainte CHECK en migration).
   ========================================================== */

export const products = pgTable(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    unitPrice: bigint("unit_price", { mode: "number" }).notNull(),
    /* --- Stock (CDC §28) --- */
    quantityOnHand: integer("quantity_on_hand").notNull().default(0),
    quantityReserved: integer("quantity_reserved").notNull().default(0),
    reorderThreshold: integer("reorder_threshold").notNull().default(0),
    isPublished: integer("is_published").notNull().default(0),
    primaryImagePath: text("primary_image_path"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("products_sku_key").on(t.sku)],
);

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull(),
    customerId: uuid("customer_id").notNull().references(() => customers.id, { onDelete: "restrict" }),
    status: orderStatusEnum("status").notNull().default("pending"),

    deliveryMode: deliveryModeEnum("delivery_mode").notNull().default("pickup"),
    deliveryAddressId: uuid("delivery_address_id").references(() => addresses.id, { onDelete: "set null" }),

    subtotalAmount: bigint("subtotal_amount", { mode: "number" }).notNull().default(0),
    discountAmount: bigint("discount_amount", { mode: "number" }).notNull().default(0),
    deliveryAmount: bigint("delivery_amount", { mode: "number" }).notNull().default(0),
    taxAmount: bigint("tax_amount", { mode: "number" }).notNull().default(0),
    totalAmount: bigint("total_amount", { mode: "number" }).notNull().default(0),

    customerNote: text("customer_note"),
    internalNote: text("internal_note"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelledBy: uuid("cancelled_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("orders_reference_key").on(t.reference),
    index("orders_customer_idx").on(t.customerId),
    index("orders_status_idx").on(t.status),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
    /** Exactement un des deux est renseigne (CHECK order_items_target_chk). */
    productId: uuid("product_id").references(() => products.id, { onDelete: "restrict" }),
    typeId: uuid("type_id").references(() => equipmentTypes.id, { onDelete: "restrict" }),
    /** Libelle fige au moment de la commande, meme si le catalogue change. */
    label: text("label").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: bigint("unit_price", { mode: "number" }).notNull(),
    lineAmount: bigint("line_amount", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("order_items_order_idx").on(t.orderId),
    index("order_items_product_idx").on(t.productId),
  ],
);

/** Journal des mouvements de stock (CDC §29). Rien ne modifie un stock sans y ecrire. */
export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
    type: stockMovementTypeEnum("type").notNull(),
    /** Positif = entree, negatif = sortie. */
    quantityDelta: integer("quantity_delta").notNull(),
    quantityAfter: integer("quantity_after").notNull(),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    performedBy: uuid("performed_by").references(() => users.id, { onDelete: "set null" }),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("stock_movements_product_idx").on(t.productId),
    index("stock_movements_order_idx").on(t.orderId),
  ],
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
  type: one(equipmentTypes, { fields: [orderItems.typeId], references: [equipmentTypes.id] }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  movements: many(stockMovements),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  product: one(products, { fields: [stockMovements.productId], references: [products.id] }),
  order: one(orders, { fields: [stockMovements.orderId], references: [orders.id] }),
}));
