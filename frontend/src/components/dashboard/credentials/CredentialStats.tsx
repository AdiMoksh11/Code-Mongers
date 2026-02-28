import React from "react";
import { Row, Col } from "antd";
import { Shield, Clock, Award, TrendingUp } from "lucide-react";
import { Credential } from "@/types/credentials";

interface CredentialStatsProps {
  items: Credential[];
}

export const CredentialStats: React.FC<CredentialStatsProps> = ({ items }) => {
  const anchoredCount = items.filter((i) => i.transactionHash).length;
  const notAnchoredCount = items.filter((i) => !i.transactionHash).length;

  return (
    <div className="mb-8 relative overflow-hidden rounded-2xl">
      {/* Enhanced gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 dark:from-emerald-500/20 dark:via-teal-500/20 dark:to-cyan-500/20" />
      <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm" />
      
      <div className="relative z-10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Credential Overview</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Track your achievement statistics</p>
          </div>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-300" />
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      <Award className="w-4 h-4" />
                      Total Credentials
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{items.length}</div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-300" />
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                      <Shield className="w-4 h-4" />
                      On-Chain Verified
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{anchoredCount}</div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </Col>

          <Col xs={24} md={8}>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl blur-sm group-hover:blur-md transition-all duration-300" />
              <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-white/20 dark:border-gray-700/50 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
                      <Clock className="w-4 h-4" />
                      Pending Verification
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{notAnchoredCount}</div>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  );
};
