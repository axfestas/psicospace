"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Calendar,
  BookOpen,
  FileText,
  BookMarked,
  Users,
  Database,
  Settings,
  UserCircle,
  X,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/materiais", label: "Materiais", icon: BookOpen },
  { href: "/editor", label: "Editor", icon: FileText },
  { href: "/abnt", label: "Normas ABNT", icon: BookMarked },
];

const bottomNavItems = [
  { href: "/perfil", label: "Meu Perfil", icon: UserCircle },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";
  const isSuperAdmin = user?.role === "SUPERADMIN";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-white shadow-lg transition-transform duration-300 dark:bg-gray-900 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 dark:border-gray-700">
          <Link href="/dashboard" className="flex items-center gap-2" onClick={onClose}>
            <span className="text-2xl font-bold text-blue-600">Ψ</span>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
              PsicoSpace
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
            {isAdmin && (
              <li>
                <Link
                  href="/admin"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname.startsWith("/admin") && !pathname.startsWith("/admin/migrations")
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  )}
                >
                  <Users className="h-5 w-5 flex-shrink-0" />
                  Administração
                </Link>
              </li>
            )}
            {isSuperAdmin && (
              <li>
                <Link
                  href="/admin/migrations"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    pathname.startsWith("/admin/migrations")
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  )}
                >
                  <Database className="h-5 w-5 flex-shrink-0" />
                  Migrações DB
                </Link>
              </li>
            )}
          </ul>

          <div className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-3 px-3">
            <ul className="space-y-1">
              {bottomNavItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        active
                          ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        <div className="border-t border-gray-200 p-4 dark:border-gray-700">
          <div className="mb-3 flex items-center gap-3">
            <div className="h-9 w-9 flex-shrink-0 rounded-full overflow-hidden ring-2 ring-gray-200 dark:ring-gray-700">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-blue-600 text-white text-sm font-bold">
                  {user?.name
                    ? user.name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
                    : "?"}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                {user?.name}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            Sair
          </button>
        </div>
      </aside>
    </>
  );
}
