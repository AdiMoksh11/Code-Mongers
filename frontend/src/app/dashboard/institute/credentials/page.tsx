"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Award, 
  Search, 
  Filter, 
  Plus,
  Download,
  Eye,
  Edit,
  Calendar,
  User,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock
} from "lucide-react";
import InstituteSidebar from "@/components/dashboard/institute/InstituteSidebar";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import RoleGuard from "@/components/auth/RoleGuard";
import { CredentialDetailsModal } from "@/components/dashboard/credentials/CredentialDetailsModal";
import { ImageViewerModal } from "@/components/dashboard/credentials/ImageViewerModal";
import IssueCredentialModal from "@/components/dashboard/credentials/IssueCredentialModal";
import { CredentialDetails } from "@/types/credentials";
import toast from "react-hot-toast";

interface Credential {
  _id: string;
  title: string;
  issuer: string;
  type: string;
  status: string;
  issuerVerification?: {
    status: 'pending' | 'verified';
    verifiedAt?: string;
    verifiedBy?: string;
  };
  issueDate: string;
  description?: string;
  nsqfLevel?: number;
  creditPoints?: number;
  user: {
    _id: string;
    fullName: {
      firstName: string;
      lastName: string;
    };
    email: string;
  };
  createdAt: string;
}

export default function CredentialsPage() {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  
  // Modal states
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedCredentialDetails, setSelectedCredentialDetails] = useState<CredentialDetails | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");

  useEffect(() => {
    fetchCredentials();
  }, [currentPage, searchTerm, typeFilter, statusFilter]);

  const fetchCredentials = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search: searchTerm,
        type: typeFilter,
        status: statusFilter
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/institute/credentials?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCredentials(data.credentials);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } else {
        toast.error("Failed to fetch credentials");
      }
    } catch (error) {
      console.error("Error fetching credentials:", error);
      toast.error("Failed to fetch credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearchTerm(search);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'certificate':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'degree':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'license':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'badge':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };



  // Modal handlers
  const handleViewCredential = async (credentialId: string) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/institute/credentials/${credentialId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        setSelectedCredentialDetails({
          credential: data.credential,
          anchored: data.anchored,
          blockchain: data.blockchain,
          verificationUrl: data.verificationUrl
        });
        setIsDetailsModalOpen(true);
      } else {
        toast.error("Failed to fetch credential details");
      }
    } catch (error) {
      console.error("Error fetching credential details:", error);
      toast.error("Failed to fetch credential details");
    }
  };

  const handleViewImage = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setIsImageModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedCredentialDetails(null);
  };

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImageUrl("");
  };

  // Verification handler
  const handleVerifyCredential = async (credentialId: string) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/institute/credentials/${credentialId}/verify`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        toast.success("Credential verified successfully!");
        
        // Update the credential in the list
        setCredentials(prev => prev.map(cred => 
          cred._id === credentialId 
            ? { ...cred, issuerVerification: { status: 'verified' } }
            : cred
        ));
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to verify credential");
      }
    } catch (error) {
      console.error("Error verifying credential:", error);
      toast.error("Failed to verify credential");
    }
  };

  return (
    <RoleGuard allowedRole="institute">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-violet-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-violet-900/10">
        {/* Mobile header */}
        <div className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Credentials
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
            </div>
          </div>
        </div>

        <div className="md:flex">
          <InstituteSidebar />
          
          <div className="flex-1 overflow-y-auto w-full">
            {/* Desktop Top Bar */}
            <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between p-4 md:p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                  Credentials Management
                </h1>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
                  Manage digital credentials issued by your institute
                </p>
              </div>
              <div className="flex items-center gap-2 md:gap-4">
                <LanguageSwitcher />
                <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
            </div>
          </div>

          <div className="p-4 md:p-8">
            {/* Header Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 md:mb-8 gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full lg:w-auto">
                <div className="relative flex-1 sm:w-80 lg:w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search credentials..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Types</option>
                    <option value="certificate">Certificate</option>
                    <option value="degree">Degree</option>
                    <option value="license">License</option>
                    <option value="badge">Badge</option>
                  </select>
                  
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">All Status</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Search
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsIssueModalOpen(true)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Issue Credential
                </button>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Total Issued
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {loading ? "..." : total}
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-purple-500" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Verified
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {loading ? "..." : credentials.filter(c => c.issuerVerification?.status === 'verified').length}
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      This Month
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {loading ? "..." : Math.floor(total * 0.15)}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Avg NSQF Level
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {loading ? "..." : "5.2"}
                    </p>
                  </div>
                  <BookOpen className="h-8 w-8 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Credentials Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Issued Credentials
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Loading credentials...</p>
                  </div>
                ) : credentials.length === 0 ? (
                  <div className="p-8 text-center">
                    <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No credentials found</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Credential
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Recipient
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Issuer Verification
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          NSQF Level
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Issue Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {credentials.map((credential) => (
                        <tr key={credential._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {credential.title}
                              </div>
                              {credential.description && (
                                <div className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                                  {credential.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-purple-500 flex items-center justify-center mr-3">
                                <span className="text-white text-xs font-medium">
                                  {credential.user.fullName.firstName[0]}{credential.user.fullName.lastName[0]}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {credential.user.fullName.firstName} {credential.user.fullName.lastName}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                  {credential.user.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(credential.type)}`}>
                              {credential.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              credential.issuerVerification?.status === 'verified' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            }`}>
                              {credential.issuerVerification?.status === 'verified' ? (
                                <CheckCircle className="h-3 w-3" />
                              ) : (
                                <Clock className="h-3 w-3" />
                              )}
                              {credential.issuerVerification?.status || 'pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {credential.nsqfLevel ? `Level ${credential.nsqfLevel}` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {new Date(credential.issueDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button 
                                className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                                onClick={() => handleViewCredential(credential._id)}
                                title="View credential details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {(!credential.issuerVerification || credential.issuerVerification.status === 'pending') ? (
                                <button 
                                  className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                                  onClick={() => handleVerifyCredential(credential._id)}
                                  title="Verify credential as issuer"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                              ) : (
                                <div className="text-green-500" title="Verified by issuer">
                                  <CheckCircle className="h-4 w-4" />
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {!loading && credentials.length > 0 && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, total)} of {total} results
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => Math.abs(page - currentPage) <= 2)
                      .map(page => (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1 rounded-md ${
                            page === currentPage
                              ? 'bg-purple-500 text-white'
                              : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 rounded-md border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        <CredentialDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetailsModal}
          details={selectedCredentialDetails}
          onViewImage={handleViewImage}
        />

        <ImageViewerModal
          onClose={handleCloseImageModal}
          imageUrl={isImageModalOpen ? selectedImageUrl : null}
        />

        <IssueCredentialModal
          isOpen={isIssueModalOpen}
          onClose={() => setIsIssueModalOpen(false)}
          onSuccess={() => {
            fetchCredentials();
            setIsIssueModalOpen(false);
          }}
        />
        </div>
      </div>
    </RoleGuard>
  );
}