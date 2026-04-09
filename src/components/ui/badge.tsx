"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  className?: string;
}

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    danger: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function UserRoleBadge({ role }: { role: string }) {
  const config: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    ESTUDANTE: { label: "Estudante", variant: "info" },
    DOCENTE: { label: "Docente", variant: "success" },
    ADMIN: { label: "Administrador", variant: "warning" },
    SUPERADMIN: { label: "Super Admin", variant: "danger" },
  };

  const { label, variant } = config[role] || { label: role, variant: "default" };

  return <Badge variant={variant}>{label}</Badge>;
}
