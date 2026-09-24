import { useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import VitaOrb from '../../components/VitaOrb/VitaOrb'
import { useSession } from '../../context/SessionContext'
import { getProjectById, mockProjects, mockUser } from '../../data/mockData'
import './Session.css'

function formatTime(totalSeconds) {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function Session() {
  const navigate = useNavigate()
  const { status, seconds, projectId, startSession, startBreak, endBreak, endSession } = useSession()
  const project = getProjectById(projectId) ?? getProjectById('elo')
  const currentTask = project.tasks.find((t) => !t.done)

  const orbState =
    status === 'running' ? 'working' : status === 'on-break' ? 'break' : status === 'break-suggested' ? 'working' : 'idle'

  return (
    <div className="session-page">
      <Header userName={mockUser.name} />

      <div className="container session-page__content">
        <h1 className="session-page__title">Sessão de trabalho</h1>

        <div className="session-page__card">
          <VitaOrb state={orbState} size={112} />

          {status === 'idle' && (
            <>
              <p className="session-page__empty">Nenhuma sessão ativa</p>
              <div className="session-page__project-picker">
                {mockProjects.map((p) => (
                  <button key={p.id} className="session-page__project-option" onClick={() => startSession(p.id)}>
                    Foco — {p.name}
                  </button>
                ))}
              </div>
            </>
          )}

          {status !== 'idle' && (
            <>
              <p className="session-page__label">Foco — {project.name}</p>
              <p className={`session-page__timer ${status === 'on-break' ? 'is-paused' : ''}`}>
                {formatTime(seconds)}
              </p>

              {currentTask && (
                <div className="session-page__task">
                  <span className="session-page__task-label">Tarefa atual</span>
                  <span className="session-page__task-value">{currentTask.label}</span>
                </div>
              )}

              {status === 'on-break' ? (
                <div className="session-page__actions">
                  <button className="session-page__button" onClick={endBreak}>Retomar sessão</button>
                  <button className="session-page__button session-page__button--ghost" onClick={endSession}>
                    Encerrar sessão
                  </button>
                </div>
              ) : (
                <div className="session-page__actions">
                  <button className="session-page__button session-page__button--ghost" onClick={endSession}>
                    Encerrar sessão
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {status === 'break-suggested' && (
          <div className="session-page__break-card">
            <p className="session-page__break-title">☕ Talvez seja hora de uma pausa</p>
            <p className="session-page__break-text">
              Você está trabalhando há bastante tempo. Que tal descansar por alguns minutos?
            </p>
            <button className="session-page__break-button" onClick={startBreak}>Iniciar pausa</button>
          </div>
        )}

        <button className="session-page__chat-link" onClick={() => navigate('/chat', { state: { projectId: project.id } })}>
          ✦ Conversar com VITA sobre esta sessão
        </button>
      </div>
    </div>
  )
}
