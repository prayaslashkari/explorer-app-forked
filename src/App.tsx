import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { MainContent } from './components/Layout/MainContent';
import { Dashboard } from './components/Dashboard/Dashboard';
import { useQueryStore } from './store/queryStore';
import './App.css';

function App() {
  const currentView = useQueryStore((s) => s.currentView);

  return (
    <div className="app">
      <Header />
      {currentView === 'dashboard' ? (
        <Dashboard />
      ) : (
        <div className="app-body">
          <Sidebar />
          <MainContent />
        </div>
      )}
    </div>
  );
}

export default App;
