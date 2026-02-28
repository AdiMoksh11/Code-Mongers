"use client";
import React from "react";
import { Row, Col, Avatar, Empty } from "antd";
import { Crown, Medal, Award, Star, TrendingUp } from "lucide-react";
import type { LeaderItem } from "./types";

interface TopThreeCardsProps {
  list: LeaderItem[];
  sortType?: 'rank' | 'points' | 'credentials' | 'skills';
}

export default function TopThreeCards({ list, sortType = 'rank' }: TopThreeCardsProps) {
  const getSortTitle = () => {
    switch (sortType) {
      case 'points': return 'Top Points Leaders';
      case 'credentials': return 'Top Credential Holders';
      case 'skills': return 'Top Skill Masters';
      default: return 'Leaderboard Champions';
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        <h3 className="text-xl font-semibold">{getSortTitle()}</h3>
      </div>
      <Row gutter={[16, 16]} className="mb-6">
        {list.slice(0, 3).map((rec, idx) => (
        <Col xs={24} md={8} key={rec.id}>
          <div
            className={`rounded-2xl p-6 border shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:scale-[1.02] backdrop-blur-sm relative cursor-pointer ${
              idx === 0 ? "bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-900/30 dark:to-green-900/20 border-emerald-300/50 hover:border-emerald-400/70" : 
              idx === 1 ? "bg-gradient-to-br from-emerald-50/80 to-teal-100/80 dark:from-emerald-900/25 dark:to-teal-900/15 border-emerald-200/40 hover:border-emerald-300/60" : 
              "bg-gradient-to-br from-emerald-50/60 to-cyan-100/60 dark:from-emerald-900/20 dark:to-cyan-900/10 border-emerald-100/30 hover:border-emerald-200/50"
            }`}
            style={{
              boxShadow: idx === 0 ? "0 8px 25px -8px rgba(16,185,129,0.25), 0 0 0 1px rgba(16,185,129,0.05)" : idx === 1 ? "0 6px 20px -6px rgba(20,184,166,0.2), 0 0 0 1px rgba(20,184,166,0.05)" : "0 4px 15px -4px rgba(6,182,212,0.15), 0 0 0 1px rgba(6,182,212,0.05)",
            }}
          >
            <div className="absolute top-4 right-4 flex flex-col items-center">
              {idx === 0 ? <Crown className="w-6 h-6 text-emerald-600 dark:text-emerald-400" /> : idx === 1 ? <Medal className="w-6 h-6 text-emerald-500 dark:text-emerald-300" /> : <Award className="w-6 h-6 text-emerald-400 dark:text-emerald-200" />}
              <span className="text-xs font-bold mt-1 px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-800/50 text-emerald-800 dark:text-emerald-200 backdrop-blur-sm">
                #{idx + 1}
              </span>
            </div>
            <div className="flex flex-col items-center text-center gap-4">
              <div className={`rounded-full p-1 ${idx === 0 ? "ring-4 ring-emerald-400/60" : idx === 1 ? "ring-4 ring-emerald-300/50" : "ring-4 ring-emerald-200/40"}`}>
                <Avatar src={rec.avatar} size={96} />
              </div>
              <div>
                <div className="text-xl font-bold">{rec.name}</div>
                <div className="text-xs text-muted-foreground">{rec.course || rec.institute}</div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="text-lg font-semibold flex items-center gap-2">
                  <Star className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> 
                  <span className={sortType === 'points' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-700 dark:text-gray-300'}>
                    {rec.points.toLocaleString()} points
                  </span>
                </div>
                <div className="text-sm text-muted-foreground flex items-center gap-3">
                  <span className={sortType === 'credentials' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>
                    🏅 {rec.credentials} credentials
                  </span>
                  <span className={sortType === 'skills' ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>
                    🔧 {rec.skills} skills
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Col>
      ))}
      {list.length === 0 && (
        <Col span={24}>
          <Empty description="No results" />
        </Col>
      )}
    </Row>
    </div>
  );
}
