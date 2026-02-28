"use client";

import dynamic from "next/dynamic";
const Sidebar = dynamic(() => import("@/components/dashboard/Sidebar"), { ssr: false });
import { Card, Tabs, ConfigProvider, theme as antdTheme, Typography } from "antd";
import RoleGuard from "@/components/auth/RoleGuard";
import { User, Palette, Shield, Eye } from "lucide-react";
import { useSettingsData } from "@/components/settings/hooks";
import SettingsHeader from "@/components/settings/SettingsHeader";
import ProfileForm from "@/components/settings/ProfileForm";
import PreferencesForm from "@/components/settings/PreferencesForm";
import SecurityForm from "@/components/settings/SecurityForm";
import PrivacyForm from "@/components/settings/PrivacyForm";
import TwoFAModal from "@/components/settings/TwoFAModal";

const { Text } = Typography;

export default function SettingsPage() {
  const {
    loading,
    mounted,
    isDark,
    user,
    profileForm,
    preferencesForm,
    securityForm,
    privacyForm,
    twoFactorModal,
    setTwoFactorModal,
    qrCode,
    twoFactorSecret,
    verificationCode,
    setVerificationCode,
    activeSessions,
    updateProfile,
    updatePreferences,
    updateSecurity,
    updatePrivacy,
    handleEnable2FA,
    handleDisable2FA,
    handleVerify2FA,
    handleRevokeSession,
    handleClearAllSessions,
    updatePlatformSync,
    disconnectPlatform,
  } = useSettingsData();

  if (!mounted) return null;

  if (loading) {
    return (
      <ConfigProvider
        theme={{
          algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorBgBase: "var(--color-background)",
            colorText: "var(--color-foreground)",
            colorTextSecondary: "var(--color-muted-foreground)",
            colorBorder: "var(--color-border)",
            colorPrimary: "var(--color-primary)",
            colorBgContainer: "var(--color-card)",
            borderRadius: 12,
          },
        }}
      >
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-gray-800 dark:text-gray-200 flex">
          <Sidebar />
          <main className="flex-1 p-6 md:p-10">
            <div className="flex items-center justify-center h-96">
              <Text>Loading settings...</Text>
            </div>
          </main>
        </div>
      </ConfigProvider>
    );
  }

  return (
    <RoleGuard allowedRole="learner">
      <ConfigProvider
        theme={{
          algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorBgBase: "var(--color-background)",
            colorText: "var(--color-foreground)",
            colorTextSecondary: "var(--color-muted-foreground)",
            colorBorder: "var(--color-border)",
            colorPrimary: "var(--color-primary)",
            colorBgContainer: "var(--color-card)",
            borderRadius: 12,
          },
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-gray-800 dark:text-gray-200 flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10">
          <div className="max-w-4xl">
            <SettingsHeader />

            <Card className="shadow-lg border-0">
              <Tabs 
                defaultActiveKey="profile" 
                size="large"
                items={[
                  {
                    key: "profile",
                    label: (
                      <span className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Profile
                      </span>
                    ),
                    children: (
                      <ProfileForm 
                        form={profileForm} 
                        onSubmit={updateProfile}
                        user={user}
                        onConnectPlatform={updatePlatformSync}
                        onDisconnectPlatform={disconnectPlatform}
                      />
                    )
                  },
                  {
                    key: "preferences",
                    label: (
                      <span className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Preferences
                      </span>
                    ),
                    children: (<PreferencesForm form={preferencesForm} onSubmit={updatePreferences} />)
                  },
                  {
                    key: "security",
                    label: (
                      <span className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Security
                      </span>
                    ),
                    children: (
                      <SecurityForm
                        form={securityForm}
                        onSubmit={updateSecurity}
                        onEnable2FA={handleEnable2FA}
                        onDisable2FA={handleDisable2FA}
                        sessions={activeSessions}
                        onRevokeSession={handleRevokeSession}
                        onClearAll={handleClearAllSessions}
                      />
                    )
                  },
                  {
                    key: "privacy",
                    label: (
                      <span className="flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Privacy
                      </span>
                    ),
                    children: (<PrivacyForm form={privacyForm} onSubmit={updatePrivacy} />)
                  }
                ]}
              />
            </Card>
          </div>
        </main>

        <TwoFAModal
          open={twoFactorModal}
          onClose={() => setTwoFactorModal(false)}
          qrCode={qrCode}
          secret={twoFactorSecret}
          code={verificationCode}
          setCode={setVerificationCode}
          onVerify={handleVerify2FA}
        />
      </div>
    </ConfigProvider>
    </RoleGuard>
  );
}
