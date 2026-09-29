# CONECTA – Prontuário Digital de Enfermagem

Front-end em HTML/CSS/JS puro + Supabase (Auth, Postgres e Storage).

## Estrutura
```
conecta/
├── index.html            Login
├── pages/
│   ├── cadastro.html     Criar conta (Aluno ou Professor)
│   ├── aluno.html        Dashboard do aluno (somente leitura)
│   └── professor.html    Painel do professor (em construção)
├── css/
│   ├── base.css          Cores, fontes e botões
│   ├── login.css         Só da tela de login
│   └── painel.css        Só dos painéis
├── js/
│   ├── config.js         URL e chave do Supabase (edite este)
│   ├── auth.js           Conexão + login/logout + proteção por papel
│   ├── login.js          Tela de login
│   ├── cadastro.js       Criar conta
│   ├── aluno.js          Dashboard do aluno
│   └── professor.js      Painel do professor
└── assets/logo.png
```

## Como rodar
1. Rode o `conecta_supabase.sql` no SQL Editor do Supabase.
2. Preencha `js/config.js` com a URL e a chave publicável do projeto.
3. Abra a pasta no VS Code e use a extensão **Live Server** no `index.html`.
