export type LeaderItem = {
  id: string;
  rank: number;
  name: string;
  institute: string;
  avatar: string;
  points: number;
  credentials: number;
  skills: number;
  course?: string;
};

export type MyProgress = {
  total: number;
  verified: number; // Credentials with blockchain proof (transactionHash)
  pending: number;  // Credentials without blockchain proof
  expired: number;  // Not used in blockchain system
  points: number;
  topSkills: { name: string; count: number }[];
};
