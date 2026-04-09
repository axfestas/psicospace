"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import FontFamily from "@tiptap/extension-font-family";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension, Node, Mark, mergeAttributes } from "@tiptap/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import {
  Bold, Italic, UnderlineIcon, Strikethrough, AlignLeft, AlignCenter,
  AlignRight, AlignJustify, List, ListOrdered, Link2, Plus, Trash2,
  FileText, Save, Undo2, Redo2, Subscript as SubIcon, Superscript as SupIcon,
  Code, Code2, Quote, Minus, Table as TableIcon, Image as ImageIcon,
  ListChecks, Highlighter, Columns, Printer, Download, X, Check,
  ChevronDown, RemoveFormatting, Indent, Outdent, Search, BookOpen,
  FileDown, BookMarked, Type, Settings, StickyNote, PanelTop, PanelBottom,
  MessageSquare, Upload, LayoutTemplate, Eye, EyeOff, Target, Clock,
  Maximize2, Minimize2, Tag, Keyboard, Hash, Filter, ChevronRight, Pencil,
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  content: string;
  updatedAt: string;
}

type PageMargin = "narrow" | "normal" | "wide";
type PageOrientation = "portrait" | "landscape";

interface CommentData {
  text: string;
  createdAt: string;
}

interface DocMeta {
  html: string;
  header?: string;
  footer?: string;
  margin?: PageMargin;
  orientation?: PageOrientation;
  comments?: Record<string, CommentData>;
  versions?: VersionSnapshot[];
  tags?: string[];
}

// ── Version snapshot ─────────────────────────────────────────────────────────
interface VersionSnapshot {
  at: string;
  title: string;
  html: string;
  header?: string;
  footer?: string;
}

function parseDocContent(raw: string): DocMeta {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.html === "string") return parsed as DocMeta;
  } catch { /* not JSON, treat as plain HTML */ }
  return { html: raw };
}

function serializeDocContent(meta: DocMeta): string {
  return JSON.stringify(meta);
}

// ── Document templates ──────────────────────────────────────────────────────
interface DocTemplate {
  id: string;
  label: string;
  description: string;
  title: string;
  html: string;
  header?: string;
  footer?: string;
}

const DOCUMENT_TEMPLATES: DocTemplate[] = [
  {
    id: "blank",
    label: "Em branco",
    description: "Documento vazio",
    title: "Novo Documento",
    html: "",
  },
  {
    id: "abnt",
    label: "Artigo ABNT",
    description: "Estrutura padrão ABNT para artigos científicos",
    title: "Artigo Científico",
    html: `<h1>Título do Artigo</h1>
<p><strong>Autor:</strong> Nome do Autor</p>
<p><strong>Instituição:</strong> Nome da Instituição</p>
<p><strong>E-mail:</strong> email@exemplo.com</p>
<h2>Resumo</h2>
<p>Escreva aqui o resumo do artigo (máximo 250 palavras). O resumo deve apresentar de forma concisa os objetivos, metodologia, resultados e conclusões do trabalho.</p>
<p><strong>Palavras-chave:</strong> palavra1; palavra2; palavra3.</p>
<h2>Abstract</h2>
<p>Write the abstract here (maximum 250 words).</p>
<p><strong>Keywords:</strong> keyword1; keyword2; keyword3.</p>
<h2>1. Introdução</h2>
<p>Apresente o contexto do estudo, justificativa e objetivos.</p>
<h2>2. Fundamentação Teórica</h2>
<p>Descreva o referencial teórico que embasou a pesquisa.</p>
<h2>3. Metodologia</h2>
<p>Descreva os procedimentos metodológicos utilizados.</p>
<h2>4. Resultados e Discussão</h2>
<p>Apresente e discuta os resultados obtidos.</p>
<h2>5. Conclusão</h2>
<p>Sintetize as principais conclusões do trabalho.</p>
<h2>Referências</h2>
<p>SOBRENOME, Nome. <em>Título da obra</em>. Cidade: Editora, Ano.</p>`,
  },
  {
    id: "relatorio_clinico",
    label: "Relatório Clínico",
    description: "Relatório de acompanhamento psicológico",
    title: "Relatório Clínico Psicológico",
    html: `<h1>Relatório Clínico Psicológico</h1>
<p><strong>Data:</strong> ___/___/______</p>
<p><strong>Psicólogo(a):</strong> _____________________________ &nbsp;&nbsp; <strong>CRP:</strong> __________</p>
<h2>1. Identificação do Paciente</h2>
<p><strong>Nome:</strong> _____________________________</p>
<p><strong>Data de Nascimento:</strong> ___/___/______ &nbsp;&nbsp; <strong>Idade:</strong> ______</p>
<p><strong>Encaminhado por:</strong> _____________________________</p>
<h2>2. Motivo do Atendimento</h2>
<p>Descreva aqui a queixa principal e o motivo do encaminhamento.</p>
<h2>3. Histórico Clínico Relevante</h2>
<p>Descreva o histórico clínico, tratamentos anteriores e informações relevantes.</p>
<h2>4. Procedimentos Utilizados</h2>
<p>Descreva os instrumentos e técnicas utilizadas no processo avaliativo/terapêutico.</p>
<h2>5. Observações e Resultados</h2>
<p>Descreva as observações clínicas e os resultados obtidos.</p>
<h2>6. Hipótese Diagnóstica</h2>
<p>Apresente a hipótese diagnóstica conforme CID/DSM (se aplicável).</p>
<h2>7. Conduta e Recomendações</h2>
<p>Descreva a conduta adotada e as recomendações para continuidade do tratamento.</p>
<p style="margin-top: 3em">_____________________________</p>
<p>Psicólogo(a) Responsável</p>`,
  },
  {
    id: "prontuario",
    label: "Prontuário",
    description: "Prontuário psicológico completo",
    title: "Prontuário Psicológico",
    html: `<h1>Prontuário Psicológico</h1>
<h2>Dados de Identificação</h2>
<p><strong>Nome:</strong> _____________________________</p>
<p><strong>Data de Nascimento:</strong> ___/___/______</p>
<p><strong>Gênero:</strong> ____________ &nbsp;&nbsp; <strong>Estado Civil:</strong> ____________</p>
<p><strong>Profissão:</strong> _____________________________</p>
<p><strong>Endereço:</strong> _____________________________</p>
<p><strong>Telefone:</strong> ____________ &nbsp;&nbsp; <strong>E-mail:</strong> _____________________________</p>
<p><strong>Responsável (se menor):</strong> _____________________________</p>
<h2>Anamnese</h2>
<p><strong>Queixa Principal:</strong></p>
<p>_________________________________________________________</p>
<p><strong>História do Problema:</strong></p>
<p>_________________________________________________________</p>
<p><strong>Histórico Familiar:</strong></p>
<p>_________________________________________________________</p>
<p><strong>Histórico de Saúde:</strong></p>
<p>_________________________________________________________</p>
<p><strong>Medicações em Uso:</strong></p>
<p>_________________________________________________________</p>
<h2>Evolução do Atendimento</h2>
<p><strong>Sessão 1 — Data:</strong> ___/___/______</p>
<p>_________________________________________________________</p>
<p><strong>Sessão 2 — Data:</strong> ___/___/______</p>
<p>_________________________________________________________</p>
<h2>Encerramento</h2>
<p><strong>Data de encerramento:</strong> ___/___/______</p>
<p><strong>Motivo:</strong> _____________________________</p>`,
  },
  {
    id: "ata",
    label: "Ata de Reunião",
    description: "Ata para registro de reuniões",
    title: "Ata de Reunião",
    html: `<h1>Ata de Reunião</h1>
<p><strong>Data:</strong> ___/___/______ &nbsp;&nbsp; <strong>Horário:</strong> ____h____min às ____h____min</p>
<p><strong>Local:</strong> _____________________________</p>
<p><strong>Responsável pela reunião:</strong> _____________________________</p>
<h2>Participantes</h2>
<ul>
  <li>_____________________________</li>
  <li>_____________________________</li>
  <li>_____________________________</li>
</ul>
<h2>Pauta</h2>
<ol>
  <li>_____________________________</li>
  <li>_____________________________</li>
  <li>_____________________________</li>
</ol>
<h2>Discussões e Deliberações</h2>
<p><strong>Item 1:</strong></p>
<p>_________________________________________________________</p>
<p><strong>Item 2:</strong></p>
<p>_________________________________________________________</p>
<h2>Encaminhamentos</h2>
<p>_________________________________________________________</p>
<p><strong>Próxima reunião:</strong> ___/___/______</p>
<p style="margin-top: 3em">_____________________________</p>
<p>Secretário(a) / Responsável</p>`,
  },
];

// ── Custom FontSize extension (no extra npm package needed) ──────────────────
const FontSize = Extension.create({
  name: "fontSize",
  addOptions() { return { types: ["textStyle"] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (el) => el.style.fontSize || null,
          renderHTML: (attrs) => attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
        },
      },
    }];
  },
  addCommands() {
    return {
      setFontSize: (size: string) => ({ chain }: { chain: () => { setMark: (name: string, attrs: Record<string, unknown>) => { run: () => boolean } } }) =>
        chain().setMark("textStyle", { fontSize: size }).run(),
      unsetFontSize: () => ({ chain }: { chain: () => { setMark: (name: string, attrs: Record<string, unknown>) => { run: () => boolean } } }) =>
        chain().setMark("textStyle", { fontSize: null }).run(),
    };
  },
});

// ── Custom Indent extension ──────────────────────────────────────────────────
const IndentExtension = Extension.create({
  name: "indent",
  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (this.editor.isActive("listItem") || this.editor.isActive("taskItem")) {
          return this.editor.commands.sinkListItem("listItem");
        }
        return this.editor.commands.insertContent("    ");
      },
      "Shift-Tab": () => {
        if (this.editor.isActive("listItem") || this.editor.isActive("taskItem")) {
          return this.editor.commands.liftListItem("listItem");
        }
        return false;
      },
    };
  },
});

