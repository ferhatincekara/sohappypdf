import { describe, expect, test } from "bun:test";
import { billingSubscriptions, createDatabase, user } from "@sohappypdf/db";
import { sql } from "drizzle-orm";
import { QUALIFIED_USER_ID_SQL } from "./sql.ts";

describe("admin user list SQL", () => {
  test("qualifies outer user id so inner uuid primary keys are not compared", () => {
    const db = createDatabase({
      url: "postgresql://user:pass@127.0.0.1:5432/dummy",
    });
    const query = db
      .select({ id: user.id })
      .from(user)
      .where(sql`exists (
        select 1 from ${billingSubscriptions}
        where ${billingSubscriptions.userId} = ${QUALIFIED_USER_ID_SQL}
      )`);
    const compiled = query.toSQL().sql;

    expect(compiled).toContain('"user"."id"');
    expect(compiled).not.toMatch(/=\s*"id"/);
  });
});
