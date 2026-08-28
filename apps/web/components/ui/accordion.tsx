"use client";

import { ChevronDownIcon } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  type ComponentProps,
  createContext,
  type ReactNode,
  useContext,
  useId,
  useState,
} from "react";
import { cn } from "@/lib/utils";

const ACCORDION_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

type AccordionContextValue = {
  openValue: string | undefined;
  setOpenValue: (value: string | undefined) => void;
};

type AccordionItemContextValue = {
  value: string;
  panelId: string;
};

const AccordionContext = createContext<AccordionContextValue | null>(null);
const AccordionItemContext = createContext<AccordionItemContextValue | null>(
  null,
);

function Accordion({
  className,
  defaultValue,
  children,
  ...props
}: ComponentProps<"div"> & {
  defaultValue?: string;
}) {
  const [openValue, setOpenValue] = useState<string | undefined>(defaultValue);

  return (
    <AccordionContext.Provider value={{ openValue, setOpenValue }}>
      <div data-slot="accordion" className={cn(className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

function AccordionItem({
  className,
  value,
  children,
  ...props
}: ComponentProps<"div"> & {
  value: string;
}) {
  const panelId = useId();

  return (
    <AccordionItemContext.Provider value={{ value, panelId }}>
      <div
        data-slot="accordion-item"
        className={cn("border-b border-border last:border-b-0", className)}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: ComponentProps<"button">) {
  const accordion = useContext(AccordionContext);
  const item = useContext(AccordionItemContext);
  const reduceMotion = useReducedMotion();

  if (accordion === null || item === null) {
    throw new Error("AccordionTrigger must be used within AccordionItem");
  }

  const isOpen = accordion.openValue === item.value;

  return (
    <h3>
      <button
        type="button"
        data-slot="accordion-trigger"
        aria-expanded={isOpen}
        aria-controls={item.panelId}
        className={cn(
          "flex w-full items-center justify-between gap-4 py-5 text-left text-base font-bold outline-none transition-opacity hover:opacity-80",
          className,
        )}
        onClick={() => {
          accordion.setOpenValue(isOpen ? undefined : item.value);
        }}
        {...props}
      >
        {children}
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{
            duration: reduceMotion === true ? 0 : 0.28,
            ease: ACCORDION_EASE,
          }}
          className="inline-flex shrink-0"
        >
          <ChevronDownIcon className="size-5" />
        </motion.span>
      </button>
    </h3>
  );
}

function AccordionPanel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  const accordion = useContext(AccordionContext);
  const item = useContext(AccordionItemContext);
  const reduceMotion = useReducedMotion();

  if (accordion === null || item === null) {
    throw new Error("AccordionPanel must be used within AccordionItem");
  }

  const isOpen = accordion.openValue === item.value;
  const duration = reduceMotion === true ? 0 : 0.32;

  return (
    <AnimatePresence initial={false}>
      {isOpen ? (
        <motion.div
          id={item.panelId}
          data-slot="accordion-panel"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration, ease: ACCORDION_EASE }}
          className="overflow-hidden"
        >
          <div
            className={cn(
              "pb-5 text-sm leading-relaxed text-muted-foreground",
              className,
            )}
          >
            {children}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export { Accordion, AccordionItem, AccordionPanel, AccordionTrigger };
