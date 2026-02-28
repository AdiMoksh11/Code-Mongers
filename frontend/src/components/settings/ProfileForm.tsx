"use client";
import React from "react";
import { Button, Divider, Form, Input, Space, Typography } from "antd";
import PlatformSyncForm from "./PlatformSyncForm";

const { Title } = Typography;

export default function ProfileForm({ 
  form, 
  onSubmit, 
  user,
  onConnectPlatform,
  onDisconnectPlatform 
}: { 
  form: any; 
  onSubmit: (values: any) => void;
  user: any;
  onConnectPlatform: (platform: string, profileUrl: string) => Promise<void>;
  onDisconnectPlatform: (platform: string) => Promise<void>;
}) {
  return (
    <Form form={form} layout="vertical" onFinish={onSubmit} className="max-w-2xl">
      <Title level={4}>Personal Information</Title>
      <Space direction="vertical" size="large" className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: "First name is required" }]}>
            <Input placeholder="Enter your first name" />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: "Last name is required" }]}>
            <Input placeholder="Enter your last name" />
          </Form.Item>
        </div>
        <Form.Item name="email" label="Email Address" rules={[{ required: true, message: "Email is required" }, { type: "email", message: "Invalid email format" }]}>
          <Input placeholder="Enter your email address" />
        </Form.Item>
        <Divider />
        <Title level={4}>Change Password</Title>
        <Form.Item name="currentPassword" label="Current Password">
          <Input.Password placeholder="Enter current password" />
        </Form.Item>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("currentPassword")) {
                    if (value && value.length < 6) return Promise.reject(new Error("Password must be at least 6 characters"));
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Current password is required"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Enter new password" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={["newPassword"]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) return Promise.resolve();
                  return Promise.reject(new Error("Passwords do not match"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm new password" />
          </Form.Item>
        </div>
        <Button type="primary" htmlType="submit" size="large">
          Save Changes
        </Button>
        
        <Divider />
        
        {/* Platform Sync Section */}
        <PlatformSyncForm
          platformSync={user?.platformSync || {}}
          onConnectPlatform={onConnectPlatform}
          onDisconnectPlatform={onDisconnectPlatform}
        />
      </Space>
    </Form>
  );
}
