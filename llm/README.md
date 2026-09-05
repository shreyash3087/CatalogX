# LLM Abstraction Layer (`llm`)

The `llm` module provides a universal, unified interface for large language model completions and structured JSON extraction across the CatalogX framework.

---

## Significance & Key Capabilities

- **Universal Provider Interface**: Abstracts underlying LLM providers (Azure OpenAI, OpenAI, Gemini) behind unified `chat(messages, options)` and `chatJSON(messages, options)` functions.
- **Structured JSON Inference**: Enforces strict JSON output formatting (`response_format: { type: "json_object" }` or structured schema) with markdown fence stripping and runtime validation.
- **Session Continuity (Responses API)**: Tracks `previous_response_id` across turns for session memory and conversational continuity.
- **Zero-Trust Security**: Ensures third-party catalog data is treated as untrusted user-role data, preventing prompt-injection attacks from overriding agent instructions.

---

## API Reference

### `chatJSON(messages, options)`
Sends a conversation message array to the model and returns a guaranteed parsed JSON object.

```javascript
const { chatJSON } = require('./llm/index');

const result = await chatJSON([
  { role: 'system', content: 'You are an AI assistant. Return JSON: { "summary": string }' },
  { role: 'user', content: 'Summarize running shoes under 1500' }
]);
```

### `chat(messages, options)`
Returns raw text completions for free-form responses and summaries.
