"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ChevronRight, ChevronDown, ExternalLink, FileText, Presentation, GraduationCap } from "lucide-react";
import { DocumentViewerModal } from "@/components/ui/document-viewer-modal";

interface Progress {
  status: "NOT_VIEWED" | "IN_PROGRESS" | "COMPLETED";
  currentPage?: number;
}

interface Material {
  id: string;
  title: string;
  type: "PDF" | "SLIDE" | "LINK";
  url: string;
  progress: Progress[];
  libraryItemId?: string | null;
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

export default function DisciplinasPage() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);
  const [expandedDiscipline, setExpandedDiscipline] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState<{ url: string; title: string; type: "PDF" | "SLIDE" | "LINK"; materialId?: string; initialPage?: number } | null>(null);

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

  const isPeriodCompleted = (period: Period) => {
    if (period.disciplines.length === 0) return false;
    return period.disciplines.every((discipline) => {
      if (discipline.materials.length === 0) return false;
      return discipline.materials.every((material) => material.progress?.[0]?.status === "COMPLETED");
    });
  };

  const sortedPeriods = [...periods].sort((a, b) => {
    const completedA = isPeriodCompleted(a);
    const completedB = isPeriodCompleted(b);
    if (completedA === completedB) {
      return a.order - b.order;
    }
    return completedA ? 1 : -1;
  });

  const handleProgressChange = async (materialId: string, status: string) => {
    await fetch(`/api/materials/${materialId}/progress`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadPeriods();
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
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-40 rounded-2xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-40 rounded-2xl bg-gray-200 dark:bg-gray-700" />
          <div className="h-40 rounded-2xl bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-7 w-7 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Disciplinas</h1>
      </div>

      {periods.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            Nenhum período disponível ainda.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedPeriods.map((period) => (
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
                  <div className="flex items-center gap-2">
                    <Badge variant="info">{period.disciplines.length} disciplinas</Badge>
                    {isPeriodCompleted(period) && (
                      <Badge variant="success">Período concluído</Badge>
                    )}
                  </div>
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
                                    <button
                                      onClick={() => setViewer({ url: material.url, title: material.title, type: material.type, materialId: material.id, initialPage: material.progress?.[0]?.currentPage ?? 0 })}
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

      {viewer && (
        <DocumentViewerModal
          url={viewer.url}
          title={viewer.title}
          type={viewer.type}
          materialId={viewer.materialId}
          initialPage={viewer.initialPage}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}
