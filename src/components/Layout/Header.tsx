import { useQueryStore } from '../../store/queryStore';

export function Header() {
  const { currentView, goToDashboard } = useQueryStore();

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="header-logo" onClick={goToDashboard}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 12l2-2 2 2 4-4" />
          </svg>
          <span className="header-title">Sawgraph Explorer</span>
        </button>
        {currentView === 'editor' && (
          <button className="header-back" onClick={goToDashboard}>
            &larr; Dashboard
          </button>
        )}
      </div>
    </header>
  );
}
