"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, Highlighter, Trash2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface HighlightRect {
  /** % of page wrapper height */
  top: number;
  /** % of page wrapper width */
  left: number;
  width: number;
  height: number;
}

export interface PdfHighlight {
  id: string;
  /** 1-indexed page number */
  page: number;
  /** Selected text */
  text: string;
  /** Bounding rects as % of the page wrapper, so they are scale-independent */
  rects: HighlightRect[];
  color: string;
  createdAt: string;
}

interface PdfCanvasViewerProps {
  url: string;
  /** localStorage key used to persist page and highlights */
  storageKey: string;
  /** If provided, reading progress is also saved to the DB */
  materialId?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const HIGHLIGHT_COLORS = ["#ffeb3b", "#a5d6a7", "#90caf9", "#ffcc80", "#f48fb1"];
const WORKER_SRC = "/pdf.worker.min.mjs";

// ── Helper: combine two 2-D affine matrices ────────────────────────────────────
// Each matrix is [a, b, c, d, e, f] representing:
//   | a  c  e |
//   | b  d  f |
//   | 0  0  1 |
function multiplyMatrix(
  [a1, b1, c1, d1, e1, f1]: number[],
  [a2, b2, c2, d2, e2, f2]: number[],
): number[] {
  return [
    a1 * a2 + c1 * b2,
    b1 * a2 + d1 * b2,
    a1 * c2 + c1 * d2,
    b1 * c2 + d1 * d2,
    a1 * e2 + c1 * f2 + e1,
    b1 * e2 + d1 * f2 + f1,
  ];
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PdfCanvasViewer({ url, storageKey, materialId }: PdfCanvasViewerProps) {
  const highlightKey = `pdf_highlights_${storageKey}`;

  // ── State ──────────────────────────────────────────────────────────────────

  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window === "undefined") return 1;
    const saved = parseInt(localStorage.getItem(storageKey) ?? "1", 10);
    return Number.isFinite(saved) && saved > 0 ? saved : 1;
  });
  const [highlights, setHighlights] = useState<PdfHighlight[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(highlightKey) ?? "[]") as PdfHighlight[];
    } catch {
      return [];
    }
  });

  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0]);
  const [highlightMode, setHighlightMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pdfReady, setPdfReady] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Refs ───────────────────────────────────────────────────────────────────

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfDocRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderTaskRef = useRef<any>(null);

  // ── Load PDF document ──────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    setLoadError(null);
    setPdfReady(false);
    pdfDocRef.current = null;

    const load = async () => {
      const pdfjs = await import("pdfjs-dist");
      if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
      }
      const doc = await pdfjs.getDocument(url).promise;
      if (cancelled) return;
      pdfDocRef.current = doc;
      setNumPages(doc.numPages);
      // Clamp saved page to valid range
      setCurrentPage((prev) => Math.max(1, Math.min(doc.numPages, prev)));
      setPdfReady(true);
    };

    load().catch((err) => {
      if (!cancelled) setLoadError(String(err));
    });

    return () => {
      cancelled = true;
    };
  }, [url]);

  // ── Render current page ───────────────────────────────────────────────────

  useEffect(() => {
    if (!pdfReady || !pdfDocRef.current) return;
    let cancelled = false;

    const render = async () => {
      setIsRendering(true);

      // Cancel any in-flight render
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
        renderTaskRef.current = null;
      }

      try {
        const page = await pdfDocRef.current.getPage(currentPage);
        if (cancelled) return;

        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const containerWidth = wrapper.clientWidth || 800;
        const viewport1 = page.getViewport({ scale: 1 });
        const scale = containerWidth / viewport1.width;
        const viewport = page.getViewport({ scale });

        // ── Canvas render ──────────────────────────────────────────────────
        const canvas = canvasRef.current!;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d")!;

        const renderTask = page.render({ canvasContext: ctx, viewport });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        if (cancelled) return;

        // ── Text layer ─────────────────────────────────────────────────────
        const textLayerDiv = textLayerRef.current!;
        textLayerDiv.style.width = `${viewport.width}px`;
        textLayerDiv.style.height = `${viewport.height}px`;
        textLayerDiv.innerHTML = "";

        const textContent = await page.getTextContent();
        if (cancelled) return;

        const vt: number[] = viewport.transform; // [a,b,c,d,e,f]

        for (const item of textContent.items as Array<{
          str?: string;
          transform: number[];
          width: number;
          height: number;
        }>) {
          if (!item.str) continue;
          const m = multiplyMatrix(vt, item.transform);
          const span = document.createElement("span");
          span.textContent = item.str;
          span.style.cssText = `
            position:absolute;
            left:0;top:0;
            transform:matrix(${m[0]},${m[1]},${m[2]},${m[3]},${m[4]},${m[5]});
            transform-origin:0% 0%;
            color:transparent;
            white-space:pre;
            cursor:text;
            user-select:text;
            -webkit-user-select:text;
          `;
          textLayerDiv.appendChild(span);
        }
      } catch (err: unknown) {
        // RenderingCancelledException is expected — not a real error
        if (!cancelled) {
          const name = (err as { name?: string })?.name;
          if (name !== "RenderingCancelledException") {
            console.error("[PdfCanvasViewer] render error", err);
          }
        }
      } finally {
        if (!cancelled) setIsRendering(false);
      }
    };

    render();
    return () => {
      cancelled = true;
    };
  }, [pdfReady, currentPage]);

  // ── Persist page to localStorage + DB ────────────────────────────────────

  useEffect(() => {
    if (!pdfReady) return;
    try {
      localStorage.setItem(storageKey, String(currentPage));
    } catch {
      // ignore storage errors
    }
    if (materialId) {
      fetch(`/api/materials/${materialId}/progress`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPage }),
      }).catch(() => {});
    }
  }, [currentPage, pdfReady, storageKey, materialId]);

  // ── Persist highlights to localStorage ───────────────────────────────────

  const saveHighlights = useCallback(
    (updated: PdfHighlight[]) => {
      setHighlights(updated);
      try {
        localStorage.setItem(highlightKey, JSON.stringify(updated));
      } catch {
        // ignore
      }
    },
    [highlightKey],
  );

  // ── Capture text selection as highlight ──────────────────────────────────

  const handleMouseUp = useCallback(() => {
    if (!highlightMode) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) return;

    const text = selection.toString();
    const range = selection.getRangeAt(0);
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const wRect = wrapper.getBoundingClientRect();
    const rects = Array.from(range.getClientRects())
      .filter((r) => r.width > 0 && r.height > 0)
      .map((r) => ({
        top: ((r.top - wRect.top) / wRect.height) * 100,
        left: ((r.left - wRect.left) / wRect.width) * 100,
        width: (r.width / wRect.width) * 100,
        height: (r.height / wRect.height) * 100,
      }));

    if (rects.length === 0) return;

    const hl: PdfHighlight = {
      id: `hl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      page: currentPage,
      text,
      rects,
      color: selectedColor,
      createdAt: new Date().toISOString(),
    };

    saveHighlights([...highlights, hl]);
    selection.removeAllRanges();
  }, [highlightMode, currentPage, selectedColor, highlights, saveHighlights]);

  // ── Navigation ─────────────────────────────────────────────────────────────

  const goTo = useCallback(
    (page: number) => setCurrentPage(Math.max(1, Math.min(numPages, page))),
    [numPages],
  );

  // ── Derived ────────────────────────────────────────────────────────────────

  const pageHighlights = highlights.filter((h) => h.page === currentPage);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full text-white p-8">
        <p className="text-red-400 text-sm">Erro ao carregar PDF: {loadError}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-800">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border-b border-gray-700 flex-shrink-0 flex-wrap">
        {/* Page navigation */}
        <button
          onClick={() => goTo(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1 text-gray-300 hover:text-white disabled:opacity-40 rounded"
          title="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs text-gray-300 tabular-nums min-w-[70px] text-center">
          {numPages > 0 ? `${currentPage} / ${numPages}` : "…"}
        </span>
        <button
          onClick={() => goTo(currentPage + 1)}
          disabled={currentPage >= numPages}
          className="p-1 text-gray-300 hover:text-white disabled:opacity-40 rounded"
          title="Próxima página"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="w-px h-5 bg-gray-700 mx-1" />

        {/* Highlight mode toggle */}
        <button
          onClick={() => {
            setHighlightMode((v) => !v);
            setSelectedId(null);
          }}
          className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
            highlightMode
              ? "bg-yellow-400 text-gray-900 font-medium"
              : "text-gray-300 hover:text-white border border-gray-600"
          }`}
          title="Modo marca-texto: ative e selecione o texto para marcar"
        >
          <Highlighter className="h-3.5 w-3.5" />
          Marca-texto
        </button>

        {/* Color picker — visible only in highlight mode */}
        {highlightMode && (
          <div className="flex items-center gap-1">
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                  selectedColor === color ? "border-white scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
                title={`Cor ${color}`}
              />
            ))}
          </div>
        )}

        {/* Delete selected highlight */}
        {selectedId && (
          <>
            <div className="w-px h-5 bg-gray-700 mx-1" />
            <button
              onClick={() => {
                saveHighlights(highlights.filter((h) => h.id !== selectedId));
                setSelectedId(null);
              }}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 border border-red-800 rounded px-2 py-1"
              title="Apagar marca-texto selecionado"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Apagar
            </button>
          </>
        )}

        {/* Total highlight count */}
        {highlights.length > 0 && (
          <span className="ml-auto text-xs text-gray-400">
            {highlights.length} marca{highlights.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── PDF canvas area ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto bg-gray-700 p-4">
        {!pdfReady && (
          <div className="flex items-center justify-center h-32">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        )}

        {pdfReady && (
          <div className="max-w-4xl mx-auto">
            <div
              ref={wrapperRef}
              className="relative bg-white shadow-xl"
              style={{ userSelect: highlightMode ? "text" : "none" }}
              onMouseUp={handleMouseUp}
              onClick={() => setSelectedId(null)}
            >
              {/* Page canvas */}
              <canvas ref={canvasRef} className="block w-full" />

              {/* Highlight overlays for the current page */}
              {pageHighlights.map((hl) =>
                hl.rects.map((rect, ri) => (
                  <div
                    key={`${hl.id}-${ri}`}
                    style={{
                      position: "absolute",
                      top: `${rect.top}%`,
                      left: `${rect.left}%`,
                      width: `${rect.width}%`,
                      height: `${rect.height}%`,
                      backgroundColor: hl.color,
                      opacity: selectedId === hl.id ? 0.75 : 0.45,
                      cursor: "pointer",
                      mixBlendMode: "multiply",
                      pointerEvents: "auto",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId((prev) => (prev === hl.id ? null : hl.id));
                    }}
                    title={hl.text}
                  />
                )),
              )}

              {/* Text layer — spans are transparent so only selection colour shows */}
              <div
                ref={textLayerRef}
                className="pdf-text-layer"
                style={{ pointerEvents: highlightMode ? "auto" : "none" }}
              />

              {/* Rendering spinner */}
              {isRendering && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
