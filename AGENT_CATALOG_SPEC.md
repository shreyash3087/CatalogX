# Agent-Readable Catalog Protocol Specification (`/.well-known/agent-catalog`)

> **Standard Version**: `1.0.0`  
> **Protocol Alignment**: NPCI Universal Agent Protocol (UAP), Agent Commerce Protocol (ACP), AP2 / x402  
> **Default Endpoint**: `GET /.well-known/agent-catalog`

---

## 1. Overview & Purpose

The **Agent-Readable Catalog Manifest** is a machine-readable JSON specification hosted by an e-commerce merchant at `/.well-known/agent-catalog`. 

It enables any autonomous AI buyer agent to:
1. **Discover Merchant Identity & Category**: Understand what products the merchant sells and in what currency.
2. **Inspect Protocol Capabilities**: Verify if the merchant supports semantic search, real-time stock verification, autonomous order creation, and Razorpay e-mandates.
3. **Understand Policies & Guarantees**: Read warranty, authenticity, and return rules without scraping human HTML pages.
4. **Discover API Contracts**: Programmatically read endpoints for product search (`/api/products/search`) and Razorpay order creation (`/api/orders`).

---

## 2. Standard Manifest Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "schema_version": "1.0.0",
  
  // 1. MERCHANT IDENTITY
  "merchant": {
    "id": "merchant_urbanstride_001",
    "name": "UrbanStride Footwear",
    "category": "footwear",
    "description": "Premium performance running shoes, trail boots, and casual sneakers with Razorpay agentic checkout.",
    "base_url": "https://urbanstride.store",
    "currency": "INR",
    "sizing_standard": "UK / India standard sizing (UK 6, UK 7, UK 8, UK 9, UK 10, UK 11, UK 12)"
  },

  // 2. CAPABILITIES & SUPPORTED OPTIONS
  "capabilities": {
    "discovery": true,
    "semantic_search": true,
    "real_time_stock": true,
    "autonomous_order_creation": true,
    "razorpay_integrated": true,
    "tokenhq_mandate_supported": true,
    "options_supported": {
      "sizing": true,
      "size_type": "UK / India size",
      "available_sizes": ["6", "7", "8", "9", "10", "11", "12"],
      "colors": true
    }
  },

  // 3. CATALOG METRICS & RANGE
  "catalog_summary": {
    "total_products": 17,
    "in_stock_products": 16,
    "categories": ["running-shoes", "casual-sneakers", "hiking-boots"],
    "brands": ["Nike", "Adidas", "Puma", "HRX", "Campus", "Skechers", "Brooks"],
    "supported_sizes": ["6", "7", "8", "9", "10", "11", "12"],
    "price_range_inr": {
      "min": 999,
      "max": 7999
    }
  },

  // 4. MERCHANT POLICIES (Read-Only Context for AI Buyer)
  "policies": {
    "returns": "7-day hassle-free return and exchange window",
    "authenticity": "100% Original Brand Guarantee",
    "shipping": "Free express delivery across India with Razorpay Buyer Protection"
  },

  // 5. MACHINE-READABLE API ENDPOINTS
  "endpoints": {
    "catalog_manifest": {
      "path": "/.well-known/agent-catalog",
      "method": "GET",
      "description": "Returns machine-readable merchant catalog metadata & API contract"
    },
    "product_search": {
      "path": "/api/products/search",
      "method": "POST",
      "description": "Semantic search with natural language queries, budget limits, and option filters",
      "payload_schema": {
        "query": "string (optional keyword query)",
        "filters": {
          "max_price_paise": "number (optional price ceiling in paise, ₹1 = 100 paise)",
          "category": "string (optional category id)",
          "size": "string (optional size without prefix)",
          "in_stock_only": "boolean (default: true)"
        },
        "limit": "number (default: 25)"
      }
    },
    "order_creation": {
      "path": "/api/orders",
      "method": "POST",
      "description": "Create Razorpay order for autonomous or 2FA purchase",
      "required_fields": [
        "product_id",
        "size",
        "customer.name",
        "customer.email",
        "customer.phone",
        "shipping_address.street",
        "shipping_address.city",
        "shipping_address.state",
        "shipping_address.postal_code"
      ]
    }
  },

  "updated_at": "2026-08-31T21:00:00.000Z"
}
```

---

## 3. Product Search Response Schema (`POST /api/products/search`)

When the AI buyer agent invokes the merchant's search endpoint, the merchant returns structured product items:

```json
{
  "results": [
    {
      "id": "prod_023",
      "name": "HRX by Hrithik Roshan RUN",
      "description": "Indian performance running shoe with EVA cushioning. Designed for daily training.",
      "category": "running-shoes",
      "brand": "HRX",
      "price": {
        "paise": 149900,
        "inr": "1499.00",
        "display": "₹1,499"
      },
      "stock": 25,
      "in_stock": true,
      "image_url": "/assets/urbanstride/Image3.png",
      "product_url": "/product/prod_023",

      // MANDATORY OR OPTIONAL PRODUCT ATTRIBUTES
      "required_options": [
        {
          "key": "size",
          "label": "UK / India Shoe Size",
          "type": "select",
          "available_options": ["6", "7", "8", "9", "10", "11"],
          "required": true
        },
        {
          "key": "color",
          "label": "Color",
          "type": "select",
          "available_options": ["black-red", "blue-white", "grey"],
          "required": false
        }
      ],

      // CONTEXTUAL CROSS-SELL / UPSELL OFFERS
      "offers": [
        {
          "id": "offer_hrx_socks",
          "type": "bundle_add_on",
          "name": "HRX Anti-Blister Performance Socks (3-Pack)",
          "original_price_paise": 49900,
          "bundle_price_paise": 19900,
          "discount": "60% OFF",
          "description": "Add breathable performance running socks for only ₹199 (Save ₹300)"
        }
      ]
    }
  ],
  "total_matches": 1,
  "query": "shoes",
  "filters": {
    "max_price_paise": 150000
  }
}
```

---

## 4. Field Descriptions

| Section | Field | Type | Description |
| :--- | :--- | :--- | :--- |
| `merchant` | `id` | `string` | Unique merchant identifier (e.g. `merchant_urbanstride_001`). |
| `merchant` | `base_url` | `string` | Root URL of the merchant server. |
| `merchant` | `currency` | `string` | ISO currency code (e.g. `INR`). |
| `capabilities` | `autonomous_order_creation` | `boolean` | Indicates if the merchant accepts AI agent orders via API. |
| `capabilities` | `tokenhq_mandate_supported` | `boolean` | Indicates support for Razorpay e-mandates / recurring token execution. |
| `required_options` | `key` | `string` | Parameter key (e.g. `size`, `color`, `switch_type`, `volume`). |
| `required_options` | `required` | `boolean` | If `true`, the buyer agent must clarify this option with the user before placing an order. |
| `offers` | `bundle_price_paise` | `number` | Discounted bundle price when purchased with this base item. |
