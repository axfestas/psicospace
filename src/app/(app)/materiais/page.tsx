"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronDown, Plus, ExternalLink, FileText, Presentation, Upload } from "lucide-react";

interface Progress {
  status: "NOT_VIEWED" | "IN_PROGRESS" | "COMPLETED";
}

interface Material {
  id: string;
  title: string;
  type: "PDF" | "SLIDE" | "LINK";
  url: string;
  progress: Progress[];
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

const progressLabels: Record<string, string> = {
  NOT_VIEWED: "Não visualizado",
  IN_PROGRESS: "Em progresso",
  COMPLETED: "Concluído",
};

const FILE_ACCEPT: Record<"PDF" | "SLIDE", string> = {
  PDF: ".pdf,application/pdf",
  SLIDE:
    ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

export default function MateriaisPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);
  const [expandedDiscipline, setExpandedDiscipline] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddMaterial, setShowAddMaterial] = useState<string | null>(null);
  const [materialForm, setMaterialForm] = useState<{ title: string; type: "PDF" | "SLIDE" | "LINK"; url: string }>({ title: "", type: "LINK", url: "" });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPeriods = useCallback(async () => {
    const res = await fetch("/api/periods");
    if (res.ok) {
      const data = await res.json();
      setPeriods(data.periods || []);
      if (data.periods?.length > 0 && !expandedPeriod) {
        setExpandedPeriod(data.periods[0].id);
      }
    }
    setLoading(false);
  }, [expandedPeriod]);

  useEffect(() => { loadPeriods(); }, [loadPeriods]);

  const getDisciplineProgress = (discipline: Discipline) => {
    if (discipline.materials.length === 0) return 0;
    const completed = discipline.materials.filter(
      (m) => m.progress?.[0]?.status === "COMPLETED"
    ).length;
    return (completed / discipline.materials.length) * 100;
  };

  const handleProgressChange = async (materialId: string, status: string) => {
    await fetch(`/api/materials/${materialId}/progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadPeriods();
  };

  const handleAddMaterial = async (disciplineId: string) => {
    const res = await fetch(`/api/disciplines/${disciplineId}/materials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(materialForm),
    });
    if (res.ok) {
      setShowAddMaterial(null);
      setMaterialForm({ title: "", type: "LINK", url: "" });
      loadPeriods();
    }
  };

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
      setUploadError(data.error ?? "Falha ao enviar arquivo. Tente novamente.");
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Materiais</h1>

      {periods.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            Nenhum período disponível ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {periods.map((period) => (
            <Card key={period.id} className="overflow-hidden">
              <button
                onClick={() =>
                  setExpandedPeriod(expandedPeriod === period.id ? null : period.id)
                }
                className="flex w-full items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {expandedPeriod === period.id ? (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  )}
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {period.name}
                  </span>
                  <Badge variant="info">{period.disciplines.length} disciplinas</Badge>
                </div>
              </button>

              {expandedPeriod === period.id && (
                <div className="border-t border-gray-100 dark:border-gray-700">
                  {period.disciplines.map((discipline) => (
                    <div key={discipline.id} className="border-b border-gray-50 dark:border-gray-800 last:border-b-0">
                      <button
                        onClick={() =>
                          setExpandedDiscipline(
                            expandedDiscipline === discipline.id ? null : discipline.id
                          )
                        }
                        className="flex w-full items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {expandedDiscipline === discipline.id ? (
                            <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          )}
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                            {discipline.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                          <div className="w-32 hidden sm:block">
                            <ProgressBar value={getDisciplineProgress(discipline)} />
                          </div>
                          <span className="text-xs text-gray-400">
                            {discipline.materials.length} materiais
                          </span>
                        </div>
                      </button>

                      {expandedDiscipline === discipline.id && (
                        <div className="px-10 pb-4 space-y-2">
                          {discipline.description && (
                            <p className="text-sm text-gray-500 mb-3">{discipline.description}</p>
                          )}

                          {discipline.materials.length === 0 ? (
                            <p className="text-sm text-gray-400">Nenhum material disponível.</p>
                          ) : (
                            discipline.materials.map((material) => {
                              const status = material.progress?.[0]?.status || "NOT_VIEWED";
                              return (
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
                                  </div>
                                  <select
                                    value={status}
                                    onChange={(e) => handleProgressChange(material.id, e.target.value)}
                                    className={`text-xs rounded px-2 py-1 border-0 cursor-pointer ${
                                      status === "COMPLETED"
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        : status === "IN_PROGRESS"
                                        ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                    }`}
                                  >
                                    <option value="NOT_VIEWED">{progressLabels.NOT_VIEWED}</option>
                                    <option value="IN_PROGRESS">{progressLabels.IN_PROGRESS}</option>
                                    <option value="COMPLETED">{progressLabels.COMPLETED}</option>
                                  </select>
                                </div>
                              );
                            })
                          )}

                          {showAddMaterial === discipline.id ? (
                            <div className="rounded-lg border border-dashed border-blue-300 p-3 space-y-2">
                              <Input
                                placeholder="Título do material"
                                value={materialForm.title}
                                onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
                              />
                              <div className="flex gap-2">
                                <select
                                  value={materialForm.type}
                                  onChange={(e) => {
                                    setMaterialForm({ ...materialForm, type: e.target.value as "PDF" | "SLIDE" | "LINK", url: "" });
                                  }}
                                  className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                                >
                                  <option value="LINK">Link</option>
                                  <option value="PDF">PDF</option>
                                  <option value="SLIDE">Slide</option>
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
                                      accept={materialForm.type in FILE_ACCEPT ? FILE_ACCEPT[materialForm.type as "PDF" | "SLIDE"] : undefined}
                                      onChange={handleFileUpload}
                                      className="hidden"
                                      id="file-upload"
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
                                      <span className="text-xs text-green-600 dark:text-green-400 truncate max-w-[120px]">
                                        ✓ Arquivo enviado
                                      </span>
                                    )}
                                    {uploadError && (
                                      <span className="text-xs text-red-600 dark:text-red-400 truncate max-w-[180px]">
                                        {uploadError}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleAddMaterial(discipline.id)} disabled={uploading || !materialForm.url || !materialForm.title}>
                                  Adicionar
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => { setShowAddMaterial(null); setMaterialForm({ title: "", type: "LINK", url: "" }); }}>
                                  Cancelar
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowAddMaterial(discipline.id)}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              <Plus className="h-3 w-3" /> Adicionar material
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
