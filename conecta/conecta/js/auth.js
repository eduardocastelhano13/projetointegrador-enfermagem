// Conexão com o Supabase + funções de login usadas por todas as páginas.
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const RAIZ = new URL('../', document.currentScript.src).href; // pasta principal do projeto
const PAGINA_DO_PAPEL = { professor: 'pages/professor.html', aluno: 'pages/aluno.html' };
const irPara = (caminho) => location.replace(RAIZ + caminho);

async function perfilAtual() {
  const { data: { user } } = await db.auth.getUser();
  if (!user) return null;
  const { data, error } = await db.from('perfis').select('id, nome, papel').eq('id', user.id).single();
  return error ? null : data;
}

async function exigirPapel(papel) {
  const perfil = await perfilAtual();
  if (!perfil) { irPara('index.html'); return null; }
  if (perfil.papel !== papel) { irPara(PAGINA_DO_PAPEL[perfil.papel]); return null; }
  return perfil;
}

async function sair() {
  await db.auth.signOut();
  irPara('index.html');
}
