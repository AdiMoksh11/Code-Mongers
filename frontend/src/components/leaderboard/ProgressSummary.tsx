"use client";
import React from "react";
import { Card, Col, Progress, Row, Statistic, Tag } from "antd";
import type { MyProgress } from "./types";

export default function ProgressSummary({ progress, loading }: { progress: MyProgress | null; loading: boolean }) {
  if (!progress) {
    return <Card loading={loading} className="border-0 shadow-lg bg-gradient-to-br from-emerald-50/30 to-white dark:from-emerald-900/10 dark:to-gray-800">No data</Card>;
  }

  const percentVerified = progress.total > 0 ? Math.round((progress.verified / progress.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} lg={8}>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50/40 to-white dark:from-emerald-900/15 dark:to-gray-800 hover:shadow-xl transition-all duration-300 border border-emerald-100/50 dark:border-emerald-800/30" loading={loading}>
            <Statistic 
              title={<span className="text-gray-600 dark:text-gray-400">Total Credentials</span>} 
              value={progress.total}
              valueStyle={{ color: '#059669', fontWeight: 'bold' }}
            />
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">On-Chain Proof</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{progress.verified}</span>
              </div>
              <Progress 
                percent={percentVerified} 
                status="active" 
                strokeColor="#10b981"
                trailColor="#e5e7eb"
                size="small"
              />
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600 dark:text-gray-400">No On-Chain Proof</span>
                <span className="font-semibold text-gray-500 dark:text-gray-400">{progress.pending}</span>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12} lg={8}>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50/40 to-white dark:from-emerald-900/15 dark:to-gray-800 hover:shadow-xl transition-all duration-300 border border-emerald-100/50 dark:border-emerald-800/30" loading={loading}>
            <Statistic 
              title={<span className="text-gray-600 dark:text-gray-400">Points</span>} 
              value={progress.points} 
              suffix="pts"
              valueStyle={{ color: '#059669', fontWeight: 'bold' }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50/40 to-white dark:from-emerald-900/15 dark:to-gray-800 hover:shadow-xl transition-all duration-300 border border-emerald-100/50 dark:border-emerald-800/30" loading={loading}>
            <div className="font-semibold mb-3 text-gray-700 dark:text-gray-300">Top Skills</div>
            <div className="flex flex-wrap gap-2">
              {progress.topSkills.length === 0 ? (
                <span className="text-sm text-gray-500 dark:text-gray-400">No skills found</span>
              ) : (
                progress.topSkills.map((s) => (
                  <Tag key={s.name} className="px-3 py-1 text-sm border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700" style={{ color: '#047857', backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }}>
                    {s.name}
                  </Tag>
                ))
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
