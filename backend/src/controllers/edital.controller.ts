import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { prisma } from "../prisma";
import {
  criarEditalSchema,
  atualizarEditalSchema,
} from "../schemas/edital.schema";

// Converte o :id da URL em número. Retorna null se não for um inteiro positivo.
function lerId(req: Request): number | null {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const MSG_ID_INVALIDO = "ID inválido. Use um inteiro positivo.";

/**
 * Tratamento central de erros dos handlers:
 * - ZodError                    -> 400 (payload inválido)
 * - Prisma P2025 (não achou)    -> 404
 * - qualquer outro              -> 500
 */
function tratarErro(res: Response, error: unknown, mensagemInterna: string) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Payload inválido",
      issues: error.issues.map((e) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return res.status(404).json({ error: "Edital não encontrado." });
  }

  console.error(mensagemInterna, error);
  return res.status(500).json({ error: mensagemInterna });
}

/**
 * GET /api/editais — lista todos (200)
 */
export async function listarEditais(_req: Request, res: Response) {
  try {
    const editais = await prisma.edital.findMany({
      orderBy: { dataAbertura: "desc" },
    });
    return res.status(200).json(editais);
  } catch (error) {
    return tratarErro(res, error, "Erro ao listar editais.");
  }
}

/**
 * GET /api/editais/:id — 200 | 400 (ID inválido) | 404 | 500
 */
export async function buscarEditalPorId(req: Request, res: Response) {
  const id = lerId(req);
  if (id === null) {
    return res.status(400).json({ error: MSG_ID_INVALIDO });
  }

  try {
    const edital = await prisma.edital.findUnique({ where: { id } });

    if (!edital) {
      return res
        .status(404)
        .json({ error: `Edital com id ${id} não foi encontrado.` });
    }

    return res.status(200).json(edital);
  } catch (error) {
    return tratarErro(res, error, "Erro ao buscar edital.");
  }
}

/**
 * POST /api/editais — valida com Zod | 201 | 400 | 500
 */
export async function criarEdital(req: Request, res: Response) {
  try {
    const data = criarEditalSchema.parse(req.body); // valida e transforma
    const novoEdital = await prisma.edital.create({ data });
    return res.status(201).json(novoEdital);
  } catch (error) {
    return tratarErro(res, error, "Erro interno ao criar edital.");
  }
}

/**
 * PUT /api/editais/:id — atualização parcial | 200 | 400 | 404 (P2025) | 500
 */
export async function atualizarEdital(req: Request, res: Response) {
  const id = lerId(req);
  if (id === null) {
    return res.status(400).json({ error: MSG_ID_INVALIDO });
  }

  try {
    const data = atualizarEditalSchema.parse(req.body); // valida parciais
    const editalAtualizado = await prisma.edital.update({
      where: { id },
      data,
    });
    return res.status(200).json(editalAtualizado);
  } catch (error) {
    return tratarErro(res, error, "Erro interno ao atualizar edital.");
  }
}

/**
 * DELETE /api/editais/:id — 204 | 400 | 404 (P2025) | 500
 */
export async function removerEdital(req: Request, res: Response) {
  const id = lerId(req);
  if (id === null) {
    return res.status(400).json({ error: MSG_ID_INVALIDO });
  }

  try {
    await prisma.edital.delete({ where: { id } });
    return res.status(204).send();
  } catch (error) {
    return tratarErro(res, error, "Erro interno ao remover edital.");
  }
}
