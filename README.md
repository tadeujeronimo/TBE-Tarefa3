# TBE-Tarefa3

Projeto full-stack do **Sistema de Monitorias** (IF Sudeste MG), organizado da seguinte forma:

```
TBE-Tarefa3/
├── backend/    # API REST (Node.js + TypeScript + Express 5 + Prisma + Zod + PostgreSQL/Docker) – Tarefa 3
└── frontend/   # Interface (React + TypeScript + Vite + Bootstrap 5) – 
```

- O **backend** implementa o CRUD completo de editais, com validação (Zod), tratamento de erros (400/401/403/404/500) e CORS. Na **Tarefa 3** ganhou autenticação (registro/login com bcrypt + JWT), dois papéis (`ALUNO` e `ADMIN`) e middlewares: `GET /api/editais` segue público, mas `POST/PUT/DELETE` exigem `Authorization: Bearer <token>` **de um administrador** (sem token → 401; aluno logado → 403). Detalhes de endpoints, payloads e testes: [`backend/README.md`](backend/README.md).
- O **frontend** lista os editais consumindo a API e tem cadastro/login: só **administradores** criam e editam editais, e só **usuários logados** se inscrevem em monitoria. Detalhes: [`frontend/README.md`](frontend/README.md).

## O que vem da API e o que é local

| Funcionalidade                             | Origem                                   |
| ------------------------------------------ | ---------------------------------------- |
| Listagem de editais                        | **API** (`GET /api/editais`)             |
| CRUD completo (GET, POST, PUT, DELETE)     | **API** – testado no Insomnia            |
| Cadastro e login de usuários               | **API** (`/api/auth/register`, `/api/auth/login`, `/api/auth/me`) |
| Criar e editar edital pelo site (só admin) | **API** (`POST`/`PUT /api/editais`, com token) |
| Inscrição em monitoria (só logado)         | Local (`useState`), não grava no banco   |

## Como rodar (3 passos)

Pré-requisitos: Node.js 18+ e Docker com Docker Compose.

**1. Backend e banco de dados** (terminal 1)

```bash
cd TBE-Tarefa3/backend
cp .env.example .env
npm install
docker compose up -d
npx prisma generate
npm run prisma:migrate
npm run seed
npm run dev
```

A API sobe em `http://localhost:3333`. O `npm run seed` também cria o **administrador** definido no `.env` (padrão: `admin@monitorias.com` / `admin123`).

**2. Frontend** (terminal 2)

```bash
cd TBE-Tarefa3/frontend
npm install
npm run dev
```

O site abre em `http://localhost:5173` (origem liberada no CORS do backend).

**3. Testar a API no Insomnia**

Importe `backend/insomnia/Insomnia_Editais.json` e execute as requisições. Cada uma indica o status esperado.

## Papéis de usuário

| Papel   | Como é criado                                  | O que pode fazer                                      |
| ------- | ---------------------------------------------- | ----------------------------------------------------- |
| Visitante | (não logado)                                 | Ver e buscar editais                                  |
| `ALUNO` | Cadastro público ("Criar conta" no site)       | Tudo do visitante + inscrever-se em monitoria         |
| `ADMIN` | `npm run seed` (variáveis `ADMIN_*` do `.env`) | Tudo do aluno + criar e editar editais                |

O papel nunca é escolhido no cadastro: toda conta pública nasce como `ALUNO`.

## Portas

| Serviço    | Porta  |
| ---------- | ------ |
| Frontend   | 5173   |
| Backend    | 3333   |
| PostgreSQL | 5432   |

## Vídeo de demonstração (YouTube – não listado):

<!-- [https://youtu.be/](https://youtu.be/) -->
(link do vídeo – a adicionar)

## Autor

- **Nome**: Tadeu dos Santos Jerônimo
- **Matrícula**: 2026202194
- **E-mail**: <tadeus.jeronimo@gmail.com>
- **Disciplina**: Tecnologias Back-End - IF Sudeste/MG

## Licença

[MIT](LICENSE)