// ── Custom LineHeight extension ──────────────────────────────────────────────
const LineHeight = Extension.create({
  name: "lineHeight",
  addOptions() { return { types: ["paragraph", "heading"] }; },
  addGlobalAttributes() {
    return [{
      types: this.options.types,
      attributes: {
        lineHeight: {
          default: null,
          parseHTML: (el) => (el as HTMLElement).style.lineHeight || null,
          renderHTML: (attrs) => attrs.lineHeight ? { style: `line-height: ${attrs.lineHeight}` } : {},
        },
      },
    }];
  },
  addCommands() {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setLineHeight: (lineHeight: string) => ({ commands }: any) =>
        this.options.types.every((type: string) => commands.updateAttributes(type, { lineHeight })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      unsetLineHeight: () => ({ commands }: any) =>
        this.options.types.every((type: string) => commands.resetAttributes(type, "lineHeight")),
    };
  },
});

// ── Custom Footnote node ─────────────────────────────────────────────────────
const Footnote = Node.create({
  name: "footnote",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes() {
    return {
      content: { default: "" },
    };
  },
  parseHTML() {
    return [{ tag: "span[data-type=footnote]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, {
      "data-type": "footnote",
      class: "footnote-ref",
    })];
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addCommands(): any {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      insertFootnote: (content: string) => ({ commands }: any) =>
        commands.insertContent({ type: "footnote", attrs: { content } }),
    };
  },
});

// ── Comment mark extension ───────────────────────────────────────────────────
const CommentMark = Mark.create({
  name: "comment",
  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).getAttribute("data-comment-id"),
        renderHTML: (attrs) => attrs.commentId ? { "data-comment-id": attrs.commentId } : {},
      },
    };
  },
  parseHTML() { return [{ tag: "span[data-comment-id]" }]; },
  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { class: "comment-mark" }), 0];
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addCommands(): any {
    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setComment: (commentId: string) => ({ commands }: any) =>
        commands.setMark("comment", { commentId }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      unsetCommentById: (commentId: string) => ({ tr, dispatch, state }: any) => {
        if (dispatch) {
          const commentMark = state.schema.marks.comment;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          state.doc.descendants((node: any, pos: number) => {
            if (!node.isText) return;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            node.marks.forEach((mark: any) => {
              if (mark.type === commentMark && mark.attrs.commentId === commentId) {
                tr.removeMark(pos, pos + node.nodeSize, commentMark);
              }
            });
          });
          dispatch(tr);
        }
        return true;
      },
    };
  },
});

