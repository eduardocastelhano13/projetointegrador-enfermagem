// Criação de conta: Aluno ou Professor (sem código).
const $ = (id) => document.getElementById(id);
const msg = (texto, tipo) => { $('msg').textContent = texto; $('msg').className = 'msg ' + (tipo || ''); };
const tipoEscolhido = () => document.querySelector('input[name="tipo"]:checked').value;

perfilAtual().then((p) => { if (p) irPara(PAGINA_DO_PAPEL[p.papel]); });

$('olho').addEventListener('click', () => {
  const mostrar = $('senha').type === 'password';
  $('senha').type = mostrar ? 'text' : 'password';
  $('olho').setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
});

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const tipo = tipoEscolhido();
  const nome = $('nome').value.trim(), email = $('email').value.trim();
  const senha = $('senha').value, confirma = $('confirma').value;

  if (nome.length < 3) return msg('Digite seu nome completo.', 'erro');
  if (!email) return msg('Digite seu e-mail.', 'erro');
  if (senha.length < 8) return msg('A senha precisa ter pelo menos 8 caracteres.', 'erro');
  if (senha !== confirma) return msg('As senhas não são iguais.', 'erro');

  $('criar').disabled = true; msg('Criando sua conta…');
  const { data, error } = await db.auth.signUp({
    email,
    password: senha,
    options: { data: { nome, tipo }, emailRedirectTo: RAIZ + 'index.html' },
  });
  $('criar').disabled = false;

  if (error) {
    if (/registered|already/i.test(error.message)) return msg('Este e-mail já tem conta. Volte e faça login.', 'erro');
    return msg('Não foi possível criar a conta. Confira os dados e tente de novo.', 'erro');
  }
  if (data.session) {
    const perfil = await perfilAtual();
    return irPara(PAGINA_DO_PAPEL[perfil ? perfil.papel : 'aluno']);
  }
  $('form').reset();
  msg('Conta criada! Confirme pelo link que enviamos ao seu e-mail e depois faça login.', 'ok');
});
