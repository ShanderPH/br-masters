import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ClassificacaoClient } from "./classificacao-client";

export default async function ClassificacaoPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  type UserRowT = { id: string; firebase_id: string | null; role: string };
  type ProfileT = { first_name: string; last_name: string | null; total_points: number; level: number; xp: number };
  type TournamentRow = {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    format: string | null;
    sofascore_id: number | null;
  };
  type SeasonRow = { id: string; tournament_id: string; is_current: boolean; sofascore_season_id: number | null };

  const [
    userRowResult,
    profileResult,
    tournamentsResult,
    seasonsResult,
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, firebase_id, role")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_profiles")
      .select("first_name, last_name, total_points, level, xp")
      .eq("id", user.id)
      .single(),
    supabase
      .from("tournaments")
      .select("id, name, slug, logo_url, format, sofascore_id")
      .order("display_order", { ascending: true }),
    supabase
      .from("tournament_seasons")
      .select("id, tournament_id, is_current, sofascore_season_id")
      .eq("is_current", true),
  ]);

  const userRow = userRowResult.data;
  const profile = profileResult.data;

  if (!userRow || !profile) {
    redirect("/login");
  }

  const ur = userRow as UserRowT;
  const pr = profile as ProfileT;
  const tournamentsList = (tournamentsResult.data as TournamentRow[] | null) || [];
  const seasonsList = (seasonsResult.data as SeasonRow[] | null) || [];
  const seasonMap = new Map(seasonsList.map((s) => [s.tournament_id, s]));

  const formattedTournaments = tournamentsList.map((t) => {
    const season = seasonMap.get(t.id);
    return {
      id: t.id,
      name: t.name,
      fullName: t.name,
      logo: t.logo_url || "/images/brasileirao-logo.svg",
      seasonId: season?.id || null,
      sofascoreTournamentId: t.sofascore_id || null,
      sofascoreSeasonId: season?.sofascore_season_id || null,
      format: t.format || "league",
      hasRounds: true,
      hasGroups: false,
    };
  });

  const userName = `${pr.first_name}${pr.last_name ? ` ${pr.last_name}` : ""}`;

  const userData = {
    id: ur.firebase_id || user.id,
    name: userName || "Jogador",
    points: pr.total_points || 0,
    level: pr.level || 1,
    xp: pr.xp || 0,
    role: (ur.role || "user") as "user" | "admin",
  };

  return (
    <ClassificacaoClient
      user={userData}
      tournaments={formattedTournaments}
    />
  );
}
