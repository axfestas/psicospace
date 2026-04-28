"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserRoleBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  Trash2, Edit2, Check, X, Users, BookOpen, ShieldCheck,
  CheckCircle2, Clock, AlertCircle, Database, RefreshCw, Play,
  Plus, GraduationCap, Send, BellRing,
} from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface Period {
  id: string;
  name: string;
  order: number;
  disciplines: { id: string; name: string }[];
}

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

type Tab = "usuarios" | "periodos" | "disciplinas" | "migracoes";

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("usuarios");

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadUsersError, setLoadUsersError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "" });

  const [periods, setPeriods] = useState<Period[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [newPeriod, setNewPeriod] = useState({ name: "", order: "" });
  const [addingPeriod, setAddingPeriod] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<Period | null>(null);
  const [editPeriodForm, setEditPeriodForm] = useState({ name: "", order: "" });
  const [newDiscipline, setNewDiscipline] = useState({ name: "", description: "", periodId: "" });
  const [addingDiscipline, setAddingDiscipline] = useState(false);
  const [editingDiscipline, setEditingDiscipline] = useState<{ id: string; name: string; description?: string; periodId: string } | null>(null);
  const [editDisciplineForm, setEditDisciplineForm] = useState({ name: "", description: "", periodId: "" });

  const [migrationsData, setMigrationsData] = useState<MigrationsData | null>(null);
  const [loadingMigrations, setLoadingMigrations] = useState(false);
  const [applyingMigrations, setApplyingMigrations] = useState(false);
  const [applyResults, setApplyResults] = useState<ApplyResult[] | null>(null);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);

  // ── Test-delivery state (separated by type) ──
  type TestType = "email_welcome" | "email_verification" | "email_reset" | "email_pending" | "notification";
  const [testEmail, setTestEmail] = useState("");
  const [testingType, setTestingType] = useState<TestType | null>(null);
  type TestResult = { message: string; success: boolean; detail?: string | null; targetEmail?: string | null };
  const [emailResults, setEmailResults] = useState<Partial<Record<TestType, TestResult>>>({});
  const [notifResult, setNotifResult] = useState<TestResult | null>(null);

  const isSuperAdmin = currentUser?.role === "SUPERADMIN";

  const loadUsers = useCallback(async () => {
    setLoadUsersError(null);
    try {
      const res = await fetch("/api/users", {
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        const data = await res.json().catch(() => ({}));
        if (process.env.NODE_ENV === "development") {
          console.error("[admin/loadUsers] status", res.status, data);
        }
        setLoadUsersError(data.error || `Erro ao carregar usuáries (${res.status})`);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[admin/loadUsers] network error", err);
      }
      setLoadUsersError("Não foi possível carregar usuáries. Verifique a conexão.");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const loadPeriods = useCallback(async () => {
    setLoadingPeriods(true);
    const res = await fetch("/api/periods");
    if (res.ok) {
      const data = await res.json();
      setPeriods(data.periods || []);
    }
    setLoadingPeriods(false);
  }, []);

  useEffect(() => {
    if (activeTab === "periodos" || activeTab === "disciplinas") loadPeriods();
  }, [activeTab, loadPeriods]);

  const loadMigrations = useCallback(async () => {
    if (!isSuperAdmin) return;
    setLoadingMigrations(true);
    setApplyResults(null);
    setApplyMessage(null);
    try {
      const res = await fetch("/api/admin/migrations");
      if (res.ok) setMigrationsData(await res.json());
    } finally {
      setLoadingMigrations(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (activeTab === "migracoes") loadMigrations();
  }, [activeTab, loadMigrations]);

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email, role: user.role });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    const res = await fetch(`/api/admin/users/${editingUser.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) { setEditingUser(null); loadUsers(); }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuárie?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    loadUsers();
  };

  const handleAddPeriod = async () => {
    const order = parseInt(newPeriod.order, 10);
    if (!newPeriod.name || isNaN(order)) return;
    const res = await fetch("/api/periods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newPeriod.name, order }),
    });
    if (res.ok) {
      setNewPeriod({ name: "", order: "" });
      setAddingPeriod(false);
      loadPeriods();
    }
  };

  const handleDeletePeriod = async (id: string) => {
    if (!confirm("Excluir este período e todas as suas disciplinas?")) return;
    await fetch(`/api/periods/${id}`, { method: "DELETE" });
    loadPeriods();
  };

  const handleAddDiscipline = async () => {
    if (!newDiscipline.name || !newDiscipline.periodId) return;
    const res = await fetch(`/api/periods/${newDiscipline.periodId}/disciplines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newDiscipline.name, description: newDiscipline.description }),
    });
    if (res.ok) {
      setNewDiscipline({ name: "", description: "", periodId: "" });
      setAddingDiscipline(false);
      loadPeriods();
    }
  };

  const handleDeleteDiscipline = async (id: string) => {
    if (!confirm("Excluir esta disciplina e todos os seus materiais?")) return;
    await fetch(`/api/disciplines/${id}`, { method: "DELETE" });
    loadPeriods();
  };

  const handleEditPeriod = (period: Period) => {
    setEditingPeriod(period);
    setEditPeriodForm({ name: period.name, order: String(period.order) });
  };

  const handleSaveEditPeriod = async () => {
    if (!editingPeriod) return;
    const order = parseInt(editPeriodForm.order, 10);
    if (!editPeriodForm.name || isNaN(order)) return;
    const res = await fetch(`/api/periods/${editingPeriod.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: editPeriodForm.name, order }),
    });
    if (res.ok) { setEditingPeriod(null); loadPeriods(); }
  };

  const handleEditDiscipline = (discipline: { id: string; name: string; description?: string }, periodId: string) => {
    setEditingDiscipline({ ...discipline, description: discipline.description ?? "", periodId });
    setEditDisciplineForm({ name: discipline.name, description: discipline.description ?? "", periodId });
  };

  const handleSaveEditDiscipline = async () => {
    if (!editingDiscipline) return;
    if (!editDisciplineForm.name || !editDisciplineForm.periodId) return;
    const res = await fetch(`/api/disciplines/${editingDiscipline.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: editDisciplineForm.name,
        description: editDisciplineForm.description,
        periodId: editDisciplineForm.periodId,
      }),
    });
    if (res.ok) { setEditingDiscipline(null); loadPeriods(); }
  };

  const handleApplyMigrations = async () => {
    if (!confirm("Aplicar todas as migrações pendentes? Esta ação não pode ser desfeita.")) return;
    setApplyingMigrations(true);
    setApplyResults(null);
    setApplyMessage(null);
    try {
      const res = await fetch("/api/admin/migrations", { method: "POST" });
      const json = await res.json();
      setApplyMessage(json.message ?? null);
      setApplyResults(json.applied ?? null);
      await loadMigrations();
    } finally {
      setApplyingMigrations(false);
    }
  };

  const runEmailTest = async (type: TestType) => {
    setTestingType(type);
    setEmailResults((prev) => ({ ...prev, [type]: undefined }));
    try {
      const res = await fetch("/api/admin/migrations/test-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testType: type, email: testEmail.trim() || undefined }),
      });
      const json = await res.json();
      if (res.ok) {
        setEmailResults((prev) => ({
          ...prev,
          [type]: {
            success: Boolean(json.emailSent),
            message: json.message ?? "Concluído.",
            detail: json.emailError ?? null,
            targetEmail: json.targetEmail ?? null,
          },
        }));
      } else {
        setEmailResults((prev) => ({
          ...prev,
          [type]: { success: false, message: json.error ?? "Falha.", detail: null },
        }));
      }
    } finally {
      setTestingType(null);
    }
  };

  const runNotificationTest = async () => {
    setTestingType("notification");
    setNotifResult(null);
    try {
      const res = await fetch("/api/admin/migrations/test-delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testType: "notification" }),
      });
      const json = await res.json();
      if (res.ok) {
        setNotifResult({ success: true, message: json.message ?? "Notificação criada." });
      } else {
        setNotifResult({ success: false, message: json.error ?? "Falha ao criar notificação." });
      }
    } finally {
      setTestingType(null);
    }
  };

  const estudantes = users.filter((u) => u.role === "ESTUDANTE").length;
  const docentes = users.filter((u) => u.role === "DOCENTE").length;
  const admins = users.filter((u) => ["ADMIN", "SUPERADMIN"].includes(u.role)).length;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "usuarios", label: "Usuáries", icon: <Users className="h-4 w-4" /> },
    { id: "periodos", label: "Períodos", icon: <BookOpen className="h-4 w-4" /> },
    { id: "disciplinas", label: "Disciplinas", icon: <GraduationCap className="h-4 w-4" /> },
    ...(isSuperAdmin ? [{ id: "migracoes" as Tab, label: "Migrações", icon: <Database className="h-4 w-4" /> }] : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Painel de Administração
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Gerencie usuáries e configurações do sistema
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{estudantes}</p>
                <p className="text-sm text-gray-500">Estudantes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
                <BookOpen className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{docentes}</p>
                <p className="text-sm text-gray-500">Docentes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
                <ShieldCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{admins}</p>
                <p className="text-sm text-gray-500">Administradories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-1 flex-wrap border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? "bg-white dark:bg-gray-900 border border-b-white dark:border-gray-700 dark:border-b-gray-900 text-blue-600 dark:text-blue-400 -mb-px"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "usuarios" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Usuáries ({users.length})</CardTitle>
              <Button size="sm" variant="outline" onClick={() => { setLoadingUsers(true); loadUsers(); }} disabled={loadingUsers}>
                <RefreshCw className={`h-4 w-4 mr-1 ${loadingUsers ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingUsers ? (
              <div className="flex items-center justify-center h-32">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : loadUsersError ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <AlertCircle className="h-8 w-8 text-red-500" />
                <p className="text-sm text-red-600 dark:text-red-400">{loadUsersError}</p>
                <Button size="sm" variant="outline" onClick={() => { setLoadingUsers(true); loadUsers(); }}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Tentar novamente
                </Button>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-gray-500">
                <Users className="h-8 w-8 opacity-40" />
                <p className="text-sm">Nenhume usuárie cadastrade ainda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3 text-left font-semibold text-gray-500 dark:text-gray-400">Nome</th>
                      <th className="pb-3 text-left font-semibold text-gray-500 dark:text-gray-400">Email</th>
                      <th className="pb-3 text-left font-semibold text-gray-500 dark:text-gray-400">Papel</th>
                      <th className="pb-3 text-left font-semibold text-gray-500 dark:text-gray-400">Cadastro</th>
                      <th className="pb-3 text-left font-semibold text-gray-500 dark:text-gray-400">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-50 dark:border-gray-800 last:border-0">
                        {editingUser?.id === user.id ? (
                          <>
                            <td className="py-3 pr-3">
                              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="h-8 text-xs" />
                            </td>
                            <td className="py-3 pr-3">
                              <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="h-8 text-xs" />
                            </td>
                            <td className="py-3 pr-3">
                              <select
                                value={editForm.role}
                                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                className="h-8 rounded border border-gray-300 px-2 text-xs dark:border-gray-600 dark:bg-gray-800"
                              >
                                <option value="ESTUDANTE">Estudante</option>
                                <option value="DOCENTE">Docente</option>
                                <option value="ADMIN">Admin</option>
                                {currentUser?.role === "SUPERADMIN" && (
                                  <option value="SUPERADMIN">Super Admin</option>
                                )}
                              </select>
                            </td>
                            <td className="py-3 text-gray-500">{formatDate(user.createdAt)}</td>
                            <td className="py-3">
                              <div className="flex gap-1">
                                <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-700 p-1"><Check className="h-4 w-4" /></button>
                                <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600 p-1"><X className="h-4 w-4" /></button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 pr-3 font-medium text-gray-900 dark:text-gray-100">{user.name}</td>
                            <td className="py-3 pr-3 text-gray-500">{user.email}</td>
                            <td className="py-3 pr-3"><UserRoleBadge role={user.role} /></td>
                            <td className="py-3 pr-3 text-gray-500">{formatDate(user.createdAt)}</td>
                            <td className="py-3">
                              <div className="flex gap-1">
                                <button onClick={() => handleEditUser(user)} className="text-gray-400 hover:text-blue-600 p-1"><Edit2 className="h-4 w-4" /></button>
                                {currentUser?.id !== user.id && (
                                  <button onClick={() => handleDeleteUser(user.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="h-4 w-4" /></button>
                                )}
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "periodos" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Períodos</h2>
            <Button onClick={() => setAddingPeriod((v) => !v)} className="gap-2" size="sm">
              <Plus className="h-4 w-4" />
              Novo período
            </Button>
          </div>

          {addingPeriod && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome do período (ex: 1º Semestre)"
                    value={newPeriod.name}
                    onChange={(e) => setNewPeriod({ ...newPeriod, name: e.target.value })}
                  />
                  <Input
                    placeholder="Ordem"
                    type="number"
                    value={newPeriod.order}
                    onChange={(e) => setNewPeriod({ ...newPeriod, order: e.target.value })}
                    className="w-28"
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddPeriod} disabled={!newPeriod.name || !newPeriod.order}>
                    Criar período
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setAddingPeriod(false); setNewPeriod({ name: "", order: "" }); }}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loadingPeriods ? (
            <div className="flex items-center justify-center h-32">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : periods.length === 0 ? (
            <Card><CardContent className="pt-6 text-center text-gray-500">Nenhum período criado.</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {periods.map((period) => (
                <Card key={period.id}>
                  <CardContent className="pt-4 pb-4">
                    {editingPeriod?.id === period.id ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={editPeriodForm.name}
                            onChange={(e) => setEditPeriodForm({ ...editPeriodForm, name: e.target.value })}
                            className="h-8 text-sm"
                            placeholder="Nome do período"
                          />
                          <Input
                            value={editPeriodForm.order}
                            onChange={(e) => setEditPeriodForm({ ...editPeriodForm, order: e.target.value })}
                            className="h-8 text-sm w-24"
                            type="number"
                            placeholder="Ordem"
                          />
                        </div>
                        <div className="flex gap-1">
                          <button onClick={handleSaveEditPeriod} className="text-green-600 hover:text-green-700 p-1"><Check className="h-4 w-4" /></button>
                          <button onClick={() => setEditingPeriod(null)} className="text-gray-400 hover:text-gray-600 p-1"><X className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{period.name}</p>
                          <p className="text-xs text-gray-500">Ordem: {period.order} · {period.disciplines.length} disciplinas</p>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleEditPeriod(period)} className="text-gray-400 hover:text-blue-600 p-1"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => handleDeletePeriod(period.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "disciplinas" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Disciplinas</h2>
            <Button onClick={() => setAddingDiscipline((v) => !v)} className="gap-2" size="sm">
              <Plus className="h-4 w-4" />
              Nova disciplina
            </Button>
          </div>

          {addingDiscipline && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <select
                  value={newDiscipline.periodId}
                  onChange={(e) => setNewDiscipline({ ...newDiscipline, periodId: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">Selecione o período</option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <Input
                  placeholder="Nome da disciplina"
                  value={newDiscipline.name}
                  onChange={(e) => setNewDiscipline({ ...newDiscipline, name: e.target.value })}
                />
                <Input
                  placeholder="Descrição (opcional)"
                  value={newDiscipline.description}
                  onChange={(e) => setNewDiscipline({ ...newDiscipline, description: e.target.value })}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddDiscipline} disabled={!newDiscipline.name || !newDiscipline.periodId}>
                    Criar disciplina
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setAddingDiscipline(false); setNewDiscipline({ name: "", description: "", periodId: "" }); }}>
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {loadingPeriods ? (
            <div className="flex items-center justify-center h-32">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          ) : periods.length === 0 ? (
            <Card><CardContent className="pt-6 text-center text-gray-500">Crie períodos primeiro.</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {periods.map((period) => (
                <div key={period.id}>
                  <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-2 px-1">{period.name}</p>
                  {period.disciplines.length === 0 ? (
                    <p className="text-xs text-gray-400 px-1">Nenhuma disciplina ainda.</p>
                  ) : (
                    <div className="space-y-2">
                      {period.disciplines.map((discipline) => (
                        <Card key={discipline.id}>
                          <CardContent className="pt-3 pb-3">
                            {editingDiscipline?.id === discipline.id ? (
                              <div className="space-y-2">
                                <Input
                                  value={editDisciplineForm.name}
                                  onChange={(e) => setEditDisciplineForm({ ...editDisciplineForm, name: e.target.value })}
                                  className="h-8 text-sm"
                                  placeholder="Nome da disciplina"
                                />
                                <Input
                                  value={editDisciplineForm.description}
                                  onChange={(e) => setEditDisciplineForm({ ...editDisciplineForm, description: e.target.value })}
                                  className="h-8 text-sm"
                                  placeholder="Descrição (opcional)"
                                />
                                <select
                                  value={editDisciplineForm.periodId}
                                  onChange={(e) => setEditDisciplineForm({ ...editDisciplineForm, periodId: e.target.value })}
                                  className="flex h-8 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                >
                                  {periods.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </select>
                                <div className="flex gap-1">
                                  <button onClick={handleSaveEditDiscipline} className="text-green-600 hover:text-green-700 p-1"><Check className="h-4 w-4" /></button>
                                  <button onClick={() => setEditingDiscipline(null)} className="text-gray-400 hover:text-gray-600 p-1"><X className="h-4 w-4" /></button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">{discipline.name}</p>
                                <div className="flex gap-1">
                                  <button onClick={() => handleEditDiscipline(discipline, period.id)} className="text-gray-400 hover:text-blue-600 p-1"><Edit2 className="h-4 w-4" /></button>
                                  <button onClick={() => handleDeleteDiscipline(discipline.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 className="h-4 w-4" /></button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "migracoes" && isSuperAdmin && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Migrações do Banco de Dados</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={loadMigrations} disabled={loadingMigrations || applyingMigrations} className="gap-2" size="sm">
                <RefreshCw className={`h-4 w-4 ${loadingMigrations ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              {migrationsData && migrationsData.pendingCount > 0 && (
                <Button onClick={handleApplyMigrations} disabled={applyingMigrations || loadingMigrations} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                  <Play className={`h-4 w-4 ${applyingMigrations ? "animate-pulse" : ""}`} />
                  {applyingMigrations ? "Aplicando..." : `Aplicar ${migrationsData.pendingCount} pendente${migrationsData.pendingCount !== 1 ? "s" : ""}`}
                </Button>
              )}
            </div>
          </div>

          {applyMessage && (
            <div className={`flex items-start gap-3 rounded-lg border p-4 ${applyResults?.some((r) => !r.success) ? "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400" : "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"}`}>
              {applyResults?.some((r) => !r.success) ? <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" /> : <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />}
              <div className="space-y-1">
                <p className="font-medium">{applyMessage}</p>
                {applyResults?.map((r) => (
                  <p key={r.name} className="text-sm"><span className="font-mono">{r.name}</span>{r.error ? ` — ${r.error}` : ""}</p>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30"><Database className="h-6 w-6 text-blue-600 dark:text-blue-400" /></div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{migrationsData?.migrations.length ?? "—"}</p>
                    <p className="text-sm text-gray-500">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/30"><CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" /></div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{migrationsData ? migrationsData.migrations.filter((m) => m.applied).length : "—"}</p>
                    <p className="text-sm text-gray-500">Aplicadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className={`rounded-lg p-3 ${(migrationsData?.pendingCount ?? 0) > 0 ? "bg-orange-100 dark:bg-orange-900/30" : "bg-gray-100 dark:bg-gray-800"}`}>
                    <Clock className={`h-6 w-6 ${(migrationsData?.pendingCount ?? 0) > 0 ? "text-orange-600 dark:text-orange-400" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{migrationsData?.pendingCount ?? "—"}</p>
                    <p className="text-sm text-gray-500">Pendentes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Teste de E-mail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">
                Escolha um tipo de e-mail e clique no botão para enviar um teste. O e-mail será enviado para o endereço informado abaixo (ou para o seu e-mail de conta se deixado em branco).
              </p>
              <Input
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="E-mail de destino para teste (opcional)"
                className="max-w-md"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { type: "email_welcome" as const, label: "Boas-vindas / Verificação", icon: <Send className="h-3.5 w-3.5" />, description: "E-mail enviado no cadastro com link de confirmação." },
                    { type: "email_reset" as const, label: "Redefinição de senha", icon: <Send className="h-3.5 w-3.5" />, description: "E-mail enviado ao solicitar nova senha." },
                    { type: "email_pending" as const, label: "Lembrete de pendências", icon: <Send className="h-3.5 w-3.5" />, description: "Resumo de tarefas atrasadas e eventos próximos." },
                  ] as const
                ).map(({ type, label, icon, description }) => {
                  const result = emailResults[type];
                  const isRunning = testingType === type;
                  return (
                    <div key={type} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{label}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runEmailTest(type)}
                          disabled={testingType !== null}
                          className="flex-shrink-0 gap-1.5"
                        >
                          {icon}
                          {isRunning ? "Enviando…" : "Testar"}
                        </Button>
                      </div>
                      {result && (
                        <div className={`rounded px-2.5 py-1.5 text-xs ${result.success ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"}`}>
                          <span className="font-medium">{result.success ? "✓" : "✗"}</span> {result.message}
                          {result.targetEmail && <span className="ml-1 opacity-75">→ {result.targetEmail}</span>}
                          {result.detail && <div className="mt-1 opacity-80">{result.detail}</div>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Teste de Notificação In-App</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-500">
                Cria uma notificação de teste que aparece no sininho de notificações do seu usuário.
              </p>
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={runNotificationTest}
                  disabled={testingType !== null}
                  className="gap-2"
                >
                  <BellRing className="h-4 w-4" />
                  {testingType === "notification" ? "Criando…" : "Criar notificação de teste"}
                </Button>
                {notifResult && (
                  <span className={`text-sm font-medium ${notifResult.success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    {notifResult.success ? "✓" : "✗"} {notifResult.message}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Histórico de Migrações</CardTitle></CardHeader>
            <CardContent>
              {loadingMigrations ? (
                <div className="flex items-center justify-center h-32">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                </div>
              ) : !migrationsData || migrationsData.migrations.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma migração encontrada.</p>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {migrationsData.migrations.map((migration) => (
                    <div key={migration.name} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        {migration.applied ? <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500" /> : <Clock className="h-5 w-5 flex-shrink-0 text-orange-400" />}
                        <div>
                          <p className="font-mono text-sm font-medium text-gray-900 dark:text-gray-100">{migration.name}</p>
                          {migration.appliedAt && (
                            <p className="text-xs text-gray-500">Aplicada em {new Date(migration.appliedAt + "Z").toLocaleString("pt-BR")}</p>
                          )}
                        </div>
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${migration.applied ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"}`}>
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
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Como adicionar novas migrações</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-amber-700 dark:text-amber-400">
                    <li>Atualize o schema em <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">prisma/schema.prisma</code></li>
                    <li>Gere a migração com <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">npx prisma migrate diff</code> ou crie o SQL manualmente</li>
                    <li>Adicione o SQL no array <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">MIGRATIONS</code> em <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">src/lib/migrate.ts</code></li>
                    <li>Faça o deploy e aplique a migração aqui nesta aba</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
