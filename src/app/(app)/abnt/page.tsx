import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Guia de Normas ABNT
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Referência completa para formatação de trabalhos acadêmicos em Psicologia
        </p>
      </div>

      <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 dark:bg-blue-900/20 dark:border-blue-800">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Ψ Dica:</strong> As normas ABNT são atualizadas periodicamente. Sempre verifique a versão mais recente junto à sua instituição.
          As principais normas são: NBR 14724 (trabalhos acadêmicos), NBR 6023 (referências), NBR 10520 (citações) e NBR 6028 (resumos).
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title}>
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3">
                {section.content.map((item) => (
                  <div key={item.label}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {item.label}
                    </dt>
                    <dd className="mt-0.5 text-sm text-gray-700 dark:text-gray-300">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exemplos de Referências por Tipo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Livro</h3>
            <div className="rounded bg-gray-50 dark:bg-gray-800 p-3 text-sm font-mono text-gray-700 dark:text-gray-300">
              FREUD, Sigmund. A interpretação dos sonhos. Tradução de Walderedo Ismael de Oliveira. Rio de Janeiro: Imago, 1999.
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Artigo Científico</h3>
            <div className="rounded bg-gray-50 dark:bg-gray-800 p-3 text-sm font-mono text-gray-700 dark:text-gray-300">
              SANTOS, Maria Clara. Psicoterapia cognitivo-comportamental no tratamento da ansiedade. Revista Brasileira de Psicologia, São Paulo, v. 10, n. 2, p. 45-62, jul./dez. 2023.
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Site</h3>
            <div className="rounded bg-gray-50 dark:bg-gray-800 p-3 text-sm font-mono text-gray-700 dark:text-gray-300">
              CONSELHO FEDERAL DE PSICOLOGIA. Código de Ética Profissional do Psicólogo. Disponível em: https://site.cfp.org.br/codigo-de-etica/. Acesso em: 15 jan. 2024.
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Dissertação</h3>
            <div className="rounded bg-gray-50 dark:bg-gray-800 p-3 text-sm font-mono text-gray-700 dark:text-gray-300">
              OLIVEIRA, Paulo Roberto. Depressão e subjetividade: uma análise psicanalítica. 2022. 120 f. Dissertação (Mestrado em Psicologia Clínica) — Universidade de São Paulo, São Paulo, 2022.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
