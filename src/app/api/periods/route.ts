import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";
import { normalizeStoredMaterialUrl } from "@/lib/file-urls";

export const runtime = "edge";

export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const periods = await prisma.period.findMany({
      orderBy: { order: "asc" },
      include: {
        disciplines: {
          orderBy: { name: "asc" },
          include: {
            materials: {
              orderBy: { createdAt: "desc" },
              include: {
                progress: { where: { userId: auth.userId } },
                uploadedBy: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    // If the user is a student, filter disciplines to only those the user
    // is enrolled/authorized for. Docentes and admins see all disciplines.
    let allowedDisciplineIds: Set<string> | null = null;
    if (auth.role === "ESTUDANTE") {
      const enrollments = await prisma.userDiscipline.findMany({ where: { userId: auth.userId }, select: { disciplineId: true } });
      allowedDisciplineIds = new Set(enrollments.map((e: { disciplineId: string }) => e.disciplineId));
    }

    return NextResponse.json({
      periods: periods
        .map((period) => ({
          ...period,
          disciplines: period.disciplines
            .filter((d) => (allowedDisciplineIds ? allowedDisciplineIds.has(d.id) : true))
            .map((discipline) => ({
              ...discipline,
              materials: discipline.materials.map((material) => ({
                ...material,
                url: normalizeStoredMaterialUrl(material.url, material.type),
              })),
            })),
        }))
        .filter((p) => p.disciplines.length > 0 || auth.role !== "ESTUDANTE"),
    });
  } catch (error) {
    console.error("[periods]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthUser();
    if (!auth || !["ADMIN", "SUPERADMIN"].includes(auth.role)) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const { name, order } = await request.json();
    if (!name || order === undefined) {
      return NextResponse.json({ error: "Nome e ordem são obrigatórios" }, { status: 400 });
    }

    const period = await prisma.period.create({ data: { name, order } });
    return NextResponse.json({ period }, { status: 201 });
  } catch (error) {
    console.error("[periods]", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
