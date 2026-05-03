import { NextRequest, NextResponse } from "next/server";

import { createClient, createServiceClient } from "@/lib/supabase/server";

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userRow } = await supabase
    .from("users")
    .select("id, username, firebase_id, role")
    .eq("id", user.id)
    .single();

  if (!userRow || (userRow as { role: string }).role !== "admin") return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  const adminName = profile
    ? `${(profile as { first_name: string }).first_name}${(profile as { last_name: string | null }).last_name ? ` ${(profile as { last_name: string | null }).last_name}` : ""}`
    : "Admin";

  return {
    ...user,
    firebase_id: (userRow as { firebase_id: string | null }).firebase_id,
    adminName,
  };
}

type TableName =
  | "users"
  | "user_profiles"
  | "matches"
  | "predictions"
  | "teams"
  | "players"
  | "tournaments"
  | "tournament_seasons"
  | "transactions"
  | "prize_pools"
  | "notifications"
  | "countries"
  | "venues"
  | "leagues"
  | "league_members"
  | "achievements"
  | "user_achievements"
  | "points_history"
  | "audit_logs";

const ALLOWED_TABLES: TableName[] = [
  "users",
  "user_profiles",
  "matches",
  "predictions",
  "teams",
  "players",
  "tournaments",
  "tournament_seasons",
  "transactions",
  "prize_pools",
  "notifications",
  "countries",
  "venues",
  "leagues",
  "league_members",
  "achievements",
  "user_achievements",
  "points_history",
  "audit_logs",
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

    // Use service client for all admin operations to bypass RLS
    // Admin identity is already verified above via verifyAdmin()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = (process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : supabase) as any;

    // Tables that use soft-delete via deleted_at column.
    // Hard DELETE on these is replaced by UPDATE deleted_at = NOW().
    const SOFT_DELETE_TABLES = new Set<TableName>(["matches"]);

    switch (action) {
      case "list": {
        const { includeDeleted, onlyDeleted } = body as { includeDeleted?: boolean; onlyDeleted?: boolean };
        let query = db
          .from(table)
          .select(select || "*", { count: "exact" });

        if (SOFT_DELETE_TABLES.has(table)) {
          if (onlyDeleted) {
            query = query.not("deleted_at", "is", null);
          } else if (!includeDeleted) {
            query = query.is("deleted_at", null);
          }
        }

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

        if (SOFT_DELETE_TABLES.has(table)) {
          const { error } = await db
            .from(table)
            .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
            .eq(idColumn || "id", id);

          if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
          }

          return NextResponse.json({ success: true, softDeleted: true });
        }

        const { error } = await db
          .from(table)
          .delete()
          .eq(idColumn || "id", id);

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
      }

      case "restore": {
        const { id, idColumn } = body;

        if (!SOFT_DELETE_TABLES.has(table)) {
          return NextResponse.json({ error: "Tabela não suporta restore" }, { status: 400 });
        }

        const { error } = await db
          .from(table)
          .update({ deleted_at: null, updated_at: new Date().toISOString() })
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

      case "approve_transaction": {
        const { id: txId } = body;
        const { data: updated, error } = await db
          .from("transactions")
          .update({
            status: "approved",
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", txId)
          .select()
          .single();

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ data: updated });
      }

      case "reject_transaction": {
        const { id: txId, rejection_reason } = body;
        const { data: updated, error } = await db
          .from("transactions")
          .update({
            status: "rejected",
            rejection_reason,
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", txId)
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
