"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, ArrowLeft } from "lucide-react"; 

import FilterToolbar from "@/components/analytics/FilterToolbar";
import StatCard from "@/components/analytics/StatCard";
import ChartCard from "@/components/analytics/ChartCard";
import SkillTrendsChart from "@/components/analytics/charts/SkillTrendsChart";
import TopSkillsChart from "@/components/analytics/charts/TopSkillChart";
import CredentialGrowthChart from "@/components/analytics/charts/CredentialGrowthChart";
import DemographicsChart from "@/components/analytics/charts/DemographicsChart";
import SkillGapIndiaMap from "@/components/analytics/charts/SkillGapIndiaMap";
import AIInsights from "@/components/analytics/AIInsights";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";

const AnalyticsPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-zinc-900 p-6 md:p-10">
      <div className="max-w-7xl mx-auto flex flex-col gap-10">
        {/* Header */}
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 dark:text-gray-300 hover:text-blue-500 hover:dark:text-blue-400"
              aria-label="Go back"
            >
              <ArrowLeft size={26} strokeWidth={2.5} /> 
            </button>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                Analytics
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-lg">
                Gain actionable insights into India’s skilling ecosystem: adoption, gaps, demographics, and growth.
              </p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 border dark:border-zinc-700 shadow-sm hover:shadow-md transition">
              <Calendar className="w-4 h-4" /> Last 90 days
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 border dark:border-zinc-700 shadow-sm hover:shadow-md transition">
              <MapPin className="w-4 h-4" /> All India
            </button>
            <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard title="Learners" value="1.2M" icon="users" trend="+12%" />
          <StatCard title="Verified Credentials" value="3.5M" icon="check" trend="+8%" />
          <StatCard title="Employers" value="45K" icon="building" trend="+5%" />
          <StatCard title="Institutions" value="2.1K" icon="building" trend="+3%" />
        </div>

        <FilterToolbar />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard title="Skill Adoption Trends">
            <SkillTrendsChart />
          </ChartCard>
          <ChartCard title="Top Skills by Demand">
            <TopSkillsChart />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard title="Credential Growth Over Time">
            <CredentialGrowthChart />
          </ChartCard>
          <ChartCard title="Learner Demographics">
            <DemographicsChart />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ChartCard title="Skill Gap Heatmap (India)">
            <SkillGapIndiaMap />
          </ChartCard>
          <ChartCard title="AI Insights">
            <AIInsights />
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
