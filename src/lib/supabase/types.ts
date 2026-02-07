/**
 * Complete Supabase Database Types
 * Based on the legacy house-of-guess schema
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      matches: {
        Row: {
          id: number;
          round_number: number;
          home_team_id: number;
          home_team_name: string;
          home_team_short_name: string | null;
          home_team_logo: string | null;
          home_team_colors: Json | null;
          away_team_id: number;
          away_team_name: string;
          away_team_short_name: string | null;
          away_team_logo: string | null;
          away_team_colors: Json | null;
          slug: string;
          start_time: string;
          start_timestamp: number;
          status: string;
          status_code: number;
          status_description: string | null;
          home_score: number;
          away_score: number;
          live_score_home: number | null;
          live_score_away: number | null;
          live_score_minute: number | null;
          live_score_period: string | null;
          tournament_id: number;
          tournament_name: string;
          tournament_slug: string | null;
          league_id: number | null;
          league_name: string | null;
          league_country: string | null;
          cached: boolean;
          last_updated: string;
          source: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: number;
          round_number: number;
          home_team_id: number;
          home_team_name: string;
          home_team_short_name?: string | null;
          home_team_logo?: string | null;
          home_team_colors?: Json | null;
          away_team_id: number;
          away_team_name: string;
          away_team_short_name?: string | null;
          away_team_logo?: string | null;
          away_team_colors?: Json | null;
          slug: string;
          start_time: string;
          start_timestamp: number;
          status: string;
          status_code: number;
          status_description?: string | null;
          home_score?: number;
          away_score?: number;
          live_score_home?: number | null;
          live_score_away?: number | null;
          live_score_minute?: number | null;
          live_score_period?: string | null;
          tournament_id: number;
          tournament_name: string;
          tournament_slug?: string | null;
          league_id?: number | null;
          league_name?: string | null;
          league_country?: string | null;
          cached?: boolean;
          last_updated?: string;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          round_number?: number;
          home_team_id?: number;
          home_team_name?: string;
          home_team_short_name?: string | null;
          home_team_logo?: string | null;
          home_team_colors?: Json | null;
          away_team_id?: number;
          away_team_name?: string;
          away_team_short_name?: string | null;
          away_team_logo?: string | null;
          away_team_colors?: Json | null;
          slug?: string;
          start_time?: string;
          start_timestamp?: number;
          status?: string;
          status_code?: number;
          status_description?: string | null;
          home_score?: number;
          away_score?: number;
          live_score_home?: number | null;
          live_score_away?: number | null;
          live_score_minute?: number | null;
          live_score_period?: string | null;
          tournament_id?: number;
          tournament_name?: string;
          tournament_slug?: string | null;
          league_id?: number | null;
          league_name?: string | null;
          league_country?: string | null;
          cached?: boolean;
          last_updated?: string;
          source?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      predictions: {
        Row: {
          id: string;
          user_id: string;
          match_id: number;
          home_team_goals: number;
          away_team_goals: number;
          winner_team: string;
          predicted_at: string;
          updated_at: string;
          locked: boolean | null;
          prediction_set_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          match_id: number;
          home_team_goals: number;
          away_team_goals: number;
          winner_team: string;
          predicted_at?: string;
          updated_at?: string;
          locked?: boolean | null;
          prediction_set_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          match_id?: number;
          home_team_goals?: number;
          away_team_goals?: number;
          winner_team?: string;
          predicted_at?: string;
          updated_at?: string;
          locked?: boolean | null;
          prediction_set_id?: string | null;
        };
        Relationships: [];
      };
      users_profiles: {
        Row: {
          id: string;
          firebase_id: string;
          name: string;
          email: string | null;
          role: string | null;
          points: number | null;
          predictions_count: number | null;
          xp: number | null;
          level: number | null;
          favorite_team_id: number | null;
          favorite_team_name: string | null;
          favorite_team_logo: string | null;
          avatar: string | null;
          notifications_enabled: boolean | null;
          public_profile: boolean | null;
          pending_payments: number | null;
          total_approved_payments: number | null;
          approved_count: number | null;
          pending_count: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          firebase_id: string;
          name: string;
          email?: string | null;
          role?: string | null;
          points?: number | null;
          predictions_count?: number | null;
          xp?: number | null;
          level?: number | null;
          favorite_team_id?: number | null;
          favorite_team_name?: string | null;
          favorite_team_logo?: string | null;
          avatar?: string | null;
          notifications_enabled?: boolean | null;
          public_profile?: boolean | null;
          pending_payments?: number | null;
          total_approved_payments?: number | null;
          approved_count?: number | null;
          pending_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          firebase_id?: string;
          name?: string;
          email?: string | null;
          role?: string | null;
          points?: number | null;
          predictions_count?: number | null;
          xp?: number | null;
          level?: number | null;
          favorite_team_id?: number | null;
          favorite_team_name?: string | null;
          favorite_team_logo?: string | null;
          avatar?: string | null;
          notifications_enabled?: boolean | null;
          public_profile?: boolean | null;
          pending_payments?: number | null;
          total_approved_payments?: number | null;
          approved_count?: number | null;
          pending_count?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      current_round: {
        Row: {
          id: string;
          round_number: number;
          name: string;
          start_date: string | null;
          end_date: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          round_number: number;
          name: string;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          round_number?: number;
          name?: string;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: number;
          sofascore_id: string | null;
          name: string;
          short_name: string | null;
          name_code: string | null;
          slug: string | null;
          logo_url: string | null;
          country_name: string | null;
          country_alpha2: string | null;
          country_alpha3: string | null;
          tournament_id: number | null;
          tournament_name: string | null;
          created_at: string;
          updated_at: string;
          last_sync_at: string | null;
        };
        Insert: {
          id: number;
          sofascore_id?: string | null;
          name: string;
          short_name?: string | null;
          name_code?: string | null;
          slug?: string | null;
          logo_url?: string | null;
          country_name?: string | null;
          country_alpha2?: string | null;
          country_alpha3?: string | null;
          tournament_id?: number | null;
          tournament_name?: string | null;
          created_at?: string;
          updated_at?: string;
          last_sync_at?: string | null;
        };
        Update: {
          id?: number;
          sofascore_id?: string | null;
          name?: string;
          short_name?: string | null;
          name_code?: string | null;
          slug?: string | null;
          logo_url?: string | null;
          country_name?: string | null;
          country_alpha2?: string | null;
          country_alpha3?: string | null;
          tournament_id?: number | null;
          tournament_name?: string | null;
          created_at?: string;
          updated_at?: string;
          last_sync_at?: string | null;
        };
        Relationships: [];
      };
      user_tournament_points: {
        Row: {
          id: string;
          user_id: string;
          tournament_id: number;
          points: number;
          predictions_count: number;
          exact_scores: number;
          correct_results: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tournament_id: number;
          points?: number;
          predictions_count?: number;
          exact_scores?: number;
          correct_results?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tournament_id?: number;
          points?: number;
          predictions_count?: number;
          exact_scores?: number;
          correct_results?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      prize_pool: {
        Row: {
          id: number;
          total: number;
          total_pending: number;
          total_approved: number;
          participants: number;
          currency: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          total?: number;
          total_pending?: number;
          total_approved?: number;
          participants?: number;
          currency?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          total?: number;
          total_pending?: number;
          total_approved?: number;
          participants?: number;
          currency?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Utility types for easier access
export type UserProfile = Database["public"]["Tables"]["users_profiles"]["Row"];
export type Match = Database["public"]["Tables"]["matches"]["Row"];
export type Prediction = Database["public"]["Tables"]["predictions"]["Row"];
export type Team = Database["public"]["Tables"]["teams"]["Row"];
export type CurrentRound = Database["public"]["Tables"]["current_round"]["Row"];
export type UserTournamentPoints = Database["public"]["Tables"]["user_tournament_points"]["Row"];
export type PrizePool = Database["public"]["Tables"]["prize_pool"]["Row"];

// Helper type for user role
export type UserRole = "user" | "admin";
