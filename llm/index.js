/**
 * CatalogX LLM Provider Abstraction
 * ===================================
 * Central module for all LLM interactions across CatalogX.
 * Currently configured for Azure OpenAI.
 *
 * To swap providers: change the PROVIDER env var and update config below.
 * Supported providers: "azure-openai" | "openai" | "gemini" (future)
 *
 * Usage:
 *   const { chat, embed, streamChat } = require('@catalogx/llm');
 *   const response = await chat([{ role: 'user', content: 'Hello' }]);
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
// Public API
// ---------------------------------------------------------------------------

/**
 * Send a chat completion request.
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} options - Optional overrides: temperature, max_completion_tokens, response_format
 * @returns {Promise<string>} - The assistant's message content
 */
async function chat(messages, options = {}) {
  const client = getChatClient();
  const deployment = PROVIDER === 'azure-openai' ? AZURE_CONFIG.chatDeployment : undefined;

  const response = await client.chat.completions.create({
    model: deployment,
    messages,
    temperature: options.temperature ?? 0.2,
    // GPT-5.x / o-series models require max_completion_tokens, not max_tokens
    max_completion_tokens: options.max_completion_tokens ?? options.max_tokens ?? 2048,
    ...(options.response_format ? { response_format: options.response_format } : {}),
  });

  return response.choices[0].message.content;
}

/**
 * Send a chat completion request with structured JSON output.
 * @param {Array<{role: string, content: string}>} messages
 * @param {object} options
 * @returns {Promise<object>} - Parsed JSON object
 */
async function chatJSON(messages, options = {}) {
  // Inject JSON instruction into system message if not already present
  const hasSystemMsg = messages.some(m => m.role === 'system');
  const jsonMessages = hasSystemMsg
    ? messages.map(m => m.role === 'system'
        ? { ...m, content: m.content + '\n\nIMPORTANT: You MUST respond with valid JSON only. No markdown, no explanation, just pure JSON.' }
        : m)
    : [{ role: 'system', content: 'You must respond with valid JSON only. No markdown, no explanation.' }, ...messages];

  // Try with response_format first (supported on most models)
  let result;
  try {
    result = await chat(jsonMessages, {
      ...options,
      response_format: { type: 'json_object' },
    });
  } catch (err) {
    // Fallback: retry without response_format if unsupported
    if (err.message?.includes('response_format') || err.message?.includes('json_object')) {
      result = await chat(jsonMessages, { ...options });
    } else {
      throw err;
    }
  }

  // Strip markdown code fences if present
  const cleaned = result.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`LLM returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }
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

  // Return in same order as input
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
  chat,
  chatJSON,
  embed,
  embedBatch,
  cosineSimilarity,
  providerInfo,
};
