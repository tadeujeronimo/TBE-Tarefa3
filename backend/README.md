# Backend – Sistema de Monitorias (Tarefa 3)

API REST do **Sistema de Monitorias**, desenvolvida com Node.js, TypeScript, Express 5, PostgreSQL, Prisma e Zod para a disciplina Tecnologias Back-End. A **Tarefa 2** entregou o CRUD completo, a **Tarefa 3** adiciona **registro e login de usuários (bcrypt + JWT)** e um **middleware** que protege as rotas de escrita de editais. Há **dois papéis de usuário**: `ALUNO` (cadastro público) e `ADMIN` (criado pelo seed), e só o admin cria, edita e exclui editais.

> Evolução da [Tarefa 1](https://github.com/tadeujeronimo/TBE-Tarefa1): a entidade `Edital` é o equivalente ao `Product` pedido no enunciado.

## Tecnologias

- Node.js + TypeScript
- Express 5
- PostgreSQL 15 (Docker / Docker Compose)
- Prisma ORM (migrations + seed + Prisma Studio)
- Zod (validação em tempo de execução)
- bcryptjs (hash de senha) e jsonwebtoken (JWT)
- CORS (`cors`)
- Insomnia (testes dos endpoints)

## Modelo de dados (Prisma)

Modelo `Edital` (análogo ao `Product` do enunciado):

| Campo            | Tipo          | Observação                                     |
| ---------------- | ------------- | ---------------------------------------------- |
| id               | Int           | `@id @default(autoincrement())`                |
| disciplina       | String        | mapeado para a coluna `title`                  |
| descricao        | String (Text) | mapeado para a coluna `description`            |
| imageUrl         | String        | imagem/banner do edital (coluna `image_url`)   |
| professor        | String        | nome do professor responsável                  |
| curso            | String        | curso ao qual a disciplina pertence            |
| vagas            | Int           | número de vagas ofertadas                      |
| dataAbertura     | DateTime      | abertura das inscrições                        |
| dataEncerramento | DateTime      | encerramento das inscrições                    |
| status           | Enum          | `ABERTO` (padrão) ou `ENCERRADO`               |
| destaque         | Boolean       | edital em destaque no catálogo (padrão `false`) |
| createdAt        | DateTime      | `@default(now())`                              |
| updatedAt        | DateTime      | `@updatedAt`                                   |

Modelo `User` (Tarefa 3), tabela `users`:

| Campo        | Tipo     | Observação                                    |
| ------------ | -------- | --------------------------------------------- |
| id           | Int      | `@id @default(autoincrement())`               |
| name         | String   | nome do usuário                               |
| email        | String   | `@unique`, salvo em minúsculas                |
| passwordHash | String   | hash **bcrypt** da senha (coluna `password_hash`) – a senha pura nunca é salva |
| role         | Enum `Role` | `ALUNO` (padrão) ou `ADMIN` |
| createdAt    | DateTime | `@default(now())`                             |
| updatedAt    | DateTime | `@updatedAt`                                  |

## Endpoints

### Autenticação (Tarefa 3)

| Método | Rota                 | Descrição                           | Proteção | Status possíveis   |
| ------ | -------------------- | ----------------------------------- | -------- | ------------------ |
| POST   | `/api/auth/register` | Cria usuário e retorna `{ user, token }` | pública | 201, 400, 409, 500 |
| POST   | `/api/auth/login`    | Autentica e retorna `{ user, token }`    | pública | 200, 400, 401, 500 |
| GET    | `/api/auth/me`       | Dados do usuário autenticado (inclui `role`) | [AUTH] token | 200, 401, 500 |

### Editais

| Método | Rota               | Descrição                          | Proteção | Status possíveis            |
| ------ | ------------------ | ---------------------------------- | -------- | --------------------------- |
| GET    | `/`                | Status da API (`{ "status": "ok" }`) | pública | 200                       |
| GET    | `/api/editais`     | Lista todos os editais             | pública  | 200, 500                    |
| GET    | `/api/editais/:id` | Retorna um edital por id           | pública  | 200, 400, 404, 500          |
| POST   | `/api/editais`     | Cria um edital                     | [ADMIN] token | 201, 400, 401, 403, 500     |
| PUT    | `/api/editais/:id` | Atualização **parcial**            | [ADMIN] token | 200, 400, 401, 403, 404, 500 |
| DELETE | `/api/editais/:id` | Remove um edital                   | [ADMIN] token | 204, 400, 401, 403, 404, 500 |

Significado dos códigos:

- **200 OK** – sucesso (com corpo JSON).
- **201 Created** – edital criado.
- **204 No Content** – edital removido (sem corpo).
- **401 Unauthorized** – token ausente, malformado, inválido ou expirado, usuário do token que não existe mais, ou credenciais erradas no login.
- **403 Forbidden** – usuário autenticado, mas sem permissão: rotas [ADMIN] chamadas por um `ALUNO`.
- **409 Conflict** – e-mail já cadastrado no registro.
- **400 Bad Request** – `:id` inválido (não é inteiro positivo), payload que não passa no Zod ou JSON malformado.
- **404 Not Found** – edital inexistente (no PUT/DELETE, é o erro **P2025** do Prisma).
- **500 Internal Server Error** – erro inesperado (ex.: banco fora do ar).

## Validação com Zod

Os schemas ficam em `src/schemas/edital.schema.ts`:

| Campo do enunciado | Campo do projeto | Regra                                         |
| ------------------ | ---------------- | --------------------------------------------- |
| `title`            | `disciplina`     | `string().min(3)`                             |
| `description`      | `descricao`      | `string().min(10)`                            |
| `imageUrl`         | `imageUrl`       | `string().min(1)`                             |
| —                  | `professor`, `curso` | `string().min(1)`                         |
| —                  | `vagas`          | número inteiro maior que zero                 |
| —                  | `dataAbertura`, `dataEncerramento` | data válida (`AAAA-MM-DD` ou ISO 8601) |
| —                  | `status`         | opcional: `ABERTO` ou `ENCERRADO`             |
| —                  | `destaque`       | opcional: `true` ou `false`                   |

- **Criação (POST):** `criarEditalSchema` – campos obrigatórios.
- **Atualização (PUT):** `atualizarEditalSchema = criarEditalSchema.partial()` – todos os campos opcionais, mas cada um enviado segue a mesma regra da criação.

Como o Zod impede dados inválidos: o corpo da requisição passa por `schema.parse(req.body)` **antes** de qualquer acesso ao banco. Se algo violar as regras, o Zod lança um `ZodError`, o `catch` o converte em **400** com a lista de problemas, e o Prisma nem chega a ser chamado.

O `catch` de cada rota diferencia três casos:

| Erro                                 | Resposta |
| ------------------------------------ | -------- |
| `ZodError`                           | 400      |
| `PrismaClientKnownRequestError` P2025 (registro não encontrado) | 404 |
| qualquer outro                       | 500      |

## Autenticação e middleware (Tarefa 3)

**Fluxo:** `register`/`login` devolvem um **JWT** → o cliente envia `Authorization: Bearer <token>` → o middleware `autenticar` valida o token e confirma o usuário no banco → (nas rotas de escrita) `exigirAdmin` confere o papel.

- **Senha:** `bcrypt.hash(senha, 10)` no registro; `bcrypt.compare` no login. Só o hash vai para o banco e ele nunca é devolvido pela API.
- **Login seguro:** e-mail inexistente e senha errada retornam a **mesma** mensagem (401), para não revelar quais e-mails estão cadastrados.
- **JWT:** assinado com `JWT_SECRET` (do `.env`), expira em `JWT_EXPIRES_IN` (padrão `7d`); o id do usuário vai no campo `sub`. Sem `JWT_SECRET` a API não assina nem valida tokens.
- **Middleware `autenticar`** (`src/middlewares/auth.middleware.ts`): responde **401** quando não há header, o formato não é `Bearer <token>`, o token é inválido/expirado/assinado com outro segredo, **ou o usuário do token não existe mais no banco** (a cada requisição ele consulta o `User`). Se tudo certo, coloca o usuário (com `role`) em `req.user` e chama `next()`.
- **Papéis (`Role`):** `ALUNO` (padrão de todo cadastro) e `ADMIN`. O papel **nunca** é lido do corpo do `register`: ninguém vira admin pela API pública. O administrador é criado/atualizado pelo `npm run seed`, a partir de `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `ADMIN_NAME` do `.env`.
- **Middleware `exigirAdmin`:** roda depois do `autenticar`; se `req.user.role` não for `ADMIN`, responde **403**.
- **Aplicação nas rotas** (`src/routes/edital.routes.ts`): `GET` público; `POST`, `PUT` e `DELETE` passam por `autenticar` e `exigirAdmin`. Sem token → 401; aluno logado → 403; admin → sucesso.
- **Validação (Zod)** em `src/schemas/auth.schema.ts`: e-mail válido (normalizado em minúsculas) e senha com **mínimo de 6 caracteres** no registro.
- **CORS:** o header `Authorization` foi adicionado em `allowedHeaders` para o front-end poder enviar o token.

## Política de CORS

Configuração em `src/app.ts`:

```ts
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN ?? "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
```

| Item     | Política adotada                                        | Justificativa |
| -------- | ------------------------------------------------------- | ------------- |
| Origens  | Apenas `ALLOWED_ORIGIN` do `.env` (padrão `http://localhost:5173`, o front-end em Vite) | Nunca usamos `*`: só o front-end da aplicação pode consumir a API pelo navegador. Em produção basta trocar a variável pelo domínio real. |
| Métodos  | `GET`, `POST`, `PUT`, `DELETE`                          | São exatamente os métodos do CRUD. Qualquer outro (ex.: `PATCH`) não é liberado. |
| Headers  | `Content-Type`, `Authorization`                         | `Content-Type` para enviar JSON e `Authorization` para o token `Bearer`. O token vai no header (não em cookie), portanto sem `credentials`. |

Observações:

- O front-end deste projeto (pasta `../frontend`, Vite) roda em `http://localhost:5173`, que é a origem liberada por padrão.
- A resposta sempre anuncia apenas a origem permitida; quando uma página de **outra** origem tenta usar a API, o navegador bloqueia a resposta.
- O CORS é uma proteção **do navegador**: Insomnia, curl e similares continuam funcionando normalmente.
- As requisições `PUT`/`DELETE` e as que enviam `Content-Type: application/json` disparam um *preflight* (`OPTIONS`), que o middleware responde automaticamente com `204`.

## Como rodar do zero

### Pré-requisitos

- Node.js 18+
- Docker e Docker Compose

### Passo a passo

1. **Entre na pasta do backend e instale as dependências**

```bash
cd TBE-Tarefa3/backend
npm install
```

2. **Configure as variáveis de ambiente**

```bash
cp .env.example .env
```

O `.env` já vem com valores compatíveis com o `docker-compose.yml`. **Troque o `JWT_SECRET`** por um valor próprio (sugestão: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`). Variáveis:

| Variável          | Descrição                                   | Padrão                  |
| ----------------- | ------------------------------------------- | ----------------------- |
| `POSTGRES_*`      | Usuário, senha e nome do banco (Docker)     | ver `.env.example`      |
| `DATABASE_URL`    | String de conexão usada pelo Prisma         | ver `.env.example`      |
| `PORT`            | Porta da API                                | `3333`                  |
| `ALLOWED_ORIGIN`  | Origem do front-end liberada no CORS        | `http://localhost:5173` |
| `JWT_SECRET`      | Segredo que assina os tokens (**obrigatório**; troque o valor do exemplo) | ver `.env.example` |
| `JWT_EXPIRES_IN`  | Validade do token                           | `7d`                    |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Administrador criado pelo `npm run seed` (senha com no mínimo 6 caracteres) | `admin@admin.com` / `admin123` (**só para desenvolvimento**) |

3. **Suba o banco PostgreSQL com Docker Compose**

```bash
docker compose up -d
```

Cria o container `catalogo-editais-db` (PostgreSQL 15), expõe a porta `5432` e persiste os dados em um volume Docker. Confira com `docker ps`.

4. **Gere o Prisma Client e aplique a migration**

```bash
npx prisma generate
npm run prisma:migrate
```

5. **Popule o banco com os editais de exemplo (seed)**

```bash
npm run seed
```

Insere 6 editais (ids 1 a 6; 3 abertos e 3 encerrados) e **cria/atualiza o usuário administrador** definido no `.env`. Pode ser executado várias vezes: a tabela de editais é limpa e os ids voltam a começar em 1, e o admin é recriado pelo e-mail (upsert); os demais usuários não são apagados.

6. **(Opcional) Confira os dados no Prisma Studio**

```bash
npm run prisma:studio
```

7. **Inicie a API em modo desenvolvimento**

```bash
npm run dev
```

A API sobe em `http://localhost:3333`.

8. **Teste os endpoints no Insomnia**

Importe `insomnia/Insomnia_Editais.json` (`Application` → `Preferences` → `Data` → `Import Data`) e execute as requisições: primeiro a pasta **Autenticação** (que gera os tokens de aluno e de admin), depois **Editais**. Cada uma traz, no nome e na aba **Docs**, o status esperado.

## Testes no Insomnia – status esperados

**Ordem sugerida:** pasta **Autenticação** (A01 → A11) e depois a pasta **Editais**. Há dois tokens, capturados automaticamente por *response chaining*: `token_aluno` (login **A04**, usuário comum) e `token_admin` (login **A10**, administrador criado pelo `npm run seed`). As requisições [ADMIN] usam o `token_admin`; [AUTH] e [ALUNO] usam o `token_aluno`. Se preferir, cole os tokens manualmente nas variáveis do *Base Environment* (`email_admin` e `senha_admin` devem ser iguais ao `ADMIN_EMAIL`/`ADMIN_PASSWORD` do seu `.env`). Se um token expirar, rode o login correspondente de novo.

### Pasta Autenticação

| #   | Requisição                                         | Status esperado |
| --- | -------------------------------------------------- | --------------- |
| A01 | `POST /api/auth/register` (válido)                 | 201 (409 se o e-mail já existir) |
| A02 | `POST /api/auth/register` (e-mail e senha inválidos) | 400           |
| A03 | `POST /api/auth/register` (e-mail duplicado)       | 409             |
| A04 | `POST /api/auth/login` (aluno, válido)             | 200 + token (`role: ALUNO`) |
| A05 | `POST /api/auth/login` (senha errada)              | 401             |
| A06 | `POST /api/auth/login` (payload inválido)          | 400             |
| A07 | `GET /api/auth/me` (sem token)                     | 401             |
| A08 | `GET /api/auth/me` (token inválido)                | 401             |
| A09 | `GET /api/auth/me` (com token) [AUTH]                  | 200             |
| A10 | `POST /api/auth/login` (admin, válido)             | 200 + token (`role: ADMIN`) |
| A11 | `POST /api/auth/register` enviando `role: ADMIN` no body | 201, mas com `role: ALUNO` (o papel é ignorado) |

### Pasta Editais

Variáveis do ambiente (Base Environment): `base_url` (`http://localhost:3333`), `id_valido` (1), `id_inexistente` (9999), `id_delete` (6), `email_teste`, `senha_teste` e `token`.

| #  | Requisição                                   | Status esperado |
| -- | -------------------------------------------- | --------------- |
| 01 | `GET /`                                      | 200             |
| 02 | `GET /api/editais`                           | 200             |
| 03 | `GET /api/editais/:id` (ID válido)           | 200             |
| 04 | `GET /api/editais/abc` (ID inválido)         | 400             |
| 05 | `GET /api/editais/9999` (inexistente)        | 404             |
| 06 | `POST /api/editais` (payload válido) [ADMIN]      | 201             |
| 07 | `POST /api/editais` (payload inválido) [ADMIN]     | 400             |
| 08 | `PUT /api/editais/:id` (parcial válido) [ADMIN]     | 200             |
| 09 | `PUT /api/editais/:id` (`vagas` negativas) [ADMIN]   | 400             |
| 10 | `PUT /api/editais/9999` (inexistente) [ADMIN]      | 404             |
| 11 | `DELETE /api/editais/:id` (válido) [ADMIN]      | 204             |
| 12 | `DELETE /api/editais/9999` (inexistente) [ADMIN]     | 404             |
| 13 | `GET /api/editais` com o banco parado (`docker compose stop`) | 500 |
| 14 | `POST /api/editais` **sem token**            | 401             |
| 15 | `PUT /api/editais/:id` **sem token**         | 401             |
| 16 | `DELETE /api/editais/:id` **sem token**      | 401             |
| 17 | `POST /api/editais` com **token inválido**   | 401             |
| 18 | `POST /api/editais` com **token de aluno** [ALUNO] | 403       |
| 19 | `PUT /api/editais/:id` com **token de aluno** [ALUNO] | 403    |
| 20 | `DELETE /api/editais/:id` com **token de aluno** [ALUNO] | 403 |

Dica: depois do teste 11, rode `npm run seed` para restaurar o edital removido (o seed **não apaga** usuários). Depois do teste 13, rode `docker compose start`.

## Exemplos de payloads

### Autenticação

**POST `/api/auth/register` – válido (201 Created)**

```json
{ "name": "Aluno Teste", "email": "aluno@teste.com", "password": "123456" }
```

Resposta:

```json
{
  "user": { "id": 1, "name": "Aluno Teste", "email": "aluno@teste.com", "role": "ALUNO", "createdAt": "2026-09-27T12:00:00.000Z" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**POST `/api/auth/register` – inválido (400 Bad Request)**

```json
{ "name": "A", "email": "isso-nao-e-email", "password": "123" }
```

```json
{
  "error": "Payload inválido",
  "issues": [
    { "path": "name", "message": "Nome deve ter pelo menos 2 caracteres" },
    { "path": "email", "message": "E-mail inválido" },
    { "path": "password", "message": "Senha deve ter pelo menos 6 caracteres" }
  ]
}
```

**POST `/api/auth/register` – e-mail repetido (409 Conflict):** `{ "error": "E-mail já cadastrado." }`

**POST `/api/auth/login` – válido (200 OK)** – mesmo formato de resposta do registro

```json
{ "email": "aluno@teste.com", "password": "123456" }
```

**POST `/api/auth/login` – credenciais erradas (401):** `{ "error": "E-mail ou senha inválidos." }`

**GET `/api/auth/me`** – header `Authorization: Bearer <token>`

- Com token válido (200): `{ "id": 1, "name": "Aluno Teste", "email": "aluno@teste.com", "role": "ALUNO", "createdAt": "..." }`
- Sem token (401): `{ "error": "Token não informado." }`
- Token inválido/expirado (401): `{ "error": "Token inválido ou expirado." }`

**Rotas protegidas de editais** (só ADMIN) – exemplo com curl:

```bash
curl -X DELETE http://localhost:3333/api/editais/6 -H "Authorization: Bearer <token>"   # 204
curl -X DELETE http://localhost:3333/api/editais/6                                      # 401 (sem token)
curl -X DELETE http://localhost:3333/api/editais/6 -H "Authorization: Bearer <token_de_aluno>"  # 403
```

Resposta **403** (aluno logado tentando alterar um edital): `{ "error": "Acesso negado: apenas administradores podem fazer isso." }`

### Editais

**POST `/api/editais` – válido (201 Created)**

```json
{
  "disciplina": "Compiladores",
  "descricao": "Edital de monitoria da disciplina de Compiladores.",
  "imageUrl": "/images/compiladores.png",
  "professor": "Nome do Professor",
  "curso": "Ciência da Computação",
  "vagas": 2,
  "dataAbertura": "2026-08-01",
  "dataEncerramento": "2026-08-20",
  "status": "ABERTO",
  "destaque": false
}
```

`status` e `destaque` são opcionais (padrão: `ABERTO` e `false`).

**POST `/api/editais` – inválido (400 Bad Request)**

```json
{
  "disciplina": "ab",
  "descricao": "curta",
  "imageUrl": "",
  "professor": "Nome do Professor",
  "curso": "Ciência da Computação",
  "vagas": -1,
  "dataAbertura": "2026-08-01",
  "dataEncerramento": "2026-08-20"
}
```

Resposta:

```json
{
  "error": "Payload inválido",
  "issues": [
    { "path": "disciplina", "message": "Disciplina deve ter pelo menos 3 caracteres" },
    { "path": "descricao", "message": "Descrição deve ter pelo menos 10 caracteres" },
    { "path": "imageUrl", "message": "imageUrl não pode ser vazio" },
    { "path": "vagas", "message": "Vagas deve ser maior que zero" }
  ]
}
```

**PUT `/api/editais/1` – atualização parcial (200 OK)**

```json
{ "vagas": 3, "destaque": true }
```

Só os campos enviados são alterados; os demais permanecem como estão.

**PUT `/api/editais/1` – inválido (400 Bad Request)**

```json
{ "vagas": -5 }
```

**DELETE `/api/editais/6`** – responde `204 No Content` (sem corpo). Se o id não existir: `404` com `{ "error": "Edital não encontrado." }`.

## Scripts disponíveis

| Script                    | Comando                   | Descrição                            |
| ------------------------- | ------------------------- | ------------------------------------ |
| `npm run dev`             | `tsx watch src/server.ts` | Roda a API em modo desenvolvimento   |
| `npm run build`           | `tsc`                     | Compila o TypeScript para `dist/`    |
| `npm start`               | `node dist/server.js`     | Roda a API já compilada              |
| `npm run seed`            | `tsx prisma/seed.ts`      | Popula 6 editais e cria o admin      |
| `npm run prisma:migrate`  | `prisma migrate dev`      | Cria/aplica migrations               |
| `npm run prisma:generate` | `prisma generate`         | Gera o Prisma Client                 |
| `npm run prisma:studio`   | `prisma studio`           | Abre o Prisma Studio                 |

## Estrutura de pastas

```
backend/
├── docker-compose.yml
├── .env.example
├── package.json
├── tsconfig.json
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── insomnia/
│   └── Insomnia_Editais.json
└── src/
    ├── app.ts                    # Express, CORS, rotas e tratamento final de erros
    ├── server.ts                 # Sobe o servidor
    ├── prisma.ts                 # Instância do Prisma Client
    ├── config/
    │   └── jwt.ts                # Assinar e verificar JWT (secret/expiração do .env)
    ├── middlewares/
    │   └── auth.middleware.ts    # Valida o Bearer token (401) e preenche req.user
    ├── types/
    │   └── express.d.ts          # Tipagem de req.user
    ├── schemas/
    │   ├── edital.schema.ts      # Schemas Zod (criação e atualização parcial)
    │   └── auth.schema.ts        # Schemas Zod (registro e login)
    ├── controllers/
    │   ├── edital.controller.ts  # Handlers do CRUD + tratamento de erros
    │   └── auth.controller.ts    # register, login e me
    └── routes/
        ├── edital.routes.ts      # GET público; POST/PUT/DELETE protegidos
        └── auth.routes.ts
```

## Autor

- **Nome**: Tadeu dos Santos Jerônimo
- **Matrícula**: 2026202194
- **E-mail**: <tadeus.jeronimo@gmail.com>
- **Disciplina**: Tecnologias Back-End - IF Sudeste/MG
