"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckSquare } from "lucide-react";
import Link from "next/link";

interface DashboardData {
  eventsToday: { id: string; title: string; startAt: string; endAt: string }[];
  pendingTasks: number;
  totalTasks: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    eventsToday: [],
    pendingTasks: 0,
    totalTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, tasksRes] = await Promise.all([
          fetch("/api/events"),
          fetch("/api/tasks"),
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const eventsData = eventsRes.ok ? await eventsRes.json() : { events: [] };
        const tasksData = tasksRes.ok ? await tasksRes.json() : { tasks: [] };

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
        });
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const firstName = user?.name?.split(" ")[0] || "";
  const greetingName = firstName ? `, ${firstName}` : "";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {greeting}{greetingName}! 👋
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
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
      </div>

      <div className="grid gap-6 lg:grid-cols-1">
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
      </div>
    </div>
  );
}


