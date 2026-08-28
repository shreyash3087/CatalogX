# CatalogX — Agentic Commerce Platform

> **Razorpay AI Buildathon — Track 01: AI Growth & Agentic Commerce**
> Make a merchant transactable by an AI buyer, end to end.

## What Is CatalogX?

CatalogX implements the **agent-readable web** — a protocol layer that makes any merchant's product catalog natively discoverable and purchasable by autonomous AI agents, with every money action **explainable, bounded, and gated**.

### Key Innovation: `.well-known/agent-catalog`

Analogous to `robots.txt` and `.well-known/openid-configuration`, this endpoint is a machine-readable manifest that any buyer agent can discover to understand a merchant's catalog and purchase endpoints — without scraping HTML.

## Architecture

```
Human: "Buy me running shoes, size 9, under ₹3000"
         │
         ▼
┌─────────────────┐    /.well-known/agent-catalog    ┌───────────────────┐
│  Buyer Agent    │ ──────────────────────────────→  │  Merchant Server  │
│  (CatalogX)     │ ←── Products, Prices, Stock ───  │  (UrbanStride)    │
│                 │                                   │                   │
│  1. Parse NL    │    POST /api/products/search      │  • 25 products    │
│  2. Discover    │ ──────────────────────────────→  │  • Razorpay API   │
│  3. Search      │ ←── Ranked results (semantic) ─  │  • WebSocket feed │
│  4. Select      │                                   └───────────────────┘
│  5. Gate check  │    POST /api/orders                        │
│  6. Order       │ ──────────────────────────────→           │
│  7. Pay         │    POST /api/payments/simulate             │
│  8. Verify      │ ──────────────────────────────→           │ (broadcasts)
│  9. Report      │                                            ▼
└─────────────────┘                                  ┌───────────────────┐
                                                     │  Dashboard        │
                                                     │  (Next.js)        │
                                                     │  Real-time audit  │
                                                     │  Gate indicator   │
                                                     │  Payment flow     │
                                                     └───────────────────┘
```

## Tiered Gating System

Every money action is **explainable, bounded, and gated**:

| Tier | Condition | Action |
|------|-----------|--------|
| 🟢 **AUTO** | Amount ≤ ₹1,500 | Proceeds silently |
| 🟡 **NOTIFY** | ₹1,500 < Amount ≤ ₹3,000 | Notifies human, waits 5s |
| 🟠 **CONFIRM** | ₹3,000 < Amount ≤ ₹5,000 | Blocks until human types "yes" |
| 🔴 **REJECT** | Amount > ₹5,000 | Refuses purchase entirely |

## Quick Start

### Prerequisites
- Node.js 18+
- Razorpay test account (keys already in `.env`)
- Azure OpenAI access (keys already in `.env`)

### 1. Install Dependencies
```bash
# From project root
cd merchant-server && npm install
cd ../buyer-agent && npm install
cd ../dashboard && npm install
cd ../llm && npm install
```

### 2. Start the Merchant Server
```bash
cd merchant-server
$env:PORT=3001; $env:DB_NAME="urbanstride.db"; $env:MERCHANT_CATEGORY="footwear"; $env:MERCHANT_NAME="UrbanStride Footwear"; $env:MERCHANT_ID="merchant_urbanstride_001"; node src/index.js

cd merchant-server
$env:PORT=3002; $env:DB_NAME="techcart.db"; $env:MERCHANT_CATEGORY="electronics"; $env:MERCHANT_NAME="TechCart Electronics"; $env:MERCHANT_ID="merchant_techcart_002"; node src/index.js
```

### 3. Start the Dashboard
```bash
cd dashboard
npm run dev
# → http://localhost:3000
```

### 4. Run the Buyer Agent
```bash
cd buyer-agent
node src/index.js "Buy me running shoes, size 9, under ₹3000"
```

Or interactive mode:
```bash
node src/index.js
```

## Demo Scenarios

### Happy Path (Auto-approved)
```bash
node src/index.js "Buy me running shoes, size 9, under ₹3000"
# → Finds Nike Revolution 6 at ₹2,499
# → Gate: AUTO (within ₹3,000 budget)
# → Completes purchase automatically
```

### Notify Gate
```bash
node src/index.js "Buy me Skechers GO RUN shoes size 8 under ₹3000"
# → Finds match around ₹2,500
# → Gate: NOTIFY — alerts you and proceeds after 5s
```

### Stock-out Recovery
```bash
node src/index.js "Buy ASICS Gel-Nimbus 25, size 9"
# → ASICS Gel-Nimbus is out of stock (intentional!)
# → Agent detects stock-out, finds fallback
# → Reports: "Fallback to Brooks Ghost 15"
```

