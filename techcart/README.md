# TechCart Electronics Merchant Node (`techcart`)

**TechCart Electronics** is a reference electronics merchant application demonstrating multi-merchant federation under the **Open Agentic Commerce Protocol (ACP/UAP)** on **Next.js 16** and **MongoDB Atlas**.

---

## Significance & Capabilities

- **Federated Merchant Node**: Demonstrates that the CatalogX Buyer Agent can dynamically route queries to different merchants based on category and query keywords.
- **Zero-Sizing Product Workflow**: Illustrates products that require **no sizing options** (e.g. headphones, mechanical keyboards, smartwatches), verifying that the agent asks zero unnecessary questions.
- **Dynamic Cross-Sell Bundles**: Features product-specific add-ons (e.g. hard-shell cases for headphones, coiled aviator cables for mechanical keyboards, milanese straps for smartwatches).
- **Agent-Readable Catalog Manifest (`/.well-known/agent-catalog`)**: Declares electronics specifications, 1-year brand warranty guarantees, and Razorpay API contracts.
- **Storefront & Admin Analytics**: Consumer electronics web store (`/`, `/product/[id]`) and merchant admin panel (`/admin`).

---

## Directory Structure

```text
techcart/
├── app/
│   ├── .well-known/
│   │   └── agent-catalog/     # Machine-readable merchant catalog manifest
│   ├── api/
│   │   ├── admin/             # Analytics & inventory update APIs
│   │   ├── orders/            # Razorpay order generation & persistence
│   │   ├── payments/          # Payment simulation & HMAC verification
│   │   └── products/          # Search & stock check endpoints
│   ├── admin/page.tsx         # Merchant Admin Dashboard (Agent analytics & orders)
│   ├── product/[id]/page.tsx  # Product detail & human checkout page
│   └── page.tsx               # Storefront landing page & tech grid
├── lib/
│   ├── db.ts                  # MongoDB Atlas connection manager (techcart_db)
│   └── products.ts            # Electronics inventory, required_options, and offers
└── next.config.mjs            # Next.js configuration with open CORS headers
```

---

## Port & Database

- **Port**: `3002`
- **Database**: `techcart_db` in MongoDB Atlas
- **Run Standalone**: `npm run dev --workspace=techcart`
