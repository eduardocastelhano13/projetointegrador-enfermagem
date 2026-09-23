import './VitaOrb.css'

/**
 * VitaOrb — the abstract intelligence core.
 * states: 'idle' | 'analyzing' | 'working' | 'break' | 'done'
 */
export default function VitaOrb({ state = 'idle', size = 96 }) {
  return (
    <div
      className={`vita-orb vita-orb--${state}`}
      style={{ '--orb-size': `${size}px` }}
      role="img"
      aria-label={`Núcleo do VITA, estado: ${state}`}
    >
      <div className="vita-orb__halo" />
      <div className="vita-orb__core">
        <div className="vita-orb__glow" />
      </div>
    </div>
  )
}
