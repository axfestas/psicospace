"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, AlertCircle, Database, RefreshCw, Play } from "lucide-react";

interface Migration {
  name: string;
  applied: boolean;
  appliedAt: string | null;
}

interface MigrationsData {
  migrations: Migration[];
  pendingCount: number;
}

interface ApplyResult {
  name: string;
  success: boolean;
  error?: string;
}

export default function MigrationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<MigrationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applyResults, setApplyResults] = useState<ApplyResult[] | null>(null);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== "SUPERADMIN") {
      router.replace("/dashboard");
    }
  }, [user, router]);

  const fetchMigrations = useCallback(async () => {
    setLoading(true);
    setApplyResults(null);
    setApplyMessage(null);
    try {
      const res = await fetch("/api/admin/migrations");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMigrations();
  }, [fetchMigrations]);

  const handleApply = async () => {
    if (!confirm("Aplicar todas as migrações pendentes? Esta ação não pode ser desfeita.")) return;
    setApplying(true);
    setApplyResults(null);
    setApplyMessage(null);
    try {
      const res = await fetch("/api/admin/migrations", { method: "POST" });
      const json = await res.json();
      setApplyMessage(json.message ?? null);
      setApplyResults(json.applied ?? null);
      await fetchMigrations();
    } finally {
      setApplying(false);
    }
  };

  if (user?.role !== "SUPERADMIN") {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Migrações do Banco de Dados
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gerencie e aplique migrações do esquema D1
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchMigrations}
            disabled={loading || applying}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          {data && data.pendingCount > 0 && (
            <Button
              onClick={handleApply}
              disabled={applying || loading}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Play className={`h-4 w-4 ${applying ? "animate-pulse" : ""}`} />
              {applying
                ? "Aplicando..."
                : `Aplicar ${data.pendingCount} pendente${data.pendingCount !== 1 ? "s" : ""}`}
            </Button>
          )}
        </div>
      </div>

      {applyMessage && (
        <div
          className={`flex items-start gap-3 rounded-lg border p-4 ${
            applyResults?.some((r) => !r.success)
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
              : "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
          }`}
        >
          {applyResults?.some((r) => !r.success) ? (
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <p className="font-medium">{applyMessage}</p>
            {applyResults?.map((r) => (
              <p key={r.name} className="text-sm">
                <span className="font-mono">{r.name}</span>
                {r.error ? ` — ${r.error}` : ""}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                <Database className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data?.migrations.length ?? "—"}
                </p>
                <p className="text-sm text-gray-500">Total de migrações</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data ? data.migrations.filter((m) => m.applied).length : "—"}
                </p>
                <p className="text-sm text-gray-500">Aplicadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div
                className={`rounded-lg p-3 ${
                  (data?.pendingCount ?? 0) > 0
                    ? "bg-orange-100 dark:bg-orange-900/30"
                    : "bg-gray-100 dark:bg-gray-800"
                }`}
              >
                <Clock
                  className={`h-6 w-6 ${
                    (data?.pendingCount ?? 0) > 0
                      ? "text-orange-600 dark:text-orange-400"
                      : "text-gray-400"
                  }`}
                />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data?.pendingCount ?? "—"}
                </p>
                <p className="text-sm text-gray-500">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Migrações</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : !data || data.migrations.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma migração encontrada.</p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {data.migrations.map((migration) => (
                <div
                  key={migration.name}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    {migration.applied ? (
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" />
                    ) : (
                      <Clock className="h-5 w-5 flex-shrink-0 text-orange-400" />
                    )}
                    <div>
                      <p className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">
                        {migration.name}
                      </p>
                      {migration.appliedAt && (
                        <p className="text-xs text-gray-500">
                          Aplicada em{" "}
                          {new Date(migration.appliedAt + "Z").toLocaleString(
                            "pt-BR"
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      migration.applied
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                    }`}
                  >
                    {migration.applied ? "Aplicada" : "Pendente"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                Como adicionar novas migrações
              </p>
              <ol className="list-decimal list-inside space-y-1 text-sm text-amber-700 dark:text-amber-400">
                <li>
                  Atualize o schema em{" "}
                  <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
                    prisma/schema.prisma
                  </code>
                </li>
                <li>
                  Gere a migração com{" "}
                  <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
                    npx prisma migrate diff
                  </code>{" "}
                  ou crie o SQL manualmente
                </li>
                <li>
                  Adicione o SQL no array{" "}
                  <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
                    MIGRATIONS
                  </code>{" "}
                  em{" "}
                  <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">
                    src/app/api/admin/migrations/route.ts
                  </code>
                </li>
                <li>Faça o deploy e aplique a migração aqui nesta página</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
