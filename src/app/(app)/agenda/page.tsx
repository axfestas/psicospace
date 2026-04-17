"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Task, Note } from "@/types";
import { formatDate } from "@/lib/utils";
import { Plus, Trash2, Check, X, ChevronLeft, ChevronRight, Edit2 } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  description?: string;
}

// ─── Task group colors ────────────────────────────────────────────────────────
const GROUP_COLORS = [
  { bg: "bg-blue-100 dark:bg-blue-900/30",   border: "border-blue-300 dark:border-blue-700",   badge: "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200",   dot: "bg-blue-500" },
  { bg: "bg-emerald-100 dark:bg-emerald-900/30", border: "border-emerald-300 dark:border-emerald-700", badge: "bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200", dot: "bg-emerald-500" },
  { bg: "bg-violet-100 dark:bg-violet-900/30",   border: "border-violet-300 dark:border-violet-700",   badge: "bg-violet-200 text-violet-800 dark:bg-violet-800 dark:text-violet-200",   dot: "bg-violet-500" },
  { bg: "bg-amber-100 dark:bg-amber-900/30",   border: "border-amber-300 dark:border-amber-700",   badge: "bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200",   dot: "bg-amber-500" },
  { bg: "bg-rose-100 dark:bg-rose-900/30",   border: "border-rose-300 dark:border-rose-700",   badge: "bg-rose-200 text-rose-800 dark:bg-rose-800 dark:text-rose-200",   dot: "bg-rose-500" },
  { bg: "bg-cyan-100 dark:bg-cyan-900/30",   border: "border-cyan-300 dark:border-cyan-700",   badge: "bg-cyan-200 text-cyan-800 dark:bg-cyan-800 dark:text-cyan-200",   dot: "bg-cyan-500" },
  { bg: "bg-orange-100 dark:bg-orange-900/30", border: "border-orange-300 dark:border-orange-700", badge: "bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200", dot: "bg-orange-500" },
  { bg: "bg-teal-100 dark:bg-teal-900/30",   border: "border-teal-300 dark:border-teal-700",   badge: "bg-teal-200 text-teal-800 dark:bg-teal-800 dark:text-teal-200",   dot: "bg-teal-500" },
];

function getGroupColor(groupName: string, allGroups: string[]) {
  const idx = allGroups.indexOf(groupName);
  return GROUP_COLORS[idx % GROUP_COLORS.length];
}

// ─── Schedule types ───────────────────────────────────────────────────────────
interface ScheduleSlot {
  day: string;
  time: string;
  subject: string;
  color: string;
}

