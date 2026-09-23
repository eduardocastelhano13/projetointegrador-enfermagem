import { useEffect, useRef, useState } from 'react'
import VitaOrb from '../VitaOrb/VitaOrb'
import './WorkSession.css'

// After this many seconds of continuous work, VITA suggests a break.
// Tune down to something like 15 for a quick local demo.
const BREAK_THRESHOLD_SECONDS = 25 * 60

function formatTime(totalSeconds) {
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function WorkSession({ projectName }) {
  const [status, setStatus] = useState('idle') // idle | running | break-suggested | on-break
  const [seconds, setSeconds] = useState(0)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => {
          const next = s + 1
          if (next >= BREAK_THRESHOLD_SECONDS) {
            setStatus('break-suggested')
          }
          return next
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [status])

  function startSession() {
    setSeconds(0)
    setStatus('running')
  }

  function startBreak() {
    clearInterval(intervalRef.current)
    setStatus('on-break')
  }

  const orbState =
    status === 'running' ? 'working' : status === 'on-break' ? 'break' : status === 'break-suggested' ? 'working' : 'idle'

  return (
    <section className="work-session">
      <h2 className="work-session__title">Sessão atual</h2>

      <div className="work-session__body">
        <VitaOrb state={orbState} size={64} />

        <div className="work-session__info">
          {status === 'idle' && (
            <>
              <p className="work-session__empty">Nenhuma sessão ativa</p>
              <button className="work-session__button" onClick={startSession}>
                Começar sessão
              </button>
            </>
          )}

          {(status === 'running' || status === 'break-suggested') && (
            <>
              <p className="work-session__timer">{formatTime(seconds)}</p>
              <p className="work-session__project">Projeto: {projectName}</p>
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
