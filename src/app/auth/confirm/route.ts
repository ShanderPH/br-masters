import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/routes";

function resolveNextPath(nextParam: string | null): string {
  if (!nextParam) {
    return ROUTES.REGISTER_CONFIRMED;
  }

  if (!nextParam.startsWith("/") || nextParam.startsWith("//")) {
    return ROUTES.REGISTER_CONFIRMED;
  }

  return nextParam;
}

function buildRedirectUrl(request: NextRequest, nextPath: string, confirmed: "1" | "0"): URL {
  const url = new URL(nextPath, request.url);
  url.searchParams.set("confirmed", confirmed);
  return url;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const nextPath = resolveNextPath(searchParams.get("next"));

  const supabase = await createClient();

  try {
    if (tokenHash && type) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      });

      if (!error) {
        return NextResponse.redirect(buildRedirectUrl(request, nextPath, "1"));
      }
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(buildRedirectUrl(request, nextPath, "1"));
      }
    }
  } catch {
    return NextResponse.redirect(buildRedirectUrl(request, ROUTES.REGISTER_CONFIRMED, "0"));
  }

  return NextResponse.redirect(buildRedirectUrl(request, ROUTES.REGISTER_CONFIRMED, "0"));
}
