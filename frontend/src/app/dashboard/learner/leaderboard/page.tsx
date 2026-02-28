"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import RoleGuard from "@/components/auth/RoleGuard";
const Sidebar = dynamic(() => import("@/components/dashboard/Sidebar"), { ssr: false });

import { ConfigProvider, theme as antdTheme, Tabs } from "antd";

import LeaderboardFilters from "@/components/leaderboard/LeaderboardFilters";
import TopThreeCards from "@/components/leaderboard/TopThreeCards";
import LeaderboardTable from "@/components/leaderboard/LeaderboardTable";
import ProgressSummary from "@/components/leaderboard/ProgressSummary";
import { useCoursesOptions, useLeaderboardData, useMyProgress } from "@/components/leaderboard/hooks";

export default function LeaderboardPage() {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  // Access guard similar to other dashboard pages
  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
      return;
    }
  }, [router]);

  const [query, setQuery] = useState("");
  const [timeframe, setTimeframe] = useState<string>("month");
  const [category, setCategory] = useState<string>("all");
  const [course, setCourse] = useState<string>("all");
  const [sortedLeaderboardData, setSortedLeaderboardData] = useState<any[]>([]);
  const [currentSortType, setCurrentSortType] = useState<'rank' | 'points' | 'credentials' | 'skills'>('rank');

  // Leaderboard data and filters
  const { data, loading: loadingLeaderboard, filtered } = useLeaderboardData({ query, timeframe, category, course });
  const courses = useCoursesOptions(data);
  // My progress
  const { progress, loading: loadingProgress } = useMyProgress();

  const handleSortedDataChange = useCallback((sortedData: any[]) => {
    setSortedLeaderboardData(sortedData);
    // Detect sort type based on first few items - this is a simple heuristic
    if (sortedData.length > 1) {
      const first = sortedData[0];
      const second = sortedData[1];
      if (first.points >= second.points) setCurrentSortType('points');
      else if (first.credentials >= second.credentials) setCurrentSortType('credentials');
      else if (first.skills >= second.skills) setCurrentSortType('skills');
      else setCurrentSortType('rank');
    }
  }, []);

  // Use sorted data for top cards if available, otherwise use filtered data
  const displayData = sortedLeaderboardData.length > 0 ? sortedLeaderboardData : filtered;

  if (!mounted) return null;

  return (
    <RoleGuard allowedRole="learner">
      <ConfigProvider
        key={`leaderboard-${isDark ? 'dark' : 'light'}`}
        theme={{
          algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
          token: {
            colorBgBase: isDark ? "#1f2937" : "#f0fdf4",
            colorText: "var(--color-foreground)",
            colorTextSecondary: "var(--color-muted-foreground)",
            colorBorder: isDark ? "#065f46" : "#a7f3d0",
          colorPrimary: "var(--color-primary)",
          colorBgContainer: isDark ? "rgba(31, 41, 55, 0.6)" : "rgba(255, 255, 255, 0.6)",
          colorBgElevated: isDark ? "rgba(31, 41, 55, 0.8)" : "rgba(255, 255, 255, 0.8)",
          zIndexPopupBase: 2000,
          borderRadius: 12,
        },
        // Fine-tune components
        components: isDark
          ? {
              Tabs: {
                itemSelectedColor: "var(--color-foreground)",
                itemHoverColor: "var(--color-foreground)",
                inkBarColor: "var(--color-primary)",
              },
              Pagination: {
                itemActiveBg: "rgba(31, 41, 55, 0.6)",
                colorText: "var(--color-foreground)",
                colorTextDisabled: "var(--color-muted-foreground)",
              },
              Table: {
                headerBg: "rgba(31, 41, 55, 0.8)",
                headerColor: "var(--color-foreground)",
                colorText: "var(--color-foreground)",
                colorTextSecondary: "var(--color-muted-foreground)",
                borderColor: "#065f46",
                rowHoverBg: "rgba(31, 41, 55, 0.4)",
                rowSelectedBg: "rgba(31, 41, 55, 0.6)",
                rowSelectedHoverBg: "rgba(31, 41, 55, 0.6)",
                headerSortActiveBg: "rgba(31, 41, 55, 0.6)",
                headerSortHoverBg: "rgba(31, 41, 55, 0.4)",
                bodySortBg: "rgba(31, 41, 55, 0.2)",
              },
            }
          : {
              Table: {
                headerBg: "#f0fdf4", // Emerald light background
                headerColor: "#065f46", // Emerald dark text
                colorText: "#065f46",
                colorTextSecondary: "#059669",
                borderColor: "#a7f3d0",
                rowHoverBg: "#ecfdf5",
                rowSelectedBg: "#d1fae5",
                rowSelectedHoverBg: "#d1fae5",
                // Light emerald backgrounds for sorting states
                headerSortActiveBg: "#ecfdf5",
                headerSortHoverBg: "#ecfdf5",
                bodySortBg: "#f0fdf4",
              },
            },
      }}
      getPopupContainer={() => document.body}
    >
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-gray-800 dark:text-gray-200 flex">
        <Sidebar />
        <main className="flex-1 p-6 md:p-10">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                🏆 Leaderboard
              </h1>
              <p className="text-sm text-muted-foreground">Compete, learn, and climb the ranks • Updated in real-time</p>
            </div>
            <ThemeToggleButton
              variant="gif"
              url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif"
            />
          </div>
          <Tabs
            defaultActiveKey="leaderboard"
            items={[
              {
                key: "leaderboard",
                label: "Leaderboard",
                children: (
                  <>
                    <LeaderboardFilters
                      query={query}
                      setQuery={setQuery}
                      timeframe={timeframe}
                      setTimeframe={setTimeframe}
                      category={category}
                      setCategory={setCategory}
                      course={course}
                      setCourse={setCourse}
                      courses={courses}
                    />

                    <TopThreeCards list={displayData} sortType={currentSortType} />

                    <LeaderboardTable 
                      list={filtered} 
                      loading={loadingLeaderboard} 
                      isDark={isDark} 
                      onSortedDataChange={handleSortedDataChange}
                    />
                  </>
                ),
              },
              {
                key: "progress",
                label: "My Progress",
                children: (
                  <>
                    <ProgressSummary progress={progress} loading={loadingProgress} />
                  </>
                ),
              },
            ]}
          />
        </main>
      </div>
    </ConfigProvider>
    </RoleGuard>
  );
}
