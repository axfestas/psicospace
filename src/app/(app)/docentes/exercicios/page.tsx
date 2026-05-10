"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { normalizeExtractedText } from "@/lib/text-normalization";
import {
  MIN_PDF_EXTRACTED_TEXT_CHARS,
  PDF_EXTRACTION_FAILURE_MSG,
  PDF_EXTRACTION_PREVIEW_CHARS,
  DIFFICULTY_LABELS,
} from "@/lib/pdf-extraction";
import {
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  Edit2,
  Trash2,
  Zap,
  BookOpen,
  Library,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface LibraryItem {
  id: string;
  title: string;
  type: string;
  url?: string;
}

interface Material {
  id: string;
  title: string;
  type: string;
  url?: string;
}

interface Discipline {
  id: string;
  name: string;
  materials: Material[];
}

interface Period {
  id: string;
  name: string;
  disciplines: Discipline[];
}

interface ExerciseOption {
  id?: string;
  text: string;
  isCorrect: boolean;
  order?: number;
}

interface Exercise {
  id: string;
  title: string;
  type: string;
  question: string;
  answer?: string;
  explanation?: string;
  difficulty?: string;
  status: string;
  sourceType: string;
  materialId?: string | null;
  libraryItemId?: string | null;
  createdAt: string;
  options: ExerciseOption[];
  createdBy: { id: string; name: string };
  approvedBy?: { id: string; name: string } | null;
  material?: { id: string; title: string } | null;
  libraryItem?: { id: string; title: string } | null;
}

const TYPE_LABELS: Record<string, string> = {
  MULTIPLE_CHOICE: "Múltipla escolha",
  OPEN: "Pergunta aberta",
  COMPREHENSION: "Compreensão",
  APPLICATION: "Aplicação",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-600 bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-400",
  APPROVED: "text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400",
  REJECTED: "text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
};

const BLANK_OPTION: ExerciseOption = { text: "", isCorrect: false };
// MAX_OCR_PAGES: increased from 5 to 15 so typical academic PDFs (lecture notes, chapters)
// are covered without requiring user intervention. Browser-side Tesseract.js is slower
// than server-side OCR but 15 pages generally completes within ~1 minute on modern
// hardware. PDFs with more pages show a warning and stop at this limit.
const MAX_OCR_PAGES = 15;
const OCR_LANG = "por+eng";

type PdfExtractionMethod = "pdf_direct" | "pdf_ocr_fallback";

interface PdfExtractionResult {
  text: string;
  method: PdfExtractionMethod;
}

// pdfjs-dist TextItem includes hasEOL but it's not always typed correctly.
interface PdfTextItem {
  str: string;
  hasEOL?: boolean;
}

function isTextInsufficient(text: string): boolean {
  return text.trim().length < MIN_PDF_EXTRACTED_TEXT_CHARS;
}

function logPdfExtractionDebug(method: PdfExtractionMethod, text: string) {
  const preview = text.slice(0, PDF_EXTRACTION_PREVIEW_CHARS);
  console.info(
    "[docentes/exercicios] PDF extraction debug",
    JSON.stringify({
      method,
      length: text.length,
      preview,
    })
  );
}

// Clone the buffer before each pdfjs parse to avoid "ArrayBuffer was detached" errors.
// pdfjs may transfer (detach) the underlying buffer when loading a document, so
// subsequent calls with the same instance fail. A fresh copy ensures each parse
// starts with a live, undetached buffer.
function cloneArrayBuffer(buffer: ArrayBuffer): ArrayBuffer {
  return buffer.slice(0);
}

async function extractPdfTextFromArrayBuffer(
  arrayBuffer: ArrayBuffer,
  pageFrom?: number,
  pageTo?: number,
): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }

  const pdf = await pdfjsLib.getDocument({ data: cloneArrayBuffer(arrayBuffer) }).promise;
  const start = Math.max(1, pageFrom ?? 1);
  const end = Math.min(pdf.numPages, pageTo ?? pdf.numPages);
  const allPages: string[] = [];
  for (let pageNumber = start; pageNumber <= end; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    // Use hasEOL to reconstruct line breaks properly; join with "" since each
    // item's str already contains its natural whitespace.
    const pageText = textContent.items
      .map((item) => {
        if (!("str" in item)) return "";
        const textItem = item as PdfTextItem;
        return textItem.str + (textItem.hasEOL ? "\n" : "");
      })
      .join("");
    allPages.push(pageText);
  }
  return normalizeExtractedText(allPages.join("\n\n"));
}

