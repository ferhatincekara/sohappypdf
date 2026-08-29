import { StarIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { MarketingContainer } from "@/features/marketing/components/marketing-container";
import { UiKitPlayground } from "@/features/ui-kit/components/ui-kit-playground";
import { UI_KIT_COLOR_TOKENS } from "@/features/ui-kit/lib/ui-kit-tokens";

const UI_KIT_SELECT_ITEMS = [
  { value: "merge-pdf", label: "Merge PDF" },
  { value: "compress-pdf", label: "Compress PDF" },
  { value: "ocr-pdf", label: "OCR PDF" },
] as const;

const BUTTON_VARIANTS = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "white",
  "dark",
  "destructive",
] as const;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-xl font-bold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export function UiKitPage() {
  return (
    <div className="pb-12 pt-10">
      <MarketingContainer className="flex flex-col gap-16">
        <div className="flex max-w-2xl flex-col gap-3">
          <Badge variant="secondary">Development only</Badge>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
            UI kit
          </h1>
          <p className="text-lg/7 text-muted-foreground">
            Shadcn primitives mapped to the reference palette: yellow primary,
            green secondary, cream muted, sand accent.
          </p>
        </div>

        <Section title="Color tokens">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {UI_KIT_COLOR_TOKENS.map((token) => (
              <li
                key={token}
                className="overflow-hidden rounded-2xl border border-border"
              >
                <div
                  className="h-20 border-b border-border"
                  style={{ background: `var(--${token})` }}
                />
                <p className="px-3 py-2 text-xs font-semibold">{token}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap gap-3 rounded-4xl bg-muted p-6">
            {BUTTON_VARIANTS.map((variant) => (
              <Button key={variant} variant={variant}>
                {variant}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="xs">xs</Button>
            <Button size="sm">sm</Button>
            <Button size="default">default</Button>
            <Button size="lg">lg</Button>
            <Button size="icon" aria-label="Icon">
              <StarIcon />
            </Button>
            <Button disabled>Disabled</Button>
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex flex-wrap gap-2">
            <Badge>default</Badge>
            <Badge variant="secondary">secondary</Badge>
            <Badge variant="outline">outline</Badge>
            <Badge variant="muted">muted</Badge>
            <Badge size="sm" variant="secondary">
              small
            </Badge>
          </div>
        </Section>

        <Section title="Surfaces">
          <div className="grid gap-5 md:grid-cols-2">
            <Card className="rounded-7 border border-border p-6 shadow-soft">
              <CardHeader>
                <CardTitle>Card</CardTitle>
                <CardDescription>
                  White surface with the soft shadow token.
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-4 text-sm text-muted-foreground">
                Used for tool workspaces, billing panels, and pricing cards.
              </CardContent>
              <CardFooter className="mt-6">
                <Button size="sm">Continue</Button>
              </CardFooter>
            </Card>
            <div className="rounded-4xl bg-secondary p-8">
              <p className="text-sm font-bold uppercase tracking-wider text-foreground/70">
                Secondary block
              </p>
              <p className="mt-3 text-3xl font-bold tracking-tight">
                Green band like the overview section.
              </p>
              <div className="mt-6 flex gap-3">
                <Button variant="white">Start</Button>
                <Button variant="outline">Browse tools</Button>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Form">
          <FieldGroup className="max-w-md">
            <Field>
              <FieldLabel htmlFor="ui-kit-email">Email</FieldLabel>
              <Input
                id="ui-kit-email"
                type="email"
                placeholder="you@email.com"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ui-kit-password">Password</FieldLabel>
              <Input
                id="ui-kit-password"
                type="password"
                defaultValue="secret"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ui-kit-tool">Tool</FieldLabel>
              <Select defaultValue="merge-pdf" items={UI_KIT_SELECT_ITEMS}>
                <SelectTrigger id="ui-kit-tool">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UI_KIT_SELECT_ITEMS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Button type="button">Sign in</Button>
          </FieldGroup>
        </Section>

        <Section title="Feedback">
          <div className="grid gap-4 md:grid-cols-2">
            <Alert>
              <AlertTitle>Files expire in two hours</AlertTitle>
              <AlertDescription>
                Download the result before the temporary file is removed.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertTitle>That file is too large</AlertTitle>
              <AlertDescription>
                Free plans accept files up to 25 MB.
              </AlertDescription>
            </Alert>
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-border p-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-64" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        </Section>

        <Separator />

        <Section title="Interactive">
          <UiKitPlayground />
        </Section>
      </MarketingContainer>
    </div>
  );
}
