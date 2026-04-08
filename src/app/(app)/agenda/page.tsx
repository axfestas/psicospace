"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Task, Note } from "@/types";
import { formatDate } from "@/lib/utils";
import { Plus, Trash2, Check, X, ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  description?: string;
}

export default function AgendaPage() {
  const [activeTab, setActiveTab] = useState<"calendar" | "tasks" | "notes">("calendar");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventForm, setShowEventForm] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    startAt: "",
    endAt: "",
  });

  const loadData = useCallback(async () => {
    const [evRes, taskRes, noteRes] = await Promise.all([
      fetch("/api/events"),
      fetch("/api/tasks"),
      fetch("/api/notes"),
    ]);
    if (evRes.ok) setEvents((await evRes.json()).events || []);
    if (taskRes.ok) setTasks((await taskRes.json()).tasks || []);
    if (noteRes.ok) {
      const n = (await noteRes.json()).notes || [];
      setNotes(n);
      if (n.length > 0 && !currentNoteId) {
        setCurrentNoteId(n[0].id);
        setNoteContent(n[0].content);
      }
    }
  }, [currentNoteId]);

  useEffect(() => { loadData(); }, [loadData]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const getEventsForDay = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return events.filter((e) => {
      const d = new Date(e.startAt);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventForm),
    });
    if (res.ok) {
      setShowEventForm(false);
      setEventForm({ title: "", description: "", startAt: "", endAt: "" });
      loadData();
    }
  };

  const handleDeleteEvent = async (id: string) => {
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    loadData();
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTask }),
    });
    if (res.ok) {
      setNewTask("");
      loadData();
    }
  };

  const handleToggleTask = async (task: Task) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    });
    loadData();
  };

  const handleDeleteTask = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    loadData();
  };

  const handleSaveNote = async () => {
    if (currentNoteId) {
      await fetch(`/api/notes/${currentNoteId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteContent }),
      });
    } else {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: noteContent }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentNoteId(data.note.id);
      }
    }
    loadData();
  };

  const handleNewNote = async () => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: "" }),
    });
    if (res.ok) {
      const data = await res.json();
      setCurrentNoteId(data.note.id);
      setNoteContent("");
      loadData();
    }
  };

  const handleDeleteNote = async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: "DELETE" });
    setCurrentNoteId(null);
    setNoteContent("");
    loadData();
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {(["calendar", "tasks", "notes"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            {tab === "calendar" ? "Calendário" : tab === "tasks" ? "Tarefas" : "Anotações"}
          </button>
        ))}
      </div>

      {activeTab === "calendar" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                {monthName}
              </h2>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <Button size="sm" onClick={() => setShowEventForm(!showEventForm)}>
              <Plus className="h-4 w-4 mr-1" /> Novo evento
            </Button>
          </div>

          {showEventForm && (
            <Card>
              <CardContent className="pt-4">
                <form onSubmit={handleCreateEvent} className="space-y-3">
                  <Input
                    placeholder="Título do evento"
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    required
                  />
                  <Input
                    placeholder="Descrição (opcional)"
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Início</label>
                      <Input
                        type="datetime-local"
                        value={eventForm.startAt}
                        onChange={(e) => setEventForm({ ...eventForm, startAt: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Fim</label>
                      <Input
                        type="datetime-local"
                        value={eventForm.endAt}
                        onChange={(e) => setEventForm({ ...eventForm, endAt: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">Salvar</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowEventForm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-2">
              <div className="grid grid-cols-7 gap-1">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                  <div key={d} className="p-2 text-center text-xs font-semibold text-gray-500">
                    {d}
                  </div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayEvents = getEventsForDay(day);
                  const isToday =
                    new Date().getDate() === day &&
                    new Date().getMonth() === currentDate.getMonth() &&
                    new Date().getFullYear() === currentDate.getFullYear();

                  return (
                    <div
                      key={day}
                      className={`min-h-[60px] rounded-lg p-1 ${
                        isToday ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <span
                        className={`block text-center text-sm font-medium mb-1 ${
                          isToday
                            ? "rounded-full bg-blue-600 text-white w-6 h-6 flex items-center justify-center mx-auto"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {day}
                      </span>
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className="truncate rounded bg-blue-100 px-1 py-0.5 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 mb-0.5 cursor-pointer"
                          title={ev.title}
                          onClick={() => handleDeleteEvent(ev.id)}
                        >
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <span className="text-xs text-gray-400">+{dayEvents.length - 2}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Próximos eventos</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhum evento cadastrado.</p>
              ) : (
                <ul className="space-y-2">
                  {events
                    .filter((e) => new Date(e.startAt) >= new Date())
                    .slice(0, 5)
                    .map((event) => (
                      <li key={event.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{event.title}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(event.startAt)} às{" "}
                            {new Date(event.startAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "tasks" && (
        <Card>
          <CardHeader>
            <CardTitle>Minhas Tarefas</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
              <Input
                placeholder="Nova tarefa..."
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
              />
              <Button type="submit" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </form>

            {tasks.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhuma tarefa cadastrada.</p>
            ) : (
              <ul className="space-y-2">
                {tasks.map((task) => (
                  <li key={task.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                    <button
                      onClick={() => handleToggleTask(task)}
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
                        task.completed
                          ? "border-green-500 bg-green-500 text-white"
                          : "border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      {task.completed && <Check className="h-3 w-3" />}
                    </button>
                    <span
                      className={`flex-1 text-sm ${
                        task.completed ? "line-through text-gray-400" : "text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-gray-400">{formatDate(task.dueDate)}</span>
                    )}
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "notes" && (
        <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
          <Card className="h-fit">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Anotações</CardTitle>
                <button onClick={handleNewNote} className="text-blue-600 hover:text-blue-700">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {notes.length === 0 ? (
                <p className="text-xs text-gray-500">Nenhuma anotação</p>
              ) : (
                <ul className="space-y-1">
                  {notes.map((note) => (
                    <li key={note.id} className="flex items-center justify-between gap-1">
                      <button
                        onClick={() => {
                          setCurrentNoteId(note.id);
                          setNoteContent(note.content);
                        }}
                        className={`flex-1 truncate rounded p-1.5 text-left text-sm ${
                          currentNoteId === note.id
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        {note.content.slice(0, 30) || "Anotação vazia"}
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-gray-400 hover:text-red-500 flex-shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Escreva suas anotações aqui..."
                className="w-full h-96 resize-none rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
              <div className="mt-2 flex justify-end">
                <Button size="sm" onClick={handleSaveNote}>
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
