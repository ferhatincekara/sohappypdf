import { CheckCircle2Icon, LockIcon, ShieldCheckIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import {
  BrandLogo,
  BrandSmileMark,
  BrandStarMark,
} from "@/components/brand-logo";
import { MARKETING_PATHS } from "@/features/marketing/lib/marketing-paths";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

const PERKS = [
  { id: "private", icon: ShieldCheckIcon },
  { id: "password", icon: LockIcon },
  { id: "start", icon: CheckCircle2Icon },
] as const;

type AuthShellVariant = "login" | "register" | "reset";
type AuthShellAccent = "yellow" | "green" | "cream";

const ACCENT_PANEL: Record<AuthShellAccent, string> = {
  yellow: "bg-primary",
  green: "bg-secondary",
  cream: "bg-muted",
};

const ACCENT_MARKS: Record<
  AuthShellAccent,
  { contrast: string; field: string }
> = {
  yellow: {
    contrast: "text-secondary",
    field: "text-white/50",
  },
  green: {
    contrast: "text-primary",
    field: "text-white/50",
  },
  cream: {
    contrast: "text-primary",
    field: "text-white/70",
  },
};

function accentForVariant(variant: AuthShellVariant): AuthShellAccent {
  if (variant === "register") {
    return "yellow";
  }

  if (variant === "reset") {
    return "cream";
  }

  return "green";
}

export async function AuthPageShell({
  title,
  description,
  children,
  variant,
}: {
  title: string;
  description: string;
  children: ReactNode;
  variant: AuthShellVariant;
}) {
  const t = await getTranslations("auth.shell");
  const accent = accentForVariant(variant);

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <section className="flex flex-col bg-white px-5 py-8 sm:px-10 lg:px-16 lg:py-10">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h2 className="text-3xl font-extrabold tracking-tight">{title}</h2>
          <p className="mt-2 text-lg/7 text-muted-foreground">{description}</p>
          <div className="mt-8">{children}</div>
        </div>
        <div className="order-first flex items-center justify-between lg:justify-end">
          <Link href={MARKETING_PATHS.home} className="lg:hidden">
            <BrandLogo title={t("brand")} />
          </Link>
          <Link
            href={MARKETING_PATHS.home}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            {t("home")}
          </Link>
        </div>
      </section>
      <aside
        className={cn(
          "relative hidden overflow-hidden px-10 py-10 lg:order-first lg:flex lg:flex-col",
          ACCENT_PANEL[accent],
        )}
      >
        <AuthBrandBackdrop accent={accent} />
        <Link href={MARKETING_PATHS.home} className="relative z-10 w-fit">
          <BrandLogo
            title={t("brand")}
            markClassName={accent === "yellow" ? "fill-secondary" : undefined}
          />
        </Link>
        <div className="relative z-10 mt-auto max-w-md pb-6">
          <p className="text-sm font-bold uppercase tracking-wider text-foreground/60">
            {t(`${variant}.eyebrow`)}
          </p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight tracking-tight xl:text-5xl">
            {t(`${variant}.title`)}
          </h1>
          <p className="mt-4 text-lg/7 text-foreground/85">
            {t(`${variant}.text`)}
          </p>
          <ul className="mt-8 space-y-3">
            {PERKS.map(({ id, icon: Icon }) => (
              <li
                key={id}
                className="flex items-center gap-3 text-sm font-semibold"
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full",
                    accent === "cream" ? "bg-white" : "bg-white/80",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                {t(`perks.${id}`)}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}

function AuthBrandBackdrop({ accent }: { accent: AuthShellAccent }) {
  const marks = ACCENT_MARKS[accent];

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <BrandStarMark
        className={cn(
          "absolute -right-8 -top-10 size-80 rotate-12",
          marks.contrast,
        )}
      />
      <BrandStarMark
        className={cn(
          "absolute bottom-40 -right-6 size-24 -rotate-12",
          marks.field,
        )}
      />
      <BrandSmileMark
        className={cn(
          "absolute -bottom-4 -left-10 w-144 -rotate-6",
          marks.field,
        )}
      />
    </div>
  );
}
