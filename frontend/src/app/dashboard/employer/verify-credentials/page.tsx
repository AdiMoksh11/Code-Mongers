"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import {
  Tabs,
  Button,
  Input,
  Card,
  Avatar,
  Tag,
  Typography,
  Spin,
  Space,
  ConfigProvider,
  theme,
  notification,
  Modal,
  List,
  Badge,
  Divider,
  Row,
  Col,
  Empty,
  Tooltip,
  Pagination,
} from "antd";
import {
  SearchOutlined,
  UserOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  LinkOutlined,
  SolutionOutlined,
  AuditOutlined,
  QuestionCircleOutlined,
  EyeOutlined,
  SafetyCertificateOutlined,
  BlockOutlined,
  CalendarOutlined,
  TrophyOutlined,
  StarOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  RightOutlined
} from "@ant-design/icons";
import EmployerSidebar from "@/components/dashboard/employer/EmployerSidebar";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import RoleGuard from "@/components/auth/RoleGuard";
import { useTheme } from "next-themes";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

interface User {
  id: string;
  name: string;
  username: string;
  hasRealUsername?: boolean;
  avatarUrl: string;
  role: string;
  scores: {
    efficiency: number;
    social: number;
    performance: number;
  };
  topSkills: string[];
  onChainVerified: boolean;
  email?: string;
  institute?: {
    name: string;
    state?: string;
    district?: string;
  };
}

interface Credential {
  id: string;
  title: string;
  issuer: string;
  type: string;
  issueDate: string;
  description?: string;
  skills: string[];
  nsqfLevel?: number;
  creditPoints?: number;
  status: string;
  transactionHash?: string;
  credentialHash?: string;
  imageUrl?: string;
  issuerLogo?: string;
  credentialId?: string;
  isBlockchainVerified: boolean;
  createdAt: string;
}

interface VerificationResult {
  success: boolean;
  verified: boolean;
  hash?: string;
  blockchain?: {
    verified: boolean;
    issuer?: string;
    timestamp?: number;
    timestampDate?: string;
    source: string;
  };
  credential?: Credential;
  user?: {
    id: string;
    name: string;
    email: string;
    profilePic?: string;
    institute?: any;
  };
  verifiedAt: string;
  message?: string;
  details?: string;
}

type VerificationMethod = "user-search" | "hash-verification";

const PlexusBackground = () => (
  <div className="absolute inset-0 z-0 opacity-40 dark:opacity-50">
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1600 900"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      style={{ backgroundColor: "#0c0a09" }}
    >
      <defs>
        <radialGradient id="backgroundGradient" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#020617" />
        </radialGradient>

        <radialGradient id="greenGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="1" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </radialGradient>

        <radialGradient id="blueGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#60a5fa" stopOpacity="1" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="100%" height="100%" fill="url(#backgroundGradient)" />

      <g stroke="#34d399" strokeWidth="1" strokeOpacity="0.3">
        <line x1="220" y1="150" x2="480" y2="240" />
        <line x1="480" y1="240" x2="350" y2="400" />
        <line x1="350" y1="400" x2="150" y2="350" />
        <line x1="150" y1="350" x2="220" y2="150" />

        <line x1="1300" y1="120" x2="1150" y2="280" />
        <line x1="1150" y1="280" x2="1450" y2="320" />
        <line x1="1450" y1="320" x2="1300" y2="120" />
        <line x1="1150" y1="280" x2="950" y2="180" />

        <line x1="180" y1="800" x2="400" y2="650" />
        <line x1="400" y1="650" x2="600" y2="820" />
        <line x1="600" y1="820" x2="350" y2="880" />
        <line x1="350" y1="880" x2="180" y2="800" />

        <line x1="1100" y1="750" x2="1350" y2="600" />
        <line x1="1350" y1="600" x2="1500" y2="780" />
        <line x1="1500" y1="780" x2="1250" y2="850" />
        <line x1="1250" y1="850" x2="1100" y2="750" />
        <line x1="1350" y1="600" x2="1150" y2="550" />
      </g>

      <g>
        <circle cx="220" cy="150" r="10" fill="url(#greenGlow)" />
        <circle cx="480" cy="240" r="12" fill="url(#blueGlow)" />
        <circle cx="350" cy="400" r="8" fill="url(#blueGlow)" />
        <circle cx="150" cy="350" r="9" fill="url(#blueGlow)" />

        <circle cx="1300" cy="120" r="11" fill="url(#blueGlow)" />
        <circle cx="1150" cy="280" r="9" fill="url(#blueGlow)" />
        <circle cx="1450" cy="320" r="13" fill="url(#greenGlow)" />
        <circle cx="950" cy="180" r="8" fill="url(#greenGlow)" />

        <circle cx="180" cy="800" r="12" fill="url(#blueGlow)" />
        <circle cx="400" cy="650" r="9" fill="url(#greenGlow)" />
        <circle cx="600" cy="820" r="11" fill="url(#blueGlow)" />
        <circle cx="350" cy="880" r="8" fill="url(#greenGlow)" />

        <circle cx="1100" cy="750" r="10" fill="url(#blueGlow)" />
        <circle cx="1350" cy="600" r="12" fill="url(#greenGlow)" />
        <circle cx="1500" cy="780" r="9" fill="url(#blueGlow)" />
        <circle cx="1250" cy="850" r="11" fill="url(#greenGlow)" />
        <circle cx="1150" cy="550" r="8" fill="url(#blueGlow)" />

        <circle cx="750" cy="450" r="7" fill="url(#greenGlow)" />
        <circle cx="900" cy="600" r="9" fill="url(#blueGlow)" />
        <circle cx="550" cy="100" r="8" fill="url(#blueGlow)" />
      </g>
    </svg>
  </div>
);

