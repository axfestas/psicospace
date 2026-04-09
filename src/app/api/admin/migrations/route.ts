import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getRequestContext } from "@cloudflare/next-on-pages";
import {
  MIGRATIONS,
  runMigrations,
  getMigrationStatus,
} from "@/lib/migrate";

export const runtime = "edge";

async function getD1(): Promise<CfD1Database> {
  const { env } = getRequestContext();
  const d1 = env.d1_psi;
  if (!d1) throw new Error("D1 binding 'd1_psi' not configured");
  return d1;
}

// ---------------------------------------------------------------------------
// GET /api/admin/migrations — list all migrations with applied/pending status
// ---------------------------------------------------------------------------
export async function GET() {
  try {
    const auth = await getAuthUser();
    if (!auth || auth.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const d1 = await getD1();
    const migrations = await getMigrationStatus(d1);
    const pendingCount = migrations.filter((m) => !m.applied).length;

    return NextResponse.json({ migrations, pendingCount });
  } catch (error) {
    console.error("[migrations GET]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/migrations — apply all pending migrations in order
// ---------------------------------------------------------------------------
export async function POST() {
  try {
    const auth = await getAuthUser();
    if (!auth || auth.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
    }

    const d1 = await getD1();
    const results = await runMigrations(d1);

    const applied = results.filter((r) => !r.skipped);
    const allSucceeded = applied.every((r) => r.success);

    return NextResponse.json(
      {
        message: allSucceeded
          ? applied.length === 0
            ? "Nenhuma migração pendente."
            : `${applied.length} migração(ões) aplicada(s) com sucesso.`
          : "Algumas migrações falharam. Verifique os detalhes.",
        applied,
        total: MIGRATIONS.length,
      },
      { status: allSucceeded ? 200 : 500 }
    );
  } catch (error) {
    console.error("[migrations POST]", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
