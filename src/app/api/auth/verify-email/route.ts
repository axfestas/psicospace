import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(new URL("/verificar-email?error=missing_token", request.url));
    }

    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      return NextResponse.redirect(new URL("/verificar-email?error=invalid_token", request.url));
    }

    if (user.emailVerified) {
      return NextResponse.redirect(new URL("/verificar-email?status=already_verified", request.url));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
      },
    });

    // Create success notification
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: "E-mail confirmado ✅",
        message: "Seu e-mail foi verificado com sucesso. Aproveite todes os recursos do PsicoSpace!",
        type: "success",
      },
    });

    return NextResponse.redirect(new URL("/verificar-email?status=verified", request.url));
  } catch (error) {
    console.error("[verify-email]", error);
    return NextResponse.redirect(new URL("/verificar-email?error=server_error", request.url));
  }
}
