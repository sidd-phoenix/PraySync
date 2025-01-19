import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ViewProvider } from './contexts/ViewContext';
import MainContent from './components/MainContent';
import Dashboard from './components/Dashboard';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="app-container">
          <ViewProvider>
            <Navbar />
            <div className="combo-container">
              <MainContent />
              <Dashboard />
            </div>
          </ViewProvider>
        </div>
      </AuthProvider>
    </Router >
  );
}

export default App;
