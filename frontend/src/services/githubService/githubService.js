// githubService — single entry point the UI uses for everything GitHub.
//
// Two modes, chosen automatically:
//
// - MOCK (default): no VITE_GITHUB_API_URL configured. Everything is
//   simulated locally (see data/githubMock.js), with a persisted "connected"
//   flag in localStorage so the state survives a page reload. This is the
//   Fase 1 experience.
//
// - REAL (Fase 2): VITE_GITHUB_API_URL is set (see .env.example), pointing
//   at the VITA backend. All calls become fetch() requests against that
//   backend, which is the only place that ever talks to GitHub's OAuth
//   endpoints or holds a Client Secret / access token. The frontend never
//   sees a GitHub token.
//
//   GET  {API}/auth            → browser navigates here to start OAuth
//   GET  {API}/callback        → GitHub redirects here (backend only)
//   GET  {API}/status          → { connected, user }
//   GET  {API}/user            → authenticated GitHub user
//   GET  {API}/repositories    → repositories for the connected account
//   POST {API}/disconnect      → clears the backend session
//
// Whichever mode is active, components only ever import functions from this
// file — never from data/githubMock.js or a raw fetch() to GitHub directly.

import { githubMockUser, githubMockRepositories } from '../../data/githubMock'

const API_BASE = import.meta.env.VITE_GITHUB_API_URL
export const GITHUB_MODE = API_BASE ? 'real' : 'mock'

const STORAGE_KEY = 'vita:github:mock-connected'
const MOCK_CONNECT_DELAY_MS = 1400

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function realFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || `Falha na requisição ao backend do GitHub (${res.status}).`)
  }
  return res.json()
}

// --- status -----------------------------------------------------------

export async function getStatus() {
  if (GITHUB_MODE === 'mock') {
    const connected = localStorage.getItem(STORAGE_KEY) === 'true'
    return { connected, user: connected ? githubMockUser : null }
  }
  return realFetch('/status')
}

// --- connect / disconnect ----------------------------------------------

// In mock mode this simulates the whole round trip. In real mode this is
// a full-page redirect — GitHub's OAuth flow can't happen inside a fetch()
// call, so callers should treat `connect()` as "navigation happens now".
export async function connect() {
  if (GITHUB_MODE === 'mock') {
    await delay(MOCK_CONNECT_DELAY_MS)
    localStorage.setItem(STORAGE_KEY, 'true')
    return { connected: true, user: githubMockUser }
  }
  window.location.href = `${API_BASE}/auth`
  // never resolves — the browser is navigating away
  return new Promise(() => {})
}

export async function disconnect() {
  if (GITHUB_MODE === 'mock') {
    localStorage.removeItem(STORAGE_KEY)
    return { connected: false }
  }
  return realFetch('/disconnect', { method: 'POST' })
}

// --- data ----------------------------------------------------------------

export async function getAuthenticatedUser() {
  if (GITHUB_MODE === 'mock') {
    await delay(300)
    return githubMockUser
  }
  return realFetch('/user')
}

export async function getRepositories() {
  if (GITHUB_MODE === 'mock') {
    await delay(500)
    return githubMockRepositories
  }
  return realFetch('/repositories')
}

export async function getRepository(repositoryId) {
  if (GITHUB_MODE === 'mock') {
    await delay(200)
    return githubMockRepositories.find((r) => r.id === repositoryId) ?? null
  }
  return realFetch(`/repositories/${repositoryId}`)
}

// --- future (não implementado nesta etapa) --------------------------------
// Mantidos aqui como stubs para deixar a forma do serviço pronta; o
// Dashboard/Chat não devem chamá-los ainda.

export async function getCommits(/* repositoryId */) {
  throw new Error('getCommits ainda não foi implementado — planejado para uma próxima etapa.')
}

export async function getIssues(/* repositoryId */) {
  throw new Error('getIssues ainda não foi implementado — planejado para uma próxima etapa.')
}

export async function getPullRequests(/* repositoryId */) {
  throw new Error('getPullRequests ainda não foi implementado — planejado para uma próxima etapa.')
}
