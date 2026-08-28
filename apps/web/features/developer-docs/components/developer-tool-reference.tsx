"use client";

import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Link } from "@/lib/i18n/navigation";
import type { PublicApiTool } from "../lib/public-api-tools";
import { CodeBlock } from "./code-block";

export function DeveloperToolReference({
  tools,
  categories,
}: {
  tools: readonly PublicApiTool[];
  categories: readonly PublicApiTool["category"][];
}) {
  const t = useTranslations("developerDocs");
  const tTools = useTranslations("tools");
  const tNav = useTranslations("marketing.nav.categories");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return tools.filter((tool) => {
      if (category !== "all" && tool.category !== category) {
        return false;
      }

      if (needle === "") {
        return true;
      }

      const name = tTools(`${tool.id}.name`).toLowerCase();
      return name.includes(needle) || tool.id.includes(needle);
    });
  }, [category, query, tTools, tools]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
          }}
          placeholder={t("tools.search")}
          aria-label={t("tools.search")}
          className="bg-background md:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          <FilterChip
            active={category === "all"}
            onClick={() => {
              setCategory("all");
            }}
          >
            {t("tools.allCategories")}
          </FilterChip>
          {categories.map((id) => (
            <FilterChip
              key={id}
              active={category === id}
              onClick={() => {
                setCategory(id);
              }}
            >
              {tNav(id)}
            </FilterChip>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {t("tools.resultCount", { count: visible.length })}
      </p>

      <ul className="divide-y divide-border">
        {visible.map((tool) => (
          <li
            key={tool.id}
            id={`tool-${tool.id}`}
            className="scroll-mt-28 py-6 first:pt-0"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold tracking-tight">
                    {tTools(`${tool.id}.name`)}
                  </h3>
                  {tool.premium ? (
                    <Badge variant="secondary">{t("tools.pro")}</Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  {tTools(`${tool.id}.description`)}
                </p>
              </div>
              <Link
                href={`/${tool.id}`}
                className="text-sm font-semibold underline-offset-4 hover:underline"
              >
                {t("tools.tryInBrowser")}
              </Link>
            </div>

            <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Spec label={t("tools.type")} value={tool.id} />
              <Spec
                label={t("tools.input")}
                value={tool.inputFormats.join(", ")}
              />
              <Spec
                label={t("tools.output")}
                value={tool.outputFormats.join(", ")}
              />
              <Spec
                label={t("tools.credits")}
                value={
                  tool.aiCreditCost > 0
                    ? t("tools.aiCredits", { count: tool.aiCreditCost })
                    : t("tools.apiCredits", { count: tool.apiCreditCost })
                }
              />
              <Spec
                label={t("tools.files")}
                value={t("tools.filesValue", { count: tool.maxInputCount })}
              />
              <Spec
                label={t("tools.extraFiles")}
                value={t(`tools.extra.${tool.extraFiles}`)}
              />
            </dl>

            {tool.fields.length > 0 ? (
              <div className="mt-5">
                <p className="text-sm font-semibold">{t("tools.options")}</p>
                <ul className="mt-2 divide-y divide-border">
                  {tool.fields.map((field) => (
                    <li
                      key={field.name}
                      className="grid gap-1 py-2 text-sm sm:grid-cols-[--spacing(32)_1fr_auto]"
                    >
                      <code className="font-mono text-xs">{field.name}</code>
                      <span className="text-muted-foreground">
                        {field.spec}
                      </span>
                      <span className="text-xs font-semibold">
                        {field.required
                          ? t("tools.required")
                          : t("tools.optional")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {tool.noteIds.length > 0 ? (
              <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {tool.noteIds.map((noteId) => (
                  <li key={noteId}>{t(`notes.${noteId}`)}</li>
                ))}
              </ul>
            ) : null}

            <div className="mt-5">
              <CodeBlock
                label={t("tools.exampleLabel")}
                code={tool.exampleJson}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold text-background"
          : "rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-foreground"
      }
    >
      {children}
    </button>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 font-medium wrap-break-word">{value}</dd>
    </div>
  );
}
