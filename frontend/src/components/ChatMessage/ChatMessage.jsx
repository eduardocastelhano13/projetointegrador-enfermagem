import VitaOrb from '../VitaOrb/VitaOrb'
import './ChatMessage.css'

export default function ChatMessage({ from, text }) {
  const isVita = from === 'vita'

  return (
    <div className={`chat-message ${isVita ? 'chat-message--vita' : 'chat-message--user'}`}>
      {isVita && (
        <div className="chat-message__avatar">
          <VitaOrb state="idle" size={26} />
        </div>
      )}
      <div className="chat-message__bubble">
        {isVita && <span className="chat-message__author">VITA</span>}
        <p className="chat-message__text">{text}</p>
      </div>
    </div>
  )
}
