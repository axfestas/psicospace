"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import { DocumentViewerModal } from "@/components/ui/document-viewer-modal";
import { PdfPreview } from "@/components/ui/pdf-preview";

interface LibraryItem {
  id: string;
  title: string;
  description?: string;
  type: "PDF" | "SLIDE" | "LINK";
  url: string;
  thumbnailUrl?: string | null;
  createdAt: string;
  uploadedBy: { name: string };
}

export default function BibliotecaPage() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewer, setViewer] = useState<{ url: string; title: string; type: "PDF" | "SLIDE" | "LINK" } | null>(null);

  const loadItems = useCallback(async () => {
    const res = await fetch("/api/biblioteca");
    if (res.ok) {
      const data = await res.json();
      setItems(data.items || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadItems(); }, [loadItems]);

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
          <div className="pt-6 pb-6 text-center text-gray-500">
            {items.length === 0 ? "Nenhum item na biblioteca ainda." : "Nenhum resultado encontrado."}
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <Card key={item.id} className="flex flex-col overflow-hidden p-0">
              {/* Preview thumbnail — clickable */}
              <PdfPreview
                type={item.type}
                url={item.url}
                title={item.title}
                thumbnailUrl={item.thumbnailUrl}
                onClick={() => setViewer({ url: item.url, title: item.title, type: item.type })}
              />

              {/* Card body */}
              <div className="p-3 flex flex-col gap-1">
                <div className="flex items-start justify-between gap-1">
                  <button
                    onClick={() => setViewer({ url: item.url, title: item.title, type: item.type })}
                    className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:underline text-left leading-snug line-clamp-2"
                  >
                    {item.title}
                  </button>
                  {getTypeBadge(item.type)}
                </div>
                {item.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{item.description}</p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Por {item.uploadedBy.name}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {viewer && (
        <DocumentViewerModal
          url={viewer.url}
          title={viewer.title}
          type={viewer.type}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}
