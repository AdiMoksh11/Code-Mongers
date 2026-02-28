"use client";

import { useEffect, useState, ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, X, ShieldAlert, CheckCircle, AlertCircle, Loader2, Eye, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import Sidebar from "@/components/dashboard/Sidebar";
import RoleGuard from "@/components/auth/RoleGuard";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import api from "@/utils/axios";
import InstituteSelector from "@/components/InstituteSelector";
import PlatformSync from "@/components/profile/PlatformSync";

interface UserProject {
  _id?: string;
  title: string;
  description?: string;
  imageUrl?: string;
  projectUrl?: string;
  githubUrl?: string;
  technologies?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface UserProfile {
  _id: string;
  fullName: { firstName: string; lastName: string; };
  username?: string;
  email: string | null;
  phone?: string;
  profilePic: string;
  provider: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
    instagram?: string;
    facebook?: string;
  };
  projects?: UserProject[];
  resume?: {
    fileName: string;
    fileUrl: string;
    fileType: string;
    uploadedAt: string;
    fileSize: number;
  };
  platformSync?: {
    [key: string]: {
      profileUrl: string;
      isConnected: boolean;
      lastSyncAt?: string;
      verified?: boolean;
    };
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [emailVerificationRequired, setEmailVerificationRequired] = useState(false);
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(0);

  const [formData, setFormData] = useState({ 
    firstName: "", 
    lastName: "", 
    email: "", 
    username: "", 
    phone: "" 
  });
  const [socialLinks, setSocialLinks] = useState({
    linkedin: "",
    github: "",
    twitter: "",
    portfolio: "",
    instagram: "",
    facebook: "",
  });
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  
  // Projects state
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [editingProject, setEditingProject] = useState<UserProject | null>(null);
  const [newProject, setNewProject] = useState<UserProject>({
    title: "",
    description: "",
    projectUrl: "",
    githubUrl: "",
    technologies: []
  });
  const [projectImageFile, setProjectImageFile] = useState<File | null>(null);
  const [projectImagePreview, setProjectImagePreview] = useState<string | null>(null);
  
  const isSocialProvider = user && !['email', 'web3'].includes(user.provider);
  const isNameLocked = !!(isSocialProvider && user?.fullName?.firstName);
  const isEmailLocked = !!(isSocialProvider && user?.email);

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) return router.replace("/login");

    api.get("/api/users/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((res: any) => {
        const userData = res.data.user;
        setUser(userData);
        setFormData({
          firstName: userData.fullName?.firstName || "",
          lastName: userData.fullName?.lastName || "",
          email: userData.email || "",
          username: userData.username || "",
          phone: userData.phone || "",
        });
        setSocialLinks({
          linkedin: userData.socialLinks?.linkedin || "",
          github: userData.socialLinks?.github || "",
          twitter: userData.socialLinks?.twitter || "",
          portfolio: userData.socialLinks?.portfolio || "",
          instagram: userData.socialLinks?.instagram || "",
          facebook: userData.socialLinks?.facebook || "",
        });
        setProjects(userData.projects || []);
      })
      .catch(() => {
        localStorage.removeItem("authToken");
        router.replace("/login?error=session_expired");
      })
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const hasTextChanged =
      formData.firstName !== (user.fullName?.firstName || "") ||
      formData.lastName !== (user.fullName?.lastName || "") ||
      formData.email !== (user.email || "") ||
      formData.username !== (user.username || "") ||
      formData.phone !== (user.phone || "");
    
    const hasSocialLinksChanged = Object.keys(socialLinks).some(
      key => socialLinks[key as keyof typeof socialLinks] !== (user.socialLinks?.[key as keyof typeof socialLinks] || "")
    );
    
    const hasFileChanged = !!profilePicFile || !!resumeFile;
    setIsFormDirty(hasTextChanged || hasSocialLinksChanged || hasFileChanged);
  }, [formData, socialLinks, profilePicFile, resumeFile, user]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    if (e.target.name === 'username') {
      setUsernameAvailable(null);
      if (e.target.value.length >= 3) {
        checkUsernameAvailability(e.target.value);
      }
    }
  };

  const handleSocialLinksChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSocialLinks({ ...socialLinks, [e.target.name]: e.target.value });
  };

  const checkUsernameAvailability = async (username: string) => {
    if (username === user?.username) {
      setUsernameAvailable(true);
      return;
    }
    
    setCheckingUsername(true);
    try {
      const token = localStorage.getItem("authToken");
      const response = await api.get(`/api/users/check-username/${username}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsernameAvailable(response.data.available);
    } catch (error) {
      setUsernameAvailable(false);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePicFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleResumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload PDF, DOC, DOCX, or image files only.");
        e.target.value = ''; // Clear the input
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size too large. Maximum 10MB allowed.");
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Show warning if user already has a resume with valid data
      if (user?.resume?.fileName && user?.resume?.fileUrl) {
        const confirmReplace = window.confirm(
          `⚠️ Warning: You already have a resume "${user.resume.fileName}". ` +
          `Selecting a new file will permanently delete your current resume and replace it with "${file.name}". ` +
          `Do you want to continue?`
        );
        
        if (!confirmReplace) {
          e.target.value = ''; // Clear the input if user cancels
          return;
        }
        
        toast(`Your current resume will be replaced when you save changes.`, { 
          duration: 4000,
          icon: '⚠️'
        });
      }
      
      setResumeFile(file);
    }
  };

  const handleDeleteResume = async () => {
    const token = localStorage.getItem("authToken");
    try {
      await api.delete("/api/users/me/resume", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Refresh user data
      const userResponse = await api.get("/api/users/me", { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      setUser(userResponse.data.user);
      
      // Clear the file input and selected file
      setResumeFile(null);
      const fileInput = document.getElementById('resumeUpload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      toast.success("Resume deleted successfully");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to delete resume";
      toast.error(errorMessage);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("Saving changes...");

    if (!user) {
        toast.error("User data not loaded.", { id: toastId });
        setIsSubmitting(false);
        return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      toast.error("Session expired.", { id: toastId });
      setIsSubmitting(false);
      return router.replace('/login');
    }

    const formPayload = new FormData();

    if (formData.firstName !== (user.fullName?.firstName || "")) formPayload.append("firstName", formData.firstName);
    if (formData.lastName !== (user.fullName?.lastName || "")) formPayload.append("lastName", formData.lastName);
    if (formData.email !== (user.email || "")) formPayload.append("email", formData.email);
    if (formData.username !== (user.username || "")) formPayload.append("username", formData.username);
    if (formData.phone !== (user.phone || "")) formPayload.append("phone", formData.phone);
    
    // Check if social links have changed
    const socialLinksChanged = Object.keys(socialLinks).some(
      key => socialLinks[key as keyof typeof socialLinks] !== (user.socialLinks?.[key as keyof typeof socialLinks] || "")
    );
    if (socialLinksChanged) {
      formPayload.append("socialLinks", JSON.stringify(socialLinks));
    }
    
    if (profilePicFile) formPayload.append("profilePic", profilePicFile);

    try {
      // First update profile data
      const response = await api.put("/api/users/me", formPayload, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      
      // Handle resume upload separately
      if (resumeFile) {
        const resumeFormData = new FormData();
        resumeFormData.append("resume", resumeFile);
        
        await api.post("/api/users/me/resume", resumeFormData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
      }
      
      if (response.data.emailVerificationRequired) {
        toast.success(response.data.message, { id: toastId, duration: 4000 });
        setEmailVerificationRequired(true);
        setCountdown(30); // Start the timer on the modal
      } else {
        // Refresh user data to get updated info
        const userResponse = await api.get("/api/users/me", { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setUser(userResponse.data.user);
        setPreviewUrl(null);
        
        // Clear the file inputs after successful submission
        setResumeFile(null);
        const fileInput = document.getElementById('resumeUpload') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        
        toast.success("Profile updated successfully!", { id: toastId });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to update profile.";
      toast.error(`Error: ${errorMessage}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
      setProfilePicFile(null);
      setResumeFile(null);
      
      // Clear the file input in all cases (success or error)
      const fileInput = document.getElementById('resumeUpload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };

  const handleOtpSubmit = async () => {
    if (otp.length < 6 || isSubmitting) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Verifying OTP...");
    const token = localStorage.getItem("authToken");

    try {
      const response = await api.post("/api/users/me/verify-email", { otp }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
      setFormData({ ...formData, email: response.data.user.email });
      toast.success(response.data.message, { id: toastId });
      setEmailVerificationRequired(false);
      setOtp("");
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "OTP verification failed.";
      toast.error(`Error: ${errorMessage}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    const toastId = toast.loading("Resending OTP...");
    const token = localStorage.getItem("authToken");
     try {
       const response = await api.post("/api/users/me/resend-verify-email", {}, {
         headers: { Authorization: `Bearer ${token}` }
       });
       toast.success(response.data.message, { id: toastId });
       setCountdown(30); 
     } catch (error: any) {
       const errorMessage = error.response?.data?.message || "Failed to resend OTP.";
       toast.error(`Error: ${errorMessage}`, { id: toastId });
     }
  };

  const handleOtpKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleOtpSubmit();
    }
  };

  // Project management functions
  const handleProjectImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload only image files (JPEG, PNG, GIF, WebP).");
        e.target.value = '';
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size too large. Maximum 5MB allowed.");
        e.target.value = '';
        return;
      }
      
      setProjectImageFile(file);
      setProjectImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProjectInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (editingProject) {
      setEditingProject({ ...editingProject, [name]: value });
    } else {
      setNewProject({ ...newProject, [name]: value });
    }
  };

  const handleTechnologiesChange = (e: ChangeEvent<HTMLInputElement>) => {
    const technologies = e.target.value.split(',').map(tech => tech.trim()).filter(tech => tech);
    if (editingProject) {
      setEditingProject({ ...editingProject, technologies });
    } else {
      setNewProject({ ...newProject, technologies });
    }
  };

  const handleAddProject = () => {
    setIsAddingProject(true);
    setEditingProject(null);
    setNewProject({
      title: "",
      description: "",
      projectUrl: "",
      githubUrl: "",
      technologies: []
    });
    setProjectImageFile(null);
    setProjectImagePreview(null);
  };

  const handleEditProject = (project: UserProject) => {
    setEditingProject(project);
    setIsAddingProject(true);
    setProjectImageFile(null);
    setProjectImagePreview(project.imageUrl || null);
  };

  const handleCancelProject = () => {
    setIsAddingProject(false);
    setEditingProject(null);
    setNewProject({
      title: "",
      description: "",
      projectUrl: "",
      githubUrl: "",
      technologies: []
    });
    setProjectImageFile(null);
    setProjectImagePreview(null);
  };

  const handleSaveProject = async () => {
    const token = localStorage.getItem("authToken");
    const projectData = editingProject || newProject;
    
    if (!projectData.title.trim()) {
      toast.error("Project title is required.");
      return;
    }

    const toastId = toast.loading(editingProject ? "Updating project..." : "Adding project...");
    
    try {
      const formData = new FormData();
      formData.append('title', projectData.title);
      if (projectData.description) formData.append('description', projectData.description);
      if (projectData.projectUrl) formData.append('projectUrl', projectData.projectUrl);
      if (projectData.githubUrl) formData.append('githubUrl', projectData.githubUrl);
      if (projectData.technologies) formData.append('technologies', JSON.stringify(projectData.technologies));
      if (projectImageFile) formData.append('projectImage', projectImageFile);

      let response;
      if (editingProject) {
        response = await api.put(`/api/users/me/projects/${editingProject._id}`, formData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
        });
      } else {
        response = await api.post('/api/users/me/projects', formData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
        });
      }

      setProjects(response.data.projects);
      handleCancelProject();
      toast.success(editingProject ? "Project updated successfully!" : "Project added successfully!", { id: toastId });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to save project.";
      toast.error(`Error: ${errorMessage}`, { id: toastId });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    
    const token = localStorage.getItem("authToken");
    const toastId = toast.loading("Deleting project...");
    
    try {
      const response = await api.delete(`/api/users/me/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProjects(response.data.projects);
      toast.success("Project deleted successfully!", { id: toastId });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Failed to delete project.";
      toast.error(`Error: ${errorMessage}`, { id: toastId });
    }
  };

  // Platform sync functions
  const handleConnectPlatform = async (platform: string, profileUrl: string) => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await api.put("/api/settings/platform-sync", { platform, profileUrl }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        if (platform !== 'coursera') toast.success(`${platform} connected successfully`);
        // Refresh user data to get updated platform sync settings
        const userResponse = await api.get("/api/users/me", { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setUser(userResponse.data);
      }
    } catch (error: any) {
      console.error("Connect platform error:", error);
      const errorMessage = error.response?.data?.message || "Failed to connect platform";
      toast.error(errorMessage);
      throw error;
    }
  };

  const handleDisconnectPlatform = async (platform: string) => {
    const token = localStorage.getItem("authToken");
    try {
      const response = await api.delete(`/api/settings/platform-sync/${platform}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success("Platform disconnected successfully");
        // Refresh user data to get updated platform sync settings
        const userResponse = await api.get("/api/users/me", { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        setUser(userResponse.data);
      }
    } catch (error: any) {
      console.error("Disconnect platform error:", error);
      const errorMessage = error.response?.data?.message || "Failed to disconnect platform";
      toast.error(errorMessage);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  
  return (
    <RoleGuard allowedRole="learner">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 text-gray-800 dark:text-gray-200 flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">Your Profile</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your personal information and showcase your achievements</p>
            </div>
            <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
          </div>

          {emailVerificationRequired && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-2xl max-w-sm w-full relative">
                 <button onClick={() => setEmailVerificationRequired(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
                    <X size={20}/>
                 </button>
                <h3 className="text-xl font-bold mb-2">Verify Your New Email</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">An OTP has been sent to your new email address.</p>
                <input type="text" value={otp} onKeyDown={handleOtpKeyDown} onChange={(e) => setOtp(e.target.value)} maxLength={6} className="w-full text-center text-2xl tracking-[0.5em] px-4 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500 mb-4" />
                <button onClick={handleOtpSubmit} disabled={isSubmitting || otp.length < 6} className="w-full mb-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-lg shadow-md transition disabled:bg-gray-400 flex items-center justify-center">
                  Verify & Update
                </button>
                <button onClick={handleResendOtp} disabled={countdown > 0} className="text-xs text-gray-500 hover:underline disabled:cursor-not-allowed disabled:opacity-50">
                  {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
                </button>
              </div>
            </div>
          )}

          <div className="max-w-4xl mx-auto bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-emerald-200 dark:border-emerald-800">
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
                <div className="relative">
                  <img src={previewUrl || user?.profilePic || `https://avatar.vercel.sh/${user?._id}.png`} alt="Profile Preview" className="w-32 h-32 rounded-full object-cover border-4 border-gradient-to-r from-emerald-400 to-teal-400 shadow-lg" onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://avatar.vercel.sh/${user?._id}.png`;
                  }} />
                  <div className="absolute inset-0 w-32 h-32 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 p-1">
                    <img src={previewUrl || user?.profilePic || `https://avatar.vercel.sh/${user?._id}.png`} alt="Profile Preview" className="w-full h-full rounded-full object-cover" onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://avatar.vercel.sh/${user?._id}.png`;
                    }} />
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <label htmlFor="profilePic" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Profile Picture</label>
                  <input id="profilePic" type="file" accept="image/*" onChange={handleFileChange} disabled={isSubmitting} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/20 dark:file:text-emerald-300" />
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG, or GIF. Max 5MB.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="md:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                </div>
                
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                  <input id="firstName" name="firstName" type="text" value={formData.firstName} onChange={handleInputChange} disabled={isSubmitting || isNameLocked} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed" />
                  {isNameLocked && <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1"><ShieldAlert size={12}/>Your name is managed by your social provider.</p>}
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                  <input id="lastName" name="lastName" type="text" value={formData.lastName} onChange={handleInputChange} disabled={isSubmitting || isNameLocked} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed" />
                </div>
                
                <div>
                   <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                   <input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} disabled={isSubmitting || isEmailLocked} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed" />
                   {isEmailLocked && <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1"><ShieldAlert size={12}/>Your email is managed by your social provider.</p>}
                </div>
                
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username (Optional)</label>
                  <div className="relative">
                    <input 
                      id="username" 
                      name="username" 
                      type="text" 
                      value={formData.username} 
                      onChange={handleInputChange} 
                      disabled={isSubmitting}
                      placeholder="Enter a unique username"
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg focus:ring-cyan-500 focus:border-cyan-500 pr-10" 
                    />
                    {checkingUsername && <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />}
                    {!checkingUsername && formData.username.length >= 3 && usernameAvailable !== null && (
                      usernameAvailable ? 
                        <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-green-500" /> :
                        <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                    )}
                  </div>
                  {formData.username.length >= 3 && usernameAvailable !== null && (
                    <p className={`text-xs mt-1 ${usernameAvailable ? 'text-green-600' : 'text-red-600'}`}>
                      {usernameAvailable ? '✓ Username is available' : '✗ Username is already taken'}
                    </p>
                  )}
                  {formData.username && formData.username.length < 3 && (
                    <p className="text-xs mt-1 text-gray-500">Username must be at least 3 characters long</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number (Optional)</label>
                  <input 
                    id="phone" 
                    name="phone" 
                    type="tel" 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                    disabled={isSubmitting} 
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed" 
                  />
                </div>
            </div>
            
            {/* Social Links Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Social Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="linkedin" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </label>
                  <input 
                    id="linkedin" 
                    name="linkedin" 
                    type="url" 
                    value={socialLinks.linkedin} 
                    onChange={handleSocialLinksChange} 
                    disabled={isSubmitting}
                    placeholder="https://linkedin.com/in/username"
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label htmlFor="github" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <svg className="w-4 h-4 text-gray-800 dark:text-gray-200" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                  </label>
                  <input 
                    id="github" 
                    name="github" 
                    type="url" 
                    value={socialLinks.github} 
                    onChange={handleSocialLinksChange} 
                    disabled={isSubmitting}
                    placeholder="https://github.com/username"
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label htmlFor="twitter" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <svg className="w-4 h-4 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    Twitter (X)
                  </label>
                  <input 
                    id="twitter" 
                    name="twitter" 
                    type="url" 
                    value={socialLinks.twitter} 
                    onChange={handleSocialLinksChange} 
                    disabled={isSubmitting}
                    placeholder="https://twitter.com/username"
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label htmlFor="portfolio" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                    Portfolio
                  </label>
                  <input 
                    id="portfolio" 
                    name="portfolio" 
                    type="url" 
                    value={socialLinks.portfolio} 
                    onChange={handleSocialLinksChange} 
                    disabled={isSubmitting}
                    placeholder="https://yourportfolio.com"
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label htmlFor="instagram" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <svg className="w-4 h-4 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Instagram
                  </label>
                  <input 
                    id="instagram" 
                    name="instagram" 
                    type="url" 
                    value={socialLinks.instagram} 
                    onChange={handleSocialLinksChange} 
                    disabled={isSubmitting}
                    placeholder="https://instagram.com/username"
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500" 
                  />
                </div>
                <div>
                  <label htmlFor="facebook" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <svg className="w-4 h-4 text-teal-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </label>
                  <input 
                    id="facebook" 
                    name="facebook" 
                    type="url" 
                    value={socialLinks.facebook} 
                    onChange={handleSocialLinksChange} 
                    disabled={isSubmitting}
                    placeholder="https://facebook.com/username"
                    className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500" 
                  />
                </div>
              </div>
            </div>
            
            {/* Projects Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Projects</h3>
                {!isAddingProject && (
                  <button
                    type="button"
                    onClick={handleAddProject}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Project
                  </button>
                )}
              </div>

              {/* Add/Edit Project Form */}
              {isAddingProject && (
                <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <h4 className="text-md font-medium mb-4">
                    {editingProject ? "Edit Project" : "Add New Project"}
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Project Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={editingProject?.title || newProject.title}
                        onChange={handleProjectInputChange}
                        placeholder="My Awesome Project"
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Technologies (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={(editingProject?.technologies || newProject.technologies || []).join(', ')}
                        onChange={handleTechnologiesChange}
                        placeholder="React, Node.js, MongoDB"
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={editingProject?.description || newProject.description}
                      onChange={handleProjectInputChange}
                      placeholder="Brief description of your project..."
                      rows={3}
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Project URL
                      </label>
                      <input
                        type="url"
                        name="projectUrl"
                        value={editingProject?.projectUrl || newProject.projectUrl}
                        onChange={handleProjectInputChange}
                        placeholder="https://myproject.com"
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        GitHub URL
                      </label>
                      <input
                        type="url"
                        name="githubUrl"
                        value={editingProject?.githubUrl || newProject.githubUrl}
                        onChange={handleProjectInputChange}
                        placeholder="https://github.com/username/repo"
                        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Project Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProjectImageChange}
                      className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 border rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    {projectImagePreview && (
                      <div className="mt-2">
                        <img
                          src={projectImagePreview}
                          alt="Project preview"
                          className="w-32 h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleSaveProject}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      {editingProject ? "Update Project" : "Add Project"}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelProject}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Projects List */}
              {projects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projects.map((project) => (
                    <div key={project._id} className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                      {project.imageUrl && (
                        <img
                          src={project.imageUrl}
                          alt={project.title}
                          className="w-full h-40 object-cover rounded-lg mb-3"
                        />
                      )}
                      
                      <h5 className="font-semibold text-lg mb-2">{project.title}</h5>
                      
                      {project.description && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{project.description}</p>
                      )}
                      
                      {project.technologies && project.technologies.length > 0 && (
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {project.technologies.map((tech, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900 text-cyan-800 dark:text-cyan-200 text-xs rounded-full"
                              >
                                {tech}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        {project.projectUrl && (
                          <a
                            href={project.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-cyan-600 hover:text-cyan-700 text-sm"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            Live Demo
                          </a>
                        )}
                        {project.githubUrl && (
                          <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                            </svg>
                            Code
                          </a>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditProject(project)}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project._id!)}
                          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                !isAddingProject && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-lg">No projects added yet</p>
                    <p className="text-sm">Add your first project to showcase your work!</p>
                  </div>
                )
              )}
            </div>
            
            {/* Resume Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Resume</h3>
              
              {/* Current Resume Display */}
              {user?.resume?.fileName && user?.resume?.fileUrl && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-cyan-500" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{user.resume.fileName}</p>
                        <p className="text-sm text-gray-500">
                          {(user.resume.fileSize / (1024 * 1024)).toFixed(2)} MB • 
                          Uploaded {new Date(user.resume.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => window.open(user.resume?.fileUrl, '_blank')}
                        className="p-2 text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg transition-colors"
                        title="View Resume"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteResume}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete Resume"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Resume Upload */}
              <div>
                <label htmlFor="resumeUpload" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {user?.resume?.fileName ? 'Replace Resume (PDF, DOC, DOCX, or Image)' : 'Upload Resume (PDF, DOC, DOCX, or Image)'}
                </label>
                <div className="flex items-center gap-4">
                  <label htmlFor="resumeUpload" className="flex-1 flex items-center justify-center px-6 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                    <div className="text-center">
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {resumeFile ? (
                          <span className="text-cyan-600 dark:text-cyan-400 flex items-center justify-center gap-2">
                            <FileText className="h-4 w-4" />
                            {resumeFile.name}
                          </span>
                        ) : (
                          <>
                            <span className="font-medium">Click to choose file</span>
                            <p className="text-xs mt-1">PDF, DOC, DOCX, JPG, PNG, GIF up to 10MB</p>
                          </>
                        )}
                      </div>
                    </div>
                    <input
                      id="resumeUpload"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                      className="hidden"
                      onChange={handleResumeChange}
                      disabled={isSubmitting}
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Uploading a new file will replace your current resume when you save changes.
                </p>
              </div>
            </div>
            
            {/* Institute Section */}
            <div className="mb-8">
              <InstituteSelector />
            </div>

            {/* Platform Sync Section */}
            <PlatformSync
              platformSync={user?.platformSync || {}}
              onConnectPlatform={handleConnectPlatform as any}
              onDisconnectPlatform={handleDisconnectPlatform as any}
            />

            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={isSubmitting || !isFormDirty || (!!formData.username && formData.username.length >= 3 && usernameAvailable === false)}
                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-lg shadow-md transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
    </RoleGuard>
  );
}
