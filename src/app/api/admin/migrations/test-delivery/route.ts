import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { sendPendingItemsEmail } from "@/lib/email";

export const runtime = "edge";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth || auth.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as { email?: string };
    const requestedEmail = body.email?.trim() ?? "";

    const currentUser = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { email: true, name: true },
    });

    const targetEmail = requestedEmail || currentUser?.email;
    if (!targetEmail || !isValidEmail(targetEmail)) {
      return NextResponse.json(
        { error: "Informe um e-mail válido para teste." },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();

    await prisma.notification.create({
      data: {
        userId: auth.userId,
        title: "🧪 Teste de notificação",
        message: `Notificação de teste criada em ${new Date().toLocaleString("pt-BR")}.`,
        type: "info",
      },
    });

    let emailSent = false;
    let emailError: string | null = null;

    try {
      await sendPendingItemsEmail({
        to: targetEmail,
        name: currentUser?.name || "Super Admin",
        overdueTasks: [],
        soonTasks: [{ title: "Tarefa de teste", dueDate: nowIso }],
        soonEvents: [{ title: "Evento de teste", startAt: nowIso }],
      });
      emailSent = true;
    } catch (error) {
      emailError = error instanceof Error ? error.message : "Erro desconhecido ao enviar e-mail.";
      console.error("[admin/migrations/test-delivery] email error", error);
    }

    return NextResponse.json({
      message: emailSent
        ? "Teste concluído: notificação criada e e-mail enviado."
        : "Teste concluído parcialmente: notificação criada, mas o e-mail falhou.",
      emailSent,
      notificationCreated: true,
      emailError,
      targetEmail,
    });
  } catch (error) {
    console.error("[admin/migrations/test-delivery]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
