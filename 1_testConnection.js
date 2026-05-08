// =====================================================================
// 1_testConnection.js — RUN THIS FIRST
// =====================================================================
// Command: npm run test
//
// Tests all 4 services. If any fails, fix your .env file.
// =====================================================================

import { driver, pineconeIndex, llm, embedText, closeConnections } from "./2_config.js";

async function testConnections() {
  console.log("🔍 Testing all connections...\n");

  // Test 1: Neo4j
  try {
    const session = driver.session();
    const result = await session.run("RETURN 'Neo4j Connected!' AS message");
    console.log("✅ Neo4j:", result.records[0].get("message"));
    await session.close();
  } catch (err) {
    console.error("❌ Neo4j:", err.message);
  }

  // Test 2: Pinecone
  try {
    const stats = await pineconeIndex.describeIndexStats();
    console.log("✅ Pinecone: Connected | Vectors:", stats.totalRecordCount || 0);
  } catch (err) {
    console.error("❌ Pinecone:", err.message);
  }

  // Test 3: OpenRouter LLM
  try {
    const response = await llm.invoke("Say 'OpenRouter Connected!' and nothing else.");
    console.log("✅ OpenRouter LLM:", response.content.trim());
  } catch (err) {
    console.error("❌ OpenRouter LLM:", err.message);
  }

  // Test 4: OpenRouter Embeddings
  try {
    const vector = await embedText("test");
    console.log("✅ OpenRouter Embeddings (gemini-embedding-2-preview): Dimension =", vector.length);
    if (vector.length !== 3072) {
      console.warn("   ⚠️ Note: Your embedding dimension is", vector.length, "- Make sure your Pinecone index matches this size!");
    }
  } catch (err) {
    console.error("❌ OpenRouter Embeddings:", err.message);
  }

  await closeConnections();
}

testConnections();