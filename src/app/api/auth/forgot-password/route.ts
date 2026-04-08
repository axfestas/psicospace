import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

export const runtime = "edge";

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "E-mail é obrigatório" }, { status: 400 });
    }

    // Always return success to avoid user enumeration
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true },
    });

    if (user) {
      const token = generateToken();
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: token, passwordResetExpires: expires },
      });

      try {
        await sendPasswordResetEmail({ to: user.email, name: user.name, resetToken: token });
      } catch (emailErr) {
        console.error("[forgot-password] Failed to send email:", emailErr);
      }
    }

    return NextResponse.json({ message: "Se esse e-mail estiver cadastrado, você receberá as instruções em breve." });
  } catch (error) {
    console.error("[forgot-password]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
