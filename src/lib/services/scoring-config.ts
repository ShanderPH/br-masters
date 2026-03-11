import { createClient } from "@/lib/supabase/client";

export interface ScoringConfig {
  exact_score_points: number;
  correct_result_points: number;
  incorrect_points: number;
}

const DEFAULT_CONFIG: ScoringConfig = {
  exact_score_points: 5,
  correct_result_points: 2,
  incorrect_points: 0,
};

let cachedConfig: ScoringConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getScoringConfig(): Promise<ScoringConfig> {
  const now = Date.now();
  
  if (cachedConfig && now - cacheTimestamp < CACHE_TTL) {
    return cachedConfig;
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_scoring_config");

    if (error || !data) {
      return DEFAULT_CONFIG;
    }

    const configData = data as Record<string, number>;
    cachedConfig = {
      exact_score_points: configData.exact_score_points ?? DEFAULT_CONFIG.exact_score_points,
      correct_result_points: configData.correct_result_points ?? DEFAULT_CONFIG.correct_result_points,
      incorrect_points: configData.incorrect_points ?? DEFAULT_CONFIG.incorrect_points,
    };
    cacheTimestamp = now;

    return cachedConfig;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function getDefaultScoringConfig(): ScoringConfig {
  return DEFAULT_CONFIG;
}

export function calculatePoints(
  config: ScoringConfig,
  predHome: number,
  predAway: number,
  realHome: number,
  realAway: number
): { points: number; isExact: boolean; isCorrectResult: boolean } {
  const isExact = predHome === realHome && predAway === realAway;

  const predResult = predHome > predAway ? "home" : predHome < predAway ? "away" : "draw";
  const realResult = realHome > realAway ? "home" : realHome < realAway ? "away" : "draw";
  const isCorrectResult = predResult === realResult;

  let points = config.incorrect_points;
  if (isExact) {
    points = config.exact_score_points;
  } else if (isCorrectResult) {
    points = config.correct_result_points;
  }

  return { points, isExact, isCorrectResult };
}

export function clearScoringConfigCache(): void {
  cachedConfig = null;
  cacheTimestamp = 0;
}
