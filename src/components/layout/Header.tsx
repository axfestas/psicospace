"use client";

import { Menu, Coins } from "lucide-react";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { useState, useEffect } from "react";

function PsiqueBadge() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/psicogame/wallet")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.wallet?.balance !== undefined) setBalance(d.wallet.balance);
      })
      .catch(() => {});
  }, []);

  if (balance === null) return null;

  return (
    <a
      href="/psicogame"
      className="flex items-center gap-1.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-full px-3 py-1 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
      title="Minha carteira – Psiquê"
    >
      <Coins className="h-4 w-4 text-yellow-500" />
      <span className="text-sm font-bold text-yellow-700 dark:text-yellow-300">
        {balance} Psiquê
      </span>
    </a>
  );
}

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
        <PsiqueBadge />
        <NotificationPanel />
      </div>
    </header>
  );
}
