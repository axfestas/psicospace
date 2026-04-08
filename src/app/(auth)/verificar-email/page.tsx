"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, MailOpen, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status");
  const error = searchParams.get("error");

  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sent" | "error">("idle");

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      setResendStatus(res.ok ? "sent" : "error");
    } catch {
      setResendStatus("error");
    } finally {
      setResending(false);
    }
  };

  if (status === "verified") {
    return (
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800 text-center">
        <div className="mb-4 flex justify-center">
          <CheckCircle className="h-16 w-16 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          E-mail confirmado! ✅
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Sua conta está verificada. Aproveite todos os recursos do PsicoSpace!
        </p>
        <Link href="/dashboard">
          <Button className="w-full">Ir para o Dashboard</Button>
        </Link>
      </div>
    );
  }

  if (status === "already_verified") {
    return (
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800 text-center">
        <div className="mb-4 flex justify-center">
          <CheckCircle className="h-16 w-16 text-blue-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Já verificado
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Seu e-mail já foi confirmado anteriormente.
        </p>
        <Link href="/dashboard">
          <Button className="w-full">Ir para o Dashboard</Button>
        </Link>
      </div>
    );
  }

  if (error) {
    const messages: Record<string, string> = {
      missing_token: "Link inválido. Verifique o link no seu e-mail.",
      invalid_token: "Este link de verificação é inválido ou expirou.",
      server_error: "Erro interno. Tente novamente mais tarde.",
    };
    return (
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800 text-center">
        <div className="mb-4 flex justify-center">
          <XCircle className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Verificação falhou
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {messages[error] || "Link inválido ou expirado."}
        </p>
        {resendStatus === "sent" ? (
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            ✅ Novo e-mail de verificação enviado!
          </p>
        ) : resendStatus === "error" ? (
          <p className="text-sm text-red-600 dark:text-red-400">
            Não foi possível reenviar. Tente fazer login novamente.
          </p>
        ) : (
          <Button onClick={handleResend} disabled={resending} variant="outline" className="w-full">
            {resending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />Reenviando...</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" />Reenviar e-mail de verificação</>
            )}
          </Button>
        )}
        <div className="mt-4">
          <Link href="/login" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

  // Default: pending (user landed here without a token — e.g. after register)
  return (
    <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800 text-center">
      <div className="mb-4 flex justify-center">
        <MailOpen className="h-16 w-16 text-blue-500" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Confirme seu e-mail
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Enviamos um link de confirmação para o seu e-mail.
        Clique no link para ativar sua conta.
      </p>
      {resendStatus === "sent" ? (
        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
          ✅ Novo e-mail enviado! Verifique sua caixa de entrada.
        </p>
      ) : resendStatus === "error" ? (
        <p className="text-sm text-red-600 dark:text-red-400">
          Não foi possível reenviar. Verifique se você está logado.
        </p>
      ) : (
        <Button onClick={handleResend} disabled={resending} variant="outline" className="w-full">
          {resending ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" />Reenviando...</>
          ) : (
            <><RefreshCw className="h-4 w-4 mr-2" />Reenviar e-mail</>
          )}
        </Button>
      )}
      <div className="mt-4">
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          Ir para o Dashboard
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
