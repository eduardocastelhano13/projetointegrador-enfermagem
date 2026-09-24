// aiService — single entry point the UI talks to for anything AI-related.
//
// Today this returns mocked responses. In the future, `sendMessage` should
// call our own backend, which in turn calls the Gemini API:
//
//   Frontend  →  Backend / API  →  Gemini API  →  VITA
//
// The GEMINI_API_KEY must NEVER live in this file, in any other frontend
// file, or in a public env var (VITE_*): it belongs only on the backend.
// Swapping the mock for the real thing should only mean changing the body
// of `sendMessage` to a fetch() against our backend endpoint, e.g.:
//
//   export async function sendMessage(message, context) {
//     const res = await fetch('/api/vita/chat', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ message, context }),
//     })
//     if (!res.ok) throw new Error('VITA não conseguiu responder agora.')
//     return res.json() // { reply: string }
//   }

import { getProjectById } from '../../data/mockData'

const MOCK_LATENCY_MS = 650

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function mockResponse(message, context) {
  const text = message.toLowerCase()
  const project = context?.projectId ? getProjectById(context.projectId) : null

  if (text.includes('o que devo fazer') || text.includes('o que fazer')) {
    if (project) {
      const pending = project.tasks.find((t) => !t.done)
      return pending
        ? `O ${project.name} está com ${project.progress}% de progresso. Eu começaria por "${pending.label}".`
        : `O ${project.name} está com todas as tarefas concluídas. Bom momento para revisar o que já foi feito.`
    }
    return 'O ELO está quase completo. Eu começaria pelo perfil dos usuários. Depois disso, faria uma revisão de responsividade e os testes finais. Se quiser, posso organizar essas tarefas em uma sequência para você.'
  }

  if (text.includes('elo')) {
    const elo = getProjectById('elo')
    const pending = elo.tasks.filter((t) => !t.done).length
    return `O ELO está com ${elo.progress}% de progresso e possui ${pending} tarefas pendentes. Está bem perto da reta final.`
  }

  if (text.includes('atrasad')) {
    return 'Nenhuma tarefa está marcada como atrasada no momento — mas o ELO tem duas pendências que valem a pena fechar essa semana.'
  }

  if (text.includes('sessão') || text.includes('sessao') || text.includes('foco')) {
    return 'Posso começar uma sessão de foco agora. Quer que eu use o ELO como projeto da sessão?'
  }

  if (text.includes('pausa') || text.includes('descans')) {
    return 'Faz sentido. Uma pausa curta agora ajuda a manter o foco depois. Que tal 10 minutos?'
  }

  return 'Entendi. Me conta um pouco mais sobre o que você precisa e eu vejo como te ajudar.'
}

export async function sendMessage(message, context = {}) {
  await delay(MOCK_LATENCY_MS)
  return { reply: mockResponse(message, context) }
}

export function getOpeningMessage(context = {}) {
  if (context.intent === 'continue-project' && context.projectId) {
    const project = getProjectById(context.projectId)
    return `Eduardo, vi que você estava trabalhando no ${project?.name ?? context.projectId}. Quer continuar de onde paramos?`
  }

  const elo = getProjectById('elo')
  const pending = elo.tasks.filter((t) => !t.done).length
  return `Boa noite, Eduardo. Dei uma olhada nos seus projetos. O ELO está com ${elo.progress}% de progresso e possui ${pending} tarefas pendentes. Se quiser, posso te ajudar a decidir o que fazer agora.`
}
