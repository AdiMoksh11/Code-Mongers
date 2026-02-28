"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ConfigProvider, theme, Card, Row, Col, Statistic, Segmented, Badge } from "antd";
import { useTheme } from "next-themes";
import { motion } from "motion/react";
import EmployerSidebar from "@/components/dashboard/employer/EmployerSidebar";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import RoleGuard from "@/components/auth/RoleGuard";
import api from "@/utils/axios";
import type { AxiosError } from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  Legend,
} from "recharts";

// Optional: If you have an EmployerSidebar component, you can include it
// import EmployerSidebar from "@/components/dashboard/employer/EmployerSidebar";

const AnalyticsPage: React.FC = () => {
  const { theme: mode } = useTheme();
  const isDark = mode === "dark";

  const algorithm = isDark ? theme.darkAlgorithm : theme.defaultAlgorithm;

  // Types
  type KPI = {
    candidatesHired: number | null;
    credentialsVerified: number;
    profileSearches: number | null;
    interviewsScheduled: number | null;
    offerAcceptance: number | null;
  };
  type TimePoint = { date: string; count: number };
  type CredByType = { type: string; count: number };
  type HireSource = { name: string; value: number };
  type PipelinePoint = { stage: string; value: number };
  type SkillDemand = { skill: string; demand: number };

  // Static demo data for charts
  const demoHireSources: HireSource[] = [
    { name: "Job Portals", value: 45 },
    { name: "Referrals", value: 30 },
    { name: "Social Media", value: 15 },
    { name: "Direct Applications", value: 10 }
  ];

  const demoTopSkills = [
    { skill: "React.js", demand: 85 },
    { skill: "Node.js", demand: 78 },
    { skill: "Python", demand: 72 },
    { skill: "TypeScript", demand: 65 },
    { skill: "AWS", demand: 58 },
    { skill: "MongoDB", demand: 45 }
  ];

  const demoActivityData = [
    { date: "2025-10-01", count: 5 },
    { date: "2025-10-02", count: 8 },
    { date: "2025-10-03", count: 12 },
    { date: "2025-10-04", count: 7 },
    { date: "2025-10-05", count: 15 },
    { date: "2025-10-06", count: 10 },
    { date: "2025-10-07", count: 18 },
    { date: "2025-10-08", count: 14 }
  ];

  const demoCredsByType = [
    { type: "Certificate", count: 45 },
    { type: "Degree", count: 32 },
    { type: "Diploma", count: 28 },
    { type: "License", count: 15 }
  ];

  const demoPipeline = [
    { stage: "With Credentials", value: 24 },
    { stage: "With Verified", value: 18 },
    { stage: "On-Chain", value: 12 }
  ];

  const demoCandidatesHired = 12;
  const demoInterviewsScheduled = 28;
  const demoOfferAcceptance = 75;

  // Local state for analytics
  const [range, setRange] = useState<string>("7d");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KPI>({
    candidatesHired: null,
    credentialsVerified: 0,
    profileSearches: null,
    interviewsScheduled: null,
    offerAcceptance: null,
  });
  const [searchesOverTime, setSearchesOverTime] = useState<TimePoint[]>([]);
  const [credsByType, setCredsByType] = useState<CredByType[]>([]);
  const [hireSources, setHireSources] = useState<HireSource[]>([]);
  const [pipeline, setPipeline] = useState<PipelinePoint[]>([]);
  const [topSkills, setTopSkills] = useState<SkillDemand[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get(`/api/employer/analytics`, { params: { range } });
        const data = res.data?.data;
        if (!mounted || !data) return;
        
        // Use demo data for missing fields
        const enhancedKpis = {
          ...data.kpis,
          candidatesHired: data.kpis?.candidatesHired ?? demoCandidatesHired,
          interviewsScheduled: data.kpis?.interviewsScheduled ?? demoInterviewsScheduled,
          offerAcceptance: data.kpis?.offerAcceptance ?? demoOfferAcceptance
        };
        
        setKpis(enhancedKpis);
        setSearchesOverTime(data.searchesOverTime?.length > 0 ? data.searchesOverTime : demoActivityData);
        setCredsByType(data.credsByType?.length > 0 ? data.credsByType : demoCredsByType);
        setHireSources(data.hireSources?.length > 0 ? data.hireSources : demoHireSources);
        setPipeline(data.pipeline?.length > 0 ? data.pipeline : demoPipeline);
        setTopSkills(data.topSkills?.length > 0 ? data.topSkills : demoTopSkills);
      } catch (e: unknown) {
        let respMessage = 'Failed to load analytics';
        const isAxiosErr = (err: unknown): err is AxiosError<{ message?: string }> =>
          typeof err === 'object' && err !== null && 'isAxiosError' in err;

        if (isAxiosErr(e)) {
          const maybeResp = e.response?.data;
          respMessage = maybeResp?.message || e.message || respMessage;
          console.error('Fetch employer analytics failed:', maybeResp || e.message);
        } else {
          console.error('Fetch employer analytics failed:', e);
        }
        if (!mounted) return;
        setError(respMessage);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAnalytics();
    return () => { mounted = false; };
  }, [range]);

  const colors = useMemo(() => {
    const seed = {
      primary: "#3b82f6",
      success: "#22c55e",
      warning: "#f59e0b",
      violet: "#8b5cf6",
      cyan: "#06b6d4",
      pink: "#ec4899",
    };
    return seed;
  }, []);

  const axisTick = { fill: isDark ? "#d1d5db" : "#475569" } as const;
  const gridStroke = isDark ? "#374151" : "#e5e7eb";

  return (
    <>
      <style jsx global>{`
        .glassmorphism-card {
          transition: all 0.3s ease-in-out !important;
        }
        .glassmorphism-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.5) !important;
        }
        .ant-card .ant-card-head {
          background: transparent !important;
          border-bottom: 1px solid ${isDark ? 'rgba(51, 65, 85, 0.2)' : 'rgba(229, 231, 235, 0.2)'} !important;
        }
        .ant-card .ant-card-head .ant-card-head-title {
          color: ${isDark ? 'rgba(255, 255, 255, 0.92)' : '#111827'} !important;
          font-weight: 600;
        }
        .ant-statistic .ant-statistic-title {
          color: ${isDark ? 'rgba(156, 163, 175, 1)' : 'rgba(75, 85, 99, 1)'} !important;
        }
        .ant-statistic .ant-statistic-content {
          color: ${isDark ? 'rgba(255, 255, 255, 0.92)' : '#111827'} !important;
        }
      `}</style>
      <ConfigProvider
      theme={{
        algorithm,
        token: {
          colorPrimary: "#4f46e5", // Indigo 600
          colorBgBase: isDark ? "#0f172a" : "#ffffff", // Slate 900
          colorBgContainer: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)", // Glassmorphism background
          colorText: isDark ? "rgba(255,255,255,0.92)" : "#111827",
          colorBorder: isDark ? "rgba(51, 65, 85, 0.3)" : "rgba(255, 255, 255, 0.3)", // Glassmorphism borders
          borderRadius: 12,
          borderRadiusLG: 16,
          borderRadiusSM: 10,
        },
        components: {
          Card: {
            colorBgContainer: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)",
            colorBorder: isDark ? "rgba(51, 65, 85, 0.3)" : "rgba(255, 255, 255, 0.3)",
            boxShadowTertiary: isDark 
              ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
              : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          },
          Segmented: {
            colorBgLayout: "transparent",
            colorBorder: "transparent",
          }
        },
      }}
    >
      <RoleGuard allowedRole="employer">
      <div className="h-screen relative flex overflow-hidden">
        {/* Enhanced Background with Patterns and Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50/40 to-teal-50 dark:from-gray-900 dark:via-indigo-900/30 dark:to-purple-900/20">
          {/* Geometric Pattern Overlay */}
          <div className="absolute inset-0 opacity-[0.07] dark:opacity-[0.05]">
            <div 
              className="w-full h-full"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%236366f1' fill-opacity='0.8'%3E%3Ccircle cx='7' cy='7' r='7'/%3E%3Ccircle cx='53' cy='7' r='7'/%3E%3Ccircle cx='7' cy='53' r='7'/%3E%3Ccircle cx='53' cy='53' r='7'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '60px 60px'
              }}
            />
          </div>
          
          {/* Floating Elements */}
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-gradient-to-r from-indigo-200/20 to-purple-200/20 dark:from-indigo-800/20 dark:to-purple-800/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 right-1/4 w-96 h-96 bg-gradient-to-r from-teal-200/15 to-emerald-200/15 dark:from-teal-800/15 dark:to-emerald-800/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/6 w-48 h-48 bg-gradient-to-r from-rose-200/20 to-pink-200/20 dark:from-rose-800/20 dark:to-pink-800/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '4s' }}></div>
          
          {/* Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
            style={{
              backgroundImage: `linear-gradient(rgba(99,102,241,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.5) 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />
          
          {/* Subtle Noise Texture */}
          <div 
            className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
            }}
          />
        </div>

        <EmployerSidebar />
        <div className="flex-1 overflow-y-auto relative z-10">
        {/* Top Bar with Theme Toggle - Enhanced with backdrop blur */}
        <div className="flex items-center justify-between p-6 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border-b border-white/20 dark:border-gray-700/50 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold">Employer Analytics</h2>
            <p className="text-sm text-foreground/60">Track hires, verifications, and searches</p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
          </div>
        </div>

        <div className="px-4 md:px-8 py-6 relative">
        {/* Header */}
        <motion.div
          className="mb-6 flex items-center justify-between gap-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">Analytics Overview</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">Insightful charts to track your hiring performance</p>
          </div>
          <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl shadow-lg border border-white/30 dark:border-gray-700/30 p-1">
            <Segmented
              options={["7d", "30d", "90d"]}
              value={range}
              onChange={(val) => setRange(String(val))}
            />
          </div>
        </motion.div>

  {/* KPI Row */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              className="glassmorphism-card"
              style={{
                background: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(12px)",
                border: isDark ? "1px solid rgba(51, 65, 85, 0.3)" : "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)"
              }}
              hoverable
            >
              <Statistic 
                title="Candidates Hired" 
                value={kpis.candidatesHired ?? demoCandidatesHired} 
                suffix={<Badge color="green" />} 
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              className="glassmorphism-card"
              style={{
                background: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(12px)",
                border: isDark ? "1px solid rgba(51, 65, 85, 0.3)" : "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)"
              }}
              hoverable
            >
              <Statistic title="Credentials Verified" value={kpis.credentialsVerified} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              className="glassmorphism-card"
              style={{
                background: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(12px)",
                border: isDark ? "1px solid rgba(51, 65, 85, 0.3)" : "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)"
              }}
              hoverable
            >
              <Statistic title="Interviews Scheduled" value={kpis.interviewsScheduled ?? demoInterviewsScheduled} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card 
              className="glassmorphism-card"
              style={{
                background: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(12px)",
                border: isDark ? "1px solid rgba(51, 65, 85, 0.3)" : "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)"
              }}
              hoverable
            >
              <Statistic 
                title="Offer Acceptance" 
                value={kpis.offerAcceptance ?? demoOfferAcceptance}
                suffix="%" 
                valueStyle={{ color: colors.success }}
              />
            </Card>
          </Col>
        </Row>

        {error && (
          <div className="mt-2 text-sm text-red-500">{error}</div>
        )}

        {/* Charts Grid */}
        <Row gutter={[16, 16]} className="mt-2">
          {/* Line: Searches over time */}
          <Col xs={24} lg={12}>
            <Card 
              title={`Activity (last ${range})`} 
              className="glassmorphism-card"
              style={{
                background: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(12px)",
                border: isDark ? "1px solid rgba(51, 65, 85, 0.3)" : "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)"
              }}
              hoverable 
              loading={loading}
            >
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={searchesOverTime.map(d => ({ label: d.date, count: d.count }))} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.5} />
                    <XAxis dataKey="label" tick={axisTick} />
                    <YAxis tick={axisTick} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        border: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(255, 255, 255, 0.3)'}`,
                        borderRadius: '8px',
                        backdropFilter: 'blur(12px)'
                      }}
                      formatter={(value, name) => [`${value}`, 'Activity Count']}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke={colors.primary} 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: colors.primary }} 
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          {/* Bar: Credentials by type */}
          <Col xs={24} lg={12}>
            <Card 
              title="Credentials Verified by Type" 
              className="glassmorphism-card"
              style={{
                background: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(12px)",
                border: isDark ? "1px solid rgba(51, 65, 85, 0.3)" : "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)"
              }}
              hoverable 
              loading={loading}
            >
              <div style={{ height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={credsByType} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.5} />
                    <XAxis dataKey="type" tick={axisTick} />
                    <YAxis tick={axisTick} />
                    <Tooltip 
                      formatter={(value, name) => [`${value}`, 'Credentials Verified']}
                      contentStyle={{ 
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        border: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(255, 255, 255, 0.3)'}`,
                        borderRadius: '8px',
                        backdropFilter: 'blur(12px)'
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {credsByType.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={[colors.success, colors.violet, colors.cyan, colors.pink][idx % 4]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          {/* Area: Candidate pipeline */}
          <Col xs={24} lg={14}>
            <Card 
              title="Candidate Pipeline (proxy)" 
              className="glassmorphism-card"
              style={{
                background: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(12px)",
                border: isDark ? "1px solid rgba(51, 65, 85, 0.3)" : "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)"
              }}
              hoverable 
              loading={loading}
            >
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={pipeline} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors.primary} stopOpacity={0.5} />
                        <stop offset="100%" stopColor={colors.primary} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.5} />
                    <XAxis dataKey="stage" tick={axisTick} />
                    <YAxis tick={axisTick} />
                    <Tooltip 
                      formatter={(value, name) => [`${value}`, 'Candidates']}
                      contentStyle={{ 
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        border: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(255, 255, 255, 0.3)'}`,
                        borderRadius: '8px',
                        backdropFilter: 'blur(12px)'
                      }}
                    />
                    <Area type="monotone" dataKey="value" stroke={colors.primary} fill="url(#colorA)" strokeWidth={2.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          {/* Pie: Hire sources */}
          <Col xs={24} lg={10}>
            <Card 
              title="Hire Sources" 
              className="glassmorphism-card"
              style={{
                background: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(12px)",
                border: isDark ? "1px solid rgba(51, 65, 85, 0.3)" : "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)"
              }}
              hoverable 
              loading={loading}
            >
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip 
                      formatter={(value, name) => [`${value}%`, name]}
                      contentStyle={{ 
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        border: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(255, 255, 255, 0.3)'}`,
                        borderRadius: '8px',
                        backdropFilter: 'blur(12px)'
                      }}
                    />
                    <Pie data={hireSources} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                      {hireSources.map((entry, idx) => (
                        <Cell key={`slice-${idx}`} fill={[colors.primary, colors.success, colors.violet, colors.pink][idx % 4]} />
                      ))}
                    </Pie>
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>

          {/* Bar: Top Skills in Demand */}
          <Col xs={24}>
            <Card 
              title="Top Skills in Demand" 
              className="glassmorphism-card"
              style={{
                background: isDark ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(12px)",
                border: isDark ? "1px solid rgba(51, 65, 85, 0.3)" : "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)"
              }}
              hoverable 
              loading={loading}
            >
              <div style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topSkills}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} opacity={0.5} />
                    <XAxis 
                      dataKey="skill" 
                      tick={axisTick} 
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      interval={0}
                    />
                    <YAxis 
                      tick={axisTick} 
                      domain={[0, 100]}
                      label={{ 
                        value: 'Demand %', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle', fill: isDark ? "#d1d5db" : "#475569" }
                      }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Demand']}
                      contentStyle={{ 
                        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                        border: `1px solid ${isDark ? 'rgba(51, 65, 85, 0.3)' : 'rgba(255, 255, 255, 0.3)'}`,
                        borderRadius: '8px',
                        backdropFilter: 'blur(12px)'
                      }}
                    />
                    <Bar dataKey="demand" radius={[4, 4, 0, 0]} barSize={60}>
                      {topSkills.map((_, idx) => (
                        <Cell key={`cell-${idx}`} fill={[colors.primary, colors.success, colors.violet, colors.cyan, colors.pink, colors.warning][idx % 6]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </Col>
        </Row>
        </div>
        </div>
      </div>
      </RoleGuard>
    </ConfigProvider>
    </>
  );
};

export default AnalyticsPage;
