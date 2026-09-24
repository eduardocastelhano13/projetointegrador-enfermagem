import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Header from '../../components/Header/Header'
import AIStatus from '../../components/AIStatus/AIStatus'
import ChatMessage from '../../components/ChatMessage/ChatMessage'
import ChatInput from '../../components/ChatInput/ChatInput'
import { sendMessage, getOpeningMessage } from '../../services/aiService/aiService'
import { getProjectById, mockUser, chatSuggestions } from '../../data/mockData'
import './Chat.css'

let idCounter = 0
function nextId() {
  idCounter += 1
  return `msg-${idCounter}`
}

export default function Chat() {
  const location = useLocation()
  const navigate = useNavigate()
  const navState = location.state ?? {}

  const [projectId, setProjectId] = useState(navState.projectId ?? 'elo')
  const [messages, setMessages] = useState(() => [
    { id: nextId(), from: 'vita', text: getOpeningMessage(navState) },
  ])
  const [thinking, setThinking] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, thinking])

  async function handleSend(text) {
    setMessages((prev) => [...prev, { id: nextId(), from: 'user', text }])
    setThinking(true)
    try {
      const { reply } = await sendMessage(text, { projectId })
      setMessages((prev) => [...prev, { id: nextId(), from: 'vita', text: reply }])
    } finally {
      setThinking(false)
    }
  }

  const project = getProjectById(projectId)

  return (
    <div className="chat-page">
      <Header userName={mockUser.name} />

      <div className="container chat-page__content">
        <AIStatus state={thinking ? 'analyzing' : 'idle'} />

        <div className="chat-page__thread">
          {messages.map((m) => (
            <ChatMessage key={m.id} from={m.from} text={m.text} />
          ))}
          {thinking && (
            <ChatMessage from="vita" text="…" />
          )}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div className="chat-page__suggestions">
            {chatSuggestions.map((s) => (
              <button key={s} className="chat-page__suggestion" onClick={() => handleSend(s)}>
                {s}
              </button>
            ))}
          </div>
        )}

        <ChatInput
          onSend={handleSend}
          disabled={thinking}
          projectName={project?.name}
          onChangeProject={() => navigate('/projects')}
        />
      </div>
    </div>
  )
}
