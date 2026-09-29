// Painel do professor: cria, edita e apaga pacientes, casos, atendimentos, indicadores e PDFs; registra óbito.
(async () => {
  const perfil = await exigirPapel('professor');
  if (!perfil) return;

  const tela = document.getElementById('tela');
  const primeiro = perfil.nome.trim().split(/\s+/)[0];
  const nomeBonito = primeiro.charAt(0).toUpperCase() + primeiro.slice(1);
  document.getElementById('nome').textContent = perfil.nome;
  document.getElementById('inicial').textContent = nomeBonito[0];
  document.getElementById('sair').addEventListener('click', sair);

  const ICONES = {
    inicio: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    pacientes: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .6 3.5 2.4 3.5 5.5"/>',
    casos: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
    ucs: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M9 8h6"/>',
    alunos: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/>',
    sair: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    coracao: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/><path d="M6 12h3l1.5-3 3 6 1.5-3h3"/>',
  };
  const ico = (n) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONES[n]}</svg>`;
  document.getElementById('sair').innerHTML = ico('sair');

  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dia = (d) => new Date(d).toLocaleDateString('pt-BR');
  const diaHora = (d) => new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const localInput = (d = new Date()) => { const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };
  const falha = (e) => { tela.innerHTML = `<p class="vazio">Não foi possível carregar os dados (${esc(e.message)}). Atualize a página.</p>`; };
  const avatar = (p) => p.avatar_url
    ? `<img class="avatar" src="${esc(p.avatar_url)}" alt="">`
    : `<span class="avatar ${p.sexo === 'masculino' ? 'm' : 'f'}" aria-hidden="true">${esc(p.nome[0])}</span>`;
  const selo = (p) => p.status === 'obito' ? '<span class="selo">Óbito</span>' : '<span class="selo ok">Ativo</span>';
  const go = (hash) => { if (location.hash === hash) rotear(); else location.hash = hash; };

  // executa uma chamada do Supabase e lança erro se falhar
  const ok = async (promessa) => { const r = await promessa; if (r.error) throw new Error(r.error.message); return r.data; };

  // ---------- janelas (modais) ----------
  function modal(html) {
    const d = document.createElement('dialog');
    d.className = 'modal';
    d.innerHTML = html;
    document.body.appendChild(d);
    d.addEventListener('close', () => d.remove());
    d.showModal();
    return d;
  }

  const campoHtml = (c) => {
    const v = c.val ?? '', id = 'f_' + c.n, req = c.req ? 'required' : '';
    let el;
    if (c.t === 'textarea') el = `<textarea id="${id}" name="${c.n}" rows="${c.rows || 4}" ${req}>${esc(v)}</textarea>`;
    else if (c.t === 'select') el = `<select id="${id}" name="${c.n}" ${req}><option value="">Selecione…</option>${(c.opts || []).map(([val, l]) => `<option value="${esc(val)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    else if (c.t === 'file') el = `<input id="${id}" name="${c.n}" type="file" accept="${c.accept || ''}" ${req}>`;
    else el = `<input id="${id}" name="${c.n}" type="${c.t || 'text'}" value="${esc(v)}" ${req} autocomplete="off">`;
    return `<label class="campo2"><span>${esc(c.r)}${c.req ? ' *' : ''}</span>${el}${c.dica ? `<small>${esc(c.dica)}</small>` : ''}</label>`;
  };

  function formulario({ titulo, texto = '', campos = [], botao = 'Salvar', perigo = false, aoEnviar }) {
    const d = modal(`<form>
      <h2>${esc(titulo)}</h2>${texto ? `<p>${texto}</p>` : ''}
      ${campos.map(campoHtml).join('')}
      <p class="erro" role="alert"></p>
      <div class="rodape"><button type="button" class="btn claro peq" data-cancelar>Cancelar</button>
        <button type="submit" class="btn peq ${perigo ? 'perigo' : 'teal'}">${esc(botao)}</button></div></form>`);
    const f = d.querySelector('form'), erro = d.querySelector('.erro'), enviar = f.querySelector('[type=submit]');
    d.querySelector('[data-cancelar]').addEventListener('click', () => d.close());
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const vals = {};
      campos.forEach((c) => { const el = f.elements[c.n]; vals[c.n] = c.t === 'file' ? el.files[0] || null : el.value.trim(); });
      enviar.disabled = true; erro.textContent = '';
      try { await aoEnviar(vals); d.close(); rotear(); }
      catch (err) { erro.textContent = err.message; enviar.disabled = false; }
    });
    return d;
  }

  const confirmar = ({ titulo, texto, botao = 'Confirmar', digitar, acao }) => formulario({
    titulo, texto, botao, perigo: true,
    campos: digitar ? [{ n: 'conf', r: `Digite "${digitar}" para confirmar`, req: true }] : [],
    aoEnviar: async (v) => {
      if (digitar && v.conf.toLowerCase() !== digitar.toLowerCase()) throw new Error('O texto digitado não confere.');
      await acao();
    },
  });

  async function subir(bucket, pasta, arquivo) {
    const ext = (arquivo.name.split('.').pop() || 'bin').toLowerCase();
    const caminho = `${pasta}/${crypto.randomUUID()}.${ext}`;
    const { error } = await db.storage.from(bucket).upload(caminho, arquivo, { contentType: arquivo.type });
    if (error) throw new Error(error.message);
    return caminho;
  }

  // ---------- formulários de cada ação ----------
  async function formPaciente(id) {
    const p = id ? await ok(db.from('pacientes').select('*').eq('id', id).single()) : {};
    formulario({
      titulo: id ? 'Editar paciente' : 'Novo paciente', botao: id ? 'Salvar' : 'Criar paciente',
      campos: [
        { n: 'nome', r: 'Nome', req: true, val: p.nome },
        { n: 'sexo', r: 'Sexo', t: 'select', req: true, val: p.sexo, opts: [['feminino', 'Feminino'], ['masculino', 'Masculino']] },
        { n: 'data_nascimento', r: 'Data de nascimento', t: 'date', val: p.data_nascimento },
        { n: 'foto', r: 'Foto', t: 'file', accept: 'image/*', dica: id ? 'Deixe vazio para manter a foto atual.' : 'Opcional. Sem foto, aparece a inicial do nome.' },
      ],
      aoEnviar: async (v) => {
        const dados = { nome: v.nome, sexo: v.sexo, data_nascimento: v.data_nascimento || null };
        if (v.foto) {
          const c = await subir('avatares', 'pacientes', v.foto);
          dados.avatar_url = db.storage.from('avatares').getPublicUrl(c).data.publicUrl;
        }
        if (id) await ok(db.from('pacientes').update(dados).eq('id', id));
        else { const novo = await ok(db.from('pacientes').insert(dados).select('id').single()); location.hash = `#/paciente/${novo.id}`; }
      },
    });
  }

  async function formCaso(id, pacienteId, ucId) {
    const [pac, ucs, k] = await Promise.all([
      ok(db.from('pacientes').select('id, nome').order('nome')),
      ok(db.from('unidades_curriculares').select('id, numero, nome').order('numero')),
      id ? ok(db.from('casos_clinicos').select('*').eq('id', id).single()) : {},
    ]);
    formulario({
      titulo: id ? 'Editar caso clínico' : 'Novo caso clínico', botao: id ? 'Salvar' : 'Criar caso',
      campos: [
        { n: 'paciente_id', r: 'Paciente', t: 'select', req: true, val: k.paciente_id || pacienteId, opts: pac.map((p) => [p.id, p.nome]) },
        { n: 'uc_id', r: 'Unidade curricular', t: 'select', req: true, val: k.uc_id || ucId, opts: ucs.map((u) => [u.id, `UC${u.numero} - ${u.nome}`]) },
        { n: 'titulo', r: 'Título', req: true, val: k.titulo },
        { n: 'descricao', r: 'Descrição do caso', t: 'textarea', rows: 6, val: k.descricao },
        { n: 'situacao_problema', r: 'Situação-problema', t: 'textarea', rows: 5, val: k.situacao_problema, dica: 'A pergunta que o aluno deve responder.' },
      ],
      aoEnviar: async (v) => {
        const dados = { paciente_id: Number(v.paciente_id), uc_id: Number(v.uc_id), titulo: v.titulo, descricao: v.descricao || null, situacao_problema: v.situacao_problema || null };
        if (id) await ok(db.from('casos_clinicos').update(dados).eq('id', id));
        else { const novo = await ok(db.from('casos_clinicos').insert(dados).select('id').single()); location.hash = `#/caso/${novo.id}`; }
      },
    });
  }

  async function formAtendimento(id, casoId) {
    const [casos, a] = await Promise.all([
      ok(db.from('casos_clinicos').select('id, titulo, pacientes(nome)').order('created_at', { ascending: false })),
      id ? ok(db.from('atendimentos').select('*').eq('id', id).single()) : {},
    ]);
    formulario({
      titulo: id ? 'Editar atendimento' : 'Registrar atendimento', botao: 'Salvar',
      campos: [
        { n: 'caso_id', r: 'Caso clínico', t: 'select', req: true, val: a.caso_id || casoId, opts: casos.map((c) => [c.id, `${c.pacientes.nome} – ${c.titulo}`]) },
        { n: 'data_atendimento', r: 'Data e hora', t: 'datetime-local', req: true, val: localInput(a.data_atendimento) },
        { n: 'evolucao', r: 'Evolução', t: 'textarea', rows: 6, req: true, val: a.evolucao },
      ],
      aoEnviar: async (v) => {
        const dados = { caso_id: Number(v.caso_id), data_atendimento: new Date(v.data_atendimento).toISOString(), evolucao: v.evolucao };
        if (id) await ok(db.from('atendimentos').update(dados).eq('id', id));
        else await ok(db.from('atendimentos').insert(dados));
      },
    });
  }

  async function formObito(pacienteId) {
    const pac = await ok(db.from('pacientes').select('id, nome').eq('status', 'ativo').order('nome'));
    formulario({
      titulo: 'Registrar óbito', botao: 'Registrar óbito', perigo: true,
      texto: 'O paciente deixa de aceitar novos atendimentos após a data informada. O histórico continua visível para os alunos.',
      campos: [
        { n: 'paciente_id', r: 'Paciente', t: 'select', req: true, val: pacienteId, opts: pac.map((p) => [p.id, p.nome]) },
        { n: 'data_obito', r: 'Data e hora do óbito', t: 'datetime-local', req: true, val: localInput() },
        { n: 'motivo_obito', r: 'Motivo', t: 'textarea', rows: 3, req: true },
        { n: 'conf', r: 'Digite o nome completo do paciente para confirmar', req: true },
      ],
      aoEnviar: async (v) => {
        const p = pac.find((x) => String(x.id) === v.paciente_id);
        if (!p || v.conf.toLowerCase() !== p.nome.toLowerCase()) throw new Error('O nome digitado não confere com o paciente selecionado.');
        await ok(db.from('pacientes').update({ status: 'obito', data_obito: new Date(v.data_obito).toISOString(), motivo_obito: v.motivo_obito }).eq('id', p.id));
        location.hash = `#/paciente/${p.id}`;
      },
    });
  }

  const formIndicador = async (id, ucId) => {
    const i = id ? await ok(db.from('indicadores').select('*').eq('id', id).single()) : {};
    formulario({
      titulo: id ? 'Editar indicador' : 'Novo indicador', campos: [{ n: 'descricao', r: 'Descrição', t: 'textarea', rows: 5, req: true, val: i.descricao }],
      aoEnviar: async (v) => { if (id) await ok(db.from('indicadores').update({ descricao: v.descricao }).eq('id', id)); else await ok(db.from('indicadores').insert({ uc_id: Number(ucId), descricao: v.descricao })); },
    });
  };

  const formPdf = (destino, chaveDestino) => formulario({
    titulo: 'Enviar PDF de apoio', botao: 'Enviar',
    campos: [{ n: 'titulo', r: 'Título do material', req: true }, { n: 'arquivo', r: 'Arquivo PDF', t: 'file', accept: 'application/pdf', req: true }],
    aoEnviar: async (v) => {
      if (v.arquivo.type !== 'application/pdf') throw new Error('Envie um arquivo PDF.');
      const caminho = await subir('anexos', `${chaveDestino}-${destino}`, v.arquivo);
      try { await ok(db.from('anexos').insert({ titulo: v.titulo, storage_path: caminho, [chaveDestino]: Number(destino) })); }
      catch (e) { await db.storage.from('anexos').remove([caminho]); throw e; }
    },
  });

  // ---------- ações dos botões (data-acao) ----------
  const acoes = {
    novoPaciente: () => formPaciente(),
    editarPaciente: (d) => formPaciente(d.id),
    excluirPaciente: async (d) => {
      const p = await ok(db.from('pacientes').select('id, nome').eq('id', d.id).single());
      confirmar({ titulo: 'Excluir paciente', botao: 'Excluir', digitar: p.nome,
        texto: `Isto apaga <b>${esc(p.nome)}</b> e TODOS os casos clínicos e atendimentos dele. Não dá para desfazer.`,
        acao: async () => { await ok(db.from('pacientes').delete().eq('id', p.id)); location.hash = '#/pacientes'; } });
    },
    obito: (d) => formObito(d.id),
    reverterObito: async (d) => {
      const p = await ok(db.from('pacientes').select('id, nome').eq('id', d.id).single());
      confirmar({ titulo: 'Reverter óbito', botao: 'Reverter', texto: `<b>${esc(p.nome)}</b> volta a ficar ativo. A data e o motivo do óbito serão apagados.`,
        acao: () => ok(db.from('pacientes').update({ status: 'ativo', data_obito: null, motivo_obito: null }).eq('id', p.id)) });
    },
    novoCaso: (d) => formCaso(null, d.paciente, d.uc),
    editarCaso: (d) => formCaso(d.id),
    excluirCaso: async (d) => {
      const k = await ok(db.from('casos_clinicos').select('id, titulo, paciente_id').eq('id', d.id).single());
      confirmar({ titulo: 'Excluir caso clínico', botao: 'Excluir', texto: `Isto apaga <b>${esc(k.titulo)}</b> e todos os atendimentos dele.`,
        acao: async () => { await ok(db.from('casos_clinicos').delete().eq('id', k.id)); location.hash = `#/paciente/${k.paciente_id}`; } });
    },
    novoAtendimento: (d) => formAtendimento(null, d.caso),
    editarAtendimento: (d) => formAtendimento(d.id),
    excluirAtendimento: (d) => confirmar({ titulo: 'Excluir atendimento', botao: 'Excluir', texto: 'Este registro de evolução será apagado.', acao: () => ok(db.from('atendimentos').delete().eq('id', d.id)) }),
    novoIndicador: (d) => formIndicador(null, d.uc),
    editarIndicador: (d) => formIndicador(d.id),
    excluirIndicador: (d) => confirmar({ titulo: 'Excluir indicador', botao: 'Excluir', texto: 'Este indicador será apagado.', acao: () => ok(db.from('indicadores').delete().eq('id', d.id)) }),
    novoPdf: (d) => formPdf(d.destino, d.tipo),
    excluirPdf: (d) => confirmar({ titulo: 'Excluir material', botao: 'Excluir', texto: 'O PDF será removido.',
      acao: async () => { await ok(db.from('anexos').delete().eq('id', d.id)); await db.storage.from('anexos').remove([d.path]); } }),
    abrirPdf: async (d) => {
      const aba = window.open('', '_blank');
      const { data, error } = await db.storage.from('anexos').createSignedUrl(d.path, 60);
      if (error) { if (aba) aba.close(); return alert('Não foi possível abrir o arquivo.'); }
      aba.location = data.signedUrl;
    },
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-acao]');
    if (b && acoes[b.dataset.acao]) Promise.resolve(acoes[b.dataset.acao](b.dataset)).catch((err) => alert(err.message));
  });
  const btn = (acao, texto, extra = '', cls = 'claro') => `<button type="button" class="btn ${cls} peq" data-acao="${acao}" ${extra}>${texto}</button>`;

  // ---------- gráficos ----------
  function barras(ucs, porUC) {
    const L = 640, A = 200, x0 = 10, h = 140, max = Math.max(3, ...ucs.map((u) => porUC[u.id] || 0)), bw = (L - 2 * x0) / Math.max(ucs.length, 1);
    return `<svg viewBox="0 0 ${L} ${A}" role="img" aria-label="Casos clínicos por unidade curricular">${ucs.map((u, i) => {
      const n = porUC[u.id] || 0, bh = (h * n) / max, x = x0 + i * bw;
      return `<rect x="${x + 4}" y="${20 + h - bh}" width="${bw - 8}" height="${Math.max(bh, 2)}" rx="3" fill="${n ? '#0F7B6C' : '#e8e6df'}"/>${n ? `<text class="rot" x="${x + bw / 2}" y="${16 + h - bh}" text-anchor="middle">${n}</text>` : ''}<text x="${x + bw / 2}" y="${A - 8}" text-anchor="middle" font-size="10">${u.numero}</text>`;
    }).join('')}</svg><small style="opacity:.65">Número da unidade curricular</small>`;
  }

  function linhas(atend) {
    const semanas = [], hoje = new Date();
    const seg = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - ((hoje.getDay() + 6) % 7));
    for (let i = 7; i >= 0; i--) {
      const ini = new Date(seg); ini.setDate(seg.getDate() - i * 7);
      const fim = new Date(ini); fim.setDate(ini.getDate() + 7);
      semanas.push({ rot: ini.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), n: atend.filter((a) => new Date(a.data_atendimento) >= ini && new Date(a.data_atendimento) < fim).length });
    }
    const max = Math.max(4, ...semanas.map((s) => s.n)), L = 640, A = 200, x0 = 40, y0 = 20, h = A - 50, w = L - x0 - 20;
    const px = (i) => x0 + (w * i) / 7, py = (v) => y0 + h - (h * v) / max, pts = semanas.map((s, i) => `${px(i)},${py(s.n)}`).join(' ');
    return `<svg viewBox="0 0 ${L} ${A}" role="img" aria-label="Atendimentos registrados por semana">
      ${[0, .5, 1].map((f) => `<line x1="${x0}" x2="${L - 20}" y1="${py(max * f)}" y2="${py(max * f)}" stroke="#e8e6df"/><text x="${x0 - 8}" y="${py(max * f) + 4}" text-anchor="end">${Math.round(max * f)}</text>`).join('')}
      <polygon points="${px(0)},${py(0)} ${pts} ${px(7)},${py(0)}" fill="rgba(15,123,108,.1)"/><polyline points="${pts}" fill="none" stroke="#0F7B6C" stroke-width="2.5" stroke-linejoin="round"/>
      ${semanas.map((s, i) => `<circle cx="${px(i)}" cy="${py(s.n)}" r="4.5" fill="#0F7B6C"/><text class="rot" x="${px(i)}" y="${py(s.n) - 12}" text-anchor="middle">${s.n}</text><text x="${px(i)}" y="${A - 8}" text-anchor="middle">${s.rot}</text>`).join('')}</svg>`;
  }

  // ---------- telas ----------
  function menu(rota) {
    const itens = [['', 'inicio', 'Início'], ['pacientes', 'pacientes', 'Pacientes'], ['casos', 'casos', 'Casos clínicos'], ['ucs', 'ucs', 'Unidades curriculares'], ['alunos', 'alunos', 'Alunos']];
    const atual = rota === 'paciente' ? 'pacientes' : rota === 'caso' ? 'casos' : rota === 'uc' ? 'ucs' : rota;
    document.getElementById('nav').innerHTML = itens.map(([r, i, t]) => `<a href="#/${r}" class="${r === atual ? 'ativo' : ''}" ${r === atual ? 'aria-current="page"' : ''}>${ico(i)}${t}</a>`).join('');
  }

  async function inicio() {
    const desde = new Date(Date.now() - 60 * 864e5).toISOString();
    const [pac, ucs, casos, atd, alunos] = await Promise.all([
      db.from('pacientes').select('id, status'),
      db.from('unidades_curriculares').select('id, numero, nome').order('numero'),
      db.from('casos_clinicos').select('id, uc_id'),
      db.from('atendimentos').select('id, data_atendimento, evolucao, casos_clinicos(id, titulo, pacientes(nome, status))').gte('data_atendimento', desde).order('data_atendimento', { ascending: false }),
      db.from('perfis').select('id', { count: 'exact', head: true }).eq('papel', 'aluno'),
    ]);
    const erro = [pac, ucs, casos, atd, alunos].find((r) => r.error);
    if (erro) return falha(erro.error);
    const porUC = {}; casos.data.forEach((c) => { porUC[c.uc_id] = (porUC[c.uc_id] || 0) + 1; });
    const semCaso = ucs.data.filter((u) => !porUC[u.id]);
    const ativos = pac.data.filter((p) => p.status === 'ativo').length, obitos = pac.data.length - ativos;
    const num = (i, n, t) => `<div class="cartao numero"><span class="bolha">${ico(i)}</span><strong>${n}</strong><small>${t}</small></div>`;

    tela.innerHTML = `
      <header class="saudacao"><h1>Olá, Prof. ${esc(nomeBonito)}! 👋</h1><p>Aqui está um resumo dos seus pacientes e casos clínicos.</p></header>
      <div class="acoes-rapidas">
        ${btn('novoPaciente', '+ Novo paciente', '', 'teal')}${btn('novoCaso', '+ Novo caso clínico', '', 'teal')}
        ${btn('novoAtendimento', '+ Registrar atendimento', '', 'teal')}${btn('obito', 'Registrar óbito', '', 'perigo')}
      </div>
      <section class="visao">${num('pacientes', ativos, 'Pacientes ativos')}${num('coracao', obitos, 'Óbitos registrados')}${num('casos', casos.data.length, 'Casos clínicos')}${num('alunos', alunos.count ?? 0, 'Alunos cadastrados')}</section>
      <div class="duas">
        <section class="cartao grafico"><h3>Casos clínicos por unidade curricular</h3>${barras(ucs.data, porUC)}</section>
        <section class="cartao grafico"><h3>Atendimentos por semana</h3>${linhas(atd.data)}</section>
      </div>
      <div class="duas">
        <section class="cartao"><h3>Atendimentos recentes</h3>${atd.data.length ? '<ul class="mini">' + atd.data.slice(0, 5).map((a) => `
          <li><a href="#/caso/${a.casos_clinicos.id}">${esc(a.casos_clinicos.pacientes.nome)}<br><small>${esc(a.casos_clinicos.titulo)} · ${dia(a.data_atendimento)}</small></a>${selo(a.casos_clinicos.pacientes)}</li>`).join('') + '</ul>' : '<p class="vazio">Nenhum atendimento registrado ainda.</p>'}</section>
        <section class="cartao"><h3>Unidades curriculares sem caso</h3>${semCaso.length ? '<ul class="mini">' + semCaso.slice(0, 5).map((u) => `
          <li><a href="#/uc/${u.id}">UC${u.numero}<br><small>${esc(u.nome.length > 70 ? u.nome.slice(0, 70) + '…' : u.nome)}</small></a>${btn('novoCaso', 'Criar caso', `data-uc="${u.id}"`)}</li>`).join('') + '</ul>' + (semCaso.length > 5 ? `<small>e mais ${semCaso.length - 5}…</small>` : '') : '<p class="vazio">Todas as unidades têm caso clínico. 🎉</p>'}</section>
      </div>`;
  }

  async function listaPacientes() {
    const [pac, casos] = await Promise.all([db.from('pacientes').select('id, nome, sexo, avatar_url, status').order('nome'), db.from('casos_clinicos').select('paciente_id')]);
    if (pac.error || casos.error) return falha(pac.error || casos.error);
    const n = {}; casos.data.forEach((c) => { n[c.paciente_id] = (n[c.paciente_id] || 0) + 1; });
    tela.innerHTML = `<div class="topo-lista"><h2>Pacientes</h2>${btn('novoPaciente', '+ Novo paciente', '', 'teal')}</div>` + (pac.data.length
      ? `<div class="grade4">${pac.data.map((p) => `<a class="item" href="#/paciente/${p.id}">${avatar(p)}<h3>${esc(p.nome)}</h3>${selo(p)}<small>${n[p.id] || 0} ${n[p.id] === 1 ? 'caso clínico' : 'casos clínicos'}</small><span class="ver">Abrir</span></a>`).join('')}</div>`
      : '<p class="vazio">Nenhum paciente ainda. Clique em "Novo paciente" para começar.</p>');
  }

  async function paciente(id) {
    const p = await db.from('pacientes').select('*').eq('id', id).single();
    if (p.error) return falha(p.error);
    const casos = await db.from('casos_clinicos').select('id, titulo, unidades_curriculares(numero)').eq('paciente_id', id).order('created_at', { ascending: false });
    if (casos.error) return falha(casos.error);
    const k = p.data, morto = k.status === 'obito';
    tela.innerHTML = `<div class="pagina"><a class="voltar" href="#/pacientes">← Pacientes</a>
      <div class="cab-pac">${avatar(k)}<div><h2 style="margin:0">${esc(k.nome)}</h2><p>${selo(k)} ${k.sexo ? k.sexo.charAt(0).toUpperCase() + k.sexo.slice(1) : ''}${k.data_nascimento ? ' · nascimento ' + dia(k.data_nascimento + 'T12:00') : ''}</p></div></div>
      <div class="barra-acoes">${btn('editarPaciente', 'Editar', `data-id="${k.id}"`)}${btn('novoCaso', '+ Novo caso clínico', `data-paciente="${k.id}"`, 'teal')}
        ${morto ? btn('reverterObito', 'Reverter óbito', `data-id="${k.id}"`) : btn('obito', 'Registrar óbito', `data-id="${k.id}"`, 'perigo')}${btn('excluirPaciente', 'Excluir paciente', `data-id="${k.id}"`)}</div>
      ${morto ? `<p class="aviso"><strong>Óbito em ${diaHora(k.data_obito)}.</strong> ${esc(k.motivo_obito || '')}</p>` : ''}
      <h3>Casos clínicos</h3>
      ${casos.data.length ? '<ul class="lista">' + casos.data.map((c) => `<li><a href="#/caso/${c.id}">${esc(c.titulo)}</a><small>UC${c.unidades_curriculares.numero}</small></li>`).join('') + '</ul>' : '<p class="vazio">Este paciente ainda não tem caso clínico.</p>'}</div>`;
  }

  async function listaCasos(ucId) {
    let q = db.from('casos_clinicos').select('id, titulo, pacientes(nome), unidades_curriculares(numero)').order('created_at', { ascending: false });
    if (ucId) q = q.eq('uc_id', ucId);
    const [casos, ucs] = await Promise.all([q, db.from('unidades_curriculares').select('id, numero, nome').order('numero')]);
    if (casos.error || ucs.error) return falha(casos.error || ucs.error);
    tela.innerHTML = `<div class="pagina"><div class="topo-lista"><h2>Casos clínicos</h2>${btn('novoCaso', '+ Novo caso clínico', '', 'teal')}</div>
      <form class="filtro" id="filtro"><label class="sr" for="uc">Unidade curricular</label><select id="uc"><option value="">Todas as unidades curriculares</option>
        ${ucs.data.map((u) => `<option value="${u.id}" ${String(u.id) === String(ucId) ? 'selected' : ''}>UC${u.numero} - ${esc(u.nome)}</option>`).join('')}</select><button class="btn" type="submit">Filtrar</button></form>
      ${casos.data.length ? '<ul class="lista">' + casos.data.map((c) => `<li><a href="#/caso/${c.id}">${esc(c.titulo)}</a><small>${esc(c.pacientes.nome)} · UC${c.unidades_curriculares.numero}</small></li>`).join('') + '</ul>' : '<p class="vazio">Nenhum caso clínico encontrado.</p>'}</div>`;
    document.getElementById('filtro').addEventListener('submit', (e) => { e.preventDefault(); const v = document.getElementById('uc').value; go('#/casos' + (v ? '/' + v : '')); });
  }

  const listaPdfs = (anx, tipo, destino) => `<div class="topo-lista"><h3 style="margin:0">Materiais de apoio</h3>${btn('novoPdf', 'Enviar PDF', `data-tipo="${tipo}" data-destino="${destino}"`)}</div>` +
    (anx.length ? '<ul class="lista">' + anx.map((a) => `<li class="linha"><button class="link" data-acao="abrirPdf" data-path="${esc(a.storage_path)}">${esc(a.titulo)} (PDF)</button>${btn('excluirPdf', 'Excluir', `data-id="${a.id}" data-path="${esc(a.storage_path)}"`)}</li>`).join('') + '</ul>' : '<p class="vazio">Nenhum material enviado.</p>');

  async function caso(id) {
    const c = await db.from('casos_clinicos').select('*, pacientes(id, nome, status, data_obito), unidades_curriculares(id, numero, nome)').eq('id', id).single();
    if (c.error) return falha(c.error);
    const k = c.data;
    const [atd, anx] = await Promise.all([
      db.from('atendimentos').select('id, data_atendimento, evolucao').eq('caso_id', id).order('data_atendimento', { ascending: false }),
      db.from('anexos').select('id, titulo, storage_path').eq('caso_id', id),
    ]);
    if (atd.error || anx.error) return falha(atd.error || anx.error);
    tela.innerHTML = `<div class="pagina"><a class="voltar" href="#/paciente/${k.pacientes.id}">← ${esc(k.pacientes.nome)}</a>
      <h2>${esc(k.titulo)}</h2><p>UC${k.unidades_curriculares.numero} - ${esc(k.unidades_curriculares.nome)}</p>
      <div class="barra-acoes">${btn('editarCaso', 'Editar caso', `data-id="${k.id}"`)}${btn('excluirCaso', 'Excluir caso', `data-id="${k.id}"`)}</div>
      ${k.pacientes.status === 'obito' ? `<p class="aviso"><strong>${esc(k.pacientes.nome)} está em óbito desde ${diaHora(k.pacientes.data_obito)}.</strong> Não é possível registrar atendimentos depois dessa data.</p>` : ''}
      <div class="cartao"><p class="texto" style="margin:0">${esc(k.descricao) || 'Sem descrição.'}</p></div>
      <h3>Situação-problema</h3><div class="cartao"><p class="texto" style="margin:0">${esc(k.situacao_problema) || 'Ainda não cadastrada. Use "Editar caso" para escrever.'}</p></div>
      <div class="topo-lista" style="margin-top:26px"><h3 style="margin:0">Histórico de atendimentos</h3>${btn('novoAtendimento', '+ Registrar atendimento', `data-caso="${k.id}"`, 'teal')}</div>
      ${atd.data.length ? '<ul class="lista">' + atd.data.map((a) => `<li><div class="linha"><small>${diaHora(a.data_atendimento)}</small><div class="botoes">${btn('editarAtendimento', 'Editar', `data-id="${a.id}"`)}${btn('excluirAtendimento', 'Excluir', `data-id="${a.id}"`)}</div></div><span class="texto">${esc(a.evolucao)}</span></li>`).join('') + '</ul>' : '<p class="vazio">Nenhum atendimento registrado neste caso.</p>'}
      <div style="margin-top:26px">${listaPdfs(anx.data, 'caso_id', k.id)}</div>
      <p style="margin-top:20px"><a href="#/uc/${k.unidades_curriculares.id}">Ver indicadores da UC${k.unidades_curriculares.numero}</a></p></div>`;
  }

  async function listaUCs() {
    const [ucs, casos] = await Promise.all([db.from('unidades_curriculares').select('id, numero, nome').order('numero'), db.from('casos_clinicos').select('uc_id')]);
    if (ucs.error || casos.error) return falha(ucs.error || casos.error);
    const n = {}; casos.data.forEach((c) => { n[c.uc_id] = (n[c.uc_id] || 0) + 1; });
    tela.innerHTML = `<h2 style="font-size:2rem;margin-bottom:14px">Unidades curriculares</h2><div class="grade4">${ucs.data.map((u, i) => `<a class="item" href="#/uc/${u.id}"><span class="bolinha c${i % 3}">UC${u.numero}</span><span class="nome">${esc(u.nome)}</span><small>${n[u.id] || 0} ${n[u.id] === 1 ? 'caso clínico' : 'casos clínicos'}</small><span class="ver">Abrir</span></a>`).join('')}</div>`;
  }

  async function unidade(id) {
    const [u, ind, anx, casos] = await Promise.all([
      db.from('unidades_curriculares').select('id, numero, nome').eq('id', id).single(),
      db.from('indicadores').select('id, descricao').eq('uc_id', id).order('id'),
      db.from('anexos').select('id, titulo, storage_path').eq('uc_id', id),
      db.from('casos_clinicos').select('id, titulo, pacientes(nome)').eq('uc_id', id).order('created_at', { ascending: false }),
    ]);
    const erro = [u, ind, anx, casos].find((r) => r.error);
    if (erro) return falha(erro.error);
    tela.innerHTML = `<div class="pagina"><a class="voltar" href="#/ucs">← Unidades curriculares</a><h2>UC${u.data.numero}</h2><p>${esc(u.data.nome)}</p>
      <div class="topo-lista" style="margin-top:26px"><h3 style="margin:0">Indicadores</h3>${btn('novoIndicador', '+ Novo indicador', `data-uc="${id}"`, 'teal')}</div>
      ${ind.data.length ? '<ul class="lista">' + ind.data.map((i) => `<li class="linha"><span class="texto">${esc(i.descricao)}</span><div class="botoes">${btn('editarIndicador', 'Editar', `data-id="${i.id}"`)}${btn('excluirIndicador', 'Excluir', `data-id="${i.id}"`)}</div></li>`).join('') + '</ul>' : '<p class="vazio">Nenhum indicador cadastrado.</p>'}
      <div style="margin-top:26px">${listaPdfs(anx.data, 'uc_id', id)}</div>
      <div class="topo-lista" style="margin-top:26px"><h3 style="margin:0">Casos clínicos</h3>${btn('novoCaso', '+ Novo caso', `data-uc="${id}"`, 'teal')}</div>
      ${casos.data.length ? '<ul class="lista">' + casos.data.map((c) => `<li><a href="#/caso/${c.id}">${esc(c.titulo)}</a><small>${esc(c.pacientes.nome)}</small></li>`).join('') + '</ul>' : '<p class="vazio">Nenhum caso nesta unidade.</p>'}</div>`;
  }

  async function alunos() {
    const r = await db.from('perfis').select('id, nome, created_at').eq('papel', 'aluno').order('nome');
    if (r.error) return falha(r.error);
    tela.innerHTML = `<div class="pagina"><h2>Alunos</h2>${r.data.length ? '<ul class="lista">' + r.data.map((a) => `<li><b>${esc(a.nome)}</b><small>Cadastrado em ${dia(a.created_at)}</small></li>`).join('') + '</ul>' : '<p class="vazio">Nenhum aluno cadastrado ainda.</p>'}</div>`;
  }

  function rotear() {
    const [, tipo = '', id] = location.hash.split('/');
    menu(tipo);
    if (tipo === 'pacientes') return listaPacientes();
    if (tipo === 'paciente' && id) return paciente(id);
    if (tipo === 'casos') return listaCasos(id);
    if (tipo === 'caso' && id) return caso(id);
    if (tipo === 'ucs') return listaUCs();
    if (tipo === 'uc' && id) return unidade(id);
    if (tipo === 'alunos') return alunos();
    return inicio();
  }
  window.addEventListener('hashchange', () => { window.scrollTo(0, 0); rotear(); });
  rotear();
})();
