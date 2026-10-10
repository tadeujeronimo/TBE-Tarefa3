# Frontend – Sistema de Monitorias

Front-end em **React, TypeScript, Vite e Bootstrap 5**, evolução do projeto da Tarefa 4 da disciplina **Tecnologias Front-End**. A lista de editais vem da **API do backend** (`../backend`) e, na Tarefa 3, ganhou **cadastro, login e controle por papel** (`ALUNO` / `ADMIN`).

## Funcionalidades

- Lista de editais carregada da API (`GET /api/editais`) com `useEffect`
- Estados de **carregando** e de **erro**, com botão "Tentar novamente"
- Card com **imagem** (`imageUrl`), descrição, datas e status
- Busca em tempo real por disciplina, professor e curso, e filtros (Todos, Abertos, Encerrados, Destaque)
- **Cadastro e login** de usuários (botões "Entrar" e "Criar conta"); o token JWT fica no `localStorage` e é confirmado em `GET /api/auth/me` ao abrir a página
- **Administrador:** botão "Novo Edital" e botão "Editar" em cada card, gravando na API (`POST`/`PUT /api/editais`) com `Authorization: Bearer <token>`
- **Usuário logado:** formulário de inscrição em monitoria, com nome e e-mail preenchidos pela conta. Visitantes veem o pedido de login
- Se o token expirar (401) a sessão é encerrada e o usuário é avisado
- Layout responsivo com Bootstrap 5

> **Atenção:** a inscrição em monitoria continua só na tela (`useState`) e é perdida ao recarregar a página; o backend ainda não tem endpoint para candidaturas. A segurança real das rotas de escrita está no **backend** (401/403): esconder botões no front é apenas conveniência.

## Quem vê o quê

| Ação                         | Visitante | ALUNO | ADMIN |
| ---------------------------- | :-------: | :---: | :---: |
| Ver, buscar e filtrar editais | sim      | sim   | sim   |
| Inscrever-se em monitoria     | não (pede login) | sim | sim |
| Criar e editar edital         | não      | não   | sim   |

Para testar como administrador, rode `npm run seed` no backend e entre com `ADMIN_EMAIL` / `ADMIN_PASSWORD` do `backend/.env` (padrão `admin@monitorias.com` / `admin123`).

## Como a API é consumida

O acesso à API fica em `src/services/api.ts`:

- URL base: variável `VITE_API_URL` (padrão `http://localhost:3333`).
- Ajusta as datas recebidas: o formato ISO (`2026-06-01T00:00:00.000Z`) vira `2026-06-01`.
- Funções de edital (`fetchEditais`, `criarEdital`, `atualizarEdital`) e de autenticação (`registrarUsuario`, `entrar`, `buscarUsuarioAtual`); as rotas protegidas enviam o header `Authorization: Bearer <token>`.
- A classe `ApiError` carrega o status HTTP e a mensagem da API (inclusive a lista de erros do Zod) para exibir ao usuário.

## Imagens

O campo `imageUrl` guarda apenas o **caminho** da imagem, que fica em `public/images/`:

```
public/images/
├── engenharia-de-software.png
├── programacao-web.png
├── banco-de-dados.png
├── inteligencia-artificial.png
├── machine-learning.png
├── redes-de-computadores.png
└── padrao.png                 # usada por padrão no formulário de novo edital
```

Os nomes correspondem aos do seed do backend. O Vite serve a pasta `public/` na raiz, então `/images/padrao.png` funciona direto no `<img src>`.

## Estrutura de Arquivos

```
src/
├── types/
│   ├── Edital.ts                  # Interface de dados do Edital
│   ├── Candidatura.ts             # Interface de dados da Candidatura
│   └── Usuario.ts                 # Usuário autenticado e papel (ALUNO/ADMIN)
├── services/
│   └── api.ts                     # Chamadas à API (fetch), ApiError e conversão de dados
├── contexts/
│   └── AuthContext.tsx            # Sessão: usuário, token, login, registro e logout
├── components/
│   ├── EditalCard.tsx             # Card individual de edital (botão Editar para admin)
│   ├── BuscaEdital.tsx            # Campo de busca
│   ├── AuthForm.tsx               # Formulário de login / criação de conta
│   ├── EditalForm.tsx             # Criar e editar edital (admin, via API)
│   └── InscricaoMonitoriaForm.tsx # Inscrição em monitoria (exige login; local)
├── vite-env.d.ts                  # Tipos do Vite (import.meta.env)
└── App.tsx                        # Estado central e carregamento da API
```

## Como Executar

O **backend precisa estar rodando**, com o seed já executado (veja `../README.md`). Depois:

```bash
cp .env.example .env    # opcional: só necessário se a API não estiver em localhost:3333
npm install
npm run dev
```

Abra `http://localhost:5173`. Se a API estiver fora do ar, a página mostra a mensagem de erro com o botão "Tentar novamente".

## Autor

- **Nome**: Tadeu dos Santos Jerônimo
- **Matrícula**: 2026202194
- **E-mail**: tadeus.jeronimo@gmail.com
- **Disciplina**: Tecnologias Front-End - IF Sudeste/MG
