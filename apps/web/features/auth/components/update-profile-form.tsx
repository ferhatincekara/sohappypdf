"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useUpdateProfile } from "../hooks/use-update-profile";

export function UpdateProfileForm({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const t = useTranslations("settings.profile");
  const { form, onSubmit, isSubmitting } = useUpdateProfile({ name, email });
  const {
    register,
    formState: { errors, isDirty },
  } = form;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FieldGroup className="gap-4">
        <Field data-invalid={errors.name !== undefined || undefined}>
          <FieldLabel htmlFor="profileName" className="font-semibold">
            {t("name")}
          </FieldLabel>
          <Input
            id="profileName"
            type="text"
            autoComplete="name"
            aria-invalid={errors.name !== undefined}
            aria-describedby={errors.name ? "profile-name-error" : undefined}
            disabled={isSubmitting}
            {...register("name")}
          />
          <FieldError id="profile-name-error" errors={[errors.name]} />
        </Field>
        <Field data-invalid={errors.email !== undefined || undefined}>
          <FieldLabel htmlFor="profileEmail" className="font-semibold">
            {t("email")}
          </FieldLabel>
          <Input
            id="profileEmail"
            type="email"
            autoComplete="email"
            aria-invalid={errors.email !== undefined}
            aria-describedby={errors.email ? "profile-email-error" : undefined}
            disabled={isSubmitting}
            {...register("email")}
          />
          <FieldError id="profile-email-error" errors={[errors.email]} />
        </Field>
      </FieldGroup>
      <Button
        type="submit"
        disabled={isSubmitting || !isDirty}
        className="w-fit"
      >
        {isSubmitting ? t("submitting") : t("submit")}
      </Button>
    </form>
  );
}
