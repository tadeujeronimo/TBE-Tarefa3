import { z } from "zod";

/**
 * Schemas Zod (validação em runtime)
 * - criarEditalSchema: criação (campos obrigatórios)
 * - atualizarEditalSchema: atualização parcial (todos opcionais)
 *
 * Mapeamento com o enunciado:
 *   title       -> disciplina  (string, min 3)
 *   description -> descricao   (string, min 10)
 *   imageUrl    -> imageUrl    (string, min 1)
 */

// Aceita datas em string ("2026-06-01" ou ISO completo) e converte para Date
const dataValida = (campo: string) =>
  z
    .string({ error: `${campo} é obrigatória (formato AAAA-MM-DD ou ISO 8601)` })
    .refine((valor) => !Number.isNaN(Date.parse(valor)), `${campo} inválida`)
    .transform((valor) => new Date(valor));

export const criarEditalSchema = z.object({
  disciplina: z
    .string({ error: "Disciplina é obrigatória" })
    .min(3, "Disciplina deve ter pelo menos 3 caracteres"),
  descricao: z
    .string({ error: "Descrição é obrigatória" })
    .min(10, "Descrição deve ter pelo menos 10 caracteres"),
  imageUrl: z
    .string({ error: "imageUrl é obrigatório" })
    .min(1, "imageUrl não pode ser vazio"),
  professor: z
    .string({ error: "Professor é obrigatório" })
    .min(1, "Professor não pode ser vazio"),
  curso: z
    .string({ error: "Curso é obrigatório" })
    .min(1, "Curso não pode ser vazio"),
  // coerce: tenta converter "3" (string) em número antes de validar positive()
  vagas: z.coerce
    .number({ error: "Vagas deve ser um número" })
    .int("Vagas deve ser um número inteiro")
    .positive("Vagas deve ser maior que zero"),
  dataAbertura: dataValida("dataAbertura"),
  dataEncerramento: dataValida("dataEncerramento"),
  // Sem .default() aqui: quando ausentes, o próprio banco aplica ABERTO / false
  // (assim o .partial() do PUT não sobrescreve esses campos sem querer)
  status: z
    .enum(["ABERTO", "ENCERRADO"], { error: "Status deve ser ABERTO ou ENCERRADO" })
    .optional(),
  destaque: z.boolean({ error: "Destaque deve ser true ou false" }).optional(),
});

// Atualização parcial: mesmas regras, mas todos os campos opcionais
export const atualizarEditalSchema = criarEditalSchema.partial();
