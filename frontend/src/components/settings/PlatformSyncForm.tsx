"use client";
import React, { useState } from "react";
import api from "@/utils/axios";
import { 
  Button, 
  Typography, 
  Card, 
  Space, 
  Dropdown, 
  Modal, 
  Form, 
  Input, 
  message,
  Divider 
} from "antd";
import { 
  PlusOutlined, 
  LinkOutlined, 
  DisconnectOutlined,
  LoadingOutlined 
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface Platform {
  key: string;
  name: string;
  icon: string;
  description: string;
  isEnabled: boolean;
}

interface PlatformSyncData {
  profileUrl: string;
  isConnected: boolean;
  lastSyncAt?: string;
}

interface PlatformSyncFormProps {
  platformSync: Record<string, PlatformSyncData>;
  onConnectPlatform: (platform: string, profileUrl: string) => Promise<void>;
  onDisconnectPlatform: (platform: string) => Promise<void>;
}

const platforms: Platform[] = [
  {
    key: "coursera",
    name: "Coursera",
    icon: "🎓",
    description: "Connect your Coursera profile to sync certificates",
    isEnabled: true,
  },
  {
    key: "udemy",
    name: "Udemy",
    icon: "📚",
    description: "Connect your Udemy profile to sync certificates",
    isEnabled: false,
  },
  {
    key: "nptel",
    name: "NPTEL",
    icon: "🏛️",
    description: "Connect your NPTEL profile to sync certificates",
    isEnabled: false,
  },
  {
    key: "edx",
    name: "edX",
    icon: "🎯",
    description: "Connect your edX profile to sync certificates",
    isEnabled: false,
  },
  {
    key: "linkedinLearning",
    name: "LinkedIn Learning",
    icon: "💼",
    description: "Connect your LinkedIn Learning profile to sync certificates",
    isEnabled: false,
  },
  {
    key: "google",
    name: "Google",
    icon: "🔍",
    description: "Connect your Google profile to sync certificates",
    isEnabled: false,
  },
];

export default function PlatformSyncForm({ 
  platformSync, 
  onConnectPlatform, 
  onDisconnectPlatform 
}: PlatformSyncFormProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);
  const [form] = Form.useForm();
  const [isConnecting, setIsConnecting] = useState(false);
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<string | null>(null);
  const [step, setStep] = useState<'enter-url' | 'challenge'>('enter-url');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [challengeExpiry, setChallengeExpiry] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentProfileUrl, setCurrentProfileUrl] = useState<string>("");

  const handleConnectClick = (platform: Platform) => {
    if (!platform.isEnabled) {
      message.info(`${platform.name} integration is coming soon!`);
      return;
    }
    setSelectedPlatform(platform);
    setIsModalVisible(true);
    form.resetFields();
    setStep('enter-url');
    setChallengeToken(null);
    setChallengeExpiry(null);
    setCurrentProfileUrl("");
  };

  const handleConnect = async (values: { profileUrl: string }) => {
    if (!selectedPlatform) return;

    try {
      setIsConnecting(true);
      // For Coursera, start a challenge instead of direct connect
      if (selectedPlatform.key === 'coursera') {
        const { data } = await api.post(`/api/platforms/coursera/challenge`, { profileUrl: values.profileUrl.trim() });
        if (!data?.success) throw new Error(data?.message || 'Failed to create challenge');
        setChallengeToken(data.data.token);
        setChallengeExpiry(data.data.expiresAt);
        setCurrentProfileUrl(values.profileUrl.trim());
        setStep('challenge');
        message.success('Token generated. Update your Coursera display name, then click Verify.');
      } else {
        await onConnectPlatform(selectedPlatform.key, values.profileUrl);
        setIsModalVisible(false);
        form.resetFields();
        message.success(`${selectedPlatform.name} connected successfully!`);
      }
    } catch (error) {
      console.error("Connection error:", error);
      const msg = (error as any)?.response?.data?.message || (error as Error)?.message || "Failed to connect platform. Please try again.";
      message.error(msg);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedPlatform || selectedPlatform.key !== 'coursera') return;
    try {
      setIsVerifying(true);
      const { data } = await api.post(`/api/platforms/coursera/verify`, { profileUrl: currentProfileUrl });
      if (!data?.success) throw new Error(data?.message || 'Verification failed');
      message.success('Coursera verified and connected');
      setIsModalVisible(false);
      form.resetFields();
      // Quick refresh to pull new user.platformSync from server
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (error) {
      const msg = (error as any)?.response?.data?.message || (error as Error)?.message || 'Verification failed';
      message.error(msg);
    } finally {
      setIsVerifying(false);
    }
  }

  const handleDisconnect = async (platformKey: string) => {
    try {
      setDisconnectingPlatform(platformKey);
      await onDisconnectPlatform(platformKey);
      message.success("Platform disconnected successfully!");
    } catch (error) {
      console.error("Disconnect error:", error);
      message.error("Failed to disconnect platform. Please try again.");
    } finally {
      setDisconnectingPlatform(null);
    }
  };

  const getDropdownItems = () => {
    return platforms.map((platform) => ({
      key: platform.key,
      label: (
        <div className="flex items-center space-x-3 p-2">
          <span className="text-lg">{platform.icon}</span>
          <div>
            <div className="font-medium">{platform.name}</div>
            <div className="text-xs text-gray-500">
              {platform.isEnabled ? "Available" : "Coming Soon"}
            </div>
          </div>
        </div>
      ),
      disabled: !platform.isEnabled,
      onClick: () => handleConnectClick(platform),
    }));
  };

  const getConnectedPlatforms = () => {
    return platforms.filter(platform => 
      platformSync[platform.key]?.isConnected
    );
  };

  const connectedPlatforms = getConnectedPlatforms();

  return (
    <div className="max-w-2xl">
      <Title level={4}>Platform Sync</Title>
      <Text type="secondary" className="block mb-6">
        Connect your learning platforms to automatically sync certificates and achievements.
      </Text>

      {/* Connected Platforms */}
      {connectedPlatforms.length > 0 && (
        <>
          <div className="mb-6">
            <Text className="font-medium text-base">Connected Platforms</Text>
            <div className="mt-3 space-y-3">
              {connectedPlatforms.map((platform) => {
                const syncData = platformSync[platform.key];
                return (
                  <Card key={platform.key} size="small" className="border-l-4 border-l-green-500">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{platform.icon}</span>
                        <div>
                          <div className="font-medium">{platform.name}</div>
                          <div className="text-xs text-gray-500">
                            Connected • Last sync: {syncData.lastSyncAt 
                              ? new Date(syncData.lastSyncAt).toLocaleDateString()
                              : "Never"
                            }
                          </div>
                        </div>
                      </div>
                      <Button
                        type="text"
                        danger
                        icon={disconnectingPlatform === platform.key ? <LoadingOutlined /> : <DisconnectOutlined />}
                        onClick={() => handleDisconnect(platform.key)}
                        loading={disconnectingPlatform === platform.key}
                        disabled={disconnectingPlatform !== null}
                      >
                        Disconnect
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
          <Divider />
        </>
      )}

      {/* Add New Platform */}
      <div className="mb-6">
        <Dropdown 
          menu={{ items: getDropdownItems() }}
          placement="bottomLeft"
          trigger={['click']}
        >
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            size="large"
            className="w-full sm:w-auto"
          >
            Connect Platform
          </Button>
        </Dropdown>
      </div>

      {/* Platform List for Reference */}
      <div>
        <Text className="font-medium text-base">Available Platforms</Text>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {platforms.map((platform) => (
            <Card 
              key={platform.key} 
              size="small" 
              className={`cursor-pointer transition-all hover:shadow-md ${
                !platform.isEnabled ? 'opacity-60' : ''
              } ${
                platformSync[platform.key]?.isConnected ? 'border-l-4 border-l-green-500' : ''
              }`}
              onClick={() => handleConnectClick(platform)}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{platform.icon}</span>
                <div className="flex-1">
                  <div className="font-medium flex items-center">
                    {platform.name}
                    {platformSync[platform.key]?.isConnected && (
                      <LinkOutlined className="ml-2 text-green-500" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {platform.isEnabled ? platform.description : "Coming Soon"}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Connect Platform Modal */}
      <Modal
        title={selectedPlatform ? `Connect ${selectedPlatform.name}` : "Connect Platform"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedPlatform && (
          <div className="mb-6">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-2xl">{selectedPlatform.icon}</span>
              <div>
                <div className="font-medium text-lg">{selectedPlatform.name}</div>
                <div className="text-sm text-gray-500">
                  {selectedPlatform.key === 'coursera' && step === 'challenge'
                    ? 'Change your Coursera display name to the token below, then click Verify.'
                    : selectedPlatform.description}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'enter-url' && (
          <Form form={form} layout="vertical" onFinish={handleConnect}>
            <Form.Item
              name="profileUrl"
              label="Profile URL"
              rules={[
                { required: true, message: "Profile URL is required" },
                { type: "url", message: "Please enter a valid URL" }
              ]}
            >
              <Input
                placeholder={`Enter your ${selectedPlatform?.name} profile URL`}
                prefix={<LinkOutlined />}
              />
            </Form.Item>

            <div className="flex justify-end space-x-3">
              <Button onClick={() => setIsModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={isConnecting}>
                {selectedPlatform?.key === 'coursera' ? 'Get Token' : 'Connect'}
              </Button>
            </div>
          </Form>
        )}

        {step === 'challenge' && selectedPlatform?.key === 'coursera' && (
          <div className="space-y-4">
            <Card size="small" className="border-yellow-300 bg-yellow-50">
              <Text strong className="block text-yellow-800">Step 1</Text>
              <Text>Temporarily set your Coursera display name to:</Text>
              <div className="mt-2 p-2 bg-white rounded border text-center font-mono text-lg select-all">{challengeToken}</div>
              {challengeExpiry && (
                <div className="mt-2 text-xs text-gray-500">Token expires at {new Date(challengeExpiry).toLocaleTimeString()}</div>
              )}
            </Card>
            <Card size="small" className="border-green-300 bg-green-50">
              <Text strong className="block text-green-800">Step 2</Text>
              <Text>After updating your name on Coursera, click Verify. You can revert your name afterwards.</Text>
            </Card>
            <div className="flex justify-end space-x-3">
              <Button onClick={() => setIsModalVisible(false)}>Close</Button>
              <Button type="primary" onClick={handleVerify} loading={isVerifying}>Verify</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}