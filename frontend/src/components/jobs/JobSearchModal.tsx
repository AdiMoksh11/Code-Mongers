"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Filter, SortAsc } from "lucide-react";
import JobSearchForm from "./JobSearchForm";
import JobCard from "./JobCard";
import { JobPosting, JobSearchFilters } from "@/types/jobs";
import { JobSearchService } from "@/services/jobSearchService";

interface JobSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const JobSearchModal: React.FC<JobSearchModalProps> = ({ isOpen, onClose }) => {
  const [searchResults, setSearchResults] = useState<{ job: JobPosting; score: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [bookmarkedJobs, setBookmarkedJobs] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"relevance" | "date" | "salary">("relevance");

  const handleSearch = async (query: string, filters: Partial<JobSearchFilters>) => {
    setLoading(true);
    setHasSearched(true);
    
    try {
      const results = await JobSearchService.searchJobs(query, filters);
      setSearchResults(results);
    } catch (error) {
      console.error("Search failed:", error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = (jobId: string) => {
    setBookmarkedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const sortedResults = [...searchResults].sort((a, b) => {
    switch (sortBy) {
      case "relevance":
        return b.score - a.score;
      case "date":
        const dateA = a.job.posted_date ? new Date(a.job.posted_date).getTime() : 0;
        const dateB = b.job.posted_date ? new Date(b.job.posted_date).getTime() : 0;
        return dateB - dateA;
      case "salary":
        // Extract salary numbers for sorting (basic implementation)
        const salaryA = a.job.salary_range ? parseInt(a.job.salary_range.replace(/[^0-9]/g, "")) || 0 : 0;
        const salaryB = b.job.salary_range ? parseInt(b.job.salary_range.replace(/[^0-9]/g, "")) || 0 : 0;
        return salaryB - salaryA;
      default:
        return 0;
    }
  });

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchResults([]);
      setHasSearched(false);
      setLoading(false);
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-6xl h-[90vh] bg-white dark:bg-zinc-800 rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-full">
            {/* Search Form Panel */}
            <div className="w-1/3 min-w-[400px] bg-gray-50 dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-700 flex flex-col">
              <JobSearchForm onSearch={handleSearch} loading={loading} onClose={onClose} />
            </div>

            {/* Results Panel */}
            <div className="flex-1 bg-white dark:bg-zinc-800 flex flex-col">
              {/* Results Header */}
              {hasSearched && (
                <div className="p-6 border-b border-gray-200 dark:border-zinc-700 flex-shrink-0">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Search Results
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {loading ? "Searching..." : `${searchResults.length} jobs found`}
                      </p>
                    </div>

                    {!loading && searchResults.length > 0 && (
                      <div className="flex items-center gap-2">
                        <SortAsc className="h-4 w-4 text-gray-400" />
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value as any)}
                          className="px-3 py-1 text-sm bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
                        >
                          <option value="relevance">Best Match</option>
                          <option value="date">Most Recent</option>
                          <option value="salary">Highest Salary</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Results Content - Scrollable */}
              <div className="flex-1 overflow-y-auto"
                   style={{ scrollbarWidth: 'thin', scrollbarColor: '#9CA3AF #F3F4F6' }}>
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">Searching for jobs...</p>
                    </div>
                  </div>
                ) : hasSearched ? (
                  searchResults.length > 0 ? (
                    <div className="p-6 space-y-4">
                      <AnimatePresence>
                        {sortedResults.map((result, index) => (
                          <motion.div
                            key={result.job.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <JobCard
                              job={result.job}
                              score={result.score}
                              onBookmark={handleBookmark}
                              isBookmarked={bookmarkedJobs.has(result.job.id)}
                            />
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Filter className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          No jobs found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 max-w-md">
                          Try adjusting your search criteria or explore different keywords to find more opportunities.
                        </p>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Filter className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        Start your job search
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md">
                        Enter your desired role, skills, or company name to discover personalized job recommendations.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default JobSearchModal;
