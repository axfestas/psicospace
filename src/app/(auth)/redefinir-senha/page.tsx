"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle } from "lucide-react";

function RedefinirSenhaForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) setError("Token inválido ou ausente.");
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao redefinir senha.");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      }
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-900">
        <div className="mb-8 text-center">
          <span className="text-5xl font-bold text-blue-600">Ψ</span>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Nova senha
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Crie uma nova senha para sua conta
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Senha redefinida com sucesso! Você será redirecionado para o login...
            </p>
            <Link href="/login" className="text-sm font-medium text-blue-600 hover:underline">
              Ir para o login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nova senha
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                disabled={!token}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Confirmar nova senha
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                required
                disabled={!token}
              />
            </div>

            <Button type="submit" className="w-full" loading={loading} disabled={!token}>
              Redefinir senha
            </Button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              <Link href="/login" className="font-medium text-blue-600 hover:underline">
                Voltar ao login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense>
      <RedefinirSenhaForm />
    </Suspense>
  );
}
