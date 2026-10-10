import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, StatusEdital, Role } from "@prisma/client";

const prisma = new PrismaClient();

// Dados baseados no mock de editais de monitoria usado na disciplina
// de Front-End (TFE-Tarefa4), adaptados para o catálogo de back-end.
const editais = [
  {
    disciplina: "Engenharia de Software",
    descricao:
      "Edital de monitoria da disciplina de Engenharia de Software, curso de Sistemas de Informação.",
    imageUrl: "/images/engenharia-de-software.png",
    professor: "Frederico de Miranda Coelho",
    curso: "Sistemas de Informação",
    vagas: 2,
    dataAbertura: new Date("2026-06-01"),
    dataEncerramento: new Date("2026-06-15"),
    status: StatusEdital.ENCERRADO,
    destaque: false,
  },
  {
    disciplina: "Programação Web",
    descricao:
      "Edital de monitoria da disciplina de Programação Web, curso de Sistemas de Informação.",
    imageUrl: "/images/programacao-web.png",
    professor: "Silder Lamas Vecchi",
    curso: "Sistemas de Informação",
    vagas: 1,
    dataAbertura: new Date("2026-09-01"),
    dataEncerramento: new Date("2026-10-20"),
    status: StatusEdital.ABERTO,
    destaque: false,
  },
  {
    disciplina: "Banco de Dados",
    descricao:
      "Edital de monitoria da disciplina de Banco de Dados, curso de Análise e Desenvolvimento de Sistemas.",
    imageUrl: "/images/banco-de-dados.png",
    professor: "João Paulo Campolina Lamas",
    curso: "Análise e Desenvolvimento de Sistemas",
    vagas: 2,
    dataAbertura: new Date("2026-05-01"),
    dataEncerramento: new Date("2026-05-15"),
    status: StatusEdital.ENCERRADO,
    destaque: false,
  },
  {
    disciplina: "Inteligência Artificial",
    descricao:
      "Edital de monitoria da disciplina de Inteligência Artificial, curso de Sistemas de Informação.",
    imageUrl: "/images/inteligencia-artificial.png",
    professor: "Maurício Archanjo Nunes Coelho",
    curso: "Sistemas de Informação",
    vagas: 2,
    dataAbertura: new Date("2026-09-05"),
    dataEncerramento: new Date("2026-10-25"),
    status: StatusEdital.ABERTO,
    destaque: false,
  },
  {
    disciplina: "Machine Learning",
    descricao:
      "Edital de monitoria da disciplina de Machine Learning, curso de Ciência da Computação.",
    imageUrl: "/images/machine-learning.png",
    professor: "Lucas Grassano Lattari",
    curso: "Ciência da Computação",
    vagas: 1,
    dataAbertura: new Date("2026-09-08"),
    dataEncerramento: new Date("2026-10-22"),
    status: StatusEdital.ABERTO,
    destaque: true,
  },
  {
    disciplina: "Redes de Computadores",
    descricao:
      "Edital de monitoria da disciplina de Redes de Computadores, curso de Sistemas de Informação.",
    imageUrl: "/images/redes-de-computadores.png",
    professor: "Bianca Portes de Castro",
    curso: "Sistemas de Informação",
    vagas: 2,
    dataAbertura: new Date("2026-04-01"),
    dataEncerramento: new Date("2026-04-15"),
    status: StatusEdital.ENCERRADO,
    destaque: false,
  },
];

// Cria (ou atualiza) o usuário administrador a partir do .env.
// Não apaga nenhum usuário: usa upsert pelo e-mail, que é único.
async function criarAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const senha = process.env.ADMIN_PASSWORD;
  const nome = process.env.ADMIN_NAME?.trim() || "Administrador";

  if (!email || !senha) {
    console.warn(
      "ADMIN_EMAIL/ADMIN_PASSWORD não definidos no .env: administrador NÃO criado."
    );
    return;
  }
  if (senha.length < 6) {
    console.warn("ADMIN_PASSWORD deve ter pelo menos 6 caracteres: administrador NÃO criado.");
    return;
  }

  const passwordHash = await bcrypt.hash(senha, 10);
  await prisma.user.upsert({
    where: { email },
    update: { name: nome, passwordHash, role: Role.ADMIN },
    create: { name: nome, email, passwordHash, role: Role.ADMIN },
  });
  console.log(`Administrador pronto: ${email}`);
}

async function main() {
  console.log("Iniciando seed do banco de dados...");

  // Limpa a tabela e reinicia o contador de IDs (assim os ids voltam a ser 1..6)
  await prisma.$executeRaw`TRUNCATE TABLE "editais" RESTART IDENTITY`;

  for (const edital of editais) {
    await prisma.edital.create({ data: edital });
  }

  console.log(`Seed concluído: ${editais.length} editais inseridos.`);

  await criarAdmin();
}

main()
  .catch((err) => {
    console.error("Erro ao executar o seed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
