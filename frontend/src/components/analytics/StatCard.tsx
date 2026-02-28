"use client";

import React from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode | string;
  trend: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend }) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    className="p-6 rounded-2xl bg-white/50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 shadow-md hover:shadow-xl hover:shadow-blue-500/10 dark:hover:shadow-blue-400/10 transition-all duration-300 flex flex-col gap-3"
  >
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600 dark:text-gray-300">{title}</span>
      <div className="text-blue-600 dark:text-blue-400">{icon}</div>
    </div>
    <h3 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">{value}</h3>
    <span className="text-sm text-green-600 font-semibold">{trend}</span>
  </motion.div>
);

export default StatCard;
