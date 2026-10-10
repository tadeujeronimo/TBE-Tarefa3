import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { registerSchema, loginSchema } from "../schemas/auth.schema";
import { assinarToken } from "../config/jwt";

const SALT_ROUNDS = 10;

// Nunca devolvemos o hash da senha: só os dados públicos do usuário
const selectPublico = { id: true, name: true, email: true, role: true, createdAt: true } as const;

function tratarErro(res: Response, error: unknown, mensagemInterna: string) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Payload inválido",
      issues: error.issues.map((e) => ({
        path: e.path.join(".") || "body",
        message: e.message,
      })),
    });
  }

  // P2002 = violação de unicidade (corrida entre dois registros com o mesmo e-mail)
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return res.status(409).json({ error: "E-mail já cadastrado." });
  }

  console.error(mensagemInterna, error);
  return res.status(500).json({ error: mensagemInterna });
}

/**
 * POST /api/auth/register — 201 (usuário + token) | 400 | 409 (e-mail em uso) | 500
 */
export async function registrar(req: Request, res: Response) {
  try {
    const { name, email, password } = registerSchema.parse(req.body ?? {});

    const existente = await prisma.user.findUnique({ where: { email } });
    if (existente) {
      return res.status(409).json({ error: "E-mail já cadastrado." });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    // O papel NUNCA vem do body: todo cadastro público nasce como ALUNO (padrão do
    // banco). Administradores são criados pelo seed (npm run seed).
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: selectPublico,
    });

    return res.status(201).json({ user, token: assinarToken(user.id) });
  } catch (error) {
    return tratarErro(res, error, "Erro interno ao registrar usuário.");
  }
}

/**
 * POST /api/auth/login — 200 (usuário + token) | 400 | 401 (credenciais) | 500
 */
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body ?? {});

    const userComSenha = await prisma.user.findUnique({ where: { email } });

    // Mesma mensagem para "e-mail não existe" e "senha errada": não revela
    // quais e-mails estão cadastrados.
    const senhaConfere = userComSenha
      ? await bcrypt.compare(password, userComSenha.passwordHash)
      : false;

    if (!userComSenha || !senhaConfere) {
      return res.status(401).json({ error: "E-mail ou senha inválidos." });
    }

    const { id, name, email: emailUser, role, createdAt } = userComSenha;
    return res.status(200).json({
      user: { id, name, email: emailUser, role, createdAt },
      token: assinarToken(id),
    });
  } catch (error) {
    return tratarErro(res, error, "Erro interno ao autenticar.");
  }
}

/**
 * GET /api/auth/me — (rota protegida) 200 | 401
 * O middleware "autenticar" já validou o token e carregou o usuário do banco.
 */
export function me(req: Request, res: Response) {
  return res.status(200).json(req.user);
}
