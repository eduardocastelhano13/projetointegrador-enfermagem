import { useEffect, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import Header from '../../components/Header/Header'
import RepositoryCard from '../../components/RepositoryCard/RepositoryCard'
import { useGitHub } from '../../context/GitHubContext'
import { getProjectById, mockUser } from '../../data/mockData'
import './Repositories.css'

export default function Repositories() {
  const location = useLocation()
  const navigate = useNavigate()
  const linkProjectId = location.state?.linkProjectId ?? null
  const linkProject = linkProjectId ? getProjectById(linkProjectId) : null

  const { status, repositories, reposLoaded, loadRepositories, linkRepository, getLinkedProjectId } = useGitHub()
  const [loading, setLoading] = useState(!reposLoaded)

  useEffect(() => {
    if (status === 'connected' && !reposLoaded) {
      loadRepositories().finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  function handleLink(repo, projectId) {
    linkRepository(projectId, repo)
    if (linkProjectId) {
      navigate(`/projects/${projectId}`)
    }
  }

  if (status !== 'connected') {
    return (
      <div className="repos-page">
        <Header userName={mockUser.name} />
        <div className="container repos-page__content">
          <p className="repos-page__empty">Conecte sua conta do GitHub para ver seus repositórios.</p>
          <Link to="/settings" className="repos-page__settings-link">Ir para Configurações →</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="repos-page">
      <Header userName={mockUser.name} />

      <div className="container repos-page__content">
        <div className="repos-page__intro">
          <h1 className="repos-page__title">Meus repositórios</h1>
          <p className="repos-page__subtitle">
            {linkProject
              ? `Selecione o repositório para vincular ao projeto ${linkProject.name}.`
              : 'Repositórios da sua conta GitHub, prontos para vincular a um projeto do VITA.'}
          </p>
        </div>

        {loading && <p className="repos-page__loading">Carregando repositórios…</p>}

        {!loading && (
          <div className="repos-page__grid">
            {repositories.map((repo) => {
              const linkedProjectId = getLinkedProjectId(repo.id)
              const linkedProjectName = linkedProjectId ? getProjectById(linkedProjectId)?.name : null
              return (
                <RepositoryCard
                  key={repo.id}
                  repo={repo}
                  mode={linkProjectId ? 'link' : 'browse'}
                  targetProjectId={linkProjectId}
                  linkedProjectName={linkedProjectName}
                  onLink={handleLink}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
