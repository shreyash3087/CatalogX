# CatalogX — Autonomous Agentic Commerce Platform

> **Razorpay AI Buildathon — Track 01: AI Growth & Agentic Commerce**  
> Making any merchant catalog natively discoverable and transacted by an AI buyer agent, with every money action **explainable, bounded, gated, and authenticated**.

---

## 🌟 What Is CatalogX?

CatalogX implements the **Agent-Readable Web** — a protocol layer that makes any merchant's product catalog natively discoverable, conversational, and purchasable by autonomous AI agents.

### 🔑 Core Capabilities
1. **Machine-Readable Discovery (`.well-known/agent-catalog`)**: Analogous to `robots.txt` and `.well-known/openid-configuration`, allows AI agents to inspect product catalogs, real-time inventory, spend contracts, and order endpoints without HTML scraping.
2. **Google Cloud OAuth 2.0 Authentication**: Seamless user verification with persistent delivery addresses & contact details required before executing orders.
3. **Razorpay TokenHQ / NPCI UAP Pre-Authorized Mandates**: 1-click e-mandates enabling zero-click autonomous micro-spends under ₹1,500.
4. **MongoDB Cloud Atlas Unified Persistence**: Real-time cloud synchronization for user profiles, chat session histories, orders ledger, payments, and e-mandates.
5. **Dual Merchant Network**: UrbanStride Footwear (Port 3001) and TechCart Electronics (Port 3002).

---

## 📐 System Architecture

```
                                  ┌───────────────────────────────┐
                                  │      Google OAuth 2.0         │
                                  │   (Identity & Fulfillment)    │
                                  └───────────────┬───────────────┘
                                                  │
                                                  ▼
Human: "Find running shoes under ₹3000" → [ CatalogX Buyer Agent ]
                                                  │
                ┌─────────────────────────────────┼─────────────────────────────────┐
                │                                 │                                 │
                ▼                                 ▼                                 ▼
   /.well-known/agent-catalog          POST /api/products/search            POST /api/orders
┌──────────────────────────────┐     ┌──────────────────────────────┐     ┌──────────────────────────────┐
│     Merchant Discovery       │     │   Semantic Product Search    │     │   Autonomous Razorpay Order  │
│   • Endpoints & Schemas      │     │   • Vector Embeddings        │     │   • Stock Gating Check       │
│   • Spending Policy & Limits │     │   • Real-Time Stock Status   │     │   • Fulfillment Contract     │
└──────────────────────────────┘     └──────────────────────────────┘     └──────────────┬───────────────┘
                                                                                         │
                                                  ┌──────────────────────────────────────┤
                                                  ▼                                      ▼
                                     ┌─────────────────────────┐            ┌─────────────────────────┐
                                     │  Razorpay Checkout/2FA  │            │  TokenHQ e-Mandate UAP  │
                                     │  (Orders > ₹1,500)      │            │  (Zero-Click ≤ ₹1,500)  │
                                     └────────────┬────────────┘            └────────────┬────────────┘
                                                  │                                      │
                                                  └──────────────────┬───────────────────┘
                                                                     │
                                                                     ▼
                                                  ┌─────────────────────────────────────┐
                                                  │      MongoDB Atlas Cloud DB         │
                                                  │   • users        • chat_sessions    │
                                                  │   • orders       • payments         │
                                                  │   • mandates                        │
                                                  └─────────────────────────────────────┘
```

---

## 🗄️ MongoDB Cloud Atlas Collections & Schema

All state is persisted to MongoDB Atlas cluster (`catalogx_db`):

| Collection | Description | Key Fields |
|---|---|---|
| `users` | Authenticated Google users & fulfillment profile | `email` (unique), `name`, `phone`, `avatar`, `delivery_address` (`street`, `city`, `state`, `postal_code`, `country`), `createdAt`, `updatedAt` |
| `chat_sessions` | Conversational threads & agent reasoning | `sessionId` (unique), `userEmail`, `title`, `messages`, `events`, `updatedAt` |
| `orders` | Merchant order ledger across all stores | `orderId` (unique), `merchantId`, `merchantName`, `productId`, `productName`, `amountInr`, `customer`, `shippingAddress`, `razorpayOrderId`, `razorpayPaymentId`, `status`, `gateTier` |
| `payments` | Razorpay payment records & signatures | `paymentId` (unique), `orderId`, `sessionId`, `amountInr`, `status`, `verified`, `createdAt` |
| `mandates` | TokenHQ cryptographic pre-authorized mandates | `mandateToken` (unique), `userEmail`, `maxLimitInr`, `status` (`ACTIVE`/`REVOKED`), `authPaymentId`, `expiresAt` |

