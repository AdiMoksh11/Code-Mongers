"use client";

import React, { useEffect, useState } from "react";
import { ConfigProvider, theme, Form, Input, Select, Switch, Card, Button, Divider, message, InputNumber } from "antd";
import EmployerSidebar from "@/components/dashboard/employer/EmployerSidebar";
import RoleGuard from "@/components/auth/RoleGuard";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTheme } from "next-themes";
import api from "@/utils/axios";

type SettingsPayload = {
  settings: {
    preferences?: {
      theme?: "light" | "dark" | "system";
      language?: string;
      timezone?: string;
      notifications?: {
        email?: boolean;
        push?: boolean;
        marketing?: boolean;
        security?: boolean;
      };
      privacy?: {
        profileVisibility?: "public" | "private";
        showInLeaderboard?: boolean;
        allowDirectMessages?: boolean;
      };
    };
    security?: {
      twoFactorEnabled?: boolean;
      loginNotifications?: boolean;
      sessionTimeout?: number;
    };
    privacy?: {
      profileVisibility?: "public" | "private" | "connections";
      showEmail?: boolean;
      showCredentials?: boolean;
      allowProfileIndexing?: boolean;
    };
  };
};

export default function EmployerSettingsPage() {
  const { theme: mode, setTheme } = useTheme();
  const isDark = mode === "dark";
  const [form] = Form.useForm<SettingsPayload["settings"]>();
  const [loading, setLoading] = useState(false);

  const algorithm = isDark ? theme.darkAlgorithm : theme.defaultAlgorithm;

  const loadMe = async () => {
    try {
      const res = await api.get("/api/users/me");
      const user = res.data?.user || {};
      const s = user.settings || {};
      form.setFieldsValue(s);
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Failed to load settings");
    }
  };

  const onSubmit = async (values: SettingsPayload["settings"]) => {
    setLoading(true);
    try {
      await api.put("/api/users/me", { settings: values });
      message.success("Settings saved");
      await loadMe();
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <RoleGuard allowedRole="employer">
      <ConfigProvider theme={{ algorithm }}>
        <div className="h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50 dark:from-gray-900 dark:via-green-900/20 dark:to-emerald-900/10 flex relative overflow-hidden">
          <EmployerSidebar />
          <div className="flex-1 overflow-y-auto">
            {/* Top Bar */}
            <div className="flex items-center justify-between p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold">Employer Settings</h2>
                <p className="text-sm text-foreground/60">Control preferences, notifications and privacy</p>
              </div>
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
              </div>
            </div>

            <div className="max-w-5xl mx-auto p-6 space-y-16">
              <Form
                form={form}
                layout="vertical"
                onFinish={onSubmit}
                onValuesChange={(changed) => {
                  const newTheme = (changed as any)?.preferences?.theme as
                    | "light"
                    | "dark"
                    | "system"
                    | undefined;
                  if (newTheme) setTheme(newTheme);
                }}
              >
                {/* Preferences */}
                <Card title="Preferences" variant="outlined">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Form.Item label="Theme" name={["preferences", "theme"]}>
                      <Select
                        options={[
                          { label: "System", value: "system" },
                          { label: "Light", value: "light" },
                          { label: "Dark", value: "dark" },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item label="Language" name={["preferences", "language"]}>
                      <Select options={[{ label: "English", value: "en" }]} />
                    </Form.Item>
                    <Form.Item label="Timezone" name={["preferences", "timezone"]}>
                      <Input placeholder="e.g., UTC, Asia/Kolkata" />
                    </Form.Item>
                  </div>

                  <Divider>Notifications</Divider>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Form.Item label="Email Notifications" name={["preferences", "notifications", "email"]} valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item label="Push Notifications" name={["preferences", "notifications", "push"]} valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item label="Marketing Updates" name={["preferences", "notifications", "marketing"]} valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item label="Security Alerts" name={["preferences", "notifications", "security"]} valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </div>

                  <Divider>Privacy (Preferences)</Divider>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Form.Item label="Profile Visibility" name={["preferences", "privacy", "profileVisibility"]}>
                      <Select
                        options={[
                          { label: "Public", value: "public" },
                          { label: "Private", value: "private" },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item label="Show in Leaderboard" name={["preferences", "privacy", "showInLeaderboard"]} valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item label="Allow Direct Messages" name={["preferences", "privacy", "allowDirectMessages"]} valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </div>
                </Card>

                {/* Security */}
                <Card title="Security" variant="outlined" className="mt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Form.Item label="Two-factor Authentication" name={["security", "twoFactorEnabled"]} valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item label="Login Notifications" name={["security", "loginNotifications"]} valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item label="Session Timeout (minutes)" name={["security", "sessionTimeout"]}>
                      <InputNumber min={5} max={240} className="w-full" />
                    </Form.Item>
                  </div>
                </Card>

                {/* Privacy */}
                <Card title="Privacy" variant="outlined" className="mt-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Form.Item label="Profile Visibility" name={["privacy", "profileVisibility"]}>
                      <Select
                        options={[
                          { label: "Public", value: "public" },
                          { label: "Private", value: "private" },
                          { label: "Connections", value: "connections" },
                        ]}
                      />
                    </Form.Item>
                    <Form.Item label="Show Email on Public Profile" name={["privacy", "showEmail"]} valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item label="Show Credentials on Public Profile" name={["privacy", "showCredentials"]} valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item label="Allow Search Engine Indexing" name={["privacy", "allowProfileIndexing"]} valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </div>
                </Card>

                <div className="flex justify-end py-8">
                  <Button type="primary" htmlType="submit" loading={loading}>
                    Save Settings
                  </Button>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </ConfigProvider>
    </RoleGuard>
  );
}
