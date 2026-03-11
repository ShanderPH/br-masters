/**
 * BR Masters - Application-level types
 * Re-exports from database.types.ts (the new refactored schema)
 * and provides compatibility aliases used across the codebase
 */

export type {
  Json,
  Database,
  MatchStatus,
  PredictionWinner,
  LeagueMemberRole,
  AchievementCategory,
  AchievementRarity,
  NotificationType,
  PrizePoolStatus,
  TransactionType,
  TransactionStatus,
  TournamentFormat,
  TournamentSeasonStatus,
} from "./database.types";

export type {
  Country,
  Venue,
  Manager,
  Team,
  Player,
  Tournament,
  TournamentSeason,
  Match,
  User,
  UserProfile,
  Prediction,
  PointsHistory,
  League,
  LeagueMember,
  Achievement,
  UserAchievement,
  Notification,
  PrizePool,
  Transaction,
  AuditLog,
  GlobalRanking,
  UpcomingMatch,
  RecentResult,
  UserStats,
  ActiveTournament,
  LeagueRanking,
  TournamentStanding,
  UserPredictionDetailed,
  MatchPredictionDistribution,
  SystemStatistics,
  MatchWithTeams,
  PredictionWithMatch,
  UserWithProfile,
  LeagueWithMembers,
} from "./database.types";

export type UserRole = "user" | "admin";

export interface EnrichedMatch {
  id: string;
  tournament_id: string;
  season_id: string;
  home_team_id: string;
  away_team_id: string;
  slug: string;
  round_number: number | null;
  round_name: string | null;
  start_time: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  sofascore_id?: number | null;
  tournament_name: string;
  home_team_name: string;
  home_team_short_name: string | null;
  home_team_logo: string | null;
  away_team_name: string;
  away_team_short_name: string | null;
  away_team_logo: string | null;
}
