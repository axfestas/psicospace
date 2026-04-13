"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Presentation, Globe, AlertCircle } from "lucide-react";

interface PdfPreviewProps {
  url: string;
  type: "PDF" | "SLIDE" | "LINK";
  title: string;
  onClick?: () => void;
}

/** Renders a small preview thumbnail for library items. */
export function PdfPreview({ url, type, title, onClick }: PdfPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<"loading" | "done" | "error">("loading");

  useEffect(() => {
    if (type !== "PDF") {
      setState("done");
      return;
    }

    let cancelled = false;

    async function render() {
      try {
        const pdfjsLib = await import("pdfjs-dist");

        // Set worker source — served as a static public file
        if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
          pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        }

        // Send credentials (auth cookie) only for same-origin URLs such as
        // /api/files/… — external URLs must NOT use withCredentials because
        // that requires the server to send Access-Control-Allow-Credentials,
        // and most external hosts don't, causing a CORS failure.
        const isSameOrigin =
          url.startsWith("/") ||
          (typeof window !== "undefined" &&
            url.startsWith(window.location.origin));
        const loadingTask = pdfjsLib.getDocument({
          url,
          withCredentials: isSameOrigin,
        });

        const pdf = await loadingTask.promise;
        if (cancelled) return;

        const page = await pdf.getPage(1);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const desiredWidth = 160;
        const viewport = page.getViewport({ scale: 1 });
        const scale = desiredWidth / viewport.width;
        const scaledViewport = page.getViewport({ scale });

        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) { setState("error"); return; }

        await page.render({ canvas, canvasContext: ctx, viewport: scaledViewport }).promise;
        if (!cancelled) setState("done");
      } catch {
        if (!cancelled) setState("error");
      }
    }

    render();
    return () => { cancelled = true; };
  }, [url, type]);

  const wrapperClass =
    "w-full h-44 flex items-center justify-center rounded-t-lg cursor-pointer overflow-hidden";

  if (type === "SLIDE") {
    return (
      <div
        className={`${wrapperClass} bg-orange-50 dark:bg-orange-900/20`}
        onClick={onClick}
        title={title}
      >
        <Presentation className="h-16 w-16 text-orange-300 dark:text-orange-600" />
      </div>
    );
  }

  if (type === "LINK") {
    return (
      <div
        className={`${wrapperClass} bg-blue-50 dark:bg-blue-900/20`}
        onClick={onClick}
        title={title}
      >
        <Globe className="h-16 w-16 text-blue-300 dark:text-blue-600" />
      </div>
    );
  }

  // PDF
  return (
    <div
      className={`${wrapperClass} bg-gray-50 dark:bg-gray-800 relative`}
      onClick={onClick}
      title={title}
    >
      {state === "loading" && (
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-red-400 border-t-transparent" />
      )}
      {state === "error" && (
        <div className="flex flex-col items-center gap-1 text-gray-400">
          <AlertCircle className="h-10 w-10" />
          <FileText className="h-6 w-6" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={`w-full h-full object-contain ${state !== "done" ? "hidden" : ""}`}
      />
    </div>
  );
}
