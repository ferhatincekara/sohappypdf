export const HOW_IT_WORKS_STEP_IDS = ["upload", "convert", "download"] as const;

export type HowItWorksStepId = (typeof HOW_IT_WORKS_STEP_IDS)[number];
