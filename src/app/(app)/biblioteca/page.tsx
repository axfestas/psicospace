"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Presentation, ExternalLink, Plus, Trash2, Upload, BookOpen } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface LibraryItem {
  id: string;
  title: string;
  description?: string;
  type: "PDF" | "SLIDE" | "LINK";
  url: string;
  createdAt: string;
  uploadedBy: { name: string };
}

const FILE_ACCEPT: Record<"PDF" | "SLIDE", string> = {
  PDF: ".pdf,application/pdf",
  SLIDE:
    ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export default function BibliotecaPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", type: "LINK" as "PDF" | "SLIDE" | "LINK", url: "" });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDocente = user && ["DOCENTE", "ADMIN", "SUPERADMIN"].includes(user.role);

  const loadItems = useCallback(async () => {
    const res = await fetch("/api/biblioteca");
    if (res.ok) {
      const data = await res.json();
      setItems(data.items || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      setForm((prev) => ({ ...prev, url: data.url }));
    } else {
      const data = await res.json().catch(() => ({}));
      setUploadError(data.error ?? "Falha ao enviar arquivo.");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAdd = async () => {
    const res = await fetch("/api/biblioteca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowAdd(false);
      setForm({ title: "", description: "", type: "LINK", url: "" });
      loadItems();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este item da biblioteca?")) return;
    await fetch(`/api/biblioteca/${id}`, { method: "DELETE" });
    loadItems();
  };

  const getTypeIcon = (type: string) => {
    if (type === "PDF") return <FileText className="h-5 w-5 text-red-500" />;
    if (type === "SLIDE") return <Presentation className="h-5 w-5 text-orange-500" />;
    return <ExternalLink className="h-5 w-5 text-blue-500" />;
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "danger" | "warning" | "info"> = {
      PDF: "danger",
      SLIDE: "warning",
      LINK: "info",
    };
    return <Badge variant={variants[type] || "default"}>{type}</Badge>;
  };

  const filtered = items.filter(
    (it) =>
      it.title.toLowerCase().includes(search.toLowerCase()) ||
      (it.description ?? "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <BookOpen className="h-7 w-7 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Biblioteca</h1>
        </div>
        {isDocente && (
          <Button onClick={() => setShowAdd((v) => !v)} className="gap-2">
            <Plus className="h-4 w-4" />
            Adicionar item
          </Button>
        )}
      </div>

      {showAdd && (
        <Card>
          <CardHeader>
            <CardTitle>Novo item na Biblioteca</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Título"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <Input
              placeholder="Descrição (opcional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="flex gap-2">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as "PDF" | "SLIDE" | "LINK", url: "" })}
                className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="LINK">Link</option>
                <option value="PDF">PDF</option>
                <option value="SLIDE">Slide</option>
              </select>
              {form.type === "LINK" ? (
                <Input
                  placeholder="URL"
                  value={form.url}
                  onChange={(e) => setForm({ ...form, url: e.target.value })}
                />
              ) : (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={form.type === "PDF" || form.type === "SLIDE" ? FILE_ACCEPT[form.type] : undefined}
                    onChange={handleFileUpload}
                    className="hidden"
                    id="lib-file-upload"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    {uploading ? "Enviando..." : "Escolher arquivo"}
                  </Button>
                  {form.url && !uploadError && (
                    <span className="text-xs text-green-600 dark:text-green-400">✓ Enviado</span>
                  )}
                  {uploadError && (
                    <span className="text-xs text-red-600 dark:text-red-400">{uploadError}</span>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={uploading || !form.url || !form.title}>
                Salvar
              </Button>
              <Button
                variant="outline"
                onClick={() => { setShowAdd(false); setForm({ title: "", description: "", type: "LINK", url: "" }); }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Input
        placeholder="Buscar na biblioteca..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            {items.length === 0 ? "Nenhum item na biblioteca ainda." : "Nenhum resultado encontrado."}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <Card key={item.id} className="flex flex-col">
              <CardContent className="pt-4 flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {getTypeIcon(item.type)}
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gray-900 dark:text-gray-100 hover:underline truncate"
                    >
                      {item.title}
                    </a>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {getTypeBadge(item.type)}
                    {isDocente && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-gray-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                {item.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                )}
                <p className="text-xs text-gray-400">por {item.uploadedBy.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
