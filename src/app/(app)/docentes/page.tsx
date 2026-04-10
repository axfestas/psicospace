"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Presentation, ExternalLink, Plus, Upload, BookOpen, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { DocumentViewerModal } from "@/components/ui/document-viewer-modal";

interface LibraryItem {
  id: string;
  title: string;
  description?: string;
  type: "PDF" | "SLIDE" | "LINK";
  url: string;
  uploadedBy?: { name: string };
}

interface Progress {
  status: "NOT_VIEWED" | "IN_PROGRESS" | "COMPLETED";
}

interface Material {
  id: string;
  title: string;
  type: "PDF" | "SLIDE" | "LINK";
  url: string;
  libraryItemId?: string | null;
  createdAt: string;
  uploadedBy: { name: string };
  progress: Progress[];
}

const progressLabels: Record<string, string> = {
  NOT_VIEWED: "Não visualizado",
  IN_PROGRESS: "Em progresso",
  COMPLETED: "Concluído",
};

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
  // material publish mode: "upload" = new file, "library" = pick from biblioteca
  const [materialMode, setMaterialMode] = useState<"upload" | "library">("upload");
  const [showAddMaterial, setShowAddMaterial] = useState<string | null>(null);
  const [materialForm, setMaterialForm] = useState<{ title: string; type: "PDF" | "SLIDE" | "LINK"; url: string; libraryItemId?: string }>({ title: "", type: "SLIDE", url: "" });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewer, setViewer] = useState<{ url: string; title: string; type: "PDF" | "SLIDE" | "LINK" } | null>(null);

  // Biblioteca section state
  const [showLibrary, setShowLibrary] = useState(false);
  const [libForm, setLibForm] = useState<{ title: string; description: string; type: "PDF" | "SLIDE" | "LINK"; url: string }>({ title: "", description: "", type: "PDF", url: "" });
  const [libUploading, setLibUploading] = useState(false);
  const [libUploadError, setLibUploadError] = useState<string | null>(null);
  const [libSaving, setLibSaving] = useState(false);
  const libFileInputRef = useRef<HTMLInputElement>(null);

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

  // ── Biblioteca: file upload handler ─────────────────────────────────────
  const handleLibFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLibUploading(true);
    setLibUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      setLibForm((prev) => ({ ...prev, url: data.url }));
    } else {
      const data = await res.json().catch(() => ({}));
      setLibUploadError(data.error ?? "Falha ao enviar arquivo.");
    }
    setLibUploading(false);
    if (libFileInputRef.current) libFileInputRef.current.value = "";
  };

  const handleAddToLibrary = async () => {
    if (!libForm.title || !libForm.url) return;
    setLibSaving(true);
    const res = await fetch("/api/biblioteca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(libForm),
    });
    if (res.ok) {
      setLibForm({ title: "", description: "", type: "PDF", url: "" });
      if (libFileInputRef.current) libFileInputRef.current.value = "";
      loadData();
    }
    setLibSaving(false);
  };

  const handleDeleteLibraryItem = async (id: string) => {
    if (!confirm("Remover este item da biblioteca?")) return;
    await fetch(`/api/biblioteca/${id}`, { method: "DELETE" });
    loadData();
  };

  // ── Discipline material handlers ──────────────────────────────────────────
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
  };

  const handleAddMaterial = async (disciplineId: string) => {
    setAddSaving(true);
    setAddError(null);
    const res = await fetch(`/api/disciplines/${disciplineId}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(materialForm),
    });
    if (res.ok) {
      setShowAddMaterial(null);
      setMaterialForm({ title: "", type: "SLIDE", url: "" });
      loadData();
    } else {
      const data = await res.json().catch(() => ({}));
      setAddError((data as { error?: string }).error ?? "Erro ao publicar material.");
    }
    setAddSaving(false);
  };

  const handleProgressChange = async (materialId: string, status: string) => {
    await fetch(`/api/materials/${materialId}/progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadData();
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Área Docente</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          Publique slides, documentos e materiais nas disciplinas
        </p>
      </div>

      {/* ── Biblioteca ─────────────────────────────────────────────────── */}
      <Card className="overflow-hidden">
        <button
          onClick={() => setShowLibrary((v) => !v)}
          className="flex w-full items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            {showLibrary ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
            <BookOpen className="h-5 w-5 text-blue-500" />
            <span className="font-semibold text-gray-900 dark:text-gray-100">Biblioteca</span>
            <Badge variant="info">{libraryItems.length} arquivos</Badge>
          </div>
          <span className="text-xs text-gray-400">Gerenciar arquivos reutilizáveis</span>
        </button>
        {showLibrary && (
          <div className="border-t border-gray-100 dark:border-gray-700 px-6 pb-5 pt-4 space-y-4">
            {/* Add to library form */}
            <div className="rounded-lg border border-dashed border-blue-300 dark:border-blue-700 p-4 space-y-3 bg-blue-50/30 dark:bg-blue-900/10">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Adicionar à Biblioteca</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input
                  placeholder="Título do arquivo"
                  value={libForm.title}
                  onChange={(e) => setLibForm({ ...libForm, title: e.target.value })}
                />
                <Input
                  placeholder="Descrição (opcional)"
                  value={libForm.description}
                  onChange={(e) => setLibForm({ ...libForm, description: e.target.value })}
                />
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <select
                  value={libForm.type}
                  onChange={(e) => setLibForm({ ...libForm, type: e.target.value as "PDF" | "SLIDE" | "LINK", url: "" })}
                  className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="PDF">PDF</option>
                  <option value="SLIDE">Slide</option>
                  <option value="LINK">Link</option>
                </select>
                {libForm.type === "LINK" ? (
                  <Input
                    placeholder="URL do link"
                    value={libForm.url}
                    onChange={(e) => setLibForm({ ...libForm, url: e.target.value })}
                    className="flex-1"
                  />
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      ref={libFileInputRef}
                      type="file"
                      accept={FILE_ACCEPT[libForm.type as "PDF" | "SLIDE"]}
                      onChange={handleLibFileUpload}
                      className="hidden"
                      id="lib-file-upload"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => libFileInputRef.current?.click()}
                      disabled={libUploading}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      {libUploading ? "Enviando..." : "Escolher arquivo"}
                    </Button>
                    {libForm.url && !libUploadError && (
                      <span className="text-xs text-green-600 dark:text-green-400">✓ Enviado</span>
                    )}
                    {libUploadError && (
                      <span className="text-xs text-red-600 dark:text-red-400">{libUploadError}</span>
                    )}
                  </div>
                )}
              </div>
              <Button
                size="sm"
                onClick={handleAddToLibrary}
                disabled={libSaving || libUploading || !libForm.title || !libForm.url}
              >
                {libSaving ? "Salvando..." : "Adicionar à Biblioteca"}
              </Button>
            </div>

            {/* Library items list */}
            {libraryItems.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum arquivo na biblioteca ainda.</p>
            ) : (
              <div className="space-y-2">
                {libraryItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 dark:border-gray-700 p-3">
                    <div className="flex items-center gap-2 min-w-0">
                      {item.type === "PDF" ? <FileText className="h-4 w-4 text-red-500 flex-shrink-0" /> :
                       item.type === "SLIDE" ? <Presentation className="h-4 w-4 text-orange-500 flex-shrink-0" /> :
                       <ExternalLink className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                      <button
                        onClick={() => setViewer({ url: item.url, title: item.title, type: item.type })}
                        className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:underline truncate text-left"
                      >
                        {item.title}
                      </button>
                      <Badge variant={item.type === "PDF" ? "danger" : item.type === "SLIDE" ? "warning" : "info"}>{item.type}</Badge>
                    </div>
                    <button
                      onClick={() => handleDeleteLibraryItem(item.id)}
                      className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0"
                      title="Remover da biblioteca"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Disciplinas ─────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">Disciplinas</h2>
      {periods.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            Nenhum período criado ainda. Solicite ao administrador que crie os períodos.
          </CardContent>
        </Card>
      ) : (
        periods.map((period) => (
          <div key={period.id} className="space-y-2 mb-4">
            <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 px-1">
              {period.name}
            </h3>
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
                                <button
                                  onClick={() => setViewer({ url: material.url, title: material.title, type: material.type })}
                                  className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:underline truncate text-left"
                                >
                                  {material.title}
                                </button>
                                {getTypeBadge(material.type)}
                                {material.libraryItemId && (
                                  <Badge variant="success">Biblioteca</Badge>
                                )}
                              </div>
                              <select
                                value={material.progress?.[0]?.status || "NOT_VIEWED"}
                                onChange={(e) => handleProgressChange(material.id, e.target.value)}
                                className={`text-xs rounded px-2 py-1 border-0 cursor-pointer flex-shrink-0 ${
                                  (material.progress?.[0]?.status || "NOT_VIEWED") === "COMPLETED"
                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                    : (material.progress?.[0]?.status || "NOT_VIEWED") === "IN_PROGRESS"
                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                }`}
                              >
                                <option value="NOT_VIEWED">{progressLabels.NOT_VIEWED}</option>
                                <option value="IN_PROGRESS">{progressLabels.IN_PROGRESS}</option>
                                <option value="COMPLETED">{progressLabels.COMPLETED}</option>
                              </select>
                            </div>
                          ))}
                        </div>
                      )}

                      {showAddMaterial === discipline.id ? (
                        <div className="rounded-lg border border-dashed border-blue-300 dark:border-blue-700 p-3 space-y-3 mt-2 bg-blue-50/20 dark:bg-blue-900/10">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Publicar material</p>
                          {/* Mode selector */}
                          <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-gray-800 p-1 w-fit">
                            <button
                              type="button"
                              onClick={() => { setMaterialMode("upload"); setMaterialForm({ title: "", type: "SLIDE", url: "" }); setAddError(null); }}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${materialMode === "upload" ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}
                            >
                              <Upload className="h-3 w-3 inline mr-1" />
                              Novo arquivo
                            </button>
                            <button
                              type="button"
                              onClick={() => { setMaterialMode("library"); setMaterialForm({ title: "", type: "SLIDE", url: "" }); setAddError(null); }}
                              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${materialMode === "library" ? "bg-white dark:bg-gray-700 text-blue-600 shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"}`}
                            >
                              <BookOpen className="h-3 w-3 inline mr-1" />
                              Da Biblioteca
                            </button>
                          </div>

                          {materialMode === "upload" ? (
                            <>
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
                            </>
                          ) : (
                            // Library mode
                            <div className="space-y-2">
                              {libraryItems.length === 0 ? (
                                <p className="text-sm text-gray-400">Biblioteca vazia. Adicione arquivos acima.</p>
                              ) : (
                                <div className="max-h-48 overflow-y-auto rounded border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
                                  {libraryItems.map((lib) => (
                                    <button
                                      key={lib.id}
                                      type="button"
                                      onClick={() => handlePickFromLibrary(lib)}
                                      className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors ${materialForm.libraryItemId === lib.id ? "bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-500" : "hover:bg-gray-50 dark:hover:bg-gray-800"}`}
                                    >
                                      {lib.type === "PDF" ? (
                                        <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                                      ) : lib.type === "SLIDE" ? (
                                        <Presentation className="h-4 w-4 text-orange-500 flex-shrink-0" />
                                      ) : (
                                        <ExternalLink className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                      )}
                                      <span className="truncate font-medium">{lib.title}</span>
                                      {materialForm.libraryItemId === lib.id && (
                                        <span className="ml-auto text-xs text-blue-600 dark:text-blue-400 flex-shrink-0">✓ Selecionado</span>
                                      )}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="flex flex-col gap-2">
                            {addError && (
                              <p className="text-xs text-red-600 dark:text-red-400">{addError}</p>
                            )}
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleAddMaterial(discipline.id)}
                                disabled={uploading || addSaving || !materialForm.url || !materialForm.title}
                                loading={addSaving}
                              >
                                {addSaving ? "Publicando..." : "Publicar"}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setShowAddMaterial(null);
                                  setMaterialForm({ title: "", type: "SLIDE", url: "" });
                                  setAddError(null);
                                }}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => { setShowAddMaterial(discipline.id); setMaterialMode("upload"); setMaterialForm({ title: "", type: "SLIDE", url: "" }); setAddError(null); }}
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
