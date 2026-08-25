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

export type AdminQueueCounts = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
};

export type AdminLedgerEntry = {
  id: string;
  userId: string;
  amount: number;
  type: string;
  source: string;
  reason: string;
  createdAt: string;
};

export type AdminPlanLimits = {
  monthlyConversions: number;
  monthlyWebCredits: number;
  monthlyAiCredits: number;
  maxFileSizeBytes: number;
  maxApiKeys: number;
  apiRequestsPerMinute: number;
};

export type AdminBillingInsights = {
  plans: {
    free: AdminPlanLimits;
    pro: AdminPlanLimits;
  };
  apiCredits: {
    starter: number;
    growth: number;
    scale: number;
  };
  usersByPlan: {
    free: number;
    pro: number;
  };
  usage: {
    periodStart: string;
    periodEnd: string;
    webCreditsUsed: number;
    webCreditsGranted: number;
    apiCreditsUsed: number;
    apiCreditsGranted: number;
    aiCreditsUsed: number;
    aiCreditsGranted: number;
    conversionsUsed: number;
  };
  ledger: AdminLedgerEntry[];
};

export type AdminCatalogTool = {
  id: string;
  category: string;
  availability: string;
  allowsAnonymous: boolean;
  requiresAuthentication: boolean;
  availableOnPlans: readonly string[];
  premium: boolean;
  webCreditCost: number;
  apiCreditCost: number;
  aiCreditCost: number;
  processorId: string;
  health: "live" | "planned";
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
