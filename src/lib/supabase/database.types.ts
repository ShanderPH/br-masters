/**
 * BR Masters - Complete Supabase Database Types
 * Generated from the refactored schema (br_masters_schema_refactored.sql)
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
      countries: {
        Row: {
          id: string;
          name: string;
          code: string;
          flag_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          flag_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          flag_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      venues: {
        Row: {
          id: string;
          name: string;
          city: string;
          country_id: string;
          capacity: number | null;
          photo_url: string | null;
          latitude: number | null;
          longitude: number | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          city: string;
          country_id: string;
          capacity?: number | null;
          photo_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          city?: string;
          country_id?: string;
          capacity?: number | null;
          photo_url?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "venues_country_id_fkey";
            columns: ["country_id"];
            referencedRelation: "countries";
            referencedColumns: ["id"];
          }
        ];
      };
      managers: {
        Row: {
          id: string;
          name: string;
          country_id: string;
          date_of_birth: string | null;
          avatar_url: string | null;
          biography: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          country_id: string;
          date_of_birth?: string | null;
          avatar_url?: string | null;
          biography?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          country_id?: string;
          date_of_birth?: string | null;
          avatar_url?: string | null;
          biography?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "managers_country_id_fkey";
            columns: ["country_id"];
            referencedRelation: "countries";
            referencedColumns: ["id"];
          }
        ];
      };
      teams: {
        Row: {
          id: string;
          name: string;
          slug: string;
          name_code: string;
          country_id: string;
          venue_id: string | null;
          manager_id: string | null;
          logo_url: string | null;
          primary_color: string | null;
          secondary_color: string | null;
          text_color: string | null;
          founded_year: number | null;
          website_url: string | null;
          sofascore_id: number | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          name_code: string;
          country_id: string;
          venue_id?: string | null;
          manager_id?: string | null;
          logo_url?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          text_color?: string | null;
          founded_year?: number | null;
          website_url?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          name_code?: string;
          country_id?: string;
          venue_id?: string | null;
          manager_id?: string | null;
          logo_url?: string | null;
          primary_color?: string | null;
          secondary_color?: string | null;
          text_color?: string | null;
          founded_year?: number | null;
          website_url?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "teams_country_id_fkey";
            columns: ["country_id"];
            referencedRelation: "countries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_venue_id_fkey";
            columns: ["venue_id"];
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "teams_manager_id_fkey";
            columns: ["manager_id"];
            referencedRelation: "managers";
            referencedColumns: ["id"];
          }
        ];
      };
      players: {
        Row: {
          id: string;
          team_id: string;
          name: string;
          slug: string;
          shirt_number: number | null;
          position: string;
          height_cm: number | null;
          date_of_birth: string;
          country_id: string;
          market_value_eur: number | null;
          avatar_url: string | null;
          is_active: boolean;
          contract_end_date: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          team_id: string;
          name: string;
          slug: string;
          shirt_number?: number | null;
          position: string;
          height_cm?: number | null;
          date_of_birth: string;
          country_id: string;
          market_value_eur?: number | null;
          avatar_url?: string | null;
          is_active?: boolean;
          contract_end_date?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          team_id?: string;
          name?: string;
          slug?: string;
          shirt_number?: number | null;
          position?: string;
          height_cm?: number | null;
          date_of_birth?: string;
          country_id?: string;
          market_value_eur?: number | null;
          avatar_url?: string | null;
          is_active?: boolean;
          contract_end_date?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey";
            columns: ["team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "players_country_id_fkey";
            columns: ["country_id"];
            referencedRelation: "countries";
            referencedColumns: ["id"];
          }
        ];
      };
      tournaments: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          country_id: string | null;
          format: string;
          has_rounds: boolean;
          has_groups: boolean;
          has_playoff_series: boolean;
          is_featured: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          logo_url?: string | null;
          country_id?: string | null;
          format: string;
          has_rounds?: boolean;
          has_groups?: boolean;
          has_playoff_series?: boolean;
          is_featured?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          logo_url?: string | null;
          country_id?: string | null;
          format?: string;
          has_rounds?: boolean;
          has_groups?: boolean;
          has_playoff_series?: boolean;
          is_featured?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tournaments_country_id_fkey";
            columns: ["country_id"];
            referencedRelation: "countries";
            referencedColumns: ["id"];
          }
        ];
      };
      tournament_seasons: {
        Row: {
          id: string;
          tournament_id: string;
          year: string;
          start_date: string;
          end_date: string;
          status: string;
          is_current: boolean;
          current_phase: string | null;
          current_round_type: string | null;
          current_round_number: number | null;
          champion_team_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          year: string;
          start_date: string;
          end_date: string;
          status?: string;
          is_current?: boolean;
          current_phase?: string | null;
          current_round_type?: string | null;
          current_round_number?: number | null;
          champion_team_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          year?: string;
          start_date?: string;
          end_date?: string;
          status?: string;
          is_current?: boolean;
          current_phase?: string | null;
          current_round_type?: string | null;
          current_round_number?: number | null;
          champion_team_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tournament_seasons_tournament_id_fkey";
            columns: ["tournament_id"];
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tournament_seasons_champion_team_id_fkey";
            columns: ["champion_team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      matches: {
        Row: {
          id: string;
          tournament_id: string;
          season_id: string;
          home_team_id: string;
          away_team_id: string;
          slug: string;
          round_number: number | null;
          round_name: string | null;
          start_time: string;
          status: MatchStatus;
          home_score: number | null;
          away_score: number | null;
          stats: Json | null;
          venue_id: string | null;
          attendance: number | null;
          referee: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          season_id: string;
          home_team_id: string;
          away_team_id: string;
          slug: string;
          round_number?: number | null;
          round_name?: string | null;
          start_time: string;
          status?: MatchStatus;
          home_score?: number | null;
          away_score?: number | null;
          stats?: Json | null;
          venue_id?: string | null;
          attendance?: number | null;
          referee?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          season_id?: string;
          home_team_id?: string;
          away_team_id?: string;
          slug?: string;
          round_number?: number | null;
          round_name?: string | null;
          start_time?: string;
          status?: MatchStatus;
          home_score?: number | null;
          away_score?: number | null;
          stats?: Json | null;
          venue_id?: string | null;
          attendance?: number | null;
          referee?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matches_tournament_id_fkey";
            columns: ["tournament_id"];
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_season_id_fkey";
            columns: ["season_id"];
            referencedRelation: "tournament_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_home_team_id_fkey";
            columns: ["home_team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_away_team_id_fkey";
            columns: ["away_team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_venue_id_fkey";
            columns: ["venue_id"];
            referencedRelation: "venues";
            referencedColumns: ["id"];
          }
        ];
      };
      users: {
        Row: {
          id: string;
          username: string;
          favorite_team_id: string | null;
        };
        Insert: {
          id: string;
          username: string;
          favorite_team_id?: string | null;
        };
        Update: {
          id?: string;
          username?: string;
          favorite_team_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "users_favorite_team_id_fkey";
            columns: ["favorite_team_id"];
            referencedRelation: "teams";
            referencedColumns: ["id"];
          }
        ];
      };
      user_profiles: {
        Row: {
          id: string;
          first_name: string;
          last_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          email: string;
          phone: string | null;
          whatsapp: string | null;
          total_points: number;
          level: number;
          xp: number;
          predictions_count: number;
          correct_predictions: number;
          exact_score_predictions: number;
          is_public: boolean;
          notification_enabled: boolean;
          email_notifications: boolean;
          push_notifications: boolean;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          first_name: string;
          last_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          email: string;
          phone?: string | null;
          whatsapp?: string | null;
          total_points?: number;
          level?: number;
          xp?: number;
          predictions_count?: number;
          correct_predictions?: number;
          exact_score_predictions?: number;
          is_public?: boolean;
          notification_enabled?: boolean;
          email_notifications?: boolean;
          push_notifications?: boolean;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          first_name?: string;
          last_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          email?: string;
          phone?: string | null;
          whatsapp?: string | null;
          total_points?: number;
          level?: number;
          xp?: number;
          predictions_count?: number;
          correct_predictions?: number;
          exact_score_predictions?: number;
          is_public?: boolean;
          notification_enabled?: boolean;
          email_notifications?: boolean;
          push_notifications?: boolean;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      predictions: {
        Row: {
          id: string;
          user_id: string;
          match_id: string;
          home_team_goals: number;
          away_team_goals: number;
          winner: PredictionWinner;
          predicted_at: string;
          updated_at: string;
          locked: boolean;
          locked_at: string | null;
          is_correct_result: boolean | null;
          is_exact_score: boolean | null;
          points_earned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          match_id: string;
          home_team_goals: number;
          away_team_goals: number;
          winner: PredictionWinner;
          predicted_at?: string;
          updated_at?: string;
          locked?: boolean;
          locked_at?: string | null;
          is_correct_result?: boolean | null;
          is_exact_score?: boolean | null;
          points_earned?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          match_id?: string;
          home_team_goals?: number;
          away_team_goals?: number;
          winner?: PredictionWinner;
          predicted_at?: string;
          updated_at?: string;
          locked?: boolean;
          locked_at?: string | null;
          is_correct_result?: boolean | null;
          is_exact_score?: boolean | null;
          points_earned?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "predictions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "predictions_match_id_fkey";
            columns: ["match_id"];
            referencedRelation: "matches";
            referencedColumns: ["id"];
          }
        ];
      };
      points_history: {
        Row: {
          id: string;
          user_id: string;
          prediction_id: string | null;
          points_change: number;
          reason: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          prediction_id?: string | null;
          points_change: number;
          reason: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          prediction_id?: string | null;
          points_change?: number;
          reason?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "points_history_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "points_history_prediction_id_fkey";
            columns: ["prediction_id"];
            referencedRelation: "predictions";
            referencedColumns: ["id"];
          }
        ];
      };
      leagues: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          owner_id: string;
          is_private: boolean;
          invite_code: string | null;
          max_members: number | null;
          logo_url: string | null;
          cover_url: string | null;
          tournament_id: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          owner_id: string;
          is_private?: boolean;
          invite_code?: string | null;
          max_members?: number | null;
          logo_url?: string | null;
          cover_url?: string | null;
          tournament_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          owner_id?: string;
          is_private?: boolean;
          invite_code?: string | null;
          max_members?: number | null;
          logo_url?: string | null;
          cover_url?: string | null;
          tournament_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "leagues_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leagues_tournament_id_fkey";
            columns: ["tournament_id"];
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          }
        ];
      };
      league_members: {
        Row: {
          id: string;
          league_id: string;
          user_id: string;
          role: LeagueMemberRole;
          points: number;
          rank: number | null;
          joined_at: string;
          left_at: string | null;
        };
        Insert: {
          id?: string;
          league_id: string;
          user_id: string;
          role?: LeagueMemberRole;
          points?: number;
          rank?: number | null;
          joined_at?: string;
          left_at?: string | null;
        };
        Update: {
          id?: string;
          league_id?: string;
          user_id?: string;
          role?: LeagueMemberRole;
          points?: number;
          rank?: number | null;
          joined_at?: string;
          left_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "league_members_league_id_fkey";
            columns: ["league_id"];
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "league_members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      achievements: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string;
          icon_url: string | null;
          category: AchievementCategory;
          threshold: number | null;
          xp_reward: number;
          points_reward: number;
          rarity: AchievementRarity;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description: string;
          icon_url?: string | null;
          category: AchievementCategory;
          threshold?: number | null;
          xp_reward?: number;
          points_reward?: number;
          rarity?: AchievementRarity;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string;
          icon_url?: string | null;
          category?: AchievementCategory;
          threshold?: number | null;
          xp_reward?: number;
          points_reward?: number;
          rarity?: AchievementRarity;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
          progress: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
          progress?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          achievement_id?: string;
          unlocked_at?: string;
          progress?: number;
        };
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_achievements_achievement_id_fkey";
            columns: ["achievement_id"];
            referencedRelation: "achievements";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          action_url: string | null;
          related_match_id: string | null;
          related_league_id: string | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          action_url?: string | null;
          related_match_id?: string | null;
          related_league_id?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          title?: string;
          message?: string;
          action_url?: string | null;
          related_match_id?: string | null;
          related_league_id?: string | null;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_related_match_id_fkey";
            columns: ["related_match_id"];
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_related_league_id_fkey";
            columns: ["related_league_id"];
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          }
        ];
      };
      prize_pools: {
        Row: {
          id: string;
          tournament_id: string | null;
          season_id: string | null;
          league_id: string | null;
          total_approved: number;
          total_pending: number;
          total_distributed: number;
          participants_count: number;
          currency: string;
          status: PrizePoolStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tournament_id?: string | null;
          season_id?: string | null;
          league_id?: string | null;
          total_approved?: number;
          total_pending?: number;
          total_distributed?: number;
          participants_count?: number;
          currency?: string;
          status?: PrizePoolStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string | null;
          season_id?: string | null;
          league_id?: string | null;
          total_approved?: number;
          total_pending?: number;
          total_distributed?: number;
          participants_count?: number;
          currency?: string;
          status?: PrizePoolStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "prize_pools_tournament_id_fkey";
            columns: ["tournament_id"];
            referencedRelation: "tournaments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prize_pools_season_id_fkey";
            columns: ["season_id"];
            referencedRelation: "tournament_seasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "prize_pools_league_id_fkey";
            columns: ["league_id"];
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          }
        ];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          prize_pool_id: string | null;
          amount: number;
          currency: string;
          type: TransactionType;
          status: TransactionStatus;
          requested_at: string;
          processed_at: string | null;
          description: string | null;
          rejection_reason: string | null;
          payment_method: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          prize_pool_id?: string | null;
          amount: number;
          currency?: string;
          type: TransactionType;
          status?: TransactionStatus;
          requested_at?: string;
          processed_at?: string | null;
          description?: string | null;
          rejection_reason?: string | null;
          payment_method?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          prize_pool_id?: string | null;
          amount?: number;
          currency?: string;
          type?: TransactionType;
          status?: TransactionStatus;
          requested_at?: string;
          processed_at?: string | null;
          description?: string | null;
          rejection_reason?: string | null;
          payment_method?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_prize_pool_id_fkey";
            columns: ["prize_pool_id"];
            referencedRelation: "prize_pools";
            referencedColumns: ["id"];
          }
        ];
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          old_values: Json | null;
          new_values: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      global_ranking: {
        Row: {
          id: string;
          username: string;
          first_name: string;
          last_name: string | null;
          avatar_url: string | null;
          total_points: number;
          level: number;
          xp: number;
          predictions_count: number;
          correct_predictions: number;
          exact_score_predictions: number;
          accuracy_percentage: number;
          favorite_team_id: string | null;
          favorite_team_name: string | null;
          favorite_team_logo: string | null;
          rank: number;
        };
      };
      upcoming_matches: {
        Row: {
          id: string;
          slug: string;
          start_time: string;
          status: string;
          round_number: number | null;
          round_name: string | null;
          tournament_id: string;
          tournament_name: string;
          tournament_slug: string;
          tournament_logo: string | null;
          season_id: string;
          season_year: string;
          home_team_id: string;
          home_team_name: string;
          home_team_code: string;
          home_team_logo: string | null;
          home_team_color: string | null;
          away_team_id: string;
          away_team_name: string;
          away_team_code: string;
          away_team_logo: string | null;
          away_team_color: string | null;
          venue_name: string | null;
          venue_city: string | null;
          predictions_count: number;
          hours_until_start: number;
        };
      };
      recent_results: {
        Row: {
          id: string;
          slug: string;
          start_time: string;
          status: string;
          round_number: number | null;
          round_name: string | null;
          home_score: number | null;
          away_score: number | null;
          tournament_id: string;
          tournament_name: string;
          tournament_logo: string | null;
          home_team_id: string;
          home_team_name: string;
          home_team_code: string;
          home_team_logo: string | null;
          away_team_id: string;
          away_team_name: string;
          away_team_code: string;
          away_team_logo: string | null;
          total_predictions: number;
          exact_scores: number;
          correct_results: number;
          accuracy_rate: number;
        };
      };
      user_stats: {
        Row: {
          id: string;
          username: string;
          first_name: string;
          last_name: string | null;
          avatar_url: string | null;
          email: string | null;
          total_points: number;
          level: number;
          xp: number;
          predictions_count: number;
          correct_predictions: number;
          exact_score_predictions: number;
          accuracy: number;
          exact_score_rate: number;
          achievements_count: number;
          leagues_count: number;
          favorite_team_id: string | null;
          favorite_team_name: string | null;
          favorite_team_logo: string | null;
          is_public: boolean;
          member_since: string;
        };
      };
      active_tournaments: {
        Row: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          format: string;
          has_rounds: boolean;
          has_groups: boolean;
          is_featured: boolean;
          display_order: number;
          current_season_id: string;
          current_season_year: string;
          season_status: string;
          current_phase: string | null;
          current_round_number: number | null;
          country_name: string | null;
          country_code: string | null;
          country_flag: string | null;
          upcoming_matches: number;
          finished_matches: number;
        };
      };
      league_ranking: {
        Row: {
          league_id: string;
          league_name: string;
          league_slug: string;
          league_logo: string | null;
          is_private: boolean;
          user_id: string;
          username: string;
          first_name: string;
          last_name: string | null;
          avatar_url: string | null;
          points: number;
          role: string;
          joined_at: string;
          rank: number;
          total_members: number;
        };
      };
      tournament_standings: {
        Row: {
          season_id: string;
          season_year: string;
          tournament_id: string;
          tournament_name: string;
          tournament_slug: string;
          team_id: string;
          team_name: string;
          team_code: string;
          team_logo: string | null;
          played: number;
          wins: number;
          draws: number;
          losses: number;
          goals_for: number;
          goals_against: number;
          goal_difference: number;
          points: number;
          position: number;
        };
      };
      user_predictions_detailed: {
        Row: {
          prediction_id: string;
          user_id: string;
          match_id: string;
          predicted_home: number;
          predicted_away: number;
          predicted_winner: string;
          predicted_at: string;
          locked: boolean;
          is_correct_result: boolean | null;
          is_exact_score: boolean | null;
          points_earned: number;
          start_time: string;
          match_status: string;
          actual_home: number | null;
          actual_away: number | null;
          round_number: number | null;
          home_team_name: string;
          home_team_logo: string | null;
          away_team_name: string;
          away_team_logo: string | null;
          tournament_name: string;
          tournament_logo: string | null;
        };
      };
      match_prediction_distribution: {
        Row: {
          match_id: string;
          match_slug: string;
          home_team: string;
          away_team: string;
          home_team_goals: number;
          away_team_goals: number;
          winner: string;
          prediction_count: number;
          percentage: number;
        };
      };
      system_statistics: {
        Row: {
          total_users: number;
          public_profiles: number;
          total_predictions: number;
          finished_matches: number;
          scheduled_matches: number;
          live_matches: number;
          active_leagues: number;
          active_achievements: number;
          total_prize_pool: number;
          unread_notifications: number;
          pending_transactions: number;
        };
      };
    };
    Functions: {
      calculate_winner: {
        Args: { home_goals: number; away_goals: number };
        Returns: string;
      };
      generate_invite_code: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      match_status: MatchStatus;
      prediction_winner: PredictionWinner;
      league_member_role: LeagueMemberRole;
      achievement_category: AchievementCategory;
      achievement_rarity: AchievementRarity;
      notification_type: NotificationType;
      prize_pool_status: PrizePoolStatus;
      transaction_type: TransactionType;
      transaction_status: TransactionStatus;
    };
  };
}

// ============================================================================
// Enum Types
// ============================================================================

export type MatchStatus = "scheduled" | "live" | "finished" | "postponed" | "cancelled";
export type PredictionWinner = "home" | "away" | "draw";
export type LeagueMemberRole = "owner" | "admin" | "member";
export type AchievementCategory = "prediction" | "streak" | "social" | "special";
export type AchievementRarity = "common" | "rare" | "epic" | "legendary";
export type NotificationType =
  | "match_soon"
  | "match_started"
  | "match_finished"
  | "result_ready"
  | "achievement_unlocked"
  | "league_invite"
  | "new_member"
  | "rank_changed"
  | "reminder"
  | "system";
export type PrizePoolStatus = "active" | "closed" | "distributing" | "completed";
export type TransactionType = "deposit" | "withdrawal" | "prize" | "bonus" | "fee" | "refund";
export type TransactionStatus = "pending" | "approved" | "rejected" | "completed" | "failed" | "cancelled";
export type TournamentFormat = "league" | "knockout" | "mixed";
export type TournamentSeasonStatus = "scheduled" | "ongoing" | "finished" | "cancelled";

// ============================================================================
// Utility Types for easier access
// ============================================================================

export type Country = Database["public"]["Tables"]["countries"]["Row"];
export type Venue = Database["public"]["Tables"]["venues"]["Row"];
export type Manager = Database["public"]["Tables"]["managers"]["Row"];
export type Team = Database["public"]["Tables"]["teams"]["Row"];
export type Player = Database["public"]["Tables"]["players"]["Row"];
export type Tournament = Database["public"]["Tables"]["tournaments"]["Row"];
export type TournamentSeason = Database["public"]["Tables"]["tournament_seasons"]["Row"];
export type Match = Database["public"]["Tables"]["matches"]["Row"];
export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserProfile = Database["public"]["Tables"]["user_profiles"]["Row"];
export type Prediction = Database["public"]["Tables"]["predictions"]["Row"];
export type PointsHistory = Database["public"]["Tables"]["points_history"]["Row"];
export type League = Database["public"]["Tables"]["leagues"]["Row"];
export type LeagueMember = Database["public"]["Tables"]["league_members"]["Row"];
export type Achievement = Database["public"]["Tables"]["achievements"]["Row"];
export type UserAchievement = Database["public"]["Tables"]["user_achievements"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type PrizePool = Database["public"]["Tables"]["prize_pools"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];

// View types
export type GlobalRanking = Database["public"]["Views"]["global_ranking"]["Row"];
export type UpcomingMatch = Database["public"]["Views"]["upcoming_matches"]["Row"];
export type RecentResult = Database["public"]["Views"]["recent_results"]["Row"];
export type UserStats = Database["public"]["Views"]["user_stats"]["Row"];
export type ActiveTournament = Database["public"]["Views"]["active_tournaments"]["Row"];
export type LeagueRanking = Database["public"]["Views"]["league_ranking"]["Row"];
export type TournamentStanding = Database["public"]["Views"]["tournament_standings"]["Row"];
export type UserPredictionDetailed = Database["public"]["Views"]["user_predictions_detailed"]["Row"];
export type MatchPredictionDistribution = Database["public"]["Views"]["match_prediction_distribution"]["Row"];
export type SystemStatistics = Database["public"]["Views"]["system_statistics"]["Row"];

// Insert types
export type CountryInsert = Database["public"]["Tables"]["countries"]["Insert"];
export type VenueInsert = Database["public"]["Tables"]["venues"]["Insert"];
export type TeamInsert = Database["public"]["Tables"]["teams"]["Insert"];
export type TournamentInsert = Database["public"]["Tables"]["tournaments"]["Insert"];
export type MatchInsert = Database["public"]["Tables"]["matches"]["Insert"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserProfileInsert = Database["public"]["Tables"]["user_profiles"]["Insert"];
export type PredictionInsert = Database["public"]["Tables"]["predictions"]["Insert"];
export type LeagueInsert = Database["public"]["Tables"]["leagues"]["Insert"];
export type LeagueMemberInsert = Database["public"]["Tables"]["league_members"]["Insert"];
export type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];
export type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];

// Update types
export type CountryUpdate = Database["public"]["Tables"]["countries"]["Update"];
export type VenueUpdate = Database["public"]["Tables"]["venues"]["Update"];
export type TeamUpdate = Database["public"]["Tables"]["teams"]["Update"];
export type TournamentUpdate = Database["public"]["Tables"]["tournaments"]["Update"];
export type MatchUpdate = Database["public"]["Tables"]["matches"]["Update"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];
export type UserProfileUpdate = Database["public"]["Tables"]["user_profiles"]["Update"];
export type PredictionUpdate = Database["public"]["Tables"]["predictions"]["Update"];
export type LeagueUpdate = Database["public"]["Tables"]["leagues"]["Update"];
export type LeagueMemberUpdate = Database["public"]["Tables"]["league_members"]["Update"];
export type NotificationUpdate = Database["public"]["Tables"]["notifications"]["Update"];
export type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"];

// ============================================================================
// Match with relations (common query pattern)
// ============================================================================

export interface MatchWithTeams extends Match {
  home_team: Team;
  away_team: Team;
  tournament: Tournament;
  season: TournamentSeason;
  venue?: Venue | null;
}

export interface PredictionWithMatch extends Prediction {
  match: MatchWithTeams;
}

export interface UserWithProfile extends User {
  profile: UserProfile;
  favorite_team?: Team | null;
}

export interface LeagueWithMembers extends League {
  owner: User;
  members: LeagueMember[];
  tournament?: Tournament | null;
}
