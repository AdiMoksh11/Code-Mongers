"use client";

import { useState, useEffect } from "react";
import { X, MapPin, DollarSign, Clock, Phone, Mail, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import api from "@/utils/axios";

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

interface JobDetailsModalProps {
  job: Job;
  open: boolean;
  onClose: () => void;
}

export default function JobDetailsModal({ job, open, onClose }: JobDetailsModalProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState("");
  const [applied, setApplied] = useState(job?.hasApplied || false);
  const [currentJob, setCurrentJob] = useState(job);

  // Early return if no job data
  if (!job) {
    return null;
  }

  // Fetch fresh job details when modal opens
  useEffect(() => {
    if (open && job.id) {
      const fetchJobDetails = async () => {
        try {
          const token = localStorage.getItem("authToken");
          if (!token) return;

          const response = await api.get(`/api/job-posts/${job.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.data.success) {
            setCurrentJob(response.data.job);
            setApplied(response.data.job.hasApplied || false);
            // ...existing code...
          }
        } catch (error) {
          // ...existing code...
        }
      };

      fetchJobDetails();
    }
  }, [open, job.id]);

  // Update applied state when job changes
  useEffect(() => {
    const hasApplied = currentJob.hasApplied || false;
  // ...existing code...
    setApplied(hasApplied);
  }, [currentJob.hasApplied, currentJob.applicationStatus]);

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

  const handleApply = async () => {
    // Prevent applying if already applied (this should not happen due to button state, but extra safety)
    const isCurrentlyApplied = applied || currentJob.hasApplied;
    if (isCurrentlyApplied) {
      return;
    }

    setIsApplying(true);
    try {
      const response = await api.post(`/api/job-posts/${currentJob.id}/apply`, { 
        message: applicationMessage 
      });

      if (response.data.success) {
        setApplied(true);
        alert('Application submitted successfully! The employer will review your application.');
      } else {
        alert(response.data.message || 'Failed to apply for the job. Please try again.');
      }
    } catch (error: any) {
  // ...existing code...
      
      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorMessage = error.response.data?.message || 'Bad request';
        if (errorMessage.includes('already applied')) {
          setApplied(true); // Update local state to reflect server state
        } else {
          alert(errorMessage);
        }
      } else if (error.response?.status === 401) {
        alert('Please login to apply for jobs.');
      } else {
        alert('Failed to apply for the job. Please try again.');
      }
    } finally {
      setIsApplying(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!open) return null;

  // Debug: Check application status
  const isApplied = applied || currentJob.hasApplied;
  // ...existing code...

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{currentJob.jobTitle}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Company and basic info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatEmployerName(currentJob.employer?.fullName)}
              </h3>
              <Badge variant="outline" className={`border-0 ${getStatusColor(currentJob.status)}`}>
                {currentJob.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <MapPin className="h-4 w-4" />
                <span>{currentJob.location}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <DollarSign className="h-4 w-4" />
                <span>{currentJob.package}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Clock className="h-4 w-4" />
                <span>{currentJob.experience} experience</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <Briefcase className="h-4 w-4" />
                <span>{currentJob.qualification}</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-white">Job Description</h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
              {currentJob.description}
            </p>
          </div>

          {/* Skills */}
          {currentJob.skills && currentJob.skills.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">Required Skills</h4>
              <div className="flex flex-wrap gap-2">
                {currentJob.skills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          {(currentJob.contactEmail || currentJob.contactPhone) && (
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 dark:text-white">Contact Information</h4>
              <div className="space-y-2">
                {currentJob.contactEmail && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Mail className="h-4 w-4" />
                    <a href={`mailto:${currentJob.contactEmail}`} className="hover:text-cyan-600">
                      {currentJob.contactEmail}
                    </a>
                  </div>
                )}
                {currentJob.contactPhone && (
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${currentJob.contactPhone}`} className="hover:text-cyan-600">
                      {currentJob.contactPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Posted Date */}
          <div className="text-sm text-gray-500">
            Posted on {formatDate(currentJob.createdAt)}
          </div>

          {/* Application Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            {isApplied ? (
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2">
                  {currentJob.applicationStatus === 'pending' && (
                    <div className="text-blue-600 dark:text-blue-400 font-semibold">
                      ⏳ Application Pending
                    </div>
                  )}
                  {currentJob.applicationStatus === 'reviewed' && (
                    <div className="text-purple-600 dark:text-purple-400 font-semibold">
                      👀 Application Reviewed
                    </div>
                  )}
                  {currentJob.applicationStatus === 'shortlisted' && (
                    <div className="text-yellow-600 dark:text-yellow-400 font-semibold">
                      ⭐ You've been Shortlisted!
                    </div>
                  )}
                  {currentJob.applicationStatus === 'hired' && (
                    <div className="text-green-600 dark:text-green-400 font-semibold">
                      🎉 Congratulations! You're Hired!
                    </div>
                  )}
                  {currentJob.applicationStatus === 'rejected' && (
                    <div className="text-red-600 dark:text-red-400 font-semibold">
                      ❌ Application Not Selected
                    </div>
                  )}
                  {!currentJob.applicationStatus && (
                    <div className="text-green-600 dark:text-green-400 font-semibold">
                      ✅ Application Submitted Successfully!
                    </div>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  {currentJob.applicationStatus === 'hired' 
                    ? 'The employer will contact you with next steps.'
                    : currentJob.applicationStatus === 'shortlisted'
                    ? 'The employer may contact you soon for the next round.'
                    : currentJob.applicationStatus === 'rejected'
                    ? 'Thank you for your interest. Keep applying to other opportunities!'
                    : 'The employer has been notified and will contact you if you\'re selected.'
                  }
                </p>
                <Button variant="outline" onClick={onClose} className="mt-4">
                  Close
                </Button>
              </div>
            ) : job.status !== 'active' ? (
              <div className="text-center space-y-4">
                <div className="text-orange-600 dark:text-orange-400 font-semibold">
                  ⚠️ This job is no longer accepting applications
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  This job posting has been {job.status}. Please check other available opportunities.
                </p>
                <Button variant="outline" onClick={onClose} className="mt-4">
                  Close
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Apply for this Job</h4>
                <div className="space-y-3">
                  <textarea
                    placeholder="Add a message to your application (optional)..."
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    rows={4}
                    disabled={isApplied}
                  />
                  <div className="flex gap-3">
                    <Button
                      onClick={handleApply}
                      disabled={isApplying || isApplied}
                      className={`flex-1 ${
                        isApplied 
                          ? 'bg-green-600 text-white cursor-not-allowed opacity-75' 
                          : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                      } ${isApplying ? 'opacity-75 cursor-not-allowed' : ''}`}
                    >
                      {isApplied ? '✓ Applied' : isApplying ? 'Applying...' : 'Apply Now'}
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}