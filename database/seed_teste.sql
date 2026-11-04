-- CONECTA: dados de TESTE (20 alunos, provas/atividades, questões e respostas).
-- Rode no Supabase > SQL Editor. Pode rodar de novo: não duplica nada.
-- Alunos: RA 2026001 a 2026020, senha  Aluno@12345  (entram escolhendo "Aluno").
-- Tudo que é de teste começa com "[TESTE]" nos títulos e usa o domínio @alunos.conecta.app.
-- Para apagar tudo, rode o bloco "LIMPEZA" no fim do arquivo.
-- Pré-requisito: já ter rodado o SQL principal e o database/professor.sql (gatilho que cria o perfil).

do $seed$
declare
  nomes text[] := array[
    'Ana Beatriz Souza','Bruno Henrique Lima','Camila Ferreira','Daniel Oliveira','Eduarda Martins',
    'Felipe Araújo','Gabriela Rocha','Heitor Carvalho','Isabela Nunes','João Pedro Alves',
    'Karina Ribeiro','Lucas Gomes','Mariana Costa','Natália Barbosa','Otávio Mendes',
    'Patrícia Duarte','Rafael Teixeira','Sabrina Moreira','Thiago Pereira','Vitória Cardoso'];
  v_uid uuid; v_email text; v_ra text;
  ucs int[]; n_uc int;
  provas jsonb;
  p jsonb; q jsonb;
  v_ativ int; v_qid int; v_tipo_alt text;
  qids int[]; cors int[]; nalts int[];
  pi int; qi int; i int;
  skill numeric; trend numeric; prob numeric; dif numeric;
  ac int; tot int; esc int; det jsonb; resp jsonb; v_data timestamptz;
