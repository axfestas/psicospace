"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sun, Moon, Palette, KeyRound, Mail, Check, X, Loader2 } from "lucide-react";

export default function ConfiguracoesPage() {
  const { theme, toggleTheme } = useTheme();
  const { user, refreshUser } = useAuth();

  const [successMessage, setSuccessMessage] = useState("");
  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // Change password
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPasswordPwd, setCurrentPasswordPwd] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);

  const handleSavePassword = async () => {
    setPasswordError("");
    if (!currentPasswordPwd) { setPasswordError("Informe a senha atual."); return; }
    if (newPassword.length < 6) { setPasswordError("Nova senha deve ter pelo menos 6 caracteres."); return; }
    if (newPassword !== confirmPassword) { setPasswordError("As senhas não coincidem."); return; }
    setPasswordSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPasswordPwd, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error || "Erro ao alterar senha.");
      } else {
        setShowPasswordForm(false);
        setCurrentPasswordPwd(""); setNewPassword(""); setConfirmPassword("");
        showSuccess("Senha alterada com sucesso!");
      }
    } catch { setPasswordError("Erro de conexão."); }
    finally { setPasswordSaving(false); }
  };

  const handleCancelPassword = () => {
    setCurrentPasswordPwd(""); setNewPassword(""); setConfirmPassword("");
    setPasswordError(""); setShowPasswordForm(false);
  };

  // Change email
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [currentPasswordEmail, setCurrentPasswordEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);

  const handleSaveEmail = async () => {
    setEmailError("");
    if (!newEmail || !newEmail.includes("@") || !newEmail.slice(newEmail.lastIndexOf("@") + 1).includes(".")) { setEmailError("E-mail inválido."); return; }
    if (!currentPasswordEmail) { setEmailError("Informe a senha atual para confirmar."); return; }
    setEmailSaving(true);
    try {
      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newEmail, currentPassword: currentPasswordEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailError(data.error || "Erro ao alterar e-mail.");
      } else {
        await refreshUser();
        setShowEmailForm(false);
        setNewEmail(""); setCurrentPasswordEmail("");
        showSuccess("E-mail alterado! Verifique sua nova caixa de entrada.");
      }
    } catch { setEmailError("Erro de conexão."); }
    finally { setEmailSaving(false); }
  };

  const handleCancelEmail = () => {
    setNewEmail(""); setCurrentPasswordEmail(""); setEmailError(""); setShowEmailForm(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configurações</h1>
        <p className="text-gray-500 dark:text-gray-400">Personalize sua experiência no PsicoSpace</p>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{successMessage}</span>
        </div>
      )}

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />
            Aparência
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tema</p>
            <div className="flex gap-3">
              <button
                onClick={() => theme === "dark" && toggleTheme()}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors w-32 ${
                  theme === "light"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <Sun className="h-6 w-6 text-amber-500" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Claro</span>
                {theme === "light" && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Ativo</span>
                )}
              </button>

              <button
                onClick={() => theme === "light" && toggleTheme()}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors w-32 ${
                  theme === "dark"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
                  <Moon className="h-6 w-6 text-indigo-300" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Escuro</span>
                {theme === "dark" && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Ativo</span>
                )}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" />
            Conta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current email info */}
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Mail className="h-4 w-4 flex-shrink-0" />
            <span>{user?.email}</span>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* Change password */}
          {!showPasswordForm ? (
            <button
              type="button"
              onClick={() => { setShowPasswordForm(true); setShowEmailForm(false); }}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
            >
              <KeyRound className="h-4 w-4" />
              Alterar senha
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Alterar senha</p>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Senha atual</label>
                <Input type="password" value={currentPasswordPwd} onChange={(e) => setCurrentPasswordPwd(e.target.value)} placeholder="••••••••" className="mt-1" autoFocus />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Nova senha</label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="mt-1" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Confirmar nova senha</label>
                <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" className="mt-1" />
              </div>
              {passwordError && <p className="text-xs text-red-500">{passwordError}</p>}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSavePassword} loading={passwordSaving}>
                  <Check className="h-3.5 w-3.5 mr-1" />Salvar
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelPassword}>
                  <X className="h-3.5 w-3.5 mr-1" />Cancelar
                </Button>
              </div>
            </div>
          )}

          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* Change email */}
          {!showEmailForm ? (
            <button
              type="button"
              onClick={() => { setShowEmailForm(true); setShowPasswordForm(false); }}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
            >
              <Mail className="h-4 w-4" />
              Alterar e-mail
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Alterar e-mail</p>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Novo e-mail</label>
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="novo@email.com" className="mt-1" autoFocus />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Confirme com sua senha atual</label>
                <Input type="password" value={currentPasswordEmail} onChange={(e) => setCurrentPasswordEmail(e.target.value)} placeholder="••••••••" className="mt-1" />
              </div>
              {emailError && <p className="text-xs text-red-500">{emailError}</p>}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveEmail} loading={emailSaving}>
                  <Check className="h-3.5 w-3.5 mr-1" />Salvar
                </Button>
                <Button size="sm" variant="outline" onClick={handleCancelEmail}>
                  <X className="h-3.5 w-3.5 mr-1" />Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