---

## 🛡️ Tiered Spend Gating

Every money action is **explainable, bounded, and gated**:

| Tier | Condition | Action |
|---|---|---|
| 🟢 **AUTO** | Amount ≤ ₹1,500 (with active e-Mandate) | Autonomous 1-click zero-touch purchase |
| 🟡 **NOTIFY** | ₹1,500 < Amount ≤ ₹3,000 | Razorpay 2FA Checkout with human approval |
| 🟠 **CONFIRM** | ₹3,000 < Amount ≤ ₹5,000 | Strict 2FA verification & confirmation |
| 🔴 **REJECT** | Amount > ₹5,000 | Refuses execution (exceeds spend ceiling) |

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+
- Razorpay Test Account credentials in `.env`
- Azure OpenAI deployment in `.env`
- MongoDB Atlas Connection in `.env`

### 1. Environment Configuration (`.env`)
```env
# Azure OpenAI
AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_ENDPOINT=your_endpoint
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-5.4-nano
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-small

# Razorpay Test Mode
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx

# MongoDB Cloud Atlas
MONGODB_URI=mongodb+srv://shreyash3087_db_user:NOMnwQ33KaQriDfx@cluster0.u43ndu4.mongodb.net/?appName=Cluster0
MONGODB_DB_NAME=catalogx_db

# Spend Policy
AUTO_APPROVE_THRESHOLD=150000
NOTIFY_THRESHOLD=300000
CONFIRM_THRESHOLD=500000
```

### 2. Start Merchant Storefronts

**UrbanStride Footwear (Port 3001):**
```powershell
cd merchant-server
$env:PORT=3001; $env:DB_NAME="urbanstride.db"; $env:MERCHANT_CATEGORY="footwear"; $env:MERCHANT_NAME="UrbanStride Footwear"; $env:MERCHANT_ID="merchant_urbanstride_001"; node src/index.js
```

**TechCart Electronics (Port 3002):**
```powershell
cd merchant-server
$env:PORT=3002; $env:DB_NAME="techcart.db"; $env:MERCHANT_CATEGORY="electronics"; $env:MERCHANT_NAME="TechCart Electronics"; $env:MERCHANT_ID="merchant_techcart_002"; node src/index.js
```

### 3. Start Next.js Agent Dashboard
```powershell
cd dashboard
npm run dev
# Open http://localhost:3000
```

---

## 💻 Tech Stack Summary

- **Frontend / Dashboard**: Next.js 15, React 19, TailwindCSS, Custom Glassmorphism UI, Responsive Light/Dark Modes.
- **Backend / Merchant Server**: Node.js, Express, WebSockets (`ws`), SQLite (local catalog cache), MongoDB Atlas (cloud persistence).
- **Authentication**: Google Identity Services (GSI) OAuth 2.0 with JWT verification.
- **Payments**: Razorpay API, Razorpay Checkout SDK, HMAC-SHA256 Signature Verification, TokenHQ e-Mandate Vault.
- **AI / LLMs**: Azure OpenAI GPT-5.4-nano + text-embedding-3-small embeddings.

---

## 🏆 Buildathon Requirements Checklist

- ✅ **Explainable**: Every search, product selection, and payment decision logged with reasoning.
- ✅ **Bounded**: Tiered gating enforces budget ceilings.
- ✅ **Gated**: Zero-click auto-pay strictly limited to ₹1,500 under e-mandate.
- ✅ **Authenticated**: Real Google OAuth 2.0 with verified fulfillment address gating.
- ✅ **Persisted**: MongoDB Atlas stores users, chat sessions, orders, and payments.
- ✅ **Dual Merchants**: Multiple independent stores integrated with the same unified buyer agent.
