import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

const DOCENTE_ROLES = new Set(["DOCENTE", "ADMIN", "SUPERADMIN"]);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const { id } = await params;
    const exercise = await prisma.exercise.findUnique({
      where: { id },
      include: {
        options: { orderBy: { order: "asc" } },
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        material: { select: { id: true, title: true } },
        libraryItem: { select: { id: true, title: true } },
      },
    });

    if (!exercise) {
      return NextResponse.json({ error: "Exercício não encontrado" }, { status: 404 });
    }

    const isDocente = DOCENTE_ROLES.has(auth.role);
    if (!isDocente && exercise.status !== "APPROVED") {
      return NextResponse.json({ error: "Exercício não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ exercise });
  } catch (error) {
    console.error("[exercises/[id] GET]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth || !DOCENTE_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const exercise = await prisma.exercise.findUnique({ where: { id } });
    if (!exercise) {
      return NextResponse.json({ error: "Exercício não encontrado" }, { status: 404 });
    }

    const { title, question, answer, explanation, options, status } = await request.json();

    // Only the creator or admin can edit content; any docente can approve/reject
    if (
      (title !== undefined || question !== undefined || options !== undefined) &&
      exercise.createdById !== auth.userId &&
      auth.role !== "ADMIN" &&
      auth.role !== "SUPERADMIN"
    ) {
      return NextResponse.json(
        { error: "Apenas o criador pode editar o conteúdo do exercício" },
        { status: 403 }
      );
    }

    const now = new Date().toISOString();
    const isApproval = status === "APPROVED" || status === "REJECTED";

    const updated = await prisma.exercise.update({
      where: { id },
      data: {
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(question !== undefined ? { question: question.trim() } : {}),
        ...(answer !== undefined ? { answer: answer?.trim() || null } : {}),
        ...(explanation !== undefined ? { explanation: explanation?.trim() || null } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(isApproval
          ? {
              approvedById: auth.userId,
              approvedAt: status === "APPROVED" ? now : null,
            }
          : {}),
        updatedAt: now,
      },
    });

    // Replace options if provided
    if (Array.isArray(options)) {
      await prisma.exerciseOption.deleteMany({ where: { exerciseId: id } });
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        if (opt?.text?.trim()) {
          await prisma.exerciseOption.create({
            data: {
              exerciseId: id,
              text: opt.text.trim(),
              isCorrect: !!opt.isCorrect,
              order: i,
            },
          });
        }
      }
    }

    const full = await prisma.exercise.findUnique({
      where: { id },
      include: {
        options: { orderBy: { order: "asc" } },
        createdBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ exercise: full });
  } catch (error) {
    console.error("[exercises/[id] PUT]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth || !DOCENTE_ROLES.has(auth.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const exercise = await prisma.exercise.findUnique({ where: { id } });
    if (!exercise) {
      return NextResponse.json({ error: "Exercício não encontrado" }, { status: 404 });
    }

    if (
      exercise.createdById !== auth.userId &&
      auth.role !== "ADMIN" &&
      auth.role !== "SUPERADMIN"
    ) {
      return NextResponse.json(
        { error: "Apenas o criador pode excluir este exercício" },
        { status: 403 }
      );
    }

    await prisma.exercise.delete({ where: { id } });
    return NextResponse.json({ message: "Exercício excluído com sucesso" });
  } catch (error) {
    console.error("[exercises/[id] DELETE]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
