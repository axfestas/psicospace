import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { comparePassword, signToken, setAuthCookie } from "@/lib/auth";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const normalizedEmail = email.toLowerCase();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { email }],
      },
      select: { id: true, name: true, email: true, password: true, role: true, createdAt: true, avatarUrl: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
      if (user.password.startsWith("$2")) {
        return NextResponse.json(
          { error: "Sua conta usa um formato antigo de senha. Redefina sua senha para entrar." },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: "Credenciais inválidas" },
        { status: 401 }
      );
    }

    const token = await signToken({ userId: user.id, email: user.email, role: user.role });
    const cookie = setAuthCookie(token);

    const response = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt, avatarUrl: user.avatarUrl },
    });
    response.cookies.set(cookie);
    return response;
  } catch (error) {
    console.error("[POST /api/auth/login]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
