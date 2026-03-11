export interface MatchTournament {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  format: string;
  has_rounds: boolean;
  sofascore_id: number | null;
}

export interface MatchSeason {
  id: string;
  tournament_id: string;
  year: string | null;
  is_current: boolean;
  current_round_number: number | null;
  sofascore_season_id: number | null;
}

export interface MatchData {
  id: string;
  slug: string;
  tournament_id: string;
  season_id: string;
  home_team_id: string;
  away_team_id: string;
  round_number: number | null;
  round_name: string | null;
  start_time: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  tournament_name: string;
  tournament_logo: string | null;
  home_team_name: string;
  home_team_code: string | null;
  home_team_logo: string | null;
  away_team_name: string;
  away_team_code: string | null;
  away_team_logo: string | null;
  venue_name?: string | null;
  venue_city?: string | null;
  predictions_count?: number;
  total_predictions?: number;
  exact_scores?: number;
  correct_results?: number;
  accuracy_rate?: number;
}

export interface UserPrediction {
  match_id: string;
  home_team_goals: number;
  away_team_goals: number;
  points_earned?: number;
  is_exact_score?: boolean;
  is_correct_result?: boolean;
}

export interface PredictionMap {
  [matchId: string]: {
    homeScore: number;
    awayScore: number;
    pointsEarned?: number;
    isExactScore?: boolean;
    isCorrectResult?: boolean;
  };
}

export interface RoundGroup {
  roundNumber: number | null;
  roundName: string | null;
  matches: MatchData[];
}

export interface StatusGroup {
  status: "upcoming" | "finished";
  label: string;
  matches: MatchData[];
}

export interface KPIStats {
  totalMatches: number;
  remainingMatches: number;
  predictionsMade: number;
  roundPoints: number;
  accuracyRate: number;
  currentRank: number;
  exactScores: number;
  correctResults: number;
}

export type MatchFilter = "all" | "pending" | "predicted";
