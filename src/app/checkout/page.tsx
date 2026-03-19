import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { CheckoutClient } from "./checkout-client";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/checkout");
  }

  type ProfileRow = { first_name: string; last_name: string | null; email: string | null };

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("first_name, last_name, email")
    .eq("id", user.id)
    .single();

  const p = profile as ProfileRow | null;

  return (
    <CheckoutClient
      userId={user.id}
      userEmail={user.email || p?.email || ""}
      userName={p?.first_name || ""}
      userLastName={p?.last_name || ""}
    />
  );
}
