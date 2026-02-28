"use client";

import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const demographicsData = [
  { name: "Students", value: 50 },
  { name: "Professionals", value: 30 },
  { name: "Institutions", value: 20 },
];

const COLORS = ["#2563eb", "#10b981", "#f59e0b"];

const DemographicsChart = () => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <Pie
        data={demographicsData}
        cx="50%"
        cy="50%"
        outerRadius={100}
        fill="#8884d8"
        dataKey="value"
        label
      >
        {demographicsData.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
);

export default DemographicsChart;