async function extractPdfTextWithOcrFallback(
  arrayBuffer: ArrayBuffer,
  onProgress?: (step: string) => void,
  pageFrom?: number,
  pageTo?: number,
): Promise<PdfExtractionResult> {
  onProgress?.("Lendo texto do PDF…");
  const directText = await extractPdfTextFromArrayBuffer(cloneArrayBuffer(arrayBuffer), pageFrom, pageTo);
  if (!isTextInsufficient(directText)) {
    logPdfExtractionDebug("pdf_direct", directText);
    return { text: directText, method: "pdf_direct" };
  }

  onProgress?.("PDF sem texto selecionável — iniciando OCR…");
  const [{ createWorker }, pdfjsLib] = await Promise.all([
    import("tesseract.js"),
    import("pdfjs-dist"),
  ]);
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  }

  const pdf = await pdfjsLib.getDocument({ data: cloneArrayBuffer(arrayBuffer) }).promise;
  const ocrStart = Math.max(1, pageFrom ?? 1);
  const ocrEnd = Math.min(pdf.numPages, pageTo ?? pdf.numPages);
  const ocrPageLimit = Math.min(ocrEnd, ocrStart + MAX_OCR_PAGES - 1);
  if (ocrEnd - ocrStart + 1 > MAX_OCR_PAGES) {
    console.warn(
      "[docentes/exercicios] OCR will process a subset of pages",
      JSON.stringify({ requestedPages: ocrEnd - ocrStart + 1, processedPages: MAX_OCR_PAGES })
    );
  }
  const worker = await createWorker(OCR_LANG);
  const ocrPages: string[] = [];

  try {
    for (let pageNumber = ocrStart; pageNumber <= ocrPageLimit; pageNumber++) {
      onProgress?.(`OCR — pág. ${pageNumber}/${ocrPageLimit}…`);
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      await page.render({ canvas, canvasContext: ctx, viewport }).promise;
      const { data } = await worker.recognize(canvas);
      if (data?.text) ocrPages.push(data.text);
      // Yield between OCR pages to keep the UI responsive during long scans.
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  } finally {
    await worker.terminate();
  }

  const text = normalizeExtractedText(`${directText}\n\n${ocrPages.join("\n\n")}`);
  logPdfExtractionDebug("pdf_ocr_fallback", text);
  return { text, method: "pdf_ocr_fallback" };
}

