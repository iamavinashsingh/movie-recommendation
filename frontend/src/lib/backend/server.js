import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import { embedText, pineconeIndex } from './2_config.js';
import { classifyQuery } from './9_queryClassifier.js';
import { handleFactualQuery } from './11_factualHandler.js';

const app = express();
app.use(cors());
app.use(express.json());



// Dedicated API endpoint for the frontend
app.post('/api/query', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: "No query provided" });

  try {
    console.log(`\n[API] Received query: "${query}"`);

    // We use the existing classifier
    const classification = await classifyQuery(query);
    console.log(`[API] Classified as: ${classification.type}`);

    let textAnswer = "";
    let movieResults = [];

    if (classification.type === "similarity" || classification.type === "descriptive") {
      // 1. Embed query
      const queryVector = await embedText(query);
      
      // 2. Fetch from Pinecone
      const searchResults = await pineconeIndex.query({
        vector: queryVector,
        topK: 10,
        includeMetadata: true,
      });

      if (searchResults.matches && searchResults.matches.length > 0) {
        movieResults = searchResults.matches.map((m, index) => {
          const matchPercent = Math.round(m.score * 100) + "%";
          const title = m.metadata.title;
          const year = m.metadata.year;
          
          return {
            id: m.id || index.toString(),
            title: title,
            year: year?.toString() || "Unknown",
            match: matchPercent,
            director: m.metadata.director || "Unknown",
            genres: m.metadata.genres || "",
            themes: m.metadata.themes || "",
            actors: m.metadata.actors || ""
          };
        });
      }
    } else {
      // Factual query
      textAnswer = await handleFactualQuery(query);
    }

    return res.json({ 
      classification: classification.type,
      text: textAnswer,
      results: movieResults 
    });

  } catch (error) {
    console.error("[API] Error:", error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend API running on http://localhost:${PORT}`);
});
