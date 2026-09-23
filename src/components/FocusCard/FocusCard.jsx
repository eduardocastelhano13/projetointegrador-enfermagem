import { useEffect, useRef, useState } from 'react'
import './FocusCard.css'

export default function FocusCard({ project, onStartSession, revealed }) {
  const [displayProgress, setDisplayProgress] = useState(0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (!revealed) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setDisplayProgress(project.progress)
      return
    }

    const duration = 1100
    const start = performance.now()
    const from = 0
    const to = project.progress

    function tick(now) {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplayProgress(Math.round(from + (to - from) * eased))
      if (t < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [revealed, project.progress])

  return (
    <section className={`focus-card ${revealed ? 'is-revealed' : ''}`}>
      <p className="focus-card__eyebrow">Seu foco agora</p>

      <div className="focus-card__top">
        <h2 className="focus-card__title">{project.name}</h2>
        <span className="focus-card__percent">{displayProgress}%</span>
      </div>

      <div className="focus-card__bar-track" role="progressbar" aria-valuenow={project.progress} aria-valuemin={0} aria-valuemax={100}>
        <div
          className="focus-card__bar-fill"
          style={{ width: `${revealed ? displayProgress : 0}%` }}
        />
      </div>

      <p className="focus-card__note">{project.statusNote}</p>

      <div className="focus-card__next">
        <p className="focus-card__next-label">Próxima tarefa</p>
        <p className="focus-card__next-title">{project.nextTask.title}</p>
        <p className="focus-card__next-desc">{project.nextTask.note}</p>
      </div>

      <button className="focus-card__cta" onClick={onStartSession}>
        <span className="focus-card__cta-icon" aria-hidden="true">▶</span>
        Começar sessão
      </button>
    </section>
  )
}
