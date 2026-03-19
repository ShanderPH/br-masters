import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  type UserRowT = {
    id: string;
    firebase_id: string | null;
    username: string;
    role: string;
    favorite_team_id: string | null;
  };
  type ProfileT = {
    first_name: string;
    last_name: string | null;
    email: string | null;
    avatar_url: string | null;
    total_points: number;
    level: number;
    xp: number;
  };

  const [
    userRowResult,
    profileResult,
    { count: totalPredictions },
    { data: scoredPredictions },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("id, firebase_id, username, role, favorite_team_id")
      .eq("id", user.id)
      .single(),
    supabase
      .from("user_profiles")
      .select("first_name, last_name, email, avatar_url, total_points, level, xp")
      .eq("id", user.id)
      .single(),
    supabase
      .from("predictions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("predictions")
      .select("points_earned, is_correct, is_exact")
      .eq("user_id", user.id)
      .not("points_earned", "is", null),
  ]);

  const userRow = userRowResult.data;
  const profile = profileResult.data;

  if (!userRow || !profile) {
    redirect("/login");
  }

  const ur = userRow as UserRowT;
  const pr = profile as ProfileT;

  let favoriteTeamName: string | null = null;
  let favoriteTeamLogo: string | null = null;
  if (ur.favorite_team_id) {
    const { data: team } = await supabase
      .from("teams")
      .select("name, logo_url")
      .eq("id", ur.favorite_team_id)
      .single();
    type TeamRow = { name: string; logo_url: string | null };
    const t = team as TeamRow | null;
    favoriteTeamName = t?.name ?? null;
    favoriteTeamLogo = t?.logo_url ?? null;
  }

  type ScoredPred = { points_earned: number | null; is_correct: boolean | null; is_exact: boolean | null };
  const scored = (scoredPredictions as ScoredPred[] | null) || [];
  const correctCount = scored.filter((p) => p.is_correct).length;
  const exactCount = scored.filter((p) => p.is_exact).length;
  const accuracy = totalPredictions && totalPredictions > 0 ? Math.round((correctCount / totalPredictions) * 100) : 0;

  return (
    <ProfileClient
      user={{
        id: ur.id,
        username: ur.username,
        firebaseId: ur.firebase_id,
        role: ur.role as "user" | "admin",
        firstName: pr.first_name,
        lastName: pr.last_name,
        email: pr.email || user.email || null,
        avatarUrl: pr.avatar_url,
        totalPoints: pr.total_points || 0,
        level: pr.level || 1,
        xp: pr.xp || 0,
        favoriteTeamName,
        favoriteTeamLogo,
      }}
      stats={{
        totalPredictions: totalPredictions ?? 0,
        correctPredictions: correctCount,
        exactScores: exactCount,
        accuracy,
      }}
    />
  );
}
