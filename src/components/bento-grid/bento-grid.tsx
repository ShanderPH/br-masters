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
}

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

const getGradientBg = (colorTheme: ColorTheme) => {
  switch (colorTheme) {
    case "blue":
      return "from-cyan-900/60 to-blue-950/80";
    case "pink":
      return "from-purple-900/60 to-pink-950/80";
    case "lime":
      return "from-green-900/60 to-lime-950/80";
    case "teal":
      return "from-teal-900/60 to-cyan-950/80";
    case "purple":
      return "from-purple-900/60 to-indigo-950/80";
    case "gold":
      return "from-amber-900/60 to-yellow-950/80";
    default:
      return "from-slate-900/60 to-purple-950/80";
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
      whileHover={{ scale: onClick ? 1.015 : 1 }}
      whileTap={{ scale: onClick ? 0.985 : 1 }}
      onClick={onClick}
      className={`
        relative group overflow-hidden
        bg-brm-card/90 dark:bg-slate-900/90 backdrop-blur-sm
        border-l-4 hover:border-l-6 transition-all duration-500
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
          ${bgImage ? "opacity-30" : "opacity-50"}
          ${getGradientBg(colorTheme)}
        `}
      />

      <div className="relative z-10 w-full h-full flex flex-col p-3 sm:p-4 md:p-5 min-h-0 overflow-hidden">
        {title && (
          <div className="mb-2 md:mb-3 shrink-0">
            <h2 className="font-display font-black text-base sm:text-lg md:text-xl uppercase italic leading-none drop-shadow-md text-brm-text-primary dark:text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="font-sans font-medium text-brm-text-secondary dark:text-gray-300 text-[10px] sm:text-xs mt-0.5 uppercase tracking-wider line-clamp-1">
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
          bg-linear-to-r from-transparent via-white/8 to-transparent
          -skew-x-20 group-hover:left-[150%] transition-all duration-700
          pointer-events-none
        `}
      />
    </motion.div>
  );
}

export function BentoGrid({ children, className }: BentoGridProps) {
  return (
    <div
      className={`
        w-full max-w-[1600px] mx-auto
        grid gap-2 sm:gap-3 md:gap-4
        grid-cols-1
        min-[480px]:grid-cols-2
        lg:grid-cols-4
        lg:grid-rows-[auto_auto]
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
        min-[480px]:col-span-2
        lg:col-span-2 lg:row-span-2
        h-[260px] min-[480px]:h-[300px] md:h-[340px] lg:h-[420px] xl:h-[460px]
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
        min-[480px]:col-span-1 min-[480px]:row-span-2
        h-[380px] min-[480px]:h-[400px] lg:h-[420px] xl:h-[460px]
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
        min-[480px]:col-span-2
        h-[140px] min-[480px]:h-[150px] md:h-[160px]
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
        h-[160px] min-[480px]:h-[170px] md:h-[180px]
        ${className || ""}
      `}
      {...props}
    >
      {children}
    </BentoTileWrapper>
  );
}

