"use client";

import { useState, useEffect, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Send, AlertCircle } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

export default function EstudoPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "system-1",
      role: "system",
      content:
        "Olá! Eu sou o Freudzin, sua IA de Psicologia. Pergunte sobre teorias, resumos, revisões e organização de estudos — respondo com clareza, empatia e foco acadêmico.",
    },
  ]);
  const [prompt, setPrompt] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [libraryItems, setLibraryItems] = useState<{ title: string; description?: string; type: string; url: string }[]>([]);
  const [periods, setPeriods] = useState<{ name: string; disciplines: { name: string; description?: string }[] }[]>([]);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);

  const addMessage = (message: ChatMessage) => {
    setMessages((current) => [...current, message]);
  };

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) return;

    setError(null);
    setSending(true);
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    const outgoingMessages = [...messages, userMessage];
    setMessages(outgoingMessages);
    setPrompt("");

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
        addMessage({
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.message || "A IA não retornou uma resposta.",
        });
      }
    } catch (err) {
      console.error("Estudo chat error", err);
      setError("Não foi possível conectar ao serviço de chat. Verifique sua internet e tente novamente.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-slate-50 p-6 shadow-sm shadow-slate-200/40 dark:border-slate-800 dark:bg-slate-950 dark:shadow-slate-950/20 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg shadow-blue-500/20">
            <svg viewBox="0 0 64 64" className="h-8 w-8" aria-hidden="true">
              <path d="M32 8C20 8 12 16 12 28s8 20 20 20 20-8 20-20S44 8 32 8Z" fill="#f8d4b2" />
              <path d="M20 30c1 3 4 6 12 6s11-3 12-6" stroke="#3b2d24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M23 25c0-4 3-8 9-8s9 4 9 8" stroke="#3b2d24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M21 34c2 3 5 4 6 4s4-1 6-4" stroke="#3b2d24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              <path d="M22 20c0-3 2-5 5-5h10c3 0 5 2 5 5" stroke="#3b2d24" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Freudzin</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Converse com a IA para revisar conteúdos de Psicologia, gerar resumos e planejar estudos.
            </p>
          </div>
        </div>
        <div className="rounded-3xl bg-white/90 px-4 py-3 text-sm text-slate-600 shadow-sm shadow-slate-200/50 dark:bg-slate-900 dark:text-slate-300 dark:shadow-slate-950/20">
          Freudzin é seu assistente de estudo inteligente: claro, direto e alinhado às melhores práticas acadêmicas.
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seu assistente de estudos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-3 rounded-3xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
              {messages
                .filter((message) => message.role !== "system")
                .map((message) => (
                  <div
                    key={message.id}
                    className={
                      message.role === "user"
                        ? "rounded-2xl bg-white px-4 py-3 text-sm text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100"
                        : "rounded-2xl bg-blue-50 px-4 py-3 text-sm text-gray-900 shadow-sm dark:bg-blue-900/30 dark:text-gray-100"
                    }
                  >
                    <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                      {message.role === "user" ? (
                        <span>Você</span>
                      ) : (
                        <span>Freudzin</span>
                      )}
                    </div>
                    <p className="whitespace-pre-line">{message.content}</p>
                  </div>
                ))}
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/60 dark:text-red-200">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Digite sua dúvida para o Freudzin..."
                disabled={sending}
              />
              <Button type="submit" disabled={sending || !prompt.trim()} className="justify-center gap-2">
                <Send className="h-4 w-4" />
                {sending ? "Enviando..." : "Enviar"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
