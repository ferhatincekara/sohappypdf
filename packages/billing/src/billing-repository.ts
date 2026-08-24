import { APP_ERROR_CODES, AppError } from "@repo/core";
import {
  billingCustomers,
  billingSubscriptions,
  conversionUsageEvents,
  type Database,
  usagePeriods,
  user,
  webCreditLedgerEntries,
  webhookEvents,
} from "@repo/db";
import { and, desc, eq, sql } from "drizzle-orm";
import type {
  BillingCustomerRecord,
  BillingSubscriptionRecord,
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
  }>;
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
  recordConversionUsage(input: {
    userId: string;
    conversionId: string;
    periodStart: Date;
    periodEnd: Date;
  }): Promise<boolean>;
  findUserEmail(userId: string): Promise<string | undefined>;
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
  }): Promise<boolean>;
};

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
        })
        .onConflictDoNothing()
        .returning();

      if (created !== undefined) {
        return {
          conversionsUsed: created.conversionsUsed,
          webCreditsGranted: created.webCreditsGranted,
          webCreditsUsed: created.webCreditsUsed,
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
              webCreditsGranted: input.grantAmount,
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

    async recordConversionUsage(input) {
      return db.transaction(async (tx) => {
        const inserted = await tx
          .insert(conversionUsageEvents)
          .values({
            conversionId: input.conversionId,
            userId: input.userId,
            periodStart: input.periodStart,
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

    async findUserEmail(userId) {
      const [row] = await db
        .select({ email: user.email })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);

      return row?.email;
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
                updatedAt: input.subscription.updatedAt,
              },
            });
        }

        return true;
      });
    },
  };
}
