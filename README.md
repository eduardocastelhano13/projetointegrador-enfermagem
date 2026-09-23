# VITA — Etapa 1 (Frontend)

Experiência de entrada + dashboard do VITA, o assistente de inteligência para
desenvolvedores. Esta etapa é somente frontend: dados de projetos, GitHub e IA
são mockados e estruturados para depois vir de uma API real.

## Rodar localmente

```bash
npm install
npm run dev
```

Abra o endereço que o Vite mostrar no terminal (normalmente http://localhost:5173).

## Estrutura

```
src/
├── components/
│   ├── VitaOrb           núcleo visual do VITA, com estados (idle/analyzing/working/break/done)
│   ├── WelcomeSequence    sequência de abertura (boas-vindas + análise simulada)
│   ├── Dashboard          tela principal pós-introdução
│   ├── Header             logo, subtítulo e usuário
│   ├── FocusCard          card "Seu foco agora"
│   ├── ProjectCard        card individual de projeto
│   ├── ProjectsSection    grid "Seus projetos"
│   └── WorkSession        cronômetro de sessão + sugestão de pausa
├── data/
│   └── mockProjects.js    dados mock (formato pensado para vir do Supabase/GitHub)
├── pages/
│   └── Home               monta o Dashboard
└── styles/
    └── globals.css        tokens de cor, tipografia e variáveis globais
```

## Próximos passos (fora do escopo desta etapa)

- Autenticação e usuário real
- Integração com a API do GitHub (repositórios, commits, issues, PRs)
- Persistência em Supabase
- Recomendações geradas por IA
- Notificações reais de pausa
