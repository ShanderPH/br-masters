import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("id, username, firebase_id, role")
    .eq("id", user.id)
    .single();

  if (!userRow || (userRow as { role: string }).role !== "admin") {
    redirect("/dashboard");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  const adminName = profile
    ? `${(profile as { first_name: string }).first_name}${(profile as { last_name: string | null }).last_name ? ` ${(profile as { last_name: string | null }).last_name}` : ""}`
    : "Admin";

  return (
    <AdminShell
      user={{
        id: (userRow as { firebase_id: string | null }).firebase_id || user.id,
        name: adminName,
        role: "admin",
      }}
    >
      {children}
    </AdminShell>
  );
}
