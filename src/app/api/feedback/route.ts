import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

/**
 * POST /api/feedback
 *
 * Receives a user-submitted feedback/suggestion message and creates a
 * Notification for every ADMIN and SUPERADMIN user, so the team sees it in
 * the built-in notification bell without needing external tooling.
 *
 * Body: { message: string; category?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const body = await request.json().catch(() => ({})) as {
      message?: string;
      category?: string;
    };

    const message = body.message?.trim() ?? "";
    if (!message || message.length < 5) {
      return NextResponse.json(
        { error: "Mensagem muito curta. Descreva o problema ou sugestão com pelo menos 5 caracteres." },
        { status: 422 },
      );
    }
    if (message.length > 2000) {
      return NextResponse.json(
        { error: "Mensagem muito longa (máximo 2000 caracteres)." },
        { status: 422 },
      );
    }

    const category = body.category?.trim() || "Sugestão";

    // Fetch all admin/superadmin users to notify
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "SUPERADMIN"] } },
      select: { id: true },
    });

    if (admins.length === 0) {
      // No admins found — still acknowledge the submission to the user
      return NextResponse.json({ ok: true });
    }

    // Create one notification per admin
    await Promise.all(
      admins.map((admin) =>
        prisma.notification.create({
          data: {
            userId: admin.id,
            title: `📩 ${category} de ${auth.email}`,
            message,
            type: "info",
          },
        }),
      ),
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[feedback POST]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
