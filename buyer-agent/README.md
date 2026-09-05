# CatalogX Buyer Agent Runtime (`buyer-agent`)

The **Buyer Agent** is the autonomous decision-making runtime for CatalogX. It operates as a stateless subprocess orchestrated by the platform, executing the open **Agent Commerce Protocol (ACP/UAP)**.

---

## Significance & Core Modules

- **Universal Intent Parser (`src/agent/constraints.js`)**: Converts human requests into structured parameters (`query`, `budget_max_paise`, `user_provided_options`) with multi-turn memory and prompt-injection safety.
- **Orchestration Core (`src/agent/core.js`)**: Discovers merchant catalogs, queries products under budget, reconciles product-level `required_options`, evaluates dynamic upsell `offers`, selects the best match, and creates orders.
- **Spend Governor (`src/agent/gating.js`)**: Deterministic safety engine enforcing the 3-Tier Spend Policy:
  - **Tier 1 (≤ ₹1,500)**: `AUTO` (Pre-authorized e-mandate eligible)
  - **Tier 2 (₹1,501 – ₹5,000)**: `REVIEW` (1-Click Human Consent)
  - **Tier 3 (> ₹5,000)**: `HIGH_VALUE_2FA` (Mandatory OTP Verification)
- **Failure Recovery Engine (`src/agent/recovery.js`)**: Handles stock-outs by discovering next-best alternatives and retries payment gateway network failures with exponential backoff.
- **Multi-Tenant Session Store (`src/db/sessionStore.js`)**: Persists conversation turns and structured audit steps directly to MongoDB Atlas (`catalogx_db.chat_sessions`).

---

## Directory Structure

```text
buyer-agent/
├── src/
│   ├── agent/
│   │   ├── constraints.js     # Universal intent & constraint extractor
│   │   ├── core.js            # Main purchase orchestrator & product evaluation
│   │   ├── gating.js          # Deterministic 3-Tier spend governor
│   │   └── recovery.js        # Stock-out fallback & payment retry logic
│   ├── audit/
│   │   ├── logger.js          # Structured audit logger (MongoDB + local fallback)
│   │   └── reporter.js        # Terminal report formatting
│   ├── db/
│   │   └── sessionStore.js    # Multi-tenant MongoDB Atlas session & event store
│   └── index.js               # CLI and headless execution entrypoint
└── package.json
```

---

## CLI Execution Examples

```bash
# Direct shopping query
node src/index.js "Buy me running shoes under ₹1500"

# Interactive CLI mode
node src/index.js
```
