import { useEffect, useRef, useState } from 'react'
import VitaOrb from '../VitaOrb/VitaOrb'
import './WelcomeSequence.css'

const ANALYSIS_STEPS = [
  'Projetos identificados',
  'Tarefas analisadas',
  'Progresso atualizado',
  'Sessão de trabalho preparada',
]

// phase timeline, in ms, each entry is when that phase STARTS
const TIMING = {
  orbIn: 300,
  welcome: 1000,
  subline: 2500,
  analyzing: 4200,
  stepInterval: 550,
  stepsStartDelay: 900, // after "Analisando..." appears
  exit: 800, // pause after last step before exiting
}

export default function WelcomeSequence({ userName, onFinish }) {
  const [phase, setPhase] = useState('orb') // orb -> welcome -> subline -> analyzing -> exiting
  const [visibleSteps, setVisibleSteps] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const timers = useRef([])

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      // Skip straight to the dashboard reveal, still giving a brief, calm pause.
      const t = setTimeout(() => finish(), 500)
      return () => clearTimeout(t)
    }

    const add = (fn, delay) => timers.current.push(setTimeout(fn, delay))

    add(() => setPhase('welcome'), TIMING.welcome)
    add(() => setPhase('subline'), TIMING.subline)
    add(() => setPhase('analyzing'), TIMING.analyzing)

    const stepsStart = TIMING.analyzing + TIMING.stepsStartDelay
    ANALYSIS_STEPS.forEach((_, i) => {
      add(() => setVisibleSteps((v) => Math.max(v, i + 1)), stepsStart + i * TIMING.stepInterval)
    })

    const allStepsDone = stepsStart + ANALYSIS_STEPS.length * TIMING.stepInterval
    add(() => setPhase('done'), allStepsDone)
    add(() => beginExit(), allStepsDone + TIMING.exit)

    return () => timers.current.forEach(clearTimeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function beginExit() {
    setLeaving(true)
    setTimeout(onFinish, 700)
  }

  function finish() {
    setLeaving(true)
    setTimeout(onFinish, 200)
  }

  const orbState = phase === 'analyzing' || phase === 'done' ? 'analyzing' : 'idle'

  return (
    <div className={`welcome ${leaving ? 'welcome--leaving' : ''}`} aria-live="polite">
      <div className="welcome__content">
        <VitaOrb state={phase === 'done' ? 'done' : orbState} size={104} />

        <div className="welcome__text">
          <p className={`welcome__line welcome__line--1 ${phase !== 'orb' ? 'is-visible' : ''}`}>
            Bem-vindo, {userName}.
          </p>
          <p
            className={`welcome__line welcome__line--2 ${
              ['subline', 'analyzing', 'done'].includes(phase) ? 'is-visible' : ''
            }`}
          >
            Vamos ver o que temos para hoje.
          </p>
        </div>

        <div className={`welcome__analysis ${['analyzing', 'done'].includes(phase) ? 'is-visible' : ''}`}>
          <p className="welcome__analysis-label">Analisando seus projetos…</p>
          <ul className="welcome__steps">
            {ANALYSIS_STEPS.map((step, i) => (
              <li key={step} className={`welcome__step ${i < visibleSteps ? 'is-visible' : ''}`}>
                <span className="welcome__step-check" aria-hidden="true">✓</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
