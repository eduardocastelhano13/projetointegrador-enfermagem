// Edge Function: busca medicamentos na API medicamentos.api.br (dados da Anvisa).
// - A chave da API fica só aqui (secret MEDICAMENTOS_API_KEY), nunca no navegador.
// - Só responde a usuários logados no CONECTA.
// - Guarda cada resposta na tabela medicamentos_cache por 30 dias, para economizar a cota
//   do plano grátis (100 consultas/dia no total).
import { createClient } from "npm:@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" },
  });

const DIAS_CACHE = 30;

export const norm = (t: unknown) =>
  String(t ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

// A API devolve um item por registro (um por fabricante). Aqui juntamos pelo nome.
export function mapear(d: any) {
  const vistos = new Set<string>();
  const saida: Record<string, unknown>[] = [];
  for (const x of d?.resultados ?? []) {
    const nome = String(x?.nome ?? "").trim();
    if (!nome || !/^\d{9}$/.test(String(x?.registro ?? ""))) continue;
    const k = norm(nome);
    if (vistos.has(k)) continue;
    vistos.add(k);
    saida.push({
      registro: x.registro,
      nome,
      principioAtivo: x.principioAtivo ?? null,
      classe: x.classeTerapeutica ?? null,
      classificacao: x.classificacao ?? null,
    });
  }
  return saida.slice(0, 15);
}

export async function tratar(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ erro: "metodo_nao_permitido", mensagem: "Use POST." }, 405);

  const chave = Deno.env.get("a5627c49002d70a08d5383a413c15a55");
  if (!chave)
    return json(
      { erro: "nao_configurado", mensagem: "A busca na Anvisa ainda não foi configurada no servidor." },
      500,
    );

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Exige usuário logado (a chave "anon" sozinha não basta)
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: u, error: eu } = await admin.auth.getUser(token);
  if (eu || !u?.user) return json({ erro: "nao_autenticado", mensagem: "Entre na sua conta para buscar." }, 401);

  let corpo: any = null;
  try {
    corpo = await req.json();
  } catch (_) {
    return json({ erro: "corpo_invalido", mensagem: "Pedido inválido." }, 400);
  }
  const termo = norm(corpo?.nome);
  if (termo.length < 3 || termo.length > 100)
    return json({ erro: "parametro_invalido", mensagem: "Digite de 3 a 100 caracteres." }, 400);

  // 1) cache
  const { data: c } = await admin
    .from("medicamentos_cache")
    .select("resultado, atualizado_em")
    .eq("termo", termo)
    .maybeSingle();
  if (c && Date.now() - new Date(c.atualizado_em).getTime() < DIAS_CACHE * 86400000)
    return json({ resultados: c.resultado, origem: "cache" });

  // 2) API
  let r: Response;
  try {
    r = await fetch(
      `https://medicamentos.api.br/api/v1/medicamentos?nome=${encodeURIComponent(termo)}&porPagina=50`,
      { headers: { "X-API-Key": chave }, signal: AbortSignal.timeout(8000) },
    );
  } catch (_) {
    return json({ erro: "indisponivel", mensagem: "A base da Anvisa não respondeu. Tente de novo ou digite o nome manualmente." }, 502);
  }
  if (r.status === 429)
    return json(
      { erro: "limite_excedido", mensagem: "O limite diário de consultas à base da Anvisa acabou. Tente amanhã ou digite o nome manualmente." },
      429,
    );
  if (r.status === 401 || r.status === 403)
    return json({ erro: "chave_invalida", mensagem: "A chave da API de medicamentos é inválida. Avise o professor responsável." }, 502);
  if (!r.ok)
    return json({ erro: "indisponivel", mensagem: "A base da Anvisa está com problemas agora. Digite o nome manualmente." }, 502);

  const resultados = mapear(await r.json());
  await admin
    .from("medicamentos_cache")
    .upsert({ termo, resultado: resultados, atualizado_em: new Date().toISOString() });
  return json({ resultados, origem: "api" });
}

Deno.serve(tratar);
