// =====================================================================
// 6_vectorStore.js — STEP 4: Movie Text → Embedding → Pinecone
// =====================================================================
import { embedTexts, pineconeIndex } from "./2_config.js";

function createEmbeddingText(entity) {
  const parts = [
    `${entity.movie.title} is a ${entity.genres.join(", ")} movie released in ${entity.movie.year}.`,
    `Directed by ${entity.director.name}.`,
    `Starring ${entity.actors.join(", ")}.`,
    `The movie explores themes of ${entity.themes.join(", ")}.`,
  ];
  if (entity.awards && entity.awards.length > 0) {
    parts.push(`Awards: ${entity.awards.join(", ")}.`);
  }
  return parts.join(" ");
}

/**
 * Store all movie embeddings in Pinecone.
 * includes 'Resume' logic to skip already indexed movies.
 */
async function buildVectorStore(entities) {
  console.log(`\n📐 Building vector store for ${entities.length} movies...\n`);

  const batchSize = 50;

  for (let i = 0; i < entities.length; i += batchSize) {
    const batch = entities.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(entities.length / batchSize);

    console.log(`   📦 Batch ${batchNum}/${totalBatches}: Processing...`);

    // 1. Generate IDs for this batch
    const batchWithIds = batch.map(entity => ({
      ...entity,
      id: entity.movie.title.replace(/\s+/g, "-").toLowerCase().replace(/[^\w-]/g, "")
    }));

    // 2. Check Pinecone for existing IDs
    let existingIds = [];
    try {
      const existingResult = await pineconeIndex.fetch(batchWithIds.map(m => m.id));
      existingIds = Object.keys(existingResult.records || {});
    } catch (err) {
      console.warn(`      ⚠️ Could not fetch existing IDs, will re-index this batch.`);
    }

    // 3. Find movies that are MISSING
    const missingMovies = batchWithIds.filter(m => !existingIds.includes(m.id));

    if (missingMovies.length === 0) {
      console.log(`      ⏭️ Skipping: All 50 movies already indexed.`);
      continue;
    }

    console.log(`      🚀 Embedding ${missingMovies.length} new movies...`);

    // 4. Generate embeddings
    const texts = missingMovies.map(m => createEmbeddingText(m));
    const vectors = await embedTexts(texts);

    if (!vectors || vectors.length === 0) {
      throw new Error("Hugging Face returned no vectors.");
    }

    // 5. Prepare records for Pinecone
    const records = missingMovies.map((entity, idx) => ({
      id: entity.id,
      values: vectors[idx],
      metadata: {
        title: entity.movie.title,
        year: entity.movie.year,
        director: entity.director.name,
        genres: entity.genres.join(", "),
        themes: entity.themes.join(", "),
        actors: entity.actors.join(", "),
        text: texts[idx],
      },
    }));

    // 6. Upsert to Pinecone
    if (records.length > 0) {
      await pineconeIndex.upsert({ records });
      console.log(`      ✅ Successfully indexed ${records.length} movies.`);
    }

    // Rate limiting delay
    if (i + batchSize < entities.length) {
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }

  const stats = await pineconeIndex.describeIndexStats();
  console.log(`\n✅ Vector store sync complete! Total vectors in Pinecone: ${stats.totalRecordCount}`);
}

export { buildVectorStore, createEmbeddingText };
