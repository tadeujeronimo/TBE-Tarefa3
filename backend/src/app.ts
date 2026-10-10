import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import editalRoutes from "./routes/edital.routes";
import authRoutes from "./routes/auth.routes";

const app = express();

// CORS restrito: só a origem do front-end (Vite, por padrão) pode consumir a API.
// A origem vem do .env (ALLOWED_ORIGIN); os métodos e headers são os mínimos
// necessários para o CRUD em JSON. Justificativa completa no README.
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN ?? "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json()); // necessário para ler req.body em JSON

// Rota simples só para conferir se o servidor está no ar
app.get("/", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

// Autenticação: /api/auth/register, /api/auth/login, /api/auth/me
app.use("/api", authRoutes);

// Rotas do CRUD: /api/editais (GET público; POST/PUT/DELETE protegidos)
app.use("/api", editalRoutes);

// Rota inexistente
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Rota não encontrada." });
});

// Tratador final de erros (ex.: JSON malformado no body)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: "JSON inválido no corpo da requisição." });
  }
  console.error(err);
  return res.status(500).json({ error: "Erro interno do servidor." });
});

export default app;
