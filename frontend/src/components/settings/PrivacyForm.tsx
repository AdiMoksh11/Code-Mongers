"use client";
import React from "react";
import { Button, Form, Select, Space, Switch, Typography } from "antd";
import { Globe, Lock, User } from "lucide-react";

const { Title, Text } = Typography;

export default function PrivacyForm({ form, onSubmit }: { form: any; onSubmit: (values: any) => void }) {
  return (
    <Form form={form} layout="vertical" onFinish={onSubmit} className="max-w-2xl">
      <Title level={4}>Profile Privacy</Title>
      <Space direction="vertical" size="large" className="w-full">
        <Form.Item name="profileVisibility" label="Profile Visibility" rules={[{ required: true, message: "Profile visibility is required" }]}>
          <Select>
            <Select.Option value="public">
              <Space>
                <Globe className="w-4 h-4" />
                Public - Anyone can view your profile
              </Space>
            </Select.Option>
            <Select.Option value="private">
              <Space>
                <Lock className="w-4 h-4" />
                Private - Only you can view your profile
              </Space>
            </Select.Option>
            <Select.Option value="connections">
              <Space>
                <User className="w-4 h-4" />
                Connections - Only your connections can view
              </Space>
            </Select.Option>
          </Select>
        </Form.Item>

        <div className="flex justify-between items-center">
          <div>
            <Text strong>Show Email Address</Text>
            <br />
            <Text type="secondary">Display your email on your public profile</Text>
          </div>
          <Form.Item name="showEmail" valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <Text strong>Show Credentials</Text>
            <br />
            <Text type="secondary">Display your credentials on your public profile</Text>
          </div>
          <Form.Item name="showCredentials" valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
        </div>

        <div className="flex justify-between items-center">
          <div>
            <Text strong>Allow Profile Indexing</Text>
            <br />
            <Text type="secondary">Allow search engines to index your profile</Text>
          </div>
          <Form.Item name="allowProfileIndexing" valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
        </div>

        <Button type="primary" htmlType="submit" size="large">
          Save Privacy Settings
        </Button>
      </Space>
    </Form>
  );
}
