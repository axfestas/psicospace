"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Bell, X, Check, CheckCheck, Info, AlertTriangle, CheckCircle, AlertCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

const typeConfig: Record<string, { icon: typeof Info; iconClass: string; bgClass: string }> = {
  info: { icon: Info, iconClass: "text-blue-500", bgClass: "bg-blue-50 dark:bg-blue-900/20" },
  success: { icon: CheckCircle, iconClass: "text-green-500", bgClass: "bg-green-50 dark:bg-green-900/20" },
  warning: { icon: AlertTriangle, iconClass: "text-amber-500", bgClass: "bg-amber-50 dark:bg-amber-900/20" },
  error: { icon: AlertCircle, iconClass: "text-red-500", bgClass: "bg-red-50 dark:bg-red-900/20" },
};

export function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 60 seconds
    const interval = setInterval(fetchNotifications, 60_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    const deleted = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (deleted && !deleted.read) setUnreadCount((c) => Math.max(0, c - 1));
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
        title="Notificações"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-96 max-w-[calc(100vw-1rem)] rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Notificações
              </h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  {unreadCount} novas
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={loading}
                  className="flex items-center gap-1 rounded px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  title="Marcar todas como lidas"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Todas lidas
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div className="max-h-[28rem] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nenhuma notificação
                </p>
              </div>
            ) : (
              <ul>
                {notifications.map((notification) => {
                  const config = typeConfig[notification.type] || typeConfig.info;
                  const Icon = config.icon;
                  return (
                    <li
                      key={notification.id}
                      onClick={() => !notification.read && handleMarkRead(notification.id)}
                      className={`group relative flex gap-3 border-b border-gray-100 p-4 transition-colors dark:border-gray-700 ${
                        notification.read
                          ? "cursor-default"
                          : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750"
                      }`}
                    >
                      {/* Unread indicator */}
                      {!notification.read && (
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-r" />
                      )}

                      {/* Icon */}
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${config.bgClass}`}>
                        <Icon className={`h-4 w-4 ${config.iconClass}`} />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium ${notification.read ? "text-gray-600 dark:text-gray-400" : "text-gray-900 dark:text-gray-100"}`}>
                          {notification.title}
                        </p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 whitespace-pre-line line-clamp-3">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          {formatDate(notification.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-shrink-0 items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.read && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleMarkRead(notification.id); }}
                            className="rounded p-1 text-gray-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30"
                            title="Marcar como lida"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDelete(notification.id, e)}
                          className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30"
                          title="Excluir"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5 dark:border-gray-700">
              <p className="text-center text-xs text-gray-400 dark:text-gray-500">
                {notifications.length} notificação{notifications.length !== 1 ? "ões" : ""}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
