// =====================================================================
// 4_entityExtractor.js — STEP 2: CSV → Structured JSON
// =====================================================================
//
// Reads the TMDB movies.csv file directly.
// No LLM required! The CSV already contains JSON arrays for cast, crew, etc.
// Extracts only what we need for the Graph and Vector DB.
// =====================================================================

import fs from "fs";
import csv from "csv-parser";

/**
 * Safely parse JSON strings from the CSV.
 * TMDB CSV sometimes uses single quotes or broken JSON.
 */
function safeJSONParse(str) {
  try {
    // TMDB CSV sometimes has "" instead of " inside strings, but csv-parser handles standard CSV escaping.
    // However, if the string itself uses single quotes instead of double quotes for JSON:
    const fixedStr = str.replace(/'/g, '"');
    return JSON.parse(str);
  } catch (e) {
    // Fallback if parsing fails
    try {
      return JSON.parse(str.replace(/'/g, '"'));
    } catch (e2) {
      return [];
    }
  }
}

/**
 * Extract ALL entities from the CSV file.
 * Returns an array of entities formatted for Neo4j and Pinecone.
 */
async function extractAllEntities(csvPath) {
  console.log("   📂 Parsing CSV file:", csvPath);

  return new Promise((resolve, reject) => {
    const results = [];
    let count = 0;

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (data) => {
        // Process all movies in the CSV file

        try {
          const title = data.title || data.original_title;
          if (!title) return; // Skip if no title

          const year = data.release_date ? parseInt(data.release_date.split("-")[0]) : 0;
          
          const genresList = safeJSONParse(data.genres || "[]").map(g => g.name);
          const themesList = safeJSONParse(data.keywords || "[]").map(k => k.name);
          
          const castList = safeJSONParse(data.cast || "[]");
          const actors = castList.slice(0, 5).map(a => a.name); // Top 5 actors

          const crewList = safeJSONParse(data.crew || "[]");
          const directorObj = crewList.find(c => c.job === "Director");
          const director = directorObj ? directorObj.name : "Unknown Director";

          results.push({
            movie: { title, year },
            director: { name: director },
            actors: actors,
            genres: genresList,
            themes: themesList,
            awards: [] // TMDB CSV does not have awards data
          });

          count++;
        } catch (err) {
          console.warn(`   ⚠️ Skipping a row due to parse error: ${err.message}`);
        }
      })
      .on("end", () => {
        console.log(`   ✅ Successfully extracted ${results.length} movies from CSV.`);
        resolve(results);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

export { extractAllEntities };