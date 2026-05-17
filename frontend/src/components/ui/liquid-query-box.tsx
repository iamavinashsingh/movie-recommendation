"use client";

import React, { useState } from "react";
import { Search, Loader2, Star, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// The SVG filter that creates the physical glass distortion
function GlassFilter() {
  return (
    <svg className="hidden">
      <defs>
        <filter
          id="container-glass"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.05 0.05"
            numOctaves="1"
            seed="1"
            result="turbulence"
          />
          <feGaussianBlur in="turbulence" stdDeviation="2" result="blurredNoise" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="blurredNoise"
            scale="70"
            xChannelSelector="R"
            yChannelSelector="B"
            result="displaced"
          />
          <feGaussianBlur in="displaced" stdDeviation="4" result="finalBlur" />
          <feComposite in="finalBlur" in2="finalBlur" operator="over" />
        </filter>
      </defs>
    </svg>
  );
}

interface MovieResult {
  id: string;
  title: string;
  year: string;
  match: string;
  director?: string;
  genres?: string;
  themes?: string;
  actors?: string;
}

export function LiquidQueryBox({ className }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<MovieResult[] | null>(null);
  const [textAnswer, setTextAnswer] = useState<string | null>(null);
  const [classification, setClassification] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setResults(null);
    setTextAnswer(null);
    setClassification(null);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      
      if (data.text) {
        setTextAnswer(data.text);
      }
      if (data.classification) {
        setClassification(data.classification);
      }
      
      if (data.results && data.results.length > 0) {
        setResults(data.results.slice(0, 10)); // Show top 10 for the UI grid
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setResults([]);
      setTextAnswer("Failed to query the Serverless AI backend. Check your terminal logs or env config.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasContent = (results && results.length > 0) || textAnswer;

  return (
    <div
      className={cn(
        "relative mx-auto transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        hasContent ? "w-full max-w-5xl" : "w-full max-w-2xl",
        className
      )}
    >
      {/* --- LAYER 1: Shadow & Highlight Edge Effects --- */}
      <div
        className="absolute inset-0 -z-10 rounded-3xl transition-all duration-700
          shadow-[0_0_6px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3px_rgba(255,255,255,0.2),inset_-3px_-3px_0.5px_-3px_rgba(0,0,0,0.4),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.3),inset_0_0_6px_6px_rgba(255,255,255,0.05),0_0_15px_rgba(255,255,255,0.1)]
          dark:shadow-[0_0_8px_rgba(0,0,0,0.03),0_2px_6px_rgba(0,0,0,0.08),inset_3px_3px_0.5px_-3.5px_rgba(255,255,255,0.09),inset_-3px_-3px_0.5px_-3.5px_rgba(255,255,255,0.85),inset_1px_1px_1px_-0.5px_rgba(255,255,255,0.6),inset_0_0_6px_6px_rgba(255,255,255,0.12),0_0_12px_rgba(0,0,0,0.15)]"
      />

      {/* --- LAYER 2: Glass Distortion Background --- */}
      <div
        className="absolute inset-0 isolate -z-20 overflow-hidden rounded-3xl bg-white/5 dark:bg-black/10"
        style={{ backdropFilter: 'url("#container-glass") blur(12px)' }}
      />
      <GlassFilter />

      {/* --- LAYER 3: Interactive Content --- */}
      <div className="relative z-10 flex flex-col p-4 md:p-6">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/70">
             {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            placeholder="I want a twisty sci-fi movie with a strong female lead..."
            className="h-14 w-full bg-transparent text-lg text-white placeholder:text-white/40 focus:outline-none disabled:opacity-50"
          />
          
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="flex h-12 shrink-0 items-center justify-center rounded-full bg-white/20 px-6 font-semibold text-white transition-colors hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Ask AI
          </button>
        </form>

        {/* AI Answer & Movie Results Area */}
        <div
          className={cn(
            "grid transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
            hasContent ? "mt-8 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
          )}
        >
          <div className="overflow-hidden space-y-6">
            
            {/* Glassmorphic AI Text Answer Box (Shown only for factual queries when no card results exist) */}
            {textAnswer && (!results || results.length === 0) && (
              <div className="relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-5 md:p-6 shadow-2xl backdrop-blur-md transition-all duration-500 hover:bg-white/10">
                <div className="flex items-center gap-2 mb-3 text-blue-400 font-semibold tracking-wider text-xs uppercase">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  <span>AI GraphRAG Answer {classification ? `(${classification})` : ""}</span>
                </div>
                <p className="text-white/95 text-base md:text-lg leading-relaxed whitespace-pre-line font-light drop-shadow-sm">
                  {textAnswer}
                </p>
              </div>
            )}

            {/* Movie Card Grid */}
            {results && results.length > 0 && (
              <div>
                <h3 className="mb-4 text-xl font-medium tracking-tight text-white/90">
                  Top Matches for your graph query
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {results.map((movie) => (
                    <div
                      key={movie.id}
                      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-black/40 p-5 transition-all hover:bg-black/60 border border-white/5"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-white text-lg leading-tight">{movie.title}</h4>
                          <p className="text-sm text-white/60 mt-1">{movie.year} • {movie.director}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-1 text-xs font-medium text-blue-200">
                          <Star className="h-3 w-3 fill-current" />
                          {movie.match}
                        </div>
                      </div>
                      
                      <div className="space-y-3 mt-auto">
                        {movie.genres && (
                          <div className="text-xs text-white/70">
                            <span className="font-semibold text-white/90">Genres:</span> {movie.genres}
                          </div>
                        )}
                        {movie.actors && (
                          <div className="text-xs text-white/70 line-clamp-2">
                            <span className="font-semibold text-white/90">Cast:</span> {movie.actors}
                          </div>
                        )}
                        {movie.themes && (
                          <div className="text-xs text-white/70 line-clamp-2">
                            <span className="font-semibold text-white/90">Themes:</span> {movie.themes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
