"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Presentation, ExternalLink, Trash2, BookOpen } from "lucide-react";
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

export default function BibliotecaPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

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
      <div className="flex items-center gap-3">
        <BookOpen className="h-7 w-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Biblioteca</h1>
      </div>

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
