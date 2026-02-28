"use client";
import React from "react";
import { Typography } from "antd";
import { Settings } from "lucide-react";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";

const { Title, Text } = Typography;

export default function SettingsHeader() {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <Title level={2} className="flex items-center gap-2 m-0">
          <Settings className="w-6 h-6" />
          Settings
        </Title>
        <ThemeToggleButton
          variant="gif"
          url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif"
        />
      </div>
      <Text type="secondary">Manage your account settings and preferences</Text>
    </div>
  );
}
