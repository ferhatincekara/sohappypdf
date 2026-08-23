"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { BillingUpgradeLink } from "@/features/billing/components/billing-upgrade-link";
import { useCreateApiKey } from "../hooks/use-create-api-key";
import type { CreatedApiKeySecret } from "../lib/created-api-key-secret";
import { takeCreatedApiKeySecret } from "../lib/created-api-key-secret";
import {
  type CreateApiKeyFormValues,
  createApiKeyFormSchema,
} from "../schemas/create-api-key-schema";

export function ApiKeyCreateForm({
  onCreated,
}: {
  onCreated: (created: CreatedApiKeySecret) => void;
}) {
  const t = useTranslations("apiKeys.create");
  const tValidation = useTranslations("apiKeys.validation");
  const tErrors = useTranslations("apiKeys.errors");
  const { createApiKey, isPending, errorKey, reset } = useCreateApiKey();
  const form = useForm<CreateApiKeyFormValues>({
    resolver: zodResolver(createApiKeyFormSchema(tValidation)),
    defaultValues: { name: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const created = await createApiKey({ name: values.name });
      const secret = takeCreatedApiKeySecret(created);
      reset();
      onCreated(secret);
    } catch {
      return;
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      {errorKey === null ? null : (
        <Alert variant="destructive">
          <AlertDescription>
            {tErrors(errorKey)}
            {errorKey === "apiKeyLimitReached" ? (
              <span className="ml-1">
                <BillingUpgradeLink />
              </span>
            ) : null}
          </AlertDescription>
        </Alert>
      )}
      <FieldGroup>
        <Field data-invalid={form.formState.errors.name !== undefined}>
          <FieldLabel htmlFor="api-key-name">{t("name")}</FieldLabel>
          <Input
            id="api-key-name"
            autoComplete="off"
            disabled={isPending}
            placeholder={t("namePlaceholder")}
            aria-invalid={form.formState.errors.name !== undefined}
            {...form.register("name")}
          />
          <FieldError errors={[form.formState.errors.name]} />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={isPending} aria-busy={isPending}>
        {isPending ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
