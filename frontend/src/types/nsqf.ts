export interface SkillDomain {
  skillDomain: string;
  currentLevel: number;
  levelName: string;
  totalPoints: number;
  certificatesCount: number;
  progress: SkillProgress;
  lastUpdated: string;
  recentCertificates: any[];
}

export interface CourseSuggestion {
  level: number;
  title: string;
  points: number;
  platform: string;
}

export interface SkillProgress {
  isMaxLevel: boolean;
  progressPercentage: number;
  pointsNeeded: number;
  nextLevelName: string;
  nextLevel?: number;
}

export interface NSQFProfile {
  userId: string;
  totalSkills: number;
  highestLevel: number;
  totalCredentials: number;
  totalPoints: number;
  skills: SkillDomain[];
}

export interface Recommendation {
  skillDomain: string;
  currentLevel: number;
  targetLevel: number;
  pointsNeeded: number;
  progressPercentage: number;
  suggestions: CourseSuggestion[];
}

export interface LevelInfo {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  description: string;
  typicalRoles: string[];
  skills: string[];
}

export interface SkillDetails {
  skillDomain: string;
  currentLevel: number;
  levelName: string;
  totalPoints: number;
  progress: SkillProgress;
  certificates: SkillCertificate[];
  levelUpHistory: LevelUpRecord[];
  pointsHistory: PointsRecord[];
}

export interface SkillCertificate {
  _id: string;
  title: string;
  issuer: string;
  nsqfLevel?: number;
  creditPoints?: number;
  createdAt: string;
  imageUrl?: string;
}

export interface LevelUpRecord {
  fromLevel: number;
  toLevel: number;
  achievedAt: string;
  triggeringCredential?: string;
}

export interface PointsRecord {
  credentialId: string;
  pointsAdded: number;
  previousLevel: number;
  newLevel: number;
  addedAt: string;
}

export interface NSQFRanking {
  skillDomain: string;
  currentLevel: number;
  totalPoints: number;
  rank: number;
  totalUsers: number;
  percentile: number;
}

export interface NSQFStatistics {
  topSkillDomains: SkillDomainStat[];
  levelDistribution: LevelDistribution[];
  totalStats: TotalStats;
}

export interface SkillDomainStat {
  _id: string;
  totalUsers: number;
  averageLevel: number;
  totalPoints: number;
  maxLevel: number;
}

export interface LevelDistribution {
  _id: number;
  count: number;
}

export interface TotalStats {
  totalSkillEntries: number;
  uniqueUsers: number;
  totalPoints: number;
  averageLevel: number;
}

export interface StackabilityMapEntry {
  skillDomain: string;
  currentLevel: number;
  completedLevels: { level: number; name: string }[];
  inProgressLevel: number;
  pointsNeeded: number;
  nextLevelName: string;
  certificates: SkillCertificate[];
}

export type StackabilityMap = StackabilityMapEntry[];

export interface VisualizationNode {
  id: string;
  label: string;
  completed: boolean;
  inProgress: boolean;
  pointsRequired: number;
  certificates: SkillCertificate[];
}

export interface VisualizationDataEntry {
  skillDomain: string;
  currentLevel: number;
  totalPoints: number;
  nodes: VisualizationNode[];
}

export type VisualizationData = VisualizationDataEntry[];
