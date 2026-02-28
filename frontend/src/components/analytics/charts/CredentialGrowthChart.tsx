"use client";

import React from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const growthData = [
  { month: "Jan", credentials: 200 },
  { month: "Feb", credentials: 400 },
  { month: "Mar", credentials: 700 },
  { month: "Apr", credentials: 1000 },
];

const CredentialGrowthChart = () => (
  <ResponsiveContainer width="100%" height="100%">
    <AreaChart data={growthData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
      <defs>
        <linearGradient id="colorCred" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
          <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
        </linearGradient>
      </defs>
      <XAxis dataKey="month" />
      <YAxis />
      <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
      <Tooltip />
      <Area type="monotone" dataKey="credentials" stroke="#2563eb" fillOpacity={1} fill="url(#colorCred)" />
    </AreaChart>
  </ResponsiveContainer>
);

export default CredentialGrowthChart;
