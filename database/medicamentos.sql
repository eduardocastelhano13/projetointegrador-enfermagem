-- CONECTA: medicamentos sugeridos pelo professor (no caso clínico)
-- e medicamentos administrados pelo aluno (no atendimento).
-- Execute no Supabase > SQL Editor. Pode rodar mais de uma vez.
-- Pré-requisito: já existirem public.perfis (id, nome, papel), public.casos_clinicos e
-- public.atendimentos (com coluna autor_id = id do aluno que registrou).

-- Ajudante: o usuário logado é professor?
create or replace function public.med_eh_professor()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.perfis where id = auth.uid() and papel = 'professor');
$$;
revoke all on function public.med_eh_professor() from public, anon;
grant execute on function public.med_eh_professor() to authenticated;

-- 1) Sugeridos pelo professor
create table if not exists public.caso_medicamentos (
  id          bigint generated always as identity primary key,
  caso_id     bigint not null references public.casos_clinicos(id) on delete cascade,
  nome        text not null check (char_length(nome) between 1 and 120),
  dose        text check (dose is null or char_length(dose) <= 60),
  via         text check (via is null or char_length(via) <= 20),
  observacao  text check (observacao is null or char_length(observacao) <= 200),
  created_at  timestamptz not null default now()
);
create index if not exists caso_medicamentos_caso_idx on public.caso_medicamentos (caso_id);

-- 2) Administrados pelo aluno
create table if not exists public.atendimento_medicamentos (
  id              bigint generated always as identity primary key,
  atendimento_id  bigint not null references public.atendimentos(id) on delete cascade,
  nome            text not null check (char_length(nome) between 1 and 120),
  dose            text check (dose is null or char_length(dose) <= 60),
  via             text check (via is null or char_length(via) <= 20),
  horario         time,
  observacao      text check (observacao is null or char_length(observacao) <= 200),
  created_at      timestamptz not null default now()
);
create index if not exists atendimento_medicamentos_at_idx on public.atendimento_medicamentos (atendimento_id);

alter table public.caso_medicamentos enable row level security;
alter table public.atendimento_medicamentos enable row level security;

grant select, insert, update, delete on public.caso_medicamentos to authenticated;
grant select, insert, update, delete on public.atendimento_medicamentos to authenticated;

-- Sugeridos: todos leem; só professor escreve
drop policy if exists caso_med_ler on public.caso_medicamentos;
create policy caso_med_ler on public.caso_medicamentos
  for select to authenticated using (true);

drop policy if exists caso_med_professor on public.caso_medicamentos;
create policy caso_med_professor on public.caso_medicamentos
  for all to authenticated
  using (public.med_eh_professor()) with check (public.med_eh_professor());

-- Administrados: todos leem (como os atendimentos); o autor do atendimento escreve; professor também
drop policy if exists at_med_ler on public.atendimento_medicamentos;
create policy at_med_ler on public.atendimento_medicamentos
  for select to authenticated using (true);

drop policy if exists at_med_autor on public.atendimento_medicamentos;
create policy at_med_autor on public.atendimento_medicamentos
  for all to authenticated
  using (
    public.med_eh_professor()
    or exists (select 1 from public.atendimentos a
               where a.id = atendimento_id and a.autor_id = auth.uid())
  )
  with check (
    public.med_eh_professor()
    or exists (select 1 from public.atendimentos a
               where a.id = atendimento_id and a.autor_id = auth.uid())
  );

-- 3) Registro Anvisa (opcional): guarda o número do registro quando o medicamento veio da busca online,
--    para abrir a bula oficial no Bulário da Anvisa.
alter table public.caso_medicamentos
  add column if not exists registro_anvisa text check (registro_anvisa is null or registro_anvisa ~ '^[0-9]{9}$');
alter table public.atendimento_medicamentos
  add column if not exists registro_anvisa text check (registro_anvisa is null or registro_anvisa ~ '^[0-9]{9}$');

-- 4) Cache da busca online (medicamentos.api.br). Só a Edge Function "buscar-medicamentos" acessa:
--    com a RLS ligada e sem policies, ninguém pelo navegador lê nem escreve aqui.
create table if not exists public.medicamentos_cache (
  termo         text primary key,
  resultado     jsonb not null,
  atualizado_em timestamptz not null default now()
);
alter table public.medicamentos_cache enable row level security;
revoke all on public.medicamentos_cache from anon, authenticated;
