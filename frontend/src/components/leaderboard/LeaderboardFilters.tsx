"use client";
import { Card, Input, Select } from "antd";
import React from "react";

type Props = {
  query: string;
  setQuery: (v: string) => void;
  timeframe: string;
  setTimeframe: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  course: string;
  setCourse: (v: string) => void;
  courses: { label: string; value: string }[];
};

export default function LeaderboardFilters({ query, setQuery, timeframe, setTimeframe, category, setCategory, course, setCourse, courses }: Props) {
  return (
    <Card className="mb-6 border-emerald-100 dark:border-emerald-800 shadow-lg bg-white/60 dark:bg-gray-800/60 backdrop-blur supports-[backdrop-filter]:backdrop-blur" styles={{ body: { background: "transparent" } }}>
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-3">
        <Input placeholder="Search by name or institute" value={query} onChange={(e) => setQuery(e.target.value)} allowClear className="max-w-xl" />
        <div className="flex items-center gap-3 flex-wrap">
          <Select className="w-40" value={timeframe} onChange={setTimeframe} options={[{ value: "week", label: "This Week" }, { value: "month", label: "This Month" }, { value: "all", label: "All Time" }]} />
          <Select className="w-40" value={category} onChange={setCategory} options={[{ value: "all", label: "All Categories" }, { value: "credentials", label: "Credentials" }, { value: "skills", label: "Skills" }, { value: "points", label: "Points" }]} />
          <Select className="w-56" value={course} onChange={setCourse} options={courses} />
        </div>
      </div>
    </Card>
  );
}
