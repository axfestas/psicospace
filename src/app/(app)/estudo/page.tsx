"use client";

import { useState, useEffect, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertCircle,
  Bot,
  BookOpen,
  ChevronRight,
  Copy,
  Edit3,
  Info,
  Pin,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  pinned: boolean;
  createdAt: number;
  updatedAt: number;
}

const systemMessage: ChatMessage = {
  id: "system-1",
  role: "system",
  content:
    "Olá! Eu sou o Freudzin, seu assistente acadêmico de Psicologia. Pergunte sobre teorias, resumos, revisões e organização de estudos — respondo com clareza, foco e contexto educacional.",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatInlineMarkdown(text: string) {
  return text
    .replace(/`([^`]+)`/g, "<code class='rounded bg-slate-100 px-1 py-0.5 text-[0.85em] text-slate-700 dark:bg-slate-800 dark:text-slate-100'>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href='$2' target='_blank' rel='noreferrer noopener' class='text-blue-700 underline decoration-blue-300 dark:text-blue-300'>$1</a>");
}

function markdownToHtml(raw: string) {
  const escaped = escapeHtml(raw);
  const lines = escaped.split(/\r?\n/);
  let html = "";
  let listType: "ul" | "ol" | null = null;
  let listItems: string[] = [];
  let tableRows: string[] = [];

  const flushList = () => {
    if (!listType) return;
    html += `<${listType} class='mt-3 ml-6 space-y-2 text-sm text-slate-700 dark:text-slate-300'>${listItems.join("")}</${listType}>`;
    listType = null;
    listItems = [];
  };

  const flushTable = () => {
    if (!tableRows.length) return;
    const rows = tableRows.map((row) => row.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim()));
    const hasHeader = rows.length > 1 && rows[1].every((cell) => /^:?-+:?$/.test(cell));
    html += "<div class='mt-4 overflow-x-auto rounded-3xl border border-slate-200 dark:border-slate-800'><table class='w-full border-collapse text-sm'><tbody>";
    rows.forEach((row, index) => {
      if (index === 1 && hasHeader) return;
      const rowHtml = row
        .map((cell) => {
          const content = formatInlineMarkdown(cell);
          if (index === 0 && hasHeader) {
            return `<th class='border-b border-slate-200 bg-slate-100 px-4 py-3 text-left font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100'>${content}</th>`;
          }
          return `<td class='border-t border-slate-200 px-4 py-3 dark:border-slate-800'>${content}</td>`;
        })
        .join("");
      html += `<tr>${rowHtml}</tr>`;
    });
    html += "</tbody></table></div>";
    tableRows = [];
  };

  lines.forEach((line, index) => {
    const headingMatch = line.match(/^\s*(#{1,6})\s+(.*)$/);
    const blockquoteMatch = line.match(/^\s*>\s+(.*)$/);
    const unorderedMatch = line.match(/^\s*[-*+]\s+(.*)$/);
    const orderedMatch = line.match(/^\s*\d+\.\s+(.*)$/);
    const tableMatch = line.trim().startsWith("|");

    if (tableMatch) {
      tableRows.push(line);
      return;
    }

    if (tableRows.length) {
      flushTable();
    }

    if (headingMatch) {
      flushList();
      const level = headingMatch[1].length;
      const content = formatInlineMarkdown(headingMatch[2]);
      html += `<h${level} class='mt-6 scroll-mt-8 font-semibold text-slate-900 dark:text-slate-100'>${content}</h${level}>`;
      return;
    }

    if (blockquoteMatch) {
      flushList();
      const content = formatInlineMarkdown(blockquoteMatch[1]);
      html += `<blockquote class='mt-4 rounded-3xl border-l-4 border-blue-500 bg-slate-50 p-4 text-sm text-slate-700 dark:border-blue-400 dark:bg-slate-900 dark:text-slate-200'>${content}</blockquote>`;
      return;
    }

    if (unorderedMatch) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listItems.push(`<li class='pl-1'>${formatInlineMarkdown(unorderedMatch[1])}</li>`);
      return;
    }

    if (orderedMatch) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listItems.push(`<li class='pl-1'>${formatInlineMarkdown(orderedMatch[1])}</li>`);
      return;
    }

    flushList();

    if (line.trim() === "") {
      return;
    }

    html += `<p class='mt-4 text-sm leading-7 text-slate-700 dark:text-slate-300'>${formatInlineMarkdown(line)}</p>`;
  });

  flushList();
  flushTable();

  return html;
}

function extractReferences(content: string) {
  const match = content.match(/(?:^|\n)#+\s*Refer[eê]ncias\s*[\r\n]+([\s\S]*)/i);
  if (!match) return [];
  const lines = match[1].split(/\r?\n/);
  const refs: string[] = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/^#{1,6}\s+/.test(line)) break;
    const cleaned = line.replace(/^[-*+\d\.\s]+/, "").trim();
    if (cleaned) refs.push(cleaned);
  }
  return refs;
}

function formatSessionDate(timestamp: number) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Hoje";
  if (date.toDateString() === yesterday.toDateString()) return "Ontem";

  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
}

export default function EstudoPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [libraryItems, setLibraryItems] = useState<{ title: string; description?: string; type: string; url: string }[]>([]);
  const [periods, setPeriods] = useState<{ name: string; disciplines: { name: string; description?: string }[] }[]>([]);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("freudzin-sessions") : null;
    if (stored) {
      try {
        const parsed: ChatSession[] = JSON.parse(stored);
        if (parsed?.length) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          return;
        }
      } catch {
        // ignore parse errors
      }
    }

    const initialSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: "Nova conversa",
      messages: [systemMessage],
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setSessions([initialSession]);
    setActiveSessionId(initialSession.id);
  }, []);

  useEffect(() => {
    async function loadContext() {
      try {
        const [libraryRes, periodsRes] = await Promise.all([
          fetch("/api/biblioteca"),
          fetch("/api/periods"),
        ]);
        const [libraryData, periodsData] = await Promise.all([
          libraryRes.ok ? libraryRes.json() : Promise.reject(new Error("Falha ao carregar biblioteca")),
          periodsRes.ok ? periodsRes.json() : Promise.reject(new Error("Falha ao carregar disciplinas")),
        ]);
        setLibraryItems(libraryData.items || []);
        setPeriods(
          (periodsData.periods || []).map((period: any) => ({
            name: period.name,
            disciplines: (period.disciplines || []).map((discipline: any) => ({
              name: discipline.name,
              description: discipline.description,
            })),
          }))
        );
      } catch (err) {
        console.error("Erro carregando contexto de chat", err);
        setContextError("Não foi possível carregar o contexto de Biblioteca e Disciplinas.");
      } finally {
        setContextLoading(false);
      }
    }
    loadContext();
  }, []);

  const activeSession = sessions.find((session) => session.id === activeSessionId) ?? sessions[0];
  const messages = activeSession?.messages ?? [];
  const hasConversation = messages.some((message) => message.role !== "system");

  const saveSessions = (updated: ChatSession[]) => {
    setSessions(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("freudzin-sessions", JSON.stringify(updated));
    }
  };

  const updateCurrentSession = (patch: Partial<ChatSession>) => {
    if (!activeSession) return;
    const updated = sessions.map((session) =>
      session.id === activeSession.id
        ? { ...session, ...patch, updatedAt: Date.now() }
        : session
    );
    saveSessions(updated);
  };

  const createSession = (title = "Nova conversa") => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title,
      messages: [systemMessage],
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return newSession;
  };

  const handleNewChat = () => {
    const newSession = createSession();
    saveSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setPrompt("");
    setSidebarOpen(false);
  };

  const handleRenameSession = (session: ChatSession) => {
    const name = window.prompt("Renomear conversa", session.title);
    if (!name || !name.trim()) return;
    saveSessions(
      sessions.map((item) =>
        item.id === session.id
          ? { ...item, title: name.trim(), updatedAt: Date.now() }
          : item
      )
    );
  };

  const handleTogglePin = (session: ChatSession) => {
    saveSessions(
      sessions.map((item) =>
        item.id === session.id
          ? { ...item, pinned: !item.pinned, updatedAt: Date.now() }
          : item
      )
    );
  };

  const handleDeleteSession = (session: ChatSession) => {
    if (!window.confirm("Excluir esta conversa?")) return;
    const remaining = sessions.filter((item) => item.id !== session.id);
    if (!remaining.length) {
      const fresh = createSession();
      saveSessions([fresh]);
      setActiveSessionId(fresh.id);
      return;
    }
    saveSessions(remaining);
    if (activeSessionId === session.id) {
      setActiveSessionId(remaining[0].id);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || !activeSession) return;

    setError(null);
    setSending(true);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    const outgoingMessages = [...messages, userMessage];
    updateCurrentSession({ messages: outgoingMessages });
    setPrompt("");

    if (activeSession.title === "Nova conversa") {
      updateCurrentSession({ title: trimmed.slice(0, 50).trim() || "Nova conversa" });
    }

    const librarySummary = libraryItems
      .slice(0, 8)
      .map((item) => `- ${item.title} (${item.type})${item.description ? `: ${item.description}` : ""}`)
      .join("\n");
    const periodSummary = periods
      .slice(0, 6)
      .map(
        (period) =>
          `Período ${period.name}:\n${period.disciplines
            .slice(0, 6)
            .map((discipline) => `  - ${discipline.name}${discipline.description ? `: ${discipline.description}` : ""}`)
            .join("\n")}`
      )
      .join("\n\n");

    const contextText = `Use estas informações como contexto relevante de estudo. Biblioteca:\n${librarySummary}\n\nDisciplinas e descrições:\n${periodSummary}`;
    const payloadMessages = outgoingMessages
      .filter((message) => message.role !== "system")
      .map((message) => ({ role: message.role, content: message.content }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ messages: payloadMessages, contextText }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "O servidor de IA falhou. Tente novamente.");
      } else {
        updateCurrentSession({
          messages: [...outgoingMessages, { id: `assistant-${Date.now()}`, role: "assistant", content: data.message || "A IA não retornou uma resposta." }],
        });
      }
    } catch (err) {
      console.error("Estudo chat error", err);
      setError("Não foi possível conectar ao serviço de chat. Verifique sua internet e tente novamente.");
    } finally {
      setSending(false);
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const form = event.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  const handleCopy = async (messageContent: string) => {
    await navigator.clipboard.writeText(messageContent);
  };

  const filteredSessions = sessions
    .filter((session) =>
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.messages.some((message) => message.content.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6 lg:px-8">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className="mx-auto grid max-w-[1600px] gap-6 lg:grid-cols-[320px_1fr]">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto border-r border-slate-200 bg-white p-5 shadow-xl transition-transform duration-300 dark:border-slate-800 dark:bg-slate-950 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
          aria-label="Barra lateral de conversas"
        >
          <div className="flex items-center justify-between gap-3 pb-4 lg:pb-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Freudzin
              </p>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Conversas
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mb-4 flex items-center gap-2">
            <Button onClick={handleNewChat} className="w-full justify-center gap-2" size="sm" variant="secondary">
              <Plus className="h-4 w-4" />
              Novo chat
            </Button>
          </div>

          <div className="mb-4">
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Pesquisar conversas"
              aria-label="Pesquisar conversas"
            />
          </div>

          <div className="space-y-4">
            {filteredSessions.filter((session) => session.pinned).length > 0 && (
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  Fixados
                </p>
                <div className="space-y-3">
                  {filteredSessions
                    .filter((session) => session.pinned)
                    .map((session) => (
                      <button
                        key={session.id}
                        type="button"
                        onClick={() => {
                          setActiveSessionId(session.id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                          activeSession?.id === session.id
                            ? "border-blue-200 bg-blue-50 text-slate-900 dark:border-blue-500 dark:bg-blue-950/70"
                            : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">{session.title}</p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              {formatSessionDate(session.updatedAt)}
                            </p>
                          </div>
                          <Pin className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleRenameSession(session);
                            }}
                            className="rounded-full border border-slate-200 px-2 py-1 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900"
                          >
                            <Edit3 className="mr-1 inline h-3.5 w-3.5" /> Renomear
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteSession(session);
                            }}
                            className="rounded-full border border-slate-200 px-2 py-1 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900"
                          >
                            <Trash2 className="mr-1 inline h-3.5 w-3.5" /> Excluir
                          </button>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            )}

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Recentes
              </p>
              <div className="space-y-3">
                {filteredSessions
                  .filter((session) => !session.pinned)
                  .map((session) => (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => {
                        setActiveSessionId(session.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                        activeSession?.id === session.id
                          ? "border-blue-200 bg-blue-50 text-slate-900 dark:border-blue-500 dark:bg-blue-950/70"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold">{session.title}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            {formatSessionDate(session.updatedAt)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleTogglePin(session);
                          }}
                          className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                          aria-label={session.pinned ? "Desafixar conversa" : "Fixar conversa"}
                        >
                          <Pin className={`h-4 w-4 ${session.pinned ? "text-amber-500" : "text-slate-400"}`} />
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleRenameSession(session);
                          }}
                          className="rounded-full border border-slate-200 px-2 py-1 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900"
                        >
                          <Edit3 className="mr-1 inline h-3.5 w-3.5" /> Renomear
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteSession(session);
                          }}
                          className="rounded-full border border-slate-200 px-2 py-1 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-900"
                        >
                          <Trash2 className="mr-1 inline h-3.5 w-3.5" /> Excluir
                        </button>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600 shadow-sm dark:bg-slate-900 dark:text-slate-300">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Sparkles className="h-4 w-4" />
              <span>Organize estudos, revisões e pesquisas acadêmicas.</span>
            </div>
          </div>
        </aside>

        <main className="space-y-6">
          <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Freudzin</p>
                <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">
                  Seu assistente acadêmico para estudar Psicologia
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                  Estude conceitos, pesquise temas, transforme explicações em material de revisão e acesse referências confiáveis.
                </p>
              </div>
              <div className="hidden items-center gap-3 rounded-3xl bg-slate-100 px-4 py-2 text-sm text-slate-600 dark:bg-slate-900 dark:text-slate-300 lg:flex">
                <Info className="h-5 w-5" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">Assistente acadêmico</p>
                  <p className="text-xs">Interpreta contexto, corrige ambiguidade e prioriza conteúdo educacional.</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { icon: "📚", title: "Estudar um tema", subtitle: "Explique um conceito" },
                  { icon: "🔎", title: "Pesquisar", subtitle: "Encontre referências" },
                  { icon: "📝", title: "Organizar", subtitle: "Transforme em material" },
                  { icon: "🎓", title: "Revisar", subtitle: "Crie perguntas" },
                ].map((card) => (
                  <button
                    key={card.title}
                    type="button"
                    onClick={() => setPrompt(card.title)}
                    className="group rounded-3xl border border-slate-200 bg-white p-4 text-left transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-lg dark:bg-slate-800">
                      {card.icon}
                    </div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{card.title}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{card.subtitle}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <section className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Conversa</p>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{activeSession?.title ?? "Nova conversa"}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {hasConversation
                    ? "Respostas organizadas com estrutura acadêmica e referências quando disponíveis."
                    : "Comece com uma pergunta sobre Psicologia, pesquisa acadêmica ou organização de estudos."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" variant="outline" onClick={() => handleRenameSession(activeSession!)}>
                  <Edit3 className="mr-2 h-4 w-4" /> Renomear
                </Button>
                <Button size="sm" variant="secondary" onClick={() => handleTogglePin(activeSession!)}>
                  <Pin className="mr-2 h-4 w-4" /> {activeSession?.pinned ? "Desafixar" : "Fixar"}
                </Button>
              </div>
            </div>

            {contextLoading ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                Carregando contexto de estudo...
              </div>
            ) : contextError ? (
              <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200">
                {contextError}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Biblioteca</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {libraryItems.length > 0
                      ? `${libraryItems.length} itens disponíveis para referência e estudo.`
                      : "Nenhum item de biblioteca disponível."}
                  </p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Disciplinas</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {periods.length > 0
                      ? `${periods.length} períodos carregados com suas disciplinas.`
                      : "Nenhuma disciplina encontrada."}
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
            {error && (
              <div className="flex items-start gap-2 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/60 dark:text-red-200">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!hasConversation ? (
              <div className="grid gap-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
                  <Bot className="h-8 w-8" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Olá, eu sou o Freudzin.</h3>
                  <p className="mx-auto max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-400">
                    Seu assistente acadêmico para estudar Psicologia. Pergunte sobre teorias, tratamentos, referências científicas e organização de conteúdo.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { title: "📚 Estudar um tema", description: "Explique um conceito acadêmico" },
                    { title: "🔎 Pesquisar", description: "Organize uma pesquisa acadêmica" },
                    { title: "📝 Organizar", description: "Transforme em material de estudo" },
                    { title: "🎓 Revisar", description: "Gere perguntas e flashcards" },
                  ].map((card) => (
                    <button
                      key={card.title}
                      type="button"
                      onClick={() => setPrompt(card.title)}
                      className="rounded-3xl border border-slate-200 bg-white px-4 py-5 text-left text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                    >
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{card.title}</p>
                      <p className="mt-2 text-slate-500 dark:text-slate-400">{card.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  {messages
                    .filter((message) => message.role !== "system")
                    .map((message) => {
                      const refs = message.role === "assistant" ? extractReferences(message.content) : [];
                      return (
                        <article
                          key={message.id}
                          className={
                            message.role === "user"
                              ? "rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                              : "rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                          }
                        >
                          <div className="flex items-start gap-4">
                            <div className={
                              message.role === "user"
                                ? "flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                : "flex h-12 w-12 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                            }>
                              {message.role === "user" ? (
                                <span className="text-sm font-semibold">Você</span>
                              ) : (
                                <Bot className="h-5 w-5" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3">
                                <div>
                                  <p className={
                                    message.role === "user"
                                      ? "text-sm font-semibold text-slate-900 dark:text-slate-100"
                                      : "text-base font-semibold text-slate-900 dark:text-slate-100"
                                  }>
                                    {message.role === "user" ? "Você" : "Freudzin"}
                                  </p>
                                  {message.role === "assistant" && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Assistente acadêmico de Psicologia</p>
                                  )}
                                </div>
                                {message.role === "assistant" && refs.length > 0 && (
                                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    Baseado em {refs.length} referências
                                  </span>
                                )}
                              </div>
                              <div
                                className={
                                  message.role === "user"
                                    ? "mt-4 text-sm leading-7 text-slate-700 dark:text-slate-300"
                                    : "mt-4 prose max-w-none text-sm leading-7 text-slate-700 dark:text-slate-300 prose-a:text-blue-700 prose-a:underline prose-ol:list-decimal prose-ul:list-disc dark:prose-a:text-blue-300"
                                }
                                dangerouslySetInnerHTML={{ __html: message.role === "assistant" ? markdownToHtml(message.content) : escapeHtml(message.content).replace(/\n/g, "<br />") }}
                              />

                              {message.role === "assistant" && (
                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(message.content)}
                                    className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                                  >
                                    <Copy className="h-4 w-4" /> Copiar
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setPrompt("Pode transformar isso em um resumo de estudo?")}
                                    className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
                                  >
                                    <BookOpen className="h-4 w-4" /> Perguntar sobre isso
                                  </button>
                                </div>
                              )}

                              {message.role === "assistant" && refs.length > 0 && (
                                <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                                  <div className="mb-4 flex items-center justify-between gap-4">
                                    <div>
                                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Referências</p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Fontes citadas pela resposta</p>
                                    </div>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                      {refs.length} fontes
                                    </span>
                                  </div>
                                  <div className="grid gap-3">
                                    {refs.map((ref, index) => (
                                      <div key={index} className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{ref}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-4">
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <label htmlFor="freudzin-prompt" className="mb-3 block text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Sua pergunta para o Freudzin
                </label>
                <textarea
                  id="freudzin-prompt"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={handleInputKeyDown}
                  rows={4}
                  placeholder="Escreva aqui sua dúvida, pesquisa ou pedido de material de estudo..."
                  className="min-h-[5rem] w-full resize-none rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-500/20"
                  disabled={sending}
                  aria-label="Campo de mensagem do Freudzin"
                />
                <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  O Freudzin pode ajudar com estudos, pesquisa, organização de conteúdo e referências acadêmicas.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button type="submit" disabled={sending || !prompt.trim()} className="justify-center gap-2 sm:w-auto">
                  <Send className="h-4 w-4" /> {sending ? "Enviando..." : "Enviar pergunta"}
                </Button>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter para enviar · Shift + Enter para nova linha
                </p>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}
