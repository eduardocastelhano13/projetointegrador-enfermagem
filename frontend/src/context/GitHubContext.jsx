import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import * as githubService from '../services/githubService/githubService'

// Project ↔ repository links. Kept separate from account connection state
// because, later, this is exactly the shape that will move to Supabase:
//
//   Project
//    └── GitHub Repository { repository_id, owner, name, url }
//
const LINKS_STORAGE_KEY = 'vita:github:project-links'

function loadLinks() {
  try {
    const raw = localStorage.getItem(LINKS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveLinks(links) {
  localStorage.setItem(LINKS_STORAGE_KEY, JSON.stringify(links))
}

const GitHubContext = createContext(null)

export function GitHubProvider({ children }) {
  const [status, setStatus] = useState('checking') // checking | disconnected | connecting | connected | error
  const [user, setUser] = useState(null)
  const [repositories, setRepositories] = useState([])
  const [reposLoaded, setReposLoaded] = useState(false)
  const [links, setLinks] = useState(loadLinks)

  const refreshStatus = useCallback(async () => {
    try {
      const result = await githubService.getStatus()
      setStatus(result.connected ? 'connected' : 'disconnected')
      setUser(result.user ?? null)
    } catch {
      setStatus('disconnected')
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refreshStatus()
  }, [refreshStatus])

  const connectGithub = useCallback(async () => {
    setStatus('connecting')
    try {
      const result = await githubService.connect()
      // Mock mode resolves immediately; real mode navigates away and never
      // resolves, so this line only runs for the mock path.
      setStatus('connected')
      setUser(result.user)
      const repos = await githubService.getRepositories()
      setRepositories(repos)
      setReposLoaded(true)
    } catch {
      setStatus('error')
    }
  }, [])

  const disconnectGithub = useCallback(async () => {
    await githubService.disconnect()
    setStatus('disconnected')
    setUser(null)
    setRepositories([])
    setReposLoaded(false)
  }, [])

  const loadRepositories = useCallback(async () => {
    const repos = await githubService.getRepositories()
    setRepositories(repos)
    setReposLoaded(true)
    return repos
  }, [])

  const linkRepository = useCallback((projectId, repo) => {
    setLinks((prev) => {
      const next = {
        ...prev,
        [projectId]: {
          repositoryId: repo.id,
          owner: repo.owner,
          name: repo.name,
          fullName: repo.fullName,
          url: repo.url,
        },
      }
      saveLinks(next)
      return next
    })
  }, [])

  const unlinkRepository = useCallback((projectId) => {
    setLinks((prev) => {
      const next = { ...prev }
      delete next[projectId]
      saveLinks(next)
      return next
    })
  }, [])

  const getLinkedRepository = useCallback((projectId) => links[projectId] ?? null, [links])

  const getLinkedProjectId = useCallback(
    (repositoryId) => Object.keys(links).find((projectId) => links[projectId].repositoryId === repositoryId) ?? null,
    [links]
  )

  const value = useMemo(
    () => ({
      status,
      user,
      repositories,
      reposLoaded,
      links,
      refreshStatus,
      connectGithub,
      disconnectGithub,
      loadRepositories,
      linkRepository,
      unlinkRepository,
      getLinkedRepository,
      getLinkedProjectId,
    }),
    [status, user, repositories, reposLoaded, links, refreshStatus, connectGithub, disconnectGithub, loadRepositories, linkRepository, unlinkRepository, getLinkedRepository, getLinkedProjectId]
  )

  return <GitHubContext.Provider value={value}>{children}</GitHubContext.Provider>
}

export function useGitHub() {
  const ctx = useContext(GitHubContext)
  if (!ctx) throw new Error('useGitHub must be used within a GitHubProvider')
  return ctx
}
