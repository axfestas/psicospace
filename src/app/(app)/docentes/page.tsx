"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Presentation, ExternalLink, Plus, Upload, BookOpen, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface LibraryItem {
  id: string;
  title: string;
  type: "PDF" | "SLIDE" | "LINK";
  url: string;
}

interface Material {
  id: string;
  title: string;
  type: "PDF" | "SLIDE" | "LINK";
  url: string;
  libraryItemId?: string | null;
  createdAt: string;
  uploadedBy: { name: string };
}

interface Discipline {
  id: string;
  name: string;
  description?: string;
  materials: Material[];
}

interface Period {
  id: string;
  name: string;
  order: number;
  disciplines: Discipline[];
}

const FILE_ACCEPT: Record<"PDF" | "SLIDE", string> = {
  PDF: ".pdf,application/pdf",
  SLIDE:
    ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export default function DocentesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDiscipline, setExpandedDiscipline] = useState<string | null>(null);
  const [showAddMaterial, setShowAddMaterial] = useState<string | null>(null);
  const [materialForm, setMaterialForm] = useState<{ title: string; type: "PDF" | "SLIDE" | "LINK"; url: string; libraryItemId?: string }>({ title: "", type: "SLIDE", url: "" });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDocente = user && ["DOCENTE", "ADMIN", "SUPERADMIN"].includes(user.role);

  useEffect(() => {
    if (user && !isDocente) {
      router.replace("/dashboard");
    }
  }, [user, isDocente, router]);

  const loadData = useCallback(async () => {
    const [periodsRes, libRes] = await Promise.all([
      fetch("/api/periods"),
      fetch("/api/biblioteca"),
    ]);
    if (periodsRes.ok) {
      const data = await periodsRes.json();
      setPeriods(data.periods || []);
    }
    if (libRes.ok) {
      const data = await libRes.json();
      setLibraryItems(data.items || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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
      setMaterialForm((prev) => ({ ...prev, url: data.url }));
    } else {
      const data = await res.json().catch(() => ({}));
      setUploadError(data.error ?? "Falha ao enviar arquivo.");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handlePickFromLibrary = (item: LibraryItem) => {
    setMaterialForm({ title: item.title, type: item.type, url: item.url, libraryItemId: item.id });
    setShowLibraryPicker(false);
  };

  const handleAddMaterial = async (disciplineId: string) => {
    const res = await fetch(`/api/disciplines/${disciplineId}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(materialForm),
    });
    if (res.ok) {
      setShowAddMaterial(null);
      setMaterialForm({ title: "", type: "SLIDE", url: "" });
      setShowLibraryPicker(false);
      loadData();
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === "PDF") return <FileText className="h-4 w-4 text-red-500" />;
    if (type === "SLIDE") return <Presentation className="h-4 w-4 text-orange-500" />;
    return <ExternalLink className="h-4 w-4 text-blue-500" />;
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "danger" | "warning" | "info"> = {
      PDF: "danger",
      SLIDE: "warning",
      LINK: "info",
    };
    return <Badge variant={variants[type] || "default"}>{type}</Badge>;
  };

  if (!isDocente) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Área Docente</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Publique slides, documentos e materiais nas disciplinas
        </p>
      </div>

      {periods.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            Nenhum período criado ainda. Solicite ao administradore que crie os períodos.
          </CardContent>
        </Card>
      ) : (
        periods.map((period) => (
          <div key={period.id} className="space-y-2">
            <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 px-1">
              {period.name}
            </h2>
            {period.disciplines.length === 0 ? (
              <Card>
                <CardContent className="pt-4 text-sm text-gray-400">
                  Nenhuma disciplina neste período.
                </CardContent>
              </Card>
            ) : (
              period.disciplines.map((discipline) => (
                <Card key={discipline.id} className="overflow-hidden">
                  <button
                    onClick={() =>
                      setExpandedDiscipline(
                        expandedDiscipline === discipline.id ? null : discipline.id
                      )
                    }
                    className="flex w-full items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {expandedDiscipline === discipline.id ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {discipline.name}
                      </span>
                      <Badge variant="info">{discipline.materials.length} materiais</Badge>
                    </div>
                  </button>

                  {expandedDiscipline === discipline.id && (
                    <div className="border-t border-gray-100 dark:border-gray-700 px-6 pb-4 space-y-2 pt-2">
                      {discipline.description && (
                        <p className="text-sm text-gray-500">{discipline.description}</p>
                      )}

                      {discipline.materials.length === 0 ? (
                        <p className="text-sm text-gray-400">Nenhum material ainda.</p>
                      ) : (
                        <div className="space-y-2">
                          {discipline.materials.map((material) => (
                            <div
                              key={material.id}
                              className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-700"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {getTypeIcon(material.type)}
                                <a
                                  href={material.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:underline truncate"
                                >
                                  {material.title}
                                </a>
                                {getTypeBadge(material.type)}
                                {material.libraryItemId && (
                                  <Badge variant="success">Biblioteca</Badge>
                                )}
                              </div>
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                {material.uploadedBy?.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {showAddMaterial === discipline.id ? (
                        <div className="rounded-lg border border-dashed border-blue-300 p-3 space-y-2 mt-2">
                          <Input
                            placeholder="Título do material"
                            value={materialForm.title}
                            onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                          />
                          <div className="flex gap-2 flex-wrap">
                            <select
                              value={materialForm.type}
                              onChange={(e) => {
                                setMaterialForm({ ...materialForm, type: e.target.value as "PDF" | "SLIDE" | "LINK", url: "", libraryItemId: undefined });
                              }}
                              className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                            >
                              <option value="SLIDE">Slide</option>
                              <option value="PDF">PDF</option>
                              <option value="LINK">Link</option>
                            </select>
                            {materialForm.type === "LINK" ? (
                              <Input
                                placeholder="URL"
                                value={materialForm.url}
                                onChange={(e) => setMaterialForm({ ...materialForm, url: e.target.value })}
                              />
                            ) : (
                              <div className="flex flex-1 items-center gap-2">
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept={materialForm.type === "PDF" || materialForm.type === "SLIDE" ? FILE_ACCEPT[materialForm.type] : undefined}
                                  onChange={handleFileUpload}
                                  className="hidden"
                                  id="docente-file-upload"
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
                                {materialForm.url && !uploadError && (
                                  <span className="text-xs text-green-600 dark:text-green-400">✓ Enviado</span>
                                )}
                                {uploadError && (
                                  <span className="text-xs text-red-600 dark:text-red-400">{uploadError}</span>
                                )}
                              </div>
                            )}
                          </div>

                          {libraryItems.length > 0 && (
                            <div>
                              <button
                                type="button"
                                onClick={() => setShowLibraryPicker((v) => !v)}
                                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                              >
                                <BookOpen className="h-3 w-3" />
                                {showLibraryPicker ? "Fechar biblioteca" : "Adicionar da Biblioteca"}
                              </button>
                              {showLibraryPicker && (
                                <div className="mt-2 max-h-40 overflow-y-auto rounded border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
                                  {libraryItems.map((lib) => (
                                    <button
                                      key={lib.id}
                                      type="button"
                                      onClick={() => handlePickFromLibrary(lib)}
                                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                    >
                                      {lib.type === "PDF" ? (
                                        <FileText className="h-3 w-3 text-red-500 flex-shrink-0" />
                                      ) : lib.type === "SLIDE" ? (
                                        <Presentation className="h-3 w-3 text-orange-500 flex-shrink-0" />
                                      ) : (
                                        <ExternalLink className="h-3 w-3 text-blue-500 flex-shrink-0" />
                                      )}
                                      <span className="truncate">{lib.title}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                              {materialForm.libraryItemId && (
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                  ✓ Da Biblioteca: {materialForm.title}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAddMaterial(discipline.id)}
                              disabled={uploading || !materialForm.url || !materialForm.title}
                            >
                              Publicar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setShowAddMaterial(null);
                                setMaterialForm({ title: "", type: "SLIDE", url: "" });
                                setShowLibraryPicker(false);
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowAddMaterial(discipline.id)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 mt-2"
                        >
                          <Plus className="h-3 w-3" /> Publicar material
                        </button>
                      )}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        ))
      )}
    </div>
  );
}
