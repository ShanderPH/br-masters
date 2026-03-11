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
    { data: pendingTransactions },
    { data: prizePool },
    { data: recentProfiles },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("matches").select("*", { count: "exact", head: true }),
    supabase.from("predictions").select("*", { count: "exact", head: true }),
    supabase.from("tournaments").select("*", { count: "exact", head: true }),
    supabase.from("teams").select("*", { count: "exact", head: true }),
    supabase.from("players").select("*", { count: "exact", head: true }),
    supabase
      .from("transactions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("prize_pools").select("*").limit(1).single(),
    supabase
      .from("user_profiles")
      .select("id, first_name, last_name, total_points, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  type ProfileRow = { id: string; first_name: string; last_name: string | null; total_points: number; created_at: string };
  type TxRow = { id: string; user_id: string; amount: number; type: string; status: string; created_at: string };
  type PrizeRow = { total_approved: number; total_pending: number; total_distributed: number; participants_count: number } | null;

  const profileRows = (recentProfiles as ProfileRow[] | null) ?? [];
  const userIds = profileRows.map((p) => p.id);

  let rolesMap: Map<string, { firebase_id: string | null; role: string }> = new Map();
  if (userIds.length > 0) {
    const { data: usersData } = await supabase
      .from("users")
      .select("id, firebase_id, role")
      .in("id", userIds);
    type UserRow = { id: string; firebase_id: string | null; role: string };
    const userRows = (usersData as UserRow[] | null) ?? [];
    rolesMap = new Map(userRows.map((u) => [u.id, { firebase_id: u.firebase_id, role: u.role }]));
  }

  const pp = prizePool as PrizeRow;

  return (
    <AdminDashboardClient
      stats={{
        users: usersCount ?? 0,
        matches: matchesCount ?? 0,
        predictions: predictionsCount ?? 0,
        tournaments: tournamentsCount ?? 0,
        teams: teamsCount ?? 0,
        players: playersCount ?? 0,
        pendingPayments: (pendingTransactions as TxRow[] | null)?.filter((t) => t.type === "withdrawal").length ?? 0,
        pendingDeposits: (pendingTransactions as TxRow[] | null)?.filter((t) => t.type === "deposit").length ?? 0,
        prizePool: {
          total: (pp?.total_approved ?? 0) + (pp?.total_pending ?? 0),
          totalApproved: pp?.total_approved ?? 0,
          totalPending: pp?.total_pending ?? 0,
          participants: pp?.participants_count ?? 0,
        },
      }}
      recentUsers={profileRows.map((p) => {
        const info = rolesMap.get(p.id);
        return {
          id: info?.firebase_id || p.id,
          name: `${p.first_name}${p.last_name ? ` ${p.last_name}` : ""}`,
          role: info?.role ?? "user",
          points: p.total_points ?? 0,
          createdAt: p.created_at ?? "",
        };
      })}
      pendingPayments={
        ((pendingTransactions as TxRow[] | null) ?? [])
          .filter((t) => t.type === "withdrawal")
          .map((t) => ({
            id: t.id,
            userName: t.user_id,
            amount: Number(t.amount),
            status: t.status,
            createdAt: t.created_at,
          }))
      }
      pendingDeposits={
        ((pendingTransactions as TxRow[] | null) ?? [])
          .filter((t) => t.type === "deposit")
          .map((t) => ({
            id: t.id,
            userId: t.user_id,
            amount: Number(t.amount),
            status: t.status,
            createdAt: t.created_at,
          }))
      }
    />
  );
}
