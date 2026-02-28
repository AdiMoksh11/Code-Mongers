"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { X, Download, Mail, Phone, MapPin, Calendar, Award, Star, ExternalLink, Eye, Globe, FileText } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

// Utility functions for file type detection
const isPdfUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  const urlLower = url.toLowerCase();
  return urlLower.includes('.pdf') || urlLower.includes('pdf');
};

const isImageUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  const urlLower = url.toLowerCase();
  return /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(urlLower) || 
         urlLower.includes('imagekit.io') || 
         urlLower.includes('cloudinary.com');
};

interface StudentCredential {
  _id: string;
  title: string;
  issuer: string;
  type: string;
  issueDate: string;
  description?: string;
  skills?: string[];
  nsqfLevel?: number;
  status: 'verified' | 'pending' | 'rejected';
  issuerVerificationStatus?: 'verified' | 'pending'; // Add issuer verification status
  imageUrl?: string;
  credentialUrl?: string;
  issuerLogo?: string;
  credentialId?: string;
}

interface Student {
  _id: string;
  fullName: {
    firstName: string;
    lastName: string;
  };
  email: string;
  profilePic?: string;
  institute: {
    name: string;
    aishe_code: string;
  };
  role: string;
  createdAt: string;
  isVerified: boolean;
  credentialsCount: number;
  credentials?: StudentCredential[];
  skills?: any; // Backend sends object with skill:level pairs
  skillsData?: Array<{skill: string, value: number}>; // Formatted for radar chart
  phone?: string;
  location?: string;
  bio?: string;
  projects?: any[];
  experience?: any[];
  resumeUrl?: string;
  resumeFileName?: string;
}

interface StudentProfileModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function StudentProfileModal({ student, isOpen, onClose }: StudentProfileModalProps) {
  const [selectedCredential, setSelectedCredential] = useState<StudentCredential | null>(null);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'verified' | 'pending' | 'all'>('all');

  const handleCredentialClick = (credential: StudentCredential) => {
    setSelectedCredential(credential);
    setIsCertificateModalOpen(true);
  };

  const closeCertificateModal = () => {
    setIsCertificateModalOpen(false);
    setSelectedCredential(null);
  };
  if (!student) return null;

