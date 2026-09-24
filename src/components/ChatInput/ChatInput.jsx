import { useState } from 'react'
import './ChatInput.css'

export default function ChatInput({ onSend, disabled, projectName, onChangeProject }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      {projectName && (
        <button type="button" className="chat-input__project" onClick={onChangeProject}>
          Projeto: {projectName}
        </button>
      )}
      <div className="chat-input__row">
        <textarea
          className="chat-input__field"
          placeholder="Pergunte alguma coisa ao VITA..."
          value={value}
          rows={1}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              handleSubmit(e)
            }
          }}
        />
        <button type="submit" className="chat-input__send" disabled={disabled || !value.trim()} aria-label="Enviar mensagem">
          ↑
        </button>
      </div>
    </form>
  )
}
