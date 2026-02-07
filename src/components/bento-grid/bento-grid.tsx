"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type ColorTheme = "purple" | "blue" | "pink" | "lime" | "teal" | "gold" | "default";

interface TileWrapperProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  bgImage?: string;
  colorTheme?: ColorTheme;
  onClick?: () => void;
  delay?: number;
}

interface BentoGridProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "compact" | "full-height";
}

const getGradient = (colorTheme: ColorTheme) => {
  switch (colorTheme) {
    case "blue":
      return "from-cyan-900/80 to-blue-900/80 border-l-ea-teal";
    case "pink":
      return "from-purple-900/80 to-pink-900/80 border-l-brm-accent";
    case "lime":
      return "from-green-900/80 to-lime-900/80 border-l-brm-secondary";
    case "teal":
      return "from-teal-900/80 to-cyan-900/80 border-l-ea-teal";
    case "purple":
      return "from-purple-900/80 to-indigo-900/80 border-l-brm-purple";
    case "gold":
      return "from-amber-900/80 to-yellow-900/80 border-l-yellow-500";
    default:
      return "from-slate-900/80 to-purple-900/80 border-l-white/20";
  }
};

const getBorderColor = (colorTheme: ColorTheme) => {
  switch (colorTheme) {
    case "blue":
      return "border-l-ea-teal";
    case "pink":
      return "border-l-brm-accent";
    case "lime":
      return "border-l-brm-secondary";
    case "teal":
      return "border-l-ea-teal";
    case "purple":
      return "border-l-brm-purple";
    case "gold":
      return "border-l-yellow-500";
    default:
      return "border-l-white/20";
  }
};

export function BentoTileWrapper({
  children,
  className = "",
  title,
  subtitle,
  bgImage,
  colorTheme = "default",
  onClick,
  delay = 0,
}: TileWrapperProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ scale: onClick ? 1.02 : 1 }}
      whileTap={{ scale: onClick ? 0.98 : 1 }}
      onClick={onClick}
      className={`
        relative group overflow-hidden
        bg-brm-card/90 dark:bg-slate-900/90 backdrop-blur-sm
        border-l-4 hover:border-l-8 transition-all duration-500
        shadow-xl
        rounded-none
        ${onClick ? "cursor-pointer" : ""}
        ${getBorderColor(colorTheme)}
        ${className}
      `}
    >
      {bgImage && (
        <div className="absolute inset-0 z-0 opacity-70 group-hover:scale-105 transition-transform duration-700 ease-out">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            src={bgImage}
          />
          <div className="absolute inset-0 bg-linear-to-t from-brm-background-dark dark:from-slate-900 via-brm-background-dark/50 dark:via-slate-900/50 to-transparent" />
        </div>
      )}

      <div
        className={`
          absolute inset-0 bg-linear-to-br z-0
          ${bgImage ? "opacity-30" : "opacity-60"}
          ${getGradient(colorTheme).replace("border-l-", "")}
        `}
      />

      <div className="relative z-10 w-full h-full flex flex-col p-4 md:p-5 min-h-0 overflow-hidden">
        {title && (
          <div className="mb-2 md:mb-3 shrink-0">
            <h2 className="font-display font-black text-lg md:text-2xl uppercase italic leading-none drop-shadow-md text-brm-text-primary dark:text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="font-sans font-medium text-brm-text-secondary dark:text-gray-300 text-xs md:text-sm mt-1 uppercase tracking-wider line-clamp-1">
                {subtitle}
              </p>
            )}
          </div>
        )}
        <div className="flex-1 relative min-h-0 overflow-hidden">{children}</div>
      </div>

      <div
        className={`
          absolute top-0 -left-full w-1/2 h-full
          bg-linear-to-r from-transparent via-white/10 to-transparent
          -skew-x-20 group-hover:left-[150%] transition-all duration-700
          pointer-events-none
        `}
      />
    </motion.div>
  );
}

export function BentoGrid({ children, className, variant = "default" }: BentoGridProps) {
  return (
    <div
      className={`
        w-full max-w-[1600px] mx-auto
        grid gap-2 sm:gap-3 md:gap-4
        grid-cols-1
        min-[501px]:grid-cols-2
        sm:grid-cols-2
        lg:grid-cols-4
        auto-rows-[minmax(140px,auto)]
        lg:auto-rows-[minmax(160px,1fr)]
        ${variant === "full-height" ? "min-h-[calc(100vh-12rem)]" : ""}
        ${variant === "compact" ? "gap-1.5 sm:gap-2" : ""}
        ${className || ""}
      `}
    >
      {children}
    </div>
  );
}

export function FeatureTile({ children, className, ...props }: TileWrapperProps) {
  return (
    <BentoTileWrapper
      className={`
        col-span-1
        min-[501px]:col-span-2 min-[501px]:row-span-2
        lg:col-span-2 lg:row-span-2
        min-h-[200px] min-[501px]:min-h-[280px] md:min-h-[320px]
        ${className || ""}
      `}
      {...props}
    >
      {children}
    </BentoTileWrapper>
  );
}

export function VerticalTile({ children, className, ...props }: TileWrapperProps) {
  return (
    <BentoTileWrapper
      className={`
        col-span-1
        min-[501px]:col-span-1 min-[501px]:row-span-2
        min-h-[280px] max-h-[400px] min-[501px]:min-h-[320px] min-[501px]:max-h-[450px]
        lg:max-h-[500px]
        overflow-hidden
        ${className || ""}
      `}
      {...props}
    >
      {children}
    </BentoTileWrapper>
  );
}

export function WideTile({ children, className, ...props }: TileWrapperProps) {
  return (
    <BentoTileWrapper
      className={`
        col-span-1
        min-[501px]:col-span-2
        min-h-[120px] min-[501px]:min-h-[140px] md:min-h-[160px]
        ${className || ""}
      `}
      {...props}
    >
      {children}
    </BentoTileWrapper>
  );
}

export function StandardTile({ children, className, ...props }: TileWrapperProps) {
  return (
    <BentoTileWrapper
      className={`
        col-span-1
        min-h-[140px] min-[501px]:min-h-[160px] md:min-h-[180px]
        ${className || ""}
      `}
      {...props}
    >
      {children}
    </BentoTileWrapper>
  );
}

