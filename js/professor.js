// Painel do professor: cria, edita e apaga pacientes, casos, atendimentos, indicadores e PDFs; registra óbito.
(async () => {
  const perfil = await exigirPapel("professor");
  if (!perfil) return;

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
    casos:
      '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
    ucs: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5M9 8h6"/>',
    alunos:
      '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/>',
    calendario:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    seta: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    sair: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    coracao:
      '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/><path d="M6 12h3l1.5-3 3 6 1.5-3h3"/>',
    monitor:
      '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4M7 12l3-3 3 2 4-4"/>',
    estetoscopio:
      '<path d="M6 3H5a1 1 0 0 0-1 1v5a5 5 0 0 0 10 0V4a1 1 0 0 0-1-1h-1"/><path d="M9 14v1.5a5.5 5.5 0 0 0 11 0V13"/><circle cx="20" cy="11" r="2"/>',
  };
  const ico = (n) =>
    `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICONES[n]}</svg>`;
  document.getElementById("sair").innerHTML = ico("sair");

  // Data em português e maiúsculas, ex.: "SEGUNDA-FEIRA, 5 DE OUTUBRO"
  const dataExtensa = (d = new Date()) =>
    d
      .toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      })
      .toLocaleUpperCase("pt-BR");

  // Saudação conforme o horário
  const saudacaoHorario = (d = new Date()) => {
    const h = d.getHours();
    return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
  };

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
  const CHAVE_BOAS_VINDAS = "conecta_boas_vindas_prof";
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
        <h2 class="boas-vindas__titulo">Bem-vindo, Professor ${esc(nomeBonito)}</h2>
        <p class="boas-vindas__sub">Preparando o seu ambiente…</p>
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
  const localInput = (d = new Date()) => {
    const x = new Date(d);
    x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
    return x.toISOString().slice(0, 16);
  };
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
  const selo = (p) =>
    p.status === "obito"
      ? '<span class="selo">Óbito</span>'
      : '<span class="selo ok">Ativo</span>';
  const go = (hash) => {
    if (location.hash === hash) rotear();
    else location.hash = hash;
  };

  // executa uma chamada do Supabase e lança erro se falhar
  const ok = async (promessa) => {
    const r = await promessa;
    if (r.error) throw new Error(r.error.message);
    return r.data;
  };

  // ---------- janelas (modais) ----------
  function modal(html) {
    const d = document.createElement("dialog");
    d.className = "modal";
    d.innerHTML = html;
    document.body.appendChild(d);
    d.addEventListener("close", () => d.remove());
    d.showModal();
    return d;
  }

  const campoHtml = (c) => {
    const v = c.val ?? "",
      id = "f_" + c.n,
      req = c.req ? "required" : "";
    let el;
    if (c.t === "textarea")
      el = `<textarea id="${id}" name="${c.n}" rows="${c.rows || 4}" ${req}>${esc(v)}</textarea>`;
    else if (c.t === "select")
      el = `<select id="${id}" name="${c.n}" ${req}><option value="">${esc(c.vazio || "Selecione…")}</option>${(c.opts || []).map(([val, l]) => `<option value="${esc(val)}" ${String(val) === String(v) ? "selected" : ""}>${esc(l)}</option>`).join("")}</select>`;
    else if (c.t === "file")
      el = `<input id="${id}" name="${c.n}" type="file" accept="${c.accept || ""}" ${req}>`;
    else
      el = `<input id="${id}" name="${c.n}" type="${c.t || "text"}" value="${esc(v)}" ${req} autocomplete="off">`;
    return `<label class="campo2"><span>${esc(c.r)}${c.req ? " *" : ""}</span>${el}${c.dica ? `<small>${esc(c.dica)}</small>` : ""}</label>`;
  };

  function formulario({
    titulo,
    texto = "",
    campos = [],
    botao = "Salvar",
    perigo = false,
    aoEnviar,
  }) {
    const d = modal(`<form>
      <h2>${esc(titulo)}</h2>${texto ? `<p>${texto}</p>` : ""}
      ${campos.map(campoHtml).join("")}
      <p class="erro" role="alert"></p>
      <div class="rodape"><button type="button" class="btn claro peq" data-cancelar>Cancelar</button>
        <button type="submit" class="btn peq ${perigo ? "perigo" : "teal"}">${esc(botao)}</button></div></form>`);
    const f = d.querySelector("form"),
      erro = d.querySelector(".erro"),
      enviar = f.querySelector("[type=submit]");
    d.querySelector("[data-cancelar]").addEventListener("click", () =>
      d.close(),
    );
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      const vals = {};
      campos.forEach((c) => {
        const el = f.elements[c.n];
        vals[c.n] = c.t === "file" ? el.files[0] || null : el.value.trim();
      });
      enviar.disabled = true;
      erro.textContent = "";
      try {
        await aoEnviar(vals);
        d.close();
        rotear();
      } catch (err) {
        erro.textContent = err.message;
        enviar.disabled = false;
      }
    });
    return d;
  }

  const confirmar = ({ titulo, texto, botao = "Confirmar", digitar, acao }) =>
    formulario({
      titulo,
      texto,
      botao,
      perigo: true,
      campos: digitar
        ? [{ n: "conf", r: `Digite "${digitar}" para confirmar`, req: true }]
        : [],
      aoEnviar: async (v) => {
        if (digitar && v.conf.toLowerCase() !== digitar.toLowerCase())
          throw new Error("O texto digitado não confere.");
        await acao();
      },
    });

  async function subir(bucket, pasta, arquivo) {
    const ext = (arquivo.name.split(".").pop() || "bin").toLowerCase();
    const caminho = `${pasta}/${crypto.randomUUID()}.${ext}`;
    const { error } = await db.storage
      .from(bucket)
      .upload(caminho, arquivo, { contentType: arquivo.type });
    if (error) throw new Error(error.message);
    return caminho;
  }

  // ---------- formulários de cada ação ----------
  async function formPaciente(id) {
    const p = id
      ? await ok(db.from("pacientes").select("*").eq("id", id).single())
      : {};
    const ucs = id
      ? []
      : await ok(
          db
            .from("unidades_curriculares")
            .select("id, numero, nome")
            .order("numero"),
        );
    formulario({
      titulo: id ? "Editar paciente" : "Novo paciente",
      botao: id ? "Salvar" : "Criar paciente",
      campos: [
        { n: "nome", r: "Nome", req: true, val: p.nome },
        {
          n: "sexo",
          r: "Sexo",
          t: "select",
          req: true,
          val: p.sexo,
          opts: [
            ["feminino", "Feminino"],
            ["masculino", "Masculino"],
          ],
        },
        {
          n: "data_nascimento",
          r: "Data de nascimento",
          t: "date",
          val: p.data_nascimento,
        },
        { n: "nome_mae", r: "Nome da mãe", val: p.nome_mae },
        {
          n: "data_nascimento_mae",
          r: "Data de nascimento da mãe",
          t: "date",
          val: p.data_nascimento_mae,
        },
        {
          n: "foto",
          r: "Foto",
          t: "file",
          accept: "image/*",
          dica: id
            ? "Deixe vazio para manter a foto atual."
            : "Opcional. Sem foto, aparece a inicial do nome.",
        },
        ...(id
          ? []
          : [
              {
                n: "uc_id",
                r: "Unidade curricular",
                t: "select",
                opts: ucs.map((u) => [u.id, `UC${u.numero} - ${u.nome}`]),
                dica: "Escolha a UC para já criar o primeiro caso clínico deste paciente. Pode deixar em branco e criar o caso depois.",
              },
              {
                n: "titulo_caso",
                r: "Título do primeiro caso clínico",
                dica: "Obrigatório se escolher uma unidade curricular.",
              },
            ]),
      ],
      aoEnviar: async (v) => {
        if (!id && v.uc_id && !v.titulo_caso)
          throw new Error("Digite o título do primeiro caso clínico.");
        const dados = {
          nome: v.nome,
          sexo: v.sexo,
          data_nascimento: v.data_nascimento || null,
          nome_mae: v.nome_mae || null,
          data_nascimento_mae: v.data_nascimento_mae || null,
        };
        if (v.foto) {
          const c = await subir("avatares", "pacientes", v.foto);
          dados.avatar_url = db.storage
            .from("avatares")
            .getPublicUrl(c).data.publicUrl;
        }
        if (id) await ok(db.from("pacientes").update(dados).eq("id", id));
        else {
          const novo = await ok(
            db.from("pacientes").insert(dados).select("id").single(),
          );
          if (v.uc_id) {
            const caso = await ok(
              db
                .from("casos_clinicos")
                .insert({
                  paciente_id: novo.id,
                  uc_id: Number(v.uc_id),
                  titulo: v.titulo_caso,
                })
                .select("id")
                .single(),
            );
            location.hash = `#/caso/${caso.id}`;
          } else location.hash = `#/paciente/${novo.id}`;
        }
      },
    });
  }

  async function formCaso(id, pacienteId, ucId) {
    const [pac, ucs, k] = await Promise.all([
      ok(db.from("pacientes").select("id, nome").order("nome")),
      ok(
        db
          .from("unidades_curriculares")
          .select("id, numero, nome")
          .order("numero"),
      ),
      id ? ok(db.from("casos_clinicos").select("*").eq("id", id).single()) : {},
    ]);
    formulario({
      titulo: id ? "Editar caso clínico" : "Novo caso clínico",
      botao: id ? "Salvar" : "Criar caso",
      campos: [
        {
          n: "paciente_id",
          r: "Paciente",
          t: "select",
          req: true,
          val: k.paciente_id || pacienteId,
          opts: pac.map((p) => [p.id, p.nome]),
        },
        {
          n: "uc_id",
          r: "Unidade curricular",
          t: "select",
          req: true,
          val: k.uc_id || ucId,
          opts: ucs.map((u) => [u.id, `UC${u.numero} - ${u.nome}`]),
        },
        { n: "titulo", r: "Título", req: true, val: k.titulo },
        {
          n: "descricao",
          r: "Descrição do caso",
          t: "textarea",
          rows: 6,
          val: k.descricao,
        },
        {
          n: "situacao_problema",
          r: "Situação-problema",
          t: "textarea",
          rows: 5,
          val: k.situacao_problema,
          dica: "A pergunta que o aluno deve responder.",
        },
      ],
      aoEnviar: async (v) => {
        const dados = {
          paciente_id: Number(v.paciente_id),
          uc_id: Number(v.uc_id),
          titulo: v.titulo,
          descricao: v.descricao || null,
          situacao_problema: v.situacao_problema || null,
        };
        if (id) await ok(db.from("casos_clinicos").update(dados).eq("id", id));
        else {
          const novo = await ok(
            db.from("casos_clinicos").insert(dados).select("id").single(),
          );
          location.hash = `#/caso/${novo.id}`;
        }
      },
    });
  }

  // Em quanto tempo antes os alunos serão avisados ("nao" = sem aviso; 0 = na hora).
  const ANTECEDENCIAS = [
    ["0", "Na hora do lembrete"],
    ["5", "5 minutos antes"],
    ["15", "15 minutos antes"],
    ["30", "30 minutos antes"],
    ["60", "1 hora antes"],
    ["120", "2 horas antes"],
    ["1440", "1 dia antes"],
    ["2880", "2 dias antes"],
    ["nao", "Não avisar"],
  ];

  async function formLembrete(id, dataPre) {
    const [alunos, l] = await Promise.all([
      ok(
        db.from("perfis").select("id, nome").eq("papel", "aluno").order("nome"),
      ),
      id ? ok(db.from("lembretes").select("*").eq("id", id).single()) : {},
    ]);
    formulario({
      titulo: id ? "Editar lembrete" : "Novo lembrete",
      botao: "Salvar",
      campos: [
        { n: "titulo", r: "Título", req: true, val: l.titulo },
        {
          n: "data_lembrete",
          r: "Data",
          t: "date",
          req: true,
          val: l.data_lembrete || dataPre || iso(new Date()),
        },
        {
          n: "hora",
          r: "Hora",
          t: "time",
          val: l.hora ? l.hora.slice(0, 5) : "",
          dica: "Opcional.",
        },
        {
          n: "avisar_antes_min",
          r: "Avisar os alunos",
          t: "select",
          req: true,
          opts: ANTECEDENCIAS,
          val: id
            ? l.avisar_antes_min === null || l.avisar_antes_min === undefined
              ? "nao"
              : String(l.avisar_antes_min)
            : "30",
          dica: "O aluno recebe o aviso no sino e em um pop-up. Sem horário definido, usamos 08:00 como referência.",
        },
        {
          n: "descricao",
          r: "Detalhes",
          t: "textarea",
          rows: 3,
          val: l.descricao,
        },
        {
          n: "aluno_id",
          r: "Para quem",
          t: "select",
          vazio: "Todos os alunos (lembrete geral)",
          val: l.aluno_id,
          opts: alunos.map((a) => [a.id, a.nome]),
        },
      ],
      aoEnviar: async (v) => {
        const dados = {
          titulo: v.titulo,
          data_lembrete: v.data_lembrete,
          hora: v.hora || null,
          descricao: v.descricao || null,
          aluno_id: v.aluno_id || null,
          avisar_antes_min:
            v.avisar_antes_min === "nao" ? null : Number(v.avisar_antes_min),
        };
        try {
          if (id) await ok(db.from("lembretes").update(dados).eq("id", id));
          else await ok(db.from("lembretes").insert(dados));
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

  const formIndicador = async (id, ucId) => {
    const i = id
      ? await ok(db.from("indicadores").select("*").eq("id", id).single())
      : {};
    formulario({
      titulo: id ? "Editar indicador" : "Novo indicador",
      campos: [
        {
          n: "descricao",
          r: "Descrição",
          t: "textarea",
          rows: 5,
          req: true,
          val: i.descricao,
        },
      ],
      aoEnviar: async (v) => {
        if (id)
          await ok(
            db
              .from("indicadores")
              .update({ descricao: v.descricao })
              .eq("id", id),
          );
        else
          await ok(
            db
              .from("indicadores")
              .insert({ uc_id: Number(ucId), descricao: v.descricao }),
          );
      },
    });
  };

  const formPdf = (destino, chaveDestino) =>
    formulario({
      titulo: "Enviar PDF de apoio",
      botao: "Enviar",
      campos: [
        { n: "titulo", r: "Título do material", req: true },
        {
          n: "arquivo",
          r: "Arquivo PDF",
          t: "file",
          accept: "application/pdf",
          req: true,
        },
      ],
      aoEnviar: async (v) => {
        if (v.arquivo.type !== "application/pdf")
          throw new Error("Envie um arquivo PDF.");
        const caminho = await subir(
          "anexos",
          `${chaveDestino}-${destino}`,
          v.arquivo,
        );
        try {
          await ok(
            db.from("anexos").insert({
              titulo: v.titulo,
              storage_path: caminho,
              [chaveDestino]: Number(destino),
            }),
          );
        } catch (e) {
          await db.storage.from("anexos").remove([caminho]);
          throw e;
        }
      },
    });

  // ---------- ações dos botões (data-acao) ----------
  const acoes = {
    novoPaciente: () => formPaciente(),
    editarPaciente: (d) => formPaciente(d.id),
    excluirPaciente: async (d) => {
      const p = await ok(
        db.from("pacientes").select("id, nome").eq("id", d.id).single(),
      );
      confirmar({
        titulo: "Excluir paciente",
        botao: "Excluir",
        digitar: p.nome,
        texto: `Isto apaga <b>${esc(p.nome)}</b> e TODOS os casos clínicos e atendimentos dele. Não dá para desfazer.`,
        acao: async () => {
          await ok(db.from("pacientes").delete().eq("id", p.id));
          location.hash = "#/pacientes";
        },
      });
    },
    novoCaso: (d) => formCaso(null, d.paciente, d.uc),
    editarCaso: (d) => formCaso(d.id),
    excluirCaso: async (d) => {
      const k = await ok(
        db
          .from("casos_clinicos")
          .select("id, titulo, paciente_id")
          .eq("id", d.id)
          .single(),
      );
      confirmar({
        titulo: "Excluir caso clínico",
        botao: "Excluir",
        texto: `Isto apaga <b>${esc(k.titulo)}</b> e todos os atendimentos dele.`,
        acao: async () => {
          await ok(db.from("casos_clinicos").delete().eq("id", k.id));
          location.hash = `#/paciente/${k.paciente_id}`;
        },
      });
    },
    novoLembrete: (d) => formLembrete(null, d.data),
    editarLembrete: (d) => formLembrete(d.id),
    excluirLembrete: (d) =>
      confirmar({
        titulo: "Excluir lembrete",
        botao: "Excluir",
        texto: "Este lembrete some do calendário dos alunos.",
        acao: () => ok(db.from("lembretes").delete().eq("id", d.id)),
      }),
    novaAtividade: (d) => formAtividade(null, d.data),
    editarAtividade: (d) => formAtividade(d.id),
    materiaisAtividade: (d) => materiaisAtividade(d.id),
    entregasAtividade: (d) => entregasAtividade(d.id),
    questoesAtividade: (d) => editarQuestoes(d.id),
    respostasAtividade: (d) => respostasAtividade(d.id),
    monitorarAtividade: (d) => go("#/monitoramento/" + d.id),
    detalheMonitoramento: (d) =>
      detalheMonitoramento(d.atividade, d.aluno, d.nome),
    excluirAtividade: async (d) => {
      const [a, anx, ent] = await Promise.all([
        ok(db.from("atividades").select("id, titulo").eq("id", d.id).single()),
        ok(db.from("anexos").select("storage_path").eq("atividade_id", d.id)),
        ok(db.from("entregas").select("storage_path").eq("atividade_id", d.id)),
      ]);
      confirmar({
        titulo: "Excluir atividade",
        botao: "Excluir",
        texto: `<b>${esc(a.titulo)}</b>, os PDFs de apoio e as entregas dos alunos serão apagados. Isso some do calendário dos alunos.`,
        acao: async () => {
          await ok(db.from("atividades").delete().eq("id", a.id));
          if (anx.length)
            await db.storage
              .from("anexos")
              .remove(anx.map((x) => x.storage_path));
          const arqs = ent.map((x) => x.storage_path).filter(Boolean);
          if (arqs.length) await db.storage.from("entregas").remove(arqs);
        },
      });
    },
    novoIndicador: (d) => formIndicador(null, d.uc),
    editarIndicador: (d) => formIndicador(d.id),
    excluirIndicador: (d) =>
      confirmar({
        titulo: "Excluir indicador",
        botao: "Excluir",
        texto: "Este indicador será apagado.",
        acao: () => ok(db.from("indicadores").delete().eq("id", d.id)),
      }),
    novoPdf: (d) => formPdf(d.destino, d.tipo),
    excluirPdf: (d) =>
      confirmar({
        titulo: "Excluir material",
        botao: "Excluir",
        texto: "O PDF será removido.",
        acao: async () => {
          await ok(db.from("anexos").delete().eq("id", d.id));
          await db.storage.from("anexos").remove([d.path]);
        },
      }),
    abrirPdf: async (d) => {
      const aba = window.open("", "_blank");
      const { data, error } = await db.storage
        .from(d.bucket || "anexos")
        .createSignedUrl(d.path, 60);
      if (error) {
        if (aba) aba.close();
        return alert("Não foi possível abrir o arquivo.");
      }
      aba.location = data.signedUrl;
    },
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

  // ---------- gráficos ----------
  // ---------- telas ----------
  function menu(rota) {
    const itens = [
      ["", "inicio", "Início", "Início"],
      ["pacientes", "pacientes", "Pacientes", "Pacientes"],
      ["casos", "casos", "Casos clínicos", "Casos"],
      ["ucs", "ucs", "Unidades curriculares", "Unidades"],
      ["alunos", "alunos", "Alunos", "Alunos"],
      ["monitoramento", "monitor", "Monitoramento", "Monitor"],
    ];
    const atual =
      rota === "paciente"
        ? "pacientes"
        : rota === "caso"
          ? "casos"
          : rota === "uc"
            ? "ucs"
            : rota;
    document.getElementById("nav").innerHTML = itens
      .map(
        ([r, i, t, curto]) =>
          `<a href="#/${r}" class="${r === atual ? "ativo" : ""}" ${r === atual ? 'aria-current="page"' : ""}>${ico(i)}<span class="rot-longo">${t}</span><span class="rot-curto" aria-hidden="true">${curto}</span></a>`,
      )
      .join("");
  }

  async function inicio() {
    const desde = new Date(Date.now() - 60 * 864e5).toISOString();
    const [pac, ucs, casos, atd, alunos, lem, ativ] = await Promise.all([
      db.from("pacientes").select("id, status"),
      db
        .from("unidades_curriculares")
        .select("id, numero, nome")
        .order("numero"),
      db.from("casos_clinicos").select("id, uc_id"),
      db
        .from("atendimentos")
        .select(
          "id, data_atendimento, casos_clinicos(id, titulo, pacientes(nome, sexo, avatar_url)), perfis(nome)",
        )
        .gte("data_atendimento", desde)
        .order("data_atendimento", { ascending: false })
        .limit(5),
      db
        .from("perfis")
        .select("id", { count: "exact", head: true })
        .eq("papel", "aluno"),
      db
        .from("lembretes")
        .select("id, titulo, data_lembrete")
        .gte("data_lembrete", iso(new Date(Date.now() - 60 * 864e5))),
      db
        .from("atividades")
        .select(
          "id, titulo, tipo, formato, data_limite, unidades_curriculares(numero)",
        )
        .gte("data_limite", new Date(Date.now() - 60 * 864e5).toISOString())
        .order("data_limite"),
    ]);
    const erro = [pac, ucs, casos, atd, alunos, lem, ativ].find((r) => r.error);
    if (erro) return falha(erro.error);
    const porUC = {};
    casos.data.forEach((c) => {
      porUC[c.uc_id] = (porUC[c.uc_id] || 0) + 1;
    });
    const semCaso = ucs.data.filter((u) => !porUC[u.id]);
    const ativos = pac.data.filter((p) => p.status === "ativo").length;
    const hojeIso = iso(new Date()),
      em7 = iso(new Date(Date.now() + 7 * 864e5));
    const semana = lem.data.filter(
      (l) => l.data_lembrete >= hojeIso && l.data_lembrete <= em7,
    ).length;
    const ev = {
      le: mapa(
        lem.data,
        (l) => chave(dataLocal(l.data_lembrete)),
        (l) => l.titulo,
      ),
      ati: mapa(
        ativ.data.filter((x) => x.tipo !== "prova"),
        (x) => chave(x.data_limite),
        (x) => x.titulo,
      ),
      pv: mapa(
        ativ.data.filter((x) => x.tipo === "prova"),
        (x) => chave(x.data_limite),
        (x) => x.titulo,
      ),
    };
    const inicioHoje = new Date();
    inicioHoje.setHours(0, 0, 0, 0);
    const proxAtiv = ativ.data
      .filter((x) => new Date(x.data_limite) >= inicioHoje)
      .slice(0, 8);
    const estat = (href, cor, i, titulo, n, sub) =>
      `<${href ? "a" : "div"} class="estat" ${href ? `href="${href}"` : ""} style="--cor:${cor}"><span class="bolha">${ico(i)}</span><span><b>${titulo}</b><strong>${n}</strong><small>${sub}</small></span>${href ? `<span class="seta">${ico("seta")}</span>` : ""}</${href ? "a" : "div"}>`;

    tela.innerHTML = `
      <header class="cabecalho-boas-vindas">
        <div class="cabecalho-boas-vindas__topo">
          <div class="cabecalho-boas-vindas__texto">
            <span class="cabecalho-boas-vindas__data">${dataExtensa()}</span>
            <h1 class="cabecalho-boas-vindas__titulo">${saudacaoHorario()}, ${esc(nomeBonito)}.</h1>
            <p class="cabecalho-boas-vindas__subtitulo">Confira o resumo do seu ambiente acadêmico.</p>
          </div>
          <div class="cabecalho-boas-vindas__badge" aria-hidden="true">${ico("estetoscopio")}</div>
        </div>
        <hr class="cabecalho-boas-vindas__divisoria">
        <p class="cabecalho-boas-vindas__rodape">Conecta · Prontuário Digital de Enfermagem</p>
      </header>
      <div class="acoes-rapidas">
        ${btn("novoPaciente", "+ Novo paciente", "", "teal")}${btn("novoCaso", "+ Novo caso clínico", "", "teal")}${btn("novaAtividade", "+ Atividade ou prova", "", "teal")}
      </div>
      <section class="estats">
        ${estat("#/pacientes", "#0F7B6C", "pacientes", "Pacientes ativos", ativos, "Em acompanhamento")}
        ${estat(null, "#7B4FB3", "calendario", "Lembretes da semana", semana, "Próximos 7 dias")}
        ${estat("#/casos", "#1F5FA8", "casos", "Casos clínicos", casos.data.length, "Cadastrados")}
        ${estat("#/alunos", "#D9962B", "alunos", "Alunos cadastrados", alunos.count ?? 0, "Com acesso ao sistema")}
      </section>
      <div class="tres">
        <section class="cartao"><h3>Calendário</h3><div id="cal-home"></div><p style="margin:12px 0 0"><small>Clique em um dia para criar ou ver lembretes, atividades e provas.</small></p></section>
        <section class="cartao"><h3>Atendimentos recentes</h3>${
          atd.data.length
            ? '<ul class="mini">' +
              atd.data
                .map(
                  (a) => `
          <li class="recente"><a href="#/caso/${a.casos_clinicos.id}">${avatar(a.casos_clinicos.pacientes)}<span><b>${esc(a.casos_clinicos.pacientes.nome)}</b><small>${esc(a.casos_clinicos.titulo)}</small><small>${diaHora(a.data_atendimento)}${a.perfis ? " · por " + esc(a.perfis.nome) : ""}</small></span><span class="seta">${ico("seta")}</span></a></li>`,
                )
                .join("") +
              "</ul>"
            : '<p class="vazio">Nenhum atendimento registrado ainda.</p>'
        }</section>
        <section class="cartao"><h3>Atividades e provas</h3>${proxAtiv.length ? '<ul class="lista">' + proxAtiv.map(itemAtividade).join("") + "</ul>" : '<p class="vazio">Nenhuma atividade marcada. Use o botão "+ Atividade ou prova".</p>'}</section>
        <section class="cartao"><h3>Unidades curriculares sem caso</h3>${
          semCaso.length
            ? '<ul class="mini">' +
              semCaso
                .slice(0, 5)
                .map(
                  (u) => `
          <li><a href="#/uc/${u.id}">UC${u.numero}<br><small>${esc(u.nome.length > 70 ? u.nome.slice(0, 70) + "…" : u.nome)}</small></a>${btn("novoCaso", "Criar caso", `data-uc="${u.id}"`)}</li>`,
                )
                .join("") +
              "</ul>" +
              (semCaso.length > 5
                ? `<small>e mais ${semCaso.length - 5}…</small>`
                : "")
            : '<p class="vazio">Todas as unidades têm caso clínico. 🎉</p>'
        }</section>
      </div>`;
    montarCalendario(document.getElementById("cal-home"), ev, abrirDia);
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
      `<div class="topo-lista"><h2>Pacientes</h2>${btn("novoPaciente", "+ Novo paciente", "", "teal")}</div>` +
      (pac.data.length
        ? `<div class="grade4">${pac.data.map((p) => `<a class="item" href="#/paciente/${p.id}">${avatar(p)}<h3>${esc(p.nome)}</h3>${selo(p)}<small>${n[p.id] || 0} ${n[p.id] === 1 ? "caso clínico" : "casos clínicos"}</small><span class="ver">Abrir</span></a>`).join("")}</div>`
        : '<p class="vazio">Nenhum paciente ainda. Clique em "Novo paciente" para começar.</p>');
  }

  async function paciente(id) {
    const p = await db.from("pacientes").select("*").eq("id", id).single();
    if (p.error) return falha(p.error);
    const casos = await db
      .from("casos_clinicos")
      .select("id, titulo, unidades_curriculares(numero)")
      .eq("paciente_id", id)
      .order("created_at", { ascending: false });
    if (casos.error) return falha(casos.error);
    const k = p.data,
      morto = k.status === "obito";
    tela.innerHTML = `<div class="pagina"><a class="voltar" href="#/pacientes">← Pacientes</a>
      <div class="cab-pac">${avatar(k)}<div><h2 style="margin:0">${esc(k.nome)}</h2><p>${selo(k)} ${k.sexo ? k.sexo.charAt(0).toUpperCase() + k.sexo.slice(1) : ""}${k.data_nascimento ? " · nascimento " + dia(k.data_nascimento + "T12:00") : ""}</p>${k.nome_mae || k.data_nascimento_mae ? `<p>Mãe: ${esc(k.nome_mae || "não informada")}${k.data_nascimento_mae ? " · nascimento " + dia(k.data_nascimento_mae + "T12:00") : ""}</p>` : ""}</div></div>
      <div class="barra-acoes">${btn("editarPaciente", "Editar", `data-id="${k.id}"`)}${btn("novoCaso", "+ Novo caso clínico", `data-paciente="${k.id}"`, "teal")}
        ${btn("excluirPaciente", "Excluir paciente", `data-id="${k.id}"`)}</div>
      ${morto ? `<p class="aviso"><strong>Óbito em ${diaHora(k.data_obito)}.</strong> ${esc(k.motivo_obito || "")}</p>` : ""}
      <h3>Casos clínicos</h3>
      ${casos.data.length ? '<ul class="lista">' + casos.data.map((c) => `<li><a href="#/caso/${c.id}">${esc(c.titulo)}</a><small>UC${c.unidades_curriculares.numero}</small></li>`).join("") + "</ul>" : '<p class="vazio">Este paciente ainda não tem caso clínico.</p>'}</div>`;
  }

  async function listaCasos(ucId) {
    let q = db
      .from("casos_clinicos")
      .select("id, titulo, pacientes(nome), unidades_curriculares(numero)")
      .order("created_at", { ascending: false });
    if (ucId) q = q.eq("uc_id", ucId);
    const [casos, ucs] = await Promise.all([
      q,
      db
        .from("unidades_curriculares")
        .select("id, numero, nome")
        .order("numero"),
    ]);
    if (casos.error || ucs.error) return falha(casos.error || ucs.error);
    tela.innerHTML = `<div class="pagina"><div class="topo-lista"><h2>Casos clínicos</h2>${btn("novoCaso", "+ Novo caso clínico", "", "teal")}</div>
      <form class="filtro" id="filtro"><label class="sr" for="uc">Unidade curricular</label><select id="uc"><option value="">Todas as unidades curriculares</option>
        ${ucs.data.map((u) => `<option value="${u.id}" ${String(u.id) === String(ucId) ? "selected" : ""}>UC${u.numero} - ${esc(u.nome)}</option>`).join("")}</select><button class="btn" type="submit">Filtrar</button></form>
      ${casos.data.length ? '<ul class="lista">' + casos.data.map((c) => `<li><a href="#/caso/${c.id}">${esc(c.titulo)}</a><small>${esc(c.pacientes.nome)} · UC${c.unidades_curriculares.numero}</small></li>`).join("") + "</ul>" : '<p class="vazio">Nenhum caso clínico encontrado.</p>'}</div>`;
    document.getElementById("filtro").addEventListener("submit", (e) => {
      e.preventDefault();
      const v = document.getElementById("uc").value;
      go("#/casos" + (v ? "/" + v : ""));
    });
  }

  const listaPdfs = (anx, tipo, destino) =>
    `<div class="topo-lista"><h3 style="margin:0">Materiais de apoio</h3>${btn("novoPdf", "Enviar PDF", `data-tipo="${tipo}" data-destino="${destino}"`)}</div>` +
    (anx.length
      ? '<ul class="lista">' +
        anx
          .map(
            (a) =>
              `<li class="linha"><button class="link" data-acao="abrirPdf" data-path="${esc(a.storage_path)}">${esc(a.titulo)} (PDF)</button>${btn("excluirPdf", "Excluir", `data-id="${a.id}" data-path="${esc(a.storage_path)}"`)}</li>`,
          )
          .join("") +
        "</ul>"
      : '<p class="vazio">Nenhum material enviado.</p>');

  async function caso(id) {
    const c = await db
      .from("casos_clinicos")
      .select(
        "*, pacientes(id, nome, status, data_obito), unidades_curriculares(id, numero, nome)",
      )
      .eq("id", id)
      .single();
    if (c.error) return falha(c.error);
    const k = c.data;
    const [atd, anx] = await Promise.all([
      db
        .from("atendimentos")
        .select("id, data_atendimento, evolucao")
        .eq("caso_id", id)
        .order("data_atendimento", { ascending: false }),
      db.from("anexos").select("id, titulo, storage_path").eq("caso_id", id),
    ]);
    if (atd.error || anx.error) return falha(atd.error || anx.error);
    tela.innerHTML = `<div class="pagina"><a class="voltar" href="#/paciente/${k.pacientes.id}">← ${esc(k.pacientes.nome)}</a>
      <h2>${esc(k.titulo)}</h2><p>UC${k.unidades_curriculares.numero} - ${esc(k.unidades_curriculares.nome)}</p>
      <div class="barra-acoes">${btn("editarCaso", "Editar caso", `data-id="${k.id}"`)}${btn("excluirCaso", "Excluir caso", `data-id="${k.id}"`)}</div>
      ${k.pacientes.status === "obito" ? `<p class="aviso"><strong>${esc(k.pacientes.nome)} está em óbito desde ${diaHora(k.pacientes.data_obito)}.</strong> </p>` : ""}
      <div class="cartao"><p class="texto" style="margin:0">${esc(k.descricao) || "Sem descrição."}</p></div>
      <h3>Situação-problema</h3><div class="cartao"><p class="texto" style="margin:0">${esc(k.situacao_problema) || 'Ainda não cadastrada. Use "Editar caso" para escrever.'}</p></div>
      <h3>Histórico de atendimentos</h3>
      ${atd.data.length ? '<ul class="lista">' + atd.data.map((a) => `<li><small>${diaHora(a.data_atendimento)}</small><span class="texto">${esc(a.evolucao)}</span></li>`).join("") + "</ul>" : '<p class="vazio">Nenhum atendimento registrado neste caso.</p>'}
      <div style="margin-top:26px">${listaPdfs(anx.data, "caso_id", k.id)}</div>
      <p style="margin-top:20px"><a href="#/uc/${k.unidades_curriculares.id}">Ver indicadores da UC${k.unidades_curriculares.numero}</a></p></div>`;
  }

  async function listaUCs() {
    const [ucs, casos] = await Promise.all([
      db
        .from("unidades_curriculares")
        .select("id, numero, nome")
        .order("numero"),
      db.from("casos_clinicos").select("uc_id"),
    ]);
    if (ucs.error || casos.error) return falha(ucs.error || casos.error);
    const n = {};
    casos.data.forEach((c) => {
      n[c.uc_id] = (n[c.uc_id] || 0) + 1;
    });
    tela.innerHTML = `<h2 style="font-size:2rem;margin-bottom:14px">Unidades curriculares</h2><div class="grade4">${ucs.data.map((u, i) => `<a class="item" href="#/uc/${u.id}"><span class="bolinha c${i % 3}">UC${u.numero}</span><span class="nome">${esc(u.nome)}</span><small>${n[u.id] || 0} ${n[u.id] === 1 ? "caso clínico" : "casos clínicos"}</small><span class="ver">Abrir</span></a>`).join("")}</div>`;
  }

  async function unidade(id) {
    const [u, ind, anx, casos] = await Promise.all([
      db
        .from("unidades_curriculares")
        .select("id, numero, nome")
        .eq("id", id)
        .single(),
      db
        .from("indicadores")
        .select("id, descricao")
        .eq("uc_id", id)
        .order("id"),
      db.from("anexos").select("id, titulo, storage_path").eq("uc_id", id),
      db
        .from("casos_clinicos")
        .select("id, titulo, pacientes(nome)")
        .eq("uc_id", id)
        .order("created_at", { ascending: false }),
    ]);
    const erro = [u, ind, anx, casos].find((r) => r.error);
    if (erro) return falha(erro.error);
    tela.innerHTML = `<div class="pagina"><a class="voltar" href="#/ucs">← Unidades curriculares</a><h2>UC${u.data.numero}</h2><p>${esc(u.data.nome)}</p>
      <div class="topo-lista" style="margin-top:26px"><h3 style="margin:0">Indicadores</h3>${btn("novoIndicador", "+ Novo indicador", `data-uc="${id}"`, "teal")}</div>
      ${ind.data.length ? '<ul class="lista">' + ind.data.map((i) => `<li class="linha"><span class="texto">${esc(i.descricao)}</span><div class="botoes">${btn("editarIndicador", "Editar", `data-id="${i.id}"`)}${btn("excluirIndicador", "Excluir", `data-id="${i.id}"`)}</div></li>`).join("") + "</ul>" : '<p class="vazio">Nenhum indicador cadastrado.</p>'}
      <div style="margin-top:26px">${listaPdfs(anx.data, "uc_id", id)}</div>
      <div class="topo-lista" style="margin-top:26px"><h3 style="margin:0">Casos clínicos</h3>${btn("novoCaso", "+ Novo caso", `data-uc="${id}"`, "teal")}</div>
      ${casos.data.length ? '<ul class="lista">' + casos.data.map((c) => `<li><a href="#/caso/${c.id}">${esc(c.titulo)}</a><small>${esc(c.pacientes.nome)}</small></li>`).join("") + "</ul>" : '<p class="vazio">Nenhum caso nesta unidade.</p>'}</div>`;
  }

  // Desenha um calendário mensal. ev = { le, ati, pv } (mapas dia -> títulos). Provas ficam em vermelho com 📝.
  function montarCalendario(box, ev, aoClicar) {
    const ref = new Date();
    ref.setDate(1);
    const desenha = () => {
      const ano = ref.getFullYear(),
        mes = ref.getMonth(),
        hoje = chave(new Date()),
        inicio = new Date(ano, mes, 1 - ref.getDay());
      let dias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]
        .map((t) => `<span class="sem">${t}</span>`)
        .join("");
      for (let i = 0; i < 42; i++) {
        const d = new Date(inicio);
        d.setDate(inicio.getDate() + i);
        if (i >= 35 && d.getMonth() !== mes) break;
        const k = chave(d);
        const dica = [
          ...(ev.pv.get(k) || []).map((t) => "📝 Prova: " + t),
          ...(ev.ati.get(k) || []).map((t) => "Atividade: " + t),
          ...(ev.le.get(k) || []),
        ].join(" • ");
        const pts = `${ev.le.has(k) ? '<i class="p-le"></i>' : ""}${ev.ati.has(k) ? '<i class="p-ati"></i>' : ""}${ev.pv.has(k) ? '<i class="p-pv"></i>' : ""}`;
        dias += `<span class="d ${d.getMonth() !== mes ? "fora" : ""} ${k === hoje ? "hoje" : ""} ${ev.pv.has(k) ? "pv" : ""}" data-dia="${iso(d)}" ${dica ? `title="${esc(dica)}"` : ""}><span>${d.getDate()}</span>${ev.pv.has(k) ? '<span class="emo">📝</span>' : ""}<span class="pts">${pts}</span></span>`;
      }
      const t = ref.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
      box.innerHTML = `<div class="cal-topo"><button type="button" data-m="-1" aria-label="Mês anterior">‹</button><b>${t.charAt(0).toUpperCase() + t.slice(1)}</b><button type="button" data-m="1" aria-label="Próximo mês">›</button></div><div class="cal ${aoClicar ? "clicavel" : ""}">${dias}</div><div class="legenda"><span><i style="background:var(--erro)"></i>📝 Prova</span><span><i style="background:#1F5FA8"></i>Atividade</span><span><i style="background:var(--teal)"></i>Lembrete</span></div>`;
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
  }

  const itemAtividade = (
    a,
  ) => `<li><div class="linha"><div><b class="${a.tipo === "prova" ? "txt-prova" : ""}">${a.tipo === "prova" ? "📝 Prova: " : ""}${esc(a.titulo)}</b><br><small>${diaHora(a.data_limite)}${a.formato === "multipla_escolha" ? " · múltipla escolha" : ""}${a.unidades_curriculares ? " · UC" + a.unidades_curriculares.numero : ""}</small></div>
    <div class="botoes">${a.formato === "multipla_escolha" ? btn("questoesAtividade", "Questões", `data-id="${a.id}"`) + btn("respostasAtividade", "Respostas", `data-id="${a.id}"`) : a.tipo !== "prova" ? btn("entregasAtividade", "Entregas", `data-id="${a.id}"`) : ""}${a.tipo !== "prova" || a.formato === "multipla_escolha" ? btn("monitorarAtividade", "Monitorar", `data-id="${a.id}"`) : ""}${btn("materiaisAtividade", "Materiais", `data-id="${a.id}"`)}${btn("editarAtividade", "Editar", `data-id="${a.id}"`)}${btn("excluirAtividade", "Excluir", `data-id="${a.id}"`)}</div></div></li>`;

  // Clique em um dia: mostra o que já está marcado e deixa criar lembrete ou atividade/prova.
  async function abrirDia(dataIso) {
    const ini = new Date(dataIso + "T00:00:00"),
      fim = new Date(ini);
    fim.setDate(ini.getDate() + 1);
    const [lista, ativs, alunos] = await Promise.all([
      ok(
        db
          .from("lembretes")
          .select("id, titulo, descricao, hora, aluno_id")
          .eq("data_lembrete", dataIso)
          .order("hora", { nullsFirst: true }),
      ),
      ok(
        db
          .from("atividades")
          .select(
            "id, titulo, tipo, formato, data_limite, unidades_curriculares(numero)",
          )
          .gte("data_limite", ini.toISOString())
          .lt("data_limite", fim.toISOString())
          .order("data_limite"),
      ),
      ok(db.from("perfis").select("id, nome").eq("papel", "aluno")),
    ]);
    const nome = (id) =>
      (alunos.find((a) => a.id === id) || {}).nome || "aluno";
    const d = modal(`<div class="corpo"><h2>${dia(dataIso + "T12:00")}</h2>
      ${ativs.length ? `<h3>Atividades e provas</h3><ul class="lista">${ativs.map(itemAtividade).join("")}</ul>` : ""}
      ${
        lista.length
          ? `<h3>Lembretes</h3><ul class="lista">${lista
              .map(
                (
                  l,
                ) => `<li><div class="linha"><div><b>${esc(l.titulo)}</b><br><small>${l.hora ? l.hora.slice(0, 5) + " · " : ""}Para: ${l.aluno_id ? esc(nome(l.aluno_id)) : "todos os alunos"}</small>${l.descricao ? `<span class="texto">${esc(l.descricao)}</span>` : ""}</div>
        <div class="botoes">${btn("editarLembrete", "Editar", `data-id="${l.id}"`)}${btn("excluirLembrete", "Excluir", `data-id="${l.id}"`)}</div></div></li>`,
              )
              .join("")}</ul>`
          : ""
      }
      ${!ativs.length && !lista.length ? '<p class="vazio">Nada marcado neste dia.</p>' : ""}
      <div class="rodape"><button type="button" class="btn claro peq" data-cancelar>Fechar</button>${btn("novoLembrete", "+ Lembrete", `data-data="${dataIso}"`, "teal")}${btn("novaAtividade", "+ Atividade ou prova", `data-data="${dataIso}"`, "teal")}</div></div>`);
    d.querySelector("[data-cancelar]").addEventListener("click", () =>
      d.close(),
    );
    d.querySelectorAll("[data-acao]").forEach((b) =>
      b.addEventListener("click", () => d.close()),
    );
  }

  async function formAtividade(id, dataPre) {
    const [ucs, a] = await Promise.all([
      ok(
        db
          .from("unidades_curriculares")
          .select("id, numero, nome")
          .order("numero"),
      ),
      id ? ok(db.from("atividades").select("*").eq("id", id).single()) : {},
    ]);
    formulario({
      titulo: id ? "Editar atividade" : "Nova atividade ou prova",
      botao: id ? "Salvar" : "Criar",
      campos: [
        {
          n: "tipo",
          r: "Tipo",
          t: "select",
          req: true,
          val: a.tipo || "tarefa",
          opts: [
            ["tarefa", "Atividade"],
            ["prova", "Prova (aparece em vermelho no calendário)"],
          ],
        },
        ...(id
          ? []
          : [
              {
                n: "formato",
                r: "Formato",
                t: "select",
                req: true,
                val: "escrita",
                opts: [
                  ["escrita", "Escrita (o aluno envia texto ou arquivo)"],
                  [
                    "multipla_escolha",
                    "Múltipla escolha (correção automática)",
                  ],
                ],
              },
            ]),
        { n: "titulo", r: "Título", req: true, val: a.titulo },
        {
          n: "data_limite",
          r: "Data e hora",
          t: "datetime-local",
          req: true,
          val: a.data_limite
            ? localInput(a.data_limite)
            : dataPre
              ? dataPre + "T08:00"
              : localInput(),
        },
        {
          n: "descricao",
          r: "Instruções / conteúdo",
          t: "textarea",
          rows: 5,
          val: a.descricao,
        },
        {
          n: "uc_id",
          r: "Unidade curricular",
          t: "select",
          vazio: "Nenhuma (geral)",
          val: a.uc_id,
          opts: ucs.map((u) => [u.id, `UC${u.numero} - ${u.nome}`]),
        },
        ...(id
          ? []
          : [
              {
                n: "arquivo",
                r: "Material de apoio (PDF)",
                t: "file",
                accept: "application/pdf",
                dica: 'Opcional. Você pode enviar mais PDFs depois, no botão "Materiais".',
              },
            ]),
      ],
      aoEnviar: async (v) => {
        if (v.arquivo && v.arquivo.type !== "application/pdf")
          throw new Error("O material precisa ser um arquivo PDF.");
        const dados = {
          tipo: v.tipo,
          titulo: v.titulo,
          descricao: v.descricao || null,
          uc_id: v.uc_id ? Number(v.uc_id) : null,
          data_limite: new Date(v.data_limite).toISOString(),
        };
        if (id) return ok(db.from("atividades").update(dados).eq("id", id));
        dados.formato = v.formato || "escrita";
        const nova = await ok(
          db.from("atividades").insert(dados).select("id").single(),
        );
        if (v.arquivo) {
          try {
            const caminho = await subir(
              "anexos",
              `atividade_id-${nova.id}`,
              v.arquivo,
            );
            try {
              await ok(
                db.from("anexos").insert({
                  titulo: v.arquivo.name.replace(/\.pdf$/i, ""),
                  storage_path: caminho,
                  atividade_id: nova.id,
                }),
              );
            } catch (e) {
              await db.storage.from("anexos").remove([caminho]);
              throw e;
            }
          } catch (e) {
            alert(
              `A atividade foi criada, mas o PDF não foi enviado (${e.message}). Use o botão "Materiais" para tentar de novo.`,
            );
          }
        }
        if (dados.formato === "multipla_escolha")
          editarQuestoes(nova.id).catch((e) => alert(e.message));
      },
    });
  }

  const LETRAS = "ABCDEF";
  const fmtNota = (n) => Number(n).toFixed(1).replace(".", ",");

  // Editor de questões de múltipla escolha (enunciado, alternativas e gabarito)
  async function editarQuestoes(atividadeId) {
    const [a, qs, resp] = await Promise.all([
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
          .select("id, ordem, enunciado, alternativas")
          .eq("atividade_id", atividadeId)
          .order("ordem")
          .order("id"),
      ),
      ok(
        db
          .from("respostas_alunos")
          .select("id")
          .eq("atividade_id", atividadeId),
      ),
    ]);
    const gs = qs.length
      ? await ok(
          db
            .from("gabaritos")
            .select("questao_id, correta")
            .in(
              "questao_id",
              qs.map((q) => q.id),
            ),
        )
      : [];
    const gab = {};
    gs.forEach((g) => {
      gab[g.questao_id] = g.correta;
    });
    let contador = 0;
    const bloco = (q = {}) => {
      const n = ++contador,
        alts = q.alternativas || [];
      return `<fieldset class="questao" data-id="${q.id || ""}"><legend class="leg">Questão</legend>
        <label class="campo2"><span>Enunciado *</span><textarea name="enunciado" rows="3" required>${esc(q.enunciado)}</textarea></label>
        <div class="alts">${[0, 1, 2, 3, 4].map((j) => `<label class="alt"><input type="radio" name="correta-${n}" value="${j}" ${gab[q.id] === j ? "checked" : ""} aria-label="Alternativa ${LETRAS[j]} é a correta"><b>${LETRAS[j]}</b><input type="text" name="alt" value="${esc(alts[j] || "")}" placeholder="Alternativa ${LETRAS[j]}${j < 2 ? " *" : ""}"></label>`).join("")}</div>
        <small>Marque o círculo da alternativa correta. Preencha pelo menos 2 alternativas.</small>
        <div><button type="button" class="btn claro peq" data-remover>Remover questão</button></div></fieldset>`;
    };
    const d = modal(`<form><h2>Questões</h2><p>${esc(a.titulo)}</p>
      ${resp.length ? `<p class="aviso">Já existem ${resp.length} resposta(s) de alunos. Depois de salvar, abra "Respostas" e use "Recalcular notas" para atualizar as notas.</p>` : ""}
      <div id="qs" style="display:flex;flex-direction:column;gap:14px">${(qs.length ? qs : [{}]).map(bloco).join("")}</div>
      <div><button type="button" class="btn claro peq" data-add>+ Adicionar questão</button></div>
      <p class="erro" role="alert"></p>
      <div class="rodape"><button type="button" class="btn claro peq" data-cancelar>Cancelar</button><button type="submit" class="btn teal peq">Salvar questões</button></div></form>`);
    d.classList.add("larga");
    const f = d.querySelector("form"),
      lista = d.querySelector("#qs"),
      erro = d.querySelector(".erro"),
      enviar = f.querySelector("[type=submit]");
    const numerar = () =>
      lista.querySelectorAll(".questao").forEach((b, i) => {
        b.querySelector(".leg").textContent = `Questão ${i + 1}`;
      });
    numerar();
    d.querySelector("[data-cancelar]").addEventListener("click", () =>
      d.close(),
    );
    d.querySelector("[data-add]").addEventListener("click", () => {
      lista.insertAdjacentHTML("beforeend", bloco());
      numerar();
    });
    lista.addEventListener("click", (e) => {
      if (!e.target.closest("[data-remover]")) return;
      if (lista.querySelectorAll(".questao").length < 2) {
        erro.textContent = "A atividade precisa ter pelo menos uma questão.";
        return;
      }
      e.target.closest(".questao").remove();
      numerar();
    });
    f.addEventListener("submit", async (e) => {
      e.preventDefault();
      erro.textContent = "";
      enviar.disabled = true;
      try {
        const dados = [...lista.querySelectorAll(".questao")].map((b, i) => {
          const preenchidas = [...b.querySelectorAll("input[name=alt]")]
            .map((x, j) => ({ t: x.value.trim(), j }))
            .filter((x) => x.t);
          const marcada = b.querySelector("input[type=radio]:checked");
          if (preenchidas.length < 2)
            throw new Error(
              `Questão ${i + 1}: preencha pelo menos 2 alternativas.`,
            );
          if (!marcada)
            throw new Error(`Questão ${i + 1}: marque a alternativa correta.`);
          const pos = preenchidas.findIndex(
            (x) => x.j === Number(marcada.value),
          );
          if (pos < 0)
            throw new Error(
              `Questão ${i + 1}: a alternativa marcada como correta está em branco.`,
            );
          return {
            id: b.dataset.id ? Number(b.dataset.id) : null,
            enunciado: b.querySelector("textarea").value.trim(),
            alternativas: preenchidas.map((x) => x.t),
            correta: pos,
            ordem: i,
          };
        });
        const manter = new Set(dados.filter((x) => x.id).map((x) => x.id)),
          remover = qs.filter((q) => !manter.has(q.id)).map((q) => q.id);
        if (remover.length)
          await ok(db.from("questoes").delete().in("id", remover));
        for (const q of dados) {
          let qid = q.id;
          const base = {
            atividade_id: Number(atividadeId),
            ordem: q.ordem,
            enunciado: q.enunciado,
            alternativas: q.alternativas,
          };
          if (qid) await ok(db.from("questoes").update(base).eq("id", qid));
          else
            qid = (
              await ok(db.from("questoes").insert(base).select("id").single())
            ).id;
          await ok(
            db
              .from("gabaritos")
              .upsert({ questao_id: qid, correta: q.correta }),
          );
        }
        d.close();
        rotear();
      } catch (err) {
        erro.textContent = err.message;
        enviar.disabled = false;
      }
    });
  }

  // Notas e respostas de cada aluno numa atividade de múltipla escolha
  async function respostasAtividade(id) {
    const [a, resp, alunos, qs] = await Promise.all([
      ok(
        db
          .from("atividades")
          .select("id, titulo, data_limite")
          .eq("id", id)
          .single(),
      ),
      ok(
        db
          .from("respostas_alunos")
          .select("*")
          .eq("atividade_id", id)
          .order("enviado_em"),
      ),
      ok(
        db.from("perfis").select("id, nome").eq("papel", "aluno").order("nome"),
      ),
      ok(
        db
          .from("questoes")
          .select("id, alternativas, enunciado")
          .eq("atividade_id", id),
      ),
    ]);
    const nome = (alunoId) =>
      (alunos.find((x) => x.id === alunoId) || {}).nome || "aluno";
    const feitos = new Set(resp.map((r) => r.aluno_id)),
      faltam = alunos.filter((x) => !feitos.has(x.id));
    const media = resp.length
      ? resp.reduce((t, r) => t + Number(r.nota), 0) / resp.length
      : null;
    const alt = (alts, i) =>
      i === null || i === undefined
        ? "—"
        : `${LETRAS[i]}) ${esc(alts[i] || "")}`;
    const d =
      modal(`<div class="corpo"><h2>Respostas</h2><p>${esc(a.titulo)}${media !== null ? ` · média da turma <b>${fmtNota(media)}</b>` : ""}</p>
      <h3>Responderam (${resp.length} de ${alunos.length})</h3>
      ${
        resp.length
          ? resp
              .map(
                (
                  r,
                ) => `<details><summary><b>${esc(nome(r.aluno_id))}</b> — nota ${fmtNota(r.nota)} (${r.acertos}/${r.total}) <small>${diaHora(r.enviado_em)}${a.data_limite && new Date(r.enviado_em) > new Date(a.data_limite) ? ' · <span class="txt-prova">com atraso</span>' : ""}</small></summary>
        <ol class="detalhe">${r.detalhe
          .map((x) => {
            const q = qs.find((y) => y.id === x.q),
              alts = q ? q.alternativas : [];
            return `<li>${x.acertou ? "✅" : "❌"} ${esc(q ? q.enunciado : "Questão removida")}<br><small>Marcou: ${alt(alts, x.escolhida)}${x.acertou ? "" : ` · Correta: ${alt(alts, x.correta)}`}</small></li>`;
          })
          .join("")}</ol>
        <div class="botoes" style="margin:8px 0 12px"><button type="button" class="btn claro peq" data-liberar="${r.id}">Liberar nova tentativa</button></div></details>`,
              )
              .join("")
          : '<p class="vazio">Ninguém respondeu ainda.</p>'
      }
      <h3>Faltam responder (${faltam.length})</h3><p>${faltam.length ? faltam.map((x) => esc(x.nome)).join(", ") : "Todos os alunos responderam."}</p>
      <div class="rodape"><button type="button" class="btn claro peq" data-cancelar>Fechar</button><button type="button" class="btn teal peq" data-recalcular>Recalcular notas</button></div></div>`);
    d.querySelector("[data-cancelar]").addEventListener("click", () =>
      d.close(),
    );
    d.querySelector("[data-recalcular]").addEventListener("click", async () => {
      try {
        await ok(db.rpc("recorrigir_atividade", { p_atividade: Number(id) }));
        d.close();
        respostasAtividade(id);
      } catch (err) {
        alert(err.message);
      }
    });
    d.querySelectorAll("[data-liberar]").forEach((b) =>
      b.addEventListener("click", async () => {
        if (
          !confirm("Apagar a resposta deste aluno para ele responder de novo?")
        )
          return;
        try {
          await ok(
            db.from("respostas_alunos").delete().eq("id", b.dataset.liberar),
          );
          d.close();
          respostasAtividade(id);
        } catch (err) {
          alert(err.message);
        }
      }),
    );
  }

  async function entregasAtividade(id) {
    const [a, ent, alunos] = await Promise.all([
      ok(
        db
          .from("atividades")
          .select("id, titulo, data_limite")
          .eq("id", id)
          .single(),
      ),
      ok(
        db
          .from("entregas")
          .select(
            "id, aluno_id, comentario, storage_path, nome_arquivo, enviado_em",
          )
          .eq("atividade_id", id)
          .order("enviado_em"),
      ),
      ok(
        db.from("perfis").select("id, nome").eq("papel", "aluno").order("nome"),
      ),
    ]);
    const nome = (alunoId) =>
      (alunos.find((x) => x.id === alunoId) || {}).nome || "aluno";
    const feitos = new Set(ent.map((e) => e.aluno_id)),
      faltam = alunos.filter((x) => !feitos.has(x.id));
    const d =
      modal(`<div class="corpo"><h2>Entregas</h2><p>${esc(a.titulo)}${a.data_limite ? " · prazo " + diaHora(a.data_limite) : ""}</p>
      <h3>Entregues (${ent.length} de ${alunos.length})</h3>
      ${ent.length ? `<ul class="lista">${ent.map((e) => `<li><b>${esc(nome(e.aluno_id))}</b><br><small>${diaHora(e.enviado_em)}${a.data_limite && new Date(e.enviado_em) > new Date(a.data_limite) ? ' · <span class="txt-prova">com atraso</span>' : ""}</small>${e.comentario ? `<span class="texto">${esc(e.comentario)}</span>` : ""}${e.storage_path ? `<button type="button" class="link" data-acao="abrirPdf" data-bucket="entregas" data-path="${esc(e.storage_path)}">📎 ${esc(e.nome_arquivo || "arquivo enviado")}</button>` : ""}</li>`).join("")}</ul>` : '<p class="vazio">Ninguém entregou ainda.</p>'}
      <h3>Faltam entregar (${faltam.length})</h3>
      <p>${faltam.length ? faltam.map((x) => esc(x.nome)).join(", ") : "Todos os alunos entregaram."}</p>
      <div class="rodape"><button type="button" class="btn claro peq" data-cancelar>Fechar</button></div></div>`);
    d.querySelector("[data-cancelar]").addEventListener("click", () =>
      d.close(),
    );
  }

  async function materiaisAtividade(id) {
    const [a, anx] = await Promise.all([
      ok(db.from("atividades").select("id, titulo").eq("id", id).single()),
      ok(
        db
          .from("anexos")
          .select("id, titulo, storage_path")
          .eq("atividade_id", id)
          .order("created_at"),
      ),
    ]);
    const d =
      modal(`<div class="corpo"><h2>Materiais de apoio</h2><p>${esc(a.titulo)}</p>
      ${anx.length ? `<ul class="lista">${anx.map((m) => `<li class="linha"><button type="button" class="link" data-acao="abrirPdf" data-path="${esc(m.storage_path)}">${esc(m.titulo)} (PDF)</button>${btn("excluirPdf", "Excluir", `data-id="${m.id}" data-path="${esc(m.storage_path)}"`)}</li>`).join("")}</ul>` : '<p class="vazio">Nenhum material enviado.</p>'}
      <div class="rodape"><button type="button" class="btn claro peq" data-cancelar>Fechar</button>${btn("novoPdf", "+ Enviar PDF", `data-tipo="atividade_id" data-destino="${id}"`, "teal")}</div></div>`);
    d.querySelector("[data-cancelar]").addEventListener("click", () =>
      d.close(),
    );
    d.querySelectorAll("[data-acao]:not([data-acao=abrirPdf])").forEach((b) =>
      b.addEventListener("click", () => d.close()),
    );
  }

  // ---------- monitoramento ----------
  const TIPOS_EVENTO = {
    saiu_pagina: "Saiu da página",
    copiar: "Copiou",
    recortar: "Recortou",
    colar: "Colou",
  };

  // Lista as atividades que o aluno responde no sistema
  async function monitoramentoLista() {
    const r = await db
      .from("atividades")
      .select("id, titulo, tipo, formato, data_limite")
      .order("data_limite", { ascending: false });
    if (r.error) return falha(r.error);
    const lista = r.data.filter(
      (a) => a.tipo !== "prova" || a.formato === "multipla_escolha",
    );
    tela.innerHTML = `<div class="pagina"><h2>Monitoramento</h2>
      <p style="margin-top:0">Escolha uma atividade para ver, por aluno, quantas vezes saiu da página e usou copiar, recortar ou colar enquanto respondia.</p>
      ${
        lista.length
          ? `<ul class="lista">${lista
              .map(
                (a) =>
                  `<li><div class="linha"><div><b>${esc(a.titulo)}</b><br><small>${diaHora(a.data_limite)}${a.formato === "multipla_escolha" ? " · múltipla escolha" : ""}</small></div><div class="botoes"><a class="btn teal peq" href="#/monitoramento/${a.id}">Ver monitoramento</a></div></div></li>`,
              )
              .join("")}</ul>`
          : '<p class="vazio">Nenhuma atividade cadastrada ainda.</p>'
      }</div>`;
  }

  // Totais por aluno numa atividade, com o detalhe (data e hora) de cada ocorrência
  async function monitoramentoAtividade(id) {
    let a, alunos, resumo;
    try {
      [a, alunos, resumo] = await Promise.all([
        ok(
          db
            .from("atividades")
            .select("id, titulo, data_limite")
            .eq("id", id)
            .single(),
        ),
        ok(
          db
            .from("perfis")
            .select("id, nome")
            .eq("papel", "aluno")
            .order("nome"),
        ),
        ok(db.from("monitoramento_resumo").select("*").eq("atividade_id", id)),
      ]);
    } catch (e) {
      return falha(e);
    }
    const linhas = alunos
      .map((al) => {
        const r = resumo.find((x) => x.aluno_id === al.id) || {};
        const n = (k) => Number(r[k] || 0);
        return {
          al,
          saidas: n("saidas"),
          copias: n("copias"),
          recortes: n("recortes"),
          colagens: n("colagens"),
          ultimo: r.ultimo_evento || null,
        };
      })
      .map((l) => ({
        ...l,
        total: l.saidas + l.copias + l.recortes + l.colagens,
      }))
      .sort((x, y) => y.total - x.total || x.al.nome.localeCompare(y.al.nome));
    const num = (v) => `<td class="${v ? "n" : "n0"}">${v}</td>`;
    tela.innerHTML = `<div class="pagina" style="max-width:none">
      <a class="voltar" href="#/monitoramento">← Monitoramento</a>
      <h2>${esc(a.titulo)}</h2>
      <p style="margin-top:0">${a.data_limite ? "Prazo: " + diaHora(a.data_limite) + " · " : ""}Alunos com mais ocorrências aparecem primeiro. Os números são <b>indícios</b>, não prova: o aluno pode ter saído da página por outro motivo (ligação, notificação, queda de internet).</p>
      <div class="monit-rolagem"><table class="monit-tabela">
        <thead><tr><th>Aluno</th><th>Saiu da página</th><th>Copiou</th><th>Recortou</th><th>Colou</th><th>Última ocorrência</th><th></th></tr></thead>
        <tbody>${linhas
          .map(
            (l) =>
              `<tr><td><b>${esc(l.al.nome)}</b></td>${num(l.saidas)}${num(l.copias)}${num(l.recortes)}${num(l.colagens)}<td>${l.ultimo ? diaHora(l.ultimo) : "—"}</td><td>${l.total ? btn("detalheMonitoramento", "Detalhes", `data-atividade="${a.id}" data-aluno="${l.al.id}" data-nome="${esc(l.al.nome)}"`) : ""}</td></tr>`,
          )
          .join("")}</tbody>
      </table></div>
      ${alunos.length ? "" : '<p class="vazio">Nenhum aluno cadastrado ainda.</p>'}
      ${resumo.length ? "" : '<p class="vazio">Nenhuma ocorrência registrada nesta atividade até agora.</p>'}
    </div>`;
  }

  async function detalheMonitoramento(atividadeId, alunoId, nome) {
    const ev = await ok(
      db
        .from("monitoramento_eventos")
        .select("id, tipo, detalhe, criado_em")
        .eq("atividade_id", atividadeId)
        .eq("aluno_id", alunoId)
        .order("criado_em", { ascending: false })
        .limit(300),
    );
    const d =
      modal(`<div class="corpo"><h2>${esc(nome)}</h2><p>Ocorrências registradas${ev.length === 300 ? " (as 300 mais recentes)" : ""}.</p>
      ${
        ev.length
          ? `<ul class="lista">${ev
              .map(
                (e) =>
                  `<li><b>${esc(TIPOS_EVENTO[e.tipo] || e.tipo)}</b>${e.detalhe ? ` · ${esc(e.detalhe)}` : ""}<br><small>${new Date(e.criado_em).toLocaleString("pt-BR")}</small></li>`,
              )
              .join("")}</ul>`
          : '<p class="vazio">Nenhuma ocorrência.</p>'
      }
      <div class="rodape"><button type="button" class="btn claro peq" data-cancelar>Fechar</button></div></div>`);
    d.querySelector("[data-cancelar]").addEventListener("click", () =>
      d.close(),
    );
  }

  async function alunos() {
    const r = await db
      .from("perfis")
      .select("id, nome, created_at")
      .eq("papel", "aluno")
      .order("nome");
    if (r.error) return falha(r.error);
    tela.innerHTML = `<div class="pagina"><h2>Alunos</h2>${r.data.length ? '<ul class="lista">' + r.data.map((a) => `<li><b>${esc(a.nome)}</b><small>Cadastrado em ${dia(a.created_at)}</small></li>`).join("") + "</ul>" : '<p class="vazio">Nenhum aluno cadastrado ainda.</p>'}</div>`;
  }

  function rotear() {
    const [, tipo = "", id] = location.hash.split("/");
    menu(tipo);
    if (tipo === "pacientes") return listaPacientes();
    if (tipo === "paciente" && id) return paciente(id);
    if (tipo === "casos") return listaCasos(id);
    if (tipo === "caso" && id) return caso(id);
    if (tipo === "ucs") return listaUCs();
    if (tipo === "uc" && id) return unidade(id);
    if (tipo === "alunos") return alunos();
    if (tipo === "monitoramento")
      return id ? monitoramentoAtividade(id) : monitoramentoLista();
    return inicio();
  }
  window.addEventListener("hashchange", () => {
    window.scrollTo(0, 0);
    rotear();
  });
  rotear();
})();
