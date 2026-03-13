import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const supportMessageSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().email("Informe um e-mail válido"),
  message: z.string().trim().min(10, "Mensagem muito curta").max(4000),
});

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const parsed = supportMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Dados inválidos" },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.SUPPORT_FROM_EMAIL;
    const supportRecipient = process.env.SUPPORT_TO_EMAIL || "felipe.braat@outlook.com";

    if (!resendApiKey || !fromEmail) {
      return NextResponse.json(
        { error: "Serviço de suporte indisponível no momento" },
        { status: 503 }
      );
    }

    const payload = parsed.data;
    const ipAddress = request.headers.get("x-forwarded-for") || "desconhecido";
    const userAgent = request.headers.get("user-agent") || "desconhecido";

    const subject = `BR Masters Suporte - ${payload.name}`;
    const textBody = [
      "Nova mensagem de suporte recebida no BR Masters",
      "",
      `Nome: ${payload.name}`,
      `E-mail: ${payload.email}`,
      `IP: ${ipAddress}`,
      `User-Agent: ${userAgent}`,
      "",
      "Mensagem:",
      payload.message,
    ].join("\n");

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [supportRecipient],
        reply_to: payload.email,
        subject,
        text: textBody,
      }),
    });

    if (!resendResponse.ok) {
      return NextResponse.json(
        { error: "Não foi possível enviar sua mensagem agora" },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível enviar sua mensagem agora" },
      { status: 500 }
    );
  }
}
