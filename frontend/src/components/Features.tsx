"use client";

import React, { useState } from "react";
import { Brain, ShieldCheck, BarChart2, Share2 } from "lucide-react";
import Feature3DIcon from "@/components/3d/Feature3DIcon";

export default function Features() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const features = [
    {
      icon: <Brain />,
      icon3D: 'neural' as const,
      title: "AI Skill Mapping",
      desc: "Automatically analyze your learning history and create a dynamic skill graph with AI.",
    },
    {
      icon: <ShieldCheck />,
      icon3D: 'blockchain' as const,
      title: "Blockchain Verification",
      desc: "Every credential is secured and tamper-proof with blockchain-backed verification.",
    },
    {
      icon: <BarChart2 />,
      icon3D: 'chart' as const,
      title: "Unified Dashboard",
      desc: "Track achievements, progress, and stackable pathways from a single smart dashboard.",
    },
    {
      icon: <Share2 />,
      icon3D: 'globe' as const,
      title: "Global Recognition",
      desc: "Easily share your verified profile with universities, employers, and professional networks.",
    },
  ];

  return (
    <section className="container mx-auto px-6 py-20">
      <h2 className="text-4xl font-bold mb-12 text-center">
        Why <span className="text-blue-600 dark:text-blue-400">Credexa?</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((f, idx) => (
          <div
            key={idx}
            className="group flex flex-col gap-6 p-6 rounded-2xl border transition-all duration-500 
                       bg-white/50 border-gray-200
                       dark:bg-zinc-800/80 dark:border-zinc-700
                       hover:shadow-xl hover:-translate-y-2 
                       hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10
                       hover:border-blue-300 dark:hover:border-blue-500
                       animate-[fadeInUp_0.8s_ease-out_forwards]"
            style={{ animationDelay: `${idx * 0.2}s`, animationFillMode: "backwards" }}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 bg-blue-100 dark:bg-zinc-900 rounded-full flex items-center justify-center transition-transform duration-500 ease-in-out group-hover:scale-110">
                {/* 3D Icon */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Feature3DIcon
                    type={f.icon3D}
                    isHovered={hoveredIndex === idx}
                    className="w-full h-full"
                  />
                </div>
                {/* Fallback 2D Icon */}
                <div className="text-blue-600 dark:text-blue-400 text-2xl opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                  {f.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold">{f.title}</h3>
            </div>

            <p className="text-gray-600 dark:text-gray-300">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
