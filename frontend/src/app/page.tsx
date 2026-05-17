import WavyBackground from "@/components/ui/wavy-background";
import { LiquidQueryBox } from "@/components/ui/liquid-query-box";

export default function MovieNavigator() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-black selection:bg-blue-500/30">
      {/* Layer 0: The WebGL Mesh Background */}
      <WavyBackground className="absolute inset-0 z-0" />

      {/* Foreground Content Wrapper */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        
        {/* Header/Branding */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white md:text-6xl drop-shadow-lg">
            GenAI Movie Navigator
          </h1>
          <p className="text-lg text-blue-100/80 drop-shadow">
            Powered by LangGraph • Pinecone • Neo4j
          </p>
        </div>

        {/* Layer 1 & 2: The Liquid Glass Input and Results */}
        <div className="w-full">
          <LiquidQueryBox />
        </div>
        
      </div>
    </main>
  );
}
