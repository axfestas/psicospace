"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Shield, Calendar, Pencil, KeyRound, Check, X } from "lucide-react";

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
  const { user, refreshUser } = useAuth();

  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [nameError, setNameError] = useState("");
  const [nameSaving, setNameSaving] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
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
        setEditingName(false);
        showSuccess("Nome atualizado com sucesso!");
      }
    } catch {
      setNameError("Erro de conexão.");
    } finally {
      setNameSaving(false);
    }
  };

  const handleCancelName = () => {
    setName(user?.name || "");
    setNameError("");
    setEditingName(false);
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
        setChangingPassword(false);
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
    setChangingPassword(false);
  };

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Meu Perfil</h1>
        <p className="text-gray-500 dark:text-gray-400">Gerencie suas informações pessoais</p>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{successMessage}</span>
        </div>
      )}

      {/* Avatar & Role */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-white text-2xl font-bold flex-shrink-0">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{user.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              <span
                className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-medium ${roleBadgeColors[user.role] || ""}`}
              >
                {roleLabels[user.role] || user.role}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" />
            Informações da conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Nome completo
            </label>
            {editingName ? (
              <div className="mt-1 space-y-2">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                  autoFocus
                />
                {nameError && <p className="text-xs text-red-500">{nameError}</p>}
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveName} loading={nameSaving}>
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Salvar
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelName}>
                    <X className="h-3.5 w-3.5 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-1 flex items-center justify-between">
                <p className="text-sm text-gray-900 dark:text-gray-100">{user.name}</p>
                <button
                  onClick={() => { setName(user.name); setEditingName(true); }}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  <Pencil className="h-3 w-3" />
                  Editar
                </button>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* Email (read-only) */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              E-mail
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{user.email}</p>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* Role */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              Função
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {roleLabels[user.role] || user.role}
            </p>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* Member since */}
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Membro desde
            </label>
            <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {new Date(user.createdAt).toLocaleDateString("pt-BR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" />
            Alterar senha
          </CardTitle>
        </CardHeader>
        <CardContent>
          {changingPassword ? (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Senha atual</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nova senha</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirmar nova senha</label>
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
                  Alterar senha
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelPassword}>
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setChangingPassword(true)}>
              <KeyRound className="h-3.5 w-3.5 mr-1.5" />
              Alterar senha
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
