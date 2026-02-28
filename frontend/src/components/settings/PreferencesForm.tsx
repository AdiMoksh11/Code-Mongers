"use client";
import React from "react";
import { Button, Divider, Form, Select, Space, Typography, Switch } from "antd";
import { Monitor, Smartphone } from "lucide-react";

const { Title } = Typography;

export default function PreferencesForm({ form, onSubmit }: { form: any; onSubmit: (values: any) => void }) {
  return (
    <Form form={form} layout="vertical" onFinish={onSubmit} className="max-w-2xl">
      <Title level={4}>Appearance</Title>
      <Space direction="vertical" size="large" className="w-full">
        <Form.Item name="theme" label="Theme">
          <Select>
            <Select.Option value="light">
              <Space>
                <Monitor className="w-4 h-4" />
                Light
              </Space>
            </Select.Option>
            <Select.Option value="dark">
              <Space>
                <Monitor className="w-4 h-4" />
                Dark
              </Space>
            </Select.Option>
            <Select.Option value="system">
              <Space>
                <Smartphone className="w-4 h-4" />
                System
              </Space>
            </Select.Option>
          </Select>
        </Form.Item>

        <Divider />

        <Title level={4}>Localization</Title>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Form.Item name="language" label="Language">
            <Select>
              <Select.Option value="en">English</Select.Option>
              <Select.Option value="es">Spanish</Select.Option>
              <Select.Option value="fr">French</Select.Option>
              <Select.Option value="de">German</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="timezone" label="Timezone">
            <Select>
              <Select.Option value="UTC">UTC</Select.Option>
              <Select.Option value="America/New_York">Eastern Time</Select.Option>
              <Select.Option value="America/Los_Angeles">Pacific Time</Select.Option>
              <Select.Option value="Europe/London">GMT</Select.Option>
              <Select.Option value="Asia/Tokyo">JST</Select.Option>
            </Select>
          </Form.Item>
        </div>

        <Divider />

        <Title level={4}>Notifications</Title>
        <Space direction="vertical" className="w-full">
          <div className="flex justify-between items-center">
            <div>
              Email Notifications
              <br />
              <span className="text-muted-foreground text-xs">Receive notifications via email</span>
            </div>
            <Form.Item name="emailNotifications" valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
          </div>
          <div className="flex justify-between items-center">
            <div>
              Push Notifications
              <br />
              <span className="text-muted-foreground text-xs">Receive push notifications in browser</span>
            </div>
            <Form.Item name="pushNotifications" valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
          </div>
          <div className="flex justify-between items-center">
            <div>
              Marketing Communications
              <br />
              <span className="text-muted-foreground text-xs">Receive updates about new features</span>
            </div>
            <Form.Item name="marketingNotifications" valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
          </div>
          <div className="flex justify-between items-center">
            <div>
              Security Notifications
              <br />
              <span className="text-muted-foreground text-xs">Important security updates</span>
            </div>
            <Form.Item name="securityNotifications" valuePropName="checked" noStyle>
              <Switch />
            </Form.Item>
          </div>
        </Space>

        <Button type="primary" htmlType="submit" size="large">
          Save Preferences
        </Button>
      </Space>
    </Form>
  );
}
