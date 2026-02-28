"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
const Sidebar = dynamic(() => import("@/components/dashboard/Sidebar"), { ssr: false });
import api from "@/utils/axios";
import { Button } from "@/components/ui/button";
import { Card as AntCard, Row, Col, Space, Empty, Skeleton, ConfigProvider, theme as antdTheme, App, Progress, Badge, Tooltip, Avatar } from "antd";
import { TrendingUp, Target, Award, BookOpen, Trophy, Star, Zap, Crown, Users } from "lucide-react";
import { useTheme } from "next-themes";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";

// Import types
import { 
  NSQFProfile, 
  SkillDomain, 
  Recommendation, 
  LevelInfo, 
  SkillDetails,
  StackabilityMap,
  VisualizationData
} from "@/types/nsqf";

function NSQFProgressPageContent() {
  const { message } = App.useApp();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const { theme: mode } = useTheme();
  const isDark = (mode ?? "light") === "dark";

  // State
  const [profile, setProfile] = useState<NSQFProfile | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [skillDetails, setSkillDetails] = useState<SkillDetails | null>(null);
  const [levelInfo, setLevelInfo] = useState<LevelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [stackabilityMap, setStackabilityMap] = useState<StackabilityMap | null>(null);
  const [visualizationData, setVisualizationData] = useState<VisualizationData | null>(null);

  // Fetch NSQF profile
  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await api.get("/api/nsqf/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setProfile(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching NSQF profile:", error);
      message.error("Failed to load NSQF profile");
    }
  };

  // Fetch recommendations
  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await api.get("/api/nsqf/recommendations", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setRecommendations(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    }
  };

  // Fetch skill progress details
  const fetchSkillDetails = async (skillDomain: string) => {
    if (!skillDomain) return;
    
    setLoadingDetails(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await api.get(`/api/nsqf/progress/${encodeURIComponent(skillDomain)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setSkillDetails(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching skill details:", error);
      message.error("Failed to load skill details");
    } finally {
      setLoadingDetails(false);
    }
  };

  // Fetch level information
  const fetchLevelInfo = async () => {
    try {
      const levels = [];
      for (let i = 1; i <= 10; i++) {
        const response = await api.get(`/api/nsqf/levels/${i}`);
        if (response.data.success) {
          levels.push(response.data.data);
        }
      }
      setLevelInfo(levels);
    } catch (error) {
      console.error("Error fetching level info:", error);
    }
  };

  // Fetch stackability map
  const fetchStackabilityMap = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const response = await api.get("/api/nsqf/stackability-map", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setStackabilityMap(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stackability map:", error);
    }
  };

  // Fetch visualization data
  const fetchVisualizationData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const response = await api.get("/api/nsqf/visualization-data", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setVisualizationData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching visualization data:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProfile(),
        fetchRecommendations(),
        fetchLevelInfo(),
        fetchStackabilityMap(),
        fetchVisualizationData(),
      ]);
      setLoading(false);
    };

    loadData();
  }, []);

  useEffect(() => {
    if (selectedSkill) {
      fetchSkillDetails(selectedSkill);
    }
  }, [selectedSkill]);

  // Helper functions
  const getLevelIcon = (level: number) => {
    if (level === 0) return <BookOpen className="w-5 h-5" />;
    if (level <= 2) return <Star className="w-5 h-5" />;
    if (level <= 4) return <Award className="w-5 h-5" />;
    if (level <= 6) return <Trophy className="w-5 h-5" />;
    if (level <= 8) return <Zap className="w-5 h-5" />;
    return <Crown className="w-5 h-5" />;
  };

  const getLevelColor = (level: number) => {
    if (level === 0) return "#8c8c8c";
    if (level <= 2) return "#52c41a";
    if (level <= 4) return "#1890ff";
    if (level <= 6) return "#722ed1";
    if (level <= 8) return "#eb2f96";
    return "#f5222d";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 30) return "#ff4d4f";
    if (percentage < 70) return "#faad14";
    return "#52c41a";
  };

  if (!mounted) return null;

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorBgBase: isDark ? "#1f2937" : "#f0fdf4",
          colorBgContainer: isDark ? "rgba(31, 41, 55, 0.6)" : "rgba(255, 255, 255, 0.6)",
          colorBgElevated: isDark ? "rgba(31, 41, 55, 0.8)" : "rgba(255, 255, 255, 0.8)",
          colorText: "var(--color-foreground)",
          colorTextSecondary: "var(--color-muted-foreground)",
          colorBorder: isDark ? "#065f46" : "#a7f3d0",
          colorPrimary: "var(--color-primary)",
          colorLink: "var(--color-primary)",
          colorLinkHover: "var(--color-primary)",
          borderRadius: 12,
        },
        components: {
          Card: {
            colorBgContainer: isDark ? "rgba(31, 41, 55, 0.6)" : "rgba(255, 255, 255, 0.6)",
            headerBg: isDark ? "rgba(31, 41, 55, 0.6)" : "rgba(255, 255, 255, 0.6)",
            colorBorderSecondary: isDark ? "#065f46" : "#a7f3d0",
          },
          Progress: {
            defaultColor: "var(--color-primary)",
          },
        },
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-gray-800 dark:text-gray-200 flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                NSQF Progress Tracking
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Track your skill development journey across NSQF levels
              </p>
            </div>
            <Space>
              <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
            </Space>
          </div>

          {loading ? (
            <div className="space-y-6">
              <Skeleton active paragraph={{ rows: 4 }} />
              <Row gutter={[20, 20]}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Col xs={24} sm={12} lg={8} key={i}>
                    <AntCard className="border-emerald-100 dark:border-emerald-800 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg">
                      <Skeleton active avatar paragraph={{ rows: 3 }} />
                    </AntCard>
                  </Col>
                ))}
              </Row>
            </div>
          ) : !profile ? (
            <AntCard className="py-12 border-emerald-100 dark:border-emerald-800 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg">
              <Empty 
                description="No NSQF data found. Start by adding some credentials to build your skill profile!" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            </AntCard>
          ) : (
            <div className="space-y-8">
              {/* Overall Stats */}
              <Row gutter={[20, 20]}>
                <Col xs={24} sm={6}>
                  <AntCard className="border-emerald-100 dark:border-emerald-800 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg text-center">
                    <div className="text-3xl font-bold text-primary mb-2">{profile.totalSkills}</div>
                    <div className="text-sm text-muted-foreground">Skill Domains</div>
                  </AntCard>
                </Col>
                <Col xs={24} sm={6}>
                  <AntCard className="border-emerald-100 dark:border-emerald-800 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg text-center">
                    <div className="text-3xl font-bold text-primary mb-2">{profile.highestLevel}</div>
                    <div className="text-sm text-muted-foreground">Highest Level</div>
                  </AntCard>
                </Col>
                <Col xs={24} sm={6}>
                  <AntCard className="border-emerald-100 dark:border-emerald-800 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg text-center">
                    <div className="text-3xl font-bold text-primary mb-2">{profile.totalCredentials}</div>
                    <div className="text-sm text-muted-foreground">Total Credentials</div>
                  </AntCard>
                </Col>
                <Col xs={24} sm={6}>
                  <AntCard className="border-emerald-100 dark:border-emerald-800 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg text-center">
                    <div className="text-3xl font-bold text-primary mb-2">{profile.totalPoints}</div>
                    <div className="text-sm text-muted-foreground">Total Points</div>
                  </AntCard>
                </Col>
              </Row>

              {/* NSQF Stackability Ladder as Timeline Visualization */}
              {stackabilityMap && stackabilityMap.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-accent" />
                    NSQF Stackability Ladder
                  </h2>
                  <div className="flex flex-col gap-8">
                    {stackabilityMap.map((entry, idx) => (
                      <div key={entry.skillDomain} className="relative flex items-center">
                        {/* Timeline connector */}
                        {idx !== 0 && (
                          <div className="absolute left-6 top-0 h-full w-1 bg-accent/30" style={{ zIndex: 0 }} />
                        )}
                        <div className="flex items-center z-10">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-accent/20 mr-4">
                            {getLevelIcon(entry.completedLevels.length > 0 ? entry.completedLevels[entry.completedLevels.length-1].level : 0)}
                          </div>
                          <div>
                            <div className="font-bold text-primary text-lg">{entry.skillDomain}</div>
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {entry.completedLevels.map((lvl) => (
                                <span key={lvl.level} className="px-2 py-1 rounded bg-success/20 text-success text-xs font-semibold">
                                  {lvl.name} (Level {lvl.level})
                                </span>
                              ))}
                              {entry.inProgressLevel && (
                                <span className="px-2 py-1 rounded bg-warning/20 text-warning text-xs font-semibold">
                                  In Progress: {entry.nextLevelName} (Level {entry.inProgressLevel})
                                  {entry.pointsNeeded > 0 && ` - Need ${entry.pointsNeeded} pts`}
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground mt-2">
                              Certificates: {entry.certificates.length > 0 ? entry.certificates.map(cert => cert.title).join(", ") : "None yet"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skill Domains as Actionable Cards */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Your Skill Domains
                </h2>
                <Row gutter={[20, 20]}>
                  {profile.skills.map((skill) => (
                    <Col xs={24} sm={12} lg={8} key={skill.skillDomain}>
                      <AntCard
                        className={`border-emerald-100 dark:border-emerald-800 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg cursor-pointer transition-all hover:shadow-xl ${selectedSkill === skill.skillDomain ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => setSelectedSkill(skill.skillDomain)}
                        styles={{ body: { padding: "24px" } }}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            {getLevelIcon(skill.currentLevel)}
                            <span className="font-semibold text-lg text-primary">{skill.skillDomain}</span>
                          </div>
                          <Badge 
                            count={skill.certificatesCount}
                            style={{ backgroundColor: getLevelColor(skill.currentLevel) }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Progress
                            percent={skill.progress.progressPercentage}
                            showInfo={false}
                            strokeColor={skill.progress.progressPercentage === 100 ? "#52c41a" : getProgressColor(skill.progress.progressPercentage)}
                            trailColor={isDark ? "#1f1f1f" : "#f5f5f5"}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Current: {skill.totalPoints} points</span>
                            {skill.progress.isMaxLevel ? (
                              <span className="text-gold">Max Level</span>
                            ) : (
                              <span>Level up available!</span>
                            )}
                          </div>
                          {skill.progress.progressPercentage === 100 && !skill.progress.isMaxLevel && (
                            <Button variant="default" size="sm" className="mt-2 w-full" onClick={(e) => { e.stopPropagation(); setSelectedSkill(skill.skillDomain); }}>
                              Ready for Level {skill.progress.nextLevel || (skill.currentLevel + 1)}!
                            </Button>
                          )}
                          {skill.progress.isMaxLevel && (
                            <Badge color="gold" text="Max Level Achieved!" />
                          )}
                        </div>
                      </AntCard>
                    </Col>
                  ))}
                </Row>
              </div>

              {/* Skill Details Expanded Section */}
              {selectedSkill && (
                <AntCard
                  title={
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-primary" />
                      {selectedSkill} - Detailed Progress
                    </div>
                  }
                  className="border-emerald-100 dark:border-emerald-800 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg mt-8 mb-12"
                  extra={
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedSkill(null)}
                    >
                      Close
                    </Button>
                  }
                >
                  {loadingDetails ? (
                    <Skeleton active paragraph={{ rows: 6 }} />
                  ) : skillDetails ? (
                    <div className="space-y-6">
                      {/* Current Level & Next Level Progress */}
                      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg">
                        <Row gutter={[24, 0]}>
                          {/* Current Level Status */}
                          <Col xs={24} md={12}>
                            <div className="text-center">
                              <div 
                                className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-white text-xl font-bold"
                                style={{ backgroundColor: getLevelColor(skillDetails.currentLevel) }}
                              >
                                {skillDetails.currentLevel}
                              </div>
                              <h3 className="text-lg font-semibold">Current Level</h3>
                              <p className="text-muted-foreground">{skillDetails.levelName}</p>
                              <div className="text-sm text-success font-medium mt-2">
                                ✅ {skillDetails.totalPoints} Points Earned
                              </div>
                            </div>
                          </Col>

                          {/* Next Level Progress */}
                          <Col xs={24} md={12}>
                            {!skillDetails.progress.isMaxLevel ? (
                              <div className="text-center">
                                <div 
                                  className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-white text-xl font-bold border-4 border-dashed"
                                  style={{ 
                                    backgroundColor: skillDetails.progress.progressPercentage > 0 ? getLevelColor(skillDetails.progress.nextLevel || skillDetails.currentLevel + 1) : 'transparent',
                                    borderColor: getLevelColor(skillDetails.progress.nextLevel || skillDetails.currentLevel + 1),
                                    opacity: skillDetails.progress.progressPercentage > 0 ? 1 : 0.5
                                  }}
                                >
                                  {skillDetails.progress.nextLevel || (skillDetails.currentLevel + 1)}
                                </div>
                                <h3 className="text-lg font-semibold">Next Target</h3>
                                <p className="text-muted-foreground">{skillDetails.progress.nextLevelName}</p>
                                <div className="mt-3">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Progress</span>
                                    <span>{skillDetails.progress.progressPercentage}%</span>
                                  </div>
                                  <Progress
                                    percent={skillDetails.progress.progressPercentage}
                                    strokeColor={{
                                      '0%': '#1890ff',
                                      '100%': '#52c41a',
                                    }}
                                    trailColor={isDark ? "#1f1f1f" : "#f5f5f5"}
                                    size="small"
                                  />
                                  <div className="text-sm text-primary font-medium mt-1">
                                    {skillDetails.progress.pointsNeeded} more points needed
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-white text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-600">
                                  👑
                                </div>
                                <h3 className="text-lg font-semibold text-yellow-600">Maximum Level!</h3>
                                <p className="text-muted-foreground">You've mastered this skill domain</p>
                                <Badge color="gold" text="Grand Master Achieved!" />
                              </div>
                            )}
                          </Col>
                        </Row>
                      </div>

                      {/* Level Up History */}
                      {skillDetails.levelUpHistory && skillDetails.levelUpHistory.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Trophy className="w-4 h-4" />
                            Level Up History
                          </h4>
                          <div className="space-y-3">
                            {skillDetails.levelUpHistory
                              .sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime())
                              .map((levelUp, index) => (
                                <div key={index} className="flex items-center gap-4 p-4 bg-success/10 rounded-lg border-l-4 border-success">
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                      style={{ backgroundColor: getLevelColor(levelUp.fromLevel) }}
                                    >
                                      {levelUp.fromLevel}
                                    </div>
                                    <TrendingUp className="w-4 h-4 text-success" />
                                    <div 
                                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                      style={{ backgroundColor: getLevelColor(levelUp.toLevel) }}
                                    >
                                      {levelUp.toLevel}
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-success">
                                      Reached Level {levelUp.toLevel}!
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {new Date(levelUp.achievedAt).toLocaleDateString('en-US', { 
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </div>
                                  </div>
                                  <Badge color="green" text={`Level ${levelUp.toLevel}`} />
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Certificates */}
                      {skillDetails.certificates && skillDetails.certificates.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Award className="w-4 h-4" />
                            Certificates ({skillDetails.certificates.length})
                          </h4>
                          <Row gutter={[16, 16]}>
                            {skillDetails.certificates.slice(0, 6).map((cert: any) => (
                              <Col xs={24} sm={12} key={cert._id}>
                                <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                                  <Avatar 
                                    size="small" 
                                    style={{ backgroundColor: getLevelColor(cert.nsqfLevel || 1) }}
                                  >
                                    {cert.nsqfLevel || '1'}
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm truncate">{cert.title}</div>
                                    <div className="text-xs text-muted-foreground">{cert.issuer}</div>
                                  </div>
                                  <Badge 
                                    count={`${cert.creditPoints || 0}pts`}
                                    style={{ fontSize: '10px', height: '16px', lineHeight: '16px' }}
                                  />
                                </div>
                              </Col>
                            ))}
                          </Row>
                          {skillDetails.certificates.length > 6 && (
                            <div className="text-center mt-3">
                              <Button variant="outline" size="sm">
                                View All {skillDetails.certificates.length} Certificates
                              </Button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Level Up History */}
                      {skillDetails.levelUpHistory && skillDetails.levelUpHistory.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Trophy className="w-4 h-4" />
                            Level Up History
                          </h4>
                          <div className="space-y-2">
                            {skillDetails.levelUpHistory.slice(0, 3).map((levelUp: any, index: number) => (
                              <div key={index} className="flex items-center gap-3 p-3 bg-success/10 rounded-lg">
                                <div className="p-2 bg-success/20 rounded-full">
                                  <TrendingUp className="w-4 h-4 text-success" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-medium">
                                    Level {levelUp.fromLevel} → {levelUp.toLevel}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {new Date(levelUp.achievedAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </AntCard>
              )}

              {/* Smart Learning Recommendations */}
              {recommendations.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    Personalized Learning Path
                  </h2>
                  <Row gutter={[20, 20]}>
                    {/* Priority Recommendation */}
                    {recommendations.length > 0 && (
                      <Col xs={24}>
                        <AntCard className="border-emerald-200 dark:border-emerald-700 shadow-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                          <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/20 rounded-full">
                              <Star className="w-8 h-8 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge color="blue" text="Recommended Next" />
                                <div className="text-lg font-semibold">
                                  {recommendations[0].skillDomain}
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground mb-2">
                                You're {recommendations[0].progressPercentage}% of the way to Level {recommendations[0].targetLevel}! 
                                Just {recommendations[0].pointsNeeded} more points needed.
                              </div>
                              <Progress
                                percent={recommendations[0].progressPercentage}
                                showInfo={false}
                                strokeColor={{
                                  '0%': '#1890ff',
                                  '100%': '#52c41a',
                                }}
                                trailColor={isDark ? "#1f1f1f" : "#f5f5f5"}
                                size="small"
                              />
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-primary">
                                Est. {Math.ceil(recommendations[0].pointsNeeded / 20)} courses
                              </div>
                              <div className="text-xs text-muted-foreground">
                                to complete
                              </div>
                            </div>
                          </div>
                        </AntCard>
                      </Col>
                    )}

                    {/* Other Recommendations */}
                    {recommendations.slice(1, 4).map((rec, index) => (
                      <Col xs={24} sm={12} lg={8} key={rec.skillDomain}>
                        <AntCard
                          className="border-emerald-100 dark:border-emerald-800 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg h-full"
                          styles={{ body: { padding: "20px" } }}
                        >
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold text-foreground">{rec.skillDomain}</h3>
                                <p className="text-sm text-muted-foreground">
                                  Level {rec.currentLevel} → {rec.targetLevel}
                                </p>
                              </div>
                              <Badge 
                                color={index === 0 ? "orange" : index === 1 ? "green" : "blue"}
                                text={index === 0 ? "Next Goal" : index === 1 ? "Consider" : "Future"}
                              />
                            </div>

                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span>{rec.progressPercentage}%</span>
                              </div>
                              <Progress
                                percent={rec.progressPercentage}
                                showInfo={false}
                                strokeColor={getProgressColor(rec.progressPercentage)}
                                trailColor={isDark ? "#1f1f1f" : "#f5f5f5"}
                                size="small"
                              />
                              <div className="text-xs text-muted-foreground mt-1">
                                {rec.pointsNeeded} points • ~{Math.ceil(rec.pointsNeeded / 20)} courses
                              </div>
                            </div>

                            {rec.suggestions.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                                  <BookOpen className="w-3 h-3" />
                                  Top Picks:
                                </h4>
                                <div className="space-y-2">
                                  {rec.suggestions.slice(0, 2).map((suggestion, suggestionIndex) => (
                                    <div key={suggestionIndex} className="text-xs p-2 bg-muted/20 rounded hover:bg-muted/30 transition-colors">
                                      <div className="font-medium flex items-center justify-between">
                                        <span className="truncate">{suggestion.title}</span>
                                        <Badge 
                                          count={`${suggestion.points}pts`}
                                          style={{ fontSize: '9px', height: '14px', lineHeight: '14px' }}
                                        />
                                      </div>
                                      <div className="text-muted-foreground">
                                        {suggestion.platform}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </AntCard>
                      </Col>
                    ))}
                    
                    {/* View All Recommendations */}
                    {recommendations.length > 4 && (
                      <Col xs={24}>
                        <div className="text-center">
                          <Button variant="outline" onClick={() => message.info("View all recommendations coming soon!")}>
                            View All {recommendations.length} Recommendations
                          </Button>
                        </div>
                      </Col>
                    )}
                  </Row>
                </div>
              )}

              {/* Learning Pathway & Achievement Timeline */}
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Your Learning Journey
                </h2>
                <Row gutter={[20, 20]}>
                  {/* Recent Achievements & Completed Levels */}
                  <Col xs={24} lg={8}>
                    <AntCard className="border-emerald-200 dark:border-emerald-700 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 h-full">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-center flex items-center justify-center gap-2">
                          <Award className="w-4 h-4 text-success" />
                          Levels Completed
                        </h3>
                        
                        {profile?.skills?.filter(s => s.currentLevel > 0).length > 0 ? (
                          <div className="space-y-3">
                            {profile.skills
                              .filter(s => s.currentLevel > 0)
                              .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
                              .slice(0, 3)
                              .map((skill, index) => (
                                <div key={skill.skillDomain} className="flex items-center gap-3 p-2 bg-success/5 rounded-lg">
                                  <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                    style={{ backgroundColor: getLevelColor(skill.currentLevel) }}
                                  >
                                    {skill.currentLevel}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium truncate">{skill.skillDomain}</div>
                                    <div className="text-xs text-success font-medium">{skill.levelName}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {new Date(skill.lastUpdated).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </div>
                                  </div>
                                  <Badge 
                                    count={`${skill.totalPoints}pts`}
                                    style={{ backgroundColor: getLevelColor(skill.currentLevel), fontSize: '10px' }}
                                  />
                                </div>
                              ))}
                            
                            <div className="text-center pt-3 border-t border-border/50">
                              <div className="text-lg font-bold text-success">
                                {profile.skills.reduce((sum, s) => sum + s.currentLevel, 0)}
                              </div>
                              <div className="text-xs text-muted-foreground">Total Levels Achieved</div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground text-sm py-6">
                            <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            Complete your first level by adding credentials!
                          </div>
                        )}
                      </div>
                    </AntCard>
                  </Col>

                  {/* Current Active Goals */}
                  <Col xs={24} lg={8}>
                    <AntCard className="border-emerald-200 dark:border-emerald-700 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 h-full">
                      <div className="space-y-4">
                        <h3 className="font-semibold text-center flex items-center justify-center gap-2">
                          <Target className="w-4 h-4 text-primary" />
                          Current Goals
                        </h3>
                        
                        {profile?.skills?.filter(s => !s.progress.isMaxLevel && s.progress.progressPercentage > 0).length > 0 ? (
                          <div className="space-y-3">
                            {profile.skills
                              .filter(s => !s.progress.isMaxLevel && s.progress.progressPercentage > 0)
                              .sort((a, b) => b.progress.progressPercentage - a.progress.progressPercentage)
                              .slice(0, 2)
                              .map((skill, index) => (
                                <div key={skill.skillDomain} className="p-3 bg-primary/5 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <div 
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                        style={{ backgroundColor: getLevelColor(skill.progress.nextLevel || skill.currentLevel + 1) }}
                                      >
                                        {skill.progress.nextLevel || (skill.currentLevel + 1)}
                                      </div>
                                      <div>
                                        <div className="text-sm font-medium">{skill.skillDomain}</div>
                                        <div className="text-xs text-muted-foreground">
                                          To {skill.progress.nextLevelName}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-bold text-primary">
                                        {skill.progress.progressPercentage}%
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <Progress
                                    percent={skill.progress.progressPercentage}
                                    showInfo={false}
                                    strokeColor={getProgressColor(skill.progress.progressPercentage)}
                                    trailColor={isDark ? "#1f1f1f" : "#f5f5f5"}
                                    size="small"
                                  />
                                  
                                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                                    <span>{skill.totalPoints} points earned</span>
                                    <span>{skill.progress.pointsNeeded} more needed</span>
                                  </div>
                                  
                                  {/* Estimated completion */}
                                  <div className="text-center mt-2">
                                    <div className="text-xs text-primary">
                                      🎯 {Math.ceil(skill.progress.pointsNeeded / 15)} more credentials needed
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground text-sm py-6">
                            <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            Start earning points to see your active goals!
                          </div>
                        )}
                      </div>
                    </AntCard>
                  </Col>

                  {/* Next Milestones & Industry Insights */}
                  <Col xs={24} lg={8}>
                    <AntCard className="border-emerald-100 dark:border-emerald-800 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-lg h-full">
                      <div className="space-y-4">
                        {/* Next Milestones */}
                        <div>
                          <h3 className="font-semibold text-center flex items-center justify-center gap-2 mb-3">
                            <Zap className="w-4 h-4 text-accent" />
                            Next Milestones
                          </h3>
                          
                          {profile?.skills?.filter(s => !s.progress.isMaxLevel).length > 0 ? (
                            <div className="space-y-2">
                              {profile.skills
                                .filter(s => !s.progress.isMaxLevel)
                                .sort((a, b) => {
                                  // Prioritize skills with some progress, then by points needed
                                  if (a.progress.progressPercentage > 0 && b.progress.progressPercentage === 0) return -1;
                                  if (b.progress.progressPercentage > 0 && a.progress.progressPercentage === 0) return 1;
                                  return a.progress.pointsNeeded - b.progress.pointsNeeded;
                                })
                                .slice(0, 3)
                                .map((skill, index) => (
                                  <div key={skill.skillDomain} className="flex items-center gap-2 p-2 bg-muted/10 rounded">
                                    <div 
                                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                      style={{ backgroundColor: getLevelColor(skill.progress.nextLevel || skill.currentLevel + 1) }}
                                    >
                                      {skill.progress.nextLevel || (skill.currentLevel + 1)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-xs font-medium truncate">{skill.skillDomain}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {skill.progress.pointsNeeded} pts → {skill.progress.nextLevelName}
                                      </div>
                                    </div>
                                    <div className="text-xs text-accent font-medium">
                                      {skill.progress.progressPercentage > 0 ? `${skill.progress.progressPercentage}%` : 'Start'}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground text-xs py-3">
                              All skills at maximum level! 🎉
                            </div>
                          )}
                        </div>

                        {/* Quick Stats */}
                        <div className="pt-3 border-t border-border/50">
                          <div className="grid grid-cols-2 gap-3 text-center">
                            <div>
                              <div className="text-lg font-bold text-primary">
                                {Math.round(((profile?.totalPoints || 0) / Math.max(profile?.totalCredentials || 1, 1)) * 10) / 10}
                              </div>
                              <div className="text-xs text-muted-foreground">Avg Points/Cert</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-accent">
                                {profile?.skills?.filter(s => s.currentLevel >= 3).length || 0}
                              </div>
                              <div className="text-xs text-muted-foreground">Advanced Skills</div>
                            </div>
                          </div>
                        </div>

                        {/* Career Level Indicator */}
                        <div className="text-center pt-2 border-t border-border/50">
                          <div className="text-xs text-muted-foreground mb-1">Career Level</div>
                          <Badge 
                            color={
                              profile?.highestLevel >= 7 ? "purple" :
                              profile?.highestLevel >= 5 ? "blue" :
                              profile?.highestLevel >= 3 ? "green" : "orange"
                            }
                            text={
                              profile?.highestLevel >= 7 ? "Senior Professional" :
                              profile?.highestLevel >= 5 ? "Mid-Level Professional" :
                              profile?.highestLevel >= 3 ? "Junior Professional" : "Entry Level"
                            }
                          />
                        </div>
                      </div>
                    </AntCard>
                  </Col>
                </Row>
              </div>
            </div>
          )}
        </main>
      </div>
    </ConfigProvider>
  );
}

import RoleGuard from "@/components/auth/RoleGuard";

export default function NSQFProgressPage() {
  return (
    <RoleGuard allowedRole="learner">
      <App>
        <NSQFProgressPageContent />
      </App>
    </RoleGuard>
  );
}
