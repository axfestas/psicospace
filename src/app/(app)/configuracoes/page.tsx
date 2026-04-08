"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Moon, Palette } from "lucide-react";

export default function ConfiguracoesPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Configurações</h1>
        <p className="text-gray-500 dark:text-gray-400">Personalize sua experiência no PsicoSpace</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" />
            Aparência
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Tema</p>
            <div className="flex gap-3">
              {/* Light mode option */}
              <button
                onClick={() => theme === "dark" && toggleTheme()}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors w-32 ${
                  theme === "light"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                  <Sun className="h-6 w-6 text-amber-500" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Claro</span>
                {theme === "light" && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Ativo</span>
                )}
              </button>

              {/* Dark mode option */}
              <button
                onClick={() => theme === "light" && toggleTheme()}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors w-32 ${
                  theme === "dark"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-800">
                  <Moon className="h-6 w-6 text-indigo-300" />
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Escuro</span>
                {theme === "dark" && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Ativo</span>
                )}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
