export const easeOutExpo: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const viewportOnce = {
  once: true,
  amount: 0.25,
  margin: "0px 0px -80px 0px",
} as const;

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeOutExpo },
  },
};

export const stagger = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.09, delayChildren: 0.06 },
  },
};
