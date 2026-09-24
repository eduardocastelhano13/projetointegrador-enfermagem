import { NavLink } from 'react-router-dom'
import './Sidebar.css'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '⌂', end: true },
  { to: '/projects', label: 'Projetos', icon: '▣' },
  { to: '/chat', label: 'Conversar com VITA', shortLabel: 'VITA', icon: '✦' },
  { to: '/session', label: 'Sessão', icon: '◷' },
]

export default function Sidebar() {
  return (
    <>
      <nav className="sidebar" aria-label="Navegação principal">
        <div className="sidebar__brand">
          <span className="sidebar__logo">VITA</span>
        </div>

        <ul className="sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`}
              >
                <span className="sidebar__icon" aria-hidden="true">{item.icon}</span>
                <span className="sidebar__label">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="sidebar__footer">
          <NavLink
            to="/settings"
            className={({ isActive }) => `sidebar__link ${isActive ? 'is-active' : ''}`}
          >
            <span className="sidebar__icon" aria-hidden="true">⚙</span>
            <span className="sidebar__label">Configurações</span>
          </NavLink>
        </div>
      </nav>

      <nav className="mobile-nav" aria-label="Navegação principal">
        {[...NAV_ITEMS, { to: '/settings', label: 'Ajustes', shortLabel: 'Ajustes', icon: '⚙' }].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `mobile-nav__link ${isActive ? 'is-active' : ''}`}
          >
            <span className="mobile-nav__icon" aria-hidden="true">{item.icon}</span>
            <span className="mobile-nav__label">{item.shortLabel ?? item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
