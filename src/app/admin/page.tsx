import { createClient } from "@/lib/supabase/server";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { count: usersCount },
    { count: matchesCount },
    { count: predictionsCount },
    { count: tournamentsCount },
    { count: teamsCount },
    { count: playersCount },
    { data: pendingPayments },
    { data: pendingDeposits },
    { data: prizePool },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from("users_profiles").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase.from("predictions").select("*", { count: "exact", head: true }),
    supabase.from("tournaments").select("*", { count: "exact", head: true }),
    supabase.from("teams").select("*", { count: "exact", head: true }),
    supabase.from("players").select("*", { count: "exact", head: true }),
    supabase
      .from("payments")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("deposits")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("prize_pool").select("*").limit(1).single(),
    supabase
      .from("users_profiles")
      .select("firebase_id, name, role, points, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    <AdminDashboardClient
      stats={{
        users: usersCount ?? 0,
        matches: matchesCount ?? 0,
        predictions: predictionsCount ?? 0,
        tournaments: tournamentsCount ?? 0,
        teams: teamsCount ?? 0,
        players: playersCount ?? 0,
        pendingPayments: pendingPayments?.length ?? 0,
        pendingDeposits: pendingDeposits?.length ?? 0,
        prizePool: {
          total: prizePool?.total ?? 0,
          totalApproved: prizePool?.total_approved ?? 0,
          totalPending: prizePool?.total_pending ?? 0,
          participants: prizePool?.participants ?? 0,
        },
      }}
      recentUsers={
        (recentUsers ?? []).map((u) => ({
          id: u.firebase_id,
          name: u.name,
          role: u.role ?? "user",
          points: u.points ?? 0,
          createdAt: u.created_at ?? "",
        }))
      }
      pendingPayments={
        (pendingPayments ?? []).map((p) => ({
          id: p.id,
          userName: p.user_name,
          amount: Number(p.amount),
          status: p.status,
          createdAt: p.created_at,
        }))
      }
      pendingDeposits={
        (pendingDeposits ?? []).map((d) => ({
          id: d.id,
          userId: d.user_id,
          amount: Number(d.amount),
          status: d.status,
          createdAt: d.created_at,
        }))
      }
    />
  );
}
