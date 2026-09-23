import './Header.css'

export default function Header({ userName }) {
  const initial = userName?.charAt(0)?.toUpperCase() ?? '?'

  return (
    <header className="vita-header">
      <div className="container vita-header__inner">
        <div className="vita-header__brand">
          <span className="vita-header__logo">VITA</span>
          <span className="vita-header__subtitle">Developer Intelligence Assistant</span>
        </div>

        <div className="vita-header__user">
          <span className="vita-header__name">{userName}</span>
          <span className="vita-header__avatar" aria-hidden="true">{initial}</span>
        </div>
      </div>
    </header>
  )
}
