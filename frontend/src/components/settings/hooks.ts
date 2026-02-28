"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Form } from "antd";
import api from "@/utils/axios";
import toast from "react-hot-toast";
import { useTheme } from "next-themes";

export function useSettingsData() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [profileForm] = Form.useForm();
  const [preferencesForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [privacyForm] = Form.useForm();

  const [twoFactorModal, setTwoFactorModal] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [twoFactorSecret, setTwoFactorSecret] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchSettings();
      fetchActiveSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const fetchSettings = async () => {
    try {
      const response = await api.get("/api/settings");
      if (response.data.success) {
        const userData = response.data.data;
        setUser(userData);

        profileForm.setFieldsValue({
          firstName: userData.fullName?.firstName || "",
          lastName: userData.fullName?.lastName || "",
          email: userData.email || "",
        });

        if (userData.settings?.preferences) {
          preferencesForm.setFieldsValue({
            theme: userData.settings.preferences.theme || "system",
            language: userData.settings.preferences.language || "en",
            timezone: userData.settings.preferences.timezone || "UTC",
            emailNotifications: userData.settings.preferences.notifications?.email ?? true,
            pushNotifications: userData.settings.preferences.notifications?.push ?? true,
            marketingNotifications: userData.settings.preferences.notifications?.marketing ?? false,
            securityNotifications: userData.settings.preferences.notifications?.security ?? true,
          });
        }

        if (userData.settings?.security) {
          securityForm.setFieldsValue({
            sessionTimeout: userData.settings.security.sessionTimeout || 30,
            loginNotifications: userData.settings.security.loginNotifications ?? true,
            twoFactorEnabled: userData.settings.security.twoFactorEnabled ?? false,
          });
        }

        if (userData.settings?.privacy) {
          privacyForm.setFieldsValue({
            profileVisibility: userData.settings.privacy.profileVisibility || "public",
            showEmail: userData.settings.privacy.showEmail ?? false,
            showCredentials: userData.settings.privacy.showCredentials ?? true,
            allowProfileIndexing: userData.settings.privacy.allowProfileIndexing ?? true,
          });
        }
      }
    } catch (error: any) {
      console.error("Fetch settings error:", error);
      toast.error("Failed to load settings");
      if (error.response?.status === 401) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const response = await api.get("/api/settings/security/sessions");
      if (response.data.success) setActiveSessions(response.data.data);
    } catch (error) {
      console.error("Fetch sessions error:", error);
    }
  };

  const updateProfile = async (values: any) => {
    try {
      if (!values.firstName?.trim() || !values.lastName?.trim()) {
        toast.error("First name and last name are required");
        return;
      }
      if (!values.email?.trim()) {
        toast.error("Email is required");
        return;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(values.email)) {
        toast.error("Please enter a valid email address");
        return;
      }
      if (values.newPassword) {
        if (!values.currentPassword) {
          toast.error("Current password is required to change password");
          return;
        }
        if (values.newPassword.length < 6) {
          toast.error("New password must be at least 6 characters long");
          return;
        }
        if (values.newPassword !== values.confirmPassword) {
          toast.error("New passwords do not match");
          return;
        }
        const hasUpperCase = /[A-Z]/.test(values.newPassword);
        const hasLowerCase = /[a-z]/.test(values.newPassword);
        const hasNumbers = /\d/.test(values.newPassword);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(values.newPassword);
        if (!(hasUpperCase && hasLowerCase && (hasNumbers || hasSpecial))) {
          toast.error("Password must contain uppercase, lowercase, and numbers or special characters");
          return;
        }
      }

      const payload: any = {
        fullName: {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
        },
        email: values.email.trim().toLowerCase(),
      };
      if (values.newPassword) {
        payload.currentPassword = values.currentPassword;
        payload.newPassword = values.newPassword;
      }

      const response = await api.put("/api/settings/profile", payload);
      if (response.data.success) {
        toast.success("Profile updated successfully");
        setUser(response.data.data);
        profileForm.resetFields(["currentPassword", "newPassword", "confirmPassword"]);
      }
    } catch (error: any) {
      console.error("Update profile error:", error);
      const errorMessage = error.response?.data?.message || "Failed to update profile";
      toast.error(errorMessage);
    }
  };

  const updatePreferences = async (values: any) => {
    try {
      const payload = {
        theme: values.theme,
        language: values.language,
        timezone: values.timezone,
        notifications: {
          email: values.emailNotifications,
          push: values.pushNotifications,
          marketing: values.marketingNotifications,
          security: values.securityNotifications,
        },
      };
      const response = await api.put("/api/settings/preferences", payload);
      if (response.data.success) {
        toast.success("Preferences updated successfully");
        if (values.theme !== theme) setTheme(values.theme);
      }
    } catch (error: any) {
      console.error("Update preferences error:", error);
      toast.error("Failed to update preferences");
    }
  };

  const updateSecurity = async (values: any) => {
    try {
      const payload = {
        sessionTimeout: values.sessionTimeout,
        loginNotifications: values.loginNotifications,
      };
      const response = await api.put("/api/settings/security", payload);
      if (response.data.success) toast.success("Security settings updated successfully");
    } catch (error: any) {
      console.error("Update security error:", error);
      toast.error("Failed to update security settings");
    }
  };

  const updatePrivacy = async (values: any) => {
    try {
      const response = await api.put("/api/settings/privacy", values);
      if (response.data.success) toast.success("Privacy settings updated successfully");
    } catch (error: any) {
      console.error("Update privacy error:", error);
      toast.error("Failed to update privacy settings");
    }
  };

  const handleEnable2FA = async () => {
    try {
      const response = await api.post("/api/settings/security/2fa", { enable: true });
      if (response.data.success) {
        if (response.data.qrCode) {
          setQrCode(response.data.qrCode);
          setTwoFactorSecret(response.data.secret);
          setTwoFactorModal(true);
        } else {
          toast.success("Two-factor authentication enabled");
          fetchSettings();
        }
      }
    } catch (error) {
      console.error("Enable 2FA error:", error);
      toast.error("Failed to enable two-factor authentication");
    }
  };

  const handleDisable2FA = async () => {
    try {
      const response = await api.post("/api/settings/security/2fa", { enable: false });
      if (response.data.success) {
        toast.success("Two-factor authentication disabled");
        fetchSettings();
      }
    } catch (error) {
      console.error("Disable 2FA error:", error);
      toast.error("Failed to disable two-factor authentication");
    }
  };

  const handleVerify2FA = async () => {
    try {
      const response = await api.post("/api/settings/security/2fa", { enable: true, token: verificationCode });
      if (response.data.success) {
        toast.success("Two-factor authentication enabled successfully");
        setTwoFactorModal(false);
        setVerificationCode("");
        setQrCode("");
        setTwoFactorSecret("");
        fetchSettings();
      }
    } catch (error: any) {
      console.error("Verify 2FA error:", error);
      toast.error(error.response?.data?.message || "Invalid verification code");
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      const response = await api.delete(`/api/settings/security/sessions/${sessionId}`);
      if (response.data.success) {
        toast.success("Session revoked successfully");
        fetchActiveSessions();
      }
    } catch (error: any) {
      console.error("Revoke session error:", error);
      toast.error("Failed to revoke session");
    }
  };

  const handleClearAllSessions = async () => {
    try {
      const response = await api.delete("/api/settings/security/sessions");
      if (response.data.success) {
        toast.success("All sessions cleared successfully");
        fetchActiveSessions();
      }
    } catch (error: any) {
      console.error("Clear all sessions error:", error);
      toast.error("Failed to clear all sessions");
    }
  };

  // Platform sync functions
  const updatePlatformSync = async (platform: string, profileUrl: string) => {
    try {
      const response = await api.put("/api/settings/platform-sync", {
        platform,
        profileUrl,
      });
      if (response.data.success) {
        toast.success(`${platform} connected successfully`);
        // Refresh user data to get updated platform sync info
        fetchSettings();
      }
    } catch (error: any) {
      console.error("Update platform sync error:", error);
      const errorMessage = error.response?.data?.message || "Failed to connect platform";
      toast.error(errorMessage);
      throw error;
    }
  };

  const disconnectPlatform = async (platform: string) => {
    try {
      const response = await api.delete(`/api/settings/platform-sync/${platform}`);
      if (response.data.success) {
        toast.success("Platform disconnected successfully");
        // Refresh user data to get updated platform sync info
        fetchSettings();
      }
    } catch (error: any) {
      console.error("Disconnect platform error:", error);
      const errorMessage = error.response?.data?.message || "Failed to disconnect platform";
      toast.error(errorMessage);
      throw error;
    }
  };

  return {
    // state
    loading,
    user,
    mounted,
    isDark,
    // forms
    profileForm,
    preferencesForm,
    securityForm,
    privacyForm,
    // 2FA
    twoFactorModal,
    setTwoFactorModal,
    qrCode,
    twoFactorSecret,
    verificationCode,
    setVerificationCode,
    // sessions
    activeSessions,
    // handlers
    updateProfile,
    updatePreferences,
    updateSecurity,
    updatePrivacy,
    handleEnable2FA,
    handleDisable2FA,
    handleVerify2FA,
    handleRevokeSession,
    handleClearAllSessions,
    // platform sync
    updatePlatformSync,
    disconnectPlatform,
  };
}
