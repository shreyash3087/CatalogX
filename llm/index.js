/**
 * CatalogX LLM Provider Abstraction
 * ===================================
 * Central module for all LLM interactions across CatalogX.
 * Uses Azure OpenAI Responses API with native session context memory (previous_response_id)
 * and real-time streaming support.
 *
 * Usage:
 *   const { chat, chatJSON, createResponse, streamResponse } = require('@catalogx/llm');
 */

'use strict';

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const { AzureOpenAI } = require('openai');

// ---------------------------------------------------------------------------
// Provider config — edit this block to switch providers
// ---------------------------------------------------------------------------
const PROVIDER = process.env.LLM_PROVIDER || 'azure-openai';

const AZURE_CONFIG = {
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2025-03-01-preview',
  chatDeployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-5.4-nano',
  embeddingDeployment: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-3-small',
};

// ---------------------------------------------------------------------------
// Client instantiation
// ---------------------------------------------------------------------------
let _chatClient = null;
let _embedClient = null;

function getChatClient() {
  if (!_chatClient) {
    if (PROVIDER === 'azure-openai') {
      _chatClient = new AzureOpenAI({
        apiKey: AZURE_CONFIG.apiKey,
        endpoint: AZURE_CONFIG.endpoint,
        apiVersion: AZURE_CONFIG.apiVersion,
        deployment: AZURE_CONFIG.chatDeployment,
      });
    } else {
      throw new Error(`LLM Provider "${PROVIDER}" not implemented. Check llm/index.js.`);
    }
  }
  return _chatClient;
}

function getEmbedClient() {
  if (!_embedClient) {
    if (PROVIDER === 'azure-openai') {
      _embedClient = new AzureOpenAI({
        apiKey: AZURE_CONFIG.apiKey,
        endpoint: AZURE_CONFIG.endpoint,
        apiVersion: AZURE_CONFIG.apiVersion,
        deployment: AZURE_CONFIG.embeddingDeployment,
      });
    } else {
      throw new Error(`LLM Provider "${PROVIDER}" not implemented. Check llm/index.js.`);
    }
  }
  return _embedClient;
}

// ---------------------------------------------------------------------------
// Public Responses API (Unified Responses API with previous_response_id)
// ---------------------------------------------------------------------------

/**
 * Create a response using the Responses API with conversation history support via previous_response_id.
 * @param {Array<{role: string, content: string}> | string} input - Messages array or single prompt
 * @param {object} options - Optional: previous_response_id, prev_response_id, temperature, max_completion_tokens, json
 * @returns {Promise<{ id: string, text: string, data?: object }>}
 */
async function createResponse(input, options = {}) {
  const client = getChatClient();
  const deployment = PROVIDER === 'azure-openai' ? AZURE_CONFIG.chatDeployment : undefined;
  const messages = Array.isArray(input) ? input : [{ role: 'user', content: input }];
  const prevId = options.previous_response_id || options.prev_response_id || null;

  try {
    const req = {
      model: deployment,
      input: messages,
      ...(prevId ? { previous_response_id: prevId } : {}),
    };

    const response = await client.responses.create(req);
    const id = response.id;
    const text = response.output_text || (response.output?.[0]?.content?.[0]?.text) || '';

    let data;
    if (options.json) {
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      try {
        data = JSON.parse(cleaned);
      } catch (err) {
        // json parse fallback
      }
    }

    return { id, text, data };
  } catch (err) {
    // Graceful fallback to chat.completions if responses API has any issue
    const response = await client.chat.completions.create({
      model: deployment,
      messages,
      temperature: options.temperature ?? 0.2,
      max_completion_tokens: options.max_completion_tokens ?? 2048,
    });
    const text = response.choices[0].message.content;
    let data;
    if (options.json) {
      const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      try {
        data = JSON.parse(cleaned);
      } catch (e) {}
    }
    return { id: response.id || `fallback_${Date.now()}`, text, data };
  }
}

