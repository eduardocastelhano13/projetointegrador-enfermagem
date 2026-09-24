import { useState } from 'react'
import { mockProjects } from '../../data/mockData'
import './RepositoryCard.css'

function formatUpdatedAt(iso) {
  const date = new Date(iso)
  const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
  if (days <= 0) return 'Atualizado hoje'
  if (days === 1) return 'Atualizado ontem'
  if (days < 7) return `Atualizado há ${days} dias`
  return `Atualizado em ${date.toLocaleDateString('pt-BR')}`
}

// mode "browse": normal listing, "Adicionar ao VITA" opens an inline project picker.
// mode "link": used when arriving from a project's "Conectar repositório" — a single
// "Selecionar" button links straight to targetProjectId.
export default function RepositoryCard({ repo, mode = 'browse', targetProjectId, linkedProjectName, onLink }) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <article className="repo-card">
      <div className="repo-card__top">
        <h3 className="repo-card__name">{repo.name}</h3>
        <span className={`repo-card__visibility repo-card__visibility--${repo.visibility}`}>
          {repo.visibility === 'private' ? 'Privado' : 'Público'}
        </span>
      </div>

      {repo.description && <p className="repo-card__description">{repo.description}</p>}

      <div className="repo-card__meta">
        {repo.language && <span className="repo-card__language">{repo.language}</span>}
        <span>{formatUpdatedAt(repo.updatedAt)}</span>
        {typeof repo.stars === 'number' && <span>★ {repo.stars}</span>}
      </div>

      <div className="repo-card__footer">
        <a className="repo-card__ghlink" href={repo.url} target="_blank" rel="noreferrer">
          Ver no GitHub →
        </a>

        {linkedProjectName ? (
          <span className="repo-card__linked">Vinculado a {linkedProjectName}</span>
        ) : mode === 'link' ? (
          <button className="repo-card__add" onClick={() => onLink(repo, targetProjectId)}>
            Selecionar
          </button>
        ) : (
          <div className="repo-card__picker-wrap">
            <button className="repo-card__add" onClick={() => setPickerOpen((v) => !v)}>
              Adicionar ao VITA
            </button>
            {pickerOpen && (
              <div className="repo-card__picker">
                <p className="repo-card__picker-label">Vincular a qual projeto?</p>
                {mockProjects.map((p) => (
                  <button
                    key={p.id}
                    className="repo-card__picker-option"
                    onClick={() => {
                      onLink(repo, p.id)
                      setPickerOpen(false)
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
