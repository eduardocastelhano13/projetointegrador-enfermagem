# VITA

Assistente de inteligência para desenvolvedores. Monorepo com duas partes:

```
vita-project/
├── frontend/   React + Vite — toda a interface do VITA
└── backend/    Express — a única parte que fala com o GitHub OAuth
```

Veja `frontend/README.md` para detalhes de navegação e estrutura de
componentes. Este README cobre a integração com o GitHub (Fase 1 mock +
Fase 2 real) e como rodar os dois lados.

## Rodando os dois lados

**Frontend (sempre necessário):**

```bash
cd frontend
npm install
npm run dev
```

Abre em http://localhost:5173. Sem nenhuma configuração extra, o GitHub
funciona em **modo mock** — é o padrão, e é o que você já vê hoje em
Configurações → GitHub.

**Backend (só necessário para a conexão REAL com o GitHub):**

```bash
cd backend
npm install
cp .env.example .env   # depois preencha com as credenciais da sua OAuth App
npm run dev
```

Sobe em http://localhost:4000. Tem uma rota `GET /health` para checar se
está de pé.

## Modo mock vs. modo real

O frontend decide automaticamente qual modo usar, com base na variável
`VITE_GITHUB_API_URL` (em `frontend/.env`):

- **Sem essa variável (padrão):** tudo simulado em `frontend/src/data/githubMock.js`,
  com o estado "conectado" salvo no `localStorage` do navegador. Não precisa
  do backend rodando.
- **Com `VITE_GITHUB_API_URL=http://localhost:4000/api/github`:** o frontend
  passa a fazer requisições reais para o backend, que troca dados de verdade
  com a API do GitHub.

Isso está implementado em `frontend/src/services/githubService/githubService.js`
— é o único arquivo do frontend que sabe qual modo está ativo; todo o resto
da aplicação (componentes, páginas, contexto) só chama as funções desse
serviço e nunca soube a diferença.

## Como criar a GitHub OAuth App

1. Acesse https://github.com/settings/developers → **New OAuth App**.
2. Preencha:
   - **Application name:** VITA (ou o nome que preferir)
   - **Homepage URL:** `http://localhost:5173`
   - **Authorization callback URL:** `http://localhost:4000/api/github/callback`
3. Crie a app, copie o **Client ID** e gere um **Client Secret**.
4. Cole os dois em `backend/.env` (veja abaixo).

## Configurar as variáveis de ambiente

`backend/.env` (copie de `backend/.env.example`):

```env
GITHUB_CLIENT_ID=<client id da sua OAuth App>
GITHUB_CLIENT_SECRET=<client secret da sua OAuth App>
GITHUB_CALLBACK_URL=http://localhost:4000/api/github/callback
FRONTEND_URL=http://localhost:5173
PORT=4000
SESSION_SECRET=<qualquer string longa e aleatória>
```

`frontend/.env` (copie de `frontend/.env.example`), só se for testar o modo real:

```env
VITE_GITHUB_API_URL=http://localhost:4000/api/github
```

Nenhum dos dois `.env` é commitado — ambos já estão no `.gitignore`
correspondente.

## Testando a conexão

**Modo mock (sem backend):**

1. `npm run dev` só no frontend.
2. Vá em Configurações → clique **Conectar GitHub**.
3. Depois de ~1,4s (simulando a ida e volta), vê "GitHub conectado",
   `@EduardoCastelhano` e a contagem de repositórios mockados.
4. Clique **Ver repositórios**, depois **Adicionar ao VITA** em qualquer
   repositório e escolha um projeto — ele aparece em "Repositório conectado"
   na página daquele projeto.

**Modo real (com backend + OAuth App configurada):**

1. Suba o backend (`npm run dev` em `backend/`) e o frontend, com
   `VITE_GITHUB_API_URL` definido no `frontend/.env`.
2. Em Configurações, clique **Conectar GitHub** — isso redireciona para
   `github.com/login/oauth/authorize`.
3. Autorize a aplicação. O GitHub redireciona para
   `http://localhost:4000/api/github/callback`.
4. O backend troca o código pelo token (fica só na sessão do servidor),
   e redireciona de volta para `http://localhost:5173/settings?github=connected`.
5. O frontend detecta o parâmetro `?github=connected`, atualiza o status,
   e mostra seus dados reais do GitHub — nome, avatar e repositórios de verdade.
6. Se algo falhar no meio do caminho (usuário nega, state inválido, erro na
   troca do token), você volta para `/settings?github=error` com uma
   mensagem de erro.

## O que já está pronto e o que fica para depois

**Pronto nesta etapa:**
- Conexão simulada completa (Fase 1) e conexão real via OAuth (Fase 2)
- Listagem de repositórios (mock e real)
- Vincular um repositório a um projeto do VITA, com o vínculo salvo em
  `localStorage` (`frontend/src/context/GitHubContext.jsx`) — pensado para
  depois virar uma linha na tabela `Project` no Supabase
- Backend com sessão server-side seguindo o fluxo OAuth com proteção CSRF
  (`state` verificado no callback), sem token nenhum chegando ao frontend

**Preparado, mas não implementado (por design, conforme pedido):**
- `getCommits`, `getIssues`, `getPullRequests` existem como stubs em ambos
  os `githubService.js` (frontend e backend) e lançam erro se chamados —
  a forma do serviço já está pronta para receber a implementação real
- Nenhuma chamada ao Gemini ainda; `frontend/src/services/aiService/aiService.js`
  segue mockado, mas já isolado do resto da UI do mesmo jeito que o GitHub
- Persistência em Supabase (hoje: mock em memória + localStorage)
