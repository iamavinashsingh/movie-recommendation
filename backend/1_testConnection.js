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

  // Test 4: Hugging Face Embeddings (mxbai-embed-large-v1 → 1024 dims)
  try {
    const vector = await embedText("test");
    console.log("✅ Hugging Face Embeddings (mxbai-embed-large-v1): Dimension =", vector.length);
    if (vector.length !== 1024) {
      console.warn("   ⚠️ Expected 1024 dimensions, got", vector.length);
    }
  } catch (err) {
    console.error("❌ Hugging Face Embeddings:", err.message);
  }

  await closeConnections();
}

testConnections();