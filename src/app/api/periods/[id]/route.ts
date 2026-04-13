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
    const { name, order } = await request.json();

    const data: { name?: string; order?: number } = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim() === "") {
        return NextResponse.json({ error: "Nome não pode estar vazio" }, { status: 400 });
      }
      data.name = name.trim();
    }
    if (order !== undefined) {
      const n = Number(order);
      if (!Number.isInteger(n) || n < 1) {
        return NextResponse.json({ error: "Ordem deve ser um número inteiro positivo" }, { status: 400 });
      }
      data.order = n;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nenhum campo para atualizar" }, { status: 400 });
    }

    const period = await prisma.period.update({ where: { id }, data });
    return NextResponse.json({ period });
  } catch (error) {
    console.error("[periods/[id] PATCH]", error);
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
    await prisma.period.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[periods/[id] DELETE]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
