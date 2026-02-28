"use client";

import React from "react";
import { motion } from "framer-motion";

const FilterToolbar = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-wrap items-center gap-4 bg-white/50 dark:bg-zinc-800/80 border border-gray-200 dark:border-zinc-700 p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
  >
    <select className="px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300">
      <option>All Skills</option>
      <option>AI/ML</option>
      <option>Cloud</option>
      <option>Cybersecurity</option>
      <option>Data Analytics</option>
    </select>
    <select className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200">
      <option>All Regions</option>
      <option>North</option>
      <option>South</option>
      <option>East</option>
      <option>West</option>
    </select>
    <select className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-800 dark:text-gray-200">
      <option>Last 30 days</option>
      <option>Last 90 days</option>
      <option>1 year</option>
    </select>
  </motion.div>
);

export default FilterToolbar;
