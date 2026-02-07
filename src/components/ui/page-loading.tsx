"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { BRMLogo } from "./brm-logo";

interface PageLoadingProps {
  isVisible?: boolean;
  message?: string;
}

const COLORS = [
  { from: "from-brm-primary", to: "to-brm-primary/60", glow: "#25B8B8" },
  { from: "from-brm-secondary", to: "to-brm-secondary/60", glow: "#CCFF00" },
  { from: "from-brm-accent", to: "to-brm-accent/60", glow: "#D63384" },
  { from: "from-brm-primary", to: "to-brm-secondary", glow: "#25B8B8" },
  { from: "from-brm-accent", to: "to-brm-primary", glow: "#D63384" },
];

export function PageLoading({ isVisible = true, message }: PageLoadingProps) {
  const [heights, setHeights] = useState([0, 0, 0, 0, 0]);

  const colors = useMemo(() => COLORS, []);

  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setHeights(() =>
        colors.map((_, index) => {
          const maxHeight = 48;
          const delay = index * 0.6;
          const time = Date.now() * 0.002;

          const primaryWave = Math.sin(time + delay);
          const bounceWave = Math.sin(time * 3 + delay) * 0.12;
          const ripple = Math.sin(time * 6 + delay) * 0.04;

          const combinedWave = primaryWave + bounceWave + ripple;

          return maxHeight * Math.abs(combinedWave);
        })
      );
    }, 24);

    return () => clearInterval(interval);
  }, [isVisible, colors]);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-brm-background"
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(26,26,46,0.8)_100%)]" />

      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brm-primary/10 blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-brm-secondary/10 blur-3xl animate-pulse delay-500" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brm-accent/5 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <BRMLogo size="lg" animated={false} showText />
        </motion.div>

        <div className="flex items-end gap-2 h-16">
          {heights.map((height, index) => (
            <div key={index} className="relative flex flex-col items-center">
              <motion.div
                className={`w-3 md:w-4 bg-linear-to-t ${colors[index].from} ${colors[index].to} relative overflow-hidden`}
                style={{
                  height: `${Math.max(height, 8)}px`,
                  clipPath: "polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)",
                  boxShadow: `0 0 16px ${colors[index].glow}40`,
                }}
                transition={{ duration: 0.1, ease: "easeOut" }}
              >
                <div className="absolute top-0 left-0 right-0 h-2 bg-linear-to-b from-white/30 to-transparent" />
                <div
                  className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent"
                  style={{ width: "120%", left: "-10%" }}
                />
              </motion.div>
            </div>
          ))}
        </div>

        {message && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-brm-text-secondary uppercase tracking-wider"
          >
            {message}
          </motion.p>
        )}
      </div>
    </motion.div>
  );
}
