import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter } as any);

const curriculum = [
  {
    name: "1º Período",
    order: 1,
    disciplines: [
      { name: "Introdução à Psicologia", description: "Fundamentos e história da Psicologia como ciência e profissão" },
      { name: "Filosofia", description: "Bases filosóficas do pensamento psicológico" },
      { name: "Metodologia Científica", description: "Métodos de pesquisa em Psicologia" },
      { name: "Biologia e Comportamento", description: "Bases biológicas do comportamento humano" },
      { name: "Sociologia Geral", description: "Fundamentos sociológicos aplicados à Psicologia" },
    ],
  },
  {
    name: "2º Período",
    order: 2,
    disciplines: [
      { name: "Neurociência e Comportamento", description: "Bases neurológicas do comportamento e funções mentais" },
      { name: "Psicologia do Desenvolvimento I", description: "Desenvolvimento humano da infância à adolescência" },
      { name: "Estatística Aplicada à Psicologia", description: "Métodos estatísticos para pesquisa psicológica" },
      { name: "Sociologia e Psicologia Social", description: "Relações sociais e influências culturais no comportamento" },
    ],
  },
  {
    name: "3º Período",
    order: 3,
    disciplines: [
      { name: "Psicologia do Desenvolvimento II", description: "Desenvolvimento adulto e envelhecimento" },
      { name: "Teorias da Personalidade", description: "Principais teorias sobre estrutura e dinâmica da personalidade" },
      { name: "Psicologia Social", description: "Comportamento humano em contextos sociais" },
      { name: "Psicofisiologia", description: "Relações entre processos fisiológicos e comportamento" },
    ],
  },
  {
    name: "4º Período",
    order: 4,
    disciplines: [
      { name: "Psicopatologia I", description: "Classificação e compreensão dos transtornos mentais" },
      { name: "Avaliação Psicológica", description: "Técnicas e instrumentos de avaliação psicológica" },
      { name: "Ética em Psicologia", description: "Código de ética profissional e dilemas éticos" },
      { name: "Processos Cognitivos", description: "Atenção, memória, percepção e aprendizagem" },
    ],
  },
  {
    name: "5º Período",
    order: 5,
    disciplines: [
      { name: "Psicopatologia II", description: "Transtornos de personalidade e psicoses" },
      { name: "Psicologia Clínica", description: "Fundamentos da prática clínica em Psicologia" },
      { name: "Neuropsicologia", description: "Avaliação e reabilitação neuropsicológica" },
      { name: "Psicodiagnóstico", description: "Processo diagnóstico e formulação de casos" },
    ],
  },
  {
    name: "6º Período",
    order: 6,
    disciplines: [
      { name: "Teorias Psicoterápicas I", description: "Abordagens psicodinâmicas e humanistas" },
      { name: "Psicologia Escolar e Educacional", description: "Psicologia no contexto educacional" },
      { name: "Psicologia Organizacional e do Trabalho", description: "Psicologia aplicada às organizações" },
      { name: "Técnicas de Entrevista", description: "Entrevista psicológica e técnicas de escuta clínica" },
    ],
  },
  {
    name: "7º Período",
    order: 7,
    disciplines: [
      { name: "Teorias Psicoterápicas II", description: "Abordagens cognitivo-comportamentais e sistêmicas" },
      { name: "Psicologia Jurídica", description: "Psicologia no contexto do direito e da justiça" },
      { name: "Saúde Mental e Saúde Coletiva", description: "Políticas de saúde mental e reforma psiquiátrica" },
      { name: "Intervenção em Crises", description: "Técnicas de intervenção em situações de crise" },
    ],
  },
  {
    name: "8º Período",
    order: 8,
    disciplines: [
      { name: "Psicologia Hospitalar", description: "Psicologia no contexto hospitalar e da saúde" },
      { name: "Supervisão Clínica I", description: "Supervisão da prática clínica supervisionada" },
      { name: "TCC I - Projeto de Pesquisa", description: "Elaboração do projeto de trabalho de conclusão" },
      { name: "Psicoterapia de Grupo", description: "Fundamentos e técnicas de psicoterapia grupal" },
    ],
  },
  {
    name: "9º Período",
    order: 9,
    disciplines: [
      { name: "Estágio Supervisionado I", description: "Prática profissional supervisionada - área clínica" },
      { name: "Supervisão Clínica II", description: "Supervisão avançada da prática clínica" },
      { name: "TCC II - Desenvolvimento", description: "Desenvolvimento e escrita do trabalho de conclusão" },
    ],
  },
  {
    name: "10º Período",
    order: 10,
    disciplines: [
      { name: "Estágio Supervisionado II", description: "Prática profissional supervisionada - segunda área" },
      { name: "Trabalho de Conclusão de Curso", description: "Apresentação e defesa do TCC" },
      { name: "Ética Profissional Avançada", description: "Dilemas éticos contemporâneos na prática profissional" },
    ],
  },
];

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  const hashedPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@psicospace.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@psicospace.com",
      password: hashedPassword,
      role: "SUPERADMIN",
    },
  });
  console.log(`✅ Admin criado: ${admin.email}`);

  for (const periodData of curriculum) {
    const period = await prisma.period.upsert({
      where: { id: periodData.name },
      update: { name: periodData.name, order: periodData.order },
      create: { id: periodData.name, name: periodData.name, order: periodData.order },
    });

    for (const discData of periodData.disciplines) {
      const discId = `${period.id}-${discData.name}`;
      await prisma.discipline.upsert({
        where: { id: discId },
        update: { name: discData.name, description: discData.description },
        create: {
          id: discId,
          name: discData.name,
          description: discData.description,
          periodId: period.id,
        },
      });
    }
    console.log(`✅ ${period.name} (${periodData.disciplines.length} disciplinas)`);
  }

  console.log("✅ Seed concluído com sucesso!");
  console.log("📧 Admin: admin@psicospace.com");
  console.log("🔑 Senha: admin123");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
