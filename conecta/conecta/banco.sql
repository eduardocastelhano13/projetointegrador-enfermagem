-- =====================================================================
-- CONECTA - Prontuário Digital de Enfermagem
-- Script único para colar no Supabase (SQL Editor > New query > Run)
--
-- O que cria:
--   1. Tabelas: perfis, unidades_curriculares, pacientes, casos_clinicos,
--      atendimentos, indicadores, anexos
--   2. Funções de apoio e trigger que cria o perfil quando um usuário é criado
--   3. Segurança (RLS): professor escreve, aluno só lê, anônimo não acessa nada
--   4. Bucket de Storage "anexos" para os PDFs
--   5. Dados de exemplo (18 UCs, 4 pacientes, caso da Hermínia na UC8)
--
-- Rode UMA vez em um projeto novo.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. TABELAS
-- ---------------------------------------------------------------------

-- Perfil de cada usuário do login (ligado ao Supabase Auth)
create table public.perfis (
  id         uuid primary key references auth.users (id) on delete cascade,
  nome       text not null,
  papel      text not null default 'aluno' check (papel in ('professor', 'aluno')),
  created_at timestamptz not null default now()
);

-- UC1 a UC18
create table public.unidades_curriculares (
  id     bigint generated always as identity primary key,
  numero int  not null unique,
  nome   text not null
);

-- Pacientes (simulados). "Matar" = status 'obito' + data + motivo.
create table public.pacientes (
  id              bigint generated always as identity primary key,
  nome            text not null,
  sexo            text check (sexo in ('feminino', 'masculino')),
  data_nascimento date,
  avatar_url      text,
  status          text not null default 'ativo' check (status in ('ativo', 'obito')),
  data_obito      timestamptz,
  motivo_obito    text,
  criado_por      uuid default auth.uid() references public.perfis (id) on delete set null,
  created_at      timestamptz not null default now(),
  constraint pacientes_obito_coerente check (
    (status = 'ativo' and data_obito is null)
    or (status = 'obito' and data_obito is not null)
  )
);

-- Casos clínicos de um paciente dentro de uma UC
create table public.casos_clinicos (
  id                bigint generated always as identity primary key,
  paciente_id       bigint not null references public.pacientes (id) on delete cascade,
  uc_id             bigint not null references public.unidades_curriculares (id),
  titulo            text not null,
  descricao         text,
  situacao_problema text,
  criado_por        uuid default auth.uid() references public.perfis (id) on delete set null,
  created_at        timestamptz not null default now()
);

-- Histórico de atendimentos (evolução registrada no prontuário)
create table public.atendimentos (
  id               bigint generated always as identity primary key,
  caso_id          bigint not null references public.casos_clinicos (id) on delete cascade,
  data_atendimento timestamptz not null default now(),
  evolucao         text not null,
  autor_id         uuid default auth.uid() references public.perfis (id) on delete set null,
  created_at       timestamptz not null default now()
);

-- Indicadores de cada UC
create table public.indicadores (
  id        bigint generated always as identity primary key,
  uc_id     bigint not null references public.unidades_curriculares (id) on delete cascade,
  descricao text not null
);

-- PDFs de apoio (o arquivo fica no Storage; aqui fica só o caminho)
create table public.anexos (
  id           bigint generated always as identity primary key,
  uc_id        bigint references public.unidades_curriculares (id) on delete cascade,
  caso_id      bigint references public.casos_clinicos (id) on delete cascade,
  titulo       text not null,
  storage_path text not null,
  created_at   timestamptz not null default now(),
  constraint anexos_tem_destino check (uc_id is not null or caso_id is not null)
);

-- Índices nas chaves estrangeiras (deixam as consultas e o RLS rápidos)
create index pacientes_criado_por_idx  on public.pacientes (criado_por);
create index casos_clinicos_paciente_idx on public.casos_clinicos (paciente_id);
create index casos_clinicos_uc_idx       on public.casos_clinicos (uc_id);
create index atendimentos_caso_idx       on public.atendimentos (caso_id);
create index atendimentos_autor_idx      on public.atendimentos (autor_id);
create index indicadores_uc_idx          on public.indicadores (uc_id);
create index anexos_uc_idx               on public.anexos (uc_id);
create index anexos_caso_idx             on public.anexos (caso_id);


-- ---------------------------------------------------------------------
-- 2. FUNÇÕES DE APOIO (schema "private": não fica exposto na API)
-- ---------------------------------------------------------------------
create schema if not exists private;

