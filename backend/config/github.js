// Central place that reads GitHub-related env vars, so nothing else in the
// backend touches process.env directly. Fails loudly on boot if the OAuth
// app credentials are missing, instead of failing confusingly on first request.

import 'dotenv/config'

const required = ['GITHUB_CLIENT_ID', 'GITHUB_CLIENT_SECRET', 'GITHUB_CALLBACK_URL']
const missing = required.filter((key) => !process.env[key])

if (missing.length > 0) {
  console.warn(
    `[github/config] Faltam variáveis de ambiente: ${missing.join(', ')}. ` +
      'A conexão real com o GitHub não vai funcionar até que .env seja preenchido ' +
      '(veja .env.example).'
  )
}

export const githubConfig = {
  clientId: process.env.GITHUB_CLIENT_ID ?? '',
  clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
  callbackUrl: process.env.GITHUB_CALLBACK_URL ?? 'http://localhost:4000/api/github/callback',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  // Menor privilégio possível para o que o VITA faz hoje: ler dados básicos
  // do usuário e listar repositórios. Nada de escrita, nada de admin.
  scopes: ['read:user', 'repo'],
  authorizeUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  apiBaseUrl: 'https://api.github.com',
}
