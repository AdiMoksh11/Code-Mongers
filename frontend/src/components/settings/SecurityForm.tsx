"use client";
import React from "react";
import { Button, Divider, Form, List, Popconfirm, Select, Space, Switch, Typography, Avatar } from "antd";
import { Monitor, Trash2 } from "lucide-react";

const { Title, Text } = Typography;

export default function SecurityForm({
  form,
  onSubmit,
  onEnable2FA,
  onDisable2FA,
  sessions,
  onRevokeSession,
  onClearAll,
}: {
  form: any;
  onSubmit: (values: any) => void;
  onEnable2FA: () => void;
  onDisable2FA: () => void;
  sessions: any[];
  onRevokeSession: (id: string) => void;
  onClearAll: () => void;
}) {
  return (
    <Form form={form} layout="vertical" onFinish={onSubmit} className="max-w-2xl">
      <Title level={4}>Two-Factor Authentication</Title>
      <Space direction="vertical" size="large" className="w-full">
        <div className="flex justify-between items-center">
          <div>
            <Text strong>Two-Factor Authentication</Text>
            <br />
            <Text type="secondary">Add an extra layer of security to your account</Text>
          </div>
          <Form.Item name="twoFactorEnabled" valuePropName="checked" noStyle>
            <Switch onChange={(checked) => (checked ? onEnable2FA() : onDisable2FA())} />
          </Form.Item>
        </div>

        <Divider />

        <Title level={4}>Session Management</Title>
        <Form.Item name="sessionTimeout" label="Session Timeout (minutes)" rules={[{ required: true, message: "Session timeout is required" }]}>
          <Select>
            <Select.Option value={15}>15 minutes</Select.Option>
            <Select.Option value={30}>30 minutes</Select.Option>
            <Select.Option value={60}>1 hour</Select.Option>
            <Select.Option value={240}>4 hours</Select.Option>
            <Select.Option value={480}>8 hours</Select.Option>
          </Select>
        </Form.Item>

        <div className="flex justify-between items-center">
          <div>
            <Text strong>Login Notifications</Text>
            <br />
            <Text type="secondary">Get notified when you log in from a new device</Text>
          </div>
          <Form.Item name="loginNotifications" valuePropName="checked" noStyle>
            <Switch />
          </Form.Item>
        </div>

        <Divider />

        <Title level={4}>Active Sessions</Title>
        <div className="flex justify-between items-center mb-4">
          <Text type="secondary">Manage your active login sessions</Text>
          <Popconfirm title="Clear all active sessions?" description="This will log you out from all devices. You'll need to login again." onConfirm={onClearAll}>
            <Button danger size="small">Clear All Sessions</Button>
          </Popconfirm>
        </div>
        <List
          dataSource={sessions}
          renderItem={(session) => (
            <List.Item
              actions={[
                <Popconfirm title="Revoke this session?" onConfirm={() => onRevokeSession(session.sessionId)} key="revoke">
                  <Button type="text" danger icon={<Trash2 className="w-4 h-4" />}>Revoke</Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta avatar={<Avatar icon={<Monitor className="w-4 h-4" />} />} title={session.deviceInfo || "Unknown Device"} description={`IP: ${session.ipAddress} • Last active: ${new Date(session.lastActive).toLocaleString()}`} />
            </List.Item>
          )}
          locale={{ emptyText: "No active sessions" }}
        />

        <Button type="primary" htmlType="submit" size="large">
          Save Security Settings
        </Button>
      </Space>
    </Form>
  );
}
