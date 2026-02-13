import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("users_profiles")
    .select("role, firebase_id, name")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") return null;
  return { ...user, firebase_id: profile.firebase_id, adminName: profile.name };
}

type TableName =
  | "users_profiles"
  | "matches"
  | "predictions"
  | "teams"
  | "players"
  | "tournaments"
  | "tournament_seasons"
  | "payments"
  | "deposits"
  | "current_round"
  | "prize_pool"
  | "user_tournament_points"
  | "notifications";

const ALLOWED_TABLES: TableName[] = [
  "users_profiles",
  "matches",
  "predictions",
  "teams",
  "players",
  "tournaments",
  "tournament_seasons",
  "payments",
  "deposits",
  "current_round",
  "prize_pool",
  "user_tournament_points",
  "notifications",
];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const admin = await verifyAdmin(supabase);

    if (!admin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { action, table, data, filters, select, orderBy, limit, offset } = body;

    if (!ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ error: "Tabela não permitida" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    switch (action) {
      case "list": {
        let query = db
          .from(table)
          .select(select || "*", { count: "exact" });

        if (filters) {
          for (const filter of filters) {
            const { column, operator, value } = filter;
            switch (operator) {
              case "eq": query = query.eq(column, value); break;
              case "neq": query = query.neq(column, value); break;
              case "gt": query = query.gt(column, value); break;
              case "gte": query = query.gte(column, value); break;
              case "lt": query = query.lt(column, value); break;
              case "lte": query = query.lte(column, value); break;
              case "like": query = query.like(column, value); break;
              case "ilike": query = query.ilike(column, value); break;
              case "in": query = query.in(column, value); break;
              case "is": query = query.is(column, value); break;
            }
          }
        }

        if (orderBy) {
          query = query.order(orderBy.column, {
            ascending: orderBy.ascending ?? false,
          });
        }

        if (limit) query = query.limit(limit);
        if (offset) query = query.range(offset, offset + (limit || 20) - 1);

        const { data: rows, error, count } = await query;

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data: rows, count });
      }

      case "get": {
        const { id, idColumn } = body;
        const { data: row, error } = await db
          .from(table)
          .select(select || "*")
          .eq(idColumn || "id", id)
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data: row });
      }

      case "create": {
        const { data: created, error } = await db
          .from(table)
          .insert(data)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data: created });
      }

      case "update": {
        const { id, idColumn } = body;
        const { data: updated, error } = await db
          .from(table)
          .update({ ...data, updated_at: new Date().toISOString() })
          .eq(idColumn || "id", id)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data: updated });
      }

      case "delete": {
        const { id, idColumn } = body;
        const { error } = await db
          .from(table)
          .delete()
          .eq(idColumn || "id", id);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      case "upsert": {
        const { onConflict } = body;
        const { data: upserted, error } = await db
          .from(table)
          .upsert(data, { onConflict: onConflict || "id" })
          .select();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data: upserted });
      }

      case "approve_payment": {
        const { id: paymentId } = body;
        const { data: updated, error } = await db
          .from("payments")
          .update({
            status: "approved",
            admin_id: admin.firebase_id,
            admin_name: admin.adminName,
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", paymentId)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data: updated });
      }

      case "reject_payment": {
        const { id: paymentId, rejection_reason } = body;
        const { data: updated, error } = await db
          .from("payments")
          .update({
            status: "rejected",
            admin_id: admin.firebase_id,
            admin_name: admin.adminName,
            rejection_reason,
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", paymentId)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data: updated });
      }

      case "approve_deposit": {
        const { id: depositId } = body;
        const { data: updated, error } = await db
          .from("deposits")
          .update({
            status: "confirmed",
            confirmed_at: new Date().toISOString(),
          })
          .eq("id", depositId)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data: updated });
      }

      case "reject_deposit": {
        const { id: depositId, notes } = body;
        const { data: updated, error } = await db
          .from("deposits")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            notes,
          })
          .eq("id", depositId)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data: updated });
      }

      default:
        return NextResponse.json({ error: "Ação desconhecida" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin CRUD API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro interno" },
      { status: 500 }
    );
  }
}