begin
  perform setseed(0.37);

  -- 1) Alunos (login por RA)
  for i in 1..20 loop
    v_ra := '2026' || lpad(i::text, 3, '0');
    v_email := v_ra || '@alunos.conecta.app';
    if not exists (select 1 from auth.users where email = v_email) then
      v_uid := gen_random_uuid();
      insert into auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
        confirmation_token, recovery_token, email_change, email_change_token_new)
      values (
        '00000000-0000-0000-0000-000000000000', v_uid, 'authenticated', 'authenticated', v_email,
        extensions.crypt('Aluno@12345', extensions.gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('nome', nomes[i], 'tipo', 'aluno', 'ra', v_ra),
        now() - (30 - i) * interval '1 day', now(), '', '', '', '');
      insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
      values (gen_random_uuid(), v_uid, v_uid::text,
        jsonb_build_object('sub', v_uid::text, 'email', v_email, 'email_verified', true),
        'email', now(), now(), now());
    end if;
  end loop;

  -- 2) Unidades curriculares (usa as que já existem; cria 4 só se não houver nenhuma)
  select array_agg(id order by numero) into ucs from public.unidades_curriculares;
  if ucs is null then
    insert into public.unidades_curriculares (numero, nome) values
      (1,'Fundamentos de Enfermagem'),(2,'Biossegurança'),(3,'Farmacologia aplicada'),(4,'Semiologia e Semiotécnica');
    select array_agg(id order by numero) into ucs from public.unidades_curriculares;
  end if;
  n_uc := array_length(ucs, 1);

  -- 3) Provas e atividades de múltipla escolha (dias > 0 = já passou e recebe respostas)
  provas := $j$[
   {"t":"[TESTE] Prova 1 - Sinais vitais","dias":42,"uc":1,"tipo":"prova","qs":[
     {"e":"Qual a faixa normal de frequência cardíaca de um adulto em repouso?","a":["20 a 40 bpm","60 a 100 bpm","110 a 140 bpm","150 a 180 bpm"],"c":1},
     {"e":"Qual a faixa normal da temperatura axilar em adultos?","a":["32 a 34 °C","38 a 39 °C","35,5 a 37,4 °C","40 a 41 °C"],"c":2},
     {"e":"Qual a frequência respiratória normal de um adulto em repouso?","a":["4 a 8 irpm","12 a 20 irpm","25 a 35 irpm","40 a 50 irpm"],"c":1},
     {"e":"Uma pressão arterial de 150/95 mmHg é compatível com:","a":["Pressão normal","Hipotensão","Hipertensão","Choque"],"c":2},
     {"e":"Qual saturação de oxigênio é considerada adequada na maioria dos adultos?","a":["70% ou menos","80%","85%","95% ou mais"],"c":3}]},
   {"t":"[TESTE] Prova 2 - Biossegurança e higienização","dias":28,"uc":2,"tipo":"prova","qs":[
     {"e":"Em qual momento a higiene das mãos é indispensável?","a":["Somente após o plantão","Antes e depois do contato com o paciente","Só quando as mãos estiverem visivelmente sujas","Apenas antes de refeições"],"c":1},
     {"e":"Qual o tempo recomendado para a fricção das mãos com álcool em gel?","a":["5 segundos","20 a 30 segundos","2 minutos","Não precisa de tempo mínimo"],"c":1},
     {"e":"Quais EPIs são indicados na precaução de contato?","a":["Somente máscara","Luvas e avental","Somente óculos","Touca e propé apenas"],"c":1},
     {"e":"Onde devem ser descartados agulhas e outros perfurocortantes?","a":["Lixo comum","Saco branco leitoso","Caixa rígida própria para perfurocortantes","Pia do expurgo"],"c":2},
     {"e":"Qual a ordem correta de paramentação?","a":["Luvas, avental, máscara, óculos","Avental, máscara, óculos, luvas","Máscara, luvas, óculos, avental","Óculos, luvas, avental, máscara"],"c":1}]},
   {"t":"[TESTE] Prova 3 - Administração de medicamentos","dias":21,"uc":3,"tipo":"prova","qs":[
     {"e":"Quantos são os certos da administração segura de medicamentos?","a":["3","5","9","12"],"c":2},
     {"e":"A sigla IV, em uma prescrição, indica a via:","a":["Intramuscular","Intravenosa","Intradérmica","Inalatória"],"c":1},
     {"e":"Foram prescritos 500 mg e o comprimido disponível tem 250 mg. Quantos comprimidos administrar?","a":["1","2","3","4"],"c":1},
     {"e":"Prescrição de 1000 mL de soro em 8 horas. Quantas gotas por minuto (fator 20 gotas = 1 mL)?","a":["21","42","83","125"],"c":1},
     {"e":"O que verificar antes de administrar um medicamento?","a":["Apenas o horário","Alergias do paciente e prescrição","Somente o nome do leito","Nada além do rótulo"],"c":1}]},
   {"t":"[TESTE] Prova 4 - Curativos e feridas","dias":14,"uc":4,"tipo":"prova","qs":[
     {"e":"Qual o principal objetivo do curativo?","a":["Apenas esconder a ferida","Proteger a ferida e favorecer a cicatrização","Aumentar a secreção","Impedir o movimento"],"c":1},
     {"e":"Qual solução é a mais indicada para limpeza da maioria das feridas?","a":["Álcool 70%","Soro fisiológico 0,9%","Água oxigenada pura","Éter"],"c":1},
     {"e":"Qual conjunto representa sinais clássicos de infecção local?","a":["Palidez e frio","Calor, rubor, edema, dor e secreção purulenta","Apenas coceira","Somente sangramento"],"c":1},
     {"e":"A limpeza da ferida deve seguir qual direção?","a":["Da área mais contaminada para a menos contaminada","Em movimentos circulares de fora para dentro","Da área menos contaminada para a mais contaminada","Tanto faz"],"c":2},
     {"e":"Quando trocar o curativo?","a":["Nunca, até cicatrizar","Quando estiver saturado, sujo ou solto","Apenas uma vez por semana","Somente se o paciente pedir"],"c":1}]},
   {"t":"[TESTE] Atividade 5 - Processo de enfermagem","dias":7,"uc":1,"tipo":"tarefa","qs":[
     {"e":"Qual etapa do processo de enfermagem reúne os dados do paciente?","a":["Implementação","Histórico de enfermagem (investigação)","Avaliação","Planejamento"],"c":1},
     {"e":"O diagnóstico de enfermagem é:","a":["Uma prescrição médica","Um julgamento clínico sobre as respostas do paciente","Um exame laboratorial","Uma alta hospitalar"],"c":1},
     {"e":"No planejamento definem-se:","a":["Somente os horários de visita","Resultados esperados e intervenções","Apenas o diagnóstico médico","Os custos da internação"],"c":1},
     {"e":"A implementação corresponde a:","a":["Execução das ações planejadas","Coleta do histórico","Avaliação final","Registro de óbito"],"c":0},
     {"e":"A etapa de avaliação serve para:","a":["Escolher o leito","Verificar se os resultados esperados foram alcançados","Substituir o diagnóstico","Dar alta sempre"],"c":1}]},
   {"t":"[TESTE] Prova 6 - Cuidados com o idoso (próxima)","dias":-10,"uc":4,"tipo":"prova","qs":[
     {"e":"Qual medida ajuda a prevenir quedas em idosos?","a":["Piso molhado","Iluminação adequada e remoção de tapetes soltos","Calçados folgados","Camas muito altas"],"c":1},
     {"e":"Qual cuidado previne lesão por pressão?","a":["Manter o paciente sempre na mesma posição","Mudança de decúbito periódica","Evitar hidratação da pele","Usar lençol com dobras"],"c":1},
     {"e":"A polifarmácia no idoso aumenta o risco de:","a":["Interações medicamentosas","Maior imunidade","Melhor sono sempre","Menor necessidade de acompanhamento"],"c":0}]}
  ]$j$::jsonb;

  select data_type into v_tipo_alt from information_schema.columns
    where table_schema = 'public' and table_name = 'questoes' and column_name = 'alternativas';

  for pi in 0 .. jsonb_array_length(provas) - 1 loop
    p := provas -> pi;
    if exists (select 1 from public.atividades where titulo = p->>'t') then continue; end if;
    v_data := now() - ((p->>'dias')::int) * interval '1 day';

    insert into public.atividades (tipo, titulo, descricao, uc_id, data_limite, formato)
    values (p->>'tipo', p->>'t', 'Atividade de teste gerada automaticamente.',
            ucs[((p->>'uc')::int - 1) % n_uc + 1], v_data, 'multipla_escolha')
    returning id into v_ativ;

    qids := '{}'; cors := '{}'; nalts := '{}';
    for qi in 0 .. jsonb_array_length(p->'qs') - 1 loop
      q := p->'qs'->qi;
      if v_tipo_alt = 'ARRAY' then
        insert into public.questoes (atividade_id, ordem, enunciado, alternativas)
        values (v_ativ, qi, q->>'e', array(select jsonb_array_elements_text(q->'a')))
        returning id into v_qid;
      else
        insert into public.questoes (atividade_id, ordem, enunciado, alternativas)
        values (v_ativ, qi, q->>'e', q->'a')
        returning id into v_qid;
      end if;
      insert into public.gabaritos (questao_id, correta) values (v_qid, (q->>'c')::int);
      qids := qids || v_qid; cors := cors || (q->>'c')::int; nalts := nalts || jsonb_array_length(q->'a');
    end loop;

    -- 4) Respostas dos alunos (só para provas que já passaram)
    if (p->>'dias')::int > 0 then
      for i in 1..20 loop
        continue when i = 17;                       -- aluno sem nenhuma resposta (para testar "sem respostas")
        continue when random() < 0.12;              -- alguns alunos faltam a uma prova
        select id into v_uid from auth.users where email = '2026' || lpad(i::text, 3, '0') || '@alunos.conecta.app';
        if v_uid is null then continue; end if;
        skill := 0.30 + 0.65 * ((i * 7) % 20) / 19.0;        -- nível de cada aluno
        trend := (((i * 3) % 5) - 2) * 0.05;                 -- uns melhoram, outros pioram
        ac := 0; tot := array_length(qids, 1); det := '[]'::jsonb; resp := '{}'::jsonb;
        for qi in 1..tot loop
          dif := case when (pi * 5 + qi) % 7 = 3 then 0.25 else 0 end;   -- algumas questões são mais difíceis
          prob := least(0.97, greatest(0.05, skill + trend * (pi - 2) - dif));
          if random() < prob then
            esc := cors[qi]; ac := ac + 1;
          else
            loop
              esc := floor(random() * nalts[qi])::int;
              exit when esc <> cors[qi];
            end loop;
          end if;
          resp := resp || jsonb_build_object(qids[qi]::text, esc);   -- formato do app: { id_da_questão: alternativa marcada }
          det := det || jsonb_build_object('q', qids[qi], 'escolhida', esc, 'correta', cors[qi], 'acertou', esc = cors[qi]);
        end loop;
        insert into public.respostas_alunos (atividade_id, aluno_id, respostas, nota, acertos, total, detalhe, enviado_em)
        values (v_ativ, v_uid, resp, round(ac::numeric / tot * 10, 1), ac, tot, det,
                v_data - random() * interval '30 hours');
      end loop;
    end if;
  end loop;

  -- 5) Atividades de escrita (sem questões), para testar entregas e calendário
  insert into public.atividades (tipo, titulo, descricao, uc_id, data_limite, formato)
  select 'tarefa', t, 'Atividade de teste (entrega em arquivo ou texto).', ucs[1], now() + d * interval '1 day', 'escrita'
  from (values ('[TESTE] Estudo de caso - Paciente com diabetes', 5),
               ('[TESTE] Relatório de estágio - Semana 1', 12)) v(t, d)
  where not exists (select 1 from public.atividades a where a.titulo = v.t);
end
$seed$;

-- ============ LIMPEZA (rode só se quiser apagar tudo que é de teste) ============
-- delete from public.respostas_alunos where atividade_id in (select id from public.atividades where titulo like '[TESTE]%');
-- delete from public.gabaritos where questao_id in (select q.id from public.questoes q join public.atividades a on a.id = q.atividade_id where a.titulo like '[TESTE]%');
-- delete from public.questoes where atividade_id in (select id from public.atividades where titulo like '[TESTE]%');
-- delete from public.atividades where titulo like '[TESTE]%';
-- delete from auth.users where email like '2026___@alunos.conecta.app';   -- apaga também os perfis (se houver "on delete cascade")
