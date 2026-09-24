// Mock GitHub data used while Fase 1 (simulated connection) is active, i.e.
// whenever VITE_GITHUB_API_URL is not set. Shape mirrors what the real
// GitHub REST API returns (trimmed to the fields the UI actually uses), so
// swapping this for live data later should not require touching components.

export const githubMockUser = {
  username: 'EduardoCastelhano',
  name: 'Eduardo Castelhano',
  avatarUrl: 'https://avatars.githubusercontent.com/u/9919?v=4',
  profileUrl: 'https://github.com/EduardoCastelhano',
}

export const githubMockRepositories = [
  {
    id: 'repo-elo',
    owner: 'EduardoCastelhano',
    name: 'ELO',
    fullName: 'EduardoCastelhano/ELO',
    description: 'Rede de Conexão Alimentar para conectar restaurantes, usuários e instituições.',
    language: 'JavaScript',
    visibility: 'private',
    updatedAt: '2026-09-21T14:32:00Z',
    stars: 3,
    url: 'https://github.com/EduardoCastelhano/ELO',
  },
  {
    id: 'repo-vita',
    owner: 'EduardoCastelhano',
    name: 'VITA',
    fullName: 'EduardoCastelhano/VITA',
    description: 'Developer Intelligence Assistant.',
    language: 'JavaScript',
    visibility: 'private',
    updatedAt: '2026-09-23T09:10:00Z',
    stars: 5,
    url: 'https://github.com/EduardoCastelhano/VITA',
  },
  {
    id: 'repo-porta-certa',
    owner: 'EduardoCastelhano',
    name: 'porta-certa',
    fullName: 'EduardoCastelhano/porta-certa',
    description: 'Plataforma para ajudar pessoas a encontrarem o caminho certo entre oportunidades.',
    language: 'TypeScript',
    visibility: 'private',
    updatedAt: '2026-09-19T18:05:00Z',
    stars: 1,
    url: 'https://github.com/EduardoCastelhano/porta-certa',
  },
  {
    id: 'repo-portfolio',
    owner: 'EduardoCastelhano',
    name: 'portfolio',
    fullName: 'EduardoCastelhano/portfolio',
    description: 'Site pessoal.',
    language: 'HTML',
    visibility: 'public',
    updatedAt: '2026-08-02T11:00:00Z',
    stars: 2,
    url: 'https://github.com/EduardoCastelhano/portfolio',
  },
  {
    id: 'repo-scripts',
    owner: 'EduardoCastelhano',
    name: 'scripts-util',
    fullName: 'EduardoCastelhano/scripts-util',
    description: 'Pequenos scripts e automações do dia a dia.',
    language: 'Python',
    visibility: 'public',
    updatedAt: '2026-07-14T08:45:00Z',
    stars: 0,
    url: 'https://github.com/EduardoCastelhano/scripts-util',
  },
]
