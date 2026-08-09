import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

function canManageDisciplines(role: string) {
  return ["DOCENTE", "ADMIN", "SUPERADMIN"].includes(role);
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth || !canManageDisciplines(auth.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const disciplineId = url.searchParams.get("disciplineId");

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (disciplineId) where.disciplineId = disciplineId;

    const assignments = await prisma.userDiscipline.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        discipline: {
          select: {
            id: true,
            name: true,
            periodId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("[user-disciplines] GET", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth || !canManageDisciplines(auth.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { userId, disciplineId } = (await request.json()) as {
      userId?: string;
      disciplineId?: string;
    };
    if (!userId || !disciplineId) {
      return NextResponse.json(
        { error: "userId e disciplineId são obrigatórios" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "ESTUDANTE") {
      return NextResponse.json(
        { error: "O usuário precisa existir e ser um estudante" },
        { status: 400 }
      );
    }

    const discipline = await prisma.discipline.findUnique({ where: { id: disciplineId } });
    if (!discipline) {
      return NextResponse.json(
        { error: "Disciplina não encontrada" },
        { status: 400 }
      );
    }

    const assignment = await prisma.userDiscipline.upsert({
      where: {
        userId_disciplineId: {
          userId,
          disciplineId,
        },
      },
      create: { userId, disciplineId },
      update: {},
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error("[user-disciplines] POST", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth || !canManageDisciplines(auth.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { userId, disciplineId } = (await request.json()) as {
      userId?: string;
      disciplineId?: string;
    };
    if (!userId || !disciplineId) {
      return NextResponse.json(
        { error: "userId e disciplineId são obrigatórios" },
        { status: 400 }
      );
    }

    await prisma.userDiscipline.delete({
      where: {
        userId_disciplineId: {
          userId,
          disciplineId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[user-disciplines] DELETE", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
