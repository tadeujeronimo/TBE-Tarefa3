// Estende o Request do Express com o usuário autenticado (preenchido pelo
// middleware "autenticar" depois de validar o JWT e confirmar o usuário no banco).
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        name: string;
        email: string;
        role: "ALUNO" | "ADMIN";
        createdAt: Date;
      };
    }
  }
}

export {};
