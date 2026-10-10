import { Edital } from "../types/Edital";
import { Usuario } from "../types/Usuario";

// URL base da API (backend). Pode ser trocada pela variável VITE_API_URL no .env
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3333";

// Formato que a API devolve:
// - datas em ISO ("2026-06-01T00:00:00.000Z")
// - status em maiúsculas
interface EditalApi {
  id: number;
  disciplina: string;
  descricao: string;
  imageUrl: string;
  professor: string;
  curso: string;
  vagas: number;
  dataAbertura: string;
  dataEncerramento: string;
  status: "ABERTO" | "ENCERRADO";
  destaque: boolean;
}

// Converte o formato da API para o formato usado pelos componentes:
// - datas "2026-06-01T00:00:00.000Z" -> "2026-06-01"
function paraEdital(e: EditalApi): Edital {
  return {
    id: e.id,
    disciplina: e.disciplina,
    descricao: e.descricao,
    imageUrl: e.imageUrl,
    professor: e.professor,
    curso: e.curso,
    vagas: e.vagas,
    dataAbertura: e.dataAbertura.slice(0, 10),
    dataEncerramento: e.dataEncerramento.slice(0, 10),
    status: e.status,
    destaque: e.destaque,
  };
}

// Erro lançado quando a API responde com status fora de 2xx.
// Guarda o status (ex.: 401 = sessão inválida, 403 = sem permissão) e uma
// mensagem pronta para mostrar ao usuário.
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Monta a mensagem de erro a partir do corpo { error, issues? } da API
function mensagemDoErro(corpo: any, status: number): string {
  if (Array.isArray(corpo?.issues) && corpo.issues.length > 0) {
    return corpo.issues.map((i: { message: string }) => i.message).join(" • ");
  }
  if (typeof corpo?.error === "string") return corpo.error;
  return `Erro HTTP ${status}`;
}

// Requisição JSON genérica. Envia "Authorization: Bearer <token>" quando há token.
async function requisitar<T>(
  caminho: string,
  opcoes: { method?: string; body?: unknown; token?: string | null } = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (opcoes.body !== undefined) headers["Content-Type"] = "application/json";
  if (opcoes.token) headers["Authorization"] = `Bearer ${opcoes.token}`;

  let resp: Response;
  try {
    resp = await fetch(`${BASE_URL}${caminho}`, {
      method: opcoes.method ?? "GET",
      headers,
      body: opcoes.body !== undefined ? JSON.stringify(opcoes.body) : undefined,
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar à API. Verifique se o backend está rodando.");
  }

  if (resp.status === 204) return undefined as T;

  const corpo = await resp.json().catch(() => null);
  if (!resp.ok) throw new ApiError(resp.status, mensagemDoErro(corpo, resp.status));
  return corpo as T;
}

// ---------- Editais ----------

// Dados enviados ao criar/editar um edital (sem o id)
export type EditalInput = Omit<Edital, "id">;

// GET /api/editais (público)
export async function fetchEditais(): Promise<Edital[]> {
  const data = await requisitar<EditalApi[]>("/api/editais");
  return data.map(paraEdital);
}

// POST /api/editais (somente ADMIN)
export async function criarEdital(dados: EditalInput, token: string): Promise<Edital> {
  const criado = await requisitar<EditalApi>("/api/editais", { method: "POST", body: dados, token });
  return paraEdital(criado);
}

// PUT /api/editais/:id (somente ADMIN)
export async function atualizarEdital(id: number, dados: EditalInput, token: string): Promise<Edital> {
  const atualizado = await requisitar<EditalApi>(`/api/editais/${id}`, { method: "PUT", body: dados, token });
  return paraEdital(atualizado);
}

// ---------- Autenticação ----------

export interface RespostaAuth {
  user: Usuario;
  token: string;
}

// POST /api/auth/register (todo cadastro público nasce como ALUNO)
export function registrarUsuario(dados: { name: string; email: string; password: string }) {
  return requisitar<RespostaAuth>("/api/auth/register", { method: "POST", body: dados });
}

// POST /api/auth/login
export function entrar(dados: { email: string; password: string }) {
  return requisitar<RespostaAuth>("/api/auth/login", { method: "POST", body: dados });
}

// GET /api/auth/me: confirma o token e devolve o usuário atual
export function buscarUsuarioAtual(token: string) {
  return requisitar<Usuario>("/api/auth/me", { token });
}
