"use client";

import { motion } from "framer-motion";
import Image from "next/image";

interface BRMLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  animated?: boolean;
  showText?: boolean;
  className?: string;
  variant?: "full" | "icon";
}

const sizeMap = {
  sm: { width: 120, height: 32, iconSize: 32 },
  md: { width: 160, height: 42, iconSize: 42 },
  lg: { width: 200, height: 52, iconSize: 52 },
  xl: { width: 280, height: 72, iconSize: 72 },
};

export function BRMLogo({
  size = "md",
  animated = true,
  showText = true,
  className = "",
  variant = "full",
}: BRMLogoProps) {
  const { width, height, iconSize } = sizeMap[size];

  const logoContent = (
    <div className={`flex items-center gap-3 ${className}`}>
      {variant === "full" && showText ? (
        <div className="relative">
          <Image
            src="/images/brmasters.svg"
            alt="BR Masters"
            width={width}
            height={height}
            className="object-contain"
            priority
          />
          {animated && (
            <div className="absolute inset-0 opacity-30 blur-xl animate-glow-pulse">
              <Image
                src="/images/brmasters.svg"
                alt=""
                width={width}
                height={height}
                className="object-contain"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="relative">
          <Image
            src="/images/brm-icon.svg"
            alt="BR Masters"
            width={iconSize}
            height={iconSize}
            className="object-contain"
            priority
          />
          {animated && (
            <div className="absolute inset-0 opacity-30 blur-xl animate-glow-pulse">
              <Image
                src="/images/brm-icon.svg"
                alt=""
                width={iconSize}
                height={iconSize}
                className="object-contain"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {logoContent}
      </motion.div>
    );
  }

  return logoContent;
}
