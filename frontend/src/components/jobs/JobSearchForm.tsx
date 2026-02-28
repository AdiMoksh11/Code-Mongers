"use client";

import React, { useState } from "react";
import { Search, MapPin, DollarSign, Clock, Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { JobSearchFilters } from "@/types/jobs";

interface JobSearchFormProps {
  onSearch: (query: string, filters: Partial<JobSearchFilters>) => void;
  loading?: boolean;
  onClose?: () => void;
}

const JobSearchForm: React.FC<JobSearchFormProps> = ({ onSearch, loading = false, onClose }) => {
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Partial<JobSearchFilters>>({
    location: "",
    experience_level: "",
    work_type: "",
    salary_min: 0,
    salary_max: 200000,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, filters);
  };

  const handleFilterChange = (key: keyof JobSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      location: "",
      experience_level: "",
      work_type: "",
      salary_min: 0,
      salary_max: 200000,
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header - Fixed */}
      <div className="p-6 border-b border-gray-200 dark:border-zinc-700 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Job Search</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Find your next opportunity with AI-powered recommendations
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Search Form - Scrollable */}
      <div className="flex-1 overflow-y-auto p-6" 
           style={{ scrollbarWidth: 'thin', scrollbarColor: '#9CA3AF #F3F4F6' }}>
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Main Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for jobs, companies, or skills..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                showFilters
                  ? "bg-blue-50 dark:bg-blue-600/20 border-blue-200 dark:border-blue-500 text-blue-700 dark:text-blue-300"
                  : "bg-gray-50 dark:bg-zinc-700 border-gray-200 dark:border-zinc-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-600"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>

            {/* Quick location filter */}
            <div className="relative flex-1 min-w-[200px]">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.location || ""}
                onChange={(e) => handleFilterChange("location", e.target.value)}
                placeholder="Location"
                className="w-full pl-10 pr-3 py-2 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Advanced Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-gray-50 dark:bg-zinc-700/50 rounded-xl border border-gray-200 dark:border-zinc-600"
              >
                <div className="space-y-4">
                  {/* Experience Level */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Experience Level
                    </label>
                    <select
                      value={filters.experience_level || ""}
                      onChange={(e) => handleFilterChange("experience_level", e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Any Level</option>
                      <option value="entry">Entry Level</option>
                      <option value="mid">Mid Level</option>
                      <option value="senior">Senior Level</option>
                    </select>
                  </div>

                  {/* Work Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Work Type
                    </label>
                    <select
                      value={filters.work_type || ""}
                      onChange={(e) => handleFilterChange("work_type", e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Any Type</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">On-site</option>
                    </select>
                  </div>

                  {/* Salary Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <DollarSign className="inline h-4 w-4 mr-1" />
                      Salary Range
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <input
                          type="number"
                          value={filters.salary_min || ""}
                          onChange={(e) => handleFilterChange("salary_min", parseInt(e.target.value) || 0)}
                          placeholder="Min"
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <span className="text-gray-400">to</span>
                      <div className="flex-1">
                        <input
                          type="number"
                          value={filters.salary_max || ""}
                          onChange={(e) => handleFilterChange("salary_max", parseInt(e.target.value) || 200000)}
                          placeholder="Max"
                          className="w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Company Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Type
                    </label>
                    <select
                      value={filters.company_type || ""}
                      onChange={(e) => handleFilterChange("company_type", e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Any Company</option>
                      <option value="startup">Startup</option>
                      <option value="corporate">Corporate</option>
                      <option value="agency">Agency</option>
                      <option value="nonprofit">Non-profit</option>
                    </select>
                  </div>

                  {/* Posted Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      <Clock className="inline h-4 w-4 mr-1" />
                      Posted Within
                    </label>
                    <select
                      value={filters.posted_within || ""}
                      onChange={(e) => handleFilterChange("posted_within", e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Any Time</option>
                      <option value="1d">Last 24 hours</option>
                      <option value="3d">Last 3 days</option>
                      <option value="1w">Last week</option>
                      <option value="2w">Last 2 weeks</option>
                      <option value="1m">Last month</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Clear all filters
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-5 w-5" />
                Search Jobs
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default JobSearchForm;
