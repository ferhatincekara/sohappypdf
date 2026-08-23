import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { type Database, schema } from "@repo/db";

export function createAuthAdapterSchema() {
  return {
    user: schema.user,
    session: schema.session,
    account: schema.account,
    verification: schema.verification,
    userRelations: schema.userRelations,
    sessionRelations: schema.sessionRelations,
    accountRelations: schema.accountRelations,
  };
}

export function createAuthDrizzleAdapter(database: Database) {
  return drizzleAdapter(database, {
    provider: "pg",
    schema: createAuthAdapterSchema(),
  });
}
