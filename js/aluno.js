// Dashboard do aluno (somente leitura): início, pacientes, unidades curriculares e casos clínicos.
(async () => {
  const perfil = await exigirPapel('aluno');
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
    ucs: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M9 8h6"/>',
    sair: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    coracao: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/><path d="M6 12h3l1.5-3 3 6 1.5-3h3"/>',
    ant: '<path d="M15 6l-6 6 6 6"/>',
    prox: '<path d="M9 6l6 6-6 6"/>',
  };
  const ico = (n) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONES[n]}</svg>`;
  document.getElementById('sair').innerHTML = ico('sair');

  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const dia = (d) => new Date(d).toLocaleDateString('pt-BR');
  const diaHora = (d) => new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
  const chave = (d) => { const x = new Date(d); return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`; };
  const falha = (e) => { tela.innerHTML = `<p class="vazio">Não foi possível carregar os dados (${esc(e.message)}). Atualize a página.</p>`; };
  const avatar = (p) => p.avatar_url
    ? `<img class="avatar" src="${esc(p.avatar_url)}" alt="">`
    : `<span class="avatar ${p.sexo === 'masculino' ? 'm' : 'f'}" aria-hidden="true">${esc(p.nome[0])}</span>`;

  function menu(rota) {
    const itens = [['', 'inicio', 'Início'], ['pacientes', 'pacientes', 'Pacientes'], ['ucs', 'ucs', 'Unidades curriculares']];
    const atual = ['paciente', 'caso'].includes(rota) ? 'pacientes' : rota === 'uc' ? 'ucs' : rota;
    document.getElementById('nav').innerHTML = itens.map(([r, i, t]) =>
      `<a href="#/${r}" class="${r === atual ? 'ativo' : ''}" ${r === atual ? 'aria-current="page"' : ''}>${ico(i)}${t}</a>`).join('');
  }

  // ---------- peças reutilizáveis ----------
  const cartaoUC = (u, n, i) => `
    <a class="item" href="#/uc/${u.id}">
      <span class="bolinha c${i % 3}">UC${u.numero}</span>
      <span class="nome">${esc(u.nome)}</span>
      <small>${n} ${n === 1 ? 'caso clínico' : 'casos clínicos'}</small>
      <span class="ver">Ver casos</span>
    </a>`;

  const cartaoPaciente = (p, n) => `
    <a class="item" href="#/paciente/${p.id}">${avatar(p)}
      <h3>${esc(p.nome)}</h3>
      <small>${p.status === 'obito' ? 'Óbito' : n + (n === 1 ? ' caso clínico' : ' casos clínicos')}</small>
      <span class="ver">Histórico</span>
    </a>`;

  function grafico(atend) {
    const semanas = [], hoje = new Date();
    const seg = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - ((hoje.getDay() + 6) % 7));
    for (let i = 7; i >= 0; i--) {
      const ini = new Date(seg); ini.setDate(seg.getDate() - i * 7);
      const fim = new Date(ini); fim.setDate(ini.getDate() + 7);
      semanas.push({ rot: ini.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), n: atend.filter((a) => new Date(a.data_atendimento) >= ini && new Date(a.data_atendimento) < fim).length });
    }
    const max = Math.max(4, ...semanas.map((s) => s.n)), L = 640, A = 220, x0 = 40, y0 = 20, h = A - 50, w = L - x0 - 20;
    const px = (i) => x0 + (w * i) / 7, py = (v) => y0 + h - (h * v) / max;
    const pts = semanas.map((s, i) => `${px(i)},${py(s.n)}`).join(' ');
    return `<svg viewBox="0 0 ${L} ${A}" role="img" aria-label="Atendimentos registrados por semana nas últimas 8 semanas">
      ${[0, .5, 1].map((f) => `<line x1="${x0}" x2="${L - 20}" y1="${py(max * f)}" y2="${py(max * f)}" stroke="#e8e6df"/><text x="${x0 - 8}" y="${py(max * f) + 4}" text-anchor="end">${Math.round(max * f)}</text>`).join('')}
      <polygon points="${px(0)},${py(0)} ${pts} ${px(7)},${py(0)}" fill="rgba(15,123,108,.1)"/>
      <polyline points="${pts}" fill="none" stroke="#0F7B6C" stroke-width="2.5" stroke-linejoin="round"/>
      ${semanas.map((s, i) => `<circle cx="${px(i)}" cy="${py(s.n)}" r="4.5" fill="#0F7B6C"/><text class="rot" x="${px(i)}" y="${py(s.n) - 12}" text-anchor="middle">${s.n}</text><text x="${px(i)}" y="${A - 8}" text-anchor="middle">${s.rot}</text>`).join('')}
    </svg>`;
  }

  function calendario(marcados) {
    const ref = new Date(); ref.setDate(1);
    const box = document.createElement('div');
    const desenha = () => {
      const ano = ref.getFullYear(), mes = ref.getMonth(), hoje = chave(new Date());
      const inicio = new Date(ano, mes, 1 - ref.getDay());
      let dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((s) => `<span class="sem">${s}</span>`).join('');
      for (let i = 0; i < 42; i++) {
        const d = new Date(inicio); d.setDate(inicio.getDate() + i);
        if (i >= 35 && d.getMonth() !== mes) break;
        const k = chave(d);
        dias += `<span class="d ${d.getMonth() !== mes ? 'fora' : ''} ${k === hoje ? 'hoje' : ''} ${marcados.has(k) ? 'marcado' : ''}" ${marcados.has(k) ? 'title="Há atendimentos neste dia"' : ''}><span>${d.getDate()}</span></span>`;
      }
      const titulo = ref.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      box.innerHTML = `<div class="cal-topo"><button type="button" data-m="-1" aria-label="Mês anterior">${ico('ant')}</button><b>${titulo.charAt(0).toUpperCase() + titulo.slice(1)}</b><button type="button" data-m="1" aria-label="Próximo mês">${ico('prox')}</button></div><div class="cal">${dias}</div>`;
      box.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => { ref.setMonth(ref.getMonth() + Number(b.dataset.m)); desenha(); }));
    };
    desenha();
    return box;
  }

  function abrirArquivos(raiz) {
    raiz.querySelectorAll('[data-arquivo]').forEach((b) => b.addEventListener('click', async () => {
      const aba = window.open('', '_blank');
      const { data, error } = await db.storage.from('anexos').createSignedUrl(b.dataset.arquivo, 60);
      if (error) { if (aba) aba.close(); return alert('Não foi possível abrir o arquivo.'); }
      aba.location = data.signedUrl;
    }));
  }

  // ---------- telas ----------
  async function inicio() {
    const desde = new Date(Date.now() - 120 * 864e5).toISOString();
    const [pac, ucs, casos, atd, anx] = await Promise.all([
      db.from('pacientes').select('id, nome, sexo, avatar_url, status').order('nome'),
      db.from('unidades_curriculares').select('id, numero, nome').order('numero'),
      db.from('casos_clinicos').select('id, uc_id, paciente_id'),
      db.from('atendimentos').select('id, data_atendimento, casos_clinicos(id, titulo, pacientes(nome))').gte('data_atendimento', desde).order('data_atendimento', { ascending: false }),
      db.from('anexos').select('id, titulo, storage_path').order('created_at', { ascending: false }).limit(4),
    ]);
    const erro = [pac, ucs, casos, atd, anx].find((r) => r.error);
    if (erro) return falha(erro.error);

    const porUC = {}, porPac = {};
    casos.data.forEach((c) => { porUC[c.uc_id] = (porUC[c.uc_id] || 0) + 1; porPac[c.paciente_id] = (porPac[c.paciente_id] || 0) + 1; });
    const comCaso = ucs.data.filter((u) => porUC[u.id]).length, total = ucs.data.length || 1;
    const pct = Math.round((comCaso / total) * 100), circ = 2 * Math.PI * 54;
    const ultimos7 = atd.data.filter((a) => Date.now() - new Date(a.data_atendimento) < 7 * 864e5).length;
    const destaque = [...ucs.data].sort((a, b) => (porUC[b.id] || 0) - (porUC[a.id] || 0) || a.numero - b.numero).slice(0, 4);

    tela.innerHTML = `
      <header class="saudacao"><h1>Olá, ${esc(nomeBonito)}! 👋</h1><p>Bem-vindo(a) de volta ao seu prontuário digital.</p></header>
      <div class="home">
        <div class="coluna">
          <section class="resumo">
            <div class="cartao progresso">
              <div class="anel"><svg viewBox="0 0 130 130"><circle class="fundo" cx="65" cy="65" r="54"/><circle class="valor" cx="65" cy="65" r="54" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - pct / 100)}"/></svg><span>${pct}%<small>com casos</small></span></div>
              <div><h3>Cobertura do prontuário</h3><p style="margin:0">${comCaso} de ${total} unidades curriculares já têm casos clínicos para estudar.</p>
                <div class="barra"><i style="width:${pct}%"></i></div><small>${casos.data.length} casos clínicos disponíveis</small></div>
            </div>
            <div class="cartao numero"><span class="bolha">${ico('pacientes')}</span><strong>${pac.data.length}</strong><small>Pacientes</small></div>
            <div class="cartao numero"><span class="bolha">${ico('coracao')}</span><strong>${ultimos7}</strong><small>Atendimentos na semana</small></div>
          </section>
          <section><div class="cabeca"><h2>Unidades curriculares</h2><a href="#/ucs">Ver todas</a></div>
            <div class="grade4">${destaque.map((u, i) => cartaoUC(u, porUC[u.id] || 0, i)).join('')}</div></section>
          <section><div class="cabeca"><h2>Pacientes</h2><a href="#/pacientes">Ver todos</a></div>
            ${pac.data.length ? `<div class="grade4">${pac.data.slice(0, 4).map((p) => cartaoPaciente(p, porPac[p.id] || 0)).join('')}</div>` : '<p class="vazio">Nenhum paciente cadastrado ainda.</p>'}</section>
          <section class="cartao grafico"><h3>Atendimentos por semana</h3>${grafico(atd.data)}</section>
        </div>
        <aside class="coluna">
          <section class="cartao" id="calendario"><h3>Calendário</h3></section>
          <section class="cartao"><h3>Últimos atendimentos</h3>${atd.data.length ? '<ul class="mini">' + atd.data.slice(0, 4).map((a) => `
            <li><a href="#/caso/${a.casos_clinicos.id}">${esc(a.casos_clinicos.pacientes.nome)}<br><small>${esc(a.casos_clinicos.titulo)}</small></a><small>${dia(a.data_atendimento)}</small></li>`).join('') + '</ul>' : '<p class="vazio">Nenhum atendimento registrado.</p>'}</section>
          <section class="cartao"><h3>Materiais de apoio</h3>${anx.data.length ? '<ul class="mini">' + anx.data.map((a) => `<li><button class="link" data-arquivo="${esc(a.storage_path)}">${esc(a.titulo)}</button><small>PDF</small></li>`).join('') + '</ul>' : '<p class="vazio">Nenhum material ainda.</p>'}</section>
        </aside>
      </div>`;
    document.getElementById('calendario').appendChild(calendario(new Set(atd.data.map((a) => chave(a.data_atendimento)))));
    abrirArquivos(tela);
  }

  async function listaPacientes() {
    const [pac, casos] = await Promise.all([
      db.from('pacientes').select('id, nome, sexo, avatar_url, status').order('nome'),
      db.from('casos_clinicos').select('paciente_id'),
    ]);
    if (pac.error || casos.error) return falha(pac.error || casos.error);
    const n = {}; casos.data.forEach((c) => { n[c.paciente_id] = (n[c.paciente_id] || 0) + 1; });
    tela.innerHTML = '<div class="pagina" style="max-width:none"><h2>Pacientes</h2>' + (pac.data.length
      ? `<div class="grade4">${pac.data.map((p) => cartaoPaciente(p, n[p.id] || 0)).join('')}</div>`
      : '<p class="vazio">Nenhum paciente cadastrado ainda.</p>') + '</div>';
  }

  async function listaUCs() {
    const [ucs, casos] = await Promise.all([
      db.from('unidades_curriculares').select('id, numero, nome').order('numero'),
      db.from('casos_clinicos').select('uc_id'),
    ]);
    if (ucs.error || casos.error) return falha(ucs.error || casos.error);
    const n = {}; casos.data.forEach((c) => { n[c.uc_id] = (n[c.uc_id] || 0) + 1; });
    tela.innerHTML = `<div class="pagina" style="max-width:none"><h2>Unidades curriculares</h2><div class="grade4">${ucs.data.map((u, i) => cartaoUC(u, n[u.id] || 0, i)).join('')}</div></div>`;
  }

  async function unidade(id) {
    const [u, casos] = await Promise.all([
      db.from('unidades_curriculares').select('id, numero, nome').eq('id', id).single(),
      db.from('casos_clinicos').select('id, titulo, pacientes(nome)').eq('uc_id', id).order('created_at', { ascending: false }),
    ]);
    if (u.error || casos.error) return falha(u.error || casos.error);
    tela.innerHTML = `<div class="pagina"><a class="voltar" href="#/ucs">← Unidades curriculares</a>
      <h2>UC${u.data.numero}</h2><p>${esc(u.data.nome)}</p><h3>Casos clínicos</h3>
      ${casos.data.length ? '<ul class="lista">' + casos.data.map((c) => `<li><a href="#/caso/${c.id}">${esc(c.titulo)}</a><small>${esc(c.pacientes.nome)}</small></li>`).join('') + '</ul>' : '<p class="vazio">Nenhum caso clínico para esta unidade curricular.</p>'}</div>`;
  }

  async function paciente(id, ucId) {
    const [p, ucs] = await Promise.all([
      db.from('pacientes').select('*').eq('id', id).single(),
      db.from('unidades_curriculares').select('id, numero, nome').order('numero'),
    ]);
    if (p.error || ucs.error) return falha(p.error || ucs.error);
    let q = db.from('casos_clinicos').select('id, titulo, unidades_curriculares(numero)').eq('paciente_id', id).order('created_at', { ascending: false });
    if (ucId) q = q.eq('uc_id', ucId);
    const casos = await q;
    if (casos.error) return falha(casos.error);

    const obito = p.data.status === 'obito'
      ? `<p class="aviso"><strong>Óbito em ${dia(p.data.data_obito)}.</strong> ${esc(p.data.motivo_obito || '')}</p>` : '';
    tela.innerHTML = `<div class="pagina">
      <a class="voltar" href="#/pacientes">← Pacientes</a>
      <div class="paciente">${avatar(p.data)}<h2>${esc(p.data.nome)}</h2></div>${obito}
      <form class="filtro" id="filtro">
        <label class="sr" for="uc">Unidade curricular</label>
        <select id="uc"><option value="">Todas as unidades curriculares</option>
          ${ucs.data.map((u) => `<option value="${u.id}" ${String(u.id) === String(ucId) ? 'selected' : ''}>UC${u.numero} - ${esc(u.nome)}</option>`).join('')}
        </select>
        <button class="btn" type="submit">Buscar</button>
      </form>
      <h3>Casos clínicos</h3>
      ${casos.data.length ? '<ul class="lista">' + casos.data.map((c) => `
        <li><a href="#/caso/${c.id}">${esc(c.titulo)}</a><small>UC${c.unidades_curriculares.numero}</small></li>`).join('') + '</ul>'
        : '<p class="vazio">Nenhum caso clínico para esta unidade curricular.</p>'}</div>`;
    document.getElementById('filtro').addEventListener('submit', (e) => {
      e.preventDefault();
      const uc = document.getElementById('uc').value;
      location.hash = `#/paciente/${id}` + (uc ? '/' + uc : '');
    });
  }

  async function caso(id) {
    const c = await db.from('casos_clinicos').select('*, pacientes(id, nome), unidades_curriculares(id, numero, nome)').eq('id', id).single();
    if (c.error) return falha(c.error);
    const k = c.data;
    const [ind, atd, anx] = await Promise.all([
      db.from('indicadores').select('id, descricao').eq('uc_id', k.uc_id).order('id'),
      db.from('atendimentos').select('id, data_atendimento, evolucao').eq('caso_id', id).order('data_atendimento', { ascending: false }),
      db.from('anexos').select('id, titulo, storage_path').or(`caso_id.eq.${id},uc_id.eq.${k.uc_id}`),
    ]);
    tela.innerHTML = `<div class="pagina">
      <a class="voltar" href="#/paciente/${k.pacientes.id}">← ${esc(k.pacientes.nome)}</a>
      <h2>${esc(k.titulo)}</h2>
      <p>UC${k.unidades_curriculares.numero} - ${esc(k.unidades_curriculares.nome)}</p>
      <div class="cartao"><p class="texto" style="margin:0">${esc(k.descricao)}</p></div>
      ${k.situacao_problema ? `<h3>Situação-problema</h3><div class="cartao"><p class="texto" style="margin:0">${esc(k.situacao_problema)}</p></div>` : ''}
      <h3>Indicadores da UC${k.unidades_curriculares.numero}</h3>
      ${(ind.data || []).length ? '<ul class="marcadores">' + ind.data.map((i) => `<li>${esc(i.descricao)}</li>`).join('') + '</ul>' : '<p class="vazio">Sem indicadores cadastrados.</p>'}
      <h3>Histórico de atendimentos</h3>
      ${(atd.data || []).length ? '<ul class="lista">' + atd.data.map((a) => `<li><small>${diaHora(a.data_atendimento)}</small><span class="texto">${esc(a.evolucao)}</span></li>`).join('') + '</ul>' : '<p class="vazio">Nenhum atendimento registrado neste caso.</p>'}
      ${(anx.data || []).length ? '<h3>Materiais de apoio</h3><ul class="lista">' + anx.data.map((a) => `<li><button class="link" data-arquivo="${esc(a.storage_path)}">${esc(a.titulo)} (PDF)</button></li>`).join('') + '</ul>' : ''}</div>`;
    abrirArquivos(tela);
  }

  function rotear() {
    const [, tipo = '', id, uc] = location.hash.split('/');
    menu(tipo);
    window.scrollTo(0, 0);
    if (tipo === 'pacientes') return listaPacientes();
    if (tipo === 'ucs') return listaUCs();
    if (tipo === 'uc' && id) return unidade(id);
    if (tipo === 'paciente' && id) return paciente(id, uc);
    if (tipo === 'caso' && id) return caso(id);
    return inicio();
  }
  window.addEventListener('hashchange', rotear);
  rotear();
})();
