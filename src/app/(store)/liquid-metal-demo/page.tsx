import { LiquidMetalButtonDemo } from "@/components/ui/liquid-metal-button-demo";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Liquid Metal Button Demo | NUTRATEIN",
  description: "Interactive demo of the Liquid Metal Button shader component."
};

export default function LiquidMetalDemoPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-8 text-white">
      <div className="text-center mb-10">
        <div className="inline-block px-3 py-1 mb-3 text-xs font-bold uppercase tracking-wider rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30">
          Interactive WebGL Shader
        </div>
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-zinc-100">
          Liquid Metal 3D Button
        </h1>
        <p className="mt-2 text-sm text-zinc-400 max-w-md mx-auto">
          Hardware-accelerated liquid metallic fragment shader with ripple physics and 3D depth.
        </p>
      </div>

      <div className="p-10 rounded-2xl bg-zinc-900/80 border border-zinc-800 shadow-2xl backdrop-blur-md">
        <LiquidMetalButtonDemo />
      </div>
    </div>
  );
}
