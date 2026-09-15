import { APP_ERROR_CODES, AppError } from "@sohappypdf/core";
import {
  apiSubscriptions,
  billingCustomers,
  billingSubscriptions,
  conversions,
  conversionUsageEvents,
  type Database,
  usagePeriods,
  user,
  webCreditLedgerEntries,
  webhookEvents,
} from "@sohappypdf/db";
import { and, desc, eq, gte, ne, sql } from "drizzle-orm";
import { resolveApiLedgerKind } from "./api-ledger-kind.js";
import type {
  AiCreditBalance,
  ApiCreditBalance,
  ApiCreditLedgerEntry,
  ApiSubscriptionRecord,
  BillingCustomerRecord,
  BillingSubscriptionRecord,
  PolarRecurringInterval,
  WebCreditBalance,
} from "./billing-types.js";

export type BillingRepository = {
  findCustomerByUserId(
    userId: string,
  ): Promise<BillingCustomerRecord | undefined>;
  findCustomerByPolarId(
    polarCustomerId: string,
  ): Promise<BillingCustomerRecord | undefined>;
  upsertCustomer(record: BillingCustomerRecord): Promise<BillingCustomerRecord>;
  findLatestSubscriptionByUserId(
    userId: string,
  ): Promise<BillingSubscriptionRecord | undefined>;
  upsertSubscription(
    record: Omit<BillingSubscriptionRecord, "id" | "createdAt"> & {
      id?: string;
      createdAt?: Date;
    },
  ): Promise<BillingSubscriptionRecord>;
  getOrCreateUsagePeriod(input: {
    userId: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<{
    conversionsUsed: number;
    webCreditsGranted: number;
    webCreditsUsed: number;
    aiCreditsGranted: number;
    aiCreditsUsed: number;
    apiCreditsGranted: number;
    apiCreditsUsed: number;
  }>;
  findLatestApiSubscriptionByUserId(
    userId: string,
  ): Promise<ApiSubscriptionRecord | undefined>;
  listApiSubscriptionsByUserId(
    userId: string,
  ): Promise<readonly ApiSubscriptionRecord[]>;
  upsertApiSubscription(
    record: Omit<ApiSubscriptionRecord, "id" | "createdAt"> & {
      id?: string;
      createdAt?: Date;
    },
  ): Promise<ApiSubscriptionRecord>;
  ensureWebCreditGrant(input: {
    userId: string;
    periodStart: Date;
    periodEnd: Date;
    grantAmount: number;
    now: Date;
  }): Promise<WebCreditBalance>;
  consumeWebCredits(input: {
    userId: string;
    periodStart: Date;
    periodEnd: Date;
    amount: number;
    toolId: string;
    executionId: string;
    reason: string;
    now: Date;
  }): Promise<boolean>;
  refundWebCredits(input: {
    userId: string;
    executionId: string;
    reason: string;
    now: Date;
  }): Promise<boolean>;
  ensureAiCreditGrant(input: {
    userId: string;
    periodStart: Date;
    periodEnd: Date;
    grantAmount: number;
    now: Date;
  }): Promise<AiCreditBalance>;
  consumeAiCredits(input: {
    userId: string;
    periodStart: Date;
    periodEnd: Date;
    amount: number;
    toolId: string;
    executionId: string;
    reason: string;
    now: Date;
  }): Promise<boolean>;
  refundAiCredits(input: {
    userId: string;
    executionId: string;
    reason: string;
    now: Date;
  }): Promise<boolean>;
  ensureApiCreditGrant(input: {
    userId: string;
    periodStart: Date;
    periodEnd: Date;
    grantAmount: number;
    now: Date;
  }): Promise<ApiCreditBalance>;
  consumeApiCredits(input: {
    userId: string;
    periodStart: Date;
    periodEnd: Date;
    amount: number;
    toolId: string;
    executionId: string;
    reason: string;
    now: Date;
  }): Promise<boolean>;
  refundApiCredits(input: {
    userId: string;
    executionId: string;
    reason: string;
    now: Date;
  }): Promise<boolean>;
  grantApiCreditTopUp(input: {
    userId: string;
    periodStart: Date;
    periodEnd: Date;
    amount: number;
    providerEventId: string;
    now: Date;
  }): Promise<boolean>;
  listApiCreditLedger(input: {
    userId: string;
    periodStart: Date;
    limit: number;
  }): Promise<readonly ApiCreditLedgerEntry[]>;
  sumManualCreditAdjustments(input: {
    userId: string;
    source: "web" | "api" | "ai";
    periodStart: Date;
  }): Promise<number>;
  recordConversionUsage(input: {
    userId: string;
    conversionId: string;
    toolId?: string | null;
    apiKeyId?: string | null;
    periodStart: Date;
    periodEnd: Date;
    createdAt?: Date;
  }): Promise<boolean>;
  countConversionUsageSince(input: {
    userId: string;
    since: Date;
  }): Promise<number>;
  findUserEmail(userId: string): Promise<string | undefined>;
  applyManualCreditAdjustment(input: {
    userId: string;
    source: "web" | "api" | "ai";
    amount: number;
    reason: string;
    periodStart: Date;
    periodEnd: Date;
    now: Date;
  }): Promise<void>;
  applySubscriptionWebhook(input: {
    provider: string;
    eventId: string;
    eventType: string;
    processedAt: Date;
    customer?: {
      userId: string;
      polarCustomerId: string;
    };
    subscription?: Omit<BillingSubscriptionRecord, "id" | "createdAt"> & {
      id?: string;
      createdAt?: Date;
    };
    apiSubscription?: Omit<ApiSubscriptionRecord, "id" | "createdAt"> & {
      id?: string;
      createdAt?: Date;
    };
    apiCreditTopUp?: {
      userId: string;
      periodStart: Date;
      periodEnd: Date;
      amount: number;
    };
  }): Promise<boolean>;
};

function parseStoredRecurringInterval(
  value: string | null,
): PolarRecurringInterval | null {
  if (
    value === "month" ||
    value === "year" ||
    value === "week" ||
    value === "day"
  ) {
    return value;
  }

  return null;
}

function billedAmountFields(record: {
  amountCents?: number | null;
  recurringInterval?: PolarRecurringInterval | null;
}): {
  amountCents: number | null;
  recurringInterval: PolarRecurringInterval | null;
} {
  return {
    amountCents: record.amountCents ?? null,
    recurringInterval: record.recurringInterval ?? null,
  };
}

function toCustomer(
  row: typeof billingCustomers.$inferSelect,
): BillingCustomerRecord {
  return {
    userId: row.userId,
    polarCustomerId: row.polarCustomerId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toSubscription(
  row: typeof billingSubscriptions.$inferSelect,
): BillingSubscriptionRecord {
  return {
    id: row.id,
    userId: row.userId,
    polarSubscriptionId: row.polarSubscriptionId,
    polarProductId: row.polarProductId,
    plan: row.plan,
    status: row.status,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    currentPeriodStart: row.currentPeriodStart,
    currentPeriodEnd: row.currentPeriodEnd,
    endedAt: row.endedAt,
    amountCents: row.amountCents ?? null,
    recurringInterval: parseStoredRecurringInterval(row.recurringInterval),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toWebCreditBalance(input: {
  webCreditsGranted: number;
  webCreditsUsed: number;
}): WebCreditBalance {
  return {
    webCreditsGranted: input.webCreditsGranted,
    webCreditsUsed: input.webCreditsUsed,
    webCreditsRemaining: input.webCreditsGranted - input.webCreditsUsed,
  };
}

function toAiCreditBalance(input: {
  aiCreditsGranted: number;
  aiCreditsUsed: number;
}): AiCreditBalance {
  return {
    aiCreditsGranted: input.aiCreditsGranted,
    aiCreditsUsed: input.aiCreditsUsed,
    aiCreditsRemaining: input.aiCreditsGranted - input.aiCreditsUsed,
  };
}

function toApiCreditBalance(input: {
  apiCreditsGranted: number;
  apiCreditsUsed: number;
}): ApiCreditBalance {
  return {
    apiCreditsGranted: input.apiCreditsGranted,
    apiCreditsUsed: input.apiCreditsUsed,
    apiCreditsRemaining: input.apiCreditsGranted - input.apiCreditsUsed,
  };
}

function toApiSubscription(
  row: typeof apiSubscriptions.$inferSelect,
): ApiSubscriptionRecord {
  return {
    id: row.id,
    userId: row.userId,
    polarSubscriptionId: row.polarSubscriptionId,
    polarProductId: row.polarProductId,
    productKey: row.productKey,
    status: row.status,
    cancelAtPeriodEnd: row.cancelAtPeriodEnd,
    currentPeriodStart: row.currentPeriodStart,
    currentPeriodEnd: row.currentPeriodEnd,
    endedAt: row.endedAt,
    amountCents: row.amountCents ?? null,
    recurringInterval: parseStoredRecurringInterval(row.recurringInterval),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function emptyUsageCredits() {
  return {
    conversionsUsed: 0,
    webCreditsGranted: 0,
    webCreditsUsed: 0,
    aiCreditsGranted: 0,
    aiCreditsUsed: 0,
    apiCreditsGranted: 0,
    apiCreditsUsed: 0,
  };
}

export function createBillingRepository(db: Database): BillingRepository {
  return {
    async findCustomerByUserId(userId) {
      const [row] = await db
        .select()
        .from(billingCustomers)
        .where(eq(billingCustomers.userId, userId))
        .limit(1);

      return row === undefined ? undefined : toCustomer(row);
    },

    async findCustomerByPolarId(polarCustomerId) {
      const [row] = await db
        .select()
        .from(billingCustomers)
        .where(eq(billingCustomers.polarCustomerId, polarCustomerId))
        .limit(1);

      return row === undefined ? undefined : toCustomer(row);
    },

    async upsertCustomer(record) {
      const [row] = await db
        .insert(billingCustomers)
        .values({
          userId: record.userId,
          polarCustomerId: record.polarCustomerId,
          createdAt: record.createdAt,
          updatedAt: record.updatedAt,
        })
        .onConflictDoUpdate({
          target: billingCustomers.userId,
          set: {
            polarCustomerId: record.polarCustomerId,
            updatedAt: record.updatedAt,
          },
        })
        .returning();

      if (row === undefined) {
        throw new AppError({
          code: APP_ERROR_CODES.INTERNAL_ERROR,
          message: "Failed to store billing customer",
        });
      }

      return toCustomer(row);
    },

    async findLatestSubscriptionByUserId(userId) {
      const [row] = await db
        .select()
        .from(billingSubscriptions)
        .where(eq(billingSubscriptions.userId, userId))
        .orderBy(desc(billingSubscriptions.updatedAt))
        .limit(1);

      return row === undefined ? undefined : toSubscription(row);
    },

    async upsertSubscription(record) {
      const [row] = await db
        .insert(billingSubscriptions)
        .values({
          ...(record.id === undefined ? {} : { id: record.id }),
          userId: record.userId,
          polarSubscriptionId: record.polarSubscriptionId,
          polarProductId: record.polarProductId,
          plan: record.plan,
          status: record.status,
          cancelAtPeriodEnd: record.cancelAtPeriodEnd,
          currentPeriodStart: record.currentPeriodStart,
          currentPeriodEnd: record.currentPeriodEnd,
          endedAt: record.endedAt,
          ...billedAmountFields(record),
          createdAt: record.createdAt ?? record.updatedAt,
          updatedAt: record.updatedAt,
        })
        .onConflictDoUpdate({
          target: billingSubscriptions.polarSubscriptionId,
          set: {
            userId: record.userId,
            polarProductId: record.polarProductId,
            plan: record.plan,
            status: record.status,
            cancelAtPeriodEnd: record.cancelAtPeriodEnd,
            currentPeriodStart: record.currentPeriodStart,
            currentPeriodEnd: record.currentPeriodEnd,
            endedAt: record.endedAt,
            ...billedAmountFields(record),
            updatedAt: record.updatedAt,
          },
        })
        .returning();

      if (row === undefined) {
        throw new AppError({
          code: APP_ERROR_CODES.INTERNAL_ERROR,
          message: "Failed to store billing subscription",
        });
      }

      return toSubscription(row);
    },

    async findLatestApiSubscriptionByUserId(userId) {
      const [row] = await db
        .select()
        .from(apiSubscriptions)
        .where(eq(apiSubscriptions.userId, userId))
        .orderBy(desc(apiSubscriptions.updatedAt))
        .limit(1);

      return row === undefined ? undefined : toApiSubscription(row);
    },

    async listApiSubscriptionsByUserId(userId) {
      const rows = await db
        .select()
        .from(apiSubscriptions)
        .where(eq(apiSubscriptions.userId, userId))
        .orderBy(desc(apiSubscriptions.updatedAt));

      return rows.map(toApiSubscription);
    },

    async upsertApiSubscription(record) {
      const [row] = await db
        .insert(apiSubscriptions)
        .values({
          ...(record.id === undefined ? {} : { id: record.id }),
          userId: record.userId,
          polarSubscriptionId: record.polarSubscriptionId,
          polarProductId: record.polarProductId,
          productKey: record.productKey,
          status: record.status,
          cancelAtPeriodEnd: record.cancelAtPeriodEnd,
          currentPeriodStart: record.currentPeriodStart,
          currentPeriodEnd: record.currentPeriodEnd,
          endedAt: record.endedAt,
          ...billedAmountFields(record),
          createdAt: record.createdAt ?? record.updatedAt,
          updatedAt: record.updatedAt,
        })
        .onConflictDoUpdate({
          target: apiSubscriptions.polarSubscriptionId,
          set: {
            userId: record.userId,
            polarProductId: record.polarProductId,
            productKey: record.productKey,
            status: record.status,
            cancelAtPeriodEnd: record.cancelAtPeriodEnd,
            currentPeriodStart: record.currentPeriodStart,
            currentPeriodEnd: record.currentPeriodEnd,
            endedAt: record.endedAt,
            ...billedAmountFields(record),
            updatedAt: record.updatedAt,
          },
        })
        .returning();

      if (row === undefined) {
        throw new AppError({
          code: APP_ERROR_CODES.INTERNAL_ERROR,
          message: "Failed to store API subscription",
        });
      }

      return toApiSubscription(row);
    },

    async getOrCreateUsagePeriod(input) {
      const [existing] = await db
        .select()
        .from(usagePeriods)
        .where(
          and(
            eq(usagePeriods.userId, input.userId),
            eq(usagePeriods.periodStart, input.periodStart),
          ),
        )
        .limit(1);

      if (existing !== undefined) {
        return {
          conversionsUsed: existing.conversionsUsed,
          webCreditsGranted: existing.webCreditsGranted,
          webCreditsUsed: existing.webCreditsUsed,
          aiCreditsGranted: existing.aiCreditsGranted,
          aiCreditsUsed: existing.aiCreditsUsed,
          apiCreditsGranted: existing.apiCreditsGranted,
          apiCreditsUsed: existing.apiCreditsUsed,
        };
      }

      const [created] = await db
        .insert(usagePeriods)
        .values({
          userId: input.userId,
          periodStart: input.periodStart,
          periodEnd: input.periodEnd,
          conversionsUsed: 0,
          webCreditsGranted: 0,
          webCreditsUsed: 0,
          aiCreditsGranted: 0,
          aiCreditsUsed: 0,
        })
        .onConflictDoNothing()
        .returning();

      if (created !== undefined) {
        return {
          conversionsUsed: created.conversionsUsed,
          webCreditsGranted: created.webCreditsGranted,
          webCreditsUsed: created.webCreditsUsed,
          aiCreditsGranted: created.aiCreditsGranted,
          aiCreditsUsed: created.aiCreditsUsed,
          apiCreditsGranted: created.apiCreditsGranted,
          apiCreditsUsed: created.apiCreditsUsed,
        };
      }

      const [retry] = await db
        .select()
        .from(usagePeriods)
        .where(
          and(
            eq(usagePeriods.userId, input.userId),
            eq(usagePeriods.periodStart, input.periodStart),
          ),
        )
        .limit(1);

      return {
        conversionsUsed: retry?.conversionsUsed ?? 0,
        webCreditsGranted: retry?.webCreditsGranted ?? 0,
        webCreditsUsed: retry?.webCreditsUsed ?? 0,
        aiCreditsGranted: retry?.aiCreditsGranted ?? 0,
        aiCreditsUsed: retry?.aiCreditsUsed ?? 0,
        apiCreditsGranted: retry?.apiCreditsGranted ?? 0,
        apiCreditsUsed: retry?.apiCreditsUsed ?? 0,
      };
    },

    async ensureWebCreditGrant(input) {
      return db.transaction(async (tx) => {
        await tx
          .insert(usagePeriods)
          .values({
            userId: input.userId,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
            conversionsUsed: 0,
            webCreditsGranted: 0,
            webCreditsUsed: 0,
            aiCreditsGranted: 0,
            aiCreditsUsed: 0,
            apiCreditsGranted: 0,
            apiCreditsUsed: 0,
          })
          .onConflictDoNothing();

        const insertedGrant = await tx
          .insert(webCreditLedgerEntries)
          .values({
            userId: input.userId,
            amount: input.grantAmount,
            type: "grant",
            source: "web",
            reason: "monthly_plan_grant",
            periodStart: input.periodStart,
            createdAt: input.now,
          })
          .onConflictDoNothing()
          .returning();

        if (insertedGrant.length > 0) {
          await tx
            .update(usagePeriods)
            .set({
              webCreditsGranted: sql`${usagePeriods.webCreditsGranted} + ${input.grantAmount}`,
              updatedAt: input.now,
            })
            .where(
              and(
                eq(usagePeriods.userId, input.userId),
                eq(usagePeriods.periodStart, input.periodStart),
              ),
            );
        }

        const [period] = await tx
          .select({
            webCreditsGranted: usagePeriods.webCreditsGranted,
            webCreditsUsed: usagePeriods.webCreditsUsed,
          })
          .from(usagePeriods)
          .where(
            and(
              eq(usagePeriods.userId, input.userId),
              eq(usagePeriods.periodStart, input.periodStart),
            ),
          )
          .limit(1);

        return toWebCreditBalance({
          webCreditsGranted: period?.webCreditsGranted ?? 0,
          webCreditsUsed: period?.webCreditsUsed ?? 0,
        });
      });
    },

    async consumeWebCredits(input) {
      return db.transaction(async (tx) => {
        const inserted = await tx
          .insert(webCreditLedgerEntries)
          .values({
            userId: input.userId,
            amount: input.amount,
            type: "consume",
            source: "web",
            reason: input.reason,
            toolId: input.toolId,
            executionId: input.executionId,
            periodStart: input.periodStart,
            createdAt: input.now,
          })
          .onConflictDoNothing()
          .returning();

        if (inserted.length === 0) {
          return false;
        }

        const updated = await tx
          .update(usagePeriods)
          .set({
            webCreditsUsed: sql`${usagePeriods.webCreditsUsed} + ${input.amount}`,
            updatedAt: input.now,
          })
          .where(
            and(
              eq(usagePeriods.userId, input.userId),
              eq(usagePeriods.periodStart, input.periodStart),
              sql`${usagePeriods.webCreditsUsed} + ${input.amount} <= ${usagePeriods.webCreditsGranted}`,
            ),
          )
          .returning();

        if (updated.length === 0) {
          throw new AppError({
            code: APP_ERROR_CODES.PLAN_LIMIT_REACHED,
            message: "Monthly web tool credit limit reached",
          });
        }

        return true;
      });
    },

    async refundWebCredits(input) {
      return db.transaction(async (tx) => {
        const [consumeEntry] = await tx
          .select({
            amount: webCreditLedgerEntries.amount,
            periodStart: webCreditLedgerEntries.periodStart,
          })
          .from(webCreditLedgerEntries)
          .where(
            and(
              eq(webCreditLedgerEntries.userId, input.userId),
              eq(webCreditLedgerEntries.executionId, input.executionId),
              eq(webCreditLedgerEntries.type, "consume"),
            ),
          )
          .limit(1);

        if (consumeEntry === undefined) {
          return false;
        }

        const insertedRefund = await tx
          .insert(webCreditLedgerEntries)
          .values({
            userId: input.userId,
            amount: consumeEntry.amount,
            type: "refund",
            source: "web",
            reason: input.reason,
            executionId: input.executionId,
            periodStart: consumeEntry.periodStart,
            createdAt: input.now,
          })
          .onConflictDoNothing()
          .returning();

        if (insertedRefund.length === 0) {
          return false;
        }

        await tx
          .update(usagePeriods)
          .set({
            webCreditsUsed: sql`GREATEST(0, ${usagePeriods.webCreditsUsed} - ${consumeEntry.amount})`,
            updatedAt: input.now,
          })
          .where(
            and(
              eq(usagePeriods.userId, input.userId),
              eq(usagePeriods.periodStart, consumeEntry.periodStart),
            ),
          );

        return true;
      });
    },

    async ensureAiCreditGrant(input) {
      return db.transaction(async (tx) => {
        await tx
          .insert(usagePeriods)
          .values({
            userId: input.userId,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
            conversionsUsed: 0,
            webCreditsGranted: 0,
            webCreditsUsed: 0,
            aiCreditsGranted: 0,
            aiCreditsUsed: 0,
            apiCreditsGranted: 0,
            apiCreditsUsed: 0,
          })
          .onConflictDoNothing();

        if (input.grantAmount > 0) {
          const insertedGrant = await tx
            .insert(webCreditLedgerEntries)
            .values({
              userId: input.userId,
              amount: input.grantAmount,
              type: "grant",
              source: "ai",
              reason: "monthly_plan_grant",
              periodStart: input.periodStart,
              createdAt: input.now,
            })
            .onConflictDoNothing()
            .returning();

          if (insertedGrant.length > 0) {
            await tx
              .update(usagePeriods)
              .set({
                aiCreditsGranted: input.grantAmount,
                updatedAt: input.now,
              })
              .where(
                and(
                  eq(usagePeriods.userId, input.userId),
                  eq(usagePeriods.periodStart, input.periodStart),
                ),
              );
          }
        }

        const [period] = await tx
          .select({
            aiCreditsGranted: usagePeriods.aiCreditsGranted,
            aiCreditsUsed: usagePeriods.aiCreditsUsed,
          })
          .from(usagePeriods)
          .where(
            and(
              eq(usagePeriods.userId, input.userId),
              eq(usagePeriods.periodStart, input.periodStart),
            ),
          )
          .limit(1);

        return toAiCreditBalance({
          aiCreditsGranted: period?.aiCreditsGranted ?? 0,
          aiCreditsUsed: period?.aiCreditsUsed ?? 0,
        });
      });
    },

    async consumeAiCredits(input) {
      return db.transaction(async (tx) => {
        const inserted = await tx
          .insert(webCreditLedgerEntries)
          .values({
            userId: input.userId,
            amount: input.amount,
            type: "consume",
            source: "ai",
            reason: input.reason,
            toolId: input.toolId,
            executionId: input.executionId,
            periodStart: input.periodStart,
            createdAt: input.now,
          })
          .onConflictDoNothing()
          .returning();

        if (inserted.length === 0) {
          return false;
        }

        const updated = await tx
          .update(usagePeriods)
          .set({
            aiCreditsUsed: sql`${usagePeriods.aiCreditsUsed} + ${input.amount}`,
            updatedAt: input.now,
          })
          .where(
            and(
              eq(usagePeriods.userId, input.userId),
              eq(usagePeriods.periodStart, input.periodStart),
              sql`${usagePeriods.aiCreditsUsed} + ${input.amount} <= ${usagePeriods.aiCreditsGranted}`,
            ),
          )
          .returning();

        if (updated.length === 0) {
          throw new AppError({
            code: APP_ERROR_CODES.PLAN_LIMIT_REACHED,
            message: "Monthly AI credit limit reached",
          });
        }

        return true;
      });
    },

    async refundAiCredits(input) {
      return db.transaction(async (tx) => {
        const [consumeEntry] = await tx
          .select({
            amount: webCreditLedgerEntries.amount,
            periodStart: webCreditLedgerEntries.periodStart,
          })
          .from(webCreditLedgerEntries)
          .where(
            and(
              eq(webCreditLedgerEntries.userId, input.userId),
              eq(webCreditLedgerEntries.executionId, input.executionId),
              eq(webCreditLedgerEntries.type, "consume"),
              eq(webCreditLedgerEntries.source, "ai"),
            ),
          )
          .limit(1);

        if (consumeEntry === undefined) {
          return false;
        }

        const insertedRefund = await tx
          .insert(webCreditLedgerEntries)
          .values({
            userId: input.userId,
            amount: consumeEntry.amount,
            type: "refund",
            source: "ai",
            reason: input.reason,
            executionId: input.executionId,
            periodStart: consumeEntry.periodStart,
            createdAt: input.now,
          })
          .onConflictDoNothing()
          .returning();

        if (insertedRefund.length === 0) {
          return false;
        }

        await tx
          .update(usagePeriods)
          .set({
            aiCreditsUsed: sql`GREATEST(0, ${usagePeriods.aiCreditsUsed} - ${consumeEntry.amount})`,
            updatedAt: input.now,
          })
          .where(
            and(
              eq(usagePeriods.userId, input.userId),
              eq(usagePeriods.periodStart, consumeEntry.periodStart),
            ),
          );

        return true;
      });
    },

    async ensureApiCreditGrant(input) {
      return db.transaction(async (tx) => {
        await tx
          .insert(usagePeriods)
          .values({
            userId: input.userId,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
            ...emptyUsageCredits(),
          })
          .onConflictDoNothing();

        if (input.grantAmount > 0) {
          const insertedGrant = await tx
            .insert(webCreditLedgerEntries)
            .values({
              userId: input.userId,
              amount: input.grantAmount,
              type: "grant",
              source: "api",
              reason: "monthly_plan_grant",
              periodStart: input.periodStart,
              createdAt: input.now,
            })
            .onConflictDoNothing()
            .returning();

          if (insertedGrant.length > 0) {
            await tx
              .update(usagePeriods)
              .set({
                apiCreditsGranted: sql`${usagePeriods.apiCreditsGranted} + ${input.grantAmount}`,
                updatedAt: input.now,
              })
              .where(
                and(
                  eq(usagePeriods.userId, input.userId),
                  eq(usagePeriods.periodStart, input.periodStart),
                ),
              );
          }
        }

        const [period] = await tx
          .select({
            apiCreditsGranted: usagePeriods.apiCreditsGranted,
            apiCreditsUsed: usagePeriods.apiCreditsUsed,
          })
          .from(usagePeriods)
          .where(
            and(
              eq(usagePeriods.userId, input.userId),
              eq(usagePeriods.periodStart, input.periodStart),
            ),
          )
          .limit(1);

        return toApiCreditBalance({
          apiCreditsGranted: period?.apiCreditsGranted ?? 0,
          apiCreditsUsed: period?.apiCreditsUsed ?? 0,
        });
      });
    },

    async consumeApiCredits(input) {
      return db.transaction(async (tx) => {
        const inserted = await tx
          .insert(webCreditLedgerEntries)
          .values({
            userId: input.userId,
            amount: input.amount,
            type: "consume",
            source: "api",
            reason: input.reason,
            toolId: input.toolId,
            executionId: input.executionId,
            periodStart: input.periodStart,
            createdAt: input.now,
          })
          .onConflictDoNothing()
          .returning();

        if (inserted.length === 0) {
          return false;
        }

        const updated = await tx
          .update(usagePeriods)
          .set({
            apiCreditsUsed: sql`${usagePeriods.apiCreditsUsed} + ${input.amount}`,
            updatedAt: input.now,
          })
          .where(
            and(
              eq(usagePeriods.userId, input.userId),
              eq(usagePeriods.periodStart, input.periodStart),
              sql`${usagePeriods.apiCreditsUsed} + ${input.amount} <= ${usagePeriods.apiCreditsGranted}`,
            ),
          )
          .returning();

        if (updated.length === 0) {
          throw new AppError({
            code: APP_ERROR_CODES.PLAN_LIMIT_REACHED,
            message: "API credit limit reached",
          });
        }

        return true;
      });
    },

    async refundApiCredits(input) {
      return db.transaction(async (tx) => {
        const [consumeEntry] = await tx
          .select({
            amount: webCreditLedgerEntries.amount,
            periodStart: webCreditLedgerEntries.periodStart,
          })
          .from(webCreditLedgerEntries)
          .where(
            and(
              eq(webCreditLedgerEntries.userId, input.userId),
              eq(webCreditLedgerEntries.executionId, input.executionId),
              eq(webCreditLedgerEntries.type, "consume"),
              eq(webCreditLedgerEntries.source, "api"),
            ),
          )
          .limit(1);

        if (consumeEntry === undefined) {
          return false;
        }

        const insertedRefund = await tx
          .insert(webCreditLedgerEntries)
          .values({
            userId: input.userId,
            amount: consumeEntry.amount,
            type: "refund",
            source: "api",
            reason: input.reason,
            executionId: input.executionId,
            periodStart: consumeEntry.periodStart,
            createdAt: input.now,
          })
          .onConflictDoNothing()
          .returning();

        if (insertedRefund.length === 0) {
          return false;
        }

        await tx
          .update(usagePeriods)
          .set({
            apiCreditsUsed: sql`GREATEST(0, ${usagePeriods.apiCreditsUsed} - ${consumeEntry.amount})`,
            updatedAt: input.now,
          })
          .where(
            and(
              eq(usagePeriods.userId, input.userId),
              eq(usagePeriods.periodStart, consumeEntry.periodStart),
            ),
          );

        return true;
      });
    },

    async grantApiCreditTopUp(input) {
      return db.transaction(async (tx) => {
        await tx
          .insert(usagePeriods)
          .values({
            userId: input.userId,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
            ...emptyUsageCredits(),
          })
          .onConflictDoNothing();

        const inserted = await tx
          .insert(webCreditLedgerEntries)
          .values({
            userId: input.userId,
            amount: input.amount,
            type: "adjustment",
            source: "api",
            reason: "polar_topup",
            providerEventId: input.providerEventId,
            periodStart: input.periodStart,
            createdAt: input.now,
          })
          .onConflictDoNothing()
          .returning();

        if (inserted.length === 0) {
          return false;
        }

        await tx
          .update(usagePeriods)
          .set({
            apiCreditsGranted: sql`${usagePeriods.apiCreditsGranted} + ${input.amount}`,
            updatedAt: input.now,
          })
          .where(
            and(
              eq(usagePeriods.userId, input.userId),
              eq(usagePeriods.periodStart, input.periodStart),
            ),
          );

        return true;
      });
    },

    async sumManualCreditAdjustments(input) {
      const [row] = await db
        .select({
          total: sql<number>`coalesce(sum(${webCreditLedgerEntries.amount}), 0)::int`,
        })
        .from(webCreditLedgerEntries)
        .where(
          and(
            eq(webCreditLedgerEntries.userId, input.userId),
            eq(webCreditLedgerEntries.source, input.source),
            eq(webCreditLedgerEntries.type, "adjustment"),
            sql`${webCreditLedgerEntries.reason} like 'admin:%'`,
            eq(webCreditLedgerEntries.periodStart, input.periodStart),
          ),
        );

      const parsed = Number(row?.total ?? 0);
      return Number.isFinite(parsed) ? parsed : 0;
    },

    async listApiCreditLedger(input) {
      const rows = await db
        .select({
          id: webCreditLedgerEntries.id,
          amount: webCreditLedgerEntries.amount,
          type: webCreditLedgerEntries.type,
          reason: webCreditLedgerEntries.reason,
          toolId: webCreditLedgerEntries.toolId,
          createdAt: webCreditLedgerEntries.createdAt,
        })
        .from(webCreditLedgerEntries)
        .where(
          and(
            eq(webCreditLedgerEntries.userId, input.userId),
            eq(webCreditLedgerEntries.source, "api"),
            eq(webCreditLedgerEntries.periodStart, input.periodStart),
          ),
        )
        .orderBy(desc(webCreditLedgerEntries.createdAt))
        .limit(input.limit);

      return rows.map((row) => ({
        id: row.id,
        amount: row.amount,
        type: row.type,
        kind: resolveApiLedgerKind({ type: row.type, reason: row.reason }),
        toolId: row.toolId,
        createdAt: row.createdAt.toISOString(),
      }));
    },

    async recordConversionUsage(input) {
      return db.transaction(async (tx) => {
        const inserted = await tx
          .insert(conversionUsageEvents)
          .values({
            conversionId: input.conversionId,
            userId: input.userId,
            apiKeyId: input.apiKeyId ?? null,
            toolId: input.toolId ?? null,
            periodStart: input.periodStart,
            createdAt: input.createdAt ?? new Date(),
          })
          .onConflictDoNothing()
          .returning();

        if (inserted.length === 0) {
          return false;
        }

        await tx
          .insert(usagePeriods)
          .values({
            userId: input.userId,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
            conversionsUsed: 1,
            webCreditsGranted: 0,
            webCreditsUsed: 0,
            aiCreditsGranted: 0,
            aiCreditsUsed: 0,
            apiCreditsGranted: 0,
            apiCreditsUsed: 0,
          })
          .onConflictDoUpdate({
            target: [usagePeriods.userId, usagePeriods.periodStart],
            set: {
              conversionsUsed: sql`${usagePeriods.conversionsUsed} + 1`,
              updatedAt: new Date(),
            },
          });

        return true;
      });
    },

    async countConversionUsageSince(input) {
      const [eventRow] = await db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(conversionUsageEvents)
        .where(
          and(
            eq(conversionUsageEvents.userId, input.userId),
            gte(conversionUsageEvents.createdAt, input.since),
          ),
        );
      const [conversionRow] = await db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(conversions)
        .where(
          and(
            eq(conversions.ownerId, input.userId),
            eq(conversions.ownerKind, "user"),
            ne(conversions.status, "cancelled"),
            gte(conversions.createdAt, input.since),
          ),
        );

      return Math.max(
        Number(eventRow?.count ?? 0),
        Number(conversionRow?.count ?? 0),
      );
    },

    async findUserEmail(userId) {
      const [row] = await db
        .select({ email: user.email })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      return row?.email;
    },

    async applyManualCreditAdjustment(input) {
      const grantedUpdate =
        input.source === "web"
          ? {
              webCreditsGranted: sql`${usagePeriods.webCreditsGranted} + ${input.amount}`,
            }
          : input.source === "api"
            ? {
                apiCreditsGranted: sql`${usagePeriods.apiCreditsGranted} + ${input.amount}`,
              }
            : {
                aiCreditsGranted: sql`${usagePeriods.aiCreditsGranted} + ${input.amount}`,
              };

      await db.transaction(async (tx) => {
        await tx
          .insert(usagePeriods)
          .values({
            userId: input.userId,
            periodStart: input.periodStart,
            periodEnd: input.periodEnd,
            ...emptyUsageCredits(),
          })
          .onConflictDoNothing();

        await tx.insert(webCreditLedgerEntries).values({
          userId: input.userId,
          amount: input.amount,
          type: "adjustment",
          source: input.source,
          reason: input.reason,
          periodStart: input.periodStart,
          createdAt: input.now,
        });

        await tx
          .update(usagePeriods)
          .set({
            ...grantedUpdate,
            updatedAt: input.now,
          })
          .where(
            and(
              eq(usagePeriods.userId, input.userId),
              eq(usagePeriods.periodStart, input.periodStart),
            ),
          );
      });
    },

    async applySubscriptionWebhook(input) {
      return db.transaction(async (tx) => {
        const claimed = await tx
          .insert(webhookEvents)
          .values({
            provider: input.provider,
            eventId: input.eventId,
            eventType: input.eventType,
            processedAt: input.processedAt,
          })
          .onConflictDoNothing()
          .returning();

        if (claimed.length === 0) {
          return false;
        }

        if (input.customer !== undefined) {
          await tx
            .insert(billingCustomers)
            .values({
              userId: input.customer.userId,
              polarCustomerId: input.customer.polarCustomerId,
              createdAt: input.processedAt,
              updatedAt: input.processedAt,
            })
            .onConflictDoUpdate({
              target: billingCustomers.userId,
              set: {
                polarCustomerId: input.customer.polarCustomerId,
                updatedAt: input.processedAt,
              },
            });
        }

        if (input.subscription !== undefined) {
          await tx
            .insert(billingSubscriptions)
            .values({
              ...(input.subscription.id === undefined
                ? {}
                : { id: input.subscription.id }),
              userId: input.subscription.userId,
              polarSubscriptionId: input.subscription.polarSubscriptionId,
              polarProductId: input.subscription.polarProductId,
              plan: input.subscription.plan,
              status: input.subscription.status,
              cancelAtPeriodEnd: input.subscription.cancelAtPeriodEnd,
              currentPeriodStart: input.subscription.currentPeriodStart,
              currentPeriodEnd: input.subscription.currentPeriodEnd,
              endedAt: input.subscription.endedAt,
              ...billedAmountFields(input.subscription),
              createdAt:
                input.subscription.createdAt ?? input.subscription.updatedAt,
              updatedAt: input.subscription.updatedAt,
            })
            .onConflictDoUpdate({
              target: billingSubscriptions.polarSubscriptionId,
              set: {
                userId: input.subscription.userId,
                polarProductId: input.subscription.polarProductId,
                plan: input.subscription.plan,
                status: input.subscription.status,
                cancelAtPeriodEnd: input.subscription.cancelAtPeriodEnd,
                currentPeriodStart: input.subscription.currentPeriodStart,
                currentPeriodEnd: input.subscription.currentPeriodEnd,
                endedAt: input.subscription.endedAt,
                ...billedAmountFields(input.subscription),
                updatedAt: input.subscription.updatedAt,
              },
            });
        }

        if (input.apiSubscription !== undefined) {
          await tx
            .insert(apiSubscriptions)
            .values({
              ...(input.apiSubscription.id === undefined
                ? {}
                : { id: input.apiSubscription.id }),
              userId: input.apiSubscription.userId,
              polarSubscriptionId: input.apiSubscription.polarSubscriptionId,
              polarProductId: input.apiSubscription.polarProductId,
              productKey: input.apiSubscription.productKey,
              status: input.apiSubscription.status,
              cancelAtPeriodEnd: input.apiSubscription.cancelAtPeriodEnd,
              currentPeriodStart: input.apiSubscription.currentPeriodStart,
              currentPeriodEnd: input.apiSubscription.currentPeriodEnd,
              endedAt: input.apiSubscription.endedAt,
              ...billedAmountFields(input.apiSubscription),
              createdAt:
                input.apiSubscription.createdAt ??
                input.apiSubscription.updatedAt,
              updatedAt: input.apiSubscription.updatedAt,
            })
            .onConflictDoUpdate({
              target: apiSubscriptions.polarSubscriptionId,
              set: {
                userId: input.apiSubscription.userId,
                polarProductId: input.apiSubscription.polarProductId,
                productKey: input.apiSubscription.productKey,
                status: input.apiSubscription.status,
                cancelAtPeriodEnd: input.apiSubscription.cancelAtPeriodEnd,
                currentPeriodStart: input.apiSubscription.currentPeriodStart,
                currentPeriodEnd: input.apiSubscription.currentPeriodEnd,
                endedAt: input.apiSubscription.endedAt,
                ...billedAmountFields(input.apiSubscription),
                updatedAt: input.apiSubscription.updatedAt,
              },
            });
        }

        if (input.apiCreditTopUp !== undefined) {
          await tx
            .insert(usagePeriods)
            .values({
              userId: input.apiCreditTopUp.userId,
              periodStart: input.apiCreditTopUp.periodStart,
              periodEnd: input.apiCreditTopUp.periodEnd,
              ...emptyUsageCredits(),
            })
            .onConflictDoNothing();

          const insertedTopUp = await tx
            .insert(webCreditLedgerEntries)
            .values({
              userId: input.apiCreditTopUp.userId,
              amount: input.apiCreditTopUp.amount,
              type: "adjustment",
              source: "api",
              reason: "polar_topup",
              providerEventId: input.eventId,
              periodStart: input.apiCreditTopUp.periodStart,
              createdAt: input.processedAt,
            })
            .onConflictDoNothing()
            .returning();

          if (insertedTopUp.length > 0) {
            await tx
              .update(usagePeriods)
              .set({
                apiCreditsGranted: sql`${usagePeriods.apiCreditsGranted} + ${input.apiCreditTopUp.amount}`,
                updatedAt: input.processedAt,
              })
              .where(
                and(
                  eq(usagePeriods.userId, input.apiCreditTopUp.userId),
                  eq(
                    usagePeriods.periodStart,
                    input.apiCreditTopUp.periodStart,
                  ),
                ),
              );
          }
        }

        return true;
      });
    },
  };
}
