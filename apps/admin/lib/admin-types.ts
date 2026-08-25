export type AdminActor = {
  userId: string;
  email: string;
  name: string;
};

export type AdminExecutionCounts = {
  pending: number;
  queued: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  expiredReady: number;
};

export type AdminOverview = {
  users: number;
  anonymousSessions: number;
  executions: AdminExecutionCounts;
};

export type AdminUserSummary = {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
  plan: "free" | "pro" | null;
};

export type AdminUserRecord = {
  userId: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminExecutionRecord = {
  id: string;
  ownerId: string;
  ownerKind: string;
  tool: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  expiresAt: string | null;
};

export type AdminAnonymousSessionRecord = {
  id: string;
  createdAt: string;
  expiresAt: string;
  lastSeenAt: string;
};

export type AdminUserDetail = {
  user: AdminUserRecord;
  plan: "free" | "pro";
  subscriptionStatus: string | null;
  webCredits: {
    webCreditsGranted: number;
    webCreditsUsed: number;
    webCreditsRemaining: number;
  };
  aiCredits: {
    aiCreditsGranted: number;
    aiCreditsUsed: number;
    aiCreditsRemaining: number;
  };
  conversionsUsed: number;
  recentExecutions: AdminExecutionRecord[];
};
