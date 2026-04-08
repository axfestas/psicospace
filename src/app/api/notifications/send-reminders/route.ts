import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPendingItemsEmail } from "@/lib/email";

export const runtime = "edge";

/**
 * POST /api/notifications/send-reminders
 * Intended to be called by a Cron Job (e.g. Cloudflare Workers Cron or external scheduler).
 * Requires X-Cron-Secret header matching CRON_SECRET env var.
 *
 * For each user, collects overdue tasks, soon-due tasks (within 7 days),
 * and upcoming events (within 7 days), then sends an email digest + in-app notifications.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided = request.headers.get("x-cron-secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
  }

  try {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Get all users with their pending tasks and upcoming events
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        tasks: {
          where: {
            completed: false,
            dueDate: { not: null },
          },
          select: { title: true, dueDate: true },
        },
        events: {
          where: {
            startAt: { gte: now, lte: in7Days },
          },
          select: { title: true, startAt: true },
        },
      },
    });

    let emailsSent = 0;
    let notificationsCreated = 0;

    for (const user of users) {
      type TaskItem = { title: string; dueDate: Date | null };
      type EventItem = { title: string; startAt: Date };

      const overdueTasks = (user.tasks as TaskItem[])
        .filter((t) => t.dueDate && t.dueDate < now)
        .map((t) => ({ title: t.title, dueDate: t.dueDate!.toISOString() }));

      const soonTasks = (user.tasks as TaskItem[])
        .filter((t) => t.dueDate && t.dueDate >= now && t.dueDate <= in7Days)
        .map((t) => ({ title: t.title, dueDate: t.dueDate!.toISOString() }));

      const soonEvents = (user.events as EventItem[]).map((e) => ({
        title: e.title,
        startAt: e.startAt.toISOString(),
      }));

      if (!overdueTasks.length && !soonTasks.length && !soonEvents.length) continue;

      // Create in-app notifications
      if (overdueTasks.length > 0) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: `⚠️ ${overdueTasks.length} tarefa(s) atrasada(s)`,
            message: overdueTasks.map((t: { title: string; dueDate: string }) => `• ${t.title}`).join("\n"),
            type: "warning",
          },
        });
        notificationsCreated++;
      }

      if (soonTasks.length > 0) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: `📋 ${soonTasks.length} tarefa(s) vencem em breve`,
            message: soonTasks.map((t: { title: string; dueDate: string }) => `• ${t.title} — ${new Date(t.dueDate).toLocaleDateString("pt-BR")}`).join("\n"),
            type: "info",
          },
        });
        notificationsCreated++;
      }

      if (soonEvents.length > 0) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            title: `📅 ${soonEvents.length} evento(s) próximo(s)`,
            message: soonEvents.map((e: { title: string; startAt: string }) => `• ${e.title} — ${new Date(e.startAt).toLocaleDateString("pt-BR")}`).join("\n"),
            type: "info",
          },
        });
        notificationsCreated++;
      }

      // Send email digest
      try {
        await sendPendingItemsEmail({
          to: user.email,
          name: user.name,
          overdueTasks,
          soonTasks,
          soonEvents,
        });
        emailsSent++;
      } catch (err) {
        console.error(`[send-reminders] Failed email for ${user.email}:`, err);
      }
    }

    return NextResponse.json({
      message: "Lembretes enviados",
      emailsSent,
      notificationsCreated,
      usersProcessed: users.length,
    });
  } catch (error) {
    console.error("[send-reminders]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
