import crypto from 'node:crypto'
import { githubConfig } from '../config/github.js'
import * as githubService from '../services/githubService.js'

// GET /api/github/auth
// Kicks off the OAuth flow. A random `state` is stashed in the session and
// checked again in the callback to prevent CSRF.
export function auth(req, res) {
  const state = crypto.randomUUID()
  req.session.oauthState = state
  res.redirect(githubService.buildAuthorizeUrl(state))
}

// GET /api/github/callback
// GitHub redirects here after the user authorizes (or denies) the app.
export async function callback(req, res) {
  const { code, state, error: githubError } = req.query

  const expectedState = req.session.oauthState
  req.session.oauthState = null

  if (githubError || !code || !state || state !== expectedState) {
    return res.redirect(`${githubConfig.frontendUrl}/settings?github=error`)
  }

  try {
    const accessToken = await githubService.exchangeCodeForToken(code)
    // The token lives ONLY in the server-side session store — it is never
    // sent back to the browser as JSON or as a cookie value itself.
    req.session.githubToken = accessToken
    res.redirect(`${githubConfig.frontendUrl}/settings?github=connected`)
  } catch (err) {
    console.error('[github/callback]', err.message)
    res.redirect(`${githubConfig.frontendUrl}/settings?github=error`)
  }
}

// GET /api/github/status
export async function status(req, res) {
  const token = req.session.githubToken
  if (!token) {
    return res.json({ connected: false, user: null })
  }
  try {
    const user = await githubService.fetchAuthenticatedUser(token)
    res.json({ connected: true, user })
  } catch (err) {
    req.session.githubToken = null
    res.json({ connected: false, user: null })
  }
}

// GET /api/github/user
export async function getUser(req, res) {
  const token = req.session.githubToken
  if (!token) return res.status(401).json({ message: 'GitHub não conectado.' })
  try {
    const user = await githubService.fetchAuthenticatedUser(token)
    res.json(user)
  } catch (err) {
    res.status(502).json({ message: err.message })
  }
}

// GET /api/github/repositories
export async function getRepositories(req, res) {
  const token = req.session.githubToken
  if (!token) return res.status(401).json({ message: 'GitHub não conectado.' })
  try {
    const repos = await githubService.fetchRepositories(token)
    res.json(repos)
  } catch (err) {
    res.status(502).json({ message: err.message })
  }
}

// POST /api/github/disconnect
export function disconnect(req, res) {
  req.session.githubToken = null
  res.json({ connected: false })
}
