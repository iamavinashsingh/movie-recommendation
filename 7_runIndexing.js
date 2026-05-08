// =====================================================================
// 7_runIndexing.js — RUNS THE COMPLETE INDEXING PIPELINE
// =====================================================================
// Command: npm run index -- ./Data/movies.csv
//
// NEW FLOW (Local CSV parsing):
//   Step 1: Parse movies.csv locally to extract entities (No API needed)
//   Step 2: Build Neo4j graph from entities
//   Step 3: Build Pinecone vector store from entities using OpenAI
// =====================================================================

import { extractAllEntities } from "./4_entityExtractor.js";
import { buildGraph } from "./5_graphBuilder.js";
import { buildVectorStore } from "./6_vectorStore.js";
import { closeConnections } from "./2_config.js";

async function runIndexing(csvPath) {
  console.log("===========================================");
  console.log("   🎬 GraphRAG Indexing Pipeline");
  console.log("===========================================\n");

  const startTime = Date.now();

  try {
    // ── STEP 1: Parse CSV ──
    console.log("── STEP 1: Extracting Entities (Local CSV Parse) ──");
    const entities = await extractAllEntities(csvPath);

    // ── STEP 2: Build Neo4j Graph ──
    console.log("\n── STEP 2: Building Graph (Neo4j) ──");
    await buildGraph(entities);

    // ── STEP 3: Build Vector Store ──
    console.log("\n── STEP 3: Building Vector Store (Pinecone) ──");
    await buildVectorStore(entities);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("\n===========================================");
    console.log(`   ✅ Indexing complete in ${elapsed}s`);
    console.log("===========================================");
  } catch (err) {
    console.error("\n❌ Indexing failed:", err.message);
    console.error(err.stack);
  } finally {
    await closeConnections();
  }
}

const csvPath = process.argv[2] || './Data/movies.csv';
if (!csvPath) {
  console.error("Usage: node 7_runIndexing.js <path-to-csv>");
  console.error("Example: node 7_runIndexing.js ./Data/movies.csv");
  process.exit(1);
}

runIndexing(csvPath);