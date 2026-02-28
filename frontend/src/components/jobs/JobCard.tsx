"use client";

import React from "react";
import { motion } from "framer-motion";
import { MapPin, DollarSign, Clock, Building, Star, ExternalLink, Bookmark } from "lucide-react";
import { JobPosting } from "@/types/jobs";

interface JobCardProps {
  job: JobPosting;
  score?: number;
  onBookmark?: (jobId: string) => void;
  isBookmarked?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ job, score, onBookmark, isBookmarked = false }) => {
  const formatSalary = (salaryRange?: string) => {
    if (!salaryRange) return "Salary not disclosed";
    return salaryRange;
  };

  const getExperienceColor = (level?: string) => {
    if (!level) return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
    switch (level.toLowerCase()) {
      case "entry": return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      case "mid": return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
      case "senior": return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300";
      default: return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
    }
  };

  const getWorkTypeColor = (type?: string) => {
    if (!type) return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
    switch (type.toLowerCase()) {
      case "remote": return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300";
      case "hybrid": return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300";
      case "onsite": return "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300";
      default: return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
    }
  };

  const formatExperienceLevel = (level?: string) => {
    if (!level) return "Mid Level"; // Default fallback
    return level.charAt(0).toUpperCase() + level.slice(1) + " Level";
  };

  const formatWorkType = (type?: string) => {
    if (!type) return "Hybrid"; // Default fallback
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -2 }}
      className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 p-6 hover:shadow-lg transition-all duration-200 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              {job.company.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {job.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Building className="h-4 w-4" />
                {job.company}
              </p>
            </div>
          </div>

          {/* Score Badge */}
          {score && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full text-xs font-medium">
                <Star className="h-3 w-3 fill-current" />
                {Math.round(score)}% Match
              </div>
            </div>
          )}
        </div>

        {/* Bookmark Button */}
        {onBookmark && (
          <button
            onClick={() => onBookmark(job.id)}
            className={`p-2 rounded-lg transition-colors ${
              isBookmarked
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-400"
            }`}
          >
            <Bookmark className={`h-5 w-5 ${isBookmarked ? "fill-current" : ""}`} />
          </button>
        )}
      </div>

      {/* Job Details */}
      <div className="space-y-3 mb-4">
        {/* Work Type */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <MapPin className="h-4 w-4" />
            {job.location}
          </div>
          {job.work_type && (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getWorkTypeColor(job.work_type)}`}
            >
              {formatWorkType(job.work_type)}
            </span>
          )}
        </div>

        {/* Salary & Experience */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
            <DollarSign className="h-4 w-4" />
            {formatSalary(job.salary_range)}
          </div>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getExperienceColor(job.experience_level)}`}
          >
            {formatExperienceLevel(job.experience_level)}
          </span>
        </div>

        {/* Posted Date */}
        {job.posted_date && (
          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <Clock className="h-4 w-4" />
            Posted {new Date(job.posted_date).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Description */}
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
        {job.description}
      </p>

      {/* Skills */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {job.skills_required.slice(0, 5).map((skill: string, index: number) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 dark:bg-zinc-700 text-gray-700 dark:text-gray-300 text-xs rounded-md"
            >
              {skill}
            </span>
          ))}
          {job.skills_required.length > 5 && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 text-xs rounded-md">
              +{job.skills_required.length - 5} more
            </span>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex items-center justify-between">
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          <ExternalLink className="h-4 w-4" />
          View Details
        </button>
        
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {job.applicants || 0} applicants
        </div>
      </div>
    </motion.div>
  );
};

export default JobCard;
