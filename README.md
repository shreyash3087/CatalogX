# CatalogX — Autonomous Agentic Commerce Platform

> **Razorpay AI Buildathon — Track 01: AI Growth & Agentic Commerce**  
> Making any merchant catalog natively discoverable and transacted by an AI buyer agent, with every money action **explainable, bounded, gated, and authenticated**.

---

## 🌟 What Is CatalogX?

CatalogX implements the **Agent-Readable Web** — an ecosystem of three standalone Next.js applications and dedicated MongoDB databases where AI buyer agents autonomously discover merchant catalogs, evaluate stock & constraints, and execute zero-click or 2FA purchases via Razorpay.

---

## 📐 3-Application Ecosystem Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Google Cloud Console OAuth 2.0                          │
│                (Client ID: 69996615501-m4eclgq75cl1qd0q6kqckspg7q066epg)                │
│                         Authorized Origins: 3000, 3001, 3002                            │
└───────────────────┬─────────────────────────────────┬───────────────────────────────────┘
                    │                                 │                                   │
                    ▼                                 ▼                                   ▼
┌───────────────────────────────────────┐ ┌───────────────────────────────────────┐ ┌───────────────────────────────────────┐
│     App 1: CatalogX Platform          │ │    App 2: UrbanStride Footwear        │ │     App 3: TechCart Electronics       │
│           (Next.js App)               │ │           (Next.js App)               │ │           (Next.js App)               │
│         http://localhost:3000         │ │         http://localhost:3001         │ │         http://localhost:3002         │
├───────────────────────────────────────┤ ├───────────────────────────────────────┤ ├───────────────────────────────────────┤
│ • / (Chat & Autonomous Checkout)      │ │ • / (Footwear Storefront)             │ │ • / (Electronics Storefront)          │
│ • /orders (Consumer Orders Ledger)    │ │ • /products (Footwear Catalog)        │ │ • /products (Electronics Catalog)     │
│ • /settings (Google Auth & TokenHQ)   │ │ • /product/[id] (Product Details)     │ │ • /product/[id] (Product Details)     │
│                                       │ │ • /admin (Merchant Admin Dashboard)   │ │ • /admin (Merchant Admin Dashboard)   │
│ • API: /api/agent/run, /api/mandates  │ │ • API: /.well-known/agent-catalog     │ │ • API: /.well-known/agent-catalog     │
│ • API: /api/users/profile, /sessions  │ │ • API: /api/products/search, /orders  │ │ • API: /api/products/search, /orders  │
├───────────────────────────────────────┤ ├───────────────────────────────────────┤ ├───────────────────────────────────────┤
│ Database: catalogx_db                 │ │ Database: urbanstride_db              │ │ Database: techcart_db                 │
│ • users (profiles & shipping)         │ │ • orders (UrbanStride orders ledger)  │ │ • orders (TechCart orders ledger)     │
│ • chat_sessions (transcripts)         │ │ • analytics (agent usage counters)    │ │ • analytics (agent usage counters)    │
│ • mandates (TokenHQ vault)            │ │ • inventory (live shoe stocks)        │ │ • inventory (live electronics stocks) │
└───────────────────────────────────────┘ └───────────────────────────────────────┘ └───────────────────────────────────────┘
```

---

## 🗄️ Multi-Database Separation Topology

Each application maintains **complete data isolation**:

| Database | Application | Collections | Access Rules |
|---|---|---|---|
| **`catalogx_db`** | CatalogX Platform (Port 3000) | `users`, `chat_sessions`, `mandates` | Buyer-side data; personal shipping profiles & TokenHQ e-mandates. |
| **`urbanstride_db`** | UrbanStride Footwear (Port 3001) | `orders`, `analytics`, `inventory` | Merchant 1 data; autonomous footwear orders, stock, and agent discovery metrics. |
| **`techcart_db`** | TechCart Electronics (Port 3002) | `orders`, `analytics`, `inventory` | Merchant 2 data; autonomous electronics orders, stock, and agent discovery metrics. |

---

## 🔒 Merchant Admin Dashboards (`/admin`)

Both merchants provide real-time command centers at `/admin` secured by **Google OAuth 2.0 with Root Admin Authorization**:

- **UrbanStride Admin**: `http://localhost:3001/admin`
- **TechCart Admin**: `http://localhost:3002/admin`
- **Root Admin Access**: Restricted to authorized administrator accounts (`shreyash3087@gmail.com`).
- **Live Capabilities**:
  - 📊 **Agentic Activity Pulse**: Real-time ticker of AI buyer agent hits (`/.well-known/agent-catalog`), vector searches, and order conversions.
  - 💰 **Gross Agent Revenue**: Track total revenue generated headlessly via CatalogX AI buyer agents.
  - 📦 **Live Orders Ledger**: Inspect customer contact numbers, delivery addresses, and Razorpay Payment IDs.
  - 🏷️ **Inventory Controls**: Live stock monitor with 1-click restock (+10) and stockout (0) overrides.

---

## 🚀 Quickstart & Startup Commands

### Start All 3 Applications in Parallel:
```bash
npm run dev
```

### Or Start Applications Individually:
```bash
# 1. CatalogX Buyer Agent Platform (Port 3000)
npm run dev:catalogx

# 2. UrbanStride Footwear Storefront & Admin (Port 3001)
npm run dev:urbanstride

# 3. TechCart Electronics Storefront & Admin (Port 3002)
npm run dev:techcart
```

---

## 🛡️ Tiered Spend Gating

Every money action is **explainable, bounded, and gated**:

| Tier | Condition | Action |
|---|---|---|
| **Tier 1: AUTO** | Amount ≤ ₹1,500 + Active Mandate | Autonomous Zero-Click Payment via Razorpay TokenHQ e-mandate. |
| **Tier 2: NOTIFY** | ₹1,500 < Amount ≤ ₹3,000 | Agent prepares order; user confirms with 1-click in chat. |
| **Tier 3: CONFIRM** | Amount > ₹3,000 | Explicit 2FA authorization required with complete item & address breakdown. |
| **Tier 4: REJECT** | Amount > ₹10,000 or Budget Exceeded | Transaction blocked; alternatives suggested. |

---

## 👥 Contributors

- **Team**: CatalogX (Razorpay AI Buildathon 2026)
