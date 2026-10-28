// Medicamentos: lista de apoio em português + busca + bula resumida da openFDA (opcional).
// Usado por aluno.js (medicamentos administrados no atendimento)
// e por professor.js (medicamentos sugeridos no caso clínico).
//
// Fonte principal: lista local abaixo (nomes em português, uso didático).
// openFDA (https://open.fda.gov) é só um complemento: mostra trechos da bula norte-americana,
// em inglês, para princípios ativos que existam nos EUA. Não é a bula brasileira (Anvisa).
const Medicamentos = (() => {
  const VIAS = [
    ["VO", "Oral (VO)"],
    ["IV", "Endovenosa (IV)"],
    ["IM", "Intramuscular (IM)"],
    ["SC", "Subcutânea (SC)"],
    ["SL", "Sublingual (SL)"],
    ["INAL", "Inalatória"],
    ["TOP", "Tópica"],
    ["RET", "Retal"],
    ["OFT", "Oftálmica"],
    ["OUTRA", "Outra"],
  ];

  // [nome, nome na openFDA (ou null), classe, vias, apelidos/marcas]
  // null = o princípio ativo não consta na openFDA (ex.: dipirona).
  const L = [
    // Analgésicos, antitérmicos, anti-inflamatórios
    ["Paracetamol", "acetaminophen", "Analgésico e antitérmico", "VO IV", "acetaminofeno tylenol"],
    ["Dipirona", null, "Analgésico e antitérmico", "VO IV IM", "metamizol novalgina"],
    ["Ibuprofeno", "ibuprofen", "Anti-inflamatório (AINE)", "VO", "alivium advil"],
    ["Diclofenaco", "diclofenac", "Anti-inflamatório (AINE)", "VO IM TOP", "voltaren cataflam"],
    ["Cetoprofeno", "ketoprofen", "Anti-inflamatório (AINE)", "VO IM IV", "profenid"],
    ["Cetorolaco", "ketorolac", "Anti-inflamatório (AINE)", "VO SL IM IV", "toragesic"],
    ["Naproxeno", "naproxen", "Anti-inflamatório (AINE)", "VO", "flanax"],
    ["Ácido acetilsalicílico (AAS)", "aspirin", "Antiagregante plaquetário e analgésico", "VO", "aas aspirina"],
    ["Tramadol", "tramadol", "Analgésico opioide", "VO IM IV", "tramal"],
    ["Morfina", "morphine", "Analgésico opioide", "VO IV SC", "dimorf"],
    ["Codeína", "codeine", "Analgésico opioide", "VO", ""],
    ["Fentanila", "fentanyl", "Analgésico opioide", "IV", "fentanil"],
    // Digestivo
    ["Omeprazol", "omeprazole", "Inibidor de bomba de prótons", "VO IV", "losec"],
    ["Pantoprazol", "pantoprazole", "Inibidor de bomba de prótons", "VO IV", "pantozol"],
    ["Famotidina", "famotidine", "Antagonista H2", "VO", ""],
    ["Metoclopramida", "metoclopramide", "Antiemético", "VO IM IV", "plasil"],
    ["Ondansetrona", "ondansetron", "Antiemético", "VO IV", "zofran vonau"],
    ["Bromoprida", null, "Antiemético", "VO IM IV", "digesan"],
    ["Butilescopolamina", null, "Antiespasmódico", "VO IM IV", "escopolamina hioscina buscopan"],
    ["Dimenidrinato", "dimenhydrinate", "Antiemético / antivertiginoso", "VO IM IV", "dramin"],
    ["Simeticona", "simethicone", "Antiflatulento", "VO", "luftal"],
    ["Lactulose", "lactulose", "Laxante osmótico", "VO", ""],
    ["Bisacodil", "bisacodyl", "Laxante estimulante", "VO RET", "dulcolax"],
    ["Loperamida", "loperamide", "Antidiarreico", "VO", "imosec"],
    ["Sais de reidratação oral (SRO)", null, "Reposição hidroeletrolítica", "VO", "soro oral reidratação"],
    // Cardiovascular
    ["Captopril", "captopril", "Anti-hipertensivo (IECA)", "VO SL", "capoten"],
    ["Enalapril", "enalapril", "Anti-hipertensivo (IECA)", "VO", "renitec"],
    ["Losartana", "losartan", "Anti-hipertensivo (BRA)", "VO", "cozaar"],
    ["Anlodipino", "amlodipine", "Anti-hipertensivo (bloqueador de canal de cálcio)", "VO", "norvasc"],
    ["Nifedipino", "nifedipine", "Anti-hipertensivo (bloqueador de canal de cálcio)", "VO", "adalat"],
    ["Atenolol", "atenolol", "Betabloqueador", "VO", "atenol"],
    ["Propranolol", "propranolol", "Betabloqueador", "VO", "inderal"],
    ["Metoprolol", "metoprolol", "Betabloqueador", "VO IV", "seloken"],
    ["Carvedilol", "carvedilol", "Betabloqueador", "VO", "divelol"],
    ["Hidroclorotiazida", "hydrochlorothiazide", "Diurético tiazídico", "VO", "clorana"],
    ["Furosemida", "furosemide", "Diurético de alça", "VO IV IM", "lasix"],
    ["Espironolactona", "spironolactone", "Diurético poupador de potássio", "VO", "aldactone"],
    ["Digoxina", "digoxin", "Cardiotônico", "VO IV", "lanoxin"],
    ["Amiodarona", "amiodarone", "Antiarrítmico", "VO IV", "ancoron"],
    ["Atropina", "atropine", "Anticolinérgico", "IV IM SC", ""],
    ["Adrenalina (epinefrina)", "epinephrine", "Vasopressor / broncodilatador", "IV IM SC", "epinefrina"],
    ["Noradrenalina", "norepinephrine", "Vasopressor", "IV", "norepinefrina levophed"],
    ["Dobutamina", "dobutamine", "Inotrópico", "IV", "dobutrex"],
    ["Dopamina", "dopamine", "Inotrópico / vasopressor", "IV", "revivan"],
    ["Nitroglicerina", "nitroglycerin", "Vasodilatador", "SL IV", "tridil"],
    ["Dinitrato de isossorbida", "isosorbide dinitrate", "Vasodilatador", "SL VO", "isordil"],
    ["Nitroprussiato de sódio", "nitroprusside", "Vasodilatador", "IV", "nipride"],
    ["Hidralazina", "hydralazine", "Anti-hipertensivo", "VO IV IM", "apresolina"],
    ["Metildopa", "methyldopa", "Anti-hipertensivo", "VO", "aldomet"],
    ["Sinvastatina", "simvastatin", "Hipolipemiante", "VO", "zocor"],
    ["Atorvastatina", "atorvastatin", "Hipolipemiante", "VO", "lipitor"],
    ["Clopidogrel", "clopidogrel", "Antiagregante plaquetário", "VO", "plavix"],
    ["Heparina", "heparin", "Anticoagulante", "IV SC", ""],
    ["Enoxaparina", "enoxaparin", "Anticoagulante", "SC IV", "clexane"],
    ["Varfarina", "warfarin", "Anticoagulante", "VO", "marevan coumadin"],
    ["Ácido tranexâmico", "tranexamic acid", "Antifibrinolítico", "VO IV", "transamin"],
    // Endócrino / corticoides
    ["Insulina NPH", "insulin isophane", "Insulina de ação intermediária", "SC", "humulin n novolin n"],
    ["Insulina regular", "insulin human", "Insulina de ação rápida", "SC IV", "humulin r novolin r"],
    ["Metformina", "metformin", "Antidiabético oral", "VO", "glifage"],
    ["Glibenclamida", "glyburide", "Antidiabético oral", "VO", "daonil"],
    ["Gliclazida", null, "Antidiabético oral", "VO", "diamicron"],
    ["Levotiroxina", "levothyroxine", "Hormônio tireoidiano", "VO", "puran synthroid"],
    ["Dexametasona", "dexamethasone", "Corticoide", "VO IV IM", "decadron"],
    ["Prednisona", "prednisone", "Corticoide", "VO", "meticorten"],
    ["Prednisolona", "prednisolone", "Corticoide", "VO", "predsim"],
    ["Hidrocortisona", "hydrocortisone", "Corticoide", "IV IM TOP", "solu-cortef"],
    ["Metilprednisolona", "methylprednisolone", "Corticoide", "IV IM", "solu-medrol"],
    ["Glicose 50%", "dextrose", "Reposição de glicose", "IV", "glicose hipertonica"],
    // Anti-infecciosos
    ["Amoxicilina", "amoxicillin", "Antibiótico (penicilina)", "VO", "amoxil"],
    ["Amoxicilina + clavulanato", "amoxicillin and clavulanate", "Antibiótico (penicilina)", "VO IV", "clavulin augmentin"],
    ["Ampicilina", "ampicillin", "Antibiótico (penicilina)", "VO IV IM", ""],
    ["Penicilina G benzatina", "penicillin g benzathine", "Antibiótico (penicilina)", "IM", "benzetacil"],
    ["Cefalexina", "cephalexin", "Antibiótico (cefalosporina)", "VO", "keflex"],
    ["Cefazolina", "cefazolin", "Antibiótico (cefalosporina)", "IV IM", "kefazol"],
    ["Ceftriaxona", "ceftriaxone", "Antibiótico (cefalosporina)", "IV IM", "rocefin"],
    ["Azitromicina", "azithromycin", "Antibiótico (macrolídeo)", "VO IV", "zitromax"],
    ["Ciprofloxacino", "ciprofloxacin", "Antibiótico (quinolona)", "VO IV", "cipro"],
    ["Gentamicina", "gentamicin", "Antibiótico (aminoglicosídeo)", "IV IM", ""],
    ["Clindamicina", "clindamycin", "Antibiótico", "VO IV IM", "dalacin"],
    ["Vancomicina", "vancomycin", "Antibiótico (glicopeptídeo)", "IV", ""],
    ["Doxiciclina", "doxycycline", "Antibiótico (tetraciclina)", "VO", ""],
    ["Metronidazol", "metronidazole", "Antibiótico / antiprotozoário", "VO IV", "flagyl"],
    ["Sulfametoxazol + trimetoprima", "sulfamethoxazole and trimethoprim", "Antibiótico", "VO IV", "bactrim"],
    ["Fluconazol", "fluconazole", "Antifúngico", "VO IV", "zoltec"],
    ["Nistatina", "nystatin", "Antifúngico", "VO TOP", ""],
    ["Miconazol", "miconazole", "Antifúngico", "TOP", "daktarin"],
    ["Cetoconazol", "ketoconazole", "Antifúngico", "VO TOP", "nizoral"],
    ["Aciclovir", "acyclovir", "Antiviral", "VO IV TOP", "zovirax"],
    ["Albendazol", "albendazole", "Antiparasitário", "VO", "zentel"],
    ["Mebendazol", "mebendazole", "Antiparasitário", "VO", "vermox"],
    ["Ivermectina", "ivermectin", "Antiparasitário", "VO", "revectina"],
    ["Permetrina", "permethrin", "Escabicida / pediculicida", "TOP", ""],
    ["Mupirocina", "mupirocin", "Antibiótico tópico", "TOP", "bactroban"],
    ["Sulfadiazina de prata", "silver sulfadiazine", "Antimicrobiano tópico (queimaduras)", "TOP", "dermazine"],
    ["Clorexidina", "chlorhexidine", "Antisséptico", "TOP", ""],
    // Respiratório e alergia
    ["Salbutamol", "albuterol", "Broncodilatador", "INAL VO", "aerolin albuterol"],
    ["Brometo de ipratrópio", "ipratropium", "Broncodilatador", "INAL", "atrovent"],
    ["Budesonida", "budesonide", "Corticoide inalatório", "INAL", "pulmicort"],
    ["Acetilcisteína", "acetylcysteine", "Mucolítico", "VO INAL", "fluimucil"],
    ["Loratadina", "loratadine", "Anti-histamínico", "VO", "claritin"],
    ["Dexclorfeniramina", "dexchlorpheniramine", "Anti-histamínico", "VO", "polaramine"],
    ["Prometazina", "promethazine", "Anti-histamínico / antiemético", "VO IM", "fenergan"],
    ["Oxigênio", null, "Gás medicinal", "INAL", "o2"],
    // Neurologia e psiquiatria
    ["Diazepam", "diazepam", "Benzodiazepínico", "VO IM IV", "valium"],
    ["Midazolam", "midazolam", "Benzodiazepínico", "IV IM", "dormonid"],
    ["Clonazepam", "clonazepam", "Benzodiazepínico / anticonvulsivante", "VO", "rivotril"],
    ["Haloperidol", "haloperidol", "Antipsicótico", "VO IM", "haldol"],
    ["Fenobarbital", "phenobarbital", "Anticonvulsivante", "VO IV IM", "gardenal"],
    ["Fenitoína", "phenytoin", "Anticonvulsivante", "VO IV", "hidantal"],
    ["Carbamazepina", "carbamazepine", "Anticonvulsivante", "VO", "tegretol"],
    ["Ácido valproico", "valproic acid", "Anticonvulsivante", "VO", "depakene"],
    ["Amitriptilina", "amitriptyline", "Antidepressivo tricíclico", "VO", "tryptanol"],
    ["Fluoxetina", "fluoxetine", "Antidepressivo (ISRS)", "VO", "prozac"],
    ["Sertralina", "sertraline", "Antidepressivo (ISRS)", "VO", "zoloft"],
    ["Naloxona", "naloxone", "Antídoto de opioides", "IV IM SC", "narcan"],
    ["Flumazenil", "flumazenil", "Antídoto de benzodiazepínicos", "IV", "lanexat"],
    ["Lidocaína", "lidocaine", "Anestésico local / antiarrítmico", "TOP IV", "xylocaina"],
    // Soluções, eletrólitos, vitaminas
    ["Soro fisiológico 0,9% (cloreto de sódio)", "sodium chloride", "Solução eletrolítica", "IV OUTRA", "sf nacl"],
    ["Ringer lactato", "lactated ringer", "Solução eletrolítica", "IV", "rl"],
    ["Soro glicosado 5%", "dextrose", "Solução de glicose", "IV", "sg glicose 5"],
    ["Cloreto de potássio (KCl)", "potassium chloride", "Eletrólito", "IV VO", "kcl"],
    ["Bicarbonato de sódio", "sodium bicarbonate", "Alcalinizante", "IV VO", ""],
    ["Gluconato de cálcio", "calcium gluconate", "Eletrólito", "IV", ""],
    ["Sulfato de magnésio", "magnesium sulfate", "Eletrólito / anticonvulsivante", "IV IM", ""],
    ["Ocitocina", "oxytocin", "Uterotônico", "IV IM", "syntocinon"],
    ["Fitomenadiona (vitamina K)", "phytonadione", "Vitamina / antagonista da varfarina", "IM IV VO", "vitamina k konakion"],
    ["Ácido fólico", "folic acid", "Vitamina", "VO", ""],
    ["Sulfato ferroso", "ferrous sulfate", "Antianêmico (ferro)", "VO", "ferro"],
    ["Cianocobalamina (vitamina B12)", "cyanocobalamin", "Vitamina", "IM VO", "vitamina b12 citoneurin"],
    ["Tiamina (vitamina B1)", "thiamine", "Vitamina", "IM IV VO", "vitamina b1 benerva"],
  ];

  const LISTA = L.map(([nome, en, classe, vias, ap]) => ({
    nome,
    en,
    classe,
    vias: vias.split(" "),
    busca: norm(nome + " " + ap),
    nomeN: norm(nome),
    apN: norm(ap),
  }));

  function norm(t) {
    return String(t ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }
  const esc = (t) =>
    String(t ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  // "LOSARTANA POTÁSSICA" -> "Losartana potássica"
  const bonito = (t) => {
    const x = String(t ?? "").trim().toLocaleLowerCase("pt-BR");
    return x.charAt(0).toLocaleUpperCase("pt-BR") + x.slice(1);
  };
  // Bula oficial no Bulário Eletrônico da Anvisa (formato informado na documentação de medicamentos.api.br).
  const urlBula = (registro) =>
    /^\d{9}$/.test(String(registro || ""))
      ? `https://consultas.anvisa.gov.br/#/bulario/q/?numeroRegistro=${registro}`
      : null;
  const linkBula = (registro) => {
    const u = urlBula(registro);
    return u
      ? `<a class="med-link" href="${esc(u)}" target="_blank" rel="noopener noreferrer">Bula oficial (Anvisa)</a>`
      : "";
  };

  // ---------- busca na base da Anvisa (medicamentos.api.br, via Edge Function) ----------
  // A chave da API fica no servidor. O plano grátis tem poucas consultas por dia para todo o app,
  // então só consultamos quando o aluno clica, e o servidor guarda as respostas em cache.
  const cacheAnvisa = new Map();
  async function buscarAnvisa(db, termo) {
    const t = norm(termo);
    if (t.length < 3) return [];
    if (cacheAnvisa.has(t)) return cacheAnvisa.get(t);
    const { data, error } = await db.functions.invoke("buscar-medicamentos", {
      body: { nome: t },
    });
    if (error) {
      let msg = "";
      try {
        msg = (await error.context.json()).mensagem;
      } catch (_) {}
      throw new Error(
        msg || "A busca na base da Anvisa não está disponível agora. Digite o nome manualmente.",
      );
    }
    const lista = (data && data.resultados) || [];
    cacheAnvisa.set(t, lista);
    return lista;
  }

  // Acha na lista local pelo nome exato (sem acento/maiúscula).
  const achar = (nome) => {
    const n = norm(nome);
    return LISTA.find((m) => m.nomeN === n) || null;
  };

  // Busca: começa com o nome > começa com um apelido > contém.
  function buscar(termo, max = 8) {
    const t = norm(termo);
    if (t.length < 2) return [];
    const pontos = (m) => {
      if (m.nomeN.startsWith(t)) return 0;
      if (m.apN.split(" ").some((p) => p.startsWith(t))) return 1;
      if (m.busca.includes(t)) return 2;
      return 9;
    };
    return LISTA.map((m) => [pontos(m), m])
      .filter(([p]) => p < 9)
      .sort((a, b) => a[0] - b[0] || a[1].nome.localeCompare(b[1].nome, "pt"))
      .slice(0, max)
      .map(([, m]) => m);
  }

  // ---------- openFDA (bula norte-americana, em inglês) ----------
  const cacheFda = new Map();
  const CAMPOS_FDA = [
    ["indications_and_usage", "Indicações"],
    ["warnings", "Advertências"],
    ["warnings_and_cautions", "Advertências"],
    ["adverse_reactions", "Reações adversas"],
    ["contraindications", "Contraindicações"],
  ];
  const resumo = (arr, n = 450) => {
    const t = (Array.isArray(arr) ? arr.join(" ") : String(arr || ""))
      .replace(/\s+/g, " ")
      .trim();
    return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, "") + "…" : t;
  };

  async function infoFda(en) {
    if (!en) return null;
    if (cacheFda.has(en)) return cacheFda.get(en);
    const combinado = /\band\b/i.test(en);
    const termo = encodeURIComponent('"' + en + '"');
    const url = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:${termo}&limit=10`;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 9000);
    try {
      const r = await fetch(url, { signal: ctl.signal });
      if (r.status === 404) {
        cacheFda.set(en, null);
        return null;
      }
      if (!r.ok) throw new Error("A openFDA respondeu com erro " + r.status + ".");
      const json = await r.json();
      const alvo = en.toUpperCase();
      const itens = json.results || [];
      // Prefere bulas de um único princípio ativo (a menos que o medicamento seja uma associação).
      const bula =
        itens.find((x) => {
          const nomes = (x.openfda?.generic_name || []).map((s) => s.toUpperCase());
          if (!nomes.some((s) => s.includes(alvo))) return false;
          return combinado || nomes.every((s) => !/\bAND\b|,|\//.test(s));
        }) || null;
      const dados = bula
        ? CAMPOS_FDA.map(([k, rot]) => [rot, resumo(bula[k])]).filter(
            ([, v], i, a) => v && a.findIndex(([r]) => r === a[i][0]) === i,
          )
        : null;
      cacheFda.set(en, dados && dados.length ? dados : null);
      return cacheFda.get(en);
    } catch (e) {
      if (e.name === "AbortError")
        throw new Error("A openFDA demorou para responder. Tente de novo.");
      throw new Error(
        e.message && !/failed to fetch/i.test(e.message)
          ? e.message
          : "Não foi possível consultar a openFDA agora (sem internet ou bloqueio de rede).",
      );
    } finally {
      clearTimeout(timer);
    }
  }

  const AVISO_FDA =
    "Fonte: openFDA (bula dos EUA, em inglês). Pode diferir da bula brasileira (Anvisa). Use só como apoio ao estudo.";

  // Liga os botões "Ver bula resumida" (data-fda) dentro de um container.
  function ligarInfo(raiz) {
    if (raiz.__fdaLigado) return;
    raiz.__fdaLigado = true;
    raiz.addEventListener("click", async (e) => {
      const b = e.target.closest("[data-fda]");
      if (!b) return;
      e.preventDefault();
      const caixa = b.parentElement.querySelector(".med-fda");
      if (!caixa) return;
      if (!caixa.hidden) {
        caixa.hidden = true;
        b.textContent = "Ver bula resumida (FDA)";
        return;
      }
      caixa.hidden = false;
      b.textContent = "Ocultar bula resumida";
      if (caixa.dataset.pronto) return;
      caixa.innerHTML = "<p>Consultando a openFDA…</p>";
      try {
        const d = await infoFda(b.dataset.fda);
        caixa.innerHTML = d
          ? d
              .map(([rot, txt]) => `<p><b>${esc(rot)}:</b> ${esc(txt)}</p>`)
              .join("") + `<p class="med-fda__fonte">${esc(AVISO_FDA)}</p>`
          : "<p>Não encontramos uma bula correspondente na openFDA.</p>";
        caixa.dataset.pronto = "1";
      } catch (err) {
        caixa.innerHTML = `<p class="med-fda__erro">${esc(err.message)}</p>`;
      }
    });
  }

  // ---------- exibição (somente leitura) ----------
  // itens: [{nome, dose, via, horario, observacao}]; sugeridos: Set de nomes normalizados (opcional).
  function htmlLista(itens, { sugeridos = null } = {}) {
    if (!itens || !itens.length) return "";
    return (
      '<ul class="med-ver">' +
      itens
        .map((m) => {
          const info = achar(m.nome);
          const partes = [m.dose, m.via, m.horario ? "às " + String(m.horario).slice(0, 5) : ""]
            .filter(Boolean)
            .map(esc)
            .join(" · ");
          const tag =
            sugeridos && sugeridos.has(norm(m.nome))
              ? ' <span class="med-tag">sugerido</span>'
              : "";
          return `<li><div><b>${esc(m.nome)}</b>${tag}${partes ? `<span class="med-ver__det"> — ${partes}</span>` : ""}${
            m.observacao ? `<small class="med-ver__obs">${esc(m.observacao)}</small>` : ""
          }</div>${
            info && info.en
              ? `<button type="button" class="med-link" data-fda="${esc(info.en)}">Ver bula resumida (FDA)</button><div class="med-fda" hidden></div>`
              : ""
          }${m.registro_anvisa ? `<div>${linkBula(m.registro_anvisa)}</div>` : ""}</li>`;
        })
        .join("") +
      "</ul>"
    );
  }
  const nomesNormalizados = (itens) => new Set((itens || []).map((m) => norm(m.nome)));

  // ---------- campo de edição (busca + itens) ----------
  // opcoes: { titulo, inicial: [], sugestoes: [{nome,...}], comHorario, exigirDose }
  function criarSeletor({
    db = null,
    titulo = "Medicamentos",
    inicial = [],
    sugestoes = [],
    comHorario = false,
    exigirDose = false,
  } = {}) {
    const raiz = document.createElement("div");
    raiz.className = "med";
    raiz.innerHTML = `
      <span class="med__titulo">${esc(titulo)} <small>(opcional)</small></span>
      <div class="med__sug" hidden></div>
      <div class="med__busca">
        <input type="text" class="med__q" placeholder="Buscar medicamento (ex.: dipirona, furosemida…)" autocomplete="off" role="combobox" aria-expanded="false" aria-label="Buscar medicamento">
        <ul class="med__opcoes" role="listbox" hidden></ul>
      </div>
      <ul class="med__itens"></ul>
      <small class="med__aviso">Lista de apoio didático. Confira sempre a prescrição e a bula oficial (Anvisa). Não achou? Digite o nome e adicione como digitado.</small>`;

    const q = raiz.querySelector(".med__q"),
      ops = raiz.querySelector(".med__opcoes"),
      box = raiz.querySelector(".med__itens"),
      sug = raiz.querySelector(".med__sug");
    let itens = inicial.map((m) => ({ ...m, registro: m.registro_anvisa || m.registro || "" })),
      achados = [],
      achadosAnvisa = [],
      pedido = 0,
      ativo = -1;

    const optVias = (sel) =>
      [["", "Selecione…"], ...VIAS].map(
        ([v, r]) => `<option value="${v}" ${v === sel ? "selected" : ""}>${esc(r)}</option>`,
      ).join("");

    function desenhaItens() {
      box.innerHTML = itens
        .map((m, i) => {
          const info = achar(m.nome);
          return `<li class="med__item" data-i="${i}">
            <div class="med__cab"><div><b>${esc(m.nome)}</b>${info ? `<small>${esc(info.classe)}</small>` : m.registro ? `<small>${esc(m.classe || "Base da Anvisa")}</small>` : "<small>digitado manualmente</small>"}</div>
              <button type="button" class="med-link med-link--rem" data-rem="${i}" aria-label="Remover ${esc(m.nome)}">Remover</button></div>
            <div class="med__campos">
              <label>Dose${exigirDose ? " *" : ""}<input type="text" data-c="dose" value="${esc(m.dose)}" placeholder="ex.: 500 mg" maxlength="60"></label>
              <label>Via<select data-c="via">${optVias(m.via)}</select></label>
              ${comHorario ? `<label>Horário<input type="time" data-c="horario" value="${esc(String(m.horario || "").slice(0, 5))}"></label>` : ""}
              <label class="med__obs">Observação<input type="text" data-c="observacao" value="${esc(m.observacao)}" placeholder="ex.: diluído em 100 mL de SF 0,9%" maxlength="200"></label>
            </div>
            ${info && info.en ? `<button type="button" class="med-link" data-fda="${esc(info.en)}">Ver bula resumida (FDA)</button><div class="med-fda" hidden></div>` : ""}
            ${m.registro ? `<div>${linkBula(m.registro)}</div>` : ""}
          </li>`;
        })
        .join("");
    }

    function desenhaSugestoes() {
      const jaTem = nomesNormalizados(itens);
      const faltam = sugestoes.filter((s) => !jaTem.has(norm(s.nome)));
      sug.hidden = !faltam.length;
      sug.innerHTML = faltam.length
        ? `<small>Sugeridos pelo professor (toque para adicionar):</small><div class="med__chips">${faltam
            .map(
              (s, i) =>
                `<button type="button" class="med__chip" data-sug="${esc(s.nome)}">+ ${esc(s.nome)}</button>`,
            )
            .join("")}</div>`
        : "";
    }

    function adicionar(nome, base = {}) {
      nome = String(nome).trim();
      if (!nome) return;
      if (itens.some((m) => norm(m.nome) === norm(nome))) {
        fechaOpcoes();
        q.value = "";
        return;
      }
      const info = achar(nome);
      itens.push({
        nome: info ? info.nome : nome,
        dose: base.dose || "",
        via: base.via || (info ? info.vias[0] : ""),
        horario: base.horario || "",
        observacao: base.observacao || "",
        registro: base.registro || "",
        classe: base.classe || "",
      });
      q.value = "";
      fechaOpcoes();
      desenhaItens();
      desenhaSugestoes();
      const ult = box.lastElementChild?.querySelector('[data-c="dose"]');
      if (ult) ult.focus();
    }

    function fechaOpcoes() {
      ops.hidden = true;
      ativo = -1;
      q.setAttribute("aria-expanded", "false");
    }
    function abreOpcoes() {
      const termo = q.value.trim();
      pedido++; // invalida qualquer busca online em andamento
      achados = buscar(termo);
      if (termo.length < 2) return fechaOpcoes();
      const exato = achados.some((m) => m.nomeN === norm(termo));
      ops.innerHTML =
        achados
          .map(
            (m, i) =>
              `<li role="option" data-op="${i}"><b>${esc(m.nome)}</b><small>${esc(m.classe)}</small></li>`,
          )
          .join("") +
        (exato
          ? ""
          : `<li role="option" data-op="livre" class="med__livre"><b>Adicionar “${esc(termo)}”</b><small>como digitado</small></li>`) +
        (db && termo.length >= 3
          ? `<li role="option" data-op="anvisa" class="med__anvisa"><b>Buscar “${esc(termo)}” na base da Anvisa</b><small>consulta online (limite diário compartilhado)</small></li>`
          : "");
      ops.hidden = false;
      ativo = achados.length ? 0 : -1;
      q.setAttribute("aria-expanded", "true");
      marca();
    }
    function marca() {
      [...ops.children].forEach((li, i) => li.classList.toggle("ativo", i === ativo));
    }
    async function buscaOnline() {
      const meu = ++pedido;
      const termo = q.value.trim();
      ops.innerHTML = '<li class="med__msg">Buscando na base da Anvisa…</li>';
      ops.hidden = false;
      ativo = -1;
      try {
        const lista = await buscarAnvisa(db, termo);
        if (meu !== pedido) return; // o aluno já digitou outra coisa
        achadosAnvisa = lista;
        ops.innerHTML =
          (lista.length
            ? lista
                .map(
                  (m, i) =>
                    `<li role="option" data-an="${i}"><b>${esc(bonito(m.nome))}</b><small>${esc(
                      [m.principioAtivo && bonito(m.principioAtivo), m.classe && bonito(m.classe)]
                        .filter(Boolean)
                        .join(" · ") || "Base da Anvisa",
                    )}</small></li>`,
                )
                .join("")
            : '<li class="med__msg">Nada encontrado na base da Anvisa.</li>') +
          `<li role="option" data-op="livre" class="med__livre"><b>Adicionar “${esc(termo)}”</b><small>como digitado</small></li>`;
        ativo = lista.length ? 0 : -1;
        marca();
      } catch (e) {
        if (meu !== pedido) return;
        ops.innerHTML = `<li class="med__msg med__msg--erro">${esc(e.message)}</li><li role="option" data-op="livre" class="med__livre"><b>Adicionar “${esc(termo)}”</b><small>como digitado</small></li>`;
      }
    }
    const escolher = (li) => {
      if (!li) return;
      if (li.dataset.an !== undefined) {
        const m = achadosAnvisa[Number(li.dataset.an)];
        return adicionar(bonito(m.nome), { registro: m.registro, classe: m.classe ? bonito(m.classe) : "" });
      }
      const k = li.dataset.op;
      if (k === "livre") adicionar(q.value);
      else if (k === "anvisa") buscaOnline();
      else if (achados[Number(k)]) adicionar(achados[Number(k)].nome);
    };

    q.addEventListener("input", abreOpcoes);
    q.addEventListener("focus", abreOpcoes);
    q.addEventListener("keydown", (e) => {
      const n = ops.children.length;
      if (e.key === "ArrowDown" && n) {
        e.preventDefault();
        ativo = (ativo + 1) % n;
        marca();
      } else if (e.key === "ArrowUp" && n) {
        e.preventDefault();
        ativo = (ativo - 1 + n) % n;
        marca();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (!ops.hidden && ops.children[Math.max(ativo, 0)]) escolher(ops.children[Math.max(ativo, 0)]);
        else if (q.value.trim().length >= 2) adicionar(q.value);
      } else if (e.key === "Escape" && !ops.hidden) {
        e.stopPropagation();
        e.preventDefault();
        fechaOpcoes();
      }
    });
    q.addEventListener("blur", () => setTimeout(fechaOpcoes, 150));
    ops.addEventListener("mousedown", (e) => {
      e.preventDefault();
      escolher(e.target.closest("li"));
    });

    // Enter nos campos de dose/observação não pode enviar o formulário inteiro.
    raiz.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.tagName === "INPUT") e.preventDefault();
    });
    box.addEventListener("input", (e) => {
      const el = e.target.closest("[data-c]");
      const li = e.target.closest("[data-i]");
      if (el && li) itens[Number(li.dataset.i)][el.dataset.c] = el.value;
    });
    box.addEventListener("click", (e) => {
      const r = e.target.closest("[data-rem]");
      if (!r) return;
      itens.splice(Number(r.dataset.rem), 1);
      desenhaItens();
      desenhaSugestoes();
    });
    sug.addEventListener("click", (e) => {
      const b = e.target.closest("[data-sug]");
      if (!b) return;
      const s = sugestoes.find((x) => x.nome === b.dataset.sug) || {};
      adicionar(b.dataset.sug, { dose: s.dose, via: s.via });
    });

    ligarInfo(raiz);
    desenhaItens();
    desenhaSugestoes();

    return {
      el: raiz,
      // Lança erro com mensagem amigável se faltar algo obrigatório.
      validar() {
        if (exigirDose) {
          const sem = itens.find((m) => !String(m.dose || "").trim());
          if (sem) throw new Error(`Informe a dose de ${sem.nome}.`);
          const semVia = itens.find((m) => !m.via);
          if (semVia) throw new Error(`Escolha a via de administração de ${semVia.nome}.`);
        }
      },
      valores() {
        return itens
          .filter((m) => String(m.nome || "").trim())
          .map((m) => ({
            nome: m.nome.trim(),
            dose: String(m.dose || "").trim() || null,
            via: m.via || null,
            horario: comHorario && m.horario ? m.horario : null,
            observacao: String(m.observacao || "").trim() || null,
            // só envia a coluna quando há registro (assim o app não quebra se o SQL novo ainda não rodou)
            ...(urlBula(m.registro) ? { registro_anvisa: m.registro } : {}),
          }));
      },
    };
  }

  // Coloca o seletor dentro de um formulário, antes da linha de erro.
  function montarNoForm(dialog, seletor) {
    const alvo = dialog.querySelector("form .erro");
    if (alvo) alvo.before(seletor.el);
    else dialog.querySelector("form").appendChild(seletor.el);
  }

  const erroTabela = (e) =>
    /does not exist|schema cache|42P01|PGRST205/i.test((e && (e.code + " " + e.message)) || "")
      ? new Error(
          "As tabelas de medicamentos ainda não existem. Rode o arquivo database/medicamentos.sql no SQL Editor do Supabase.",
        )
      : new Error(e.message);

  // Lê os medicamentos de um pai (caso ou atendimento). Se a tabela não existir, devolve [].
  async function carregar(db, tabela, coluna, ids) {
    const lista = Array.isArray(ids) ? ids : [ids];
    if (!lista.length) return [];
    const { data, error } = await db
      .from(tabela)
      .select("*")
      .in(coluna, lista)
      .order("id");
    return error ? [] : data || [];
  }

  // Troca todos os medicamentos do pai pelos itens informados.
  async function salvar(db, tabela, coluna, id, itens, haviaAntes) {
    if (!itens.length && !haviaAntes) return; // nada a fazer (e não toca no banco)
    if (haviaAntes || id) {
      const d = await db.from(tabela).delete().eq(coluna, id);
      if (d.error) throw erroTabela(d.error);
    }
    if (itens.length) {
      const ins = await db
        .from(tabela)
        .insert(itens.map((m) => ({ ...m, [coluna]: id })));
      if (ins.error) throw erroTabela(ins.error);
    }
  }

  return {
    LISTA,
    VIAS,
    norm,
    achar,
    buscar,
    infoFda,
    buscarAnvisa,
    urlBula,
    ligarInfo,
    htmlLista,
    nomesNormalizados,
    criarSeletor,
    montarNoForm,
    carregar,
    salvar,
  };
})();

if (typeof module !== "undefined") module.exports = Medicamentos;
