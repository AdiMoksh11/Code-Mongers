"use client";

import React from "react";

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => {
  return (
    <div className="p-6 rounded-2xl bg-white/50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 shadow-md hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10 transition-all duration-300 flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
        {title}
      </h2>
      <div className="h-[400px]">{children}</div>
    </div>
  );
};

export default ChartCard;
