import { Header } from './components/Layout/Header';
import { AnalysisQuestionBar } from './components/Layout/AnalysisQuestionBar';
import { MainContent } from './components/Layout/MainContent';
import { EditModal } from './components/QueryEditor/EditModal';
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
        <>
          <AnalysisQuestionBar />
          <MainContent />
          <EditModal />
        </>
      )}
    </div>
  );
}

export default App;