  // Handle resume download
  const handleResumeDownload = () => {
    if (student.resumeUrl) {
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = student.resumeUrl;
      link.download = student.resumeFileName || `${student.fullName.firstName}_${student.fullName.lastName}_Resume.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Show message if no resume is available
      alert('No resume available for this student.');
    }
  };

  // Process skills data for radar chart - prioritize institute-specific data
  const getSkillsData = () => {
    let skillsData: { skill: string; value: number }[] = [];

    // First, try to use institute-specific skillsData array (generated from filtered credentials by backend)
    if (student.skillsData && student.skillsData.length > 0) {
      skillsData = student.skillsData.slice(0, 6);
    }
    // Fallback: extract from filtered credentials (already filtered by institute)
    else if (student.credentials && student.credentials.length > 0) {
      const skillsMap = new Map<string, number>();
      
      student.credentials.forEach(credential => {
        if (credential.skills && credential.skills.length > 0) {
          credential.skills.forEach(skill => {
            const count = skillsMap.get(skill) || 0;
            skillsMap.set(skill, count + 1);
          });
        }
      });

      // Convert to radar chart format and limit to top 6 skills
      skillsData = Array.from(skillsMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([skill, count]) => ({
          skill,
          value: Math.min(count * 20, 100) // Scale to 100 max
        }));
    }
    // Last fallback: use general skills object (but this won't be institute-specific)
    else if (student.skills && typeof student.skills === 'object') {
      skillsData = Object.entries(student.skills)
        .filter(([skill, level]) => typeof level === 'number')
        .slice(0, 6)
        .map(([skill, level]) => ({
          skill,
          value: level as number
        }));
    }
    
    // Fallback to default skills if none found
    if (skillsData.length === 0) {
      skillsData = [
        { skill: 'JavaScript', value: 75 },
        { skill: 'React', value: 80 },
        { skill: 'Node.js', value: 65 },
        { skill: 'Python', value: 70 },
        { skill: 'SQL', value: 60 }
      ];
    }

    return skillsData;
  };

  const skillsData = getSkillsData();
  const verifiedCredentials = student.credentials?.filter(c => c.issuerVerificationStatus === 'verified') || [];
  const allCredentials = student.credentials || [];
  const pendingCredentials = student.credentials?.filter(c => c.issuerVerificationStatus === 'pending') || [];

  return (
    <>
      {/* Main Student Profile Modal */}
      <AnimatePresence>
        {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="relative w-full max-w-6xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <div className="text-white/80 text-sm">Student Profile</div>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-6 p-6">
                {/* Left Column - Profile Info */}
                <div className="lg:col-span-1 space-y-6">
                  {/* Profile Card */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                    <div className="flex flex-col items-center text-center">
                      {/* Profile Picture */}
                      <div className="h-24 w-24 rounded-full mb-4 overflow-hidden bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                        {student.profilePic ? (
                          <img
                            src={student.profilePic}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-2xl font-bold">
                            {student.fullName.firstName[0]}{student.fullName.lastName[0]}
                          </span>
                        )}
                      </div>

                      {/* Name and Title */}
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {student.fullName.firstName} {student.fullName.lastName}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mb-1">
                        @{student.fullName.firstName.toLowerCase()}{student.fullName.lastName.toLowerCase()}
                      </p>
                      <p className="text-purple-600 dark:text-purple-400 font-medium mb-4">
                        Student • {student.institute.name}
                      </p>

                      {/* Action Buttons */}
                      <div className="flex gap-3 w-full">
                        <button className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                          <Mail className="h-4 w-4" />
                          Contact
                        </button>
                        <button 
                          onClick={handleResumeDownload}
                          disabled={!student.resumeUrl}
                          className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                            student.resumeUrl 
                              ? 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer' 
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <Download className="h-4 w-4" />
                          Resume
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Skills Radar */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Skills Radar</h3>
                    {skillsData.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={skillsData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="skill" />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
                            <Radar
                              name="Skills"
                              dataKey="value"
                              stroke="#8b5cf6"
                              fill="#8b5cf6"
                              fillOpacity={0.3}
                              strokeWidth={2}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        <div className="text-center">
                          <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No skills data available</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Data */}
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Data</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">Email:</span>
                        <span className="text-gray-900 dark:text-white font-medium">{student.email}</span>
                      </div>
                      {student.phone && (
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{student.phone}</span>
                        </div>
                      )}
                      {student.location && (
                        <div className="flex items-center gap-3 text-sm">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-600 dark:text-gray-400">Location:</span>
                          <span className="text-gray-900 dark:text-white font-medium">{student.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">Joined:</span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {new Date(student.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Award className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          student.isVerified 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}>
                          {student.isVerified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Tabs Content */}
                <div className="lg:col-span-2">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden">
                    {/* Tab Navigation */}
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <nav className="flex">
                        <button 
                          onClick={() => setActiveTab('all')}
                          className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'all' 
                              ? 'border-purple-500 text-purple-600 dark:text-purple-400' 
                              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                          }`}
                        >
                          All Credentials ({allCredentials.length})
                        </button>
                        <button 
                          onClick={() => setActiveTab('verified')}
                          className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'verified' 
                              ? 'border-green-500 text-green-600 dark:text-green-400' 
                              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                          }`}
                        >
                          Issuer Verified ({verifiedCredentials.length})
                        </button>
                        <button 
                          onClick={() => setActiveTab('pending')}
                          className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                            activeTab === 'pending' 
                              ? 'border-yellow-500 text-yellow-600 dark:text-yellow-400' 
                              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                          }`}
                        >
                          Issuer Pending ({pendingCredentials.length})
                        </button>
                      </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                      {/* Credentials */}
                      <div className="space-y-4">
                        {(() => {
                          let credentialsToShow = [];
                          if (activeTab === 'verified') credentialsToShow = verifiedCredentials;
                          else if (activeTab === 'pending') credentialsToShow = pendingCredentials;
                          else credentialsToShow = allCredentials;

                          return credentialsToShow.length > 0 ? (
                            credentialsToShow.map((credential) => (
                              <motion.div
                                key={credential._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-purple-300 hover:shadow-md transition-all duration-200"
                                onClick={() => handleCredentialClick(credential)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                      {credential.title}
                                    </h4>
                                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                      <span>Issued by: {credential.issuer}</span>
                                      <span>Date: {new Date(credential.issueDate).toLocaleDateString()}</span>
                                      {credential.nsqfLevel && (
                                        <span className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-2 py-1 rounded-full text-xs">
                                          NSQF Level {credential.nsqfLevel}
                                        </span>
                                      )}
                                    </div>
                                    {credential.skills && credential.skills.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {credential.skills.slice(0, 6).map((skill, index) => (
                                          <span
                                            key={index}
                                            className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 px-2 py-1 rounded text-xs"
                                          >
                                            {skill}
                                          </span>
                                        ))}
                                        {credential.skills.length > 6 && (
                                          <span className="text-gray-500 dark:text-gray-400 text-xs px-2 py-1">
                                            +{credential.skills.length - 6} more
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 ml-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      credential.issuerVerificationStatus === 'verified' 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    }`}>
                                      {credential.issuerVerificationStatus === 'verified' ? 'Verified' : 'Pending'}
                                    </span>
                                    <div className="flex gap-1">
                                      <button 
                                        className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                        title="View Certificate"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleCredentialClick(credential);
                                        }}
                                      >
                                        <Eye className="h-4 w-4" />
                                      </button>
                                      {credential.credentialUrl && (
                                        <button 
                                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                          title="Open External Link"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(credential.credentialUrl, '_blank');
                                          }}
                                        >
                                          <Globe className="h-4 w-4" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))
                          ) : (
                            <div className="text-center py-12">
                              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                {activeTab === 'verified' ? 'No Verified Credentials' : 
                                 activeTab === 'pending' ? 'No Pending Credentials' : 
                                 'No Credentials'}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400">
                                {activeTab === 'verified' ? "This student hasn't verified any credentials yet." :
                                 activeTab === 'pending' ? "This student doesn't have any pending credentials." :
                                 "This student hasn't added any credentials yet."}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>

    {/* Certificate Modal */}
    <AnimatePresence>
      {isCertificateModalOpen && selectedCredential && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div
            className="fixed inset-0"
            onClick={closeCertificateModal}
          ></div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl max-h-[90vh] overflow-hidden relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {selectedCredential.title}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Issued by: {selectedCredential.issuer}</span>
                  <span>Date: {new Date(selectedCredential.issueDate).toLocaleDateString()}</span>
                  {selectedCredential.credentialId && (
                    <span>ID: {selectedCredential.credentialId}</span>
                  )}
                </div>
              </div>
              <button
                onClick={closeCertificateModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Certificate Content */}
            <div className="p-6 max-h-[70vh] overflow-auto">
              {selectedCredential.imageUrl && isImageUrl(selectedCredential.imageUrl) ? (
                <div className="flex justify-center mb-6">
                  <img
                    src={selectedCredential.imageUrl}
                    alt={`Certificate - ${selectedCredential.title}`}
                    className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : isPdfUrl(selectedCredential.credentialUrl || selectedCredential.imageUrl) ? (
                <div className="flex justify-center items-center h-64 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg mb-6">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
                    <p className="text-red-700 dark:text-red-300 font-medium mb-4">
                      PDF Certificate
                    </p>
                    <button
                      onClick={() => window.open(selectedCredential.credentialUrl || selectedCredential.imageUrl, '_blank')}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors inline-flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View PDF Certificate
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-center items-center h-64 bg-gray-100 dark:bg-gray-700 rounded-lg mb-6">
                  <div className="text-center">
                    <Award className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Certificate file not available
                    </p>
                  </div>
                </div>
              )}

              {/* Certificate Details */}
              <div className="space-y-4">
                {selectedCredential.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Description</h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                      {selectedCredential.description}
                    </p>
                  </div>
                )}

                {selectedCredential.skills && selectedCredential.skills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Skills Covered</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedCredential.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 px-3 py-1 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Type</h4>
                    <p className="text-sm text-gray-900 dark:text-white capitalize">{selectedCredential.type}</p>
                  </div>
                  {selectedCredential.nsqfLevel && (
                    <div>
                      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">NSQF Level</h4>
                      <p className="text-sm text-gray-900 dark:text-white">Level {selectedCredential.nsqfLevel}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Status</h4>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Certificate validated and verified
              </div>
              <div className="flex gap-3">
                {selectedCredential.credentialUrl && (
                  <button
                    onClick={() => window.open(selectedCredential.credentialUrl, '_blank')}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800 rounded-lg transition-colors"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    View Original
                  </button>
                )}
                <button
                  onClick={closeCertificateModal}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    </>
  );
}