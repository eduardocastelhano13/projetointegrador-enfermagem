const $ = (id) => document.getElementById(id);
const msg = (texto, tipo) => { $('msg').textContent = texto; $('msg').className = 'msg ' + (tipo || ''); };

perfilAtual().then((p) => { if (p) irPara(PAGINA_DO_PAPEL[p.papel]); });

$('olho').addEventListener('click', () => {
  const mostrar = $('senha').type === 'password';
  $('senha').type = mostrar ? 'text' : 'password';
  $('olho').setAttribute('aria-label', mostrar ? 'Ocultar senha' : 'Mostrar senha');
});

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = $('email').value.trim(), senha = $('senha').value;
  if (!email || !senha) return msg('Preencha e-mail e senha.', 'erro');
  $('entrar').disabled = true; msg('Entrando…');
  const { error } = await db.auth.signInWithPassword({ email, password: senha });
  if (error) { $('entrar').disabled = false; return msg('E-mail ou senha incorretos.', 'erro'); }
  const perfil = await perfilAtual();
  if (!perfil) { $('entrar').disabled = false; return msg('Seu perfil não foi encontrado. Fale com o professor.', 'erro'); }
  const tipo = document.querySelector('input[name="tipo"]:checked').value;
  if (perfil.papel !== tipo) {
    await db.auth.signOut();
    $('entrar').disabled = false;
    return msg(`Esta conta é de ${perfil.papel}. Selecione "${perfil.papel === 'professor' ? 'Professor' : 'Aluno'}" para entrar.`, 'erro');
  }
  irPara(PAGINA_DO_PAPEL[perfil.papel]);
});

$('recuperar').addEventListener('click', async () => {
  const email = $('email').value.trim();
  if (!email) return msg('Digite seu e-mail acima para receber o link.', 'erro');
  const { error } = await db.auth.resetPasswordForEmail(email);
  error ? msg('Não foi possível enviar o e-mail. Tente de novo.', 'erro')
        : msg('Enviamos um link de recuperação para o seu e-mail.', 'ok');
});
