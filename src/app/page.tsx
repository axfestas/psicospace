import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <header className="border-b border-gray-200/50 bg-white/80 backdrop-blur dark:border-gray-700/50 dark:bg-gray-900/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-blue-600">Ψ</span>
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">PsicoSpace</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
              Entrar
            </Link>
            <Link href="/register" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
              Cadastrar-se
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-4 py-24 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            <span className="text-lg">Ψ</span>
            <span>Plataforma acadêmica para estudantes de Psicologia</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-6xl">
            Organize sua jornada
            <span className="block text-blue-600"> acadêmica</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            Organize sua vida acadêmica em Psicologia em um só lugar — agenda, materiais, escrita e normas ABNT, sem complicação.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="rounded-xl bg-blue-600 px-8 py-4 text-base font-semibold text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-none">
              Começar agora →
            </Link>
            <Link href="/login" className="rounded-xl border border-gray-300 px-8 py-4 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
              Já tenho conta
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-gray-100 mb-12">
            Tudo que você precisa em um só lugar
          </h2>
          <div className="grid gap-8 sm:grid-cols-2">
            {[
              { icon: "📅", title: "Agenda Inteligente", desc: "Calendário mensal com eventos, tarefas com checklist e área de anotações livres." },
              { icon: "📚", title: "Gestão de Materiais", desc: "Organize materiais por período e disciplina. Acompanhe seu progresso de estudo." },
              { icon: "🧪", title: "PsicoLab", desc: "Laboratório virtual interativo: cérebro 3D, Caixa de Skinner e abordagens psicológicas." },
              { icon: "✍️", title: "Editor Rico", desc: "Editor de texto completo com formatação, listas, títulos e exportação para PDF." },
              { icon: "📖", title: "Guia ABNT", desc: "Referência completa das normas ABNT para trabalhos acadêmicos de Psicologia." },
            ].map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow dark:border-gray-700 dark:bg-gray-800">
                <span className="text-4xl mb-4 block">{feature.icon}</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-700 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <p><span className="text-blue-600 font-semibold">Ψ PsicoSpace</span> — Plataforma acadêmica para estudantes de Psicologia</p>
      </footer>
    </div>
  );
}
