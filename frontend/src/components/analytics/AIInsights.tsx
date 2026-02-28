"use client";

import React from "react";
import { motion } from "framer-motion";
import { Brain, TrendingUp, BarChart } from "lucide-react";

const AIInsights = () => (
  <div className="flex flex-col gap-5 w-full">
    {/* AI Insights Card */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-2xl bg-gradient-to-br from-sky-600 via-cyan-600 to-blue-700 text-white shadow-xl backdrop-blur-sm border border-white/20 flex gap-4 items-start hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
    >
      <div className="flex-shrink-0">
        <Brain className="w-9 h-9 mt-1 text-white drop-shadow-md" />
      </div>
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          AI Insights <TrendingUp className="w-5 h-5 text-white/90" />
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-white/90">
          Cybersecurity demand is rising fastest in{" "}
          <span className="font-semibold">Delhi (+25%)</span>. Learners in{" "}
          <span className="font-semibold">Maharashtra</span> are 70% close to NSQF Level 6 Data Analyst pathway.  
          Recommended push:{" "}
          <span className="font-semibold">Advanced SQL + Data Visualization</span> courses.
        </p>
      </div>
    </motion.div>

    {/* Industry Trends Card */}
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="p-6 rounded-2xl bg-gradient-to-br from-indigo-700 via-blue-800 to-slate-900 text-white shadow-xl backdrop-blur-sm border border-white/20 flex gap-4 items-start hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
    >
      <div className="flex-shrink-0">
        <BarChart className="w-9 h-9 mt-1 text-white drop-shadow-md" />
      </div>
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          Industry Trends <TrendingUp className="w-5 h-5 text-white/90" />
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-white/90">
          Demand for <span className="font-semibold">renewable energy technicians</span> has grown by 15% in{" "}
          <span className="font-semibold">Karnataka</span> and{" "}
          <span className="font-semibold">Tamil Nadu</span>.  
          Suggest micro-credentials in{" "}
          <span className="font-semibold">solar panel installation</span> and{" "}
          <span className="font-semibold">wind turbine maintenance</span>.
        </p>
      </div>
    </motion.div>
  </div>
);

export default AIInsights;
