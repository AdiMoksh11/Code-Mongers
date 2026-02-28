import React from "react";
import { Input, Select, Row, Col } from "antd";
import { Search, Filter, SortAsc } from "lucide-react";
import { CredentialFilters, SortKey } from "@/types/credentials";

interface CredentialFiltersProps {
  filters: CredentialFilters;
  onFiltersChange: (filters: Partial<CredentialFilters>) => void;
  uniqueIssuers: string[];
}

export const CredentialFiltersComponent: React.FC<CredentialFiltersProps> = ({
  filters,
  onFiltersChange,
  uniqueIssuers,
}) => {
  return (
    <div className="mb-8 relative overflow-hidden rounded-2xl">
      {/* Enhanced gradient background matching page theme */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 dark:from-emerald-500/20 dark:via-teal-500/20 dark:to-cyan-500/20" />
      <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm" />
      
      <div className="relative z-10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg">
            <Filter className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Filter & Search</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Find your credentials quickly</p>
          </div>
        </div>

        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} lg={8}>
            <div className="relative">
              <Input
                placeholder="Search by title, issuer, or skill..."
                value={filters.search}
                onChange={(e) => onFiltersChange({ search: e.target.value })}
                allowClear
                suffix={<Search className="w-4 h-4 text-gray-400" />}
                className="h-11 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/20 dark:border-gray-700/50 hover:border-emerald-300 focus:border-emerald-500 transition-all duration-300 rounded-xl"
              />
            </div>
          </Col>
          
          <Col xs={12} lg={4}>
            <Select 
              value={filters.typeFilter} 
              onChange={(value) => onFiltersChange({ typeFilter: value })} 
              className="w-full filter-select" 
              size="large"
              options={[
                { value: "all", label: "All Types" },
                { value: "certificate", label: "Certificate" },
                { value: "degree", label: "Degree" },
                { value: "license", label: "License" },
                { value: "badge", label: "Badge" },
              ]} 
            />
          </Col>
          
          <Col xs={12} lg={4}>
            <Select 
              value={filters.statusFilter} 
              onChange={(value) => onFiltersChange({ statusFilter: value })} 
              className="w-full filter-select" 
              size="large"
              options={[
                { value: "all", label: "All Status" },
                { value: "anchored", label: "Verified" },
                { value: "not-anchored", label: "Pending" },
              ]} 
            />
          </Col>
          
          <Col xs={12} lg={4}>
            <Select
              value={filters.issuerFilter}
              onChange={(value) => onFiltersChange({ issuerFilter: value })}
              className="w-full filter-select"
              size="large"
              options={uniqueIssuers.map((u) => ({ value: u, label: u === "all" ? "All Issuers" : u }))}
            />
          </Col>
          
          <Col xs={12} lg={4}>
            <Select
              value={filters.sortKey}
              onChange={(value: SortKey) => onFiltersChange({ sortKey: value })}
              className="w-full sort-select"
              size="large"
              suffixIcon={<SortAsc className="w-4 h-4 text-gray-400" />}
              options={[
                { value: "newest", label: "Newest First" },
                { value: "oldest", label: "Oldest First" },
                { value: "az", label: "A → Z" },
                { value: "za", label: "Z → A" },
                { value: "pointsDesc", label: "High Points" },
                { value: "pointsAsc", label: "Low Points" },
              ]}
            />
          </Col>
        </Row>
      </div>

      {/* Custom CSS for Select components */}
      <style jsx global>{`
        .filter-select .ant-select-selector,
        .sort-select .ant-select-selector {
          height: 44px !important;
          background: rgba(255, 255, 255, 0.8) !important;
          backdrop-filter: blur(8px) !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 12px !important;
          transition: all 0.3s ease !important;
        }
        
        .dark .filter-select .ant-select-selector,
        .dark .sort-select .ant-select-selector {
          background: rgba(31, 41, 55, 0.8) !important;
          border: 1px solid rgba(75, 85, 99, 0.5) !important;
        }
        
        .filter-select:hover .ant-select-selector,
        .sort-select:hover .ant-select-selector {
          border-color: rgb(129, 140, 248) !important;
        }
        
        .filter-select.ant-select-focused .ant-select-selector,
        .sort-select.ant-select-focused .ant-select-selector {
          border-color: rgb(99, 102, 241) !important;
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2) !important;
        }
        
        .sort-select .ant-select-selection-search-input {
          padding-left: 28px !important;
        }
      `}</style>
    </div>
  );
};