-- Diz se quem está logado é professor
create or replace function private.eh_professor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.perfis
    where id = (select auth.uid())
      and papel = 'professor'
  );
$$;

revoke all on function private.eh_professor() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.eh_professor() to authenticated;

-- Cria o perfil quando um usuário é criado no Auth.
-- O tipo de conta ('aluno' ou 'professor') vem da escolha feita no cadastro. Sem escolha, vira aluno.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome, papel)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1)),
    case when new.raw_user_meta_data ->> 'tipo' = 'professor' then 'professor' else 'aluno' end
  );
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
grant usage on schema private to supabase_auth_admin;
grant execute on function private.handle_new_user() to supabase_auth_admin;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Cria o perfil de quem já existia no Auth antes deste script
insert into public.perfis (id, nome, papel)
select id, split_part(email, '@', 1), 'aluno'
from auth.users
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
-- 3. SEGURANÇA (RLS)
--    Professor: lê e escreve tudo.  Aluno: só lê.  Sem login: nada.
-- ---------------------------------------------------------------------

-- perfis: cada um vê o próprio; professor vê todos e é o único que altera
alter table public.perfis enable row level security;
revoke all on table public.perfis from anon;
grant select, update on table public.perfis to authenticated;

create policy perfis_leitura on public.perfis
  for select to authenticated
  using ((select auth.uid()) = id or (select private.eh_professor()));

create policy perfis_professor_atualiza on public.perfis
  for update to authenticated
  using ((select private.eh_professor()))
  with check ((select private.eh_professor()));

-- Demais tabelas: mesma regra para todas
do $$
declare
  t text;
begin
  foreach t in array array[
    'unidades_curriculares', 'pacientes', 'casos_clinicos',
    'atendimentos', 'indicadores', 'anexos'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on table public.%I from anon', t);
    execute format('grant select, insert, update, delete on table public.%I to authenticated', t);

    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      t || '_leitura', t);

    execute format(
      'create policy %I on public.%I for insert to authenticated with check ((select private.eh_professor()))',
      t || '_professor_insere', t);

    execute format(
      'create policy %I on public.%I for update to authenticated using ((select private.eh_professor())) with check ((select private.eh_professor()))',
      t || '_professor_atualiza', t);

    execute format(
      'create policy %I on public.%I for delete to authenticated using ((select private.eh_professor()))',
      t || '_professor_apaga', t);
  end loop;
end $$;


-- ---------------------------------------------------------------------
-- 4. STORAGE (bucket privado "anexos" para os PDFs)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('anexos', 'anexos', false)
on conflict (id) do nothing;

create policy anexos_storage_leitura on storage.objects
  for select to authenticated
  using (bucket_id = 'anexos');

create policy anexos_storage_professor_envia on storage.objects
  for insert to authenticated
  with check (bucket_id = 'anexos' and (select private.eh_professor()));

create policy anexos_storage_professor_atualiza on storage.objects
  for update to authenticated
  using (bucket_id = 'anexos' and (select private.eh_professor()))
  with check (bucket_id = 'anexos' and (select private.eh_professor()));

create policy anexos_storage_professor_apaga on storage.objects
  for delete to authenticated
  using (bucket_id = 'anexos' and (select private.eh_professor()));


-- ---------------------------------------------------------------------
-- 5. DADOS DE EXEMPLO
-- ---------------------------------------------------------------------

insert into public.unidades_curriculares (numero, nome) values
  (1,  'Executar ações de prevenção, promoção, proteção, reabilitação e recuperação da saúde.'),
  (2,  'Participar da implementação da sistematização da assistência de enfermagem.'),
  (3,  'Administrar medicamentos, soluções e imunobiológicos.'),
  (4,  'Estágio Profissional Supervisionado – Promoção à saúde.'),
  (5,  'Prestar cuidados de enfermagem de higiene, conforto e monitoramento das condições clínicas.'),
  (6,  'Prestar assistência de enfermagem em saúde mental.'),
  (7,  'Estágio Profissional Supervisionado – cuidado integral de enfermagem.'),
  (8,  'Prestar assistência de enfermagem no período gestacional, parto, puerpério e ao recém-nascido.'),
  (9,  'Prestar assistência de enfermagem no período perioperatório.'),
  (10, 'Estágio Profissional Supervisionado - cuidado especializado de enfermagem.'),
  (11, 'Projeto Integrador Auxiliar de Enfermagem.'),
  (12, 'Atuar em programas de qualidade e certificação hospitalar.'),
  (13, 'Administrar medicamentos de alta vigilância e hemocomponentes.'),
  (14, 'Prestar assistência de enfermagem em urgência e emergência.'),
  (15, 'Prestar assistência de enfermagem em cuidados críticos.'),
  (16, 'Prestar assistência de enfermagem em cuidados paliativos.'),
  (17, 'Estágio Profissional Supervisionado – cuidado crítico, urgência e emergência em enfermagem.'),
  (18, 'Projeto Integrador Técnico em Enfermagem.')
