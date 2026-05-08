// =====================================================================
// 2_config.js — ALL CONNECTIONS IN ONE PLACE
// =====================================================================
//
// This file sets up 3 connections:
//   1. Neo4j     → Graph Database (stores facts + relationships)
//   2. Pinecone  → Vector Database (stores embeddings for similarity)
//   3. OpenAI LLM → Language Model & Embeddings
//
// Every other file imports from THIS file.
// If a key changes, you change it in ONE place.
// =====================================================================

import dotenv from "dotenv";
import neo4j from "neo4j-driver";
import { Pinecone } from "@pinecone-database/pinecone";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// Load .env file → puts values into process.env
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
// 3. GOOGLE GEMINI LLM (Free Tier)
// =====================================================================
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash", // Fast, highly capable, free tier available
  apiKey: process.env.GEMINI_API_KEY,
  temperature: 0,
});

// =====================================================================
// 4. GOOGLE GEMINI EMBEDDINGS (Free Tier)
// =====================================================================
const embeddings = new GoogleGenerativeAIEmbeddings({
  model: "text-embedding-004", // Outputs exactly 768 dimensions
  apiKey: process.env.GEMINI_API_KEY,
});

// Embed ONE text
async function embedText(text) {
  const [vector] = await embeddings.embedDocuments([text]);
  return vector;
}

// Embed MULTIPLE texts
async function embedTexts(texts) {
  return await embeddings.embedDocuments(texts);
}

// Close all connections when done
async function closeConnections() {
  await driver.close();
  console.log("✅ All connections closed.");
}

export { driver, pinecone, pineconeIndex, llm, embedText, embedTexts, closeConnections };