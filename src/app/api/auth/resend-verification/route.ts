import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";

export const runtime = "edge";

function generateToken(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST() {
  try {
    const auth = await getAuthUser();
    if (!auth) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: auth.userId } });
    if (!user) return NextResponse.json({ error: "Usuárie não encontrade" }, { status: 404 });

    if (user.emailVerified) {
      return NextResponse.json({ error: "E-mail já verificado" }, { status: 400 });
    }

    const verificationToken = generateToken();

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: verificationToken },
    });

    await sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationToken,
    });

    return NextResponse.json({ message: "E-mail de verificação reenviado com sucesso" });
  } catch (error) {
    console.error("[resend-verification]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
