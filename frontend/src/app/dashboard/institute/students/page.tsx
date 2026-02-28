"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Users, 
  Search, 
  Filter, 
  Plus,
  Download,
  Eye,
  Mail,
  Award,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import InstituteSidebar from "@/components/dashboard/institute/InstituteSidebar";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import RoleGuard from "@/components/auth/RoleGuard";
import StudentProfileModal from "@/components/dashboard/institute/StudentProfileModal";
import toast from "react-hot-toast";

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
  credentials?: any[];
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

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    newThisMonth: 0,
    withCredentials: 0
  });

  useEffect(() => {
    fetchStudents();
    fetchStats();
  }, [currentPage, searchTerm]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/institute/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats({
            totalStudents: data.analytics.overview.totalStudents,
            activeStudents: data.analytics.overview.activeStudents,
            newThisMonth: data.analytics.overview.newThisMonth || 0, // Use real backend data
            withCredentials: data.analytics.overview.totalStudents // All students have credentials since we only track those with credentials
          });
        }
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search: searchTerm
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/institute/students?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } else {
        toast.error("Failed to fetch students");
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to fetch students");
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

  const fetchStudentDetails = async (studentId: string) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      // Find the original student data from our students array
      const originalStudent = students.find(s => s._id === studentId);
      if (!originalStudent) return;

      // Fetch student's credentials
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${studentId}/credentials`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.student) {
          // Transform backend response to match our Student interface
          const backendStudent = data.student;
          const studentWithDetails: Student = {
            _id: originalStudent._id,
            fullName: backendStudent.fullName || originalStudent.fullName,
            email: backendStudent.email || originalStudent.email,
            profilePic: originalStudent.profilePic,
            institute: backendStudent.institute || originalStudent.institute || {
              name: "Unknown Institute",
              aishe_code: "UNK001"
            },
            role: originalStudent.role || "learner",
            createdAt: originalStudent.createdAt,
            isVerified: originalStudent.isVerified,
            credentialsCount: backendStudent.credentials?.length || originalStudent.credentialsCount,
            credentials: backendStudent.credentials || [],
            skills: backendStudent.skills,
            skillsData: backendStudent.skillsData, // For radar chart
            phone: backendStudent.phone,
            location: backendStudent.location,
            bio: backendStudent.bio,
            projects: backendStudent.projects,
            experience: backendStudent.experience,
            resumeUrl: backendStudent.resumeUrl,
            resumeFileName: backendStudent.resumeFileName
          };
          setSelectedStudent(studentWithDetails);
          setIsModalOpen(true);
        } else {
          // Fallback if API response is not in expected format
          throw new Error('Invalid response format');
        }
      } else {
        toast.error('Failed to fetch student details');
      }
    } catch (error) {
      console.error("Error fetching student details:", error);
      toast.error("Failed to load student details");
    }
  };

  const handleViewStudent = (student: Student) => {
    fetchStudentDetails(student._id);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  return (
    <RoleGuard allowedRole="institute">
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50/30 to-violet-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-violet-900/10">
        {/* Mobile header */}
        <div className="md:hidden sticky top-0 z-40 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between p-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                Students
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
                  Students Management
                </h1>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
                  Manage and monitor your institute's students
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
                    placeholder="Search students by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 w-full"
                  />
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
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
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
                      Total Students
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {loading ? "..." : stats.totalStudents}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Active Students
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {loading ? "..." : stats.activeStudents}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Received credentials in last 30 days
                </p>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      New This Month
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {loading ? "..." : stats.newThisMonth}
                    </p>
                  </div>
                  <Plus className="h-8 w-8 text-purple-500" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      With Credentials
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {loading ? "..." : stats.withCredentials}
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-orange-500" />
                </div>
              </div>
            </div>

            {/* Students Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Students List
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Loading students...</p>
                  </div>
                ) : students.length === 0 ? (
                  <div className="p-8 text-center">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No students found</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Credentials
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Joined
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {students.map((student) => (
                        <tr key={student._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center">
                                {student.profilePic ? (
                                  <img
                                    src={student.profilePic}
                                    alt="Profile"
                                    className="h-10 w-10 rounded-full"
                                  />
                                ) : (
                                  <span className="text-white text-sm font-medium">
                                    {student.fullName.firstName[0]}{student.fullName.lastName[0]}
                                  </span>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {student.fullName.firstName} {student.fullName.lastName}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {student.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Award className="h-4 w-4 text-purple-500 mr-2" />
                              <span className="text-sm text-gray-900 dark:text-white">
                                {student.credentialsCount}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              student.isVerified 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {student.isVerified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {new Date(student.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleViewStudent(student)}
                                className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 p-1 rounded hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors"
                                title="View Profile"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button 
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                                title="Send Email"
                              >
                                <Mail className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Pagination */}
              {!loading && students.length > 0 && (
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

        {/* Student Profile Modal */}
        <StudentProfileModal
          student={selectedStudent}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
        </div>
      </div>
    </RoleGuard>
  );
}