import api from "@/utils/axios";

const searchUsers = async (query: string = ""): Promise<{ success: boolean; candidates: User[] }> => {
  try {
    const searchParam = query.trim() ? `q=${encodeURIComponent(query.trim())}` : '';
    const response = await api.get(`/api/users/search?${searchParam}&limit=20`);
    return response.data;
  } catch (error: any) {
    console.error('Search users error:', error);
    return { success: false, candidates: [] };
  }
};

const getUserCredentials = async (userId: string): Promise<{ success: boolean; credentials: Credential[]; user?: any }> => {
  try {
    const response = await api.get(`/api/employer/users/${userId}/credentials`);
    return response.data;
  } catch (error) {
    console.error('Get user credentials error:', error);
    return { success: false, credentials: [] };
  }
};

const verifyCredentialByHash = async (hash: string): Promise<VerificationResult> => {
  try {
    const response = await api.post('/api/employer/verify-hash', { hash });
    return response.data;
  } catch (error: any) {
    console.error('Verify credential error:', error);
    return { 
      success: false, 
      verified: false, 
      verifiedAt: new Date().toISOString(),
      message: 'Failed to verify credential',
      details: error?.response?.data?.message || error?.message || 'Unknown error'
    };
  }
};

const VerifyCredentialContent: React.FC = () => {
  const [notificationApi, contextHolder] = notification.useNotification();
  
  const [activeTab, setActiveTab] = useState<VerificationMethod>("user-search");
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [displayedUsers, setDisplayedUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(false);
  const [usersPage, setUsersPage] = useState(0);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const USERS_PER_PAGE = 6;
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userCredentials, setUserCredentials] = useState<Credential[]>([]);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState<{ visible: boolean; user: User | null }>({
    visible: false,
    user: null
  });
  const [currentPage, setCurrentPage] = useState(1);
  const CREDENTIALS_PER_PAGE = 10;
  
  const [credentialDetailsModal, setCredentialDetailsModal] = useState<{ visible: boolean; credential: Credential | null }>({
    visible: false,
    credential: null
  });

  const [hashInput, setHashInput] = useState("");
  const [hashVerificationResult, setHashVerificationResult] = useState<VerificationResult | null>(null);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const loadAllUsers = async () => {
    setSearchLoading(true);
    try {
      const result = await searchUsers("");
      const users = result.candidates || [];
      setAllUsers(users);
      setFilteredUsers(users);
      
      // Initialize with first 6 users
      const initialUsers = users.slice(0, USERS_PER_PAGE);
      setDisplayedUsers(initialUsers);
      setUsersPage(1);
      setHasMoreUsers(users.length > USERS_PER_PAGE);
      setInitialLoad(true);
    } catch (error) {
      notificationApi.error({ message: "Failed to load users" });
    } finally {
      setSearchLoading(false);
    }
  };

  const loadMoreUsers = () => {
    const currentUsers = searchQuery.trim() ? filteredUsers : allUsers;
    const nextPage = usersPage + 1;
    const startIndex = usersPage * USERS_PER_PAGE;
    const endIndex = nextPage * USERS_PER_PAGE;
    
    const newUsers = currentUsers.slice(startIndex, endIndex);
    setDisplayedUsers(prev => [...prev, ...newUsers]);
    setUsersPage(nextPage);
    setHasMoreUsers(endIndex < currentUsers.length);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    if (!value.trim()) {
      setFilteredUsers(allUsers);
      // Reset to show first 6 users when clearing search
      const initialUsers = allUsers.slice(0, USERS_PER_PAGE);
      setDisplayedUsers(initialUsers);
      setUsersPage(1);
      setHasMoreUsers(allUsers.length > USERS_PER_PAGE);
      return;
    }

    const query = value.toLowerCase().trim();
    const filtered = allUsers.filter(user => {
      const userFullName = user.name.toLowerCase();
      const username = user.username.toLowerCase();
      
      return userFullName.includes(query) || 
             username.includes(query);
    });
    
    setFilteredUsers(filtered);
    
    // Reset pagination for search results
    const initialUsers = filtered.slice(0, USERS_PER_PAGE);
    setDisplayedUsers(initialUsers);
    setUsersPage(1);
    setHasMoreUsers(filtered.length > USERS_PER_PAGE);
  };

  const handleSelectUser = async (user: User) => {
    setSelectedUser(user);
    setCurrentPage(1);
    setCredentialsModal({ visible: true, user });
    setCredentialsLoading(true);
    
    try {
      const result = await getUserCredentials(user.id);
      setUserCredentials(result.credentials || []);
      if (result.credentials.length === 0) {
        notificationApi.info({ message: "This user has no credentials yet" });
      }
    } catch (error) {
      notificationApi.error({ message: "Failed to fetch user credentials" });
      setUserCredentials([]);
    } finally {
      setCredentialsLoading(false);
    }
  };
  
  const handleHashVerification = async () => {
    if (!hashInput.trim()) {
      notificationApi.error({ message: "Please enter a credential hash" });
      return;
    }

    setLoading(true);
    try {
      const result = await verifyCredentialByHash(hashInput.trim());
      setHashVerificationResult(result);
      if (result.success && result.verified) {
        notificationApi.success({ 
          message: "Verified Certificate Authentic ✅", 
          description: "This credential has been successfully verified against the blockchain record."
        });
      } else if (result.success && !result.verified) {
        notificationApi.warning({ message: "Credential found but not blockchain-verified" });
      } else {
        notificationApi.error({ message: result.message || "Verification failed" });
      }
    } catch (error) {
      notificationApi.error({ message: "Failed to verify credential" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "user-search" && !initialLoad) {
      loadAllUsers();
    }
  }, [activeTab, initialLoad]);

  const handleClearSearch = () => {
    setSearchQuery("");
    setFilteredUsers(allUsers);
    setSelectedUser(null);
    setUserCredentials([]);
    setCredentialsModal({ visible: false, user: null });
    
    // Reset pagination when clearing search
    const initialUsers = allUsers.slice(0, USERS_PER_PAGE);
    setDisplayedUsers(initialUsers);
    setUsersPage(1);
    setHasMoreUsers(allUsers.length > USERS_PER_PAGE);
  };

  const handleCloseCredentialsModal = () => {
    setCredentialsModal({ visible: false, user: null });
    setSelectedUser(null);
    setUserCredentials([]);
    setCurrentPage(1);
  };

  const handleClearHashVerification = () => {
    setHashInput("");
    setHashVerificationResult(null);
  };

  const getVerificationStatusColor = (verified: boolean) => {
    return verified ? "green" : "orange";
  };

  const getVerificationStatusIcon = (verified: boolean) => {
    return verified ? <CheckCircleOutlined className="text-green-500" /> : <WarningOutlined className="text-orange-500" />;
  };
  
  const startIndex = (currentPage - 1) * CREDENTIALS_PER_PAGE;
  const endIndex = startIndex + CREDENTIALS_PER_PAGE;
  const paginatedCredentials = userCredentials.slice(startIndex, endIndex);
  const totalPages = Math.ceil(userCredentials.length / CREDENTIALS_PER_PAGE);

  const tabs = [
    {
      key: "user-search",
      label: (
        <span>
          <SearchOutlined /> Search Users
        </span>
      ),
      children: (
        <div className="flex flex-col gap-6">
          <div>
            <Paragraph className="text-gray-600 dark:text-gray-400 mb-4">
              Browse all learners or search by **name/username** to view and verify their credentials. 
              Start typing to filter results in real-time.
            </Paragraph>
            <div className="flex gap-3">
              <Input
                prefix={<SearchOutlined />}
                placeholder="Search by name, username, or @handle..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                size="large"
                className="flex-1"
              />
              {searchQuery && (
                <Button size="large" onClick={handleClearSearch}>
                  Clear
                </Button>
              )}
            </div>
          </div>

          {searchLoading && (
            <div className="text-center py-8">
              <Spin size="large" />
              <Paragraph className="mt-4">Loading users...</Paragraph>
            </div>
          )}

          {!searchLoading && (searchQuery ? filteredUsers.length > 0 : allUsers.length > 0) && (
            <div>
              <Title level={4} className="!text-gray-900 dark:!text-gray-100 mb-4 font-semibold">
                {searchQuery ? `Search Results (${filteredUsers.length})` : `All Learners (${allUsers.length})`}
              </Title>
              <InfiniteScroll
                dataLength={displayedUsers.length}
                next={loadMoreUsers}
                hasMore={hasMoreUsers}
                loader={
                  <div className="text-center py-4">
                    <Spin size="large" />
                    <Paragraph className="mt-2 text-gray-600 dark:text-gray-400">Loading more users...</Paragraph>
                  </div>
                }
                endMessage={
                  <div className="text-center py-4">
                    <Paragraph className="text-gray-500 dark:text-gray-400">
                      🎉 You've seen all users! ({displayedUsers.length} total)
                    </Paragraph>
                  </div>
                }
              >
                <Row gutter={[24, 24]}>
                  {displayedUsers.map((user: User) => (
                  <Col xs={24} sm={12} lg={8} key={user.id}>
                    <Card
                      hoverable
                      className="h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl overflow-hidden" 
                      styles={{ body: { padding: '24px' } }}
                    >
                      <div 
                        className="flex flex-col items-center justify-center text-center gap-4" 
                      >
                        <div className="relative p-1 rounded-full bg-gradient-to-br from-blue-500/20 to-green-500/20">
                          <Avatar 
                            size={80} 
                            src={user.avatarUrl} 
                            icon={<UserOutlined />}
                            className="border-4 border-white dark:border-gray-800 shadow-md"
                          />
                          {user.onChainVerified && (
                            <Tooltip title="Credexa On-Chain Verified Profile">
                              <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1.5 shadow-xl border-2 border-white dark:border-gray-800">
                                <SafetyCertificateOutlined className="text-white text-base" />
                              </div>
                            </Tooltip>
                          )}
                        </div>
                        
                        <div className="space-y-0">
                          <Title level={4} className="!text-gray-900 dark:!text-gray-100 !mb-1 font-bold">
                            {user.name}
                          </Title>
                          {user.hasRealUsername && (
                            <Text type="secondary" className="text-sm dark:text-gray-400">@{user.username}</Text>
                          )}
                        </div>

                        <div className="px-4 py-1 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-sm font-medium shadow-md mt-1">
                          {user.role}
                        </div>

                        <div className="flex flex-wrap gap-2 justify-center max-w-full min-h-[40px] pt-2">
                          {user.topSkills.slice(0, 3).map((skill: string) => (
                            <Tag 
                              key={skill} 
                              className="border border-indigo-300 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full h-[36px] px-5 flex items-center justify-center text-xs font-medium leading-none shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              {skill}
                            </Tag>
                          ))}
                        </div>

                        <Button
                          type="primary"
                          icon={<EyeOutlined />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectUser(user);
                          }}
                          className="mt-3 h-10 px-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 border-0 hover:from-emerald-600 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                          size="large"
                        >
                          View Credentials
                        </Button>
                      </div>
                    </Card>
                  </Col>
                  ))}
                </Row>
              </InfiniteScroll>
            </div>
          )}

          {!searchLoading && initialLoad && displayedUsers.length === 0 && (
            <div className="text-center py-8">
              <Empty 
                description={
                  searchQuery 
                    ? "No users found matching your search" 
                    : "No learners found"
                }
              />
              {searchQuery && (
                <Button type="link" onClick={handleClearSearch}>
                  Clear search to see all users
                </Button>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "hash-verification",
      label: (
        <span>
          <BlockOutlined /> Hash Verification
        </span>
      ),
      children: (
        <div className="flex flex-col gap-6">
          <div>
            <Paragraph className="text-gray-600 dark:text-gray-400 mb-4">
              Enter a **blockchain hash** or **Credential ID** to verify a credential directly.
            </Paragraph>
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Input
                  prefix={<LinkOutlined />}
                  placeholder="Enter credential hash (e.g., 0x1a2b3c...) or Credential ID"
                  value={hashInput}
                  onChange={(e) => {
                    setHashInput(e.target.value);
                    setHashVerificationResult(null);
                  }}
                  size="large"
                  className={hashInput && !hashVerificationResult ? "border-blue-400 dark:border-blue-500" : ""}
                />
                {hashInput && !hashVerificationResult && (
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Hash ready for verification - Click "Verify Hash" to proceed
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="primary"
                  size="large"
                  icon={<CheckCircleOutlined />}
                  onClick={handleHashVerification}
                  loading={loading}
                  disabled={!hashInput.trim()}
                  className="flex-1"
                >
                  Verify Hash
                </Button>
                {hashVerificationResult && (
                  <Button size="large" onClick={handleClearHashVerification}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          {hashVerificationResult && (
            <Card className="border border-gray-200 dark:border-gray-700">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  {getVerificationStatusIcon(hashVerificationResult.verified)}
                  <Title level={4} className="!text-gray-900 dark:!text-gray-100 !mb-0 font-semibold">
                    {hashVerificationResult.verified ? "Credential Verified" : "Verification Result"}
                  </Title>
                  <Tag color={getVerificationStatusColor(hashVerificationResult.verified)}>
                    {hashVerificationResult.verified ? "VERIFIED" : "NOT VERIFIED"}
                  </Tag>
                </div>

                {hashVerificationResult.credential && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Text strong>Credential Title:</Text>
                      <Paragraph className="!mb-2">{hashVerificationResult.credential.title}</Paragraph>
                      
                      <Text strong>Issuer:</Text>
                      <Paragraph className="!mb-2">{hashVerificationResult.credential.issuer}</Paragraph>
                      
                      <Text strong>Issue Date:</Text>
                      <Paragraph className="!mb-2">
                        {dayjs(hashVerificationResult.credential.issueDate).format('MMMM DD, YYYY')}
                      </Paragraph>
                      
                      <Text strong>Type:</Text>
                      <Paragraph className="!mb-2">{hashVerificationResult.credential.type}</Paragraph>
                    </div>
                    
                    <div>
                      {hashVerificationResult.user && (
                        <div className="mb-4">
                          <Text strong>Holder:</Text>
                          <div className="flex items-center gap-2 mt-1">
                            <Avatar 
                              size={32} 
                              src={hashVerificationResult.user.profilePic} 
                              icon={<UserOutlined />} 
                            />
                            <div>
                              <Text>{hashVerificationResult.user.name}</Text>
                              <br />
                              <Text type="secondary" className="text-sm">{hashVerificationResult.user.email}</Text>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {hashVerificationResult.credential.skills.length > 0 && (
                        <div>
                          <Text strong>Skills:</Text>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {hashVerificationResult.credential.skills.map((skill) => (
                              <Tag 
                                key={skill} 
                                className="border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full px-3 py-2 text-xs font-medium text-center flex items-center justify-center min-w-[70px] h-[32px] shadow-sm hover:shadow-md transition-all duration-200"
                              >
                                {skill}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {hashVerificationResult.blockchain && (
                  <Divider />
                )}

                {hashVerificationResult.blockchain && (
                  <div>
                    <Title level={5} className="!text-gray-900 dark:!text-gray-100 font-medium">
                      Blockchain Details
                    </Title>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Text strong>Verification Status:</Text>
                        <Paragraph className="!mb-2">
                          <Tag color={hashVerificationResult.blockchain.verified ? 'green' : 'red'}>
                            {hashVerificationResult.blockchain.verified ? 'Verified' : 'Not Found'}
                          </Tag>
                        </Paragraph>
                        
                        {hashVerificationResult.blockchain.verified && hashVerificationResult.blockchain.timestampDate && (
                          <>
                            <Text strong>Anchored On:</Text>
                            <Paragraph className="!mb-2">
                              {dayjs(hashVerificationResult.blockchain.timestampDate).format('MMMM DD, YYYY [at] HH:mm')}
                            </Paragraph>
                          </>
                        )}
                      </div>
                      
                      <div>
                        <Text strong>Source:</Text>
                        <Paragraph className="!mb-2 capitalize">
                          {hashVerificationResult.blockchain.source}
                        </Paragraph>
                        
                        <Text strong>Hash:</Text>
                        <Paragraph className="!mb-2 font-mono text-xs break-all">
                          {hashVerificationResult.hash}
                        </Paragraph>
                      </div>
                    </div>
                  </div>
                )}

                {!hashVerificationResult.success && (
                  <div>
                    <Text strong className="text-red-500">Error:</Text>
                    <Paragraph className="text-red-500">{hashVerificationResult.details || hashVerificationResult.message}</Paragraph>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      {contextHolder}
      <main className="relative min-h-screen w-full transition-colors duration-500 bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100 overflow-hidden">
        <PlexusBackground />

        <div className="relative z-10 w-full max-w-7xl mx-auto p-4 md:p-8 pt-10">
          <Title level={2} className="text-center mb-6 !text-gray-900 dark:!text-gray-100">
            Credential Verification Center
          </Title>
          <Paragraph className="text-center text-gray-600 dark:text-gray-400 mb-8">
            Verify learner credentials through user search or direct blockchain hash verification
          </Paragraph>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 mb-8 border border-gray-200 dark:border-gray-700">
            <Tabs
              activeKey={activeTab}
              onChange={(key) => {
                setActiveTab(key as VerificationMethod);
                if (key === "user-search") {
                  setHashVerificationResult(null);
                  setHashInput("");
                } else {
                  handleClearSearch();
                }
              }}
              items={tabs}
              size="large"
            />
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-200 dark:border-gray-700">
            <Title level={3} className="!text-gray-900 dark:!text-gray-100 mb-4 border-b pb-3 border-gray-200 dark:border-gray-700">
              <InfoCircleOutlined className="mr-2" />
              How Credential Verification Works
            </Title>
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <div className="flex items-start gap-3">
                  <SearchOutlined className="text-2xl text-blue-500 mt-1" />
                  <div>
                    <Title level={4} className="!text-gray-900 dark:!text-gray-100 !mb-2">
                      User Search Method
                    </Title>
                    <Paragraph className="text-gray-600 dark:text-gray-400">
                      Search for learners by name, username, or skills to browse their credential portfolio. 
                      Each credential shows verification status, blockchain anchoring, and detailed information.
                    </Paragraph>
                  </div>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div className="flex items-start gap-3">
                  <BlockOutlined className="text-2xl text-green-500 mt-1" />
                  <div>
                    <Title level={4} className="!text-gray-900 dark:!text-gray-100 !mb-2">
                      Hash Verification
                    </Title>
                    <Paragraph className="text-gray-600 dark:text-gray-400">
                      Directly verify credentials using their blockchain hash. This method provides 
                      cryptographic proof of credential authenticity and tamper-resistance.
                    </Paragraph>
                  </div>
                </div>
              </Col>
            </Row>
            <Divider />
            <Paragraph className="text-gray-600 dark:text-gray-400">
              Our verification system checks credentials against issuer APIs, public blockchain ledgers 
              (Ethereum, Polygon, etc.), and maintains a comprehensive database of verified credentials. 
              This multi-layer approach ensures maximum trust and reduces hiring risks.
            </Paragraph>
          </div>
        </div>

        <Modal
          title={
            <div className="flex items-center gap-2">
              <SolutionOutlined />
              <span>Credential Details</span>
            </div>
          }
          open={credentialDetailsModal.visible}
          onCancel={() => setCredentialDetailsModal({ visible: false, credential: null })}
          footer={[
            <Button 
              key="close" 
              onClick={() => setCredentialDetailsModal({ visible: false, credential: null })}
            >
              Close
            </Button>,
            credentialDetailsModal.credential?.credentialHash && (
              <Button
                key="verify-hash"
                type="primary"
                onClick={() => {
                  if (credentialDetailsModal.credential?.credentialHash) {
                    // 1. Close the Credentials Details Modal
                    setCredentialDetailsModal({ visible: false, credential: null });

                    // FIX: Close the outer modal (User Credentials Modal)
                    handleCloseCredentialsModal();

                    // 2. Set the Hash input field value
                    setHashInput(credentialDetailsModal.credential.credentialHash);
                    
                    // 3. Switch to the Hash Verification tab
                    setActiveTab("hash-verification");
                    
                  } else {
                    notificationApi.error({ 
                      message: "No Hash Available", 
                      description: "This credential doesn't have a blockchain hash to verify."
                    });
                  }
                }}
              >
                Verify on Blockchain
              </Button>
            ),
          ]}
          width={800}
        >
          {credentialDetailsModal.credential && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {credentialDetailsModal.credential.imageUrl && (
                  <Avatar 
                    size={80} 
                    src={credentialDetailsModal.credential.imageUrl} 
                    icon={<SolutionOutlined />} 
                  />
                )}
                <div className="flex-1">
                  <Title level={4} className="!text-gray-900 dark:!text-gray-100 !mb-2">
                    {credentialDetailsModal.credential.title}
                  </Title>
                  <div className="flex items-center gap-2 mb-2">
                    {credentialDetailsModal.credential.isBlockchainVerified && (
                      <Tag color="blue" icon={<SafetyCertificateOutlined />}>
                        Blockchain Verified
                      </Tag>
                    )}
                    <Tag color="geekblue">{credentialDetailsModal.credential.type}</Tag>
                  </div>
                  <Text type="secondary">
                    Issued by {credentialDetailsModal.credential.issuer} on{' '}
                    {dayjs(credentialDetailsModal.credential.issueDate).format('MMMM DD, YYYY')}
                  </Text>
                </div>
              </div>

              <Divider />

              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <div>
                    <Text strong>Credential Type:</Text>
                    <Paragraph className="!mb-2">{credentialDetailsModal.credential.type}</Paragraph>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div>
                    <Text strong>Issue Date:</Text>
                    <Paragraph className="!mb-2">
                      {dayjs(credentialDetailsModal.credential.issueDate).format('MMMM DD, YYYY')}
                    </Paragraph>
                  </div>
                </Col>
                {credentialDetailsModal.credential.nsqfLevel && (
                  <Col xs={24} sm={12}>
                    <div>
                      <Text strong>NSQF Level:</Text>
                      <Paragraph className="!mb-2">Level {credentialDetailsModal.credential.nsqfLevel}</Paragraph>
                    </div>
                  </Col>
                )}
                {credentialDetailsModal.credential.creditPoints && (
                  <Col xs={24} sm={12}>
                    <div>
                      <Text strong>Credit Points:</Text>
                      <Paragraph className="!mb-2">{credentialDetailsModal.credential.creditPoints}</Paragraph>
                    </div>
                  </Col>
                )}
              </Row>

              {credentialDetailsModal.credential.description && (
                <div>
                  <Text strong>Description:</Text>
                  <Paragraph className="!mb-4">{credentialDetailsModal.credential.description}</Paragraph>
                </div>
              )}

              {credentialDetailsModal.credential.skills.length > 0 && (
                <div>
                  <Text strong>Skills Covered:</Text>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {credentialDetailsModal.credential.skills.map((skill) => (
                      <Tag 
                        key={skill} 
                        className="border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full px-4 py-2 text-sm font-medium text-center flex items-center justify-center min-w-[75px] h-[34px] shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        {skill}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}

              {credentialDetailsModal.credential.isBlockchainVerified && (
                <>
                  <Divider />
                  <div>
                    <Title level={5} className="!text-gray-900 dark:!text-gray-100 flex items-center gap-2">
                      <SafetyCertificateOutlined className="text-green-500" />
                      Blockchain Verification
                    </Title>
                    {credentialDetailsModal.credential.credentialHash && (
                      <div className="mb-3">
                        <Text strong>Credential Hash:</Text>
                        <Paragraph className="!mb-2 font-mono text-xs break-all bg-gray-100 dark:bg-gray-700 p-2 rounded">
                          {credentialDetailsModal.credential.credentialHash}
                        </Paragraph>
                      </div>
                    )}
                    {credentialDetailsModal.credential.transactionHash && (
                      <div>
                        <Text strong>Transaction Hash:</Text>
                        <Paragraph className="!mb-2 font-mono text-xs break-all bg-gray-100 dark:bg-gray-700 p-2 rounded">
                          {credentialDetailsModal.credential.transactionHash}
                        </Paragraph>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </Modal>

        <Modal
          title={
            credentialsModal.user && (
              <div className="flex items-center gap-3">
                <Avatar size={40} src={credentialsModal.user.avatarUrl} icon={<UserOutlined />} />
                <div>
                  <Text strong className="text-lg">{credentialsModal.user.name}'s Credentials</Text>
                  {credentialsModal.user.hasRealUsername && (
                    <div className="text-sm text-gray-500">@{credentialsModal.user.username}</div>
                  )}
                </div>
              </div>
            )
          }
          open={credentialsModal.visible}
          onCancel={handleCloseCredentialsModal}
          footer={[
            <Button key="close" onClick={handleCloseCredentialsModal}>
              Close
            </Button>,
            <Button key="search-again" type="primary" onClick={handleClearSearch}>
              Search Again
            </Button>,
          ]}
          width={900}
          className="credentials-modal"
        >
          {credentialsLoading ? (
            <div className="text-center py-12">
              <Spin size="large" />
              <Paragraph className="mt-4 text-gray-600 dark:text-gray-400">Loading credentials...</Paragraph>
            </div>
          ) : userCredentials.length === 0 ? (
            <div className="text-center py-12">
              <Empty 
                description="No credentials found for this user"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between">
                  <div>
                    <Text strong className="text-blue-900 dark:text-blue-100">Total Credentials: {userCredentials.length}</Text>
                    <div className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Verified: {userCredentials.filter(c => c.status === 'verified').length} • 
                      Blockchain: {userCredentials.filter(c => c.isBlockchainVerified).length}
                    </div>
                  </div>
                  <SafetyCertificateOutlined className="text-2xl text-blue-600" />
                </div>
              </div>
              
              <List
                dataSource={paginatedCredentials}
                renderItem={(credential) => (
                  <List.Item
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 p-4 rounded-lg transition-colors duration-200"
                    actions={[
                      <Button
                        key="view"
                        type="primary"
                        ghost
                        icon={<EyeOutlined />}
                        onClick={() => setCredentialDetailsModal({ visible: true, credential })}
                        className="rounded-full"
                      >
                        View Details
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div className="relative">
                          <Avatar 
                            size={56} 
                            src={credential.imageUrl} 
                            icon={<SolutionOutlined />}
                            className="border-2 border-white dark:border-gray-700 shadow-lg"
                          />
                          {credential.isBlockchainVerified && (
                            <div className="absolute -top-1 -right-1">
                              <SafetyCertificateOutlined className="text-green-500 text-lg bg-white dark:bg-gray-800 rounded-full p-1" />
                            </div>
                          )}
                        </div>
                      }
                      title={
                        <div className="flex items-center gap-2 flex-wrap">
                          <Text strong className="text-lg">{credential.title}</Text>
                          {credential.isBlockchainVerified && (
                            <Tooltip title="Blockchain Verified">
                              <Tag color="green" className="rounded-full">
                                <SafetyCertificateOutlined /> Verified
                              </Tag>
                            </Tooltip>
                          )}
                          <Tag color="blue" className="rounded-full">{credential.type}</Tag>
                        </div>
                      }
                      description={
                        <div className="space-y-2">
                          <Text type="secondary" className="text-base">
                            Issued by <Text strong>{credential.issuer}</Text> • {dayjs(credential.issueDate).format('MMM DD, YYYY')}
                          </Text>
                          {credential.description && (
                            <Paragraph className="text-gray-600 dark:text-gray-400 text-sm !mb-2">
                              {credential.description}
                            </Paragraph>
                          )}
                          {credential.skills.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {credential.skills.slice(0, 4).map((skill) => (
                                <Tag 
                                  key={skill} 
                                  className="text-xs rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 border-0 px-3 py-1.5 text-center flex items-center justify-center min-w-[55px] h-[26px] shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                  {skill}
                                </Tag>
                              ))}
                              {credential.skills.length > 4 && (
                                <Tag className="text-xs rounded-full px-3 py-1.5 text-center flex items-center justify-center min-w-[55px] h-[26px] bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                  +{credential.skills.length - 4} more
                                </Tag>
                              )}
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
              
              <Divider className="my-2" />
              <div className="flex justify-end items-center gap-4">
                <Text type="secondary" className="text-sm">
                  Page {currentPage} of {totalPages}
                </Text>
                <Pagination
                  simple
                  current={currentPage}
                  total={userCredentials.length}
                  pageSize={CREDENTIALS_PER_PAGE}
                  onChange={setCurrentPage}
                  prevIcon={<LeftOutlined />}
                  nextIcon={<RightOutlined />}
                  showSizeChanger={false}
                />
              </div>
            </div>
          )}
        </Modal>
      </main>
    </>
  );
};

const EmployerVerifyCredentialPage = () => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const antTheme = useMemo(() => {
    return {
      algorithm: isDark ? [theme.darkAlgorithm] : [theme.defaultAlgorithm],
      token: {
        colorPrimary: isDark ? "#60a5fa" : "#34d399",
        colorLink: isDark ? "#60a5fa" : "#34d399",
        colorBgContainer: isDark ? "#1f2937" : "#ffffff",
        colorBorder: isDark ? "#4b5563" : "#d1d5db",
        colorTextBase: isDark ? "#e2e8f0" : "#1f2937",
      },
      components: {
        Tabs: {
          colorPrimary: isDark ? "#60a5fa" : "#34d399",
          inkBarColor: isDark ? "#60a5fa" : "#34d399",
          itemSelectedColor: isDark ? "#60a5fa" : "#34d399",
          itemHoverColor: isDark ? "#60a5fa" : "#34d399",
          itemColor: isDark ? "#94a3b8" : "#4b5563",
          cardBg: isDark ? "#1f2937" : "#f3f4f6",
        },
        Input: {
          activeBorderColor: isDark ? "#60a5fa" : "#34d399",
          hoverBorderColor: isDark ? "#60a5fa" : "#34d399",
        },
        Button: {
          colorPrimary: isDark ? "#60a5fa" : "#34d399",
          colorPrimaryHover: isDark ? "#3b82f6" : "#10b981",
        },
        Card: {
            colorBgContainer: isDark ? "#1f2937" : "#ffffff",
        }
      },
    } as const;
  }, [isDark]);
  
  return (
    <RoleGuard allowedRole="employer">
      <ConfigProvider theme={antTheme}> 
        <div className="flex min-h-screen">
          <EmployerSidebar />
          <div className="flex-1 flex flex-col">
            <header className="flex items-center justify-end p-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
              <Space>
                <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
                <LanguageSwitcher />
              </Space>
            </header>
            <div className="flex-1 overflow-auto">
              <VerifyCredentialContent />
            </div>
          </div>
        </div>
      </ConfigProvider>
    </RoleGuard>
  );
}

export default EmployerVerifyCredentialPage;
