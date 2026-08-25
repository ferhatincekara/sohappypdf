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
