"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mail, Shield, Calendar, Pencil, KeyRound, Check, X,
  MailOpen, RefreshCw, Loader2,
} from "lucide-react";

const roleLabels: Record<string, string> = {
  ESTUDANTE: "Estudante",
  DOCENTE: "Docente",
  ADMIN: "Administrador",
  SUPERADMIN: "Super Administrador",
};

const roleBadgeColors: Record<string, string> = {
  ESTUDANTE: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DOCENTE: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  ADMIN: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  SUPERADMIN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function PerfilPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [resendStatus, setResendStatus] = useState<"idle" | "sent" | "error">("idle");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setEmailVerified(data.user.emailVerified);
      })
      .catch(() => {});
  }, []);

  const handleResendVerification = async () => {
    setResendingVerification(true);
    try {
      const res = await fetch("/api/auth/resend-verification", { method: "POST" });
      setResendStatus(res.ok ? "sent" : "error");
    } catch {
      setResendStatus("error");
    } finally {
      setResendingVerification(false);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleOpenEdit = () => {
    setName(user?.name || "");
    setNameError("");
    setShowPasswordForm(false);
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setName(user?.name || "");
    setNameError("");
    setEditing(false);
  };

  const handleSaveName = async () => {
    setNameError("");
    if (!name.trim() || name.trim().length < 2) {
      setNameError("Nome deve ter pelo menos 2 caracteres.");
      return;
    }
    setNameSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNameError(data.error || "Erro ao salvar nome.");
      } else {
        await refreshUser();
        setEditing(false);
        showSuccess("Perfil atualizado com sucesso!");
      }
    } catch {
      setNameError("Erro de conexão.");
    } finally {
      setNameSaving(false);
    }
  };

  const handleSavePassword = async () => {
    setPasswordError("");
    if (!currentPassword) {
      setPasswordError("Informe a senha atual.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem.");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: user?.name, currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "Erro ao alterar senha.");
      } else {
        setShowPasswordForm(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        showSuccess("Senha alterada com sucesso!");
      }
    } catch {
      setPasswordError("Erro de conexão.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleCancelPassword = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setShowPasswordForm(false);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    router.replace("/login");
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("pt-BR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div className="max-w-xl mx-auto space-y-4">
      {/* Success toast */}
      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{successMessage}</span>
        </div>
      )}

      {/* Email verification banner */}
      {emailVerified === false && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <MailOpen className="h-4 w-4 flex-shrink-0" />
            <span className="text-sm font-medium">
              Seu e-mail ainda não foi confirmado. Verifique sua caixa de entrada.
            </span>
          </div>
          {resendStatus === "sent" ? (
            <span className="text-sm text-green-600 dark:text-green-400 font-medium whitespace-nowrap">✅ E-mail enviado!</span>
          ) : resendStatus === "error" ? (
            <span className="text-sm text-red-600 dark:text-red-400 whitespace-nowrap">Erro ao enviar.</span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleResendVerification}
              disabled={resendingVerification}
              className="flex-shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/30"
            >
              {resendingVerification
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Enviando...</>
                : <><RefreshCw className="h-3.5 w-3.5 mr-1.5" />Reenviar</>}
            </Button>
          )}
        </div>
      )}

      {/* Profile card */}
      <Card className="overflow-hidden">
        {/* Cover banner */}
        <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-700 dark:from-blue-700 dark:to-blue-900" />

        <CardContent className="pt-0 px-6 pb-6">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-white text-2xl font-bold ring-4 ring-white dark:ring-gray-900 flex-shrink-0">
              {initials}
            </div>
            {!editing && (
              <Button size="sm" variant="outline" onClick={handleOpenEdit} className="mb-1">
                <Pencil className="h-3.5 w-3.5 mr-1.5" />
                Editar perfil
              </Button>
            )}
          </div>

          {/* Name + role */}
          <div className="mb-5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user.name}</h2>
            <span
              className={`mt-1.5 inline-block rounded-full px-3 py-0.5 text-xs font-medium ${roleBadgeColors[user.role] || ""}`}
            >
              {roleLabels[user.role] || user.role}
            </span>
          </div>

          {/* Info rows */}
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Shield className="h-4 w-4 flex-shrink-0" />
              <span>{roleLabels[user.role] || user.role}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>Membro desde {memberSince}</span>
            </div>
          </div>

          {/* Edit form */}
          {editing && (
            <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Editar perfil</h3>

              {/* Name field */}
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Nome completo
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="mt-1"
                  autoFocus
                />
                {nameError && <p className="mt-1 text-xs text-red-500">{nameError}</p>}
              </div>

              {/* Change password toggle */}
              {!showPasswordForm ? (
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(true)}
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Alterar senha
                </button>
              ) : (
                <div className="space-y-3 rounded-lg border border-gray-100 dark:border-gray-800 p-4">
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5" />
                    Alterar senha
                  </h4>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Senha atual</label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Nova senha</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Confirmar nova senha</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="mt-1"
                    />
                  </div>
                  {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSavePassword} loading={passwordSaving}>
                      <Check className="h-3.5 w-3.5 mr-1" />
                      Alterar
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancelPassword}>
                      <X className="h-3.5 w-3.5 mr-1" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {/* Save / cancel edit */}
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={handleSaveName} loading={nameSaving}>
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Salvar
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
