import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser, comparePassword, hashPassword, signToken, setAuthCookie } from "@/lib/auth";

export const runtime = "edge";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: { id: true, name: true, email: true, role: true, createdAt: true, emailVerified: true, avatarUrl: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Usuárie não encontrade" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[auth/me]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { name, currentPassword, newPassword, newEmail, avatarUrl } = body;

    if (name !== undefined && (typeof name !== "string" || name.trim().length < 2)) {
      return NextResponse.json({ error: "Nome inválido (mínimo 2 caracteres)" }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!dbUser) {
      return NextResponse.json({ error: "Usuárie não encontrade" }, { status: 404 });
    }

    const updateData: {
      name?: string;
      password?: string;
      email?: string;
      emailVerified?: boolean;
      avatarUrl?: string | null;
    } = {};

    if (name !== undefined) updateData.name = name.trim();
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Senha atual é obrigatória para alterar a senha" }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Nova senha deve ter pelo menos 6 caracteres" }, { status: 400 });
      }
      const valid = await comparePassword(currentPassword, dbUser.password);
      if (!valid) {
        return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
      }
      updateData.password = await hashPassword(newPassword);
    }

    if (newEmail) {
      if (typeof newEmail !== "string" || !newEmail.includes("@") || !newEmail.slice(newEmail.lastIndexOf("@") + 1).includes(".")) {
        return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
      }
      if (!currentPassword) {
        return NextResponse.json({ error: "Senha atual é obrigatória para alterar o e-mail" }, { status: 400 });
      }
      const valid = await comparePassword(currentPassword, dbUser.password);
      if (!valid) {
        return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });
      }
      const existing = await prisma.user.findUnique({ where: { email: newEmail } });
      if (existing && existing.id !== dbUser.id) {
        return NextResponse.json({ error: "E-mail já está em uso" }, { status: 409 });
      }
      updateData.email = newEmail;
      updateData.emailVerified = false;
    }

    const updated = await prisma.user.update({
      where: { id: auth.userId },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, createdAt: true, avatarUrl: true },
    });

    // Re-issue JWT with updated info
    const token = await signToken({ userId: updated.id, email: updated.email, role: updated.role });
    const cookie = setAuthCookie(token);
    const response = NextResponse.json({ user: updated });
    response.cookies.set(cookie);
    return response;
  } catch (error) {
    console.error("[auth/me PUT]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ message: "Logout realizado com sucesso" });
  response.cookies.delete("auth-token");
  return response;
}
