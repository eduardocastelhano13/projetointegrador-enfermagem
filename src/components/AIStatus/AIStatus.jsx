import VitaOrb from '../VitaOrb/VitaOrb'
import './AIStatus.css'

const LABELS = {
  idle: 'VITA · pronto',
  analyzing: 'VITA · pensando',
  working: 'VITA · ativo',
  break: 'VITA · em pausa',
}

export default function AIStatus({ state = 'idle', title = 'VITA', subtitle = 'Seu assistente de desenvolvimento' }) {
  return (
    <div className="ai-status">
      <VitaOrb state={state} size={40} />
      <div className="ai-status__text">
        <span className="ai-status__title">{title}</span>
        <span className="ai-status__subtitle">
          {state === 'analyzing' ? LABELS.analyzing : subtitle}
        </span>
      </div>
    </div>
  )
}
