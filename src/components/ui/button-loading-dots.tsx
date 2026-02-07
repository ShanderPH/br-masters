"use client";

import { motion } from "framer-motion";

interface ButtonLoadingDotsProps {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "accent" | "current";
  className?: string;
}

const sizeMap = {
  sm: { dot: "h-1.5 w-1.5", gap: "gap-1" },
  md: { dot: "h-2 w-2", gap: "gap-1.5" },
  lg: { dot: "h-2.5 w-2.5", gap: "gap-2" },
};

const colorMap = {
  primary: "bg-brm-primary",
  secondary: "bg-brm-secondary",
  accent: "bg-brm-accent",
  current: "bg-current",
};

export function ButtonLoadingDots({
  size = "md",
  color = "current",
  className = "",
}: ButtonLoadingDotsProps) {
  const { dot, gap } = sizeMap[size];
  const colorClass = colorMap[color];

  return (
    <div className={`flex items-center justify-center ${gap} ${className}`}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`${dot} ${colorClass}`}
          style={{ clipPath: "polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)" }}
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            ease: "easeInOut",
            repeat: Infinity,
            delay: index * 0.2,
          }}
        />
      ))}
    </div>
  );
}
