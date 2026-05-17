// ──────────────────────────────────────────────────────────────────────────────
//  Next.js Serverless API Route – POST /api/query
//  • Calls the existing backend utilities (embedText, pineconeIndex, etc.).
//  • When MOCK_MODE is true it returns static mock data (no external services).
//  • Keeps all original backend source files untouched for interview showcase.
// ──────────────────────────────────────────────────────────────────────────────
import { NextResponse } from 'next/server';

// Backend utilities (kept for showcase; they are never executed when mock mode is on)
import { embedText, pineconeIndex } from '@/lib/backend/2_config.js';
import { classifyQuery } from '@/lib/backend/9_queryClassifier.js';
import { handleFactualQuery } from '@/lib/backend/11_factualHandler.js';

// ---------------------------------------------------------------------------
// Helper – read MOCK_MODE from the environment (defaults to false)
const isMockMode = process.env.MOCK_MODE === 'true';

// ---------------------------------------------------------------------------
// Mock data generators (used only when MOCK_MODE === true)
function mockClassification(query) {
  const q = query.toLowerCase();
  if (q.includes("like") || q.includes("recommend") || q.includes("similar")) {
    return {
      type: 'similarity',
      reasoning: 'User is asking for recommendations or similar movies (Mocked)',
    };
  } else if (q.includes("who") || q.includes("what") || q.includes("tell me about")) {
    return {
      type: 'descriptive',
      reasoning: 'User is asking about a movie description or person (Mocked)',
    };
  }
  return {
    type: 'factual',
    reasoning: 'User is asking a specific database question (Mocked)',
  };
}

function mockFactualAnswer(query) {
  return `[Mock Mode Active] Here is a mock factual database answer for: "${query}". (To use your real Neo4j database, set MOCK_MODE=false in your .env file).`;
}

function mockSimilarityResults(query) {
  // Return a handful of movie objects that look like real Pinecone matches
  return [
    {
      id: 'mock-1',
      title: 'Inception',
      year: '2010',
      match: '96%',
      director: 'Christopher Nolan',
      genres: 'Sci‑Fi, Thriller',
      themes: 'Dreams, Reality',
      actors: 'Leonardo DiCaprio, Joseph Gordon-Levitt',
    },
    {
      id: 'mock-2',
      title: 'Interstellar',
      year: '2014',
      match: '93%',
      director: 'Christopher Nolan',
      genres: 'Sci‑Fi, Adventure',
      themes: 'Space, Time',
      actors: 'Matthew McConaughey, Anne Hathaway',
    },
    {
      id: 'mock-3',
      title: 'The Dark Knight',
      year: '2008',
      match: '90%',
      director: 'Christopher Nolan',
      genres: 'Action, Crime, Drama',
      themes: 'Heroism, Chaos',
      actors: 'Christian Bale, Heath Ledger',
    }
  ];
}

// ---------------------------------------------------------------------------
// Main handler
export async function POST(req) {
  try {
    // 1️⃣ Parse request body
    const body = await req.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'No query provided' },
        { status: 400 }
      );
    }

    console.log(`\n[API] Received query: "${query}"`);

    // 2️⃣ Classification (real or mocked)
    const classification = isMockMode
      ? mockClassification(query)
      : await classifyQuery(query);

    console.log(`[API] Classified as: ${classification.type}`);

    // 3️⃣ Prepare response containers
    let textAnswer = '';
    let movieResults = [];

    // 4️⃣ Branch based on classification type
    if (
      classification.type === 'similarity' ||
      classification.type === 'descriptive'
    ) {
      if (isMockMode) {
        // Return ready‑made mock results
        movieResults = mockSimilarityResults(query);
      } else {
        // Real workflow: embed → Pinecone search → format results
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
      }
    } else {
      // ----> Factual path
      textAnswer = isMockMode
        ? mockFactualAnswer(query)
        : await handleFactualQuery(query);
    }

    // 5️⃣ Return unified JSON payload
    return NextResponse.json({
      classification: classification.type,
      text: textAnswer,
      results: movieResults,
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Unexpected error' },
      { status: 500 }
    );
  }
}