const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const TIMES = Array.from({ length: 16 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`);

const SLOT_COLORS = [
  "#3B82F6", "#10B981", "#8B5CF6", "#F59E0B",
  "#EF4444", "#06B6D4", "#F97316", "#14B8A6",
];

export default function AgendaPage() {
  const [activeTab, setActiveTab] = useState<"calendar" | "tasks" | "notes" | "horarios">("calendar");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventForm, setShowEventForm] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskGroup, setNewTaskGroup] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [currentNoteId, setCurrentNoteId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskDueDate, setEditTaskDueDate] = useState("");
  const [editTaskGroup, setEditTaskGroup] = useState("");
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    startAt: "",
    endAt: "",
  });

  // ── Drag & drop state ────────────────────────────────────────────────────
  // Note: HTML5 drag-and-drop is mouse-only. A keyboard alternative (e.g. Ctrl+Arrow
  // or a "Move to group" menu) could be added in a future accessibility pass.
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);

  // ── Group editing state ──────────────────────────────────────────────────
  const [editingGroupName, setEditingGroupName] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");

  // Schedule state (localStorage)
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [editingSlot, setEditingSlot] = useState<{ day: string; time: string } | null>(null);
  const [slotSubject, setSlotSubject] = useState("");
  const [slotColor, setSlotColor] = useState(SLOT_COLORS[0]);

  // Load schedule from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem("psicospace_schedule");
      if (raw) setScheduleSlots(JSON.parse(raw));
    } catch {}
  }, []);

  const saveSchedule = (slots: ScheduleSlot[]) => {
    setScheduleSlots(slots);
    localStorage.setItem("psicospace_schedule", JSON.stringify(slots));
  };

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
      body: JSON.stringify({
        title: newTask,
        dueDate: newTaskDueDate || null,
        group: newTaskGroup.trim() || null,
      }),
    });
    if (res.ok) {
      setNewTask("");
      setNewTaskDueDate("");
      setNewTaskGroup("");
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
    if (editingTaskId === id) {
      setEditingTaskId(null);
      setEditTaskTitle("");
      setEditTaskDueDate("");
      setEditTaskGroup("");
    }
    loadData();
  };

  const formatDateForInput = (value?: string) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleStartEditTask = (task: Task) => {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskDueDate(formatDateForInput(task.dueDate));
    setEditTaskGroup(task.group || "");
  };

  const handleSaveEditTask = async () => {
    if (!editingTaskId || !editTaskTitle.trim()) return;
    await fetch(`/api/tasks/${editingTaskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: editTaskTitle,
        dueDate: editTaskDueDate || null,
        group: editTaskGroup.trim() || null,
      }),
    });
    setEditingTaskId(null);
    setEditTaskTitle("");
    setEditTaskDueDate("");
    setEditTaskGroup("");
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

  // ── Schedule helpers ──────────────────────────────────────────────────────
  const getSlot = (day: string, time: string) =>
    scheduleSlots.find((s) => s.day === day && s.time === time);

  const handleOpenSlot = (day: string, time: string) => {
    const existing = getSlot(day, time);
    setEditingSlot({ day, time });
    setSlotSubject(existing?.subject || "");
    setSlotColor(existing?.color || SLOT_COLORS[0]);
  };

  const handleSaveSlot = () => {
    if (!editingSlot) return;
    const { day, time } = editingSlot;
    const newSlots = scheduleSlots.filter((s) => !(s.day === day && s.time === time));
    if (slotSubject.trim()) {
      newSlots.push({ day, time, subject: slotSubject.trim(), color: slotColor });
    }
    saveSchedule(newSlots);
    setEditingSlot(null);
    setSlotSubject("");
  };

  const handleClearSlot = (day: string, time: string) => {
    saveSchedule(scheduleSlots.filter((s) => !(s.day === day && s.time === time)));
  };

  // ── Task grouping helpers ─────────────────────────────────────────────────
  const allGroups = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.group).filter(Boolean) as string[])).sort(),
    [tasks]
  );
  const ungroupedTasks = useMemo(() => tasks.filter((t) => !t.group), [tasks]);

  // ── Drag & drop handlers ─────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, taskId: string) => {
    e.dataTransfer.effectAllowed = "move";
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverGroup(null);
  };

  const handleDragOverGroup = (e: React.DragEvent<HTMLDivElement>, targetGroup: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverGroup(targetGroup);
  };

  const handleDropOnGroup = async (e: React.DragEvent<HTMLDivElement>, targetGroup: string | null) => {
    e.preventDefault();
    if (!draggedTaskId) return;
    setDraggedTaskId(null);
    setDragOverGroup(null);
    const task = tasks.find((t) => t.id === draggedTaskId);
    if (!task) return;
    const sameGroup = (task.group ?? null) === targetGroup;
    if (sameGroup) return;
    await fetch(`/api/tasks/${draggedTaskId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ group: targetGroup }),
    });
    loadData();
  };

  // ── Group rename handlers ─────────────────────────────────────────────────
  const handleStartEditGroup = (groupName: string) => {
    setEditingGroupName(groupName);
    setNewGroupName(groupName);
  };

  const handleSaveEditGroup = async () => {
    if (!editingGroupName) return;
    const trimmed = newGroupName.trim();
    if (!trimmed || trimmed === editingGroupName) {
      setEditingGroupName(null);
      setNewGroupName("");
      return;
    }
    const affected = tasks.filter((t) => t.group === editingGroupName);
    await Promise.all(
      affected.map((t) =>
        fetch(`/api/tasks/${t.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ group: trimmed }),
        })
      )
    );
    setEditingGroupName(null);
    setNewGroupName("");
    loadData();
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  const renderTaskItem = (task: Task) => (
    <li
      key={task.id}
      draggable
      onDragStart={(e) => handleDragStart(e, task.id)}
      onDragEnd={handleDragEnd}
      className={`flex items-center gap-3 rounded-lg border p-3 transition-opacity bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 ${
        draggedTaskId === task.id ? "opacity-40" : "opacity-100"
      }`}
    >
      {editingTaskId === task.id ? (
        <>
          <Input value={editTaskTitle} onChange={(e) => setEditTaskTitle(e.target.value)} className="flex-1" />
          <Input type="date" value={editTaskDueDate} onChange={(e) => setEditTaskDueDate(e.target.value)} className="w-36" />
          <Input
            placeholder="Grupo"
            value={editTaskGroup}
            onChange={(e) => setEditTaskGroup(e.target.value)}
            className="w-28"
            list="groups-list"
          />
          <datalist id="groups-list">
            {allGroups.map((g) => <option key={g} value={g} />)}
          </datalist>
          <button onClick={handleSaveEditTask} type="button" className="text-green-600 hover:text-green-700">
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setEditingTaskId(null); setEditTaskTitle(""); setEditTaskDueDate(""); setEditTaskGroup(""); }}
            type="button"
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => handleToggleTask(task)}
            type="button"
            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors ${
              task.completed ? "border-green-500 bg-green-500 text-white" : "border-gray-300 dark:border-gray-600"
            }`}
          >
            {task.completed && <Check className="h-3 w-3" />}
          </button>
          <span className={`flex-1 text-sm ${task.completed ? "line-through text-gray-400" : "text-gray-900 dark:text-gray-100"}`}>
            {task.title}
          </span>
          {task.dueDate && <span className="text-xs text-gray-400">{formatDate(task.dueDate)}</span>}
          <button onClick={() => handleStartEditTask(task)} type="button" className="text-gray-400 hover:text-blue-600">
            <Edit2 className="h-4 w-4" />
          </button>
          <button onClick={() => handleDeleteTask(task.id)} type="button" className="text-gray-400 hover:text-red-500">
            <X className="h-4 w-4" />
          </button>
        </>
      )}
    </li>
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2 flex-wrap">
        {(["calendar", "tasks", "horarios", "notes"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-t text-sm font-medium transition-colors ${
              activeTab === tab
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
            }`}
          >
            {tab === "calendar" ? "Calendário" : tab === "tasks" ? "Tarefas" : tab === "horarios" ? "Grade de Horário" : "Anotações"}
          </button>
        ))}
      </div>

      {/* ── CALENDAR ── */}
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
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">{monthName}</h2>
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
                  <Input placeholder="Título do evento" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} required />
                  <Input placeholder="Descrição (opcional)" value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Início</label>
                      <Input type="datetime-local" value={eventForm.startAt} onChange={(e) => setEventForm({ ...eventForm, startAt: e.target.value })} required />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Fim</label>
                      <Input type="datetime-local" value={eventForm.endAt} onChange={(e) => setEventForm({ ...eventForm, endAt: e.target.value })} required />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm">Salvar</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowEventForm(false)}>Cancelar</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="p-2">
              <div className="grid grid-cols-7 gap-1">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                  <div key={d} className="p-2 text-center text-xs font-semibold text-gray-500">{d}</div>
                ))}
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayEvents = getEventsForDay(day);
                  const isToday =
                    new Date().getDate() === day &&
                    new Date().getMonth() === currentDate.getMonth() &&
                    new Date().getFullYear() === currentDate.getFullYear();
                  return (
                    <div key={day} className={`min-h-[60px] rounded-lg p-1 ${isToday ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                      <span className={`block text-center text-sm font-medium mb-1 ${isToday ? "rounded-full bg-blue-600 text-white w-6 h-6 flex items-center justify-center mx-auto" : "text-gray-700 dark:text-gray-300"}`}>
                        {day}
                      </span>
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div key={ev.id} className="truncate rounded bg-blue-100 px-1 py-0.5 text-xs text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 mb-0.5" title={ev.title}>
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && <span className="text-xs text-gray-400">+{dayEvents.length - 2}</span>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Próximos eventos</CardTitle></CardHeader>
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
                        <button onClick={() => handleDeleteEvent(event.id)} className="text-gray-400 hover:text-red-500">
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

      {/* ── TASKS ── */}
      {activeTab === "tasks" && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Nova Tarefa</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleAddTask} className="flex flex-wrap gap-2">
                <Input
                  placeholder="Título da tarefa..."
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  className="flex-1 min-w-[160px]"
                />
                <Input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-40"
                />
                <Input
                  placeholder="Grupo (ex: Neurociência)"
                  value={newTaskGroup}
                  onChange={(e) => setNewTaskGroup(e.target.value)}
                  className="w-44"
                  list="new-groups-list"
                />
                <datalist id="new-groups-list">
                  {allGroups.map((g) => <option key={g} value={g} />)}
                </datalist>
                <Button type="submit" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </form>
              {allGroups.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {allGroups.map((g) => {
                    const c = getGroupColor(g, allGroups);
                    return (
                      <span key={g} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${c.badge}`}>
                        <span className={`inline-block w-1.5 h-1.5 rounded-full ${c.dot}`} />
                        {g}
                      </span>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {tasks.length === 0 ? (
            <p className="text-sm text-gray-500">Nenhuma tarefa cadastrada.</p>
          ) : (
            <>
              {/* Grouped tasks */}
              {allGroups.map((group) => {
                const groupColor = getGroupColor(group, allGroups);
                const groupTasks = tasks.filter((t) => t.group === group);
                const isDropTarget = dragOverGroup === group && draggedTaskId !== null;
                return (
                  <div
                    key={group}
                    className={`rounded-xl border p-4 transition-colors ${groupColor.bg} ${groupColor.border} ${isDropTarget ? "ring-2 ring-blue-400 dark:ring-blue-500" : ""}`}
                    onDragOver={(e) => handleDragOverGroup(e, group)}
                    onDragLeave={() => setDragOverGroup(null)}
                    onDrop={(e) => handleDropOnGroup(e, group)}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${groupColor.dot}`} />
                      {editingGroupName === group ? (
                        <>
                          <Input
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEditGroup();
                              if (e.key === "Escape") { setEditingGroupName(null); setNewGroupName(""); }
                            }}
                            className="h-6 text-xs w-36 py-0 px-1.5"
                            autoFocus
                          />
                          <button onClick={handleSaveEditGroup} type="button" className="text-green-600 hover:text-green-700"><Check className="h-3.5 w-3.5" /></button>
                          <button onClick={() => { setEditingGroupName(null); setNewGroupName(""); }} type="button" className="text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>
                        </>
                      ) : (
                        <>
                          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">{group}</h3>
                          <button
                            onClick={() => handleStartEditGroup(group)}
                            type="button"
                            className="text-gray-400 hover:text-blue-600"
                            title="Renomear grupo"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                      <span className={`ml-auto rounded-full px-2 py-0.5 text-xs font-medium ${groupColor.badge}`}>
                        {groupTasks.filter((t) => !t.completed).length} pendente(s)
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {groupTasks.map((task) => renderTaskItem(task))}
                      {isDropTarget && (
                        <li className="rounded-lg border-2 border-dashed border-blue-400 dark:border-blue-500 p-3 text-center text-xs text-blue-500 dark:text-blue-400 select-none">
                          Soltar aqui
                        </li>
                      )}
                    </ul>
                  </div>
                );
              })}

              {/* Ungrouped tasks */}
              {(ungroupedTasks.length > 0 || (draggedTaskId !== null && dragOverGroup === "")) && (
                <div
                  className={`rounded-xl border border-gray-200 dark:border-gray-700 p-4 transition-colors ${dragOverGroup === "" ? "ring-2 ring-blue-400 dark:ring-blue-500" : ""}`}
                  onDragOver={(e) => handleDragOverGroup(e, "")}
                  onDragLeave={() => setDragOverGroup(null)}
                  onDrop={(e) => handleDropOnGroup(e, null)}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">Sem grupo</h3>
                  </div>
                  <ul className="space-y-2">
                    {ungroupedTasks.map((task) => renderTaskItem(task))}
                    {dragOverGroup === "" && draggedTaskId !== null && (
                      <li className="rounded-lg border-2 border-dashed border-blue-400 dark:border-blue-500 p-3 text-center text-xs text-blue-500 dark:text-blue-400 select-none">
                        Soltar aqui
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── GRADE DE HORÁRIO ── */}
      {activeTab === "horarios" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Grade de Horário</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Clique em qualquer horário para adicionar uma disciplina</p>
            </div>
            {scheduleSlots.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => saveSchedule([])}>
                <Trash2 className="h-4 w-4 mr-1" /> Limpar grade
              </Button>
            )}
          </div>

          {/* Slot edit modal */}
          {editingSlot && (
            <Card className="border-blue-300 dark:border-blue-700">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {editingSlot.day} — {editingSlot.time}
                </p>
                <div className="flex flex-wrap gap-2 items-end">
                  <Input
                    placeholder="Nome da disciplina..."
                    value={slotSubject}
                    onChange={(e) => setSlotSubject(e.target.value)}
                    className="flex-1 min-w-[180px]"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && handleSaveSlot()}
                  />
                  <div className="flex gap-1">
                    {SLOT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSlotColor(c)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${slotColor === c ? "scale-125 border-gray-800 dark:border-white" : "border-transparent"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <Button size="sm" onClick={handleSaveSlot}><Check className="h-4 w-4" /></Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingSlot(null)}><X className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grid */}
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <th className="w-16 px-2 py-3 text-left text-gray-500 font-semibold border-r border-gray-200 dark:border-gray-700">Horário</th>
                  {DAYS.map((d) => (
                    <th key={d} className="px-2 py-3 text-center text-gray-700 dark:text-gray-300 font-semibold border-r border-gray-200 dark:border-gray-700 last:border-r-0 min-w-[100px]">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIMES.map((time, ti) => (
                  <tr key={time} className={ti % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50/50 dark:bg-gray-800/50"}>
                    <td className="px-2 py-1.5 text-gray-400 font-mono border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                      {time}
                    </td>
                    {DAYS.map((day) => {
                      const slot = getSlot(day, time);
                      return (
                        <td key={day} className="px-1 py-1 border-r border-gray-100 dark:border-gray-800 last:border-r-0 h-9">
                          {slot ? (
                            <div
                              className="group relative flex items-center gap-1 rounded px-2 py-1 cursor-pointer"
                              style={{ backgroundColor: slot.color + "33", borderLeft: `3px solid ${slot.color}` }}
                              onClick={() => handleOpenSlot(day, time)}
                            >
                              <span className="flex-1 truncate font-medium" style={{ color: slot.color }}>
                                {slot.subject}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleClearSlot(day, time); }}
                                className="hidden group-hover:flex items-center text-gray-400 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenSlot(day, time)}
                              className="w-full h-full rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                              title={`Adicionar disciplina: ${day} ${time}`}
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          {scheduleSlots.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Array.from(
                scheduleSlots.reduce((map, s) => {
                  if (!map.has(s.subject)) map.set(s.subject, s.color);
                  return map;
                }, new Map<string, string>()).entries()
              ).map(([subject, color]) => (
                <span
                  key={subject}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                  style={{ backgroundColor: color + "22", color, border: `1px solid ${color}55` }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                  {subject}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── NOTES ── */}
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
                        onClick={() => { setCurrentNoteId(note.id); setNoteContent(note.content); }}
                        className={`flex-1 truncate rounded p-1.5 text-left text-sm ${
                          currentNoteId === note.id ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        }`}
                      >
                        {note.content.slice(0, 30) || "Anotação vazia"}
                      </button>
                      <button onClick={() => handleDeleteNote(note.id)} className="text-gray-400 hover:text-red-500 flex-shrink-0">
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
                <Button size="sm" onClick={handleSaveNote}>Salvar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
