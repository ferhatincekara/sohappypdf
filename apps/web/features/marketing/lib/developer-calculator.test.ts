import { describe, expect, test } from "bun:test";
import {
  groupDeveloperCalculatorTools,
  listDeveloperCalculatorTools,
  tasksForCredits,
} from "./developer-calculator";

describe("developer calculator", () => {
  test("divides selected credits by the tool API cost", () => {
    expect(tasksForCredits(2_500, 5)).toBe(500);
    expect(tasksForCredits(1_000, 1)).toBe(1_000);
    expect(tasksForCredits(10, 12)).toBe(0);
  });

  test("lists executable tools that consume API credits", () => {
    const tools = listDeveloperCalculatorTools();
    const merge = tools.find((tool) => tool.id === "merge-pdf");

    expect(tools.length).toBeGreaterThan(0);
    expect(merge?.apiCreditCost).toBe(1);
    expect(merge?.category).toBe("organize");
    expect(tools.every((tool) => tool.apiCreditCost > 0)).toBe(true);
  });

  test("groups calculator tools by catalog category", () => {
    const tools = listDeveloperCalculatorTools();
    const groups = groupDeveloperCalculatorTools(tools);
    const groupedIds = groups.flatMap((group) =>
      group.tools.map((tool) => tool.id),
    );

    expect(groups.length).toBeGreaterThan(0);
    expect(groups.every((group) => group.tools.length > 0)).toBe(true);
    expect(groupedIds.sort()).toEqual(tools.map((tool) => tool.id).sort());
  });
});
