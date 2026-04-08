"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
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
  Maximize2, Minimize2,
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
    }
  }, [editor]);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);
  useEffect(() => {
    if (docId && editor) loadDocument(docId);
  }, [docId, editor, loadDocument]);

  const handleSave = useCallback(async () => {
    if (!editor) return;
    setSaving(true);
    const content = serializeDocContent({
      html: editor.getHTML(),
      header: header || undefined,
      footer: footer || undefined,
      margin: pageMargin,
      orientation: pageOrientation,
      comments: Object.keys(comments).length ? comments : undefined,
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
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    loadDocuments();
  }, [editor, currentDoc, title, header, footer, pageMargin, pageOrientation, comments, router, loadDocuments]);

  const handleNewDocument = () => {
    setCurrentDoc(null);
    setTitle("Novo Documento");
    editor?.commands.setContent("");
    setHeader("");
    setFooter("");
    setPageMargin("normal");
    setPageOrientation("portrait");
    setComments({});
    router.push("/editor");
  };

  const handleDeleteDocument = async (id: string) => {
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (currentDoc?.id === id) handleNewDocument();
    loadDocuments();
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

  // Ctrl+S to save, Ctrl+H or Ctrl+F for find/replace
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
    <div className="flex h-full gap-4">
      {/* Document list sidebar */}
      <div className="w-56 flex-shrink-0 hidden lg:flex flex-col gap-2">
        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-3 h-full flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Documentos</span>
              <button onClick={handleNewDocument} className="text-blue-600 hover:text-blue-700" title="Novo documento">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1 overflow-y-auto flex-1">
              {documents.length === 0 && (
                <p className="text-xs text-gray-400 text-center py-4">Nenhum documento</p>
              )}
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className={`group flex items-center justify-between rounded-lg p-2 cursor-pointer ${
                    currentDoc?.id === doc.id
                      ? "bg-blue-50 dark:bg-blue-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => router.push(`/editor?id=${doc.id}`)}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <FileText className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate text-xs text-gray-700 dark:text-gray-300">{doc.title}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteDocument(doc.id); }}
                    className="hidden group-hover:block text-gray-400 hover:text-red-500 flex-shrink-0 ml-1"
                    title="Excluir"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
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
        {/* Title + action buttons */}
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 min-w-40 text-lg font-semibold border-0 border-b rounded-none px-0 focus:ring-0 bg-transparent"
            placeholder="Título do documento"
          />
          <div className="flex items-center gap-1.5 flex-shrink-0">
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
            <Button size="sm" onClick={handleSave} loading={saving}>
              <Save className="h-4 w-4 mr-1" />
              {saved ? "Salvo!" : "Salvar"}
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
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 px-4 py-1.5 text-xs text-gray-400">
            <span>{wordCount} palavras · {charCount} caracteres</span>
            {currentDoc && (
              <span>Última edição: {formatDate(currentDoc.updatedAt)}</span>
            )}
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
    </div>
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
