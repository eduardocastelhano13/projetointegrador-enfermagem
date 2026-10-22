// Autenticação: login, recuperação de senha e criação de conta na mesma tela.
// O painel esquerdo nunca muda; só os formulários da direita se alternam.
// Aluno entra com RA (vira um e-mail interno). Professor entra com e-mail e senha.
// Aluno e professor também podem entrar/criar conta com Google.
// Ao criar conta, quem marca "Professor" vira professor (ver database/professor.sql).
(() => {
  const $ = (id) => document.getElementById(id);
  const auth = $("auth");
  const formLogin = $("form-login");
  const formCadastro = $("form-cadastro");

  const falar = (id) => (texto, tipo) => {
    $(id).textContent = texto;
    $(id).className = "auth-msg " + (tipo || "");
  };
  const msgLogin = falar("msg");
  const msgCadastro = falar("c-msg");

  /* ---------- RA -> e-mail interno ---------- */
  // O Supabase autentica por e-mail; aluno e professor entram com RA,
  // que vira um e-mail interno (domínios separados evitam colisão de RAs).
  const DOMINIOS = {
    aluno: "alunos.conecta.app",
    professor: "professores.conecta.app",
  };
  const soDigitos = (v) => v.replace(/\D/g, "");
  const raParaEmail = (ra, tipo) => `${soDigitos(ra)}@${DOMINIOS[tipo]}`;

  // O mesmo campo serve para RA (aluno) ou e-mail (professor)
  const configurarCampo = (idCampo, tipo) => {
    const campo = $(idCampo);
    const aluno = tipo === "aluno";
    campo.type = "text";
    campo.inputMode = aluno ? "numeric" : "email";
    campo.autocomplete = aluno ? "username" : "email";
    campo.placeholder = aluno ? "Seu RA" : "Seu e-mail";
    document.querySelector(`label[for="${idCampo}"]`).textContent = aluno
      ? "RA"
      : "E-mail";
  };
  const tipoLogin = () =>
    document.querySelector('input[name="tipo"]:checked').value;
  const tipoCadastro = () =>
    document.querySelector('input[name="tipo-cadastro"]:checked').value;
  const atualizarLogin = () => configurarCampo("email", tipoLogin());
  const atualizarCadastro = () => {
    const t = tipoCadastro();
    configurarCampo("c-email", t);
  };
  document
    .querySelectorAll('input[name="tipo"]')
    .forEach((r) => r.addEventListener("change", atualizarLogin));
  document
    .querySelectorAll('input[name="tipo-cadastro"]')
    .forEach((r) => r.addEventListener("change", atualizarCadastro));
  atualizarLogin();
  atualizarCadastro();

  const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  /* ---------- Mensagens de erro do Supabase (cada causa com o seu texto) ---------- */
  const textoErro = (e) => `${(e && e.code) || ""} ${(e && e.message) || ""}`;
  const limiteDeEnvio = (e) =>
    /rate_limit|too many|rate limit/i.test(textoErro(e)) ||
    (e && e.status === 429);
  const mensagemLogin = (error, tipo) => {
    const t = textoErro(error);
    if (/email_not_confirmed|not confirmed/i.test(t))
      return "Seu e-mail ainda não foi confirmado. Abra o link que enviamos para a sua caixa de entrada (veja também o spam).";
    if (limiteDeEnvio(error))
      return "Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.";
    if (/invalid_credentials|invalid login|credentials/i.test(t))
      return (
        (tipo === "aluno" ? "RA" : "E-mail") +
        " ou senha incorretos. Confira também se Aluno/Professor está correto."
      );
    return "Não foi possível entrar agora. Verifique sua conexão e tente de novo.";
  };
  // Lembra que a conta Google é de professor durante a ida e volta ao Google
  const PENDENTE = "conecta_google_professor";

  // Ao abrir a página: se já há perfil, vai direto ao painel. Também trata a volta do Google.
  (async () => {
    const retorno = new URLSearchParams(
      location.search.slice(1) + "&" + location.hash.slice(1),
    );
    const recusou = retorno.has("error_description") || retorno.has("error");
    if (recusou) {
      try {
        sessionStorage.removeItem(PENDENTE);
      } catch (e) {}
      history.replaceState(null, "", location.pathname);
      msgLogin(
        "Não foi possível entrar com o Google. O acesso foi cancelado ou recusado.",
        "erro",
      );
    }
    // Professor que acabou de criar conta pelo Google: cria o perfil de professor
    let pendente = null;
    try {
      pendente = sessionStorage.getItem(PENDENTE);
    } catch (e) {}
    if (pendente) {
      try {
        sessionStorage.removeItem(PENDENTE);
      } catch (e) {}
      const {
        data: { user: u },
      } = await db.auth.getUser();
      if (u) {
        const { data: papel, error } = await db.rpc("criar_perfil_google", {
          p_tipo: "professor",
        });
        if (error) {
          console.error("criar_perfil_google:", error);
          await db.auth.signOut();
          return msgLogin(
            "Não foi possível ativar o acesso de professor" +
              (error.code ? ` (erro ${error.code})` : "") +
              ". Tente de novo ou fale com a coordenação.",
            "erro",
          );
        }
        // A função devolve o papel que a conta realmente tem. Se não for professor,
        // avisa em vez de mandar a pessoa, sem explicação, para o painel do aluno.
        if (papel !== "professor") {
          await db.auth.signOut();
          return msgLogin(
            "Esta conta Google já existe como aluno e não pôde virar professor. Fale com a coordenação.",
            "erro",
          );
        }
      }
    }
    const p = await perfilAtual();
    if (p) return irPara(PAGINA_DO_PAPEL[p.papel]);
    // Entrou no Google, mas o perfil não existe: encerra a sessão e avisa
    const {
      data: { user },
    } = await db.auth.getUser();
    if (user) {
      await db.auth.signOut();
      msgLogin(
        'Não encontramos uma conta para este Google. Use "Criar conta" (escolha Aluno ou Professor).',
        "erro",
      );
    }
  })();

  /* ---------- Alternância login <-> cadastro (com a onda azul) ---------- */
  const onda = document.querySelector(".auth-onda");
  const mares = [...onda.querySelectorAll(".auth-onda__mar")];
  const reduzido = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const visaoDaUrl = () =>
    location.hash === "#cadastro" ? "cadastro" : "login";
  let ocupado = false;

  const aplicarVisao = (visao) => {
    const cad = visao === "cadastro";
    auth.dataset.view = visao;
    formLogin.inert = cad;
    formCadastro.inert = !cad;
    formLogin.setAttribute("aria-hidden", String(cad));
    formCadastro.setAttribute("aria-hidden", String(!cad));
    document.title = cad ? "CONECTA – Criar conta" : "CONECTA – Entrar";
  };

  const focarPrimeiroCampo = (visao) => {
    // Só em telas com mouse/teclado (no celular abriria o teclado sozinho)
    if (window.matchMedia("(pointer: fine)").matches) {
      $(visao === "cadastro" ? "c-nome" : "email").focus({
        preventScroll: true,
      });
    }
  };

  const DURACAO = 1300; // ms: onda cresce, cobre a tela e recua

  const trocarComOnda = (visao) => {
    ocupado = true;
    auth.classList.add("trocando");
    const raio =
      parseFloat(getComputedStyle(auth).getPropertyValue("--a-raio")) || 150;
    const ease = "cubic-bezier(0.7, 0, 0.25, 1)";
    const fora = "translateX(-100%)";
    const cobre = `translateX(${-raio}px)`;
    const quadros = [
      { transform: fora, easing: ease, offset: 0 },
      { transform: cobre, easing: "linear", offset: 0.42 },
      { transform: cobre, easing: ease, offset: 0.5 },
      { transform: fora, offset: 1 },
    ];
    onda.classList.add("ativa");
    // a crista (verde) sai primeiro; o azul vem logo atrás
    const anims = mares.map((el, i) =>
      el.animate(quadros, {
        duration: DURACAO,
        delay: i === 0 ? 0 : 110,
        fill: "both",
      }),
    );

    // No meio, com a tela toda coberta, troca o formulário sem animação própria
    setTimeout(
      () => {
        msgLogin("");
        msgCadastro("");
        auth.classList.remove("anima");
        aplicarVisao(visao);
        void auth.offsetWidth;
        requestAnimationFrame(() => auth.classList.add("anima"));
        const novo = visao === "cadastro" ? formCadastro : formLogin;
        novo.animate(
          [
            { opacity: 0, transform: "translateY(16px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          {
            duration: 520,
            delay: 120,
            easing: "cubic-bezier(0.2, 0.7, 0.2, 1)",
            fill: "backwards",
          },
        );
        focarPrimeiroCampo(visao);
      },
      DURACAO * 0.46 + 110,
    );

    Promise.all(anims.map((a) => a.finished.catch(() => {}))).then(() => {
      anims.forEach((a) => a.cancel());
      onda.classList.remove("ativa");
      auth.classList.remove("trocando");
      ocupado = false;
      // se o usuário usou "voltar" durante a animação, acerta a tela com a URL
      if (visaoDaUrl() !== auth.dataset.view) trocarVisao(visaoDaUrl(), false);
    });
  };

  const trocarVisao = (visao, empurrar = true) => {
    if (ocupado || auth.dataset.view === visao) return;
    if (empurrar) {
      history.pushState(
        null,
        "",
        visao === "cadastro"
          ? "#cadastro"
          : location.pathname + location.search,
      );
    }
    if (reduzido()) {
      // sem onda: só um fade curto (definido no CSS)
      msgLogin("");
      msgCadastro("");
      aplicarVisao(visao);
      focarPrimeiroCampo(visao);
    } else {
      trocarComOnda(visao);
    }
  };

  document
    .querySelectorAll("[data-ir]")
    .forEach((el) =>
      el.addEventListener("click", () => trocarVisao(el.dataset.ir)),
    );

  // Botão "voltar" do navegador
  const aoNavegar = () => trocarVisao(visaoDaUrl(), false);
  window.addEventListener("popstate", aoNavegar);
  window.addEventListener("hashchange", aoNavegar);

  aplicarVisao(visaoDaUrl());
  // Liga as transições só depois do primeiro desenho (evita animar ao abrir a página)
  requestAnimationFrame(() =>
    requestAnimationFrame(() => auth.classList.add("anima")),
  );

  /* ---------- Mostrar / ocultar senha ---------- */
  const alternarSenha = (botao, campos) => {
    botao.addEventListener("click", () => {
      const mostrar = campos[0].type === "password";
      campos.forEach((c) => {
        c.type = mostrar ? "text" : "password";
      });
      botao.setAttribute(
        "aria-label",
        mostrar ? "Ocultar senha" : "Mostrar senha",
      );
    });
  };
  alternarSenha($("olho"), [$("senha")]);
  alternarSenha($("c-olho"), [$("c-senha"), $("c-confirma")]);

  /* ---------- Login ---------- */
  formLogin.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tipo = tipoLogin();
    const digitado = $("email").value.trim(),
      senha = $("senha").value;
    if (!digitado || !senha)
      return msgLogin(
        tipo === "aluno"
          ? "Preencha o RA e a senha."
          : "Preencha o e-mail e a senha.",
        "erro",
      );
    let email;
    if (tipo === "aluno") {
      if (!soDigitos(digitado))
        return msgLogin("Digite apenas os números do seu RA.", "erro");
      email = raParaEmail(digitado, "aluno");
    } else if (digitado.includes("@")) {
      if (!EMAIL_OK.test(digitado))
        return msgLogin("Digite um e-mail válido.", "erro");
      email = digitado.toLowerCase();
    } else if (soDigitos(digitado)) {
      email = raParaEmail(digitado, "professor"); // contas antigas de professor (RA)
    } else {
      return msgLogin("Digite um e-mail válido.", "erro");
    }

    $("entrar").disabled = true;
    msgLogin("Entrando…");
    const { error } = await db.auth.signInWithPassword({
      email,
      password: senha,
    });
    if (error) {
      console.error("signInWithPassword:", error);
      $("entrar").disabled = false;
      return msgLogin(mensagemLogin(error, tipo), "erro");
    }
    const perfil = await perfilAtual();
    if (!perfil) {
      $("entrar").disabled = false;
      return msgLogin(
        "Seu perfil não foi encontrado. Fale com o professor.",
        "erro",
      );
    }
    if (perfil.papel !== tipo) {
      await db.auth.signOut();

      $("entrar").disabled = false;
      return msgLogin(
        `Esta conta é de ${perfil.papel}. Selecione "${perfil.papel === "professor" ? "Professor" : "Aluno"}" para entrar.`,
        "erro",
      );
    }
    irPara(PAGINA_DO_PAPEL[perfil.papel]);
  });

  /* ---------- Entrar com Google (aluno ou professor) ---------- */
  const entrarComGoogle = async (botao, msg, professor) => {
    botao.disabled = true;
    msg("Abrindo o Google…");
    if (professor) {
      try {
        sessionStorage.setItem(PENDENTE, "1");
      } catch (e) {}
    }
    const { error } = await db.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: RAIZ + "index.html",
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      try {
        sessionStorage.removeItem(PENDENTE);
      } catch (e) {}
      botao.disabled = false;
      msg(
        "Não foi possível iniciar o login com o Google. Tente de novo.",
        "erro",
      );
    }
  };
  $("google-login").addEventListener("click", () =>
    entrarComGoogle($("google-login"), msgLogin, tipoLogin() === "professor"),
  );
  $("google-cadastro").addEventListener("click", () =>
    entrarComGoogle(
      $("google-cadastro"),
      msgCadastro,
      tipoCadastro() === "professor",
    ),
  );

  /* ---------- Recuperar senha ---------- */
  $("recuperar").addEventListener("click", () => {
    const tipo = tipoLogin();
    msgLogin(
      tipo === "aluno"
        ? "Para redefinir a senha, procure seu professor."
        : "Para redefinir a senha, procure a coordenação.",
      "erro",
    );
  });

  /* ---------- Criar conta ---------- */
  formCadastro.addEventListener("submit", async (e) => {
    e.preventDefault();
    const tipo = tipoCadastro();
    const nome = $("c-nome").value.trim(),
      digitado = $("c-email").value.trim();
    const senha = $("c-senha").value,
      confirma = $("c-confirma").value;

    if (nome.length < 3)
      return msgCadastro("Digite seu nome completo.", "erro");
    if (tipo === "aluno" && !soDigitos(digitado))
      return msgCadastro("Digite seu RA (apenas números).", "erro");
    if (tipo === "professor" && !EMAIL_OK.test(digitado))
      return msgCadastro("Digite um e-mail válido.", "erro");
    if (senha.length < 8)
      return msgCadastro(
        "A senha precisa ter pelo menos 8 caracteres.",
        "erro",
      );
    if (senha !== confirma)
      return msgCadastro("As senhas não são iguais.", "erro");

    const email =
      tipo === "aluno"
        ? raParaEmail(digitado, "aluno")
        : digitado.toLowerCase();
    const meta =
      tipo === "aluno"
        ? { nome, tipo, ra: soDigitos(digitado) }
        : { nome, tipo };

    $("criar").disabled = true;
    msgCadastro("Criando sua conta…");
    const { data, error } = await db.auth.signUp({
      email,
      password: senha,
      options: {
        data: meta,
        emailRedirectTo: RAIZ + "index.html",
      },
    });
    $("criar").disabled = false;

    if (error) {
      console.error("signUp:", error);
      if (limiteDeEnvio(error))
        return msgCadastro(
          "Muitos cadastros em pouco tempo (limite de e-mails do servidor). Aguarde alguns minutos e tente de novo.",
          "erro",
        );
      if (/database error|saving new user/i.test(textoErro(error)))
        return msgCadastro(
          "O servidor não conseguiu criar o seu perfil. Avise a coordenação.",
          "erro",
        );
      if (/weak_password|password/i.test(textoErro(error)))
        return msgCadastro(
          "Senha fraca. Use pelo menos 8 caracteres, misturando letras e números.",
          "erro",
        );
      if (/registered|already/i.test(error.message))
        return msgCadastro(
          tipo === "aluno"
            ? "Este RA já tem conta. Volte e faça login."
            : "Este e-mail já tem conta. Volte e faça login.",
          "erro",
        );
      return msgCadastro(
        tipo === "professor"
          ? "Não foi possível criar a conta. Confira os dados e tente de novo."
          : "Não foi possível criar a conta. Confira os dados e tente de novo.",
        "erro",
      );
    }
    if (data.session) {
      const perfil = await perfilAtual();
      if (tipo === "professor" && (!perfil || perfil.papel !== "professor")) {
        await db.auth.signOut();
        return msgCadastro(
          "Conta criada, mas não foi possível ativar o acesso de professor. Tente entrar com Google ou fale com a coordenação.",
          "erro",
        );
      }
      return irPara(PAGINA_DO_PAPEL[perfil ? perfil.papel : "aluno"]);
    }
    formCadastro.reset();
    atualizarCadastro();
    msgCadastro(
      tipo === "aluno"
        ? "Conta criada! Já pode fazer login com seu RA."
        : "Conta criada! Se pedirmos, confirme pelo link enviado ao seu e-mail e depois faça login.",
      "ok",
    );
  });
})();
