# VITA — Frontend

Assistente de inteligência para desenvolvedores. Esta etapa é somente
frontend: dados de projetos, GitHub e IA são mockados e estruturados para
depois vir de uma API real (GitHub → Backend → Supabase / Gemini → VITA).

## Rodar localmente

```bash
npm install
npm run dev
```

Abra o endereço que o Vite mostrar no terminal (normalmente http://localhost:5173).

## Navegação

```
⌂ Dashboard        /
▣ Projetos         /projects
  Projeto          /projects/:id
✦ Conversar c/VITA  /chat
◷ Sessão           /session
⚙ Configurações    /settings
```

Sidebar no desktop (fixa, à esquerda) e barra inferior no mobile — ambas
usando o mesmo `<Sidebar />`.

## Estrutura

```
src/
├── components/
│   ├── VitaOrb           núcleo visual do VITA (idle/analyzing/working/break/done)
│   ├── WelcomeSequence    sequência de abertura (boas-vindas + análise simulada)
│   ├── Sidebar            navegação principal (desktop + mobile)
│   ├── Header             logo, subtítulo e usuário
│   ├── Dashboard          tela inicial pós-introdução
│   ├── FocusCard          card "Seu foco agora"
│   ├── ProjectCard        card de projeto (modo compacto e modo completo)
│   ├── ProjectsSection    grid "Seus projetos" (usado no Dashboard)
│   ├── TaskList           checklist de tarefas de um projeto
│   ├── WorkSession        mini card de sessão (usa o SessionContext)
│   ├── ChatMessage        balão de mensagem da conversa
│   ├── ChatInput          campo de mensagem + seletor de projeto
│   └── AIStatus           orb pequeno + status ("pronto"/"pensando")
├── context/
│   └── SessionContext.jsx estado global da sessão de trabalho (cronômetro,
│                          projeto, pausa) — compartilhado entre Dashboard e Sessão
├── services/
│   └── aiService/         camada única de acesso à IA; hoje retorna respostas
│                          mockadas, pronta para ser trocada por uma chamada
│                          ao backend que fala com o Gemini
├── data/
│   └── mockData.js        projetos, tarefas e usuário mock
├── pages/
│   ├── Projects            grid completo de projetos
│   ├── ProjectDetails       tarefas, progresso e recomendação de um projeto
│   ├── Chat                 conversa com o VITA
│   ├── Session               página cheia da sessão de trabalho
│   └── Settings              conta, integrações (ainda não conectadas) e preferências
└── styles/
    └── globals.css        tokens de cor, tipografia e layout do app shell
```

## IA / Gemini

`src/services/aiService/aiService.js` é o único lugar que a UI chama para
falar com o VITA. Hoje `sendMessage()` simula uma resposta; no futuro, o
corpo dessa função deve virar uma chamada ao backend, que por sua vez chama o
Gemini:

```
Frontend → Backend / API → Gemini API → VITA
```

A `GEMINI_API_KEY` nunca deve entrar em nenhum arquivo do frontend — nem em
`aiService`, nem em variáveis `VITE_*` públicas. Ela mora só no backend.

## Próximos passos (fora do escopo desta etapa)

- Autenticação e usuário real
- Integração com a API do GitHub (repositórios, commits, issues, PRs)
- Persistência em Supabase (projetos, tarefas, sessões, preferências)
- Backend + Gemini substituindo `mockResponse()` em `aiService`
- Notificações reais de pausa
