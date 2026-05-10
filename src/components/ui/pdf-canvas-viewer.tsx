"use client";

import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Highlighter,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCw,
  RotateCcw,
  Undo2,
  Redo2,
  Square,
  MessageSquare,
  Check,
  X,
} from "lucide-react";

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
  /** Optional user note/comment attached to this highlight */
  note?: string;
}

/** Word from Tesseract OCR with normalised coordinates [0,1] relative to canvas buffer */
interface OcrWord {
  text: string;
  x0n: number;
  y0n: number;
  x1n: number;
  y1n: number;
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
const ZOOM_STEP = 0.25;
const ZOOM_MIN = 0.25;
const ZOOM_MAX = 5.0;
const MAX_HISTORY = 50;
/** Padding subtracted from the scroll-container width to compute the fit-width baseline (2 × 16 px) */
const SCROLL_CONTAINER_PADDING = 32;
/** Fallback canvas aspect ratio when buffer dimensions are unavailable (√2 ≈ A4 paper ratio) */
const DEFAULT_ASPECT_RATIO = 1.414;
/** Vertical tolerance tuned in manual tests (mixed academic PDFs) to keep same-line words grouped. */
const SELECTION_LINE_TOLERANCE_RATIO = 0.6;
/** Horizontal gap tuned to reinsert missing spaces without over-spacing punctuation or hyphenation. */
const SELECTION_SPACE_GAP_RATIO = 0.18;

/** Returns true if the currently-focused element is a text-editing field */
function isEditableActive(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || el.isContentEditable;
}

function normalizeSelectionText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

interface SelectedToken {
  text: string;
  top: number;
  left: number;
  right: number;
  height: number;
}

function calculateSelectionLineTolerance(aHeight: number, bHeight: number): number {
  return Math.min(aHeight, bHeight) * SELECTION_LINE_TOLERANCE_RATIO;
}

function buildSelectionTextFromGeometry(wrapper: HTMLDivElement, range: Range): string {
  const nodes = Array.from(
    wrapper.querySelectorAll<HTMLSpanElement>(".pdf-text-layer span"),
  );
  const tokens: SelectedToken[] = [];

  for (const node of nodes) {
    let intersects = false;
    try {
      intersects = range.intersectsNode(node);
    } catch {
      // Can happen for stale/detached nodes while the text layer is being re-rendered.
      intersects = false;
    }
    if (!intersects) continue;

    const text = (node.textContent ?? "").trim();
    if (!text) continue;
    const rect = node.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;

    tokens.push({
      text,
      top: rect.top,
      left: rect.left,
      right: rect.right,
      height: rect.height,
    });
  }

  if (tokens.length === 0) return "";

  tokens.sort((a, b) => {
    const lineTolerance = calculateSelectionLineTolerance(a.height, b.height);
    if (Math.abs(a.top - b.top) <= lineTolerance) return a.left - b.left;
    return a.top - b.top;
  });

  let result = "";
  let previous: SelectedToken | null = null;

  for (const token of tokens) {
    if (!previous) {
      result += token.text;
      previous = token;
      continue;
    }

    const lineTolerance = calculateSelectionLineTolerance(previous.height, token.height);
    const isSameLine = Math.abs(token.top - previous.top) <= lineTolerance;

    if (!isSameLine) {
      result += "\n";
    } else {
      const gap = token.left - previous.right;
      const spaceThreshold = Math.min(previous.height, token.height) * SELECTION_SPACE_GAP_RATIO;
      if (gap > spaceThreshold) {
        result += " ";
      }
    }

    result += token.text;
    previous = token;
  }

  return normalizeSelectionText(result);
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PdfCanvasViewer({ url, storageKey, materialId }: PdfCanvasViewerProps) {
  const highlightKey = `pdf_highlights_${storageKey}`;
  const toolbarGroupClass =
    "flex items-center gap-1 rounded-xl border border-white/10 bg-[#0f172a]/70 px-1.5 py-1 shadow-sm";
  const iconButtonClass =
    "rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40";

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
  /** Id of the highlight whose note is currently being edited */
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInputValue, setNoteInputValue] = useState("");
  const [pdfReady, setPdfReady] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // ── Zoom & Rotation ────────────────────────────────────────────────────────
  const [zoom, setZoom] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  /** Current rendered canvas CSS-pixel width (drives wrapper width for scrolling) */
  const [wrapperWidth, setWrapperWidth] = useState(0);
  const [pageInput, setPageInput] = useState("1");

  // ── Undo / Redo ────────────────────────────────────────────────────────────
  const [historyStack, setHistoryStack] = useState<PdfHighlight[][]>(() => {
    if (typeof window === "undefined") return [[]];
    try {
      const saved = JSON.parse(
        localStorage.getItem(`pdf_highlights_${storageKey}`) ?? "[]",
      ) as PdfHighlight[];
      return [saved];
    } catch {
      return [[]];
    }
  });
  const [historyIdx, setHistoryIdx] = useState(0);

  // ── Scan detection & OCR ──────────────────────────────────────────────────
  const [ocrState, setOcrState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [ocrWords, setOcrWords] = useState<OcrWord[]>([]);

  // ── Area selection (rectangle drawing for scanned PDFs) ───────────────────
  const [markAreaMode, setMarkAreaMode] = useState(false);
  const [drawingRect, setDrawingRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  // ── Refs ───────────────────────────────────────────────────────────────────

  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const ocrTextLayerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const textLayerTaskRef = useRef<{ cancel: () => void } | null>(null);
  const dbSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawStartRef = useRef<{ x: number; y: number } | null>(null);

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

  // ── Reset OCR when page or rotation changes (not on zoom) ─────────────────

  useEffect(() => {
    setOcrState("idle");
    setOcrWords([]);
    if (ocrTextLayerRef.current) ocrTextLayerRef.current.innerHTML = "";
  }, [currentPage, rotation]);

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
      if (textLayerTaskRef.current) {
        try {
          textLayerTaskRef.current.cancel();
        } catch {
          // ignore
        }
        textLayerTaskRef.current = null;
      }

      try {
        const pdfDoc = pdfDocRef.current;
        if (!pdfDoc) return;
        const page = await pdfDoc.getPage(currentPage);
        if (cancelled) return;

        // Use scroll container width as base (not wrapper, which changes with zoom)
        const scrollEl = scrollContainerRef.current;
        const outerWidth = scrollEl ? scrollEl.clientWidth - SCROLL_CONTAINER_PADDING : 800;
        const viewport1 = page.getViewport({ scale: 1, rotation });
        const fitScale = outerWidth / viewport1.width;
        const scale = fitScale * zoom;
        const viewport = page.getViewport({ scale, rotation });

        // ── Canvas render ──────────────────────────────────────────────────
        // Apply devicePixelRatio so the canvas buffer matches physical pixels,
        // preventing blurriness on Retina / high-DPI (mobile) screens.
        const dpr = typeof window !== "undefined" ? (window.devicePixelRatio || 1) : 1;
        const cssWidth = Math.round(viewport.width);
        const cssHeight = Math.round(viewport.height);
        const canvas = canvasRef.current!;
        canvas.width = Math.round(cssWidth * dpr);
        canvas.height = Math.round(cssHeight * dpr);
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;
        const ctx = canvas.getContext("2d")!;
        if (dpr !== 1) ctx.scale(dpr, dpr);

        const renderTask = page.render({ canvas, canvasContext: ctx, viewport });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        if (cancelled) return;

        // Drive the wrapper width so the scroll container can scroll horizontally
        setWrapperWidth(cssWidth);

        // ── Text layer ─────────────────────────────────────────────────────
        const textLayerDiv = textLayerRef.current!;
        textLayerDiv.innerHTML = "";
        textLayerDiv.style.setProperty("--total-scale-factor", `${viewport.scale}`);
        textLayerDiv.style.setProperty("--scale-round-x", "1px");
        textLayerDiv.style.setProperty("--scale-round-y", "1px");

        const pdfjs = await import("pdfjs-dist");
        const textLayerInstance = new pdfjs.TextLayer({
          textContentSource: page.streamTextContent({
            // Keep pdf.js tokens untouched; copy/highlight normalization happens in our own helpers.
            includeMarkedContent: true,
            disableNormalization: true,
          }),
          container: textLayerDiv,
          viewport,
        });
        textLayerTaskRef.current = textLayerInstance;
        await textLayerInstance.render();
        if (cancelled) return;
        // Only clear the ref if this render still owns it.
        if (textLayerTaskRef.current === textLayerInstance) {
          textLayerTaskRef.current = null;
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
      if (textLayerTaskRef.current) {
        try {
          textLayerTaskRef.current.cancel();
        } catch {
          // ignore
        }
        textLayerTaskRef.current = null;
      }
    };
  }, [pdfReady, currentPage, zoom, rotation]);

  // ── Re-render OCR text layer when zoom changes (wrapperWidth updates) ─────

  useEffect(() => {
    const ocrDiv = ocrTextLayerRef.current;
    const canvas = canvasRef.current;
    if (!ocrDiv || !canvas || ocrWords.length === 0 || ocrState !== "done") return;

    ocrDiv.innerHTML = "";
    const bufW = canvas.width;
    const bufH = canvas.height;
    // canvas CSS display width ≈ wrapperWidth; height scales by aspect ratio
    const cssW = canvas.offsetWidth || wrapperWidth || bufW;
    const cssH = bufH > 0 && bufW > 0 ? cssW * (bufH / bufW) : cssW * DEFAULT_ASPECT_RATIO;

    for (const word of ocrWords) {
      const span = document.createElement("span");
      span.textContent = word.text;
      const wordHeightPx = (word.y1n - word.y0n) * cssH;
      span.style.cssText = `
        left:${word.x0n * 100}%;
        top:${word.y0n * 100}%;
        width:${(word.x1n - word.x0n) * 100}%;
        font-size:${wordHeightPx * 0.82}px;
        line-height:${wordHeightPx}px;
        overflow:hidden;
        white-space:nowrap;
        user-select:text;
        -webkit-user-select:text;
      `;
      ocrDiv.appendChild(span);
    }
  }, [ocrWords, ocrState, wrapperWidth]);

  // ── Ctrl+scroll / Cmd+scroll for zoom ─────────────────────────────────────

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      if (e.deltaY < 0) {
        setZoom((z) => Math.min(parseFloat((z + ZOOM_STEP).toFixed(2)), ZOOM_MAX));
      } else {
        setZoom((z) => Math.max(parseFloat((z - ZOOM_STEP).toFixed(2)), ZOOM_MIN));
      }
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, []);

  // ── Keyboard shortcuts (Ctrl+Z undo, Ctrl+Y redo, Delete) ─────────────────

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't hijack shortcuts when the user is typing in a form field
      if (isEditableActive()) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        setHistoryIdx((prev) => {
          if (prev <= 0) return prev;
          const newIdx = prev - 1;
          // Apply via ref-captured setter; history stack is stable between renders
          return newIdx;
        });
      } else if (ctrl && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        setHistoryIdx((prev) => prev + 1); // clamped in effect below
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Apply history when historyIdx changes (from keyboard or buttons)
  // We use a ref to track "last applied index" to avoid double-applying on same index
  const lastAppliedIdxRef = useRef(-1);
  useEffect(() => {
    const clamped = Math.max(0, Math.min(historyIdx, historyStack.length - 1));
    if (clamped !== historyIdx) {
      setHistoryIdx(clamped);
      return;
    }
    if (clamped === lastAppliedIdxRef.current) return;
    lastAppliedIdxRef.current = clamped;
    const snapshot = historyStack[clamped];
    if (snapshot !== undefined) {
      setHighlights(snapshot);
      try {
        localStorage.setItem(highlightKey, JSON.stringify(snapshot));
      } catch {
        // ignore
      }
    }
  }, [historyIdx, historyStack, highlightKey]);

  // ── Persist page to localStorage + DB (DB writes are debounced 1 s) ────────

  useEffect(() => {
    if (!pdfReady) return;
    try {
      localStorage.setItem(storageKey, String(currentPage));
    } catch {
      // ignore storage errors
    }
    if (materialId) {
      if (dbSaveTimerRef.current) clearTimeout(dbSaveTimerRef.current);
      dbSaveTimerRef.current = setTimeout(() => {
        fetch(`/api/materials/${materialId}/progress`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPage }),
        }).catch(() => {});
      }, 1000);
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

  // ── Push to history stack ─────────────────────────────────────────────────

  const pushToHistory = useCallback(
    (updated: PdfHighlight[]) => {
      saveHighlights(updated);
      setHistoryStack((prev) => {
        const truncated = prev.slice(0, historyIdx + 1);
        const next = [...truncated, updated];
        return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
      });
      const newIdx = Math.min(historyIdx + 1, MAX_HISTORY - 1);
      setHistoryIdx(newIdx);
      lastAppliedIdxRef.current = newIdx;
    },
    [saveHighlights, historyIdx],
  );

  // ── Save note to a highlight (no new history entry — just a quick mutation) ──

  const saveNote = useCallback(
    (id: string, note: string) => {
      const updated = highlights.map((h) => (h.id === id ? { ...h, note: note.trim() || undefined } : h));
      saveHighlights(updated);
      // Also patch current history snapshot so undo restores the note
      setHistoryStack((prev) =>
        prev.map((snap, i) =>
          i === historyIdx
            ? snap.map((h) => (h.id === id ? { ...h, note: note.trim() || undefined } : h))
            : snap,
        ),
      );
    },
    [highlights, saveHighlights, historyIdx],
  );

  const getNormalizedSelectionText = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return "";

    const raw = normalizeSelectionText(selection.toString());
    if (selection.rangeCount === 0) return raw;

    const wrapper = wrapperRef.current;
    if (!wrapper) return raw;

    const range = selection.getRangeAt(0);
    const geometric = buildSelectionTextFromGeometry(wrapper, range);
    return geometric || raw;
  }, []);

  const handleCopy = useCallback(
    (e: React.ClipboardEvent<HTMLDivElement>) => {
      const selection = window.getSelection();
      const wrapper = wrapperRef.current;
      if (!selection || selection.isCollapsed || !wrapper || selection.rangeCount === 0) return;

      const range = selection.getRangeAt(0);
      if (!wrapper.contains(range.commonAncestorContainer)) return;

      const normalized = getNormalizedSelectionText();
      if (!normalized) return;

      e.preventDefault();
      e.clipboardData.setData("text/plain", normalized);
    },
    [getNormalizedSelectionText],
  );

  // ── Capture text selection as highlight ──────────────────────────────────

  const handleMouseUp = useCallback(() => {
    if (!highlightMode || markAreaMode) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    const range = selection.getRangeAt(0);
    const text = getNormalizedSelectionText();
    if (!text) return;
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
      id: crypto.randomUUID(),
      page: currentPage,
      text,
      rects,
      color: selectedColor,
      createdAt: new Date().toISOString(),
    };

    pushToHistory([...highlights, hl]);
    selection.removeAllRanges();
  }, [highlightMode, markAreaMode, currentPage, selectedColor, highlights, pushToHistory, getNormalizedSelectionText]);

  // ── Delete selected highlight via keyboard (Delete / Backspace) ───────────

  useEffect(() => {
    if (!selectedId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in a form field
      if (isEditableActive()) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        pushToHistory(highlights.filter((h) => h.id !== selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedId, highlights, pushToHistory]);

  // ── Area selection ────────────────────────────────────────────────────────

  const handleAreaMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!markAreaMode) return;
      e.preventDefault();
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      drawStartRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    },
    [markAreaMode],
  );

  const handleAreaMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!markAreaMode || !drawStartRef.current) return;
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const start = drawStartRef.current;
      setDrawingRect({
        x: Math.min(x, start.x),
        y: Math.min(y, start.y),
        w: Math.abs(x - start.x),
        h: Math.abs(y - start.y),
      });
    },
    [markAreaMode],
  );

  const handleAreaMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!markAreaMode || !drawStartRef.current) return;
      e.preventDefault();
      const wrapper = wrapperRef.current;
      if (!wrapper || !drawingRect) {
        drawStartRef.current = null;
        setDrawingRect(null);
        return;
      }
      const { clientWidth: w, clientHeight: h } = wrapper;
      const topPct = (drawingRect.y / h) * 100;
      const leftPct = (drawingRect.x / w) * 100;
      const widthPct = (drawingRect.w / w) * 100;
      const heightPct = (drawingRect.h / h) * 100;
      if (widthPct > 0.5 && heightPct > 0.5) {
        const hl: PdfHighlight = {
          id: crypto.randomUUID(),
          page: currentPage,
          text: "[área marcada]",
          rects: [{ top: topPct, left: leftPct, width: widthPct, height: heightPct }],
          color: selectedColor,
          createdAt: new Date().toISOString(),
        };
        pushToHistory([...highlights, hl]);
      }
      setDrawingRect(null);
      drawStartRef.current = null;
    },
    [markAreaMode, drawingRect, currentPage, selectedColor, highlights, pushToHistory],
  );

  // ── Navigation ─────────────────────────────────────────────────────────────

  const goTo = useCallback(
    (page: number) => {
      if (!Number.isFinite(page)) {
        setPageInput(String(currentPage));
        return;
      }
      setCurrentPage(Math.max(1, Math.min(numPages, page)));
      setSelectedId(null);
      setEditingNoteId(null);
      setNoteInputValue("");
    },
    [currentPage, numPages],
  );

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  // ── Derived ────────────────────────────────────────────────────────────────

  const pageHighlights = highlights.filter((h) => h.page === currentPage);
  const canUndo = historyIdx > 0;
  const canRedo = historyIdx < historyStack.length - 1;

  // Text layer is interactive for text selection/copy unless in area-draw mode.
  // Highlight creation is still gated by highlightMode inside handleMouseUp.
  const textLayerActive = !markAreaMode && ocrState !== "done";
  // OCR layer is interactive in highlight mode after OCR is done
  const ocrLayerActive = highlightMode && ocrState === "done";

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <div className="flex items-center justify-center h-full text-white p-8">
        <p className="text-red-400 text-sm">Erro ao carregar PDF: {loadError}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-[#2f3847]">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#111827] px-3 py-2.5 flex-shrink-0">
        {/* Page navigation */}
        <div className={toolbarGroupClass}>
          <button
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage <= 1}
            className={iconButtonClass}
            title="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1">
            <input
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value.replace(/\D+/g, ""))}
              onBlur={() => goTo(parseInt(pageInput || "1", 10))}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  goTo(parseInt(pageInput || "1", 10));
                  (e.currentTarget as HTMLInputElement).blur();
                }
              }}
              inputMode="numeric"
              className="w-10 bg-transparent text-center text-xs font-medium tabular-nums text-white outline-none"
              aria-label="Página atual"
            />
            <span className="text-xs text-slate-400">/ {numPages || "—"}</span>
          </div>
          <button
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage >= numPages}
            className={iconButtonClass}
            title="Próxima página"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* ── Zoom controls ─────────────────────────────────────────────── */}
        <div className={toolbarGroupClass}>
          <button
            onClick={() => setZoom((z) => Math.max(parseFloat((z - ZOOM_STEP).toFixed(2)), ZOOM_MIN))}
            disabled={zoom <= ZOOM_MIN}
            className={iconButtonClass}
            title="Diminuir zoom (Ctrl+Scroll)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="min-w-[52px] text-center text-xs font-medium tabular-nums text-white">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(parseFloat((z + ZOOM_STEP).toFixed(2)), ZOOM_MAX))}
            disabled={zoom >= ZOOM_MAX}
            className={iconButtonClass}
            title="Aumentar zoom (Ctrl+Scroll)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => setZoom(1.0)}
            disabled={zoom === 1.0}
            className={iconButtonClass}
            title="Ajustar à largura (zoom 100%)"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {/* ── Rotation controls ─────────────────────────────────────────── */}
        <div className={toolbarGroupClass}>
          <button
            onClick={() => setRotation((r) => (r - 90 + 360) % 360)}
            className={iconButtonClass}
            title="Girar 90° para a esquerda"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className={iconButtonClass}
            title="Girar 90° para a direita"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>

        {/* ── Undo / Redo ───────────────────────────────────────────────── */}
        <div className={toolbarGroupClass}>
          <button
            onClick={() => setHistoryIdx((i) => Math.max(0, i - 1))}
            disabled={!canUndo}
            className={iconButtonClass}
            title="Desfazer (Ctrl+Z)"
          >
            <Undo2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setHistoryIdx((i) => Math.min(historyStack.length - 1, i + 1))}
            disabled={!canRedo}
            className={iconButtonClass}
            title="Refazer (Ctrl+Y)"
          >
            <Redo2 className="h-4 w-4" />
          </button>
        </div>

        {/* ── Highlight mode toggle ─────────────────────────────────────── */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#0f172a]/70 px-2 py-1 shadow-sm">
          <button
            onClick={() => {
              setHighlightMode((v) => !v);
              if (markAreaMode) setMarkAreaMode(false);
              setSelectedId(null);
            }}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
              highlightMode
                ? "bg-yellow-300 text-slate-950 font-semibold"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
            title="Modo marca-texto: ative e selecione o texto para marcar"
          >
            <Highlighter className="h-3.5 w-3.5" />
            Marca-texto
          </button>

          {/* ── Area selection mode ───────────────────────────────────────── */}
          <button
            onClick={() => {
              setMarkAreaMode((v) => !v);
              if (highlightMode) setHighlightMode(false);
              setSelectedId(null);
            }}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
              markAreaMode
                ? "bg-sky-300 text-slate-950 font-semibold"
                : "text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
            title="Marcar área (retângulo) — útil para PDFs digitalizados"
          >
            <Square className="h-3.5 w-3.5" />
            Área
          </button>

          {/* Color picker — visible in either marking mode */}
          {(highlightMode || markAreaMode) && (
            <div className="flex items-center gap-1 rounded-lg bg-white/5 px-1 py-1">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 ${
                    selectedColor === color ? "scale-110 border-white" : "border-transparent"
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Cor ${color}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Delete selected highlight */}
        {selectedId && (
          <>
            <div className={toolbarGroupClass}>
              <button
                onClick={() => {
                  const hl = highlights.find((h) => h.id === selectedId);
                  if (editingNoteId === selectedId) {
                    setEditingNoteId(null);
                    setNoteInputValue("");
                  } else {
                    setEditingNoteId(selectedId);
                    setNoteInputValue(hl?.note ?? "");
                  }
                }}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                  editingNoteId === selectedId
                    ? "bg-indigo-500 text-white"
                    : highlights.find((h) => h.id === selectedId)?.note
                      ? "text-indigo-300 hover:bg-indigo-500/15"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
                title="Adicionar / editar comentário"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Comentar
              </button>
              <button
                onClick={() => {
                  pushToHistory(highlights.filter((h) => h.id !== selectedId));
                  setSelectedId(null);
                  setEditingNoteId(null);
                  setNoteInputValue("");
                }}
                className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs text-red-300 transition-colors hover:bg-red-500/15 hover:text-red-200"
                title="Apagar marca-texto selecionado (Delete)"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Apagar
              </button>
            </div>
          </>
        )}

        {/* Total highlight count */}
        {highlights.length > 0 && (
          <span className="ml-auto rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
            {highlights.length} marca{highlights.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Note editing panel ───────────────────────────────────────────── */}
      {editingNoteId && (
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-950/80 border-b border-indigo-800 flex-shrink-0">
          <MessageSquare className="h-4 w-4 text-indigo-300 flex-shrink-0" />
          <input
            autoFocus
            type="text"
            value={noteInputValue}
            onChange={(e) => setNoteInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                saveNote(editingNoteId, noteInputValue);
                setEditingNoteId(null);
                setNoteInputValue("");
              } else if (e.key === "Escape") {
                setEditingNoteId(null);
                setNoteInputValue("");
              }
            }}
            placeholder="Digite seu comentário e pressione Enter…"
            className="flex-1 bg-transparent text-sm text-white placeholder:text-indigo-400 outline-none"
          />
          <button
            onClick={() => {
              saveNote(editingNoteId, noteInputValue);
              setEditingNoteId(null);
              setNoteInputValue("");
            }}
            className="p-1 text-green-400 hover:text-green-300"
            title="Salvar comentário (Enter)"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setEditingNoteId(null);
              setNoteInputValue("");
            }}
            className="p-1 text-gray-400 hover:text-gray-300"
            title="Cancelar (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── PDF canvas area ──────────────────────────────────────────────── */}
      <div ref={scrollContainerRef} className="flex-1 overflow-auto bg-[#525659] p-4 sm:p-6">
        {!pdfReady && (
          <div className="flex items-center justify-center h-32">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
          </div>
        )}

        {pdfReady && (
          <div className="flex justify-center">
            <div
              ref={wrapperRef}
              className="relative bg-white shadow-xl"
              style={{
                width: wrapperWidth > 0 ? `${wrapperWidth}px` : "100%",
                maxWidth: zoom > 1 ? "none" : "56rem",
                userSelect: markAreaMode ? "none" : "text",
                cursor: markAreaMode ? "crosshair" : "default",
              }}
              onMouseDown={handleAreaMouseDown}
              onMouseMove={handleAreaMouseMove}
              onCopy={handleCopy}
              onMouseUp={(e) => {
                handleAreaMouseUp(e);
                handleMouseUp();
              }}
              onMouseLeave={() => {
                if (markAreaMode) {
                  setDrawingRect(null);
                  drawStartRef.current = null;
                }
              }}
              onClick={() => {
                if (!markAreaMode) {
                  setSelectedId(null);
                  setEditingNoteId(null);
                  setNoteInputValue("");
                }
              }}
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
                      setSelectedId((prev) => {
                        if (prev === hl.id) {
                          setEditingNoteId(null);
                          setNoteInputValue("");
                          return null;
                        }
                        setEditingNoteId(null);
                        setNoteInputValue("");
                        return hl.id;
                      });
                    }}
                    title={hl.note ? `${hl.text}\n\n💬 ${hl.note}` : hl.text}
                  >
                    {/* Note indicator badge on the last rect only */}
                    {hl.note && ri === hl.rects.length - 1 && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-6px",
                          right: "-6px",
                          background: "#6366f1",
                          borderRadius: "50%",
                          width: "14px",
                          height: "14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          pointerEvents: "none",
                          mixBlendMode: "normal",
                          opacity: 1,
                        }}
                        title={hl.note}
                      >
                        <svg width="8" height="8" viewBox="0 0 8 8" fill="white">
                          <path d="M1 1h6v4H4.5L3 6.5V5H1z" />
                        </svg>
                      </span>
                    )}
                  </div>
                )),
              )}

              {/* Text layer — spans are transparent so only selection colour shows */}
              <div
                ref={textLayerRef}
                className="pdf-text-layer textLayer"
                style={{ pointerEvents: textLayerActive ? "auto" : "none" }}
              />

              {/* OCR text layer — populated after running Tesseract */}
              <div
                ref={ocrTextLayerRef}
                className="pdf-text-layer"
                style={{ pointerEvents: ocrLayerActive ? "auto" : "none" }}
              />

              {/* Drawing rect preview (area selection mode) */}
              {drawingRect && markAreaMode && (
                <div
                  style={{
                    position: "absolute",
                    top: `${drawingRect.y}px`,
                    left: `${drawingRect.x}px`,
                    width: `${drawingRect.w}px`,
                    height: `${drawingRect.h}px`,
                    border: `2px dashed ${selectedColor}`,
                    backgroundColor: selectedColor,
                    opacity: 0.3,
                    pointerEvents: "none",
                  }}
                />
              )}

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
