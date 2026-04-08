"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle } from "lucide-react";

export default function EsqueceuSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erro ao enviar e-mail.");
      } else {
        setSent(true);
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
            Esqueceu a senha?
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Informe seu e-mail e enviaremos as instruções
          </p>
        </div>

        {sent ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Se esse e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha em breve.
            </p>
            <Link href="/login" className="text-sm font-medium text-blue-600 hover:underline">
              Voltar ao login
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
                E-mail
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <Button type="submit" className="w-full" loading={loading}>
              Enviar instruções
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
