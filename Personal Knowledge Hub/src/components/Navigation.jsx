import { useNavigate, Link } from "react-router-dom"

export default function Navigation() {
  const navigate = useNavigate();

  return (
    <nav className="app-nav" aria-label="Primary">
      <div className="app-nav__brand">
        <span className="app-nav__logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
            <path d="M6 3.5h9l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 19V5A1.5 1.5 0 0 1 6.5 3.5Z" />
            <path d="M14.5 3.5V8H19" />
          </svg>
        </span>
        <span className="app-nav__brand-name">Knowledge Hub</span>
      </div>

      <ul className="app-nav__list">
        <li className="app-nav__item">
          <button className="app-nav__button" onClick={() => navigate('/')}>
            <svg className="app-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 5.5h16a1 1 0 0 1 1 1V15a1 1 0 0 1-1 1H9l-4 3.5V16H4a1 1 0 0 1-1-1V6.5a1 1 0 0 1 1-1Z" />
            </svg>
            <span className="app-nav__label">Go to Chat</span>
          </button>
        </li>

        <li className="app-nav__item">
          <button className="app-nav__button" onClick={() => navigate('/KnowledgeBase')}>
            <svg className="app-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h4l1.5 2h7A1.5 1.5 0 0 1 19.5 8.5v9A1.5 1.5 0 0 1 18 19H5.5A1.5 1.5 0 0 1 4 17.5v-11Z" />
            </svg>
            <span className="app-nav__label">Go to Knowledge Base</span>
          </button>
        </li>

        <li className="app-nav__item">
          <button className="app-nav__button" onClick={() => navigate('/settings')}>
            <svg className="app-nav__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
              <line x1="4" y1="6" x2="20" y2="6" />
              <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
              <line x1="4" y1="18" x2="20" y2="18" />
              <circle cx="11" cy="18" r="2" fill="currentColor" stroke="none" />
            </svg>
            <span className="app-nav__label">Go to Settings</span>
          </button>
        </li>
      </ul>
    </nav>
  )
}