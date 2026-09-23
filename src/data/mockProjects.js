// Mock data standing in for the future GitHub -> Backend -> Supabase pipeline.
// Shape is intentionally close to what a real "project" record will look like,
// so swapping this file for a live fetch later is a drop-in change.

export const mockUser = {
  name: 'Eduardo',
}

export const mockFocusProject = {
  id: 'elo',
  name: 'ELO — Rede de Conexão Alimentar',
  progress: 82,
  status: 'Quase completo',
  statusNote: 'O ELO está quase completo.',
  nextTask: {
    title: 'Finalizar perfil dos usuários',
    note: 'Essa é uma das principais pendências antes da revisão final do projeto.',
  },
}

export const mockProjects = [
  {
    id: 'elo',
    name: 'ELO',
    progress: 82,
    status: 'Quase completo',
    nextTask: 'Perfil dos usuários',
  },
  {
    id: 'vita',
    name: 'VITA',
    progress: 45,
    status: 'Em desenvolvimento',
    nextTask: 'Integração com GitHub',
  },
  {
    id: 'porta-certa',
    name: 'Porta Certa',
    progress: 64,
    status: 'Em andamento',
    nextTask: 'Testes',
  },
]
