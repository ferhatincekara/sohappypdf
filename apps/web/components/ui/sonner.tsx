"use client";

import { LoaderCircleIcon, XIcon } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { cn } from "@/lib/utils";

function ToastCheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden="true">
      <path
        d="M4.4 10.4 8.1 14.1 15.6 5.9"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ToastAlertIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden="true">
      <path
        d="M10 4.4v7.1"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="10" cy="15.2" r="1.4" fill="currentColor" />
    </svg>
  );
}

function ToastStarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.2c.4 0 .72.24.86.6l1.58 4.12c.1.26.32.47.58.56l4.28 1.18c.7.2 1 1.08.5 1.62l-3.2 3.08c-.2.2-.3.48-.26.76l.86 4.36c.14.72-.62 1.28-1.26.92L12.7 17.8a.9.9 0 0 0-.8 0l-3.82 2.2c-.64.36-1.4-.2-1.26-.92l.86-4.36c.04-.28-.06-.56-.26-.76l-3.2-3.08c-.5-.54-.2-1.42.5-1.62l4.28-1.18c.26-.09.48-.3.58-.56L11.14 2.8A.92.92 0 0 1 12 2.2Z" />
    </svg>
  );
}

function Toaster({ className, ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className={cn("toaster", className)}
      position="bottom-center"
      offset={24}
      mobileOffset={16}
      duration={4500}
      gap={12}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "rounded-full border-0 bg-background text-foreground shadow-lift",
          title: "text-base font-semibold tracking-tight",
          description: "text-sm text-muted-foreground",
        },
      }}
      icons={{
        success: <ToastCheckIcon />,
        info: <ToastStarIcon />,
        warning: <ToastAlertIcon />,
        error: <ToastAlertIcon />,
        loading: <LoaderCircleIcon className="size-5" strokeWidth={2.4} />,
        close: <XIcon className="size-4" strokeWidth={2.25} />,
      }}
      {...props}
    />
  );
}

export { Toaster };
