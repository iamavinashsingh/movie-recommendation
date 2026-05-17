import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "neo4j-driver",
    "@pinecone-database/pinecone",
    "@huggingface/inference",
  ],
};

export default nextConfig;
