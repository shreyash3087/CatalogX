# UrbanStride Footwear Merchant Node (`urbanstride`)

**UrbanStride Footwear** is a reference footwear merchant application implementing the **Open Agentic Commerce Protocol (ACP/UAP)** on **Next.js 16** and **MongoDB Atlas**.

---

## Significance & Capabilities

- **Agent-Readable Catalog Manifest (`/.well-known/agent-catalog`)**: Exposes machine-readable metadata about capabilities, UK/India sizing standard, brand warranty, and return policies.
- **Product-Driven Option Schema**: Declares product-level `required_options` (UK sizes 6–12) and dynamic bundle `offers` (anti-blister performance socks, cleaning kits).
- **Semantic Product Search (`/api/products/search`)**: Supports natural-language keyword matching, numerical budget constraints (`max_price_paise`), and real-time inventory checks.
- **Razorpay Order Creation (`/api/orders`)**: Integrates with the official Razorpay SDK (`razorpay.orders.create`) to generate orders and bind customer shipping details to order metadata.
- **Human Storefront & Admin Portal**: Modern customer-facing shoe store (`/`, `/product/[id]`) and merchant admin dashboard (`/admin`) for tracking agent discovery metrics and orders.

---

## Directory Structure

```text
urbanstride/
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
│   └── page.tsx               # Storefront landing page & hero showcase
├── lib/
│   ├── db.ts                  # MongoDB Atlas connection manager (urbanstride_db)
│   └── products.ts            # Footwear inventory, required_options, and offers
└── next.config.mjs            # Next.js configuration with open CORS headers
```

---

## Port & Database

- **Port**: `3001`
- **Database**: `urbanstride_db` in MongoDB Atlas
- **Run Standalone**: `npm run dev --workspace=urbanstride`
