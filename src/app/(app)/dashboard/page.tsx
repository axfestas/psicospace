"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { formatDate } from "@/lib/utils";
import { Calendar, CheckSquare, BookOpen, FileText } from "lucide-react";
import Link from "next/link";

interface DashboardData {
  eventsToday: { id: string; title: string; startAt: string; endAt: string }[];
  pendingTasks: number;
  totalTasks: number;
  recentDocuments: { id: string; title: string; updatedAt: string }[];
  periods: {
    id: string;
    name: string;
    disciplines: {
      id: string;
      name: string;
      materials: { progress: { status: string }[] }[];
    }[];
  }[];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    eventsToday: [],
    pendingTasks: 0,
    totalTasks: 0,
    recentDocuments: [],
    periods: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, tasksRes, docsRes, periodsRes] = await Promise.all([
          fetch("/api/events"),
          fetch("/api/tasks"),
          fetch("/api/documents"),
          fetch("/api/periods"),
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const eventsData = eventsRes.ok ? await eventsRes.json() : { events: [] };
        const tasksData = tasksRes.ok ? await tasksRes.json() : { tasks: [] };
        const docsData = docsRes.ok ? await docsRes.json() : { documents: [] };
        const periodsData = periodsRes.ok ? await periodsRes.json() : { periods: [] };

        const eventsToday = (eventsData.events || []).filter((e: { startAt: string }) => {
          const start = new Date(e.startAt);
          return start >= today && start < tomorrow;
        });

        const tasks = tasksData.tasks || [];
        const pendingTasks = tasks.filter((t: { completed: boolean }) => !t.completed).length;

        setData({
          eventsToday,
          pendingTasks,
          totalTasks: tasks.length,
          recentDocuments: (docsData.documents || []).slice(0, 5),
          periods: periodsData.periods || [],
        });
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getProgressForPeriod = (period: DashboardData["periods"][0]) => {
    let total = 0;
    let completed = 0;
    period.disciplines.forEach((disc) => {
      disc.materials.forEach((mat) => {
        total++;
        if (mat.progress?.[0]?.status === "COMPLETED") completed++;
      });
    });
    return total > 0 ? (completed / total) * 100 : 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto" />
          <p className="mt-2 text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {greeting}, {user?.name?.split(" ")[0]}! 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.eventsToday.length}
                </p>
                <p className="text-sm text-gray-500">Eventos hoje</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-orange-100 p-3 dark:bg-orange-900/30">
                <CheckSquare className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.pendingTasks}
                </p>
                <p className="text-sm text-gray-500">Tarefas pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
                <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.periods.length}
                </p>
                <p className="text-sm text-gray-500">Períodos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
                <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {data.recentDocuments.length}
                </p>
                <p className="text-sm text-gray-500">Documentos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Eventos de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            {data.eventsToday.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum evento para hoje.</p>
            ) : (
              <ul className="space-y-2">
                {data.eventsToday.map((event) => (
                  <li key={event.id} className="flex items-start gap-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                    <div className="h-2 w-2 mt-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{event.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(event.startAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        {" - "}
                        {new Date(event.endAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/agenda" className="mt-3 block text-sm text-blue-600 hover:underline dark:text-blue-400">
              Ver agenda completa →
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documentos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentDocuments.length === 0 ? (
              <p className="text-sm text-gray-500">Nenhum documento criado ainda.</p>
            ) : (
              <ul className="space-y-2">
                {data.recentDocuments.map((doc) => (
                  <li key={doc.id}>
                    <Link
                      href={`/editor?id=${doc.id}`}
                      className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                          {doc.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(doc.updatedAt)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/editor" className="mt-3 block text-sm text-blue-600 hover:underline dark:text-blue-400">
              Ver todos os documentos →
            </Link>
          </CardContent>
        </Card>
      </div>

      {data.periods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Progresso por Período</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.periods.map((period) => {
                const progress = getProgressForPeriod(period);
                const totalMaterials = period.disciplines.reduce(
                  (acc, d) => acc + d.materials.length,
                  0
                );
                return (
                  <div key={period.id}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        {period.name}
                      </span>
                      <span className="text-gray-500">
                        {totalMaterials} materiais
                      </span>
                    </div>
                    <ProgressBar value={progress} showLabel />
                  </div>
                );
              })}
            </div>
            <Link href="/materiais" className="mt-4 block text-sm text-blue-600 hover:underline dark:text-blue-400">
              Ver materiais →
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
