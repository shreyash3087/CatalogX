# CatalogX: Open Agentic Commerce Protocol (ACP/UAP)

> **Razorpay AI Buildathon — Track 01: AI Growth & Agentic Commerce**  
> *Grow the merchant’s revenue, and make them sellable to AI buyers end-to-end.*

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?logo=next.js)](https://nextjs.org/)
[![Razorpay](https://img.shields.io/badge/Razorpay-Payment%20Rails-blue?logo=razorpay)](https://razorpay.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB%20Atlas-Multi--Tenant-green?logo=mongodb)](https://www.mongodb.com/atlas)
[![Protocol](https://img.shields.io/badge/Protocol-UAP%20%2F%20ACP%20%2F%20x402-orange)](#)

---

## 🚀 Live Demo

| App | Description | Production URL |
|-----|-------------|----------------|
| **CatalogX Dashboard** | Autonomous Buyer Agent UI + Audit Feed + Mandates | [catalogx-dashboard.vercel.app](https://catalogx-dashboard.vercel.app) |
| **UrbanStride Footwear** | Merchant Storefront #1 — Federated catalog & checkout | [urbanstride.vercel.app](https://urbanstride.vercel.app) |
| **TechCart Electronics** | Merchant Storefront #2 — Federated catalog & checkout | [techcart-xi.vercel.app](https://techcart-xi.vercel.app) |

---

## Executive Overview

**CatalogX** is an autonomous e-commerce infrastructure that enables **any merchant** to become instantly transactable by AI buyer agents. Built on top of **Razorpay payment APIs**, CatalogX implements the open **Agent Commerce Protocol (ACP/UAP)** to provide machine-readable catalog discovery (`/.well-known/agent-catalog`), product-driven option reconciliation, bounded spend guardrails, and real-time settlement via pre-authorized e-mandates.

---

## Architecture & System Flow

```
                                  USER INSTRUCTION
                                         │
                                         ▼
                 ┌────────────────────────────────────────────────┐
                 │       CatalogX Dashboard (Next.js - Port 3000) │
                 │        Multi-Tenant UI • Audit Feed • Mandates │
                 └───────────────────────┬────────────────────────┘
                                         │
                                         ▼
                 ┌────────────────────────────────────────────────┐
                 │          Autonomous Buyer Agent Core           │
                 │    NLU • Memory • Gating • Recovery Engine     │
                 └───────┬──────────────────────────────┬─────────┘
                         │                              │
          Federated Discovery                           │ Spend Governor
          & Product Search                              │ (3-Tier Guardrails)
                         │                              │
                         ▼                              ▼
    ┌──────────────────────────────────────┐  ┌────────────────────────────────────┐
    │  Federated Merchant APIs             │  │ Razorpay Settlement Rails          │
    │  (/.well-known/agent-catalog)        │  │ • Tier 1 (≤ ₹1,500): e-Mandate     │
    ├──────────────────────────────────────┤  │ • Tier 2 (₹1,501-₹5k): 1-Click Buy │
    │ • UrbanStride (Footwear - Port 3001) │  │ • Tier 3 (> ₹5k): 2FA OTP Gated    │
    │ • TechCart (Electronics - Port 3002) │  └────────────────────────────────────┘
    └──────────────────────────────────────┘
```

---

## Repository Structure

The repository is structured as an integrated monorepo with clean separation between the buyer platform, merchant nodes, and agent intelligence:

```text
AI Builder/
├── dashboard/               # CatalogX Platform & Multi-Tenant Management Dashboard (Port 3000)
├── buyer-agent/             # Autonomous Buyer Agent Runtime & Orchestration Engine
├── urbanstride/             # UrbanStride Footwear Merchant Storefront & Admin Portal (Port 3001)
├── techcart/                # TechCart Electronics Merchant Storefront & Admin Portal (Port 3002)
├── llm/                     # Universal LLM Provider Abstraction & Structured JSON Engine
├── DOCUMENTATION.md         # Detailed Technical Specification & Architecture Whitepaper
└── package.json             # Root Monorepo Configuration & Concurrency Scripts
```

### Workspace Significance

| Workspace | Significance |
| :--- | :--- |
| [`dashboard/`](file:///d:/Active/AI%20Builder/dashboard) | The central multi-tenant web application where users interact with the buyer agent, view real-time audit trails, configure delivery settings, manage e-mandates, and review orders. |
| [`buyer-agent/`](file:///d:/Active/AI%20Builder/buyer-agent) | The autonomous decision-making engine. Parses human intent, queries merchant catalogs, reconciles product-level required options, enforces spend policies, and executes Razorpay orders. |
| [`urbanstride/`](file:///d:/Active/AI%20Builder/urbanstride) | A sample footwear merchant node implementing the Open Agent Catalog protocol (`/.well-known/agent-catalog`), live product search with dynamic sizing options, and Razorpay order checkout. |
| [`techcart/`](file:///d:/Active/AI%20Builder/techcart) | A sample electronics merchant node demonstrating multi-merchant federation, zero-sizing product flows, and dynamic bundle cross-sell offers. |
| [`llm/`](file:///d:/Active/AI%20Builder/llm) | Pluggable LLM interface providing structured JSON completions with multi-turn conversation memory and prompt-injection boundaries. |

---

## Quickstart Guide

### 1. Prerequisites
- Node.js 18+ (tested on Node.js 22)
- MongoDB Atlas cluster connection string
- Razorpay Test Key ID & Key Secret

### 2. Installation
Install all dependencies across the entire monorepo:
```bash
npm install
```

### 3. Environment Configuration
Ensure your root `.env` or `dashboard/.env.local` contains:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=Cluster0
MONGODB_DB_NAME=catalogx_db
RAZORPAY_KEY_ID=rzp_test_TSjdfOWmYoGtxa
RAZORPAY_KEY_SECRET=IbXWmU2CVsUxLwX5wrCsKVya
AZURE_OPENAI_ENDPOINT=https://<resource>.cognitiveservices.azure.com/
AZURE_OPENAI_API_KEY=<api-key>
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-5.4-nano
```

### 4. Running Locally
Start all three platforms concurrently in a single command:
```bash
npm run dev
```

This launches:
- **CatalogX Dashboard**: `http://localhost:3000`
- **UrbanStride Footwear**: `http://localhost:3001`
- **TechCart Electronics**: `http://localhost:3002`

---

## Core Features

- **Agent-Readable Catalogs**: Endpoints at `/.well-known/agent-catalog` expose machine-readable schemas, option requirements, and policies.
- **Product-Driven Dynamic Options**: Sizing, colors, or volume constraints are discovered from product metadata rather than hardcoded in system prompts.
- **Dynamic AI Upsell**: Merchants attach contextual bundle offers (e.g. socks bundle for shoes, carrying case for headphones) that the agent evaluates within user budget.
- **3-Tier Spend Governor**:
  - **Tier 1 (≤ ₹1,500)**: `AUTO` approval via pre-authorized e-mandates (simulated in test mode; maps to Razorpay's `POST /v1/payments/create/recurring` with NPCI UPI AutoPay `as_presented` variable mandates in production).
  - **Tier 2 (₹1,501 – ₹5,000)**: `REVIEW` requiring 1-click human consent.
  - **Tier 3 (> ₹5,000)**: `HIGH_VALUE_2FA` requiring mandatory OTP verification.
- **Multi-Tenant MongoDB Atlas Store**: Chat threads and structured audit events are stored in `catalogx_db.chat_sessions` scoped by `userId` and `sessionId`.
- **Prompt Injection Defense**: Untrusted merchant data is isolated as strictly typed JSON data records, while money actions are guarded by deterministic code.

---

## Technical Documentation

For the comprehensive technical whitepaper, threat model, protocol specification, test benchmarks, and e-mandate production mapping, refer to:
👉 **[DOCUMENTATION.md](file:///d:/Active/AI%20Builder/DOCUMENTATION.md)**
