import { z } from "zod";

/**
 * Schemas Zod da autenticação.
 * - registerSchema: nome, e-mail válido e senha com no mínimo 6 caracteres
 * - loginSchema: e-mail válido e senha (sem regra de tamanho: quem decide se
 *   a senha está certa é o bcrypt.compare, não o Zod)
 */

// E-mail normalizado (minúsculo e sem espaços) para evitar duplicatas por caixa
const email = z
  .string({ error: "E-mail é obrigatório" })
  .trim()
  .toLowerCase()
  .pipe(z.email("E-mail inválido"));

export const registerSchema = z.object({
  name: z
    .string({ error: "Nome é obrigatório" })
    .trim()
    .min(2, "Nome deve ter pelo menos 2 caracteres"),
  email,
  password: z
    .string({ error: "Senha é obrigatória" })
    .min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export const loginSchema = z.object({
  email,
  password: z
    .string({ error: "Senha é obrigatória" })
    .min(1, "Senha é obrigatória"),
});
