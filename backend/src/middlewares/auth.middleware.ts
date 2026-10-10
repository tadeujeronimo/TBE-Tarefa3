import { Request, Response, NextFunction } from "express";
import { verificarToken } from "../config/jwt";
import { prisma } from "../prisma";

/**
 * Middleware de autenticação: exige o header
 *   Authorization: Bearer <token>
 * 1. valida o JWT (assinatura e expiração)             -> senão 401
 * 2. confirma que o usuário do token AINDA existe no banco -> senão 401
 * 3. preenche req.user (com o papel/role) e chama next()
 *
 * O passo 2 evita que um token continue valendo depois que o usuário é removido.
 */
export async function autenticar(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header) {
    return res.status(401).json({ error: "Token não informado." });
  }

  const [esquema, token] = header.split(" ");
  if (esquema !== "Bearer" || !token) {
    return res
      .status(401)
      .json({ error: "Formato inválido. Use: Authorization: Bearer <token>." });
  }

  let id: number;
  try {
    id = verificarToken(token).id;
  } catch (error) {
    // Erro de configuração (sem JWT_SECRET) não é culpa do cliente: 500
    if (error instanceof Error && error.message.startsWith("JWT_SECRET")) {
      console.error(error);
      return res.status(500).json({ error: "Erro interno do servidor." });
    }
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Usuário do token não existe mais." });
    }

    req.user = user;
    return next();
  } catch (error) {
    console.error("Erro ao consultar o usuário do token:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  }
}

/**
 * Middleware de autorização: só deixa passar quem tem role ADMIN.
 * Deve vir DEPOIS de "autenticar" (que preenche req.user).
 * - sem usuário autenticado -> 401
 * - autenticado, mas não é admin -> 403 (Forbidden)
 */
export function exigirAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: "Não autenticado." });
  }
  if (req.user.role !== "ADMIN") {
    return res
      .status(403)
      .json({ error: "Acesso negado: apenas administradores podem fazer isso." });
  }
  return next();
}
