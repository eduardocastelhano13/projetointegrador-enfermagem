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
│   ├── medicamentos.js   Lista de medicamentos (PT), busca e bula resumida (openFDA)
│   └── professor.js      Painel do professor
└── assets/logo.png
```

## Como rodar
1. Rode o `conecta_supabase.sql` no SQL Editor do Supabase.
2. Preencha `js/config.js` com a URL e a chave publicável do projeto.
3. Abra a pasta no VS Code e use a extensão **Live Server** no `index.html`.

## Medicamentos
- **Professor:** em *Novo/Editar caso clínico*, bloco "Medicamentos sugeridos". **Aluno:** em *Registrar o que fiz*, bloco "Medicamentos administrados" (dose, via, horário, observação); os sugeridos aparecem como atalhos.
- A busca usa a lista local em português (`js/medicamentos.js`), instantânea. Se o remédio não estiver nela, o aluno clica em **"Buscar na base da Anvisa"** (API medicamentos.api.br) ou adiciona o nome digitado.
- "Ver bula resumida (FDA)" usa a openFDA (bula dos EUA, em inglês). Itens vindos da Anvisa ganham o link "Bula oficial (Anvisa)".

### Configuração (uma vez)
1. Rode `database/medicamentos.sql` no SQL Editor do Supabase (pode rodar de novo, não duplica nada).
2. Crie uma chave grátis em https://medicamentos.api.br/api (confirme o e-mail; a chave aparece uma única vez).
3. Publique a função `supabase/functions/buscar-medicamentos/index.ts`:
   - Painel: **Edge Functions → Deploy a new function**, nome `buscar-medicamentos`, cole o código de `index.ts`; ou pela CLI: `supabase functions deploy buscar-medicamentos`.
   - Em **Edge Functions → Secrets**, crie `MEDICAMENTOS_API_KEY` com a chave do passo 2 (ou `supabase secrets set MEDICAMENTOS_API_KEY=...`).
4. A chave NUNCA vai em `js/config.js`: ela fica só no servidor.

Limites do plano grátis: 100 consultas/dia e 1.000/mês para todo o app (a bula completa em JSON é do plano Pro). Por isso a busca online só roda ao clicar, e a função guarda cada resposta em cache por 30 dias na tabela `medicamentos_cache`: se outro aluno buscar a mesma palavra, não gasta cota.
