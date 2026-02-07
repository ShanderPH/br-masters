"use client";

export const XP_PER_LEVEL = 25;

interface UserLevelInfo {
  level: number;
  title: string;
  color: string;
  bgColor: string;
  xpInLevel: number;
  progressPercent: number;
}

const LEVEL_TITLES: Record<number, { title: string; color: string; bgColor: string }> = {
  1: { title: "Novato", color: "text-gray-400", bgColor: "bg-gray-600" },
  2: { title: "Iniciante", color: "text-green-400", bgColor: "bg-green-600" },
  3: { title: "Aprendiz", color: "text-blue-400", bgColor: "bg-blue-600" },
  4: { title: "Conhecedor", color: "text-purple-400", bgColor: "bg-purple-600" },
  5: { title: "Experiente", color: "text-yellow-400", bgColor: "bg-yellow-600" },
  6: { title: "Veterano", color: "text-orange-400", bgColor: "bg-orange-600" },
  7: { title: "Expert", color: "text-red-400", bgColor: "bg-red-600" },
  8: { title: "Mestre", color: "text-pink-400", bgColor: "bg-pink-600" },
  9: { title: "Grão-Mestre", color: "text-cyan-400", bgColor: "bg-cyan-600" },
  10: { title: "Lenda", color: "text-ea-lime", bgColor: "bg-ea-lime" },
};

function calculateLevelFromXP(totalXP: number): number {
  return Math.max(1, Math.floor(totalXP / XP_PER_LEVEL) + 1);
}

function calculateXPInCurrentLevel(totalXP: number): number {
  return totalXP % XP_PER_LEVEL;
}

function calculateProgressPercent(totalXP: number): number {
  return Math.round((calculateXPInCurrentLevel(totalXP) / XP_PER_LEVEL) * 100);
}

export function getUserLevelInfo(xp: number, level?: number): UserLevelInfo {
  const calculatedLevel = level || calculateLevelFromXP(xp);
  const cappedLevel = Math.min(10, Math.max(1, calculatedLevel));
  const levelConfig = LEVEL_TITLES[cappedLevel] || LEVEL_TITLES[1];
  
  return {
    level: calculatedLevel,
    title: calculatedLevel > 10 ? `Lenda ${calculatedLevel - 9}` : levelConfig.title,
    color: levelConfig.color,
    bgColor: levelConfig.bgColor,
    xpInLevel: calculateXPInCurrentLevel(xp),
    progressPercent: calculateProgressPercent(xp),
  };
}
