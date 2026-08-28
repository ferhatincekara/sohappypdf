import { getTranslations } from "next-intl/server";
import {
  type DeveloperCalculatorTool,
  groupDeveloperCalculatorTools,
} from "../lib/developer-calculator";

export async function DeveloperCreditsTable({
  tools,
}: {
  tools: readonly DeveloperCalculatorTool[];
}) {
  const t = await getTranslations("marketing.pricing.developer");
  const tTools = await getTranslations("tools");
  const tCategories = await getTranslations("marketing.nav.categories");
  const groups = groupDeveloperCalculatorTools(tools);

  return (
    <section
      aria-labelledby="developer-credits-table"
      className="flex flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <h3
          id="developer-credits-table"
          className="text-sm font-bold tracking-tight"
        >
          {t("creditsTableTitle")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t("creditsTableDescription")}
        </p>
      </div>
      <div className="flex flex-col gap-8">
        {groups.map((group) => (
          <table key={group.category} className="w-full text-left text-sm">
            <caption className="pb-3 text-left text-xs font-bold tracking-tight text-muted-foreground">
              {tCategories(group.category)}
            </caption>
            <thead className="sr-only">
              <tr>
                <th>{t("creditsTableTool")}</th>
                <th>{t("creditsTableCredits")}</th>
              </tr>
            </thead>
            <tbody>
              {group.tools.map((tool) => (
                <tr
                  key={tool.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="py-3.5 pr-4 font-medium">
                    {tTools(`${tool.id}.name`)}
                  </td>
                  <td className="py-3.5 text-right">
                    <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold tabular-nums text-foreground">
                      {tool.apiCreditCost}
                    </span>
                    <span className="sr-only">
                      {t("creditsPerTask", { count: tool.apiCreditCost })}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </div>
    </section>
  );
}