const FONTS = [
  { label: "Padrão", value: "" },
  { label: "Arial", value: "Arial" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Courier New", value: "Courier New" },
  { label: "Georgia", value: "Georgia" },
  { label: "Verdana", value: "Verdana" },
  { label: "Trebuchet MS", value: "Trebuchet MS" },
];

const FONT_SIZES = [
  { label: "8pt", value: "8pt" },
  { label: "9pt", value: "9pt" },
  { label: "10pt", value: "10pt" },
  { label: "11pt", value: "11pt" },
  { label: "12pt", value: "12pt" },
  { label: "14pt", value: "14pt" },
  { label: "16pt", value: "16pt" },
  { label: "18pt", value: "18pt" },
  { label: "20pt", value: "20pt" },
  { label: "24pt", value: "24pt" },
  { label: "28pt", value: "28pt" },
  { label: "36pt", value: "36pt" },
  { label: "48pt", value: "48pt" },
  { label: "72pt", value: "72pt" },
];

const LINE_HEIGHTS = [
  { label: "Simples", value: "1" },
  { label: "1.15", value: "1.15" },
  { label: "1.5", value: "1.5" },
  { label: "Duplo", value: "2" },
  { label: "Triplo", value: "3" },
];

const HEADING_OPTIONS = [
  { label: "Parágrafo", value: 0 },
  { label: "Título 1", value: 1 },
  { label: "Título 2", value: 2 },
  { label: "Título 3", value: 3 },
  { label: "Título 4", value: 4 },
  { label: "Título 5", value: 5 },
  { label: "Título 6", value: 6 },
];

const TEXT_COLORS = [
  "#000000", "#374151", "#6B7280", "#DC2626", "#EA580C",
  "#D97706", "#16A34A", "#0284C7", "#7C3AED", "#DB2777",
  "#FFFFFF", "#F3F4F6", "#FEF3C7", "#DCFCE7", "#DBEAFE",
];

const HIGHLIGHT_COLORS = [
  "#FEF08A", "#BBF7D0", "#BAE6FD", "#F5D0FE", "#FED7AA",
  "#FCA5A5", "#A7F3D0", "#C7D2FE", "#FBCFE8", "#E5E7EB",
];

function Divider() {
  return <div className="w-px h-5 bg-gray-200 dark:bg-gray-600 mx-0.5 self-center flex-shrink-0" />;
}

function ToolbarButton({
  onClick, active, children, title: btnTitle, disabled,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={btnTitle}
      disabled={disabled}
      className={`rounded p-1.5 transition-colors disabled:opacity-40 flex-shrink-0 ${
        active
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

function ColorPicker({
  colors, value, onChange, title,
}: {
  colors: string[];
  value?: string;
  onChange: (c: string) => void;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as globalThis.Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        title={title}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-0.5 rounded p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
      >
        <span
          className="h-4 w-4 rounded border border-gray-300 dark:border-gray-500"
          style={{ backgroundColor: value || "#000000" }}
        />
        <ChevronDown className="h-2.5 w-2.5" />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          <div className="grid grid-cols-5 gap-1">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => { onChange(c); setOpen(false); }}
                className="h-5 w-5 rounded border border-gray-300 dark:border-gray-500 hover:scale-110 transition-transform"
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SelectDropdown({
  options, value, onChange, title,
}: {
  options: { label: string; value: string | number }[];
  value: string | number;
  onChange: (v: string | number) => void;
  title?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => {
        const v = e.target.value;
        onChange(isNaN(Number(v)) ? v : Number(v));
      }}
      title={title}
      className="rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs px-1.5 py-1 h-7 focus:outline-none focus:ring-1 focus:ring-blue-500 flex-shrink-0"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function LinkDialog({
  onConfirm, onCancel, initialUrl,
}: {
  onConfirm: (url: string) => void;
  onCancel: () => void;
  initialUrl?: string;
}) {
  const [url, setUrl] = useState(initialUrl || "https://");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-96 space-y-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Inserir link</h3>
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && onConfirm(url)}
        />
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={onCancel}>
            <X className="h-3.5 w-3.5 mr-1" />Cancelar
          </Button>
          <Button size="sm" onClick={() => onConfirm(url)}>
            <Check className="h-3.5 w-3.5 mr-1" />Inserir
          </Button>
        </div>
      </div>
    </div>
  );
}

function ImageDialog({ onConfirm, onCancel }: { onConfirm: (url: string, alt?: string) => void; onCancel: () => void }) {
  const [tab, setTab] = useState<"url" | "upload">("url");
  const [url, setUrl] = useState("https://");
  const [alt, setAlt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError("");
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json() as { url: string };
        onConfirm(data.url, alt);
      } else {
        const data = await res.json() as { error?: string };
        setError(data.error || "Erro ao enviar imagem");
      }
    } catch {
      setError("Erro de rede ao enviar imagem");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-96 space-y-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Inserir imagem</h3>
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setTab("url")}
            className={`pb-1.5 text-sm px-2 ${tab === "url" ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            Por URL
          </button>
          <button
            onClick={() => setTab("upload")}
            className={`pb-1.5 text-sm px-2 flex items-center gap-1 ${tab === "upload" ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
          >
            <Upload className="h-3.5 w-3.5" /> Enviar arquivo
          </button>
        </div>
        {tab === "url" ? (
          <div className="space-y-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">URL da imagem</label>
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." autoFocus />
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">Arquivo de imagem</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300"
            />
            {preview && (
              <img src={preview} alt="pré-visualização" className="mt-2 max-h-32 rounded border border-gray-200 dark:border-gray-600 object-contain" />
            )}
          </div>
        )}
        <div className="space-y-2">
          <label className="text-sm text-gray-700 dark:text-gray-300">Texto alternativo (opcional)</label>
          <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Descrição da imagem" />
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={onCancel} disabled={uploading}>
            <X className="h-3.5 w-3.5 mr-1" />Cancelar
          </Button>
          <Button
            size="sm"
            disabled={uploading || (tab === "upload" && !file)}
            onClick={tab === "url" ? () => onConfirm(url, alt) : handleUpload}
          >
            {uploading ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Enviando...
              </span>
            ) : (
              <><Check className="h-3.5 w-3.5 mr-1" />Inserir</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AddCommentDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: (text: string) => void;
  onCancel: () => void;
}) {
  const [text, setText] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-96 space-y-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-yellow-500" />
          Adicionar comentário
        </h3>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escreva seu comentário..."
          autoFocus
          rows={4}
          className="w-full rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-gray-100 p-2 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
        />
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={onCancel}>
            <X className="h-3.5 w-3.5 mr-1" />Cancelar
          </Button>
          <Button size="sm" disabled={!text.trim()} onClick={() => onConfirm(text.trim())}>
            <Check className="h-3.5 w-3.5 mr-1" />Comentar
          </Button>
        </div>
      </div>
    </div>
  );
}

function CommentsPanel({
  comments,
  editor,
  onDelete,
  onClose,
}: {
  comments: Record<string, CommentData>;
  editor: ReturnType<typeof useEditor> | null;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  // Build ordered list by traversing the document
  const ordered: Array<{ id: string; highlightedText: string; data: CommentData }> = [];
  if (editor) {
    const commentMark = editor.schema.marks.comment;
    if (commentMark) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      editor.state.doc.descendants((node: any, _pos: number) => {
        if (!node.isText) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        node.marks.forEach((mark: any) => {
          if (mark.type === commentMark) {
            const id = mark.attrs.commentId as string;
            if (id && comments[id] && !ordered.find((o) => o.id === id)) {
              ordered.push({
                id,
                highlightedText: (node.text as string)?.slice(0, 60) || "",
                data: comments[id],
              });
            }
          }
        });
      });
    }
  }
  // Include orphan comments (mark removed but comment data still present)
  Object.entries(comments).forEach(([id, data]) => {
    if (!ordered.find((o) => o.id === id)) {
      ordered.push({ id, highlightedText: "", data });
    }
  });

  return (
    <div className="w-72 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <MessageSquare className="h-4 w-4 text-yellow-500" />
          Comentários ({ordered.length})
        </span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" title="Fechar painel">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {ordered.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-8">
            Nenhum comentário ainda.<br />
            Selecione um trecho e clique em <strong>Comentar</strong>.
          </p>
        )}
        {ordered.map(({ id, highlightedText, data }) => (
          <div key={id} className="bg-white dark:bg-gray-800 rounded-lg border border-yellow-200 dark:border-yellow-700/40 p-3 space-y-1.5">
            {highlightedText && (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic line-clamp-2 border-l-2 border-yellow-400 pl-2">
                &ldquo;{highlightedText}{highlightedText.length >= 60 ? "…" : ""}&rdquo;
              </p>
            )}
            <p className="text-sm text-gray-800 dark:text-gray-200">{data.text}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {new Date(data.createdAt).toLocaleString("pt-BR")}
              </span>
              <button
                onClick={() => onDelete(id)}
                className="text-red-400 hover:text-red-600 transition-colors"
                title="Remover comentário"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FindReplacePanel({
  onClose,
  onFind,
  onReplace,
  onReplaceAll,
}: {
  onClose: () => void;
  onFind: (text: string) => void;
  onReplace: (find: string, replace: string) => void;
  onReplaceAll: (find: string, replace: string) => void;
}) {
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [showReplace, setShowReplace] = useState(false);
  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/10 px-3 py-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Search className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
        <input
          autoFocus
          value={findText}
          onChange={(e) => setFindText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onFind(findText)}
          placeholder="Localizar..."
          className="h-7 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 w-44 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={() => onFind(findText)}
          className="h-7 px-2 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
        >
          Encontrar
        </button>
        <button
          onClick={() => setShowReplace(!showReplace)}
          className="h-7 px-2 text-xs rounded border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {showReplace ? "Ocultar" : "Substituir"}
        </button>
        {showReplace && (
          <>
            <input
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="Substituir por..."
              className="h-7 text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 w-44 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={() => onReplace(findText, replaceText)}
              className="h-7 px-2 text-xs rounded border border-blue-300 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Substituir
            </button>
            <button
              onClick={() => onReplaceAll(findText, replaceText)}
              className="h-7 px-2 text-xs rounded border border-blue-300 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Substituir tudo
            </button>
          </>
        )}
        <button onClick={onClose} className="ml-auto text-gray-400 hover:text-gray-600 flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface TocEntry { level: number; text: string; }

function TableOfContents({ entries, onClose }: { entries: TocEntry[]; onClose: () => void }) {
  return (
    <Card className="flex-shrink-0">
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <BookMarked className="h-3.5 w-3.5" />
            Sumário
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        {entries.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-2">Nenhum título encontrado</p>
        ) : (
          <ul className="space-y-0.5 max-h-48 overflow-y-auto">
            {entries.map((e, i) => (
              <li
                key={i}
                className="text-xs text-gray-600 dark:text-gray-400 truncate"
                style={{ paddingLeft: `${(e.level - 1) * 10}px` }}
              >
                {e.level === 1 ? "■" : e.level === 2 ? "▸" : "·"} {e.text}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function PageSettingsPanel({
  margin, orientation, onMarginChange, onOrientationChange, onClose,
}: {
  margin: PageMargin;
  orientation: PageOrientation;
  onMarginChange: (m: PageMargin) => void;
  onOrientationChange: (o: PageOrientation) => void;
  onClose: () => void;
}) {
  const margins: { label: string; value: PageMargin }[] = [
    { label: "Estreito (12mm)", value: "narrow" },
    { label: "Normal (25mm)", value: "normal" },
    { label: "Largo (38mm)", value: "wide" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-80 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações de Página
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Margens</p>
          <div className="space-y-1">
            {margins.map((m) => (
              <button
                key={m.value}
                onClick={() => onMarginChange(m.value)}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                  margin === m.value
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Orientação</p>
          <div className="flex gap-2">
            {(["portrait", "landscape"] as PageOrientation[]).map((o) => (
              <button
                key={o}
                onClick={() => onOrientationChange(o)}
                className={`flex-1 text-sm px-3 py-2 rounded-lg border transition-colors ${
                  orientation === o
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium"
                    : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                {o === "portrait" ? "🖼️ Retrato" : "🌄 Paisagem"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button size="sm" onClick={onClose}>
            <Check className="h-3.5 w-3.5 mr-1" />Aplicar
          </Button>
        </div>
      </div>
    </div>
  );
}

function FootnoteDialog({ onConfirm, onCancel }: { onConfirm: (text: string) => void; onCancel: () => void }) {
  const [text, setText] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-96 space-y-4">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <StickyNote className="h-4 w-4" />
          Inserir Nota de Rodapé
        </h3>
        <div className="space-y-2">
          <label className="text-sm text-gray-700 dark:text-gray-300">Texto da nota</label>
          <textarea
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Digite o texto da nota de rodapé..."
            className="w-full h-24 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={onCancel}>
            <X className="h-3.5 w-3.5 mr-1" />Cancelar
          </Button>
          <Button size="sm" onClick={() => onConfirm(text)} disabled={!text.trim()}>
            <Check className="h-3.5 w-3.5 mr-1" />Inserir
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Slash Commands ───────────────────────────────────────────────────────────
interface SlashCommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  keywords: string[];
  run: (editor: ReturnType<typeof import("@tiptap/react").useEditor>) => void;
}

const SLASH_COMMANDS: SlashCommandItem[] = [
  { id: "h1", label: "Título 1", description: "Grande título de seção", icon: Type, keywords: ["h1", "título", "heading"],
    run: (ed) => ed?.chain().focus().toggleHeading({ level: 1 }).run() },
  { id: "h2", label: "Título 2", description: "Título médio de seção", icon: Type, keywords: ["h2", "título", "heading"],
    run: (ed) => ed?.chain().focus().toggleHeading({ level: 2 }).run() },
  { id: "h3", label: "Título 3", description: "Subtítulo", icon: Type, keywords: ["h3", "título", "heading"],
    run: (ed) => ed?.chain().focus().toggleHeading({ level: 3 }).run() },
  { id: "ul", label: "Lista com Marcadores", description: "Lista de itens simples", icon: List, keywords: ["ul", "lista", "bullet", "marcadores"],
    run: (ed) => ed?.chain().focus().toggleBulletList().run() },
  { id: "ol", label: "Lista Numerada", description: "Lista ordenada numerada", icon: ListOrdered, keywords: ["ol", "lista", "numerada", "ordenada"],
    run: (ed) => ed?.chain().focus().toggleOrderedList().run() },
  { id: "todo", label: "Lista de Tarefas", description: "Lista com checkboxes", icon: ListChecks, keywords: ["todo", "tarefa", "checklist", "checkbox"],
    run: (ed) => ed?.chain().focus().toggleTaskList().run() },
  { id: "quote", label: "Citação", description: "Bloco de citação ou destaque", icon: Quote, keywords: ["quote", "citação", "blockquote"],
    run: (ed) => ed?.chain().focus().toggleBlockquote().run() },
  { id: "code", label: "Bloco de Código", description: "Trecho de código formatado", icon: Code2, keywords: ["code", "código", "programação"],
    run: (ed) => ed?.chain().focus().toggleCodeBlock().run() },
  { id: "table", label: "Tabela", description: "Grade de linhas e colunas", icon: TableIcon, keywords: ["table", "tabela", "grade"],
    run: (ed) => ed?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
  { id: "hr", label: "Divisor", description: "Linha horizontal de separação", icon: Minus, keywords: ["hr", "divisor", "linha", "separador"],
    run: (ed) => ed?.chain().focus().setHorizontalRule().run() },
  { id: "image", label: "Imagem", description: "Inserir imagem por URL", icon: ImageIcon, keywords: ["image", "imagem", "foto"],
    run: () => { /* signal to open image dialog */ } },
];

function SlashMenu({
  query,
  coords,
  onSelect,
  onClose,
}: {
  query: string;
  coords: { top: number; left: number };
  onSelect: (item: SlashCommandItem) => void;
  onClose: () => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const filtered = SLASH_COMMANDS.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return c.label.toLowerCase().includes(q) || c.keywords.some((k) => k.includes(q));
  });

  // Expose navigate/select via imperativeHandle is complex; instead use keydown in parent
  // This component just renders, navigation handled by parent useEffect
  const ref = useRef<HTMLDivElement>(null);

  // Scroll active item into view
  useEffect(() => {
    const el = ref.current?.querySelector(`[data-idx="${activeIdx}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIdx]);

  // Navigation state exposed via a ref so parent can call
  // We'll use a different pattern: emit keyboard events via context
  // Instead keep it self-contained: handle keydown inside the menu div
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        e.stopPropagation();
        setActiveIdx((i) => (i + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        e.stopPropagation();
        setActiveIdx((i) => (i - 1 + filtered.length) % filtered.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (filtered[activeIdx]) onSelect(filtered[activeIdx]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [filtered, activeIdx, onSelect, onClose]);

  // Reset active on query change
  useEffect(() => { setActiveIdx(0); }, [query]);

  if (filtered.length === 0) return null;

  return (
    <div
      ref={ref}
      className="fixed z-[100] w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden"
      style={{ top: coords.top + 4, left: Math.max(8, coords.left) }}
    >
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 text-xs text-gray-400 flex items-center gap-1">
        <Hash className="h-3 w-3" />
        Comandos
        {query && <span className="ml-1 font-medium text-gray-600 dark:text-gray-300">/{query}</span>}
        <span className="ml-auto">↑↓ navegar · Enter inserir · Esc fechar</span>
      </div>
      <div className="max-h-64 overflow-y-auto py-1">
        {filtered.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              data-idx={idx}
              onClick={() => onSelect(item)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                idx === activeIdx
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              }`}
            >
              <div className={`p-1.5 rounded-md ${idx === activeIdx ? "bg-blue-100 dark:bg-blue-800" : "bg-gray-100 dark:bg-gray-700"}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">{item.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Keyboard Shortcuts Modal ─────────────────────────────────────────────────
function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const groups = [
    {
      label: "Arquivo",
      shortcuts: [
        { keys: ["Ctrl", "S"], desc: "Salvar documento" },
        { keys: ["Ctrl", "F"], desc: "Localizar e substituir" },
        { keys: ["Ctrl", "/"], desc: "Atalhos de teclado" },
      ],
    },
    {
      label: "Formatação de texto",
      shortcuts: [
        { keys: ["Ctrl", "B"], desc: "Negrito" },
        { keys: ["Ctrl", "I"], desc: "Itálico" },
        { keys: ["Ctrl", "U"], desc: "Sublinhado" },
        { keys: ["Ctrl", "Shift", "X"], desc: "Tachado" },
        { keys: ["Ctrl", "`"], desc: "Código inline" },
      ],
    },
    {
      label: "Parágrafos e blocos",
      shortcuts: [
        { keys: ["Ctrl", "Alt", "1…6"], desc: "Título nível 1–6" },
        { keys: ["Ctrl", "Shift", "B"], desc: "Lista com marcadores" },
        { keys: ["Ctrl", "Shift", "O"], desc: "Lista numerada" },
        { keys: ["Ctrl", "Shift", "T"], desc: "Lista de tarefas" },
        { keys: ["Ctrl", "Shift", "E"], desc: "Citação (blockquote)" },
        { keys: ["Ctrl", "Alt", "C"], desc: "Bloco de código" },
        { keys: ["Tab"], desc: "Aumentar indentação" },
        { keys: ["Shift", "Tab"], desc: "Diminuir indentação" },
      ],
    },
    {
      label: "Edição",
      shortcuts: [
        { keys: ["Ctrl", "Z"], desc: "Desfazer" },
        { keys: ["Ctrl", "Y"], desc: "Refazer" },
        { keys: ["Ctrl", "A"], desc: "Selecionar tudo" },
        { keys: ["/"], desc: "Menu de comandos slash" },
      ],
    },
    {
      label: "Visualização",
      shortcuts: [
        { keys: ["Esc"], desc: "Sair do modo leitura" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[600px] max-w-full max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Keyboard className="h-4 w-4 text-blue-500" />
            Atalhos de Teclado
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="h-4 w-4" /></button>
        </div>
        <div className="overflow-y-auto p-6 grid grid-cols-2 gap-6">
          {groups.map((g) => (
            <div key={g.label}>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">{g.label}</p>
              <div className="space-y-1.5">
                {g.shortcuts.map((s) => (
                  <div key={s.desc} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{s.desc}</span>
                    <div className="flex items-center gap-0.5">
                      {s.keys.map((k, i) => (
                        <span key={i} className="flex items-center gap-0.5">
                          {i > 0 && <span className="text-gray-300 text-xs mx-0.5">+</span>}
                          <kbd className="text-[11px] bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 font-mono">{k}</kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Template Picker Dialog ───────────────────────────────────────────────────
function TemplatePickerDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: (tpl: DocTemplate) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<string>("blank");
  const tpl = DOCUMENT_TEMPLATES.find((t) => t.id === selected)!;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-[640px] max-w-full space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4 text-blue-500" />
            Novo documento a partir de template
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Template list */}
          <div className="w-52 flex-shrink-0 space-y-1 overflow-y-auto">
            {DOCUMENT_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
                  selected === t.id
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                    : "hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                }`}
              >
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.description}</p>
              </button>
            ))}
          </div>
          {/* Preview */}
          <div className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg overflow-y-auto bg-white dark:bg-gray-900 p-4">
            <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-semibold">Pré-visualização</p>
            {tpl.html ? (
              <div
                className="prose prose-sm dark:prose-invert max-w-none text-xs"
                dangerouslySetInnerHTML={{ __html: tpl.html }}
              />
            ) : (
              <p className="text-sm text-gray-400 italic">Documento em branco — sem conteúdo inicial.</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 justify-end flex-shrink-0">
          <Button size="sm" variant="outline" onClick={onCancel}>
            <X className="h-3.5 w-3.5 mr-1" />Cancelar
          </Button>
          <Button size="sm" onClick={() => onConfirm(tpl)}>
            <Check className="h-3.5 w-3.5 mr-1" />Usar template
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Word Goal Bar ────────────────────────────────────────────────────────────
function WordGoalBar({
  wordCount,
  goal,
  onSetGoal,
}: {
  wordCount: number;
  goal: number;
  onSetGoal: (n: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(String(goal));
  const pct = goal > 0 ? Math.min(100, Math.round((wordCount / goal) * 100)) : 0;
  const color = pct >= 100 ? "bg-green-500" : pct >= 60 ? "bg-blue-500" : "bg-orange-400";
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
      <Target className="h-3.5 w-3.5 flex-shrink-0" />
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const n = parseInt(input, 10);
            if (!isNaN(n) && n >= 0) onSetGoal(n);
            setEditing(false);
          }}
          className="flex items-center gap-1"
        >
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-16 h-5 text-xs rounded border border-gray-300 dark:border-gray-600 px-1 bg-white dark:bg-gray-800"
          />
          <button type="submit" className="text-blue-600 hover:text-blue-700 font-medium">OK</button>
          <button type="button" onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
            <X className="h-3 w-3" />
          </button>
        </form>
      ) : (
        <button onClick={() => { setInput(String(goal)); setEditing(true); }} className="hover:text-gray-700 dark:hover:text-gray-200" title="Definir meta de palavras">
          {goal > 0 ? `${wordCount}/${goal} palavras` : "Definir meta"}
        </button>
      )}
      {goal > 0 && (
        <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
        </div>
      )}
      {goal > 0 && pct >= 100 && (
        <span className="text-green-600 dark:text-green-400 font-medium">✓ Meta atingida!</span>
      )}
    </div>
  );
}

// ── Document Viewer Modal (read-only, Google Drive–style) ────────────────────
interface ViewDocData {
  id: string;
  title: string;
  html: string;
  header?: string;
  footer?: string;
  updatedAt: string;
}

function DocumentViewerModal({
  data,
  loading,
  onClose,
  onEdit,
}: {
  data: ViewDocData | null;
  loading: boolean;
  onClose: () => void;
  onEdit: (id: string) => void;
}) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col w-full max-w-3xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
              {loading ? "Carregando…" : (data?.title || "Documento")}
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            {data && (
              <Button
                size="sm"
                onClick={() => onEdit(data.id)}
                className="gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                Editar
              </Button>
            )}
            <button
              onClick={onClose}
              aria-label="Fechar visualizador"
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex items-center justify-center h-40">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          )}
          {!loading && !data && (
            <p className="text-center text-gray-400 py-16">Não foi possível carregar o documento.</p>
          )}
          {!loading && data && (
            <div className="px-10 py-8">
              {data.header && (
                <div className="text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-3 mb-6 whitespace-pre-wrap">
                  {data.header}
                </div>
              )}
              <div
                className="prose dark:prose-invert max-w-none text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: data.html }}
              />
              {data.footer && (
                <div className="text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-3 mt-10 whitespace-pre-wrap">
                  {data.footer}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer meta */}
        {data && (
          <div className="px-6 py-2 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 flex items-center justify-between">
            <span className="text-xs text-gray-400">
              Atualizado em {new Date(data.updatedAt).toLocaleString("pt-BR")}
            </span>
            <span className="text-xs text-gray-400">Somente leitura</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Version History Panel ────────────────────────────────────────────────────
function VersionHistoryPanel({
  versions,
  onRestore,
  onClose,
}: {
  versions: VersionSnapshot[];
  onRestore: (v: VersionSnapshot) => void;
  onClose: () => void;
}) {
  const [preview, setPreview] = useState<VersionSnapshot | null>(null);
  const sorted = [...versions].reverse(); // newest first
  return (
    <div className="w-72 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-blue-500" />
          Histórico ({versions.length})
        </span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" title="Fechar">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {sorted.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-8">
            Nenhuma versão salva ainda.<br />
            Versões são criadas automaticamente ao salvar.
          </p>
        )}
        {sorted.map((v, i) => (
          <div
            key={v.at}
            className={`rounded-lg border p-2.5 cursor-pointer transition-colors ${
              preview?.at === v.at
                ? "border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
            }`}
            onClick={() => setPreview(preview?.at === v.at ? null : v)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate max-w-[140px]">{v.title}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {new Date(v.at).toLocaleString("pt-BR")}
                  {i === 0 && <span className="ml-1 text-blue-600 dark:text-blue-400">(mais recente)</span>}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onRestore(v); }}
                className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 font-medium flex-shrink-0 ml-2"
                title="Restaurar esta versão"
              >
                Restaurar
              </button>
            </div>
            {preview?.at === v.at && (
              <div
                className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 text-[11px] text-gray-600 dark:text-gray-400 max-h-32 overflow-hidden prose prose-xs dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: v.html.slice(0, 600) }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Document Stats Panel ─────────────────────────────────────────────────────
function DocStatsPanel({
  wordCount,
  charCount,
  html,
  onClose,
}: {
  wordCount: number;
  charCount: number;
  html: string;
  onClose: () => void;
}) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const sentences = text ? text.split(/[.!?]+/).filter((s) => s.trim().length > 0).length : 0;
  const paragraphs = (html.match(/<p[\s>]/g) || []).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200)); // ~200 wpm
  const uniqueWords = text
    ? new Set(text.toLowerCase().replace(/[^a-záàâãéèêíïóôõúüçñ0-9\s]/gi, "").split(/\s+/).filter(Boolean)).size
    : 0;
  const avgWordLen = wordCount > 0 ? (text.replace(/\s+/g, "").length / wordCount).toFixed(1) : "0";

  const stats = [
    { label: "Palavras", value: wordCount.toLocaleString("pt-BR") },
    { label: "Caracteres", value: charCount.toLocaleString("pt-BR") },
    { label: "Frases", value: sentences.toLocaleString("pt-BR") },
    { label: "Parágrafos", value: paragraphs.toLocaleString("pt-BR") },
    { label: "Palavras únicas", value: uniqueWords.toLocaleString("pt-BR") },
    { label: "Comprimento médio de palavra", value: `${avgWordLen} letras` },
    { label: "Tempo de leitura estimado", value: `${readingTime} min` },
  ];

  return (
    <div className="w-64 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
          <BookMarked className="h-4 w-4 text-purple-500" />
          Estatísticas
        </span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" title="Fechar">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <span className="text-xs text-gray-500 dark:text-gray-400">{s.label}</span>
            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditorPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const docId = searchParams.get("id");

  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null);
  const [title, setTitle] = useState("Novo Documento");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([]);
  // Etapa 2 state
  const [header, setHeader] = useState("");
  const [footer, setFooter] = useState("");
  const [pageMargin, setPageMargin] = useState<PageMargin>("normal");
  const [pageOrientation, setPageOrientation] = useState<PageOrientation>("portrait");
  const [showPageSettings, setShowPageSettings] = useState(false);
  const [showHeaderFooter, setShowHeaderFooter] = useState(false);
  const [showFootnoteDialog, setShowFootnoteDialog] = useState(false);
  const [footnotes, setFootnotes] = useState<string[]>([]);
  // Etapa 3 state
  const [comments, setComments] = useState<Record<string, CommentData>>({});
  const [showComments, setShowComments] = useState(false);
  const [showAddCommentDialog, setShowAddCommentDialog] = useState(false);
  // Etapa 4 state
  const [isDirty, setIsDirty] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [wordGoal, setWordGoal] = useState(0);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Etapa 5 state
  const [versions, setVersions] = useState<VersionSnapshot[]>([]);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showDocStats, setShowDocStats] = useState(false);
  // Etapa 6 state
  const [slashMenu, setSlashMenu] = useState<{ query: string; coords: { top: number; left: number } } | null>(null);
  const [docTags, setDocTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [docSearch, setDocSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  // Document viewer state
  const [viewDocId, setViewDocId] = useState<string | null>(null);
  const [viewDocData, setViewDocData] = useState<ViewDocData | null>(null);
  const [viewDocLoading, setViewDocLoading] = useState(false);

  const getHeadingValue = useCallback((ed: ReturnType<typeof useEditor> | null): number => {
    if (!ed) return 0;
    for (let i = 1; i <= 6; i++) {
      if (ed.isActive("heading", { level: i })) return i;
    }
    return 0;
  }, []);

  const getCurrentFont = useCallback((ed: ReturnType<typeof useEditor> | null): string => {
    if (!ed) return "";
    const attrs = ed.getAttributes("textStyle");
    return attrs?.fontFamily || "";
  }, []);

  const handleViewDocument = useCallback(async (id: string) => {
    setViewDocId(id);
    setViewDocData(null);
    setViewDocLoading(true);
    const res = await fetch(`/api/documents/${id}`);
    if (res.ok) {
      const data = await res.json();
      const meta = parseDocContent(data.document.content || "");
      setViewDocData({
        id: data.document.id,
        title: data.document.title,
        html: meta.html || "",
        header: meta.header,
        footer: meta.footer,
        updatedAt: data.document.updatedAt,
      });
    }
    setViewDocLoading(false);
  }, []);

  const handleEditFromViewer = useCallback((id: string) => {
    setViewDocId(null);
    setViewDocData(null);
    router.push(`/editor?id=${id}`);
  }, [router]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-blue-600 underline cursor-pointer" } }),
      Image.configure({ HTMLAttributes: { class: "max-w-full rounded" } }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      TextStyle,
      Color,
      FontSize,
      Highlight.configure({ multicolor: true }),
      Subscript,
      Superscript,
      TaskList,
      TaskItem.configure({ nested: true }),
      FontFamily,
      IndentExtension,
      LineHeight,
      Footnote,
      CommentMark,
      Placeholder.configure({ placeholder: "Comece a escrever seu documento..." }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "outline-none prose dark:prose-invert max-w-none",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const text = ed.state.doc.textContent;
      setCharCount(text.length);
      setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
      setIsDirty(true);
      // Update TOC
      const entries: TocEntry[] = [];
      const notes: string[] = [];
      ed.state.doc.descendants((node) => {
        if (node.type.name === "heading") {
          entries.push({ level: node.attrs.level as number, text: node.textContent });
        }
        if (node.type.name === "footnote") {
          notes.push(node.attrs.content as string);
        }
      });
      setTocEntries(entries);
      setFootnotes(notes);
      // Slash commands detection
      const { selection } = ed.state;
      const { $from } = selection;
      if ($from.parent.type.name === "paragraph") {
        const lineText = $from.parent.textContent;
        if (lineText.startsWith("/")) {
          const query = lineText.slice(1);
          try {
            const domCoords = ed.view.coordsAtPos($from.start());
            setSlashMenu({ query, coords: { top: domCoords.bottom + window.scrollY, left: domCoords.left + window.scrollX } });
          } catch { setSlashMenu(null); }
        } else {
          setSlashMenu(null);
        }
      } else {
        setSlashMenu(null);
      }
    },
  });

  const loadDocuments = useCallback(async () => {
    const res = await fetch("/api/documents");
    if (res.ok) {
      const data = await res.json();
      setDocuments(data.documents || []);
    }
  }, []);

  const loadDocument = useCallback(async (id: string) => {
    const res = await fetch(`/api/documents/${id}`);
    if (res.ok) {
      const data = await res.json();
      setCurrentDoc(data.document);
      setTitle(data.document.title);
      const meta = parseDocContent(data.document.content || "");
      editor?.commands.setContent(meta.html || "");
      if (meta.header !== undefined) setHeader(meta.header);
      if (meta.footer !== undefined) setFooter(meta.footer);
      if (meta.margin) setPageMargin(meta.margin);
      if (meta.orientation) setPageOrientation(meta.orientation);
      if (meta.comments) setComments(meta.comments);
      else setComments({});
      if (meta.versions) setVersions(meta.versions);
      else setVersions([]);
      if (meta.tags) setDocTags(meta.tags);
      else setDocTags([]);
      setIsDirty(false);
    }
  }, [editor]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);
  useEffect(() => {
    if (docId && editor) loadDocument(docId);
  }, [docId, editor, loadDocument]);

  const handleSave = useCallback(async (opts?: { auto?: boolean }) => {
    if (!editor) return;
    setSaving(true);
    // Create version snapshot before saving (keep last 20)
    const newSnapshot: VersionSnapshot = {
      at: new Date().toISOString(),
      title,
      html: editor.getHTML(),
      header: header || undefined,
      footer: footer || undefined,
    };
    const nextVersions = [...versions, newSnapshot].slice(-20);
    setVersions(nextVersions);
    const content = serializeDocContent({
      html: editor.getHTML(),
      header: header || undefined,
      footer: footer || undefined,
      margin: pageMargin,
      orientation: pageOrientation,
      comments: Object.keys(comments).length ? comments : undefined,
      versions: nextVersions,
      tags: docTags.length ? docTags : undefined,
    });
    if (currentDoc) {
      await fetch(`/api/documents/${currentDoc.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
    } else {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentDoc(data.document);
        router.push(`/editor?id=${data.document.id}`);
      }
    }
    setSaving(false);
    setIsDirty(false);
    if (opts?.auto) {
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 3000);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    loadDocuments();
  }, [editor, currentDoc, title, header, footer, pageMargin, pageOrientation, comments, versions, docTags, router, loadDocuments]);

  const handleNewDocument = () => {
    setCurrentDoc(null);
    setTitle("Novo Documento");
    editor?.commands.setContent("");
    setHeader("");
    setFooter("");
    setPageMargin("normal");
    setPageOrientation("portrait");
    setComments({});
    setVersions([]);
    setDocTags([]);
    setIsDirty(false);
    router.push("/editor");
  };

  // Auto-save: save 30s after last change when doc is already persisted
  useEffect(() => {
    if (!isDirty || !currentDoc) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => {
      handleSave({ auto: true });
    }, 30_000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [isDirty, currentDoc, handleSave]);

  const handleNewFromTemplate = (tpl: DocTemplate) => {
    setShowTemplatePicker(false);
    setCurrentDoc(null);
    setTitle(tpl.title);
    editor?.commands.setContent(tpl.html);
    setHeader(tpl.header || "");
    setFooter(tpl.footer || "");
    setPageMargin("normal");
    setPageOrientation("portrait");
    setComments({});
    setVersions([]);
    setIsDirty(true);
    router.push("/editor");
  };

  const handleRestoreVersion = (v: VersionSnapshot) => {
    editor?.commands.setContent(v.html);
    setTitle(v.title);
    if (v.header !== undefined) setHeader(v.header);
    if (v.footer !== undefined) setFooter(v.footer);
    setIsDirty(true);
    setShowVersionHistory(false);
  };

  const handleSlashSelect = useCallback((item: SlashCommandItem) => {
    if (!editor) return;
    setSlashMenu(null);
    // Delete the /query text from the current paragraph start to cursor
    const { from } = editor.state.selection;
    const lineStart = editor.state.selection.$from.start();
    const tr = editor.state.tr.delete(lineStart, from);
    editor.view.dispatch(tr);
    // Special case: image opens the dialog
    if (item.id === "image") {
      setShowImageDialog(true);
      return;
    }
    item.run(editor);
  }, [editor]);

  const handleDeleteDocument = async (id: string) => {
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (currentDoc?.id === id) handleNewDocument();
    loadDocuments();
  };

  const handleAddTag = (tag: string) => {
    const t = tag.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || docTags.includes(t)) return;
    setDocTags((prev) => [...prev, t]);
    setTagInput("");
    setIsDirty(true);
  };

  const handleRemoveTag = (tag: string) => {
    setDocTags((prev) => prev.filter((t) => t !== tag));
    setIsDirty(true);
  };

  const handlePrint = () => {
    if (!editor) return;
    const content = editor.getHTML();
    const win = window.open("", "_blank");
    if (!win) return;
    const safeTitle = title
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
    const safeHeader = header.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const safeFooter = footer.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const marginMap = { narrow: "12mm", normal: "25mm", wide: "38mm" };
    const m = marginMap[pageMargin];
    const isLandscape = pageOrientation === "landscape";
    win.document.write(`<!DOCTYPE html><html><head><title>${safeTitle}</title>
      <style>
        @page{size:${isLandscape ? "landscape" : "portrait"};margin:${m};}
        body{font-family:Arial,sans-serif;line-height:1.6;}
        h1,h2,h3,h4,h5,h6{margin-top:1.5em;}
        table{border-collapse:collapse;width:100%;}
        td,th{border:1px solid #ccc;padding:8px;}
        img{max-width:100%;}
        ul,ol{padding-left:2em;}
        blockquote{border-left:4px solid #ccc;margin-left:0;padding-left:1em;color:#555;}
        .doc-header{border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:1em;font-size:0.85em;color:#555;}
        .doc-footer{border-top:1px solid #ccc;padding-top:4px;margin-top:2em;font-size:0.85em;color:#555;}
        .footnote-ref{counter-increment:footnote;}
        .footnote-ref::after{content:"[" counter(footnote) "]";font-size:0.7em;vertical-align:super;color:#2563eb;}
        body{counter-reset:footnote;}
      </style>
      </head><body>
        ${safeHeader ? `<div class="doc-header">${safeHeader}</div>` : ""}
        <h1 style="font-size:1.5em;border-bottom:1px solid #eee;padding-bottom:0.5em;">${safeTitle}</h1>
        ${content}
        ${safeFooter ? `<div class="doc-footer">${safeFooter}</div>` : ""}
      </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleExportHTML = () => {
    if (!editor) return;
    const safeTitle = title
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
    const blob = new Blob(
      [`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${safeTitle}</title></head><body><h1>${safeTitle}</h1>${editor.getHTML()}</body></html>`],
      { type: "text/html" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleExportTXT = () => {
    if (!editor) return;
    const blob = new Blob([editor.state.doc.textContent], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleExportPDF = async () => {
    if (!editor) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 60;
    const maxWidth = pageWidth - margin * 2;
    doc.setFontSize(16);
    doc.text(title, margin, margin);
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(editor.state.doc.textContent, maxWidth);
    doc.text(lines, margin, margin + 28);
    doc.save(`${title}.pdf`);
  };

  const handleFind = (text: string) => {
    if (!text || !editor) return;
    const content = editor.state.doc.textContent;
    const idx = content.indexOf(text);
    if (idx === -1) return;
    // Select the found text in the editor
    let charPos = 0;
    let from = -1;
    editor.state.doc.descendants((node, pos) => {
      if (from !== -1) return false;
      if (node.isText && node.text) {
        const localIdx = node.text.indexOf(text, Math.max(0, idx - charPos));
        if (localIdx !== -1 && charPos + localIdx === idx) {
          from = pos + localIdx;
          return false;
        }
        charPos += node.text.length;
      }
    });
    if (from !== -1) {
      editor.chain().focus().setTextSelection({ from, to: from + text.length }).run();
    }
  };

  const handleReplace = (find: string, replace: string) => {
    if (!find || !editor) return;
    const { state, dispatch } = editor.view;
    const text = state.doc.textContent;
    const idx = text.indexOf(find);
    if (idx === -1) return;
    let charPos = 0;
    let from = -1;
    state.doc.descendants((node, pos) => {
      if (from !== -1) return false;
      if (node.isText && node.text) {
        const localIdx = node.text.indexOf(find, Math.max(0, idx - charPos));
        if (localIdx !== -1 && charPos + localIdx === idx) {
          from = pos + localIdx;
          return false;
        }
        charPos += node.text.length;
      }
    });
    if (from !== -1) {
      const tr = state.tr.replaceWith(from, from + find.length, state.schema.text(replace));
      dispatch(tr);
    }
  };

  const handleReplaceAll = (find: string, replace: string) => {
    if (!find || !editor) return;
    const { state, dispatch } = editor.view;
    const tr = state.tr;
    let offset = 0;
    state.doc.descendants((node, pos) => {
      if (node.isText && node.text) {
        let start = 0;
        let localIdx: number;
        while ((localIdx = node.text.indexOf(find, start)) !== -1) {
          const from = pos + localIdx + offset;
          tr.replaceWith(from, from + find.length, state.schema.text(replace));
          offset += replace.length - find.length;
          start = localIdx + find.length;
        }
      }
    });
    dispatch(tr);
  };

  const handleCapitalize = (type: "upper" | "lower" | "title") => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) return;
    const text = editor.state.doc.textBetween(from, to);
    let transformed = "";
    if (type === "upper") transformed = text.toUpperCase();
    else if (type === "lower") transformed = text.toLowerCase();
    else transformed = text.replace(/\b\w/g, (c) => c.toUpperCase());
    editor.chain().focus().insertContentAt({ from, to }, transformed).run();
  };

  const handleSetLineHeight = (lh: string) => {
    if (!editor) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chain = editor.chain().focus() as any;
    if (!lh) chain?.unsetLineHeight?.();
    else chain?.setLineHeight?.(lh);
  };

  const handleInsertFootnote = (text: string) => {
    if (!editor || !text.trim()) return;
    setShowFootnoteDialog(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor.chain().focus() as any).insertFootnote(text.trim()).run();
  };

  const handleAddComment = (text: string) => {
    if (!editor) return;
    setShowAddCommentDialog(false);
    const id = `c${Date.now()}`;
    setComments((prev) => ({
      ...prev,
      [id]: { text, createdAt: new Date().toISOString() },
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor.chain().focus() as any).setComment(id).run();
    setShowComments(true);
  };

  const handleDeleteComment = (id: string) => {
    setComments((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (editor?.chain().focus() as any)?.unsetCommentById?.(id);
  };

  const handleInsertLink = (url: string) => {
    if (!editor) return;
    setShowLinkDialog(false);
    if (editor.state.selection.empty) {
      // Use setLink on a text node to avoid raw HTML injection
      editor.chain().focus().insertContent(url).setLink({ href: url }).run();
    } else {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const handleInsertImage = (url: string, alt?: string) => {
    if (!editor) return;
    setShowImageDialog(false);
    editor.chain().focus().setImage({ src: url, alt: alt || "" }).run();
  };

  const handleInsertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  // Ctrl+S to save, Ctrl+F for find/replace, Escape to exit reading mode, Ctrl+/ shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "f" || e.key === "h")) {
        e.preventDefault();
        setShowFindReplace(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setShowShortcuts((v) => !v);
      }
      if (e.key === "Escape") {
        setReadingMode(false);
        setSlashMenu(null);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleSave]);

  const headingValue = getHeadingValue(editor);
  const currentFont = getCurrentFont(editor);
  const currentColor = editor?.getAttributes("textStyle")?.color || "#000000";
  const currentHighlight = editor?.getAttributes("highlight")?.color || "";
  const currentFontSize = editor?.getAttributes("textStyle")?.fontSize || "";
  const currentLineHeight = editor?.getAttributes("paragraph")?.lineHeight ||
    editor?.getAttributes("heading")?.lineHeight || "";

  return (
    <>
      {/* ── Reading Mode overlay ─────────────────────────────────────── */}
      {readingMode && (
        <div className="fixed inset-0 z-40 bg-white dark:bg-gray-950 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-8 py-12">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
              <button
                onClick={() => setReadingMode(false)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5"
                title="Sair do modo leitura (Esc)"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                Sair do modo leitura
              </button>
            </div>
            {header && (
              <div className="text-sm text-gray-500 dark:text-gray-400 border-b pb-3 mb-6 whitespace-pre-wrap">{header}</div>
            )}
            <div
              className="prose dark:prose-invert max-w-none text-base leading-relaxed"
              dangerouslySetInnerHTML={{ __html: editor?.getHTML() || "" }}
            />
            {footnotes.length > 0 && (
              <div className="mt-10 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-1">
                {footnotes.map((note, i) => (
                  <p key={i} className="text-sm text-gray-500 dark:text-gray-400">
                    <sup className="text-blue-600 mr-1">{i + 1}</sup>{note}
                  </p>
                ))}
              </div>
            )}
            {footer && (
              <div className="text-sm text-gray-500 dark:text-gray-400 border-t pt-3 mt-10 whitespace-pre-wrap">{footer}</div>
            )}
          </div>
        </div>
      )}
      <div className="flex h-full gap-4">
      {/* Document list sidebar */}
      <div className="w-56 flex-shrink-0 hidden lg:flex flex-col gap-2">
        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-3 h-full flex flex-col gap-2">
            {/* Header */}
            <div className="flex items-center justify-between flex-shrink-0">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Documentos</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setShowTemplatePicker(true)} className="text-gray-400 hover:text-blue-600" title="Novo a partir de template">
                  <LayoutTemplate className="h-3.5 w-3.5" />
                </button>
                <button onClick={handleNewDocument} className="text-blue-600 hover:text-blue-700" title="Novo documento em branco">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            {/* Search */}
            <div className="relative flex-shrink-0">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
              <input
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                placeholder="Buscar..."
                className="w-full text-xs pl-6 pr-2 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
              {docSearch && (
                <button onClick={() => setDocSearch("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {/* Tag filter */}
            {docTags.length > 0 && (
              <div className="flex flex-wrap gap-1 flex-shrink-0">
                {docTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setTagFilter(tagFilter === tag ? "" : tag)}
                    className={`text-[10px] px-1.5 py-0.5 rounded-full border transition-colors ${
                      tagFilter === tag
                        ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300"
                        : "bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400"
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            )}
            {/* Document list */}
            <div className="space-y-1 overflow-y-auto flex-1">
              {documents.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Nenhum documento</p>
              )}
              {documents
                .filter((doc) => {
                  if (docSearch && !doc.title.toLowerCase().includes(docSearch.toLowerCase())) return false;
                  if (tagFilter) {
                    // tags are stored in content JSON
                    try {
                      const meta = parseDocContent(doc.content || "");
                      if (!meta.tags?.includes(tagFilter)) return false;
                    } catch { return false; }
                  }
                  return true;
                })
                .map((doc) => (
                <div
                  key={doc.id}
                  className={`group flex items-center justify-between rounded-lg p-2 cursor-pointer ${
                    currentDoc?.id === doc.id
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => handleViewDocument(doc.id)}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate text-xs text-gray-700 dark:text-gray-300">{doc.title}</span>
                  </div>
                  <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0 ml-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/editor?id=${doc.id}`); }}
                      className="text-gray-400 hover:text-blue-600"
                      title="Editar"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc.id); }}
                      className="text-gray-400 hover:text-red-500"
                      title="Excluir"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        {showToc && (
          <TableOfContents entries={tocEntries} onClose={() => setShowToc(false)} />
        )}
      </div>

      {/* Main editor area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Title + tags + action buttons */}
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          <div className="flex-1 min-w-40 flex flex-col gap-1">
            <Input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
              className="text-lg font-semibold border-0 border-b rounded-none px-0 focus:ring-0 bg-transparent"
              placeholder="Título do documento"
            />
            {/* Tags row */}
            <div className="flex items-center gap-1 flex-wrap min-h-[22px]">
              {docTags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 text-[11px] bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-full px-2 py-0.5">
                  #{tag}
                  <button onClick={() => handleRemoveTag(tag)} className="hover:text-red-500" title="Remover tag">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
              <form
                onSubmit={(e) => { e.preventDefault(); handleAddTag(tagInput); }}
                className="inline-flex items-center"
              >
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="+ tag"
                  className="text-[11px] w-14 bg-transparent text-gray-500 dark:text-gray-400 placeholder-gray-400 focus:outline-none focus:text-gray-700 dark:focus:text-gray-200"
                  title="Adicionar tag (Enter para confirmar)"
                />
              </form>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button size="sm" onClick={() => setShowShortcuts(true)} variant="outline" title="Atalhos de teclado (Ctrl+/)">
              <Keyboard className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setShowTemplatePicker(true)} variant="outline" title="Novo a partir de template">
              <LayoutTemplate className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setShowVersionHistory(!showVersionHistory)} variant={showVersionHistory ? "default" : "outline"} title="Histórico de versões">
              <Clock className="h-4 w-4" />
              {versions.length > 0 && <span className="ml-1 text-xs">{versions.length}</span>}
            </Button>
            <Button size="sm" onClick={() => setShowDocStats(!showDocStats)} variant={showDocStats ? "default" : "outline"} title="Estatísticas do documento">
              <BookMarked className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setReadingMode(!readingMode)} variant={readingMode ? "default" : "outline"} title={readingMode ? "Sair do modo leitura (Esc)" : "Modo leitura"}>
              {readingMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
            <Button size="sm" onClick={() => setShowComments(!showComments)} variant={showComments ? "default" : "outline"} title="Comentários">
              <MessageSquare className="h-4 w-4" />
              {Object.keys(comments).length > 0 && (
                <span className="ml-1 text-xs">{Object.keys(comments).length}</span>
              )}
            </Button>
            <Button size="sm" onClick={() => setShowFindReplace(!showFindReplace)} variant="outline" title="Localizar/Substituir (Ctrl+F)">
              <Search className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setShowToc(!showToc)} variant="outline" title="Sumário">
              <BookOpen className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setShowHeaderFooter(!showHeaderFooter)} variant={showHeaderFooter ? "default" : "outline"} title="Cabeçalho e Rodapé">
              <PanelTop className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setShowPageSettings(true)} variant="outline" title="Configurações de Página">
              <Settings className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handlePrint} variant="outline" title="Imprimir">
              <Printer className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleExportHTML} variant="outline" title="Exportar HTML">
              <Download className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleExportTXT} variant="outline" title="Exportar TXT">
              <FileText className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleExportPDF} variant="outline" title="Exportar PDF">
              <FileDown className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => handleSave()} loading={saving}>
              <Save className="h-4 w-4 mr-1" />
              {saved ? "Salvo!" : isDirty ? "Salvar•" : "Salvar"}
            </Button>
          </div>
        </div>

        {/* Card + optional Comments panel side-by-side */}
        <div className="flex-1 flex gap-2 min-h-0">
        <Card className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Find & Replace panel */}
          {showFindReplace && (
            <FindReplacePanel
              onClose={() => setShowFindReplace(false)}
              onFind={handleFind}
              onReplace={handleReplace}
              onReplaceAll={handleReplaceAll}
            />
          )}
          {/* Toolbar */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-x-auto">
            {/* Row 1 */}
            <div className="flex items-center gap-0.5 px-2 py-1 border-b border-gray-100 dark:border-gray-700 min-w-max">
              <ToolbarButton onClick={() => editor?.chain().focus().undo().run()} title="Desfazer (Ctrl+Z)" disabled={!editor?.can().undo()}>
                <Undo2 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().redo().run()} title="Refazer (Ctrl+Y)" disabled={!editor?.can().redo()}>
                <Redo2 className="h-4 w-4" />
              </ToolbarButton>

              <Divider />

              <SelectDropdown
                title="Estilo de parágrafo"
                options={HEADING_OPTIONS}
                value={headingValue}
                onChange={(v) => {
                  const level = Number(v);
                  if (level === 0) editor?.chain().focus().setParagraph().run();
                  else editor?.chain().focus().toggleHeading({ level: level as 1|2|3|4|5|6 }).run();
                }}
              />

              <Divider />

              <SelectDropdown
                title="Família de fonte"
                options={FONTS}
                value={currentFont}
                onChange={(v) => {
                  if (!v) editor?.chain().focus().unsetFontFamily().run();
                  else editor?.chain().focus().setFontFamily(String(v)).run();
                }}
              />

              <SelectDropdown
                title="Tamanho de fonte"
                options={[{ label: "Tam.", value: "" }, ...FONT_SIZES]}
                value={currentFontSize}
                onChange={(v) => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  const chain = editor?.chain().focus() as any;
                  if (!v) chain?.unsetFontSize?.();
                  else chain?.setFontSize?.(String(v));
                }}
              />

              <SelectDropdown
                title="Espaçamento de linha"
                options={[{ label: "↕", value: "" }, ...LINE_HEIGHTS]}
                value={currentLineHeight}
                onChange={(v) => handleSetLineHeight(String(v))}
              />

              <Divider />

              <ColorPicker
                colors={TEXT_COLORS}
                value={currentColor}
                onChange={(c) => editor?.chain().focus().setColor(c).run()}
                title="Cor do texto"
              />

              <ColorPicker
                colors={HIGHLIGHT_COLORS}
                value={currentHighlight}
                onChange={(c) => editor?.chain().focus().setHighlight({ color: c }).run()}
                title="Cor de destaque"
              />
              <ToolbarButton
                onClick={() => editor?.chain().focus().unsetHighlight().run()}
                title="Remover destaque"
              >
                <Highlighter className="h-4 w-4 opacity-50" />
              </ToolbarButton>

              <Divider />

              <ToolbarButton
                onClick={() => editor?.chain().focus().clearNodes().unsetAllMarks().run()}
                title="Remover formatação"
              >
                <RemoveFormatting className="h-4 w-4" />
              </ToolbarButton>
            </div>

            {/* Row 2 */}
            <div className="flex items-center gap-0.5 px-2 py-1 min-w-max">
              <ToolbarButton onClick={() => editor?.chain().focus().toggleBold().run()} active={editor?.isActive("bold")} title="Negrito (Ctrl+B)">
                <Bold className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleItalic().run()} active={editor?.isActive("italic")} title="Itálico (Ctrl+I)">
                <Italic className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleUnderline().run()} active={editor?.isActive("underline")} title="Sublinhado (Ctrl+U)">
                <UnderlineIcon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleStrike().run()} active={editor?.isActive("strike")} title="Tachado">
                <Strikethrough className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleSubscript().run()} active={editor?.isActive("subscript")} title="Subscrito">
                <SubIcon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleSuperscript().run()} active={editor?.isActive("superscript")} title="Sobrescrito">
                <SupIcon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleCode().run()} active={editor?.isActive("code")} title="Código inline">
                <Code className="h-4 w-4" />
              </ToolbarButton>

              <Divider />

              <ToolbarButton onClick={() => handleCapitalize("upper")} title="MAIÚSCULAS">
                <span className="text-xs font-bold tracking-tight">AA</span>
              </ToolbarButton>
              <ToolbarButton onClick={() => handleCapitalize("lower")} title="minúsculas">
                <span className="text-xs font-normal tracking-tight">aa</span>
              </ToolbarButton>
              <ToolbarButton onClick={() => handleCapitalize("title")} title="Título (Cada Palavra)">
                <Type className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => setShowFootnoteDialog(true)} title="Inserir nota de rodapé">
                <StickyNote className="h-4 w-4" />
              </ToolbarButton>

              <Divider />

              <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign("left").run()} active={editor?.isActive({ textAlign: "left" })} title="Alinhar à esquerda">
                <AlignLeft className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign("center").run()} active={editor?.isActive({ textAlign: "center" })} title="Centralizar">
                <AlignCenter className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign("right").run()} active={editor?.isActive({ textAlign: "right" })} title="Alinhar à direita">
                <AlignRight className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().setTextAlign("justify").run()} active={editor?.isActive({ textAlign: "justify" })} title="Justificar">
                <AlignJustify className="h-4 w-4" />
              </ToolbarButton>

              <Divider />

              <ToolbarButton
                onClick={() => {
                  if (editor?.isActive("listItem") || editor?.isActive("taskItem")) {
                    editor?.chain().focus().sinkListItem("listItem").run();
                  } else {
                    editor?.chain().focus().insertContent("    ").run();
                  }
                }}
                title="Aumentar recuo (Tab)"
              >
                <Indent className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => {
                  if (editor?.isActive("listItem") || editor?.isActive("taskItem")) {
                    editor?.chain().focus().liftListItem("listItem").run();
                  }
                }}
                title="Diminuir recuo (Shift+Tab)"
              >
                <Outdent className="h-4 w-4" />
              </ToolbarButton>

              <Divider />

              <ToolbarButton onClick={() => editor?.chain().focus().toggleBulletList().run()} active={editor?.isActive("bulletList")} title="Lista de marcadores">
                <List className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={editor?.isActive("orderedList")} title="Lista numerada">
                <ListOrdered className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleTaskList().run()} active={editor?.isActive("taskList")} title="Lista de tarefas">
                <ListChecks className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleBlockquote().run()} active={editor?.isActive("blockquote")} title="Citação em bloco">
                <Quote className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().toggleCodeBlock().run()} active={editor?.isActive("codeBlock")} title="Bloco de código">
                <Code2 className="h-4 w-4" />
              </ToolbarButton>

              <Divider />

              <ToolbarButton onClick={() => setShowLinkDialog(true)} active={editor?.isActive("link")} title="Inserir link (Ctrl+K)">
                <Link2 className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => setShowImageDialog(true)} title="Inserir imagem">
                <ImageIcon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={handleInsertTable} active={editor?.isActive("table")} title="Inserir tabela">
                <TableIcon className="h-4 w-4" />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor?.chain().focus().setHorizontalRule().run()} title="Linha separadora">
                <Minus className="h-4 w-4" />
              </ToolbarButton>

              {editor?.isActive("table") && (
                <>
                  <Divider />
                  <span className="text-xs text-gray-500 dark:text-gray-400 px-1 flex-shrink-0">Tabela:</span>
                  <ToolbarButton onClick={() => editor.chain().focus().addColumnBefore().run()} title="Inserir coluna antes">
                    <Columns className="h-3 w-3" />
                  </ToolbarButton>
                  <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} title="Inserir linha abaixo">
                    <Plus className="h-3 w-3" />
                  </ToolbarButton>
                  <ToolbarButton onClick={() => editor.chain().focus().deleteRow().run()} title="Excluir linha">
                    <Minus className="h-3 w-3" />
                  </ToolbarButton>
                  <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} title="Excluir tabela">
                    <Trash2 className="h-3 w-3" />
                  </ToolbarButton>
                  <ToolbarButton onClick={() => editor.chain().focus().mergeCells().run()} title="Mesclar células">
                    <span className="text-xs font-mono" aria-label="Mesclar células">⊞</span>
                  </ToolbarButton>
                  <ToolbarButton onClick={() => editor.chain().focus().splitCell().run()} title="Dividir célula">
                    <span className="text-xs font-mono" aria-label="Dividir célula">⊟</span>
                  </ToolbarButton>
                </>
              )}
            </div>
          </div>

          {/* Bubble menu */}
          {editor && (
            <BubbleMenu editor={editor}>
              <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700 shadow-lg p-1">
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Negrito">
                  <Bold className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Itálico">
                  <Italic className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Sublinhado">
                  <UnderlineIcon className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => setShowLinkDialog(true)} active={editor.isActive("link")} title="Link">
                  <Link2 className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => setShowAddCommentDialog(true)} active={editor.isActive("comment")} title="Adicionar comentário">
                  <MessageSquare className="h-3.5 w-3.5" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().unsetAllMarks().run()} title="Limpar formatação">
                  <RemoveFormatting className="h-3.5 w-3.5" />
                </ToolbarButton>
              </div>
            </BubbleMenu>
          )}

          <div className="editor-page-area">
            <div
              className="editor-page"
              data-margin={pageMargin}
              data-orientation={pageOrientation}
            >
              {/* Cabeçalho */}
              {showHeaderFooter && (
                <div className="editor-header">
                  <div className="flex items-center gap-1 mb-1">
                    <PanelTop className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-400">Cabeçalho</span>
                  </div>
                  <textarea
                    value={header}
                    onChange={(e) => setHeader(e.target.value)}
                    placeholder="Cabeçalho do documento..."
                    className="w-full bg-transparent resize-none text-sm text-gray-600 dark:text-gray-400 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none"
                    rows={2}
                  />
                </div>
              )}

              <EditorContent editor={editor} />

              {/* Notas de rodapé */}
              {footnotes.length > 0 && (
                <div className="editor-footnotes">
                  {footnotes.map((note, i) => (
                    <p key={i} className="text-xs text-gray-600 dark:text-gray-400">
                      <sup className="text-blue-600 mr-1">{i + 1}</sup>
                      {note}
                    </p>
                  ))}
                </div>
              )}

              {/* Rodapé */}
              {showHeaderFooter && (
                <div className="editor-footer">
                  <div className="flex items-center gap-1 mb-1">
                    <PanelBottom className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-400">Rodapé</span>
                  </div>
                  <textarea
                    value={footer}
                    onChange={(e) => setFooter(e.target.value)}
                    placeholder="Rodapé do documento..."
                    className="w-full bg-transparent resize-none text-sm text-gray-600 dark:text-gray-400 placeholder-gray-300 dark:placeholder-gray-600 focus:outline-none"
                    rows={2}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 px-4 py-1.5 text-xs text-gray-400 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span>{wordCount} palavras · {charCount} caracteres</span>
              <WordGoalBar wordCount={wordCount} goal={wordGoal} onSetGoal={setWordGoal} />
            </div>
            <div className="flex items-center gap-3">
              {autoSaved && <span className="text-green-600 dark:text-green-400 flex items-center gap-1"><Clock className="h-3 w-3" />Salvo automaticamente</span>}
              {isDirty && !saving && <span className="text-orange-500 dark:text-orange-400">● não salvo</span>}
              {currentDoc && (
                <span>Última edição: {formatDate(currentDoc.updatedAt)}</span>
              )}
            </div>
          </div>
        </Card>

        {/* Comments panel - rendered as a side panel next to the Card */}
        {showComments && (
          <CommentsPanel
            comments={comments}
            editor={editor}
            onDelete={handleDeleteComment}
            onClose={() => setShowComments(false)}
          />
        )}
        {/* Version history panel */}
        {showVersionHistory && (
          <VersionHistoryPanel
            versions={versions}
            onRestore={handleRestoreVersion}
            onClose={() => setShowVersionHistory(false)}
          />
        )}
        {/* Document stats panel */}
        {showDocStats && (
          <DocStatsPanel
            wordCount={wordCount}
            charCount={charCount}
            html={editor?.getHTML() || ""}
            onClose={() => setShowDocStats(false)}
          />
        )}
        </div>
      </div>

      {showLinkDialog && (
        <LinkDialog
          initialUrl={editor?.getAttributes("link")?.href || ""}
          onConfirm={handleInsertLink}
          onCancel={() => setShowLinkDialog(false)}
        />
      )}
      {showImageDialog && (
        <ImageDialog
          onConfirm={handleInsertImage}
          onCancel={() => setShowImageDialog(false)}
        />
      )}
      {showPageSettings && (
        <PageSettingsPanel
          margin={pageMargin}
          orientation={pageOrientation}
          onMarginChange={setPageMargin}
          onOrientationChange={setPageOrientation}
          onClose={() => setShowPageSettings(false)}
        />
      )}
      {showFootnoteDialog && (
        <FootnoteDialog
          onConfirm={handleInsertFootnote}
          onCancel={() => setShowFootnoteDialog(false)}
        />
      )}
      {showAddCommentDialog && (
        <AddCommentDialog
          onConfirm={handleAddComment}
          onCancel={() => setShowAddCommentDialog(false)}
        />
      )}
      {showTemplatePicker && (
        <TemplatePickerDialog
          onConfirm={handleNewFromTemplate}
          onCancel={() => setShowTemplatePicker(false)}
        />
      )}
      {showShortcuts && (
        <ShortcutsModal onClose={() => setShowShortcuts(false)} />
      )}
      {slashMenu && (
        <SlashMenu
          query={slashMenu.query}
          coords={slashMenu.coords}
          onSelect={handleSlashSelect}
          onClose={() => setSlashMenu(null)}
        />
      )}
      {viewDocId && (
        <DocumentViewerModal
          data={viewDocData}
          loading={viewDocLoading}
          onClose={() => { setViewDocId(null); setViewDocData(null); }}
          onEdit={handleEditFromViewer}
        />
      )}
    </div>
    </>
  );
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    }>
      <EditorPageInner />
    </Suspense>
  );
}
