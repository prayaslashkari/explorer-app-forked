import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { MainContent } from './components/Layout/MainContent';
import './App.css';

function App() {
  return (
    <div className="app">
      <Header />
      <div className="app-body">
        <Sidebar />
        <MainContent />
      </div>
    </div>
  );
}

export default App;
