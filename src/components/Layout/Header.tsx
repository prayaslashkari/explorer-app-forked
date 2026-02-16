import { useQueryStore } from '../../store/queryStore';
import logo from '../../assets/sawgraph-explorer-logo.svg';

export function Header() {
  const { currentView, goToDashboard } = useQueryStore();

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="header-logo" onClick={goToDashboard}>
          <img src={logo} alt="Sawgraph Explorer" width="28" height="28" />
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
