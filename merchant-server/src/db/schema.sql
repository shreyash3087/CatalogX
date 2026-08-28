-- CatalogX Merchant Server — SQLite Schema
-- Products table
CREATE TABLE IF NOT EXISTS products (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  category      TEXT NOT NULL,
  brand         TEXT NOT NULL,
  price_paise   INTEGER NOT NULL,       -- price in paise (₹1 = 100 paise)
  sizes         TEXT NOT NULL,          -- JSON array: ["6","7","8","9","10","11"]
  colors        TEXT NOT NULL,          -- JSON array: ["black","white","red"]
  stock         INTEGER NOT NULL DEFAULT 10,
  image_url     TEXT,
  tags          TEXT NOT NULL DEFAULT '[]', -- JSON array
  embedding     BLOB,                    -- Float32Array stored as BLOB for semantic search
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id                TEXT PRIMARY KEY,
  razorpay_order_id TEXT UNIQUE,
  product_id        TEXT NOT NULL,
  product_name      TEXT NOT NULL,
  quantity          INTEGER NOT NULL DEFAULT 1,
  size              TEXT,
  color             TEXT,
  amount_paise      INTEGER NOT NULL,
  status            TEXT NOT NULL DEFAULT 'created',
    -- created | attempted | paid | failed | cancelled
  buyer_agent_id    TEXT,
  session_id        TEXT,
  human_instruction TEXT,
  customer_name     TEXT,
  customer_email    TEXT,
  customer_phone    TEXT,
  shipping_street   TEXT,
  shipping_city     TEXT,
  shipping_state    TEXT,
  shipping_postal_code TEXT,
  shipping_country  TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature  TEXT,
  failure_reason    TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Audit log — every agent action recorded here
CREATE TABLE IF NOT EXISTS audit_log (
  id            TEXT PRIMARY KEY,
  session_id    TEXT NOT NULL,
  step          INTEGER NOT NULL,
  action        TEXT NOT NULL,
  -- e.g. CATALOG_DISCOVERED, SEARCH_EXECUTED, PRODUCT_SELECTED,
  --      GATE_CHECKED, ORDER_CREATED, PAYMENT_INITIATED,
  --      PAYMENT_VERIFIED, PAYMENT_FAILED, STOCK_OUT, FALLBACK_TRIGGERED
  input_data    TEXT,                   -- JSON string
  output_data   TEXT,                   -- JSON string
  reasoning     TEXT,                   -- Human-readable explanation of the decision
  duration_ms   INTEGER,
  merchant_id   TEXT,
  agent_id      TEXT,
  timestamp     TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Mandates table — NPCI UAP / Razorpay TokenHQ pre-authorized mandates
CREATE TABLE IF NOT EXISTS mandates (
  id                  TEXT PRIMARY KEY,
  mandate_token       TEXT UNIQUE NOT NULL,
  status              TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | REVOKED | EXPIRED
  auth_payment_id     TEXT,
  auth_order_id       TEXT,
  max_limit_paise     INTEGER NOT NULL DEFAULT 150000, -- ₹1,500 default
  protocol            TEXT NOT NULL DEFAULT 'NPCI_UAP_V1',
  customer_id         TEXT DEFAULT 'cust_catalogx_owner',
  created_at          TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at          TEXT NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_rp_id      ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_audit_session     ON audit_log(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp   ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_mandates_token    ON mandates(mandate_token);