### Confirm Gate (over budget)
```bash
node src/index.js "Buy me Nike Air Force 1, size 9"
# → Nike AF1 is ₹7,999
# → Gate: CONFIRM — prompts you to type "yes"
```

## Project Structure

```
AI Builder/
├── .env                          # Shared credentials (not committed)
├── .gitignore
├── package.json                  # npm workspace root
│
├── llm/                          # 🧠 LLM abstraction layer
│   └── index.js                  # chat(), embed(), cosineSimilarity()
│                                 # Easy provider swap: Azure OpenAI → Gemini → etc.
│
├── merchant-server/              # 🏪 Merchant catalog server
│   └── src/
│       ├── index.js              # Express entry point
│       ├── db/
│       │   ├── schema.sql        # SQLite schema
│       │   ├── init.js           # DB initializer
│       │   └── seed.js           # 25 footwear products
│       ├── routes/
│       │   ├── discovery.js      # GET /.well-known/agent-catalog ← core protocol
│       │   ├── products.js       # Semantic search, stock check
│       │   ├── orders.js         # Razorpay order creation
│       │   └── payments.js       # Verify, simulate, webhook
│       └── services/
│           └── auditBroadcast.js # WebSocket real-time feed
│
├── buyer-agent/                  # 🤖 Autonomous buyer agent
│   └── src/
│       ├── index.js              # CLI entry point
│       ├── agent/
│       │   ├── core.js           # 9-phase purchase orchestrator
│       │   ├── constraints.js    # NL → structured constraints (LLM)
│       │   ├── gating.js         # Tiered spend gate
│       │   └── recovery.js       # Stock-out fallback, payment retry
│       └── audit/
│           ├── logger.js         # Structured JSON audit logger
│           └── reporter.js       # Terminal purchase report
│
└── dashboard/                    # 📊 Real-time audit dashboard (Next.js)
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx              # Main dashboard (4-tab layout)
    │   └── globals.css           # Premium dark glassmorphism theme
    ├── components/
    │   ├── EventFeed.tsx         # Live scrolling event list
    │   ├── EventDetail.tsx       # Click-to-inspect event details
    │   ├── GatingIndicator.tsx   # Visual spend gate gauge
    │   ├── PaymentFlow.tsx       # Razorpay step tracker
    │   └── StatsBar.tsx          # KPI cards
    ├── hooks/
    │   └── useAgentFeed.ts       # WebSocket with auto-reconnect
    └── lib/
        └── eventUtils.ts         # Event metadata, formatters, stats
```

## API Reference

### Agent Catalog Discovery
```
GET /.well-known/agent-catalog
```
Returns merchant manifest with catalog stats, all endpoint schemas, and agent instructions.

### Product Search
```
POST /api/products/search
{
  "query": "running shoes lightweight",
  "filters": {
    "category": "running-shoes",
    "max_price_paise": 300000,
    "size": "9",
    "in_stock_only": true
  },
  "limit": 10
}
```

### Create Order
```
POST /api/orders
{
  "product_id": "prod_001",
  "size": "9",
  "buyer_agent_id": "agent_catalogx_buyer",
  "session_id": "sess_abc123",
  "human_instruction": "Buy me running shoes under ₹3000"
}
```

### Simulate Payment (Test Mode)
```
POST /api/payments/simulate
{
  "razorpay_order_id": "order_xxx"
}
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Merchant Server | Node.js + Express |
| Database | SQLite (better-sqlite3) |
| Payments | Razorpay (test mode) |
| LLM | Azure OpenAI GPT-5.4-nano |
| Embeddings | Azure text-embedding-3-small |
| Dashboard | Next.js 15 + React 19 |
| Real-time | WebSockets (ws) |

## Razorpay Integration

Uses **Razorpay Orders API** + **Payment Verification** (HMAC-SHA256):

1. `POST /v1/orders` — Create order with amount in paise
2. `POST /api/payments/simulate` — Test-mode payment (server-side, no browser needed)
3. Signature verification: `HMAC-SHA256(order_id|payment_id, key_secret)`

Test credentials: `rzp_test_TSjdfOWmYoGtxa`

## The Bar (Buildathon Requirements)

✅ **Explainable** — Every agent decision logged with reasoning  
✅ **Bounded** — Tiered gating enforces budget constraints  
✅ **Gated** — Auto/Notify/Confirm/Reject tiers  
✅ **Audit trail** — Real-time dashboard + JSON log files  
✅ **Failure handled gracefully** — Stock-out recovery + payment retry
