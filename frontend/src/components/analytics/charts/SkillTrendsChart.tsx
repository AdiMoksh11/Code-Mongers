"use client";

import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const trendData = [
  { month: "Jan", learners: 400, credentials: 240 },
  { month: "Feb", learners: 500, credentials: 300 },
  { month: "Mar", learners: 700, credentials: 450 },
  { month: "Apr", learners: 900, credentials: 650 },
];

const SkillTrendsChart = () => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={trendData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="learners" stroke="#2563eb" strokeWidth={3} />
      <Line type="monotone" dataKey="credentials" stroke="#10b981" strokeWidth={3} />
    </LineChart>
  </ResponsiveContainer>
);

export default SkillTrendsChart;
