"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Search, MapPin, Filter, Briefcase, Clock, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JobDetailsModal } from "@/components/jobs";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import RoleGuard from "@/components/auth/RoleGuard";
import { ConfigProvider, theme as antdTheme } from "antd";
import api from "@/utils/axios";

const Sidebar = dynamic(() => import("@/components/dashboard/Sidebar"), { ssr: false });

interface Job {
  id: string;
  jobTitle: string;
  package: string;
  location: string;
  qualification: string;
  experience: string;
  description: string;
  skills: string[];
  contactEmail: string;
  contactPhone: string;
  status: string;
  createdAt: string;
  hasApplied?: boolean;
  applicationStatus?: string;
  applicationDate?: string;
  employer?: {
    id: string;
    fullName?: {
      firstName?: string;
      lastName?: string;
    };
    email: string;
  } | null;
}

function JobsPageContent() {
  const router = useRouter();
  const { theme: mode } = useTheme();
  const isDark = (mode ?? "light") === "dark";
  const [mounted, setMounted] = useState(false);
  
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [skillsFilter, setSkillsFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
      return;
    }
  }, [router]);

  const fetchJobs = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page: page.toString(),
        limit: "9",
        ...(searchTerm && { search: searchTerm }),
        ...(locationFilter && { location: locationFilter }),
        ...(skillsFilter && { skills: skillsFilter }),
      };

      const token = localStorage.getItem("authToken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await api.get('/api/job-posts', { 
        params,
        headers 
      });
      
      if (response.data.success) {
        setJobs(response.data.jobs);
        setTotalPages(response.data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      // Don't redirect on error, just show empty jobs list
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(1);
    setCurrentPage(1);
  }, [searchTerm, locationFilter, skillsFilter]);

  const handleJobClick = (job: Job) => {
    if (!job || !job.id) {
      console.error('Invalid job data:', job);
      return;
    }
    console.log('Opening job details for:', job.jobTitle);
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  const handleModalClose = () => {
    setShowJobDetails(false);
    setSelectedJob(null);
    // Refresh jobs list to get updated application status
    fetchJobs(currentPage);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getExperienceColor = (experience: string) => {
    const exp = experience.toLowerCase();
    if (exp.includes('fresher') || exp.includes('0')) return 'bg-green-100 text-green-800';
    if (exp.includes('1') || exp.includes('2')) return 'bg-blue-100 text-blue-800';
    if (exp.includes('3') || exp.includes('4') || exp.includes('5')) return 'bg-purple-100 text-purple-800';
    return 'bg-orange-100 text-orange-800';
  };

  const formatEmployerName = (fullName?: { firstName?: string; lastName?: string } | string | null): string => {
    if (typeof fullName === 'string') {
      return fullName || 'Unknown Employer';
    }
    if (fullName && typeof fullName === 'object') {
      const { firstName = '', lastName = '' } = fullName;
      return `${firstName} ${lastName}`.trim() || 'Unknown Employer';
    }
    return 'Unknown Employer';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'closed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  if (!mounted) return null;

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorBgBase: "var(--color-background)",
          colorBgContainer: "var(--color-card)",
          colorBgElevated: "var(--color-card)",
          colorText: "var(--color-foreground)",
          colorTextSecondary: "var(--color-muted-foreground)",
          colorBorder: "var(--color-border)",
          colorPrimary: "var(--color-primary)",
          colorLink: "var(--color-primary)",
          colorLinkHover: "var(--color-primary)",
          borderRadius: 12,
        },
        components: {
          Modal: {
            headerBg: "var(--color-card)",
            contentBg: "var(--color-card)",
            footerBg: "var(--color-card)",
            titleColor: "var(--color-foreground)",
            colorText: "var(--color-foreground)",
          },
          Card: {
            colorBgContainer: "var(--color-card)",
            headerBg: "var(--color-card)",
          },
        },
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 text-foreground flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                💼 Job Opportunities
              </h1>
              <p className="text-sm text-muted-foreground">Discover your next career opportunity • Updated in real-time</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span>{jobs.length} jobs available</span>
              </div>
              <ThemeToggleButton
                variant="gif"
                url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif"
              />
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-emerald-50 dark:bg-emerald-900/40 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-emerald-200 dark:border-emerald-700 rounded-md bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Location..."
                value={locationFilter}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocationFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-emerald-200 dark:border-emerald-700 rounded-md bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <input
              type="text"
              placeholder="Skills (comma separated)..."
              value={skillsFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSkillsFilter(e.target.value)}
              className="w-full px-4 py-2 border border-emerald-200 dark:border-emerald-700 rounded-md bg-white dark:bg-gray-800 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setLocationFilter("");
                setSkillsFilter("");
              }}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Clear Filters
            </Button>
          </div>

          {/* Jobs Grid */}
          <div className="mt-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse bg-emerald-100 dark:bg-emerald-900/40 rounded-lg shadow-md p-6 border border-emerald-200 dark:border-emerald-800">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {jobs.map((job) => (
                  <div 
                    key={job.id} 
                    className="group cursor-pointer hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:scale-[1.02] overflow-hidden"
                    onClick={() => handleJobClick(job)}
                  >
                    {/* Header Section */}
                    <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight">
                            {job.jobTitle}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
                            {formatEmployerName(job.employer?.fullName)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 ml-4 items-end">
                          <Badge variant="outline" className={`text-xs font-medium ${getStatusColor(job.status)}`}>
                            {job.status}
                          </Badge>
                          {job.hasApplied && (
                            <Badge 
                              variant={job.applicationStatus === 'pending' ? 'default' : 
                                      job.applicationStatus === 'reviewed' ? 'secondary' :
                                      job.applicationStatus === 'shortlisted' ? 'default' :
                                      job.applicationStatus === 'hired' ? 'default' : 'destructive'} 
                              className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700"
                            >
                              {job.applicationStatus === 'pending' && '⏳ Applied'}
                              {job.applicationStatus === 'reviewed' && '👀 Reviewed'}  
                              {job.applicationStatus === 'shortlisted' && '⭐ Shortlisted'}
                              {job.applicationStatus === 'hired' && '🎉 Hired'}
                              {job.applicationStatus === 'rejected' && '❌ Rejected'}
                              {!job.applicationStatus && '✅ Applied'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Content Section */}
                    <div className="p-6 space-y-4">
                      {/* Key Info Grid */}
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{job.location}</span>
                        </div>
                        
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{job.package}</span>
                        </div>

                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                          <Badge className={`${getExperienceColor(job.experience)} text-xs font-medium`} variant="secondary">
                            {job.experience}
                          </Badge>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="pt-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                          {job.description}
                        </p>
                      </div>

                      {/* Skills */}
                      {job.skills && job.skills.length > 0 && (
                        <div className="pt-2">
                          <div className="flex flex-wrap gap-2">
                            {job.skills.slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700">
                                {skill}
                              </Badge>
                            ))}
                            {job.skills.length > 3 && (
                              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600">
                                +{job.skills.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Section */}
                    <div className="p-6 pt-0 flex justify-between items-center border-t border-gray-100 dark:border-gray-700 mt-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Posted {formatDate(job.createdAt)}
                      </span>
                      <Button 
                        size="sm" 
                        className={job.hasApplied 
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" 
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm group-hover:shadow-md transition-all duration-200"
                        }
                        disabled={job.hasApplied}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJobClick(job);
                        }}
                      >
                        {job.hasApplied ? 'Already Applied' : 'View Details'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {jobs.length === 0 && !loading && (
                <div className="text-center py-12 bg-card/50 rounded-lg border border-border">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No jobs found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search filters or check back later for new opportunities.
                  </p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newPage = currentPage - 1;
                      setCurrentPage(newPage);
                      fetchJobs(newPage);
                    }}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-4 py-2 text-sm text-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newPage = currentPage + 1;
                      setCurrentPage(newPage);
                      fetchJobs(newPage);
                    }}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
          </div>

          {/* Job Details Modal */}
          {selectedJob && (
            <JobDetailsModal
              job={selectedJob}
              open={showJobDetails}
              onClose={handleModalClose}
            />
          )}
        </main>
      </div>
    </ConfigProvider>
  );
}

export default function JobsPage() {
  return (
    <RoleGuard allowedRole="learner">
      <JobsPageContent />
    </RoleGuard>
  );
}
