// Dashboard do aluno (somente leitura): início, pacientes e casos clínicos.
(async () => {
  const perfil = await exigirPapel("aluno");
  if (!perfil) return;
  if (typeof iniciarNotificacoesConecta === "function") iniciarNotificacoesConecta(db, perfil);

  const tela = document.getElementById("tela");
  const primeiro = perfil.nome.trim().split(/\s+/)[0];
  const nomeBonito = primeiro.charAt(0).toUpperCase() + primeiro.slice(1);
  document.getElementById("nome").textContent = perfil.nome;
  document.getElementById("inicial").textContent = nomeBonito[0];
  document.getElementById("sair").addEventListener("click", sair);

  const ICONES = {
    inicio:
      '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    pacientes:
      '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2 .6 3.5 2.4 3.5 5.5"/>',
    sair: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    atividades:
      '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 13l2 2 4-4"/>',
    coracao:
      '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/><path d="M6 12h3l1.5-3 3 6 1.5-3h3"/>',
    ant: '<path d="M15 6l-6 6 6 6"/>',
    prox: '<path d="M9 6l6 6-6 6"/>',
    capelo:
      '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/>',
    livro:
      '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M9 8h6"/>',
    calendario:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    prova: '<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4M10 12h6M10 16h6"/>',
    arquivo:
      '<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4M10 13h6M10 17h4"/>',
    clipe:
      '<path d="M20 11.5l-8 8a5 5 0 0 1-7-7l8.5-8.5a3.5 3.5 0 0 1 5 5L10 17.5a2 2 0 0 1-3-3l7.5-7.5"/>',
    editar:
      '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    lixeira: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    seta: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  };
  const ico = (n) =>
    `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONES[n]}</svg>`;
  document.getElementById("sair").innerHTML = ico("sair");

  const esc = (t) =>
    String(t ?? "").replace(
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

  // Boas-vindas ao logar: mostra a mensagem uma vez por sessão e depois revela o painel.
  const CHAVE_BOAS_VINDAS = "conecta_boas_vindas_aluno";
  document.getElementById("sair").addEventListener("click", () => {
    try {
      sessionStorage.removeItem(CHAVE_BOAS_VINDAS);
    } catch (e) {}
  });

  (function boasVindas() {
    const raiz = document.documentElement;
    let jaMostrou = false;
    try {
      jaMostrou = !!sessionStorage.getItem(CHAVE_BOAS_VINDAS);
      if (!jaMostrou) sessionStorage.setItem(CHAVE_BOAS_VINDAS, "1");
    } catch (e) {}
    if (jaMostrou) {
      raiz.classList.remove("boas-vindas-ativa");
      return;
    }

    const reduzir = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const el = document.createElement("div");
    el.className = "boas-vindas";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.innerHTML = `
      <div class="boas-vindas__conteudo">
        <img class="boas-vindas__logo" src="../assets/logo.png" alt="CONECTA – Prontuário Digital de Enfermagem">
        <h2 class="boas-vindas__titulo">Bem-vindo(a), ${esc(nomeBonito)}</h2>
        <p class="boas-vindas__sub">Preparando seus estudos…</p>
        <span class="boas-vindas__barra" aria-hidden="true"><i></i></span>
      </div>`;
    document.body.appendChild(el);

    setTimeout(
      () => {
        el.classList.add("saindo");
        raiz.classList.remove("boas-vindas-ativa");
        document.body.classList.add("entrada");
        setTimeout(() => el.remove(), 700);
        setTimeout(() => document.body.classList.remove("entrada"), 2400);
      },
      reduzir ? 900 : 2800,
    );
  })();
  const dia = (d) => new Date(d).toLocaleDateString("pt-BR");
  const diaHora = (d) =>
    new Date(d).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  const chave = (d) => {
    const x = new Date(d);
    return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`;
  };
  const iso = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const dataLocal = (t) => {
    const [y, m, d] = t.split("-");
    return new Date(+y, +m - 1, +d);
  };
  const localInput = (d = new Date()) => {
    const x = new Date(d);
    x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
    return x.toISOString().slice(0, 16);
  };
  const ok = async (promessa) => {
    const r = await promessa;
    if (r.error) throw new Error(r.error.message);
    return r.data;
  };
  const mapa = (arr, chaveDe, tituloDe) => {
    const m = new Map();
    arr.forEach((x) => {
      const k = chaveDe(x);
      m.set(k, [...(m.get(k) || []), tituloDe(x)]);
    });
    return m;
  };
  const falha = (e) => {
    tela.innerHTML = `<p class="vazio">Não foi possível carregar os dados (${esc(e.message)}). Atualize a página.</p>`;
  };
  const avatar = (p) =>
    p.avatar_url
      ? `<img class="avatar" src="${esc(p.avatar_url)}" alt="">`
      : `<span class="avatar ${p.sexo === "masculino" ? "m" : "f"}" aria-hidden="true">${esc(p.nome[0])}</span>`;

  // ---------- janelas ----------
  function formulario({
    titulo,
    texto = "",
    campos = [],
    botao = "Salvar",
    perigo = false,
    aoEnviar,
    aoAbrir,
  }) {
    const d = document.createElement("dialog");
    d.className = "modal";
    d.innerHTML = `<form><h2>${esc(titulo)}</h2>${texto ? `<p>${texto}</p>` : ""}
      ${campos
        .map(
          (c) =>
            `<label class="campo2"><span>${esc(c.r)}${c.opc ? "" : " *"}</span>${
              c.t === "textarea"
                ? `<textarea name="${c.n}" rows="${c.rows || 7}" ${c.opc ? "" : "required"}>${esc(c.val)}</textarea>`
                : c.t === "select"
                  ? `<select name="${c.n}" ${c.opc ? "" : "required"}>${(c.opts || []).map(([val, l]) => `<option value="${esc(val)}" ${String(val) === String(c.val) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`
                : c.t === "file"
                  ? `<input name="${c.n}" type="file" accept="${c.accept || ""}">`
                  : `<input name="${c.n}" type="${c.t}" value="${esc(c.val)}" ${c.opc ? "" : "required"}>`
            }${c.dica ? `<small>${esc(c.dica)}</small>` : ""}</label>`,
        )
        .join("")}
      <p class="erro" role="alert"></p>
      <div class="rodape"><button type="button" class="btn claro peq" data-cancelar>Cancelar</button><button type="submit" class="btn peq ${perigo ? "perigo" : "teal"}">${esc(botao)}</button></div></form>`;
    document.body.appendChild(d);
    d.addEventListener("close", () => d.remove());
    d.querySelector("[data-cancelar]").addEventListener("click", () =>
      d.close(),
    );
    const f = d.querySelector("form"),
      erro = d.querySelector(".erro"),
      enviar = f.querySelector("[type=submit]");
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const v = {};
      campos.forEach((c) => {
        const el = f.elements[c.n];
        v[c.n] = c.t === "file" ? el.files[0] || null : el.value.trim();
      });
      enviar.disabled = true;
      erro.textContent = "";
      try {
        await aoEnviar(v);
        d.close();
        rotear();
      } catch (err) {
        erro.textContent = err.message;
        enviar.disabled = false;
      }
    });
    d.showModal();
    if (aoAbrir) aoAbrir(d);
  }

  async function formRegistro(id, casoId) {
    const a = id
      ? await ok(db.from("atendimentos").select("*").eq("id", id).single())
      : {};
    // Medicamentos já registrados (edição) e os sugeridos pelo professor para este caso
    const casoDoRegistro = id ? a.caso_id : casoId;
    const [medsAntes, sugeridos] = await Promise.all([
      id ? Medicamentos.carregar(db, "atendimento_medicamentos", "atendimento_id", id) : [],
      Medicamentos.carregar(db, "caso_medicamentos", "caso_id", Number(casoDoRegistro)),
    ]);
    const med = Medicamentos.criarSeletor({
      db,
      titulo: "Medicamentos administrados",
      inicial: medsAntes,
      sugestoes: sugeridos,
      comHorario: true,
      exigirDose: true,
    });
    formulario({
      titulo: id ? "Editar meu registro" : "Registrar o que fiz",
      botao: "Salvar",
      campos: [
        {
          n: "data_atendimento",
          r: "Data e hora",
          t: "datetime-local",
          val: localInput(a.data_atendimento),
        },
        {
          n: "evolucao",
          r: "O que você fez com o paciente",
          t: "textarea",
          val: a.evolucao,
          dica: "Descreva os cuidados realizados, observações e a evolução do paciente.",
        },
      ],
      aoAbrir: (d) => Medicamentos.montarNoForm(d, med),
      aoEnviar: async (v) => {
        med.validar();
        const dados = {
          data_atendimento: new Date(v.data_atendimento).toISOString(),
          evolucao: v.evolucao,
        };
        let atId = id;
        if (id) await ok(db.from("atendimentos").update(dados).eq("id", id));
        else {
          const novo = await ok(
            db
              .from("atendimentos")
              .insert({ ...dados, caso_id: Number(casoId) })
              .select("id")
              .single(),
          );
          atId = novo.id;
        }
        await Medicamentos.salvar(
          db,
          "atendimento_medicamentos",
          "atendimento_id",
          atId,
          med.valores(),
          medsAntes.length > 0,
        );
      },
    });
  }

  // Em quanto tempo antes o aluno quer ser avisado ("nao" = não avisar; 0 = na hora).
  const ANTECEDENCIAS = [
    ["0", "Na hora do lembrete"],
    ["5", "5 minutos antes"],
    ["15", "15 minutos antes"],
    ["30", "30 minutos antes"],
    ["60", "1 hora antes"],
    ["120", "2 horas antes"],
    ["1440", "1 dia antes"],
    ["2880", "2 dias antes"],
    ["nao", "Não quero ser avisado"],
  ];
  const valorAntecedencia = (v) => (v === "nao" ? null : Number(v));

  async function formLembrete(id, dataPre) {
    const l = id
      ? await ok(db.from("lembretes").select("*").eq("id", id).single())
      : {};
    formulario({
      titulo: id ? "Editar meu lembrete" : "Novo lembrete",
      botao: "Salvar",
      campos: [
        { n: "titulo", r: "Título", t: "text", val: l.titulo },
        {
          n: "data_lembrete",
          r: "Data",
          t: "date",
          val: l.data_lembrete || dataPre || iso(new Date()),
        },
        {
          n: "hora",
          r: "Hora",
          t: "time",
          val: l.hora ? l.hora.slice(0, 5) : "",
          opc: true,
        },
        {
          n: "avisar_antes_min",
          r: "Quando quer ser lembrado?",
          t: "select",
          opts: ANTECEDENCIAS,
          val: id
            ? l.avisar_antes_min === null || l.avisar_antes_min === undefined
              ? "nao"
              : String(l.avisar_antes_min)
            : "30",
          dica: "Você recebe um aviso no sino e um pop-up na tela. Sem horário definido, usamos 08:00 como referência.",
        },
        {
          n: "descricao",
          r: "Detalhes",
          t: "textarea",
          rows: 3,
          val: l.descricao,
          opc: true,
        },
      ],
      aoEnviar: async (v) => {
        const dados = {
          titulo: v.titulo,
          data_lembrete: v.data_lembrete,
          hora: v.hora || null,
          descricao: v.descricao || null,
          avisar_antes_min: valorAntecedencia(v.avisar_antes_min),
        };
        try {
          if (id) await ok(db.from("lembretes").update(dados).eq("id", id));
          else
            await ok(
              db.from("lembretes").insert({ ...dados, aluno_id: perfil.id }),
            );
        } catch (err) {
          if (/avisar_antes_min/.test(err.message))
            throw new Error(
              "O aviso de lembretes ainda não foi ativado no banco. Execute o arquivo database/notificacoes.sql no Supabase.",
            );
          throw err;
        }
      },
    });
  }

  const LETRAS = "ABCDEF";
  const fmtNota = (n) => Number(n).toFixed(1).replace(".", ",");

  // ---------- monitoramento ----------
  // Registra saídas da página e uso de copiar/recortar/colar enquanto o aluno responde.
  // Guarda só o tipo e o horário (no colar, apenas o tamanho do texto, nunca o conteúdo).
  const AVISO_MONITORAMENTO =
    "Atenção: nesta atividade o sistema registra quando você sai da página e quando usa copiar, recortar ou colar.";
  function monitorar(dialogo, atividadeId) {
    const registrar = (tipo, detalhe = null) => {
      db.from("monitoramento_eventos")
        .insert({
          atividade_id: Number(atividadeId),
          aluno_id: perfil.id,
          tipo,
          detalhe,
        })
        .then(
          () => {},
          () => {},
        );
    };
    let fora = false,
      seletorAberto = false;
    // visibilitychange e blur disparam juntos ao trocar de aba; "fora" evita contar duas vezes.
    const sair = () => {
      if (fora || seletorAberto) return;
      fora = true;
      registrar("saiu_pagina");
    };
    const voltar = () => {
      fora = false;
      seletorAberto = false;
    };
    const aoVisibilidade = () => (document.hidden ? sair() : voltar());
    // Escolher arquivo tira o foco da janela; isso não conta como saída.
    const aoClicar = (e) => {
      if (e.target.closest && e.target.closest("input[type=file]"))
        seletorAberto = true;
    };
    const aoCopiar = () => registrar("copiar");
    const aoRecortar = () => registrar("recortar");
    const aoColar = (e) => {
      const t = e.clipboardData ? e.clipboardData.getData("text") : "";
      registrar("colar", t ? `${t.length} caracteres` : null);
    };
    const aoSoltar = (e) => {
      const t = e.dataTransfer ? e.dataTransfer.getData("text") : "";
      if (t) registrar("colar", `arrastado, ${t.length} caracteres`);
    };
    document.addEventListener("visibilitychange", aoVisibilidade);
    window.addEventListener("blur", sair);
    window.addEventListener("focus", voltar);
    dialogo.addEventListener("click", aoClicar);
    dialogo.addEventListener("copy", aoCopiar);
    dialogo.addEventListener("cut", aoRecortar);
    dialogo.addEventListener("paste", aoColar);
    dialogo.addEventListener("drop", aoSoltar);
    dialogo.addEventListener("close", () => {
      document.removeEventListener("visibilitychange", aoVisibilidade);
      window.removeEventListener("blur", sair);
      window.removeEventListener("focus", voltar);
    });
  }

  // Responder atividade de múltipla escolha (uma única vez; a correção é feita no banco)
  async function formResposta(atividadeId) {
    const [a, qs] = await Promise.all([
      ok(
        db
          .from("atividades")
          .select("id, titulo")
          .eq("id", atividadeId)
          .single(),
      ),
      ok(
        db
          .from("questoes")
          .select("id, enunciado, alternativas")
          .eq("atividade_id", atividadeId)
          .order("ordem")
          .order("id"),
      ),
    ]);
    if (!qs.length)
      throw new Error(
        "O professor ainda não cadastrou as questões desta atividade.",
      );
    const d = document.createElement("dialog");
    d.className = "modal larga";
    d.innerHTML = `<form><h2>${esc(a.titulo)}</h2><p>Escolha uma alternativa em cada questão. Você só pode enviar <b>uma vez</b>; depois verá sua nota e o gabarito.<br><small>${AVISO_MONITORAMENTO}</small></p>
      ${qs
        .map(
          (
            q,
            i,
          ) => `<fieldset class="questao"><legend class="leg">Questão ${i + 1}</legend><p class="texto" style="margin:0">${esc(q.enunciado)}</p>
        ${q.alternativas.map((t, j) => `<label class="opcao"><input type="radio" name="q${q.id}" value="${j}" required><b>${LETRAS[j]}</b><span>${esc(t)}</span></label>`).join("")}</fieldset>`,
        )
        .join("")}
      <p class="erro" role="alert"></p>
      <div class="rodape"><button type="button" class="btn claro peq" data-cancelar>Cancelar</button><button type="submit" class="btn teal peq">Enviar respostas</button></div></form>`;
    document.body.appendChild(d);
    d.addEventListener("close", () => d.remove());
    d.querySelector("[data-cancelar]").addEventListener("click", () =>
      d.close(),
    );
    const f = d.querySelector("form"),
      erro = d.querySelector(".erro"),
      enviar = f.querySelector("[type=submit]");
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      erro.textContent = "";
      enviar.disabled = true;
      const respostas = {};
      qs.forEach((q) => {
        respostas[q.id] = Number(f.elements["q" + q.id].value);
      });
      try {
        await ok(
          db.rpc("enviar_respostas", {
            p_atividade: Number(atividadeId),
            p_respostas: respostas,
          }),
        );
        d.close();
        rotear();
      } catch (err) {
        erro.textContent = err.message;
        enviar.disabled = false;
      }
    });
    d.showModal();
    monitorar(d, atividadeId);
  }

  const TIPOS = {
    pdf: "application/pdf",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
  };

  async function formEntrega(atividadeId) {
    const [a, atual] = await Promise.all([
      ok(
        db
          .from("atividades")
          .select("id, titulo")
          .eq("id", atividadeId)
          .single(),
      ),
      ok(
        db
          .from("entregas")
          .select("*")
          .eq("atividade_id", atividadeId)
          .maybeSingle(),
      ),
    ]);
    formulario({
      titulo: atual ? "Editar entrega" : "Enviar atividade",
      botao: "Enviar",
      texto: `<b>${esc(a.titulo)}</b>${atual ? "<br>Ao salvar, sua entrega anterior é substituída." : ""}<br><small>${AVISO_MONITORAMENTO}</small>`,
      aoAbrir: (d) => monitorar(d, atividadeId),
      campos: [
        {
          n: "comentario",
          r: "Comentário ou resposta",
          t: "textarea",
          val: atual && atual.comentario,
          opc: true,
        },
        {
          n: "arquivo",
          r: "Arquivo",
          t: "file",
          accept: ".pdf,.doc,.docx,.png,.jpg,.jpeg",
          opc: true,
          dica:
            atual && atual.nome_arquivo
              ? `Arquivo atual: ${atual.nome_arquivo}. Deixe vazio para manter. PDF, Word ou imagem, até 10 MB.`
              : "PDF, Word ou imagem, até 10 MB.",
        },
      ],
      aoEnviar: async (v) => {
        if (!v.comentario && !v.arquivo && !(atual && atual.storage_path))
          throw new Error("Escreva um comentário ou anexe um arquivo.");
        let caminho = atual ? atual.storage_path : null,
          nomeArq = atual ? atual.nome_arquivo : null,
          antigo = null;
        if (v.arquivo) {
          const ext = (v.arquivo.name.split(".").pop() || "").toLowerCase();
          if (!TIPOS[ext])
            throw new Error(
              "Envie um arquivo PDF, Word (.doc/.docx) ou imagem (.png/.jpg).",
            );
          if (v.arquivo.size > 10 * 1024 * 1024)
            throw new Error("O arquivo passa de 10 MB.");
          antigo = caminho;
          caminho = `${perfil.id}/${atividadeId}/${crypto.randomUUID()}.${ext}`;
          const { error } = await db.storage
            .from("entregas")
            .upload(caminho, v.arquivo, { contentType: TIPOS[ext] });
          if (error) throw new Error(error.message);
          nomeArq = v.arquivo.name;
        }
        try {
          await ok(
            db.from("entregas").upsert(
              {
                atividade_id: Number(atividadeId),
                aluno_id: perfil.id,
                comentario: v.comentario || null,
                storage_path: caminho,
                nome_arquivo: nomeArq,
                enviado_em: new Date().toISOString(),
              },
              { onConflict: "atividade_id,aluno_id" },
            ),
          );
        } catch (e) {
          if (v.arquivo) await db.storage.from("entregas").remove([caminho]);
          throw e;
        }
        if (antigo) await db.storage.from("entregas").remove([antigo]);
      },
    });
  }

  const acoes = {
    novoLembrete: (d) => formLembrete(null, d.data),
    editarLembrete: (d) => formLembrete(d.id),
    excluirLembrete: (d) =>
      formulario({
        titulo: "Excluir lembrete",
        texto: "Este lembrete será apagado.",
        botao: "Excluir",
        perigo: true,
        campos: [],
        aoEnviar: () => ok(db.from("lembretes").delete().eq("id", d.id)),
      }),
    enviarAtividade: (d) => formEntrega(d.id),
    responderAtividade: (d) => formResposta(d.id),
    cancelarEntrega: (d) =>
      formulario({
        titulo: "Cancelar entrega",
        texto: "Sua entrega será apagada. Você pode enviar de novo depois.",
        botao: "Cancelar entrega",
        perigo: true,
        campos: [],
        aoEnviar: async () => {
          await ok(db.from("entregas").delete().eq("id", d.id));
          if (d.path) await db.storage.from("entregas").remove([d.path]);
        },
      }),
    novoRegistro: (d) => formRegistro(null, d.caso),
    editarRegistro: (d) => formRegistro(d.id),
    excluirRegistro: (d) =>
      formulario({
        titulo: "Excluir registro",
        texto: "Este registro será apagado.",
        botao: "Excluir",
        perigo: true,
        campos: [],
        aoEnviar: () => ok(db.from("atendimentos").delete().eq("id", d.id)),
      }),
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-acao]");
    if (b && acoes[b.dataset.acao])
      Promise.resolve(acoes[b.dataset.acao](b.dataset)).catch((err) =>
        alert(err.message),
      );
  });
  const btn = (acao, texto, extra = "", cls = "claro") =>
    `<button type="button" class="btn ${cls} peq" data-acao="${acao}" ${extra}>${texto}</button>`;

  function menu(rota) {
    const itens = [
      ["", "inicio", "Início"],
      ["pacientes", "pacientes", "Pacientes"],
      ["atividades", "atividades", "Atividades"],
    ];
    const atual = ["paciente", "caso"].includes(rota) ? "pacientes" : rota;
    document.getElementById("nav").innerHTML = itens
      .map(
        ([r, i, t]) =>
          `<a href="#/${r}" class="${r === atual ? "ativo" : ""}" ${r === atual ? 'aria-current="page"' : ""}>${ico(i)}${t}</a>`,
      )
      .join("");
  }

  // ---------- peças reutilizáveis ----------
  const cartaoPaciente = (p, n) => `
    <a class="item" href="#/paciente/${p.id}">${avatar(p)}
      <h3>${esc(p.nome)}</h3>
      <small>${p.status === "obito" ? "Óbito" : n + (n === 1 ? " caso clínico" : " casos clínicos")}</small>
      <span class="ver">Histórico</span>
    </a>`;

  function calendario(ev, aoClicar) {
    const ref = new Date();
    ref.setDate(1);
    const box = document.createElement("div");
    const desenha = () => {
      const ano = ref.getFullYear(),
        mes = ref.getMonth(),
        hoje = chave(new Date());
      const inicio = new Date(ano, mes, 1 - ref.getDay());
      let dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
        .map((s) => `<span class="sem">${s}</span>`)
        .join("");
      for (let i = 0; i < 42; i++) {
        const d = new Date(inicio);
        d.setDate(inicio.getDate() + i);
        if (i >= 35 && d.getMonth() !== mes) break;
        const k = chave(d);
        const dica = [
          ...(ev.pv.get(k) || []).map((t) => "Prova: " + t),
          ...(ev.ati.get(k) || []).map((t) => "Atividade: " + t),
          ...(ev.le.get(k) || []),
          ...(ev.me.get(k) || []).map((t) => "Meu lembrete: " + t),
          ...(ev.at.has(k) ? ["Há atendimentos neste dia"] : []),
        ].join(" • ");
        const pts = `${ev.le.has(k) ? '<i class="p-le"></i>' : ""}${ev.me.has(k) ? '<i class="p-me"></i>' : ""}${ev.ati.has(k) ? '<i class="p-ati"></i>' : ""}${ev.at.has(k) ? '<i class="p-at"></i>' : ""}${ev.pv.has(k) ? '<i class="p-pv"></i>' : ""}`;
        dias += `<span class="d ${d.getMonth() !== mes ? "fora" : ""} ${k === hoje ? "hoje" : ""} ${ev.pv.has(k) ? "pv" : ""}" data-dia="${iso(d)}" ${dica ? `title="${esc(dica)}"` : ""}><span>${d.getDate()}</span><span class="pts">${pts}</span></span>`;
      }
      const titulo = ref.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
      box.innerHTML = `<div class="cal-topo"><button type="button" data-m="-1" aria-label="Mês anterior">${ico("ant")}</button><b>${titulo.charAt(0).toUpperCase() + titulo.slice(1)}</b><button type="button" data-m="1" aria-label="Próximo mês">${ico("prox")}</button></div><div class="cal ${aoClicar ? "clicavel" : ""}">${dias}</div><div class="legenda"><span><i style="background:var(--erro)"></i>Prova</span><span><i style="background:#1F5FA8"></i>Atividade</span><span><i style="background:var(--teal)"></i>Lembrete do professor</span><span><i style="background:#7B4FB3"></i>Meu lembrete</span><span><i style="background:var(--ouro)"></i>Atendimento</span></div>`;
      box.querySelectorAll("[data-m]").forEach((b) =>
        b.addEventListener("click", () => {
          ref.setMonth(ref.getMonth() + Number(b.dataset.m));
          desenha();
        }),
      );
      if (aoClicar)
        box
          .querySelectorAll("[data-dia]")
          .forEach((c) =>
            c.addEventListener("click", () => aoClicar(c.dataset.dia)),
          );
    };
    desenha();
    return box;
  }

  // ---------- "Hoje é" + mini calendário (todas as telas) ----------
  const dataHojeTexto = () =>
    new Date().toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  const chipHoje = () => {
    const t = dataHojeTexto();
    return `<button type="button" class="aluno-topo__data" data-abrir-cal aria-haspopup="dialog" aria-expanded="false" aria-label="Hoje é ${t}. Abrir calendário"><span class="aluno-topo__data-ico" aria-hidden="true">${ico("calendario")}</span><span><small>Hoje é</small><b>${t}</b></span></button>`;
  };
  // Linha do topo das páginas internas: data à esquerda, sino à direita (o sino é acoplado aqui).
  const barraHoje = () => `<div class="barra-hoje">${chipHoje()}</div>`;

  async function eventosCalendario() {
    const limite = new Date(Date.now() - 60 * 864e5);
    const [atd, lem, ati] = await Promise.all([
      db
        .from("atendimentos")
        .select("id, data_atendimento")
        .gte(
          "data_atendimento",
          new Date(Date.now() - 120 * 864e5).toISOString(),
        ),
      db
        .from("lembretes")
        .select("id, titulo, data_lembrete, aluno_id, criado_por")
        .gte("data_lembrete", iso(limite)),
      db
        .from("atividades")
        .select("id, titulo, tipo, data_limite")
        .gte("data_limite", limite.toISOString()),
    ]);
    const erro = [atd, lem, ati].find((r) => r.error);
    if (erro) throw new Error(erro.error.message);
    const meus = lem.data.filter(
        (l) => l.criado_por === perfil.id && l.aluno_id === perfil.id,
      ),
      doProfessor = lem.data.filter((l) => !meus.includes(l));
    return {
      at: new Set(atd.data.map((x) => chave(x.data_atendimento))),
      le: mapa(
        doProfessor,
        (l) => chave(dataLocal(l.data_lembrete)),
        (l) => l.titulo,
      ),
      me: mapa(
        meus,
        (l) => chave(dataLocal(l.data_lembrete)),
        (l) => l.titulo,
      ),
      ati: mapa(
        ati.data.filter((x) => x.tipo !== "prova"),
        (x) => chave(x.data_limite),
        (x) => x.titulo,
      ),
      pv: mapa(
        ati.data.filter((x) => x.tipo === "prova"),
        (x) => chave(x.data_limite),
        (x) => x.titulo,
      ),
    };
  }

  const mini = document.createElement("div");
  mini.id = "mini-cal";
  mini.className = "mini-cal";
  mini.hidden = true;
  mini.tabIndex = -1;
  mini.setAttribute("role", "dialog");
  mini.setAttribute("aria-label", "Calendário");
  mini.innerHTML =
    '<div class="mini-cal__corpo"></div><div class="mini-cal__dia" aria-live="polite"></div><a class="mini-cal__link" href="#/">Abrir calendário completo</a>';
  document.body.appendChild(mini);
  const miniCorpo = mini.querySelector(".mini-cal__corpo"),
    miniDia = mini.querySelector(".mini-cal__dia"),
    miniLink = mini.querySelector(".mini-cal__link");
  let miniChip = null;

  function fecharMini(devolverFoco) {
    if (mini.hidden) return;
    mini.hidden = true;
    if (miniChip) {
      miniChip.setAttribute("aria-expanded", "false");
      if (devolverFoco && miniChip.isConnected) miniChip.focus();
    }
    miniChip = null;
  }
  function posicionarMini() {
    if (mini.hidden || !miniChip) return;
    if (!miniChip.isConnected) return fecharMini();
    const r = miniChip.getBoundingClientRect(),
      larg = Math.min(340, window.innerWidth - 24),
      left = Math.max(12, Math.min(r.right - larg, window.innerWidth - larg - 12));
    mini.style.width = larg + "px";
    mini.style.left = left + "px";
    mini.style.top = r.bottom + 8 + "px";
    mini.style.maxHeight = Math.max(260, window.innerHeight - r.bottom - 20) + "px";
  }
  function detalhesDia(ev, d) {
    const dt = dataLocal(d),
      k = chave(dt);
    miniCorpo
      .querySelectorAll(".cal .d.sel")
      .forEach((x) => x.classList.remove("sel"));
    const cel = miniCorpo.querySelector(`[data-dia="${d}"]`);
    if (cel) cel.classList.add("sel");
    const itens = [
      ...(ev.pv.get(k) || []).map((t) => ["var(--erro)", "Prova: " + t]),
      ...(ev.ati.get(k) || []).map((t) => ["#1F5FA8", "Atividade: " + t]),
      ...(ev.le.get(k) || []).map((t) => ["var(--teal)", "Lembrete do professor: " + t]),
      ...(ev.me.get(k) || []).map((t) => ["#7B4FB3", "Meu lembrete: " + t]),
      ...(ev.at.has(k) ? [["var(--ouro)", "Há atendimentos registrados neste dia"]] : []),
    ];
    const titulo = dt.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    miniDia.innerHTML =
      `<h4>${esc(titulo)}</h4>` +
      (itens.length
        ? `<ul>${itens.map(([c, t]) => `<li><i style="background:${c}"></i><span>${esc(t)}</span></li>`).join("")}</ul>`
        : '<p class="vazio">Nada marcado para este dia.</p>');
  }
  async function abrirMini(chip) {
    // evita dois painéis abertos ao mesmo tempo
    const sino = document.querySelector("#conecta-notificacoes .cn-sino"),
      painel = document.querySelector("#conecta-notificacoes .cn-painel");
    if (painel && !painel.hidden) {
      painel.hidden = true;
      if (sino) sino.setAttribute("aria-expanded", "false");
    }
    miniChip = chip;
    chip.setAttribute("aria-expanded", "true");
    miniDia.innerHTML = "";
    miniCorpo.innerHTML = '<p class="vazio">Carregando…</p>';
    miniLink.hidden = !!tela.querySelector(".home-aluno");
    mini.hidden = false;
    posicionarMini();
    mini.focus({ preventScroll: true });
    try {
      const ev = await eventosCalendario();
      if (miniChip !== chip) return; // foi fechado enquanto carregava
      miniCorpo.replaceChildren(calendario(ev, (d) => detalhesDia(ev, d)));
    } catch (e) {
      if (miniChip !== chip) return;
      miniCorpo.innerHTML =
        '<p class="vazio">Não foi possível carregar o calendário.</p>';
    }
    posicionarMini();
  }
  miniCorpo.addEventListener("click", (e) => {
    if (e.target.closest("[data-m]")) miniDia.innerHTML = ""; // mudou de mês
  });
  mini.addEventListener("click", (e) => {
    if (e.target.closest(".mini-cal__link")) fecharMini();
  });
  document.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-abrir-cal]");
    if (chip) {
      if (!mini.hidden && miniChip === chip) fecharMini();
      else abrirMini(chip);
      return;
    }
    // composedPath: o clique em "mês anterior/próximo" remove o botão do DOM antes de chegar aqui
    if (!mini.hidden && !e.composedPath().includes(mini)) fecharMini();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !mini.hidden) fecharMini(true);
  });
  window.addEventListener("resize", posicionarMini);
  window.addEventListener("scroll", posicionarMini, { passive: true });

  function abrirArquivos(raiz) {
    raiz.querySelectorAll("[data-arquivo]").forEach((b) =>
      b.addEventListener("click", async () => {
        const aba = window.open("", "_blank");
        const { data, error } = await db.storage
          .from(b.dataset.bucket || "anexos")
          .createSignedUrl(b.dataset.arquivo, 60);
        if (error) {
          if (aba) aba.close();
          return alert("Não foi possível abrir o arquivo.");
        }
        aba.location = data.signedUrl;
      }),
    );
  }

  // ---------- telas ----------
  const formatoArquivo = (p) => {
    const s = String(p || "").toLowerCase(),
      ext = s.includes(".") ? s.split(".").pop() : "";
    return /^[a-z0-9]{2,5}$/.test(ext) ? ext.toUpperCase() : "Arquivo";
  };
  const classeArquivo = (f) =>
    f === "PDF"
      ? "pdf"
      : ["DOC", "DOCX"].includes(f)
        ? "doc"
        : ["PNG", "JPG", "JPEG"].includes(f)
          ? "img"
          : "outro";
  const diaMes = (t) => {
    const d = dataLocal(t);
    return {
      n: d.getDate(),
      m: d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", ""),
    };
  };

  async function inicio() {
    const desde = new Date(Date.now() - 120 * 864e5).toISOString();
    const [pac, casos, atd, anx, lem, ati, mat, entH, rspH] = await Promise.all(
      [
        db
          .from("pacientes")
          .select("id, nome, sexo, avatar_url, status")
          .order("nome"),
        db
          .from("casos_clinicos")
          .select("id, titulo, paciente_id, pacientes(nome, sexo, avatar_url)")
          .order("created_at", { ascending: false }),
        db
          .from("atendimentos")
          .select(
            "id, data_atendimento, casos_clinicos(id, titulo, pacientes(nome))",
          )
          .gte("data_atendimento", desde)
          .order("data_atendimento", { ascending: false }),
        db
          .from("anexos")
          .select("id, titulo, storage_path")
          .order("created_at", { ascending: false })
          .limit(4),
        db
          .from("lembretes")
          .select(
            "id, titulo, descricao, data_lembrete, hora, aluno_id, criado_por",
          )
          .gte("data_lembrete", iso(new Date(Date.now() - 60 * 864e5)))
          .order("data_lembrete")
          .order("hora", { nullsFirst: true }),
        db
          .from("atividades")
          .select(
            "id, titulo, tipo, formato, descricao, data_limite, unidades_curriculares(numero)",
          )
          .gte("data_limite", new Date(Date.now() - 60 * 864e5).toISOString())
          .order("data_limite"),
        db
          .from("anexos")
          .select("id, titulo, storage_path, atividade_id")
          .not("atividade_id", "is", null),
        db.from("entregas").select("atividade_id, enviado_em"),
        db.from("respostas_alunos").select("atividade_id, nota"),
      ],
    );
    const erro = [pac, casos, atd, anx, lem, ati, mat, entH, rspH].find(
      (r) => r.error,
    );
    if (erro) return falha(erro.error);

    const porPac = {};
    casos.data.forEach((c) => {
      porPac[c.paciente_id] = (porPac[c.paciente_id] || 0) + 1;
    });
    const comCaso = pac.data.filter((p) => porPac[p.id]).length,
      total = pac.data.length || 1;
    const pct = Math.round((comCaso / total) * 100),
      circ = 2 * Math.PI * 54;
    const ultimos7 = atd.data.filter(
      (a) => Date.now() - new Date(a.data_atendimento) < 7 * 864e5,
    ).length;

    const hojeIso = iso(new Date());
    const meus = lem.data.filter(
        (l) => l.criado_por === perfil.id && l.aluno_id === perfil.id,
      ),
      doProfessor = lem.data.filter((l) => !meus.includes(l));
    const proximos = doProfessor
        .filter((l) => l.data_lembrete >= hojeIso)
        .slice(0, 10),
      meusProx = meus.filter((l) => l.data_lembrete >= hojeIso).slice(0, 10);
    const ev = {
      at: new Set(atd.data.map((x) => chave(x.data_atendimento))),
      le: mapa(
        doProfessor,
        (l) => chave(dataLocal(l.data_lembrete)),
        (l) => l.titulo,
      ),
      me: mapa(
        meus,
        (l) => chave(dataLocal(l.data_lembrete)),
        (l) => l.titulo,
      ),
      ati: mapa(
        ati.data.filter((x) => x.tipo !== "prova"),
        (x) => chave(x.data_limite),
        (x) => x.titulo,
      ),
      pv: mapa(
        ati.data.filter((x) => x.tipo === "prova"),
        (x) => chave(x.data_limite),
        (x) => x.titulo,
      ),
    };
    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);
    const proxAtiv = ati.data
      .filter((x) => new Date(x.data_limite) >= inicioHoje)
      .slice(0, 5);
    const matPor = {};
    mat.data.forEach((m) => {
      (matPor[m.atividade_id] = matPor[m.atividade_id] || []).push(m);
    });
    const entPor = {};
    entH.data.forEach((e) => {
      entPor[e.atividade_id] = e;
    });
    const notas = {};
    rspH.data.forEach((r) => {
      notas[r.atividade_id] = r.nota;
    });

    // Mesmos estados da página "Atividades": só aparecem quando existem nos dados reais.
    const statusAtiv = (x) => {
      const multi = x.formato === "multipla_escolha",
        e = entPor[x.id],
        limite = new Date(x.data_limite);
      if (multi)
        return notas[x.id] !== undefined
          ? ["ok", `Nota ${fmtNota(notas[x.id])}`]
          : limite < new Date()
            ? ["atr", "Prazo vencido"]
            : ["pend", "Pendente"];
      if (x.tipo === "prova") return null;
      if (e)
        return e.enviado_em && new Date(e.enviado_em) > limite
          ? ["atr", "Entregue com atraso"]
          : ["ok", "Entregue"];
      return limite < new Date()
        ? ["atr", "Prazo vencido"]
        : ["pend", "Pendente"];
    };
    const acaoAtiv = (x) => {
      const multi = x.formato === "multipla_escolha";
      if (multi)
        return notas[x.id] !== undefined
          ? '<a class="btn claro peq" href="#/atividades">Ver resultado</a>'
          : btn("responderAtividade", "Responder", `data-id="${x.id}"`, "teal");
      if (x.tipo === "prova")
        return '<a class="btn claro peq" href="#/atividades">Detalhes</a>';
      return entPor[x.id]
        ? '<a class="btn claro peq" href="#/atividades">Ver entrega</a>'
        : btn("enviarAtividade", "Enviar", `data-id="${x.id}"`, "teal");
    };

    const kpi = (href, cor, icone, numero, titulo, desc) => `
      <a class="kpi kpi--${cor}" href="${href}"><span class="kpi__topo"><span class="kpi__ico">${ico(icone)}</span><span class="kpi__seta">${ico("seta")}</span></span>
        <strong>${numero}</strong><b>${titulo}</b><small>${desc}</small></a>`;

    const itemCaso = (c) => {
      const p = c.pacientes || { nome: "Paciente" };
      return `<li><a class="linha-link" href="#/caso/${c.id}">${avatar(p)}<span class="linha-link__txt"><b>${esc(c.titulo)}</b><small>Paciente: ${esc(p.nome)}</small></span><span class="linha-link__seta">${ico("prox")}</span></a></li>`;
    };

    const itemAtiv = (x) => {
      const prova = x.tipo === "prova",
        st = statusAtiv(x),
        uc = x.unidades_curriculares && x.unidades_curriculares.numero;
      return `<li class="ativ-item ${prova ? "ativ-item--prova" : ""}">
        <span class="ativ-item__ico">${ico(prova ? "prova" : "atividades")}</span>
        <div class="ativ-item__corpo">
          <div class="ativ-item__topo"><b>${prova ? "Prova: " : ""}${esc(x.titulo)}</b>${st ? `<span class="sel ${st[0]}">${st[1]}</span>` : ""}</div>
          <small class="meta">${prova ? "Data" : "Prazo"}: ${diaHora(x.data_limite)}${uc ? ` · UC${esc(uc)}` : ""}</small>
          ${x.descricao ? `<p class="ativ-item__desc">${esc(x.descricao)}</p>` : ""}
          <div class="ativ-item__acoes">${(matPor[x.id] || []).map((m) => `<button type="button" class="chip-arquivo" data-arquivo="${esc(m.storage_path)}">${ico("clipe")}<span>${esc(m.titulo)}</span></button>`).join("")}${acaoAtiv(x)}</div>
        </div></li>`;
    };

    const itemLembrete = (l, proprio) => {
      const dm = diaMes(l.data_lembrete),
        detalhe = `${l.hora ? l.hora.slice(0, 5) + (l.descricao ? " · " : "") : ""}${l.descricao || ""}`;
      return `<li class="lemb">
        <span class="lemb__data"><b>${dm.n}</b><small>${esc(dm.m)}</small></span>
        <div class="lemb__corpo"><b>${esc(l.titulo)}${!proprio && l.aluno_id ? '<span class="tag">Para você</span>' : ""}</b>${detalhe ? `<small>${esc(detalhe)}</small>` : ""}</div>
        ${proprio ? `<div class="lemb__acoes"><button type="button" class="icone-btn" data-acao="editarLembrete" data-id="${l.id}" aria-label="Editar lembrete" title="Editar">${ico("editar")}</button><button type="button" class="icone-btn icone-btn--perigo" data-acao="excluirLembrete" data-id="${l.id}" aria-label="Excluir lembrete" title="Excluir">${ico("lixeira")}</button></div>` : ""}
      </li>`;
    };
    const verTodos = (n) =>
      n > 3
        ? `<button type="button" class="ver-todos" data-alternar data-total="${n}" aria-expanded="false">Ver todos (${n})</button>`
        : "";

    tela.innerHTML = `
      <div class="home-aluno">
        <header class="aluno-topo">
          <div class="aluno-topo__marca" aria-hidden="true">${ico("capelo")}</div>
          <div class="aluno-topo__texto"><h1>Bem-vindo de volta, ${esc(nomeBonito)}.</h1><p>Acompanhe seus estudos e suas atividades.</p></div>
          ${chipHoje()}
        </header>

        <section class="indicadores" aria-label="Resumo">
          <div class="cartao progresso-card">
            <div class="anel"><svg viewBox="0 0 130 130" aria-hidden="true"><circle class="fundo" cx="65" cy="65" r="54"/><circle class="valor" cx="65" cy="65" r="54" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - pct / 100)}"/></svg><span>${pct}%<small>com casos</small></span></div>
            <div class="progresso-card__txt"><h3>Casos para estudar</h3><p>${comCaso} de ${pac.data.length} pacientes já têm casos clínicos para estudar.</p>
              <div class="barra" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div><small>${casos.data.length} ${casos.data.length === 1 ? "caso clínico disponível" : "casos clínicos disponíveis"}</small></div>
          </div>
          <div class="kpis">
            ${kpi("#/pacientes", "teal", "livro", casos.data.length, "Casos clínicos", "Disponíveis para estudo")}
            ${kpi("#/pacientes", "azul", "pacientes", pac.data.length, "Pacientes", "Acompanhados por você")}
            ${kpi("#/pacientes", "ouro", "coracao", ultimos7, ultimos7 === 1 ? "Atendimento" : "Atendimentos", "Nos últimos 7 dias")}
          </div>
        </section>

        <div class="painel-grade">
          <div class="coluna-principal">
            <section class="cartao">
              <div class="cartao__topo"><h2>Casos clínicos para estudar</h2><a href="#/pacientes">Ver pacientes</a></div>
              ${casos.data.length ? `<ul class="lista-limpa">${casos.data.slice(0, 5).map(itemCaso).join("")}</ul>` : '<p class="vazio">Nenhum caso clínico cadastrado ainda.</p>'}
            </section>

            <section class="cartao">
              <div class="cartao__topo"><h2>Atividades e provas</h2><a href="#/atividades">Ver todas e responder</a></div>
              ${proxAtiv.length ? `<ul class="lista-limpa">${proxAtiv.map(itemAtiv).join("")}</ul>` : '<p class="vazio">Nenhuma atividade ou prova marcada.</p>'}
            </section>

            <div class="duas-colunas">
              <section class="cartao">
                <div class="cartao__topo"><h2>Materiais de apoio</h2></div>
                ${
                  anx.data.length
                    ? `<ul class="lista-limpa">${anx.data
                        .map((a) => {
                          const f = formatoArquivo(a.storage_path);
                          return `<li class="arq"><span class="arq__ico arq__ico--${classeArquivo(f)}">${ico("arquivo")}</span><span class="arq__txt"><b>${esc(a.titulo)}</b><small>${f}</small></span><button type="button" class="btn claro peq" data-arquivo="${esc(a.storage_path)}">Abrir</button></li>`;
                        })
                        .join("")}</ul>`
                    : '<p class="vazio">Nenhum material ainda.</p>'
                }
              </section>
              <section class="cartao">
                <div class="cartao__topo"><h2>Últimos atendimentos</h2></div>
                ${
                  atd.data.length
                    ? `<ul class="lista-limpa">${atd.data
                        .slice(0, 4)
                        .map(
                          (a) =>
                            `<li><a class="linha-link linha-link--compacta" href="#/caso/${a.casos_clinicos.id}"><span class="linha-link__data"><b>${dia(a.data_atendimento)}</b></span><span class="linha-link__txt"><b>${esc(a.casos_clinicos.titulo)}</b><small>Paciente: ${esc(a.casos_clinicos.pacientes.nome)}</small></span><span class="linha-link__seta">${ico("prox")}</span></a></li>`,
                        )
                        .join("")}</ul>`
                    : '<p class="vazio">Nenhum atendimento registrado.</p>'
                }
              </section>
            </div>
          </div>

          <aside class="coluna-lateral">
            <section class="cartao" id="calendario"><div class="cartao__topo"><h2>Calendário</h2></div></section>
            <section class="cartao">
              <div class="cartao__topo"><h2>Meus lembretes</h2>${btn("novoLembrete", "+ Novo", "", "teal")}</div>
              ${meusProx.length ? `<ul class="lista-limpa lista-comp">${meusProx.map((l) => itemLembrete(l, true)).join("")}</ul>${verTodos(meusProx.length)}` : '<p class="vazio">Nenhum lembrete seu. Clique em "+ Novo" ou em um dia do calendário.</p>'}
            </section>
            <section class="cartao">
              <div class="cartao__topo"><h2>Lembretes do professor</h2></div>
              ${proximos.length ? `<ul class="lista-limpa lista-comp">${proximos.map((l) => itemLembrete(l, false)).join("")}</ul>${verTodos(proximos.length)}` : '<p class="vazio">Nenhum lembrete por enquanto.</p>'}
            </section>
          </aside>
        </div>
      </div>`;
    document
      .getElementById("calendario")
      .appendChild(calendario(ev, (dia) => formLembrete(null, dia)));
    document
      .getElementById("calendario")
      .insertAdjacentHTML(
        "beforeend",
        '<p class="dica-cal">Clique em um dia para criar um lembrete seu.</p>',
      );
    tela.querySelectorAll("[data-alternar]").forEach((b) =>
      b.addEventListener("click", () => {
        const lista = b.previousElementSibling,
          aberto = lista.classList.toggle("expandida");
        b.setAttribute("aria-expanded", String(aberto));
        b.textContent = aberto ? "Ver menos" : `Ver todos (${b.dataset.total})`;
      }),
    );
    abrirArquivos(tela);
  }

  async function listaPacientes() {
    const [pac, casos] = await Promise.all([
      db
        .from("pacientes")
        .select("id, nome, sexo, avatar_url, status")
        .order("nome"),
      db.from("casos_clinicos").select("paciente_id"),
    ]);
    if (pac.error || casos.error) return falha(pac.error || casos.error);
    const n = {};
    casos.data.forEach((c) => {
      n[c.paciente_id] = (n[c.paciente_id] || 0) + 1;
    });
    tela.innerHTML =
      '<div class="pagina" style="max-width:none">' +
      barraHoje() +
      '<h2>Pacientes</h2>' +
      (pac.data.length
        ? `<div class="grade4">${pac.data.map((p) => cartaoPaciente(p, n[p.id] || 0)).join("")}</div>`
        : '<p class="vazio">Nenhum paciente cadastrado ainda.</p>') +
      "</div>";
  }

  async function paciente(id) {
    const p = await db.from("pacientes").select("*").eq("id", id).single();
    if (p.error) return falha(p.error);
    const casos = await db
      .from("casos_clinicos")
      .select("id, titulo")
      .eq("paciente_id", id)
      .order("created_at", { ascending: false });
    if (casos.error) return falha(casos.error);

    const obito =
      p.data.status === "obito"
        ? `<p class="aviso"><strong>Óbito em ${dia(p.data.data_obito)}.</strong> ${esc(p.data.motivo_obito || "")}</p>`
        : "";
    tela.innerHTML = `<div class="pagina">
      ${barraHoje()}
      <a class="voltar" href="#/pacientes">← Pacientes</a>
      <div class="paciente">${avatar(p.data)}<h2>${esc(p.data.nome)}</h2></div>
      ${p.data.data_nascimento ? `<p style="margin:8px 0 0">Nascimento: ${dia(p.data.data_nascimento + "T12:00")}</p>` : ""}
      ${p.data.nome_mae || p.data.data_nascimento_mae ? `<p style="margin:2px 0 0">Mãe: ${esc(p.data.nome_mae || "não informada")}${p.data.data_nascimento_mae ? " · nascimento " + dia(p.data.data_nascimento_mae + "T12:00") : ""}</p>` : ""}${obito}
      <h3>Casos clínicos</h3>
      ${
        casos.data.length
          ? '<ul class="lista">' +
            casos.data
              .map(
                (c) => `
        <li><a href="#/caso/${c.id}">${esc(c.titulo)}</a></li>`,
              )
              .join("") +
            "</ul>"
          : '<p class="vazio">Este paciente ainda não tem caso clínico.</p>'
      }</div>`;
  }

  async function caso(id) {
    const c = await db
      .from("casos_clinicos")
      .select("*, pacientes(id, nome)")
      .eq("id", id)
      .single();
    if (c.error) return falha(c.error);
    const k = c.data;
    const [ind, atd, anx] = await Promise.all([
      db
        .from("indicadores")
        .select("id, descricao")
        .eq("uc_id", k.uc_id)
        .order("id"),
      db
        .from("atendimentos")
        .select("id, data_atendimento, evolucao, autor_id")
        .eq("caso_id", id)
        .order("data_atendimento", { ascending: false }),
      db
        .from("anexos")
        .select("id, titulo, storage_path")
        .or(`caso_id.eq.${id},uc_id.eq.${k.uc_id}`),
    ]);
    const idsAt = (atd.data || []).map((x) => x.id);
    const [medsSug, medsAt] = await Promise.all([
      Medicamentos.carregar(db, "caso_medicamentos", "caso_id", Number(id)),
      Medicamentos.carregar(db, "atendimento_medicamentos", "atendimento_id", idsAt),
    ]);
    const medsDo = (atId) =>
      Medicamentos.htmlLista(medsAt.filter((m) => m.atendimento_id === atId));
    tela.innerHTML = `<div class="pagina">
      ${barraHoje()}
      <a class="voltar" href="#/paciente/${k.pacientes.id}">← ${esc(k.pacientes.nome)}</a>
      <h2>${esc(k.titulo)}</h2>
      <div class="cartao"><p class="texto" style="margin:0">${esc(k.descricao)}</p></div>
      ${k.situacao_problema ? `<h3>Situação-problema</h3><div class="cartao"><p class="texto" style="margin:0">${esc(k.situacao_problema)}</p></div>` : ""}
      ${medsSug.length ? `<h3>Medicamentos sugeridos pelo professor</h3>${Medicamentos.htmlLista(medsSug)}` : ""}
      <h3>Indicadores</h3>
      ${(ind.data || []).length ? '<ul class="marcadores">' + ind.data.map((i) => `<li>${esc(i.descricao)}</li>`).join("") + "</ul>" : '<p class="vazio">Sem indicadores cadastrados.</p>'}
      <div class="topo-lista" style="margin-top:26px"><h3 style="margin:0">Histórico de atendimentos</h3>${btn("novoRegistro", "+ Registrar o que fiz", `data-caso="${k.id}"`, "teal")}</div>
      ${
        (atd.data || []).length
          ? '<ul class="lista">' +
            atd.data
              .map((a) =>
                a.autor_id === perfil.id
                  ? `<li><div class="linha"><small>${diaHora(a.data_atendimento)} · <b>Registrado por você</b></small><div class="botoes">${btn("editarRegistro", "Editar", `data-id="${a.id}"`)}${btn("excluirRegistro", "Excluir", `data-id="${a.id}"`)}</div></div><span class="texto">${esc(a.evolucao)}</span>${medsDo(a.id)}</li>`
                  : `<li><small>${diaHora(a.data_atendimento)}</small><span class="texto">${esc(a.evolucao)}</span>${medsDo(a.id)}</li>`,
              )
              .join("") +
            "</ul>"
          : '<p class="vazio">Nenhum atendimento registrado neste caso.</p>'
      }
      ${(anx.data || []).length ? '<h3>Materiais de apoio</h3><ul class="lista">' + anx.data.map((a) => `<li><button class="link" data-arquivo="${esc(a.storage_path)}">${esc(a.titulo)} (PDF)</button></li>`).join("") + "</ul>" : ""}</div>`;
    abrirArquivos(tela);
    Medicamentos.ligarInfo(tela);
  }

  async function atividadesPagina(destaque) {
    const [ati, mat, ent, qst, rsp] = await Promise.all([
      db
        .from("atividades")
        .select("id, titulo, tipo, formato, descricao, data_limite")
        .order("data_limite", { ascending: true }),
      db
        .from("anexos")
        .select("id, titulo, storage_path, atividade_id")
        .not("atividade_id", "is", null),
      db.from("entregas").select("*"),
      db
        .from("questoes")
        .select("id, atividade_id, enunciado, alternativas")
        .order("ordem")
        .order("id"),
      db.from("respostas_alunos").select("*"),
    ]);
    const erro = [ati, mat, ent, qst, rsp].find((r) => r.error);
    if (erro) return falha(erro.error);
    const matPor = {},
      entPor = {},
      qPor = {},
      rPor = {};
    mat.data.forEach((m) => {
      (matPor[m.atividade_id] = matPor[m.atividade_id] || []).push(m);
    });
    ent.data.forEach((e) => {
      entPor[e.atividade_id] = e;
    });
    qst.data.forEach((q) => {
      (qPor[q.atividade_id] = qPor[q.atividade_id] || []).push(q);
    });
    rsp.data.forEach((r) => {
      rPor[r.atividade_id] = r;
    });
    const hoje0 = new Date();
    hoje0.setHours(0, 0, 0, 0);
    const card = (x) => {
      const prova = x.tipo === "prova",
        multi = x.formato === "multipla_escolha",
        e = entPor[x.id],
        r = rPor[x.id],
        limite = new Date(x.data_limite);
      const atrasada = e && e.enviado_em && new Date(e.enviado_em) > limite;
      const status = multi
        ? r
          ? `<span class="sel ok">Nota ${fmtNota(r.nota)}</span>`
          : limite < new Date()
            ? '<span class="sel atr">Prazo vencido</span>'
            : '<span class="sel pend">Pendente</span>'
        : prova
          ? ""
          : e
            ? atrasada
              ? '<span class="sel atr">Entregue com atraso</span>'
              : '<span class="sel ok">Entregue</span>'
            : limite < new Date()
              ? '<span class="sel atr">Prazo vencido</span>'
              : '<span class="sel pend">Pendente</span>';
      const resultado = () => {
        const qs = qPor[x.id] || [];
        return `<details class="entrega" open><summary><b>Nota ${fmtNota(r.nota)}</b> · ${r.acertos} de ${r.total} acertos <small style="display:inline">· respondida em ${diaHora(r.enviado_em)}</small></summary>
          <ol class="detalhe">${r.detalhe
            .map((d) => {
              const q = qs.find((y) => y.id === d.q),
                alts = q ? q.alternativas : [],
                alt = (i) => `${LETRAS[i]}) ${esc(alts[i] || "")}`;
              return `<li>${d.acertou ? "✅" : "❌"} ${esc(q ? q.enunciado : "Questão removida")}<br><small>Sua resposta: ${alt(d.escolhida)}${d.acertou ? "" : `<br>Resposta correta: <b>${alt(d.correta)}</b>`}</small></li>`;
            })
            .join("")}</ol></details>`;
      };
      const entrega = multi
        ? r
          ? resultado()
          : (qPor[x.id] || []).length
            ? `<div class="botoes">${btn("responderAtividade", "Responder atividade", `data-id="${x.id}"`, "teal")}</div>`
            : "<small>As questões ainda não foram cadastradas.</small>"
        : prova
          ? ""
          : e
            ? `<div class="entrega"><small>Enviada em ${diaHora(e.enviado_em)}</small>${e.comentario ? `<span class="texto">${esc(e.comentario)}</span>` : ""}${e.storage_path ? `<button type="button" class="link" data-bucket="entregas" data-arquivo="${esc(e.storage_path)}">📎 ${esc(e.nome_arquivo || "arquivo enviado")}</button>` : ""}<div class="botoes">${btn("enviarAtividade", "Editar entrega", `data-id="${x.id}"`)}${btn("cancelarEntrega", "Cancelar entrega", `data-id="${e.id}" data-path="${esc(e.storage_path || "")}"`)}</div></div>`
            : `<div class="botoes">${btn("enviarAtividade", "Enviar atividade", `data-id="${x.id}"`, "teal")}</div>`;
      return `<article class="cartao ativ-card ${prova ? "prova" : ""}" data-ativ="${esc(x.id)}"><div class="linha"><div><h3 style="margin:0 0 4px;font-size:1.15rem;${prova ? "color:var(--erro)" : ""}">${prova ? "📝 Prova: " : ""}${esc(x.titulo)}</h3><small>${prova ? "Data" : "Prazo"}: ${diaHora(x.data_limite)}</small></div>${status}</div>
        ${x.descricao ? `<p class="texto" style="margin:10px 0 0">${esc(x.descricao)}</p>` : ""}
        ${(matPor[x.id] || []).map((m) => `<button type="button" class="link" data-arquivo="${esc(m.storage_path)}">📎 ${esc(m.titulo)}</button>`).join("")}${entrega}</article>`;
    };
    const proximas = ati.data.filter((x) => new Date(x.data_limite) >= hoje0),
      anteriores = ati.data
        .filter((x) => new Date(x.data_limite) < hoje0)
        .reverse();
    tela.innerHTML = `<div class="pagina">${barraHoje()}<h2>Atividades</h2><p style="margin-top:0">Veja o que o professor postou, abra o material de apoio e envie sua atividade.</p>
      <h3>Próximas</h3>${proximas.length ? `<div class="pilha">${proximas.map(card).join("")}</div>` : '<p class="vazio">Nenhuma atividade ou prova marcada.</p>'}
      ${anteriores.length ? `<h3>Anteriores</h3><div class="pilha">${anteriores.map(card).join("")}</div>` : ""}</div>`;
    abrirArquivos(tela);
    // vindo de uma notificação: rola até a atividade/prova e dá um destaque rápido
    if (destaque) {
      const alvo = tela.querySelector(`[data-ativ="${String(destaque).replace(/[^\w-]/g, "")}"]`);
      if (alvo) {
        alvo.classList.add("ativ-destaque");
        alvo.scrollIntoView({
          block: "center",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        });
        setTimeout(() => alvo.classList.remove("ativ-destaque"), 3500);
      }
    }
  }

  function rotear() {
    const [, tipo = "", id] = location.hash.split("/");
    fecharMini();
    menu(tipo);
    window.scrollTo(0, 0);
    if (tipo === "atividades") return atividadesPagina(id);
    if (tipo === "pacientes") return listaPacientes();
    if (tipo === "paciente" && id) return paciente(id);
    if (tipo === "caso" && id) return caso(id);
    return inicio();
  }
  window.addEventListener("hashchange", rotear);
  rotear();
})();
