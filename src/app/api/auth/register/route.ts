import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, signToken, setAuthCookie } from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";

export const runtime = "edge";

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, email e senha são obrigatórios" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Este email já está em uso" },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const verificationToken = generateToken();

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerificationToken: verificationToken,
      },
    });

    // Create welcome notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "Bem-vinde ao PsicoSpace! 🎉",
        message: `Olá, ${user.name}! Sua conta foi criada com sucesso. Confirme seu e-mail para aproveitar todos os recursos.`,
        type: "info",
      },
    });

    // Send welcome + verification email (fire-and-forget, don't fail registration)
    sendWelcomeEmail({
      to: user.email,
      name: user.name,
      verificationToken,
    }).catch((err) => console.error("[register] Failed to send email:", err));

    const token = await signToken({ userId: user.id, email: user.email, role: user.role });
    const cookie = setAuthCookie(token);

    const response = NextResponse.json(
      { user: { id: user.id, name: user.name, email: user.email, role: user.role } },
      { status: 201 }
    );
    response.cookies.set(cookie);
    return response;
  } catch (error) {
    console.error("[POST /api/auth/register]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
