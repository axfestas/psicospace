"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight } from "lucide-react";

const sections = [
  {
    title: "Formatação Geral",
    content: [
      { label: "Papel", value: "A4 (21 x 29,7 cm)" },
      { label: "Margens", value: "Superior e esquerda: 3 cm | Inferior e direita: 2 cm" },
      { label: "Fonte", value: "Times New Roman ou Arial, tamanho 12" },
      { label: "Espaçamento", value: "1,5 entre linhas no texto; simples nas citações longas, notas e referências" },
      { label: "Recuo de parágrafo", value: "1,25 cm da margem esquerda" },
      { label: "Alinhamento", value: "Justificado" },
    ],
  },
  {
    title: "Capa (NBR 14724)",
    content: [
      { label: "Elementos obrigatórios", value: "Nome da instituição, autor, título, subtítulo, local, ano" },
      { label: "Posicionamento", value: "Centralizados" },
      { label: "Fonte do título", value: "Negrito, tamanho 14 (recomendado)" },
    ],
  },
  {
    title: "Folha de Rosto",
    content: [
      { label: "Elementos", value: "Autor, título, natureza do trabalho, orientador, local, ano" },
      { label: "Natureza do trabalho", value: "Recuo de 8 cm a partir da margem esquerda, espaçamento simples, fonte menor (10 ou 11)" },
    ],
  },
  {
    title: "Resumo e Abstract (NBR 6028)",
    content: [
      { label: "Número de palavras", value: "Trabalhos acadêmicos: 150 a 500 palavras" },
      { label: "Parágrafo único", value: "Sem recuo, espaçamento simples" },
      { label: "Palavras-chave", value: "3 a 5 termos, separados por ponto-e-vírgula, logo abaixo do resumo" },
      { label: "Abstract", value: "Versão em inglês do resumo, obrigatório para dissertações e teses" },
    ],
  },
  {
    title: "Sumário (NBR 6027)",
    content: [
      { label: "Posição", value: "Último elemento pré-textual" },
      { label: "Alinhamento", value: "Títulos alinhados à esquerda, indicativos numéricos alinhados à direita com travessões" },
      { label: "Formatação", value: "Mesma tipografia e tamanho do texto" },
    ],
  },
  {
    title: "Citações (NBR 10520)",
    content: [
      { label: "Citação direta curta (até 3 linhas)", value: "Entre aspas duplas, no corpo do texto. Ex: \"texto\" (AUTOR, ano, p. X)" },
      { label: "Citação direta longa (mais de 3 linhas)", value: "Recuo de 4 cm, sem aspas, fonte menor (10), espaçamento simples" },
      { label: "Citação indireta (paráfrase)", value: "Sem aspas. Ex: (AUTOR, ano) ou Autor (ano)" },
      { label: "Apud", value: "Citação de citação. Ex: (FREUD apud LACAN, 1957)" },
    ],
  },
  {
    title: "Referências (NBR 6023)",
    content: [
      { label: "Livro", value: "SOBRENOME, Nome. Título: subtítulo. Edição. Local: Editora, ano." },
      { label: "Artigo em periódico", value: "SOBRENOME, Nome. Título do artigo. Nome do Periódico, Local, v. X, n. X, p. X-X, mês. ano." },
      { label: "Site/internet", value: "SOBRENOME, Nome. Título. Disponível em: <URL>. Acesso em: dia mês. ano." },
      { label: "Capítulo de livro", value: "SOBRENOME, Nome. Título do capítulo. In: SOBRENOME, Nome (org.). Título do livro. Local: Editora, ano. p. X-X." },
      { label: "Dissertação/Tese", value: "SOBRENOME, Nome. Título. Ano. Nº f. Dissertação/Tese (Mestrado/Doutorado em ...) — Instituição, Local, ano." },
    ],
  },
  {
    title: "Estrutura do TCC",
    content: [
      { label: "Elementos pré-textuais", value: "Capa*, Folha de rosto*, Errata, Folha de aprovação*, Dedicatória, Agradecimentos, Epígrafe, Resumo*, Abstract*, Lista de ilustrações, Lista de tabelas, Lista de abreviaturas, Sumário*" },
      { label: "Elementos textuais", value: "Introdução*, Desenvolvimento*, Conclusão*" },
      { label: "Elementos pós-textuais", value: "Referências*, Glossário, Apêndice, Anexo, Índice" },
      { label: "Numeração de páginas", value: "A partir da introdução, em algarismos arábicos, no canto superior direito" },
    ],
  },
  {
    title: "Tabelas e Figuras (NBR 14724)",
    content: [
      { label: "Título de tabela", value: "Acima da tabela. Ex: Tabela 1 – Descrição" },
      { label: "Título de figura", value: "Abaixo da figura. Ex: Figura 1 – Descrição" },
      { label: "Fonte", value: "Logo após o título, indicando a origem dos dados" },
      { label: "Formatação de tabela", value: "Sem linhas verticais nas laterais; bordas horizontais nas partes superior, inferior e abaixo do cabeçalho" },
    ],
  },
];

export default function ABNTPage() {
  const [search, setSearch] = useState("");
  const [openSection, setOpenSection] = useState<string | null>(sections[0].title);

  const filteredSections = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sections;
    return sections
      .map((section) => ({
        ...section,
        content: section.content.filter((item) =>
          `${item.label} ${item.value}`.toLowerCase().includes(term)
        ),
      }))
      .filter(
        (section) =>
          section.title.toLowerCase().includes(term) || section.content.length > 0
      );
  }, [search]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Guia de Normas ABNT</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Referência completa para formatação de trabalhos acadêmicos em Psicologia
        </p>
      </div>

      <Input
        placeholder="Buscar norma, termo ou exemplo..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 dark:bg-blue-900/20 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Ψ Dica:</strong> As normas ABNT são atualizadas periodicamente. Sempre verifique a versão mais recente junto à sua instituição.
          As principais normas são: NBR 14724 (trabalhos acadêmicos), NBR 6023 (referências), NBR 10520 (citações) e NBR 6028 (resumos).
        </p>
      </div>

      <div className="space-y-3">
        {filteredSections.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-sm text-gray-500">Nenhum resultado para a busca.</CardContent>
          </Card>
        ) : (
          filteredSections.map((section) => {
            const isOpen = openSection === section.title;
            return (
              <Card key={section.title} className="overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenSection(isOpen ? null : section.title)}
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <CardTitle className="text-base">{section.title}</CardTitle>
                  {isOpen ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                </button>
                {isOpen && (
                  <CardContent className="pt-0 pb-4">
                    <dl className="space-y-3">
                      {section.content.map((item) => (
                        <div key={item.label}>
                          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{item.label}</dt>
                          <dd className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
