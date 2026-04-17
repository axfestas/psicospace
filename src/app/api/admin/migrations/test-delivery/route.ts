import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPendingItemsEmail,
} from "@/lib/email";

export const runtime = "edge";

type TestType =
  | "email_welcome"
  | "email_verification"
  | "email_reset"
  | "email_pending"
  | "notification";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth || auth.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      testType?: TestType;
    };
    const requestedEmail = body.email?.trim() ?? "";
    const testType: TestType = body.testType ?? "email_pending";

    const currentUser = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { email: true, name: true },
    });

    const senderName = currentUser?.name || "Super Admin";

    // Notification-only test does not need a target email
    if (testType === "notification") {
      await prisma.notification.create({
        data: {
          userId: auth.userId,
          title: "🧪 Teste de notificação",
          message: `Notificação de teste criada em ${new Date().toLocaleString("pt-BR")}.`,
          type: "info",
        },
      });
      return NextResponse.json({
        notificationCreated: true,
        emailSent: false,
        emailError: null,
        targetEmail: null,
        message: "Notificação de teste criada com sucesso.",
      });
    }

    const targetEmail = requestedEmail || currentUser?.email;
    if (!targetEmail || !isValidEmail(targetEmail)) {
      return NextResponse.json(
        { error: "Informe um e-mail válido para o teste de e-mail." },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();
    let emailSent = false;
    let emailError: string | null = null;

    try {
      if (testType === "email_welcome" || testType === "email_verification") {
        // Both welcome and verification use the same template
        await sendWelcomeEmail({
          to: targetEmail,
          name: senderName,
          verificationToken: "TEST_TOKEN_EXAMPLE_000000",
        });
      } else if (testType === "email_reset") {
        await sendPasswordResetEmail({
          to: targetEmail,
          name: senderName,
          resetToken: "TEST_RESET_TOKEN_000000",
        });
      } else {
        // email_pending — reminder with overdue/upcoming tasks and events
        await sendPendingItemsEmail({
          to: targetEmail,
          name: senderName,
          overdueTasks: [{ title: "Tarefa atrasada de teste", dueDate: nowIso }],
          soonTasks: [{ title: "Tarefa próxima de teste", dueDate: nowIso }],
          soonEvents: [{ title: "Evento de teste", startAt: nowIso }],
        });
      }
      emailSent = true;
    } catch (error) {
      emailError = error instanceof Error ? error.message : "Erro desconhecido ao enviar e-mail.";
      console.error("[admin/migrations/test-delivery] email error", testType, error);
    }

    return NextResponse.json({
      message: emailSent
        ? `E-mail de teste (${testType}) enviado com sucesso para ${targetEmail}.`
        : `Falha ao enviar e-mail de teste (${testType}).`,
      emailSent,
      notificationCreated: false,
      emailError,
      targetEmail,
    });
  } catch (error) {
    console.error("[admin/migrations/test-delivery]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
