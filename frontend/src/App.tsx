import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import About from './pages/About';
import Sponsors from './pages/Sponsors';
import Resources from './pages/Resources';
import Awards from './pages/Awards';
import Robots from './pages/Robots';
import Admin from './pages/Admin';
import MassEmail from './pages/MassEmail';
import Maintenance from './pages/Maintenance';
import RosterManagement from './pages/RosterManagement';
import Roster from './pages/Roster';
import Unauthorized from './pages/Unauthorized';
import VerifyEmail from './pages/VerifyEmail';
import DynamicPage from './pages/DynamicPage';
import { logHTTPSConfig } from './utils/httpsHelper';
import './App.css';
import LiveEventDisplay from './components/LiveEventDisplay';
import PitDisplay from './components/PitDisplay';

function App() {
  document.title = "S.W.A.T. 1806";

  // Log HTTPS configuration in development
  if (process.env.NODE_ENV === 'development') {
    logHTTPSConfig();
  }
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router>
        <Routes>
          <Route path="/live" element={<LiveEventDisplay />} />
          <Route path="/pit" element={<PitDisplay />} />
        </Routes>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/about" element={<About />} />
            <Route path="/sponsors" element={<Sponsors />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/awards" element={<Awards />} />
            <Route path="/robots" element={<Robots />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              }
            />
            <Route
              path="/mass-email"
              element={
                <ProtectedRoute>
                  <MassEmail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/maintenance"
              element={
                <ProtectedRoute>
                  <Maintenance />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roster-management"
              element={
                <ProtectedRoute>
                  <RosterManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/roster"
              element={
                <ProtectedRoute>
                  <Roster />
                </ProtectedRoute>
              }
            />
            {/* Dynamic pages - must be last to avoid conflicts with static routes */}
            <Route path="/page/:slug" element={<DynamicPage />} />
          </Routes>
        </Layout>
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
