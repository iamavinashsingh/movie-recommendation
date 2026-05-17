// =====================================================================
// 2_config.js — ALL CONNECTIONS IN ONE PLACE
// =====================================================================
//
// This file sets up 4 connections:
//   1. Neo4j       → Graph Database (stores facts + relationships)
//   2. Pinecone    → Vector Database (stores embeddings for similarity)
//   3. OpenRouter  → LLM (free tier chat model)
//   4. Hugging Face → Embeddings (free, 1024 dimensions)
//
// Model: mixedbread-ai/mxbai-embed-large-v1 (1024 dims, top-ranked free model)
// Pinecone index must be set to: dimensions=1024, metric=cosine
//
// Every other file imports from THIS file.
// =====================================================================

import dotenv from "dotenv";
import neo4j from "neo4j-driver";
import { Pinecone } from "@pinecone-database/pinecone";
import { ChatOpenAI } from "@langchain/openai";

dotenv.config();

// =====================================================================
// 1. NEO4J
// =====================================================================
const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
);

// =====================================================================
// 2. PINECONE
// =====================================================================
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME);

// =====================================================================
// 3. OPENROUTER LLM (Free Tier)
// =====================================================================
const llm = new ChatOpenAI({
  modelName: "openrouter/free",
  apiKey: process.env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: "https://openrouter.ai/api/v1",
  },
  temperature: 0,
});

// =====================================================================
// 4. HUGGING FACE EMBEDDINGS (Free Tier - 1024 Dimensions)
// =====================================================================
// Using the new HF Router endpoint (replaces the old api-inference URL)
const EMBEDDING_MODEL = "mixedbread-ai/mxbai-embed-large-v1";
const HF_ROUTER_URL = `https://router.huggingface.co/hf-inference/models/${EMBEDDING_MODEL}/pipeline/feature-extraction`;

/**
 * Embed a single string.
 * Returns a plain JS array of 1024 numbers.
 */
async function embedText(text) {
  const response = await fetch(HF_ROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HuggingFace error ${response.status}: ${err}`);
  }
  const data = await response.json();
  // Single input returns an array of 1024 numbers directly
  return Array.isArray(data[0]) ? data[0] : data;
}

/**
 * Embed multiple strings (batch).
 * Returns an array of 1024-dim vectors.
 */
async function embedTexts(texts) {
  const response = await fetch(HF_ROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: texts }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`HuggingFace error ${response.status}: ${err}`);
  }
  const data = await response.json();
  // Batch input returns array of arrays
  return data;
}

// =====================================================================
// CLEANUP
// =====================================================================
async function closeConnections() {
  await driver.close();
  console.log("✅ All connections closed.");
}

export { driver, pinecone, pineconeIndex, llm, embedText, embedTexts, closeConnections };