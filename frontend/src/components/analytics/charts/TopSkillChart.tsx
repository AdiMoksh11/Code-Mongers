"use client";

import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const skillsData = [
  { name: "AI/ML", demand: 1200 },
  { name: "Cloud", demand: 900 },
  { name: "Cybersecurity", demand: 750 },
  { name: "Data Analytics", demand: 650 },
];

const TopSkillsChart = () => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={skillsData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="demand" fill="#2563eb" radius={[6, 6, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);

export default TopSkillsChart;
