"use client";

import { Menu } from "lucide-react";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-900 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400"
      >
        <Menu className="h-6 w-6" />
      </button>

      <div className="hidden lg:block" />

      <div className="flex items-center gap-3">
        <NotificationPanel />
      </div>
    </header>
  );
}
