# CatalogX Platform Dashboard (`dashboard`)

The **CatalogX Platform Dashboard** is the central multi-tenant user application running on **Next.js 16 (App Router)** and **MongoDB Atlas**.

---

## Significance & Responsibilities

- **Conversational Commerce Interface**: Provides an interactive chat canvas where users give high-level shopping instructions, receive real-time recommendations, review product options, and complete checkouts.
- **Real-Time Audit Feed**: Streams live audit events (`INSTRUCTION_PARSED`, `CATALOG_DISCOVERED`, `GATE_CHECKED`, `ORDER_CREATED`, `PAYMENT_VERIFIED`) with explainable reasoning.
- **Micro-Spend Mandate Vault**: Allows users to register, inspect, and revoke pre-authorized Razorpay e-mandates for autonomous zero-click payments up to ₹1,500.
- **Orders Ledger**: Multi-tenant ledger displaying all placed orders, itemized pricing, Razorpay payment IDs, and delivery statuses.
- **User Profile & Shipping Preferences**: Stores delivery addresses and contact information to populate autonomous agent checkouts.

---

## Directory Structure

```text
dashboard/
├── app/
│   ├── api/
│   │   ├── agent/             # Agent execution and title generation endpoints
│   │   ├── events/            # Multi-tenant audit event streaming from MongoDB
│   │   ├── mandates/          # Razorpay mandate registration, verification & revocation
│   │   ├── sessions/          # Chat session history retrieval & saving
│   │   └── users/profile/     # User profile and address management
│   ├── layout.tsx             # Root layout with font and theme providers
│   └── page.tsx               # Main Dashboard page (Chat, Activity Log, Ledger, Settings)
├── components/
│   ├── ActivityCanvas.tsx     # Real-time visual pipeline showing agent decision steps
│   ├── ChatTab.tsx            # Conversational thread & interactive product checkout cards
│   ├── GatingIndicator.tsx    # 3-Tier Spend Governor visualization
│   ├── MandateVaultModal.tsx  # Razorpay e-mandate registration modal
│   ├── OrdersTab.tsx          # Comprehensive order ledger with status pills
│   ├── SettingsTab.tsx        # Mandate limits & delivery address manager
│   └── Sidebar.tsx            # Session navigator and platform links
├── hooks/
│   ├── useAgentFeed.ts        # Polling & WebSocket feed hook for live events
│   └── useTheme.ts            # Dark / Light theme manager
└── lib/
    ├── db.ts                  # MongoDB Atlas connection manager for catalogx_db
    └── razorpay.ts            # Razorpay SDK initialization
```

---

## Port & Environment

- **Default Port**: `3000`
- **Database**: `catalogx_db` in MongoDB Atlas
- **Run Standalone**: `npm run dev --workspace=dashboard`
