import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

/** GET /api/notifications — list current user's notifications (most recent first) */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const url = new URL(request.url);
    const onlyUnread = url.searchParams.get("unread") === "true";

    const notifications = await prisma.notification.findMany({
      where: {
        userId: auth.userId,
        ...(onlyUnread ? { read: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: auth.userId, read: false },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error("[notifications GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

/** PATCH /api/notifications — mark all as read */
export async function PATCH() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    await prisma.notification.updateMany({
      where: { userId: auth.userId, read: false },
      data: { read: true },
    });

    return NextResponse.json({ message: "Notificações marcadas como lidas" });
  } catch (error) {
    console.error("[notifications PATCH]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
