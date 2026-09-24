// Mock data standing in for the future GitHub -> Backend -> Supabase pipeline.
// Shape is intentionally close to what real records will look like, so
// swapping these for live fetches later should mostly be a drop-in change.

export const mockUser = {
  name: 'Eduardo',
}

export const mockProjects = [
  {
    id: 'elo',
    name: 'ELO',
    fullName: 'ELO — Rede de Conexão Alimentar',
    description: 'Rede de Conexão Alimentar para conectar restaurantes, usuários e instituições.',
    progress: 82,
    status: 'Quase completo',
    lastActivity: 'Há 2 horas',
    tasks: [
      { id: 'elo-1', label: 'Criar banco de dados', done: true },
      { id: 'elo-2', label: 'Criar autenticação', done: true },
      { id: 'elo-3', label: 'Criar página inicial', done: true },
      { id: 'elo-4', label: 'Criar perfil dos restaurantes', done: true },
      { id: 'elo-5', label: 'Criar sistema de cadastro', done: true },
      { id: 'elo-6', label: 'Criar estrutura principal', done: true },
      { id: 'elo-7', label: 'Finalizar perfil dos usuários', done: false },
      { id: 'elo-8', label: 'Revisar responsividade', done: false },
    ],
    recommendation: {
      title: 'O que fazer agora?',
      text: 'O projeto está próximo da conclusão. Recomendo finalizar o perfil dos usuários antes de começar uma nova funcionalidade.',
    },
  },
  {
    id: 'vita',
    name: 'VITA',
    fullName: 'VITA — Assistente de Produtividade',
    description: 'Assistente inteligente para produtividade de desenvolvedores.',
    progress: 45,
    status: 'Em desenvolvimento',
    lastActivity: 'Ontem',
    tasks: [
      { id: 'vita-1', label: 'Estruturar identidade visual', done: true },
      { id: 'vita-2', label: 'Construir animação de entrada', done: true },
      { id: 'vita-3', label: 'Construir dashboard', done: true },
      { id: 'vita-4', label: 'Construir navegação e páginas', done: false },
      { id: 'vita-5', label: 'Integração com GitHub', done: false },
      { id: 'vita-6', label: 'Integração com Gemini', done: false },
    ],
    recommendation: {
      title: 'O que fazer agora?',
      text: 'A navegação principal já está de pé. O próximo passo natural é preparar a camada de serviço da IA para a futura integração com o Gemini.',
    },
  },
  {
    id: 'porta-certa',
    name: 'Porta Certa',
    fullName: 'Porta Certa',
    description: 'Plataforma para ajudar pessoas a encontrarem o caminho certo entre oportunidades.',
    progress: 64,
    status: 'Em andamento',
    lastActivity: 'Há 3 dias',
    tasks: [
      { id: 'pc-1', label: 'Definir arquitetura de dados', done: true },
      { id: 'pc-2', label: 'Criar telas principais', done: true },
      { id: 'pc-3', label: 'Implementar busca', done: true },
      { id: 'pc-4', label: 'Escrever testes', done: false },
      { id: 'pc-5', label: 'Revisão final', done: false },
    ],
    recommendation: {
      title: 'O que fazer agora?',
      text: 'A base do produto está sólida. Escrever os testes agora evita retrabalho antes da revisão final.',
    },
  },
]

export function getProjectById(id) {
  return mockProjects.find((p) => p.id === id)
}

export function getTaskCounts(project) {
  const total = project.tasks.length
  const done = project.tasks.filter((t) => t.done).length
  return { total, done, pending: total - done }
}

// Quick-suggestion prompts shown when the chat page opens with no history.
export const chatSuggestions = [
  'O que devo fazer agora?',
  'Como está meu projeto ELO?',
  'Quais tarefas estão atrasadas?',
  'Quero começar uma sessão',
  'Preciso de uma pausa',
]