async function extractPdfTextFromUrl(
  url: string,
  onProgress?: (step: string) => void,
  pageFrom?: number,
  pageTo?: number,
): Promise<PdfExtractionResult> {
  onProgress?.("Baixando PDF…");
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Falha ao buscar PDF (${response.status})`);
  }
  const buffer = await response.arrayBuffer();
  return extractPdfTextWithOcrFallback(buffer, onProgress, pageFrom, pageTo);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ExerciciosPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterSource, setFilterSource] = useState<string>("");

  // Source selection for generate
  const [showGenerate, setShowGenerate] = useState(false);
  const [genSourceType, setGenSourceType] = useState<"library" | "material">("library");
  const [genLibraryItemId, setGenLibraryItemId] = useState("");
  const [genMaterialId, setGenMaterialId] = useState("");
  const [genCount, setGenCount] = useState(3);
  const [genTypes, setGenTypes] = useState<string[]>(["OPEN", "COMPREHENSION", "MULTIPLE_CHOICE"]);
  const [genDifficulty, setGenDifficulty] = useState("MISTO");
  const [genPageFrom, setGenPageFrom] = useState<number | "">("");
  const [genPageTo, setGenPageTo] = useState<number | "">("");
  const [genError, setGenError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<string | null>(null);

  const handleGenSourceTypeChange = useCallback((type: "library" | "material") => {
    setGenSourceType(type);
    setGenPageFrom("");
    setGenPageTo("");
  }, []);

  // Create manual form
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    type: "OPEN",
    question: "",
    answer: "",
    explanation: "",
    materialId: "",
    libraryItemId: "",
  });
  const [formOptions, setFormOptions] = useState<ExerciseOption[]>([
    { ...BLANK_OPTION },
    { ...BLANK_OPTION },
    { ...BLANK_OPTION },
    { ...BLANK_OPTION },
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  // Edit form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<typeof form>({
    title: "",
    type: "OPEN",
    question: "",
    answer: "",
    explanation: "",
    materialId: "",
    libraryItemId: "",
  });
  const [editOptions, setEditOptions] = useState<ExerciseOption[]>([]);
  const [editError, setEditError] = useState<string | null>(null);

  const isDocente = user && ["DOCENTE", "ADMIN", "SUPERADMIN"].includes(user.role);

  const parseApiError = async (res: Response, fallback: string) => {
    try {
      const data = (await res.json()) as { error?: string };
      return data.error || fallback;
    } catch {
      return fallback;
    }
  };

  useEffect(() => {
    if (user && !isDocente) router.replace("/dashboard");
  }, [user, isDocente, router]);

  const loadData = useCallback(async () => {
    setLoadError(null);
    try {
      const [exRes, periodsRes, libRes] = await Promise.all([
        fetch("/api/exercises"),
        fetch("/api/periods"),
        fetch("/api/biblioteca"),
      ]);
      if (exRes.ok) {
        setExercises((await exRes.json()).exercises || []);
      } else {
        const data = await exRes.json().catch(() => ({}));
        setLoadError(data.error || `Erro ao carregar exercícios (${exRes.status})`);
      }
      if (periodsRes.ok) setPeriods((await periodsRes.json()).periods || []);
      if (libRes.ok) setLibraryItems((await libRes.json()).items || []);
    } catch {
      setLoadError("Não foi possível carregar os dados. Verifique a conexão.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Generate ────────────────────────────────────────────────────────────────

  const handleGenerate = async () => {
    const sourceId = genSourceType === "library" ? genLibraryItemId : genMaterialId;
    if (!sourceId) {
      setGenError("Selecione um arquivo como base");
      return;
    }
    if (genPageFrom !== "" && genPageTo !== "" && genPageFrom > genPageTo) {
      setGenError("A página inicial não pode ser maior que a página final");
      return;
    }
    setGenError(null);
    setGenStatus(null);
    setGenerating(true);
    try {
      let sourceText: string | undefined;
      let sourceExtractionMethod: PdfExtractionMethod | undefined;
      const selectedSource =
        genSourceType === "library"
          ? libraryItems.find((item) => item.id === genLibraryItemId)
          : allMaterials.find((material) => material.id === genMaterialId);

      if (selectedSource?.type === "PDF" && selectedSource.url) {
        const pageFrom = genPageFrom !== "" ? genPageFrom : undefined;
        const pageTo = genPageTo !== "" ? genPageTo : undefined;
        const extracted = await extractPdfTextFromUrl(
          selectedSource.url,
          (step) => setGenStatus(step),
          pageFrom,
          pageTo,
        );
        if (isTextInsufficient(extracted.text)) {
          throw new Error(PDF_EXTRACTION_FAILURE_MSG);
        }
        sourceText = extracted.text;
        sourceExtractionMethod = extracted.method;
      }

      setGenStatus("Gerando exercícios com IA…");
      const res = await fetch("/api/exercises/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          libraryItemId: genSourceType === "library" ? genLibraryItemId : undefined,
          materialId: genSourceType === "material" ? genMaterialId : undefined,
          sourceText,
          sourceExtractionMethod,
          count: genCount,
          types: genTypes,
          difficulty: genDifficulty,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; exercises?: Exercise[] };
      if (res.ok) {
        setShowGenerate(false);
        setGenLibraryItemId("");
        setGenMaterialId("");
        setGenPageFrom("");
        setGenPageTo("");
        setGenStatus(null);
        await loadData();
      } else {
        setGenError(data.error || "Erro ao gerar exercícios");
      }
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Erro ao gerar exercícios");
    } finally {
      setGenerating(false);
      setGenStatus(null);
    }
  };

  // ── Create manual ───────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.question.trim()) {
      setFormError("Título e enunciado são obrigatórios");
      return;
    }
    if (form.type === "MULTIPLE_CHOICE") {
      const validOptions = formOptions.filter((o) => o.text.trim());
      if (validOptions.length < 2) {
        setFormError("Adicione pelo menos 2 opções");
        return;
      }
      if (!validOptions.some((o) => o.isCorrect)) {
        setFormError("Marque pelo menos uma opção como correta");
        return;
      }
    }
    setFormError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          materialId: form.materialId || undefined,
          libraryItemId: form.libraryItemId || undefined,
          options: form.type === "MULTIPLE_CHOICE" ? formOptions.filter((o) => o.text.trim()) : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowCreate(false);
        setForm({ title: "", type: "OPEN", question: "", answer: "", explanation: "", materialId: "", libraryItemId: "" });
        setFormOptions([{ ...BLANK_OPTION }, { ...BLANK_OPTION }, { ...BLANK_OPTION }, { ...BLANK_OPTION }]);
        await loadData();
      } else {
        setFormError(data.error || "Erro ao criar exercício");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Edit ────────────────────────────────────────────────────────────────────

  const startEdit = (ex: Exercise) => {
    setEditingId(ex.id);
    setEditForm({
      title: ex.title,
      type: ex.type,
      question: ex.question,
      answer: ex.answer || "",
      explanation: ex.explanation || "",
      materialId: ex.materialId || "",
      libraryItemId: ex.libraryItemId || "",
    });
    setEditOptions(
      ex.options.length > 0
        ? ex.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect }))
        : [{ ...BLANK_OPTION }, { ...BLANK_OPTION }]
    );
    setEditError(null);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editForm.title.trim() || !editForm.question.trim()) {
      setEditError("Título e enunciado são obrigatórios");
      return;
    }
    setEditError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/exercises/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          question: editForm.question,
          answer: editForm.answer || undefined,
          explanation: editForm.explanation || undefined,
          options: editForm.type === "MULTIPLE_CHOICE" ? editOptions.filter((o) => o.text.trim()) : undefined,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        await loadData();
      } else {
        setEditError(await parseApiError(res, "Erro ao editar"));
      }
    } catch {
      setEditError("Erro ao editar");
    } finally {
      setSaving(false);
    }
  };

  // ── Approve / Reject ────────────────────────────────────────────────────────

  const handleStatusChange = async (id: string, status: "APPROVED" | "REJECTED") => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/exercises/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await loadData();
      } else {
        setError(await parseApiError(res, "Erro ao atualizar status"));
      }
    } catch {
      setError("Erro ao atualizar status");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este exercício?")) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/exercises/${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadData();
      } else {
        setError(await parseApiError(res, "Erro ao excluir exercício"));
      }
    } catch {
      setError("Erro ao excluir exercício");
    } finally {
      setSaving(false);
    }
  };

  // ── Filters ─────────────────────────────────────────────────────────────────

  const filtered = exercises.filter((ex) => {
    if (filterStatus && ex.status !== filterStatus) return false;
    if (filterSource && ex.sourceType !== filterSource) return false;
    return true;
  });

  // Count by status
  const counts = exercises.reduce(
    (acc, ex) => { acc[ex.status] = (acc[ex.status] || 0) + 1; return acc; },
    {} as Record<string, number>
  );

  // All materials for dropdown
  const allMaterials = periods.flatMap((p) =>
    p.disciplines.flatMap((d) => d.materials.map((m) => ({ ...m, disciplineName: d.name })))
  );

  if (!isDocente) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Exercícios</h1>
          <p className="text-sm text-gray-500">
            Crie, gere e publique exercícios vinculados a materiais
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { setShowGenerate((v) => !v); setShowCreate(false); }}
          >
            <Zap className="h-4 w-4 mr-1 text-yellow-500" />
            Gerar com IA
          </Button>
          <Button
            size="sm"
            onClick={() => { setShowCreate((v) => !v); setShowGenerate(false); }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Criar manual
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {loadError && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <span>{loadError}</span>
            <button
              onClick={() => { setLoading(true); loadData(); }}
              className="ml-2 underline hover:no-underline font-medium"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((s) => (
          <div
            key={s}
            className={`rounded-lg border p-3 cursor-pointer transition-all ${STATUS_COLORS[s]} ${filterStatus === s ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
          >
            <p className="text-lg font-bold">{counts[s] || 0}</p>
            <p className="text-xs">{STATUS_LABELS[s]}</p>
          </div>
        ))}
      </div>

      {/* Generate panel */}
      {showGenerate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-yellow-500" />
              Gerar exercícios com IA
            </CardTitle>
            <p className="text-xs text-gray-500">
              A IA usa exclusivamente o conteúdo do arquivo selecionado.
              {!process.env.NEXT_PUBLIC_HAS_AI && " (Modo placeholder — configure GROQ_API_KEY para geração real)"}
              {" "}
              (O servidor registra até {PDF_EXTRACTION_PREVIEW_CHARS} caracteres da prévia para diagnóstico.)
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <button
                onClick={() => handleGenSourceTypeChange("library")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${genSourceType === "library" ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300" : "border-gray-200 dark:border-gray-700"}`}
              >
                <Library className="h-3.5 w-3.5" />
                Biblioteca
              </button>
              <button
                onClick={() => handleGenSourceTypeChange("material")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${genSourceType === "material" ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300" : "border-gray-200 dark:border-gray-700"}`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Material de Disciplina
              </button>
            </div>

            {genSourceType === "library" ? (
              <select
                value={genLibraryItemId}
                onChange={(e) => setGenLibraryItemId(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">Selecione um item da biblioteca...</option>
                {libraryItems.map((item) => (
                  <option key={item.id} value={item.id}>{item.title} ({item.type})</option>
                ))}
              </select>
            ) : (
              <select
                value={genMaterialId}
                onChange={(e) => setGenMaterialId(e.target.value)}
                className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">Selecione um material...</option>
                {allMaterials.map((m) => (
                  <option key={m.id} value={m.id}>{m.title} — {m.disciplineName} ({m.type})</option>
                ))}
              </select>
            )}

            {/* Page range — shown only when a PDF source is selected */}
            {(() => {
              const src = genSourceType === "library"
                ? libraryItems.find((i) => i.id === genLibraryItemId)
                : allMaterials.find((m) => m.id === genMaterialId);
              return src?.type === "PDF" ? (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    Intervalo de páginas{" "}
                    <span className="font-normal text-gray-400">(opcional — deixe em branco para usar todo o PDF)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      placeholder="De"
                      value={genPageFrom}
                      onChange={(e) => setGenPageFrom(e.target.value === "" ? "" : Number(e.target.value))}
                      className="h-9 w-20 rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                    <span className="text-xs text-gray-500">até</span>
                    <input
                      type="number"
                      min={1}
                      placeholder="Até"
                      value={genPageTo}
                      onChange={(e) => setGenPageTo(e.target.value === "" ? "" : Number(e.target.value))}
                      className="h-9 w-20 rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>
              ) : null;
            })()}

            <div className="flex gap-3 flex-wrap">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Quantidade</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={genCount}
                  onChange={(e) => setGenCount(Number(e.target.value))}
                  className="h-9 w-20 rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Nível de dificuldade</label>
                <select
                  value={genDifficulty}
                  onChange={(e) => setGenDifficulty(e.target.value)}
                  className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="MISTO">🎯 Misto (todos os níveis)</option>
                  <option value="FACIL">🟢 Fácil (definição)</option>
                  <option value="MEDIO">🟡 Médio (explicação)</option>
                  <option value="DIFICIL">🔴 Difícil (aplicação)</option>
                </select>
              </div>
            </div>

            {genError && <p className="text-xs text-red-600">{genError}</p>}

            {generating && genStatus && (
              <p className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
                <Loader2 className="h-3.5 w-3.5 animate-spin flex-shrink-0" />
                {genStatus}
              </p>
            )}

            <div className="flex gap-2">
              <Button onClick={handleGenerate} loading={generating} size="sm">
                <Zap className="h-4 w-4 mr-1" />
                Gerar {genCount} exercício(s)
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowGenerate(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create manual form */}
      {showCreate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Criar exercício manualmente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Título *</label>
                  <Input
                    placeholder="Título do exercício"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Tipo *</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    {Object.entries(TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Vinculado a (Biblioteca)</label>
                  <select
                    value={form.libraryItemId}
                    onChange={(e) => setForm({ ...form, libraryItemId: e.target.value, materialId: "" })}
                    className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="">Nenhum</option>
                    {libraryItems.map((it) => (
                      <option key={it.id} value={it.id}>{it.title}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Vinculado a (Material)</label>
                  <select
                    value={form.materialId}
                    onChange={(e) => setForm({ ...form, materialId: e.target.value, libraryItemId: "" })}
                    className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="">Nenhum</option>
                    {allMaterials.map((m) => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Enunciado *</label>
                <textarea
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  placeholder="Digite o enunciado da questão..."
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                />
              </div>

              {form.type === "MULTIPLE_CHOICE" && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Opções * (marque a(s) correta(s))
                  </label>
                  {formOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={opt.isCorrect}
                        onChange={(e) =>
                          setFormOptions((prev) =>
                            prev.map((o, idx) => idx === i ? { ...o, isCorrect: e.target.checked } : o)
                          )
                        }
                        className="rounded"
                        title="Correta"
                      />
                      <Input
                        placeholder={`Opção ${i + 1}`}
                        value={opt.text}
                        onChange={(e) =>
                          setFormOptions((prev) =>
                            prev.map((o, idx) => idx === i ? { ...o, text: e.target.value } : o)
                          )
                        }
                      />
                    </div>
                  ))}
                </div>
              )}

              {form.type !== "MULTIPLE_CHOICE" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Gabarito / Resposta modelo (opcional)
                  </label>
                  <textarea
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                    placeholder="Resposta esperada..."
                    value={form.answer}
                    onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Explicação (opcional)</label>
                <textarea
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  placeholder="Explicação da resposta..."
                  value={form.explanation}
                  onChange={(e) => setForm({ ...form, explanation: e.target.value })}
                />
              </div>

              {formError && <p className="text-xs text-red-600">{formError}</p>}

              <div className="flex gap-2 pt-1">
                <Button type="submit" size="sm" loading={saving}>
                  Criar exercício
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setShowCreate(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">Todos os status</option>
          <option value="PENDING">Pendente</option>
          <option value="APPROVED">Aprovado</option>
          <option value="REJECTED">Rejeitado</option>
        </select>
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        >
          <option value="">Todas as origens</option>
          <option value="MANUAL">Manual</option>
          <option value="AI">IA</option>
        </select>
      </div>

      {/* Exercise list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <p className="text-sm">Nenhum exercício encontrado.</p>
              <p className="text-xs mt-1">Crie um manualmente ou gere com IA.</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              isEditing={editingId === ex.id}
              editForm={editForm}
              editOptions={editOptions}
              editError={editError}
              saving={saving}
              onStartEdit={() => startEdit(ex)}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={() => handleSaveEdit(ex.id)}
              onEditFormChange={(updates) => setEditForm((prev) => ({ ...prev, ...updates }))}
              onEditOptionsChange={setEditOptions}
              onApprove={() => handleStatusChange(ex.id, "APPROVED")}
              onReject={() => handleStatusChange(ex.id, "REJECTED")}
              onDelete={() => handleDelete(ex.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── ExerciseCard ─────────────────────────────────────────────────────────────

interface ExerciseCardProps {
  exercise: Exercise;
  isEditing: boolean;
  editForm: Record<string, string>;
  editOptions: ExerciseOption[];
  editError: string | null;
  saving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onEditFormChange: (updates: Record<string, string>) => void;
  onEditOptionsChange: (opts: ExerciseOption[]) => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
}

function ExerciseCard({
  exercise: ex,
  isEditing,
  editForm,
  editOptions,
  editError,
  saving,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onEditFormChange,
  onEditOptionsChange,
  onApprove,
  onReject,
  onDelete,
}: ExerciseCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className={`overflow-hidden ${ex.status === "APPROVED" ? "border-green-200 dark:border-green-800" : ex.status === "REJECTED" ? "border-red-200 dark:border-red-800" : ""}`}>
      {/* Card header */}
      <div
        className="flex items-start justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[ex.status]}`}>
              {ex.status === "APPROVED" && <CheckCircle className="h-3 w-3" />}
              {ex.status === "REJECTED" && <XCircle className="h-3 w-3" />}
              {ex.status === "PENDING" && <Clock className="h-3 w-3" />}
              {STATUS_LABELS[ex.status]}
            </span>
            <Badge variant="default" className="text-xs">
              {TYPE_LABELS[ex.type] || ex.type}
            </Badge>
            {ex.sourceType === "AI" && (
              <Badge variant="warning" className="text-xs">IA</Badge>
            )}
            {ex.difficulty && DIFFICULTY_LABELS[ex.difficulty] && (
              <span className="text-xs px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                {DIFFICULTY_LABELS[ex.difficulty]}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">{ex.title}</p>
          {(ex.material || ex.libraryItem) && (
            <p className="text-xs text-gray-400">
              📎 {ex.material?.title || ex.libraryItem?.title}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div
          className="border-t border-gray-100 dark:border-gray-700 px-4 pb-4 pt-3 space-y-3"
          onClick={(e) => e.stopPropagation()}
        >
          {isEditing ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Título</label>
                <Input
                  value={editForm.title}
                  onChange={(e) => onEditFormChange({ title: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Enunciado</label>
                <textarea
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={4}
                  value={editForm.question}
                  onChange={(e) => onEditFormChange({ question: e.target.value })}
                />
              </div>
              {ex.type === "MULTIPLE_CHOICE" && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Opções</label>
                  {editOptions.map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={opt.isCorrect}
                        onChange={(e) =>
                          onEditOptionsChange(editOptions.map((o, idx) =>
                            idx === i ? { ...o, isCorrect: e.target.checked } : o
                          ))
                        }
                        className="rounded"
                      />
                      <Input
                        value={opt.text}
                        onChange={(e) =>
                          onEditOptionsChange(editOptions.map((o, idx) =>
                            idx === i ? { ...o, text: e.target.value } : o
                          ))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
              {ex.type !== "MULTIPLE_CHOICE" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Gabarito</label>
                  <textarea
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                    value={editForm.answer}
                    onChange={(e) => onEditFormChange({ answer: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Explicação</label>
                <textarea
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={2}
                  value={editForm.explanation}
                  onChange={(e) => onEditFormChange({ explanation: e.target.value })}
                />
              </div>
              {editError && <p className="text-xs text-red-600">{editError}</p>}
              <div className="flex gap-2">
                <Button size="sm" onClick={(e) => { e.stopPropagation(); onSaveEdit(); }} loading={saving}>Salvar</Button>
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onCancelEdit(); }}>Cancelar</Button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Enunciado</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{ex.question}</p>
              </div>
              {ex.type === "MULTIPLE_CHOICE" && ex.options.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Opções</p>
                  <ul className="space-y-1">
                    {ex.options.map((opt, i) => (
                      <li
                        key={i}
                        className={`flex items-start gap-2 text-sm rounded px-2 py-1 ${opt.isCorrect ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-medium" : "text-gray-700 dark:text-gray-300"}`}
                      >
                        {opt.isCorrect ? "✅" : "○"} {opt.text}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {ex.answer && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Gabarito</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{ex.answer}</p>
                </div>
              )}
              {ex.explanation && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Explicação</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{ex.explanation}</p>
                </div>
              )}
              <p className="text-xs text-gray-400">
                Criado por {ex.createdBy.name}
                {ex.approvedBy && ` · Aprovado por ${ex.approvedBy.name}`}
              </p>
            </>
          )}

          {/* Action buttons */}
          {!isEditing && (
            <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
              {ex.status !== "APPROVED" && (
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={(e) => { e.stopPropagation(); onApprove(); }}
                  loading={saving}
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  Aprovar
                </Button>
              )}
              {ex.status !== "REJECTED" && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => { e.stopPropagation(); onReject(); }}
                  loading={saving}
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" />
                  Rejeitar
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onStartEdit(); }}>
                <Edit2 className="h-3.5 w-3.5 mr-1" />
                Editar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500 hover:text-red-600"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                loading={saving}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Excluir
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