/**
 * Stream a response using Responses API.
 * @param {Array<{role: string, content: string}> | string} input
 * @param {object} options - Optional: previous_response_id, prev_response_id
 * @returns {AsyncGenerator<{ type: 'delta'|'done'|'error', content?: string, delta?: string, response_id?: string }>}
 */
async function* streamResponse(input, options = {}) {
  const client = getChatClient();
  const deployment = PROVIDER === 'azure-openai' ? AZURE_CONFIG.chatDeployment : undefined;
  const messages = Array.isArray(input) ? input : [{ role: 'user', content: input }];
  const prevId = options.previous_response_id || options.prev_response_id || null;

  try {
    const req = {
      model: deployment,
      stream: true,
      input: messages,
      ...(prevId ? { previous_response_id: prevId } : {}),
    };

    const response = await client.responses.create(req);
    let currentResponseId = prevId;

    for await (const event of response) {
      if (event.response?.id) {
        currentResponseId = event.response.id;
      }
      if (event.type === 'response.output_text.delta' && event.delta) {
        yield { type: 'delta', delta: event.delta, content: event.delta, response_id: currentResponseId };
      }
    }
    yield { type: 'done', response_id: currentResponseId };
  } catch (err) {
    yield { type: 'error', error: err.message };
  }
}

/**
 * Send a chat completion request using the Responses API.
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} options - Optional overrides: previous_response_id, temperature, max_completion_tokens
 * @returns {Promise<string>} - The assistant's message content
 */
async function chat(messages, options = {}) {
  const resp = await createResponse(messages, options);
  return resp.text;
}

/**
 * Send a request with structured JSON output using the Responses API.
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} options - Optional overrides: previous_response_id
 * @returns {Promise<object>} - Parsed JSON object with attached response_id
 */
async function chatJSON(messages, options = {}) {
  const hasSystemMsg = messages.some(m => m.role === 'system');
  const jsonMessages = hasSystemMsg
    ? messages.map(m => m.role === 'system'
        ? { ...m, content: m.content + '\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown code fences, no extra text, just pure JSON.' }
        : m)
    : [{ role: 'system', content: 'You must respond with valid JSON only. No markdown code fences, no extra text.' }, ...messages];

  const resp = await createResponse(jsonMessages, { ...options, json: true });
  if (resp.data) {
    if (typeof resp.data === 'object' && resp.data !== null) {
      resp.data.response_id = resp.id;
    }
    return resp.data;
  }

  const cleaned = resp.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  const parsed = JSON.parse(cleaned);
  if (typeof parsed === 'object' && parsed !== null) {
    parsed.response_id = resp.id;
  }
  return parsed;
}

/**
 * Generate an embedding vector for a string.
 * @param {string} text
 * @returns {Promise<number[]>} - Embedding vector
 */
async function embed(text) {
  const client = getEmbedClient();
  const deployment = PROVIDER === 'azure-openai' ? AZURE_CONFIG.embeddingDeployment : undefined;

  const response = await client.embeddings.create({
    model: deployment,
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple strings in a single API call.
 * @param {string[]} texts
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
async function embedBatch(texts) {
  const client = getEmbedClient();
  const deployment = PROVIDER === 'azure-openai' ? AZURE_CONFIG.embeddingDeployment : undefined;

  const response = await client.embeddings.create({
    model: deployment,
    input: texts,
  });

  return response.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
}

/**
 * Compute cosine similarity between two vectors.
 * @param {number[]} a
 * @param {number[]} b
 * @returns {number} - Similarity score between -1 and 1
 */
function cosineSimilarity(a, b) {
  if (a.length !== b.length) throw new Error('Vector dimension mismatch');
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Provider metadata — useful for logging and debugging.
 */
const providerInfo = {
  provider: PROVIDER,
  chatModel: AZURE_CONFIG.chatDeployment,
  embeddingModel: AZURE_CONFIG.embeddingDeployment,
  endpoint: AZURE_CONFIG.endpoint,
};

module.exports = {
  getChatClient,
  getEmbedClient,
  createResponse,
  streamResponse,
  chat,
  chatJSON,
  embed,
  embedBatch,
  cosineSimilarity,
  providerInfo,
};
