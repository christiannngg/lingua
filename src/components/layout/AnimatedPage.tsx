"use client";

import { motion } from "framer-motion";

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
};

export const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function AnimatedPage({ children, className }: Props) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function AnimatedSection({ children, className, variant = "fadeUp" }: {
  children: React.ReactNode;
  className?: string;
  variant?: "fadeUp" | "fadeIn";
}) {
  return (
    <motion.div variants={variant === "fadeUp" ? fadeUp : fadeIn} className={className}>
      {children}
    </motion.div>
  );
}