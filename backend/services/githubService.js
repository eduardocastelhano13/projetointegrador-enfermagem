// githubService (backend) — the ONLY place in the whole project that talks
// to GitHub's OAuth endpoints or holds an access token in memory. The token
// lives in the user's server-side session (see server.js) and is never sent
// to the frontend.

import { githubConfig } from '../config/github.js'

export function buildAuthorizeUrl(state) {
  const params = new URLSearchParams({
    client_id: githubConfig.clientId,
    redirect_uri: githubConfig.callbackUrl,
    scope: githubConfig.scopes.join(' '),
    state,
    allow_signup: 'true',
  })
  return `${githubConfig.authorizeUrl}?${params.toString()}`
}

export async function exchangeCodeForToken(code) {
  const res = await fetch(githubConfig.tokenUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_id: githubConfig.clientId,
      client_secret: githubConfig.clientSecret,
      code,
      redirect_uri: githubConfig.callbackUrl,
    }),
  })

  if (!res.ok) {
    throw new Error(`Falha ao trocar o código pelo token (status ${res.status}).`)
  }

  const data = await res.json()
  if (data.error) {
    throw new Error(data.error_description || data.error)
  }
  if (!data.access_token) {
    throw new Error('GitHub não retornou um access_token.')
  }
  return data.access_token
}

async function githubApiFetch(path, token) {
  const res = await fetch(`${githubConfig.apiBaseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!res.ok) {
    throw new Error(`Chamada à API do GitHub falhou (${path}, status ${res.status}).`)
  }
  return res.json()
}

export async function fetchAuthenticatedUser(token) {
  const data = await githubApiFetch('/user', token)
  return {
    username: data.login,
    name: data.name ?? data.login,
    avatarUrl: data.avatar_url,
    profileUrl: data.html_url,
  }
}

export async function fetchRepositories(token) {
  const data = await githubApiFetch('/user/repos?per_page=100&sort=updated', token)
  return data.map((repo) => ({
    id: String(repo.id),
    owner: repo.owner?.login,
    name: repo.name,
    fullName: repo.full_name,
    description: repo.description,
    language: repo.language,
    visibility: repo.private ? 'private' : 'public',
    updatedAt: repo.updated_at,
    stars: repo.stargazers_count,
    url: repo.html_url,
  }))
}

// --- futuro (planejado, não implementado nesta etapa) ---------------------
// export async function fetchCommits(token, owner, repo) {}
// export async function fetchIssues(token, owner, repo) {}
// export async function fetchPullRequests(token, owner, repo) {}
