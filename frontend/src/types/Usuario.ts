// Usuário autenticado, como devolvido pela API (nunca contém a senha)
export type Papel = "ALUNO" | "ADMIN";

export interface Usuario {
  id: number;
  name: string;
  email: string;
  role: Papel;
  createdAt: string;
}
