import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import Header from '../../components/Header/Header'
import GitHubConnectCard from '../../components/GitHubConnectCard/GitHubConnectCard'
import { useGitHub } from '../../context/GitHubContext'
import { mockUser } from '../../data/mockData'
import './Settings.css'

const OTHER_SECTIONS = [
  {
    title: 'Conta',
    items: [
      { label: 'Nome', value: mockUser.name },
      { label: 'E-mail', value: 'eduardo@exemplo.com' },
    ],
  },
  {
    title: 'Outras integrações',
    items: [
      { label: 'Supabase', value: 'Não conectado' },
      { label: 'Gemini (IA)', value: 'Modo mock' },
    ],
  },
  {
    title: 'Sessão de trabalho',
    items: [
      { label: 'Duração até sugerir pausa', value: '25 minutos' },
      { label: 'Duração da pausa sugerida', value: '10 minutos' },
    ],
  },
]

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { refreshStatus } = useGitHub()
  const githubParam = searchParams.get('github')

  useEffect(() => {
    if (githubParam) {
      refreshStatus()
      const next = new URLSearchParams(searchParams)
      next.delete('github')
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [githubParam])

  return (
    <div className="settings-page">
      <Header userName={mockUser.name} />

      <div className="container settings-page__content">
        <h1 className="settings-page__title">Configurações</h1>
        <p className="settings-page__subtitle">
          Estas opções ainda são estáticas — nesta etapa não há persistência real, exceto a conexão com o GitHub.
        </p>

        {githubParam === 'error' && (
          <p className="settings-page__banner settings-page__banner--error">
            Não foi possível concluir a conexão com o GitHub. Tente novamente.
          </p>
        )}

        <section className="settings-page__section">
          <h2 className="settings-page__section-title">Integrações</h2>
          <GitHubConnectCard />
        </section>

        {OTHER_SECTIONS.map((section) => (
          <section key={section.title} className="settings-page__section">
            <h2 className="settings-page__section-title">{section.title}</h2>
            <div className="settings-page__list">
              {section.items.map((item) => (
                <div key={item.label} className="settings-page__row">
                  <span className="settings-page__row-label">{item.label}</span>
                  <span className="settings-page__row-value">{item.value}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
