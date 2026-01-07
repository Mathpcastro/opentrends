import { AuthProvider } from './contexts/AuthContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SavedIdeas from './pages/SavedIdeas';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/saved" element={<SavedIdeas />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
