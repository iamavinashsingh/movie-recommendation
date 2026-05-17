// ──────────────────────────────────────────────────────────────────────────────
//  Next.js Serverless API Route – POST /api/query
//  • Calls the real database (Neo4j, Pinecone) and AI (OpenRouter, Hugging Face) APIs.
//  • No mock fallback. Operates 100% serverless.
//  • Integrates factual, similarity, and descriptive RAG handlers.
// ──────────────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';
import { embedText, pineconeIndex } from '@/lib/backend/2_config.js';
import { classifyQuery } from '@/lib/backend/9_queryClassifier.js';
import { handleFactualQuery } from '@/lib/backend/11_factualHandler.js';
import { handleSimilarityQuery } from '@/lib/backend/12_similarityHandler.js';
import { handleDescriptiveQuery } from '@/lib/backend/14_descriptiveHandler.js';

export async function POST(req) {
  try {
    const body = await req.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'No query provided' },
        { status: 400 }
      );
    }

    console.log(`\n[API] Received query: "${query}"`);

    // 1️⃣ Run Real classification using LLM
    const classification = await classifyQuery(query);
    console.log(`[API] Classified as: ${classification.type} (Reason: ${classification.reasoning})`);

    let textAnswer = '';
    let movieResults = [];

    // 2️⃣ Execute RAG flow based on classification
    if (classification.type === 'similarity') {
      console.log(`[API] Executing similarity handler...`);
      // A) Generate rich conversational LLM recommendation reasons
      textAnswer = await handleSimilarityQuery(query);

      // B) Query Pinecone for top 10 movies to show as visual cards in UI
      const queryVector = await embedText(query);
      const searchResults = await pineconeIndex.query({
        vector: queryVector,
        topK: 10,
        includeMetadata: true,
      });

      if (searchResults.matches && searchResults.matches.length > 0) {
        movieResults = searchResults.matches.map((m, idx) => ({
          id: m.id || idx.toString(),
          title: m.metadata.title,
          year: m.metadata.year?.toString() || 'Unknown',
          match: `${Math.round(m.score * 100)}%`,
          director: m.metadata.director || 'Unknown',
          genres: m.metadata.genres || '',
          themes: m.metadata.themes || '',
          actors: m.metadata.actors || '',
        }));
      }
    } else if (classification.type === 'descriptive') {
      console.log(`[API] Executing descriptive handler...`);
      // A) Generate rich conversational description
      textAnswer = await handleDescriptiveQuery(query);

      // B) Query Pinecone for top 10 movies related to description
      const queryVector = await embedText(query);
      const searchResults = await pineconeIndex.query({
        vector: queryVector,
        topK: 10,
        includeMetadata: true,
      });

      if (searchResults.matches && searchResults.matches.length > 0) {
        movieResults = searchResults.matches.map((m, idx) => ({
          id: m.id || idx.toString(),
          title: m.metadata.title,
          year: m.metadata.year?.toString() || 'Unknown',
          match: `${Math.round(m.score * 100)}%`,
          director: m.metadata.director || 'Unknown',
          genres: m.metadata.genres || '',
          themes: m.metadata.themes || '',
          actors: m.metadata.actors || '',
        }));
      }
    } else {
      console.log(`[API] Executing factual handler...`);
      // Factual query (uses Neo4j + Cypher + LLM synthesis)
      textAnswer = await handleFactualQuery(query);
    }

    return NextResponse.json({
      classification: classification.type,
      text: textAnswer,
      results: movieResults,
    });
  } catch (error) {
    console.error('[API] Serverless Handler Error:', error);
    return NextResponse.json(
      { error: error.message || 'Unexpected serverless backend error' },
      { status: 500 }
    );
  }
}
