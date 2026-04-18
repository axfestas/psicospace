import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token inválido" }, { status: 400 });
    }
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: "A nova senha deve ter pelo menos 6 caracteres" }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { passwordResetToken: token },
      select: { id: true, passwordResetExpires: true },
    });

    if (!user || !user.passwordResetExpires || user.passwordResetExpires < new Date()) {
      return NextResponse.json({ error: "Token inválido ou expirado" }, { status: 400 });
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, passwordResetToken: null, passwordResetExpires: null },
    });

    return NextResponse.json({ message: "Senha redefinida com sucesso!" });
  } catch (error) {
    console.error("[reset-password]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
