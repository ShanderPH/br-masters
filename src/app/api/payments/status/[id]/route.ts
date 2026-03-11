import { NextRequest, NextResponse } from "next/server";

import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let db: any;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      db = createServiceClient();
    } else {
      db = supabase;
    }

    const { data: transaction, error } = await db
      .from("transactions")
      .select("id, status, amount, type, metadata, created_at, processed_at, updated_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !transaction) {
      return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });
    }

    return NextResponse.json({
      id: transaction.id,
      status: transaction.status,
      amount: transaction.amount,
      type: transaction.type,
      metadata: transaction.metadata,
      createdAt: transaction.created_at,
      processedAt: transaction.processed_at,
      updatedAt: transaction.updated_at,
    });
  } catch (error) {
    console.error("[PaymentStatus] Error:", error);
    return NextResponse.json(
      { error: "Erro ao consultar status" },
      { status: 500 }
    );
  }
}
