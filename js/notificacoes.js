// Central de notificações do aluno (CONECTA).
// Requer a tabela `notificacoes` e as funções criadas por database/notificacoes.sql.
//
// Organização deste arquivo:
//   1) utilidades e catálogo de tipos (ícone, cor, textos)
//   2) estrutura do sino + painel e acoplamento ao cabeçalho
//   3) pop-ups (fila, limite de 3, pausa ao passar o mouse, subida até o sino)
//   4) painel (lista, filtros, ler / marcar como lida)
//   5) dados (carregar, tempo real, geração de avisos automáticos)
function iniciarNotificacoesConecta(db, perfil) {
  if (!db || !perfil || document.getElementById("conecta-notificacoes")) return;

  /* ---------- 1) utilidades e catálogo ---------- */
  const escN = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const reduzMovimento = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fmt = (v) => {
    if (!v) return "";
    const d = new Date(v);
    return Number.isNaN(d.getTime())
      ? ""
      : d.toLocaleString("pt-BR", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        });
  };
  // "Agora", "Há 5 min", "Há 2 h" ou a data, para avisos mais antigos
  const relativo = (v) => {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return "";
    const min = Math.floor((Date.now() - d.getTime()) / 60000);
    if (min < 1) return "Agora";
    if (min < 60) return `Há ${min} min`;
    const h = Math.floor(min / 60);
    return h < 24 ? `Há ${h} h` : fmt(v);
  };

  const ICONES_N = {
    // tarefa: prancheta com marcação
    atividade:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 14l2 2 4-4"/></svg>',
    // prova: calendário
    prova:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4M8 14h3"/></svg>',
    // paciente: duas pessoas
    paciente:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 5.2a3 3 0 0 1 0 5.6M18 14.8c2 .6 3.5 2.4 3.5 5.2"/></svg>',
    // caso clínico: prontuário com cruz
    caso: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4M11 14h4M13 12v4"/></svg>',
    // lembrete: livro
    lembrete:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6.5C10.5 5 8 4.5 4 4.5v13c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-13c-4 0-6.5.5-8 2z"/><path d="M12 6.5v13"/></svg>',
  };
  const META = {
    prova: {
      etiqueta: "PROVA",
      acao: "Ver prova",
      href: "#/atividades",
      padrao: "Uma prova foi publicada.",
      duracao: 15000, // provas ficam mais tempo na tela
    },
    atividade: {
      etiqueta: "ATIVIDADE",
      acao: "Ver atividade",
      href: "#/atividades",
      padrao: "Você tem uma atividade para concluir.",
      duracao: 7000,
    },
    paciente: {
      etiqueta: "PACIENTE",
      acao: "Ver paciente",
      href: "#/pacientes",
      padrao: "Um novo paciente foi cadastrado.",
      duracao: 7000,
    },
    caso: {
      etiqueta: "CASO CLÍNICO",
      acao: "Ver caso",
      href: "#/pacientes",
      padrao: "Um novo caso clínico está disponível.",
      duracao: 7000,
    },
    lembrete: {
      etiqueta: "LEMBRETE",
      acao: "Ver no calendário",
      href: "#/",
      padrao: "Um lembrete seu está chegando.",
      duracao: 8000,
    },
  };
  const tp = (t) => (META[t] ? t : "atividade");
  const svg = (tipo) => ICONES_N[tp(tipo)];
  // só aceita destinos internos (#/rota ou #/rota/id) vindos do banco
  const destino = (x) =>
    typeof x.link === "string" && /^#\/[\w\-/]*$/.test(x.link)
      ? x.link
      : META[tp(x.tipo)].href;

  /* ---------- 2) estrutura ---------- */
  const root = document.createElement("div");
  root.id = "conecta-notificacoes";
  root.innerHTML = `
    <button class="cn-sino" type="button" aria-label="Abrir notificações" aria-expanded="false">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>
      <span class="cn-contador" hidden>0</span>
    </button>
    <aside class="cn-painel" aria-label="Central de notificações" hidden>
      <header class="cn-cabecalho"><div><h2>Notificações</h2><p class="cn-resumo">Tudo em dia por aqui.</p></div><button type="button" class="cn-fechar" aria-label="Fechar notificações">×</button></header>
      <div class="cn-filtros" role="group" aria-label="Filtrar notificações">
        <button type="button" data-filtro="todas" class="ativo">Todas</button><button type="button" data-filtro="prova">Provas</button><button type="button" data-filtro="atividade">Atividades</button><button type="button" data-filtro="lembrete">Lembretes</button><button type="button" data-filtro="clinico" title="Pacientes e casos clínicos">Pacientes</button>
      </div>
      <div class="cn-lista"><p class="cn-vazio">Carregando notificações…</p></div>
      <footer class="cn-rodape"><button type="button" class="cn-marcar">Marcar todas como lidas</button></footer>
    </aside>
    <div class="cn-toasts" aria-live="polite" aria-relevant="additions"></div>`;
  document.body.appendChild(root);

  // Os pop-ups ficam soltos no canto inferior direito; o sino, não: ele é acoplado ao cabeçalho.
  const toasts = root.querySelector(".cn-toasts");
  document.body.appendChild(toasts);

  // O sino faz parte do cabeçalho da tela atual: na tela inicial vira um item da linha do topo,
  // ao lado da data; nas demais, fica na barra "Hoje é" no topo da página, também ao lado da data.
  // A tela é redesenhada a cada rota, então o sino é recolocado sempre que ela muda.
  const tela = document.getElementById("tela");
  const acoplar = () => {
    const topo = tela && tela.querySelector(".aluno-topo");
    const barra = !topo && tela && tela.querySelector(".barra-hoje");
    const pagina = !topo && !barra && tela && tela.querySelector(".pagina");
    const alvo = topo || barra || pagina || document.body;
    if (root.parentElement !== alvo) alvo.appendChild(root);
    root.classList.toggle("cn-no-topo", !!topo);
    root.classList.toggle("cn-na-barra", !!barra);
    root.classList.toggle("cn-na-pagina", !!pagina);
    // enquanto a tela carrega, espera o cabeçalho existir para não "pular" de lugar
    root.style.visibility = topo || barra || pagina ? "" : "hidden";
  };
  if (tela)
    new MutationObserver(acoplar).observe(tela, {
      childList: true,
      subtree: true,
    });
  acoplar();
  // se a tela falhar ao carregar (sem cabeçalho), o sino aparece mesmo assim no canto
  setTimeout(() => {
    root.style.visibility = "";
  }, 3000);

  const sino = root.querySelector(".cn-sino");
  const painel = root.querySelector(".cn-painel");
  const lista = root.querySelector(".cn-lista");
  const contador = root.querySelector(".cn-contador");
  const resumo = root.querySelector(".cn-resumo");
  let items = [];
  let filtro = "todas";
  let canal = null;
  const avisadas = new Set(); // ids que já viraram pop-up (evita repetir)

  function atualizarContador() {
    const n = items.filter((x) => !x.lida).length;
    contador.textContent = n > 99 ? "99+" : String(n);
    contador.hidden = n === 0;
    resumo.textContent = n
      ? `${n} ${n === 1 ? "notificação não lida" : "notificações não lidas"}`
      : "Tudo em dia por aqui.";
    sino.setAttribute(
      "aria-label",
      n
        ? `Abrir notificações, ${n} ${n === 1 ? "não lida" : "não lidas"}`
        : "Abrir notificações",
    );
  }

  /* ---------- 3) pop-ups ---------- */
  const MAX_TOASTS = 3;
  const fila = [];
  let visiveis = 0;

  // Dá uma "batidinha" no sino quando um aviso chega até ele.
  function pulsarSino() {
    sino.classList.remove("cn-pulso");
    void sino.offsetWidth;
    sino.classList.add("cn-pulso");
    window.setTimeout(() => sino.classList.remove("cn-pulso"), 900);
  }
  // Mais de 3 avisos ao mesmo tempo: os demais esperam na fila (e já estão na central).
  function enfileirarToast(item) {
    if (avisadas.has(String(item.id))) return;
    avisadas.add(String(item.id));
    fila.push(item);
    processarFila();
  }
  function processarFila() {
    while (visiveis < MAX_TOASTS && fila.length) mostrarToast(fila.shift());
  }

  // O pop-up entra de baixo para cima, fica alguns segundos e SOBE até o sino
  // (a notificação continua guardada na central). Novos avisos entram por cima,
  // então os que já estão na tela não saem do lugar.
  function mostrarToast(item) {
    visiveis++;
    const t = tp(item.tipo);
    const m = META[t];
    const toast = document.createElement("article");
    toast.className = `cn-toast cn-toast--${t}`;
    toast.tabIndex = 0;
    toast.innerHTML = `<span class="cn-icone">${svg(t)}</span><div class="cn-toast__texto"><b>${escN(item.titulo)}</b><span>${escN(item.mensagem || m.padrao)}</span><time>${escN(relativo(item.criado_em))}</time></div><button type="button" aria-label="Dispensar notificação">×</button>`;
    toasts.prepend(toast);
    requestAnimationFrame(() => toast.classList.add("visivel"));

    let timer = null;
    let encerrado = false;
    let restante = m.duracao;
    let iniciouEm = Date.now();
    const liberar = () => {
      toast.remove();
      visiveis--;
      processarFila();
    };
    const sumir = () => {
      toast.classList.remove("visivel");
      window.setTimeout(liberar, reduzMovimento() ? 0 : 300);
    };
    const dispensar = () => {
      if (encerrado) return;
      encerrado = true;
      window.clearTimeout(timer);
      sumir();
    };
    const subirParaOSino = () => {
      if (encerrado) return;
      encerrado = true;
      window.clearTimeout(timer);
      const a = toast.getBoundingClientRect();
      const b = sino.getBoundingClientRect();
      if (reduzMovimento() || !toast.animate || !b.width) {
        sumir();
        pulsarSino();
        return;
      }
      const dx = b.left + b.width / 2 - (a.left + a.width / 2);
      const dy = b.top + b.height / 2 - (a.top + a.height / 2);
      toast.style.pointerEvents = "none";
      toast
        .animate(
          [
            { transform: "translate(0,0) scale(1)", opacity: 1 },
            {
              transform: `translate(${dx * 0.55}px,${dy * 0.55}px) scale(0.55)`,
              opacity: 0.95,
              offset: 0.65,
            },
            {
              transform: `translate(${dx}px,${dy}px) scale(0.08)`,
              opacity: 0,
            },
          ],
          {
            duration: 700,
            easing: "cubic-bezier(.45,0,.7,.1)",
            fill: "forwards",
          },
        )
        .finished.then(
          () => {
            liberar();
            pulsarSino();
          },
          liberar,
        );
    };
    const agendar = (ms) => {
      window.clearTimeout(timer);
      iniciouEm = Date.now();
      timer = window.setTimeout(subirParaOSino, ms);
    };
    const pausar = () => {
      if (encerrado) return;
      window.clearTimeout(timer);
      restante = Math.max(2000, restante - (Date.now() - iniciouEm));
    };
    const retomar = () => !encerrado && agendar(restante);

    agendar(restante);
    toast.addEventListener("mouseenter", pausar);
    toast.addEventListener("mouseleave", retomar);
    toast.addEventListener("focusin", pausar);
    toast.addEventListener("focusout", retomar);
    toast.querySelector("button").addEventListener("click", (e) => {
      e.stopPropagation();
      dispensar(); // fechar o pop-up NÃO marca como lida
    });
    const abrirDoToast = () => {
      dispensar();
      abrir(item);
    };
    toast.addEventListener("click", (e) => {
      if (!e.target.closest("button")) abrirDoToast();
    });
    toast.addEventListener("keydown", (e) => {
      if (e.target !== toast) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        abrirDoToast();
      } else if (e.key === "Escape") dispensar();
    });
  }

  /* ---------- 4) painel ---------- */
  function desenhar() {
    atualizarContador();
    const visiveisLista = items.filter(
      (x) =>
        filtro === "todas" ||
        x.tipo === filtro ||
        (filtro === "clinico" && (x.tipo === "paciente" || x.tipo === "caso")),
    );
    if (!visiveisLista.length) {
      lista.innerHTML = `<div class="cn-vazio"><span>✓</span><b>Nenhuma notificação por aqui</b><small>Quando houver uma nova prova, atividade ou lembrete próximo, ele aparecerá aqui.</small></div>`;
      return;
    }
    lista.innerHTML = visiveisLista
      .map((x) => {
        const t = tp(x.tipo);
        return `<article class="cn-item cn-item--${t} ${x.lida ? "lida" : "nao-lida"}" data-id="${escN(x.id)}" tabindex="0">
      <span class="cn-icone">${svg(t)}</span><div class="cn-conteudo"><div class="cn-meta"><span class="cn-etiqueta">${META[t].etiqueta}</span><time>${escN(fmt(x.criado_em))}</time>${x.lida ? "" : '<i class="cn-ponto" aria-label="Não lida"></i>'}</div>
      <h3>${escN(x.titulo)}</h3><p>${escN(x.mensagem || META[t].padrao)}</p>
      <div class="cn-acoes"><a class="cn-acao" href="${escN(destino(x))}" data-abrir="${escN(x.id)}">${META[t].acao} <span>→</span></a>${x.lida ? "" : `<button type="button" class="cn-lida" data-lida="${escN(x.id)}">Marcar como lida</button>`}</div></div></article>`;
      })
      .join("");
  }

  function fecharPainel() {
    painel.hidden = true;
    sino.setAttribute("aria-expanded", "false");
  }
  async function marcarLida(item) {
    if (!item || item.lida) return;
    item.lida = true;
    item.lida_em = new Date().toISOString();
    desenhar();
    const { error } = await db
      .from("notificacoes")
      .update({ lida_em: item.lida_em })
      .eq("id", item.id)
      .eq("destinatario_id", perfil.id);
    if (error) {
      item.lida = false;
      item.lida_em = null;
      desenhar();
    }
  }
  // Abre o conteúdo relacionado (atividade, prova, calendário) e marca como lida.
  function abrir(item) {
    marcarLida(item);
    fecharPainel();
    const alvo = destino(item);
    if (location.hash === alvo) window.dispatchEvent(new HashChangeEvent("hashchange"));
    else location.hash = alvo;
  }

  sino.addEventListener("click", async () => {
    const abrirPainel = painel.hidden;
    painel.hidden = !abrirPainel;
    sino.setAttribute("aria-expanded", String(abrirPainel));
    if (abrirPainel) await carregar(false);
  });
  root.querySelector(".cn-fechar").addEventListener("click", () => {
    fecharPainel();
    sino.focus();
  });
  painel.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      fecharPainel();
      sino.focus();
    }
  });
  root.querySelectorAll("[data-filtro]").forEach((b) =>
    b.addEventListener("click", () => {
      filtro = b.dataset.filtro;
      root
        .querySelectorAll("[data-filtro]")
        .forEach((x) => x.classList.toggle("ativo", x === b));
      desenhar();
    }),
  );
  root.querySelector(".cn-marcar").addEventListener("click", async () => {
    const ids = items.filter((x) => !x.lida).map((x) => x.id);
    if (!ids.length) return;
    const { error } = await db
      .from("notificacoes")
      .update({ lida_em: new Date().toISOString() })
      .in("id", ids)
      .eq("destinatario_id", perfil.id);
    if (!error) {
      items = items.map((x) => ({ ...x, lida: true }));
      desenhar();
    }
  });
  const itemDe = (id) => items.find((x) => String(x.id) === String(id));
  lista.addEventListener("click", (e) => {
    const bLida = e.target.closest("[data-lida]");
    if (bLida) return marcarLida(itemDe(bLida.dataset.lida));
    const card = e.target.closest(".cn-item");
    if (!card) return;
    const item = itemDe(card.dataset.id);
    if (!item) return;
    e.preventDefault();
    abrir(item);
  });
  lista.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || e.target.closest("a, button")) return;
    const card = e.target.closest(".cn-item");
    const item = card && itemDe(card.dataset.id);
    if (item) abrir(item);
  });

  /* ---------- 5) dados ---------- */
  async function carregar(mostrarNovas = false) {
    const { data, error } = await db
      .from("notificacoes")
      .select(
        "id, tipo, titulo, mensagem, link, atividade_id, criado_em, lida_em",
      )
      .eq("destinatario_id", perfil.id)
      .order("criado_em", { ascending: false })
      .limit(50);
    if (error) {
      lista.innerHTML =
        '<div class="cn-aviso-config"><b>Notificações ainda não configuradas</b><small>É necessário aplicar o arquivo SQL de configuração incluído no projeto.</small></div>';
      return;
    }
    const anteriores = new Set(items.map((x) => String(x.id)));
    items = (data || []).map((x) => ({ ...x, lida: !!x.lida_em }));
    // o que já existia não vira pop-up; só entra na lista de "já avisadas"
    if (!mostrarNovas) items.forEach((x) => avisadas.add(String(x.id)));
    desenhar();
    if (mostrarNovas)
      items
        .filter((x) => !anteriores.has(String(x.id)) && !x.lida)
        .reverse()
        .forEach(enfileirarToast);
  }

  // Pede ao banco para gerar os avisos que já estão "perto": lembretes na antecedência
  // escolhida e provas se aproximando (idempotente: nunca duplica).
  const gerarAutomaticas = async () => {
    try {
      const r = await db.rpc("gerar_notificacoes_automaticas");
      if (r && r.error) await db.rpc("gerar_notificacoes_lembretes");
    } catch (e) {}
  };
  const atualizarAvisos = async () => {
    await gerarAutomaticas();
    await carregar(true);
  };

  gerarAutomaticas()
    .then(() => carregar(false))
    .then(() => {
      canal = db
        .channel(`notificacoes-aluno-${perfil.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notificacoes",
            filter: `destinatario_id=eq.${perfil.id}`,
          },
          (payload) => {
            const n = payload.new;
            if (items.some((x) => String(x.id) === String(n.id))) return;
            const item = { ...n, lida: !!n.lida_em };
            items.unshift(item);
            desenhar();
            enfileirarToast(item);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notificacoes",
            filter: `destinatario_id=eq.${perfil.id}`,
          },
          (payload) => {
            const i = items.findIndex(
              (x) => String(x.id) === String(payload.new.id),
            );
            if (i >= 0)
              items[i] = {
                ...items[i],
                ...payload.new,
                lida: !!payload.new.lida_em,
              };
            desenhar();
          },
        )
        .subscribe();
    });
  // Avisos que dependem do relógio (lembretes e provas próximas) são conferidos a cada
  // 30 s enquanto a aba está visível, e na hora em que o aluno volta para ela.
  window.setInterval(() => {
    if (!document.hidden) atualizarAvisos();
  }, 30000);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) atualizarAvisos();
  });
  window.addEventListener(
    "beforeunload",
    () => {
      if (canal) db.removeChannel(canal);
    },
    { once: true },
  );
}
