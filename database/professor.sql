-- CONECTA: cadastro com e-mail ou Google; quem marca "Professor" vira professor (sem código e sem lista).
-- Execute no Supabase > SQL Editor. Confira os nomes das colunas de public.perfis (aqui: id, nome, papel).
-- ATENÇÃO: qualquer pessoa que criar conta marcando "Professor" terá acesso total de professor.

-- 1) Cadastro por e-mail/RA: o papel vem da escolha feita na tela
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_nome text := coalesce(
    nullif(new.raw_user_meta_data->>'nome', ''),
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    split_part(new.email, '@', 1)
  );
  v_papel text := case when new.raw_user_meta_data->>'tipo' = 'professor'
                       then 'professor' else 'aluno' end;
begin
  -- Conta Google: o perfil é criado depois, por criar_perfil_google(), com o tipo escolhido
  -- na tela (aluno ou professor). Se o gatilho criasse aqui, todo mundo viraria aluno antes.
  if coalesce(new.raw_app_meta_data->>'provider', '') = 'google' then
    return new;
  end if;
  insert into public.perfis (id, nome, papel)
  values (new.id, v_nome, v_papel)
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2) Google: depois de voltar do Google, o site chama esta função para criar o perfil de professor
create or replace function public.criar_perfil_google(p_tipo text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_nome text;
  v_papel text;
begin
  if v_uid is null then raise exception 'Não autenticado.'; end if;
  if p_tipo not in ('aluno', 'professor') then raise exception 'Tipo inválido.'; end if;

  select coalesce(nullif(raw_user_meta_data->>'full_name', ''),
                  nullif(raw_user_meta_data->>'name', ''),
                  split_part(email, '@', 1))
    into v_nome from auth.users where id = v_uid;

  insert into public.perfis (id, nome, papel)
  values (v_uid, v_nome, p_tipo)
  on conflict (id) do nothing
  returning papel into v_papel;

  -- se o perfil já existia (por exemplo, criado como aluno), não muda o papel por aqui
  return coalesce(v_papel, (select papel from public.perfis where id = v_uid));
end $$;
revoke all on function public.criar_perfil_google(text) from public, anon;
grant execute on function public.criar_perfil_google(text) to authenticated;

-- 3) Confirme que a RLS de public.perfis NÃO deixa o usuário alterar a própria coluna "papel".

-- 4) (Opcional) Contas de teste que já tinham ficado como "aluno" por causa do erro antigo:
--    apague-as em Authentication > Users e crie de novo, ou corrija o papel manualmente:
--    update public.perfis set papel = 'professor' where id = (select id from auth.users where email = 'SEU_EMAIL');
