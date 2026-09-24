import { Link } from 'react-router-dom'
import VitaOrb from '../VitaOrb/VitaOrb'
import { useSession } from '../../context/SessionContext'
import { getProjectById } from '../../data/mockData'
import './WorkSession.css'

function formatTime(totalSeconds) {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function WorkSession({ defaultProjectId }) {
  const { status, seconds, projectId, startSession, startBreak } = useSession()
  const project = getProjectById(projectId ?? defaultProjectId)

  const orbState =
    status === 'running' ? 'working' : status === 'on-break' ? 'break' : status === 'break-suggested' ? 'working' : 'idle'

  return (
    <section className="work-session">
      <div className="work-session__header">
        <h2 className="work-session__title">Sessão atual</h2>
        <Link to="/session" className="work-session__link">Ver sessão →</Link>
      </div>

      <div className="work-session__body">
        <VitaOrb state={orbState} size={64} />

        <div className="work-session__info">
          {status === 'idle' && (
            <>
              <p className="work-session__empty">Nenhuma sessão ativa</p>
              <button className="work-session__button" onClick={() => startSession(defaultProjectId)}>
                Começar sessão
              </button>
            </>
          )}

          {(status === 'running' || status === 'break-suggested') && (
            <>
              <p className="work-session__timer">{formatTime(seconds)}</p>
              <p className="work-session__project">Projeto: {project?.name}</p>
            </>
          )}

          {status === 'on-break' && (
            <>
              <p className="work-session__timer work-session__timer--paused">{formatTime(seconds)}</p>
              <p className="work-session__project">Pausa em andamento</p>
            </>
          )}
        </div>
      </div>

      {status === 'break-suggested' && (
        <div className="work-session__break-card">
          <p className="work-session__break-title">☕ Hora de respirar</p>
          <p className="work-session__break-text">
            Você está trabalhando há bastante tempo. Que tal fazer uma pausa de 10 minutos?
          </p>
          <button className="work-session__break-button" onClick={startBreak}>
            Iniciar pausa
          </button>
        </div>
      )}
    </section>
  )
}
