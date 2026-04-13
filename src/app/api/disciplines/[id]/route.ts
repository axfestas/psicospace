import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "edge";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth || !["ADMIN", "SUPERADMIN"].includes(auth.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { id } = await params;
    const { name, description, periodId } = await request.json();

    const data: { name?: string; description?: string; periodId?: string } = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return NextResponse.json({ error: "Nome não pode estar vazio" }, { status: 400 });
      }
      data.name = name.trim();
    }
    if (description !== undefined) {
      data.description = typeof description === "string" ? description.trim() : "";
    }
    if (periodId !== undefined) {
      if (typeof periodId !== "string" || periodId.trim() === "") {
        return NextResponse.json({ error: "periodId inválido" }, { status: 400 });
      }
      data.periodId = periodId.trim();
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
    }

    const discipline = await prisma.discipline.update({ where: { id }, data });
    return NextResponse.json({ discipline });
  } catch (error) {
    console.error("[disciplines/[id] PATCH]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthUser();
    if (!auth || !["ADMIN", "SUPERADMIN"].includes(auth.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { id } = await params;
    await prisma.discipline.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[disciplines/[id] DELETE]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
