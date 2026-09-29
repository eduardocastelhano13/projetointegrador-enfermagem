-- =====================================================================
-- ATUALIZAÇÃO: dois tipos de conta (aluno e professor) no cadastro
-- Rode SÓ se você já executou o banco.sql antes. (Instalação nova: use só o banco.sql.)
-- =====================================================================
create schema if not exists private;

-- Código secreto para criar conta de PROFESSOR (fica só no banco, nunca no site)
create table if not exists private.config (
  chave text primary key,
  valor text not null
);
alter table private.config enable row level security; -- sem policies: ninguém acessa pela API
revoke all on table private.config from public, anon, authenticated;

-- Cria o perfil quando um usuário é criado no Auth.
-- Tipo 'aluno' (padrão) ou 'professor'. Professor só é aceito com o código correto.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_papel text := 'aluno';
begin
  if new.raw_user_meta_data ->> 'tipo' = 'professor' then
    if coalesce(new.raw_user_meta_data ->> 'codigo_professor', '') is distinct from
       (select valor from private.config where chave = 'codigo_professor') then
      raise exception 'codigo_professor_invalido';
    end if;
    v_papel := 'professor';
  end if;

  insert into public.perfis (id, nome, papel)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1)),
    v_papel
  );

  -- não deixa o código guardado no cadastro do usuário
  update auth.users set raw_user_meta_data = raw_user_meta_data - 'codigo_professor' where id = new.id;
  return new;
end;
$$;

-- Defina o código de professor (troque SEU_CODIGO) e rode esta linha:
-- insert into private.config (chave, valor) values ('codigo_professor', 'SEU_CODIGO')
-- on conflict (chave) do update set valor = excluded.valor;
