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

  const { data: profile } = await supabase
    .from("users_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("id, name, short_name, logo_url, status, season_id, format, has_rounds, has_groups")
    .eq("status", "active")
    .neq("name", "Copa do Brasil 2026")
    .order("display_order", { ascending: true });

  type TournamentRow = {
    id: number;
    name: string;
    short_name: string | null;
    logo_url: string | null;
    status: string;
    season_id: number | null;
    format: string | null;
    has_rounds: boolean;
    has_groups: boolean;
  };

  const tournamentsList = (tournaments as TournamentRow[] | null) || [];

  const formattedTournaments = tournamentsList.map((t) => ({
    id: t.id,
    name: t.short_name || t.name,
    fullName: t.name,
    logo: t.logo_url || "/images/brasileirao-logo.svg",
    seasonId: t.season_id,
    format: t.format || "league",
    hasRounds: t.has_rounds,
    hasGroups: t.has_groups,
  }));

  const userData = {
    id: profile.firebase_id || user.id,
    name: profile.name || "Jogador",
    points: profile.points || 0,
    level: profile.level || 1,
    role: (profile.role || "user") as "user" | "admin",
  };

  return (
    <ClassificacaoClient
      user={userData}
      tournaments={formattedTournaments}
    />
  );
}
