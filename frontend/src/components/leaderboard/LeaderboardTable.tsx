"use client";
import React, { memo, useMemo, useState, useCallback } from "react";
import { Card, Table, Space, Tooltip, Avatar, Tag, Button as AntButton } from "antd";
import { useRouter } from "next/navigation";
import { Medal, Star, Trophy, ArrowUpDown } from "lucide-react";
import type { LeaderItem } from "./types";

interface LeaderboardTableProps {
  list: LeaderItem[];
  loading: boolean;
  isDark: boolean;
  onSortedDataChange?: (sortedData: LeaderItem[]) => void;
}

const LeaderboardTable = memo(function LeaderboardTable({ list, loading, isDark, onSortedDataChange }: LeaderboardTableProps) {
  const router = useRouter();
  const [sortedInfo, setSortedInfo] = useState<any>({ columnKey: 'rank', order: 'ascend' });

  const handleTableChange = useCallback((pagination: any, filters: any, sorter: any) => {
    setSortedInfo(sorter);
    
    // Create sorted data based on current sort
    let sortedData = [...list];
    if (sorter?.columnKey && sorter?.order) {
      sortedData.sort((a, b) => {
        let aValue = a[sorter.columnKey as keyof LeaderItem];
        let bValue = b[sorter.columnKey as keyof LeaderItem];
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sorter.order === 'ascend' ? aValue - bValue : bValue - aValue;
        }
        
        return sorter.order === 'ascend' 
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue));
      });
    }
    
    // Notify parent component of sorted data
    onSortedDataChange?.(sortedData);
  }, [list, onSortedDataChange]);

  const rankColumn = useMemo(() => ({
    title: (
      <div className="flex items-center gap-2">
        <span>Rank</span>
        <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
      </div>
    ),
    dataIndex: "rank",
    key: "rank",
    width: 100,
    sortOrder: sortedInfo.columnKey === 'rank' ? sortedInfo.order : null,
    render: (rank: number, record: LeaderItem, index: number) => {
      // Calculate dynamic rank based on current sort and table pagination
      const currentRank = index + 1;
      
      if (currentRank === 1) return (
        <Tag color="gold" className="px-3 py-1 text-base flex items-center gap-2">
          <Trophy className="w-4 h-4" /> 1
        </Tag>
      );
      if (currentRank === 2) return (
        <Tag color="geekblue" className="px-3 py-1 text-base flex items-center gap-2">
          <Medal className="w-4 h-4" /> 2
        </Tag>
      );
      if (currentRank === 3) return (
        <Tag color="purple" className="px-3 py-1 text-base flex items-center gap-2">
          <Medal className="w-4 h-4" /> 3
        </Tag>
      );
      return <span className="font-semibold">{currentRank}</span>;
    },
    sorter: (a: LeaderItem, b: LeaderItem) => a.rank - b.rank,
  }), [sortedInfo.columnKey, sortedInfo.order]);

  const participantColumn = useMemo(() => ({
    title: "Participant",
    dataIndex: "name",
    className: "min-w-[220px]",
    render: (_: any, rec: LeaderItem) => (
      <Space size={12}>
        <Avatar src={rec.avatar} size={40} />
        <div>
          <div className="font-semibold">{rec.name}</div>
          <div className="text-xs text-muted-foreground">{rec.institute}</div>
        </div>
      </Space>
    ),
  }), []);

  const courseColumn = useMemo(() => ({
    title: "Course", 
    dataIndex: "course", 
    width: 180, 
    render: (c: string) => (
      <span className="px-2 py-1 bg-muted/30 rounded-md text-sm">
        {c || "General"}
      </span>
    )
  }), []);

  const pointsColumn = useMemo(() => ({
    title: (
      <div className="flex items-center gap-2">
        <span>Points</span>
        <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
      </div>
    ),
    dataIndex: "points",
    key: "points",
    width: 140,
    sortOrder: sortedInfo.columnKey === 'points' ? sortedInfo.order : null,
    render: (p: number) => (
      <div className="flex items-center gap-2 font-semibold">
        <Star className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> 
        <span className={sortedInfo.columnKey === 'points' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-700 dark:text-gray-300'}>
          {p.toLocaleString()}
        </span>
      </div>
    ),
    sorter: (a: LeaderItem, b: LeaderItem) => a.points - b.points,
  }), [sortedInfo.columnKey, sortedInfo.order]);

  const credentialsColumn = useMemo(() => ({
    title: (
      <div className="flex items-center gap-2">
        <span>Credentials</span>
        <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
      </div>
    ), 
    dataIndex: "credentials", 
    key: "credentials",
    width: 140, 
    sortOrder: sortedInfo.columnKey === 'credentials' ? sortedInfo.order : null,
    render: (c: number) => (
      <div className="flex items-center gap-2 font-semibold">
        <span className="text-emerald-500">🏅</span> 
        <span className={sortedInfo.columnKey === 'credentials' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-700 dark:text-gray-300'}>{c}</span>
      </div>
    ),
    sorter: (a: LeaderItem, b: LeaderItem) => a.credentials - b.credentials 
  }), [sortedInfo.columnKey, sortedInfo.order]);

  const skillsColumn = useMemo(() => ({
    title: (
      <div className="flex items-center gap-2">
        <span>Skills</span>
        <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
      </div>
    ), 
    dataIndex: "skills", 
    key: "skills",
    width: 120, 
    sortOrder: sortedInfo.columnKey === 'skills' ? sortedInfo.order : null,
    render: (s: number) => (
      <div className="flex items-center gap-2 font-semibold">
        <span className="text-emerald-500">🔧</span> 
        <span className={sortedInfo.columnKey === 'skills' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-700 dark:text-gray-300'}>{s}</span>
      </div>
    ),
    sorter: (a: LeaderItem, b: LeaderItem) => a.skills - b.skills 
  }), [sortedInfo.columnKey, sortedInfo.order]);

  const actionsColumn = useMemo(() => ({
    title: "Actions",
    key: "actions",
    fixed: "right" as const,
    width: 140,
    render: (_: any, rec: LeaderItem) => (
      <Space>
        <Tooltip title="View Profile">
          <AntButton 
            type="link" 
            size="small" 
            style={{ color: isDark ? undefined : "#007BFF" }} 
            onClick={() => router.push(`/profile/${rec.id}`)}
          >
            View
          </AntButton>
        </Tooltip>
      </Space>
    ),
  }), [isDark, router]);

  const columns = useMemo(() => [
    rankColumn,
    participantColumn,
    courseColumn,
    pointsColumn,
    credentialsColumn,
    skillsColumn,
    actionsColumn,
  ], [rankColumn, participantColumn, courseColumn, pointsColumn, credentialsColumn, skillsColumn, actionsColumn]);

  const filteredList = useMemo(() => list.filter(item => item && item.id), [list]);

  const paginationConfig = useMemo(() => ({ 
    pageSize: 5, 
    showSizeChanger: false,
    showQuickJumper: false,
    showTotal: (total: number, range: [number, number]) => `${range[0]}-${range[1]} of ${total} participants`,
    size: "default" as const,
    hideOnSinglePage: false,
    simple: true
  }), []);

  const scrollConfig = useMemo(() => ({ x: 720 }), []);

  return (
    <div className="mt-8">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        Complete Leaderboard
        <span className="text-sm text-muted-foreground font-normal">
          (Click column headers to sort)
        </span>
      </h3>
      <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-emerald-50/30 to-white dark:from-emerald-900/10 dark:to-gray-800">
        <Table
          key={`leaderboard-table-${isDark ? 'dark' : 'light'}`}
          loading={loading}
          rowKey="id"
          dataSource={filteredList}
          pagination={paginationConfig}
          scroll={scrollConfig}
          columns={columns}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
});

export default LeaderboardTable;
