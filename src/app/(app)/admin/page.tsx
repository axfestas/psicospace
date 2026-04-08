"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserRoleBadge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Trash2, Edit2, Check, X, Users, BookOpen, ShieldCheck } from "lucide-react";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "" });

  const loadUsers = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleEdit = (user: AdminUser) => {
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
    if (res.ok) {
      setEditingUser(null);
      loadUsers();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    loadUsers();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const estudantes = users.filter((u) => u.role === "ESTUDANTE").length;
  const docentes = users.filter((u) => u.role === "DOCENTE").length;
  const admins = users.filter((u) => ["ADMIN", "SUPERADMIN"].includes(u.role)).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Painel de Administração
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Gerencie usuários e configurações do sistema
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
                <p className="text-sm text-gray-500">Administradores</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
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
                          <Input
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="h-8 text-xs"
                          />
                        </td>
                        <td className="py-3 pr-3">
                          <Input
                            value={editForm.email}
                            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                            className="h-8 text-xs"
                          />
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
                            <button onClick={handleSaveEdit} className="text-green-600 hover:text-green-700 p-1">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600 p-1">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 pr-3 font-medium text-gray-900 dark:text-gray-100">{user.name}</td>
                        <td className="py-3 pr-3 text-gray-500">{user.email}</td>
                        <td className="py-3 pr-3">
                          <UserRoleBadge role={user.role} />
                        </td>
                        <td className="py-3 pr-3 text-gray-500">{formatDate(user.createdAt)}</td>
                        <td className="py-3">
                          <div className="flex gap-1">
                            <button onClick={() => handleEdit(user)} className="text-gray-400 hover:text-blue-600 p-1">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            {currentUser?.id !== user.id && (
                              <button onClick={() => handleDelete(user.id)} className="text-gray-400 hover:text-red-500 p-1">
                                <Trash2 className="h-4 w-4" />
                              </button>
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
        </CardContent>
      </Card>
    </div>
  );
}