on conflict (numero) do nothing;

insert into public.pacientes (nome, sexo)
select v.nome, v.sexo
from (values
  ('Hermínia Santos', 'feminino'),
  ('Regina Carvalho', 'feminino'),
  ('Henrique Souza',  'masculino'),
  ('Ronaldo Coimbra', 'masculino')
) as v(nome, sexo)
where not exists (select 1 from public.pacientes);

-- Caso clínico da Hermínia na UC8 (Cuidados ao RN)
insert into public.casos_clinicos (paciente_id, uc_id, titulo, descricao, situacao_problema)
select
  p.id,
  u.id,
  'Cuidados ao RN – Recém-nascida',
  'Puérpera: Hermínia Santos' || E'\n' ||
  'RN: Sexo feminino' || E'\n' ||
  'Idade gestacional: 39 semanas' || E'\n\n' ||
  'Hermínia Santos encontra-se em alojamento conjunto após parto vaginal, acompanhada de sua recém-nascida. O nascimento ocorreu sem intercorrências.' || E'\n' ||
  'Ao nascer, a recém-nascida apresentou choro forte, respiração espontânea, bom tônus muscular e coloração adequada. O Apgar foi 9 no primeiro minuto e 10 no quinto minuto.' || E'\n' ||
  'No momento da avaliação, a RN encontra-se ativa e responsiva, mantendo respiração espontânea e boa adaptação ao ambiente extrauterino. A mãe demonstra interesse em iniciar a amamentação e relata estar insegura sobre os cuidados que devem ser realizados nas primeiras horas de vida.',
  'Você é o profissional de enfermagem responsável pela assistência à recém-nascida nas primeiras horas de vida. Considerando as condições apresentadas e a avaliação inicial da RN, quais cuidados de enfermagem devem ser realizados e quais informações devem ser observadas e registradas no prontuário?'
from public.pacientes p
join public.unidades_curriculares u on u.numero = 8
where p.nome = 'Hermínia Santos'
  and not exists (select 1 from public.casos_clinicos);

-- Indicadores da UC8
insert into public.indicadores (uc_id, descricao)
select u.id, v.descricao
from public.unidades_curriculares u
cross join (values
  ('Orientar a gestante e a puérpera sobre hábitos saudáveis durante a gestação, mudanças no organismo materno, aleitamento materno e cuidados com o recém-nascido, seguindo os protocolos institucionais.'),
  ('Manusear corretamente os equipamentos do berçário, centro de parto normal e centro obstétrico, conforme os protocolos da instituição e as condições clínicas do paciente.'),
  ('Prestar cuidados ao recém-nascido na sala de parto e no berçário, seguindo os protocolos institucionais e os programas de atenção à saúde da mulher.'),
  ('Prestar assistência à mulher durante o pré-parto, parto e pós-parto, conforme os protocolos do Ministério da Saúde e da instituição.'),
  ('Atuar na sala de parto normal e cirúrgico, respeitando os protocolos e normas de segurança da instituição.'),
  ('Realizar a recepção e os cuidados iniciais ao recém-nascido, seguindo práticas seguras durante o parto e nascimento.')
) as v(descricao)
where u.numero = 8
  and not exists (select 1 from public.indicadores i where i.uc_id = u.id);


-- ---------------------------------------------------------------------
-- 6. PROFESSORES
--    No cadastro, a pessoa escolhe "Aluno" ou "Professor" (sem código).
--    Para tornar alguém professor depois (ou voltar a aluno), troque o e-mail e rode:
-- ---------------------------------------------------------------------
-- update public.perfis
--    set papel = 'professor'   -- ou 'aluno'
--  where id = (select id from auth.users where email = 'professor@exemplo.com');
