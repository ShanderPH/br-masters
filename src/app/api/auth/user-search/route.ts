import { NextRequest, NextResponse } from "next/server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

type UserRow = Pick<
  Database["public"]["Tables"]["users"]["Row"],
  "id" | "firebase_id" | "username" | "favorite_team_id"
>;

type ProfileRow = Pick<
  Database["public"]["Tables"]["user_profiles"]["Row"],
  "id" | "first_name" | "last_name" | "avatar_url" | "email"
>;

type TeamRow = Pick<Database["public"]["Tables"]["teams"]["Row"], "id" | "logo_url">;

interface UserSuggestion {
  id: string;
  firebase_id: string;
  name: string;
  favorite_team_logo: string | null;
  avatar_url: string | null;
}

const MAX_RESULTS = 8;

function getScore(term: string, user: UserRow, displayName: string): number {
  const normalizedTerm = term.toLowerCase();
  const firebaseId = (user.firebase_id || "").toLowerCase();
  const username = user.username.toLowerCase();
  const name = displayName.toLowerCase();

  let score = 0;

  if (firebaseId === normalizedTerm) score += 100;
  if (firebaseId.startsWith(normalizedTerm)) score += 80;
  if (name === normalizedTerm) score += 70;
  if (name.startsWith(normalizedTerm)) score += 60;
  if (username.startsWith(normalizedTerm)) score += 50;
  if (name.includes(normalizedTerm)) score += 40;
  if (username.includes(normalizedTerm)) score += 30;

  return score;
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const shouldSearch = query.length >= 2 || /^\d+$/.test(query);

  if (!shouldSearch) {
    return NextResponse.json({ data: [] as UserSuggestion[] });
  }

  const db = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createServiceClient()
    : await createClient();

  try {
    const [usersByFirebase, usersByUsername, profilesByFirstName, profilesByLastName] =
      await Promise.all([
        db
          .from("users")
          .select("id, firebase_id, username, favorite_team_id")
          .ilike("firebase_id", `%${query}%`)
          .limit(MAX_RESULTS),
        db
          .from("users")
          .select("id, firebase_id, username, favorite_team_id")
          .ilike("username", `%${query}%`)
          .limit(MAX_RESULTS),
        db
          .from("user_profiles")
          .select("id, first_name, last_name, avatar_url, email")
          .ilike("first_name", `%${query}%`)
          .limit(MAX_RESULTS),
        db
          .from("user_profiles")
          .select("id, first_name, last_name, avatar_url, email")
          .ilike("last_name", `%${query}%`)
          .limit(MAX_RESULTS),
      ]);

    if (
      usersByFirebase.error ||
      usersByUsername.error ||
      profilesByFirstName.error ||
      profilesByLastName.error
    ) {
      return NextResponse.json(
        { error: "Falha ao buscar usuários" },
        { status: 500 }
      );
    }

    const candidateIds = new Set<string>();

    (usersByFirebase.data as UserRow[] | null)?.forEach((user) => {
      candidateIds.add(user.id);
    });

    (usersByUsername.data as UserRow[] | null)?.forEach((user) => {
      candidateIds.add(user.id);
    });

    (profilesByFirstName.data as ProfileRow[] | null)?.forEach((profile) => {
      candidateIds.add(profile.id);
    });

    (profilesByLastName.data as ProfileRow[] | null)?.forEach((profile) => {
      candidateIds.add(profile.id);
    });

    if (candidateIds.size === 0) {
      return NextResponse.json({ data: [] as UserSuggestion[] });
    }

    const ids = Array.from(candidateIds);

    const [usersResult, profilesResult] = await Promise.all([
      db
        .from("users")
        .select("id, firebase_id, username, favorite_team_id")
        .in("id", ids),
      db
        .from("user_profiles")
        .select("id, first_name, last_name, avatar_url, email")
        .in("id", ids),
    ]);

    if (usersResult.error || profilesResult.error) {
      return NextResponse.json(
        { error: "Falha ao buscar usuários" },
        { status: 500 }
      );
    }

    const users = (usersResult.data as UserRow[] | null) ?? [];
    const profiles = (profilesResult.data as ProfileRow[] | null) ?? [];

    const teamIds = users
      .map((user) => user.favorite_team_id)
      .filter((teamId): teamId is string => !!teamId);

    let teamMap = new Map<string, string | null>();

    if (teamIds.length > 0) {
      const { data: teamsData, error: teamsError } = await db
        .from("teams")
        .select("id, logo_url")
        .in("id", teamIds);

      if (teamsError) {
        return NextResponse.json(
          { error: "Falha ao buscar usuários" },
          { status: 500 }
        );
      }

      const teams = (teamsData as TeamRow[] | null) ?? [];
      teamMap = new Map(teams.map((team) => [team.id, team.logo_url]));
    }

    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

    const suggestions = users
      .map((user) => {
        const profile = profileMap.get(user.id);
        if (!profile) return null;

        const fullName = `${profile.first_name}${
          profile.last_name ? ` ${profile.last_name}` : ""
        }`.trim();

        return {
          id: user.id,
          firebase_id: user.firebase_id || "",
          name: fullName || user.username,
          favorite_team_logo: user.favorite_team_id
            ? teamMap.get(user.favorite_team_id) ?? null
            : null,
          avatar_url: profile.avatar_url,
          score: getScore(query, user, fullName || user.username),
        };
      })
      .filter((suggestion): suggestion is UserSuggestion & { score: number } => !!suggestion)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_RESULTS)
      .map((entry) => ({
        id: entry.id,
        firebase_id: entry.firebase_id,
        name: entry.name,
        favorite_team_logo: entry.favorite_team_logo,
        avatar_url: entry.avatar_url,
      }));

    return NextResponse.json({ data: suggestions });
  } catch {
    return NextResponse.json(
      { error: "Falha ao buscar usuários" },
      { status: 500 }
    );
  }
}
