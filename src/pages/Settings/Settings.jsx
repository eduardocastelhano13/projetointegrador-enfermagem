import Header from '../../components/Header/Header'
import { mockUser } from '../../data/mockData'
import './Settings.css'

const SECTIONS = [
  {
    title: 'Conta',
    items: [
      { label: 'Nome', value: mockUser.name },
      { label: 'E-mail', value: 'eduardo@exemplo.com' },
    ],
  },
  {
    title: 'Integrações',
    items: [
      { label: 'GitHub', value: 'Não conectado' },
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
  return (
    <div className="settings-page">
      <Header userName={mockUser.name} />

      <div className="container settings-page__content">
        <h1 className="settings-page__title">Configurações</h1>
        <p className="settings-page__subtitle">
          Estas opções ainda são estáticas — nesta etapa não há persistência real.
        </p>

        {SECTIONS.map((section) => (
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
