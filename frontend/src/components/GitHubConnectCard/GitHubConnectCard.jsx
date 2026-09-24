import { useNavigate } from 'react-router-dom'
import VitaOrb from '../VitaOrb/VitaOrb'
import { useGitHub } from '../../context/GitHubContext'
import './GitHubConnectCard.css'

export default function GitHubConnectCard() {
  const { status, user, repositories, reposLoaded, connectGithub, disconnectGithub, loadRepositories } = useGitHub()
  const navigate = useNavigate()

  async function handleConnect() {
    await connectGithub()
  }

  async function handleViewRepos() {
    if (!reposLoaded) await loadRepositories()
    navigate('/repositories')
  }

  return (
    <div className="github-card">
      <div className="github-card__header">
        <span className="github-card__icon" aria-hidden="true">⌥</span>
        <div>
          <p className="github-card__title">GitHub</p>
          {status === 'disconnected' && (
            <p className="github-card__subtitle">Conecte seus repositórios ao VITA para acompanhar seu desenvolvimento.</p>
          )}
        </div>
      </div>

      {status === 'checking' && (
        <p className="github-card__status">Verificando conexão…</p>
      )}

      {status === 'disconnected' && (
        <button className="github-card__button" onClick={handleConnect}>
          Conectar GitHub
        </button>
      )}

      {status === 'connecting' && (
        <div className="github-card__connecting">
          <VitaOrb state="analyzing" size={36} />
          <p className="github-card__status">Conectando ao GitHub…</p>
        </div>
      )}

      {status === 'connected' && user && (
        <div className="github-card__connected">
          <img className="github-card__avatar" src={user.avatarUrl} alt="" />
          <div className="github-card__connected-info">
            <p className="github-card__connected-name">GitHub conectado</p>
            <p className="github-card__connected-user">@{user.username}</p>
            <p className="github-card__connected-count">
              {reposLoaded ? `${repositories.length} repositórios` : 'Repositórios disponíveis'}
            </p>
          </div>
          <div className="github-card__connected-actions">
            <button className="github-card__button github-card__button--ghost" onClick={handleViewRepos}>
              Ver repositórios
            </button>
            <button className="github-card__link" onClick={disconnectGithub}>
              Gerenciar conexão
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="github-card__error">
          <p className="github-card__status">Não foi possível conectar ao GitHub.</p>
          <button className="github-card__button" onClick={handleConnect}>Tentar novamente</button>
        </div>
      )}
    </div>
  )
}
