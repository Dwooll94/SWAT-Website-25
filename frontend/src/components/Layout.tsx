import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, api } from '../contexts/AuthContext';
import ContractUploadModal from './ContractUploadModal';
import FirstSignupModal from './FirstSignupModal';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showFirstModal, setShowFirstModal] = useState(false);
  const [contractUrl, setContractUrl] = useState('');
  const [firstSignupUrl, setFirstSignupUrl] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Load configuration and check user registration status
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await api.get('/config');
        setContractUrl(response.data.contract_url || 'https://docs.google.com/document/d/1je78p4ZADTx7aYyjeyP4SgrYUObXlefbY4ApI3SzYAI/edit?tab=t.0#heading=h.d51b07zbtvd9');
        setFirstSignupUrl(response.data.first_signup_url || 'https://www.firstinspires.org/');
      } catch (error) {
        console.error('Error loading configuration:', error);
        // Use defaults if API fails
        setContractUrl('https://docs.google.com/document/d/1je78p4ZADTx7aYyjeyP4SgrYUObXlefbY4ApI3SzYAI/edit?tab=t.0#heading=h.d51b07zbtvd9');
        setFirstSignupUrl('https://www.firstinspires.org/');
      }
    };

    loadConfig();
  }, []);

  // Check if modals should be shown based on user status
  useEffect(() => {
    if (user) {
      if (user.registration_status === 'initially_created') {
        setShowContractModal(true);
      } else if (user.registration_status === 'contract_signed') {
        setShowFirstModal(true);
      }
    }
  }, [user]);

  const handleContractSuccess = () => {
    refreshUser(); // Refresh user data to update registration status
  };

  const handleFirstSignupSuccess = () => {
    refreshUser(); // Refresh user data to update registration status
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-swat-black text-swat-white shadow-xl border-b-4 border-swat-green">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left: Logo and Menu Toggle */}
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md hover:bg-swat-green transition-colors"
                aria-label="Toggle navigation menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link to="/" className="flex items-center space-x-3">
                <img 
                  src="/pictures/Logo.png" 
                  alt="S.W.A.T. Team 1806 Logo" 
                  className="h-10 w-auto swat-logo"
                />
              </Link>
            </div>
            
            {/* Right: User Actions */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm hidden sm:block">
                    Welcome, {user.first_name || user.email}
                  </span>
                  <Link to="/profile" className="hover:text-swat-green transition-colors">Profile</Link>
                  {(user.maintenance_access || ['mentor', 'admin'].includes(user.role)) && (
                    <Link to="/admin" className="hover:text-swat-green transition-colors">Admin</Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="bg-swat-green hover:bg-swat-green-dark px-4 py-2 rounded font-medium transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="hover:text-swat-green transition-colors">Login</Link>
                  <Link 
                    to="/register" 
                    className="bg-swat-green hover:bg-swat-green-dark px-4 py-2 rounded font-medium transition-colors"
                  >
                    Join Team
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Expandable Sidebar */}
      <nav className={`fixed top-0 left-0 h-full bg-swat-black text-swat-white w-64 transform transition-transform duration-300 ease-in-out z-50 border-r-4 border-swat-green ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between mb-8">
            <span className="text-lg font-impact swat-title">NAVIGATION</span>
            <button
              onClick={toggleSidebar}
              className="p-1 rounded hover:bg-swat-green transition-colors"
              aria-label="Close navigation menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation Items */}
          <ul className="space-y-2">
            <li>
              <Link 
                to="/about" 
                className="block px-4 py-3 rounded-lg hover:bg-swat-green transition-colors font-medium"
                onClick={toggleSidebar}
              >
                About
              </Link>
            </li>
            <li>
              <Link 
                to="/robots" 
                className="block px-4 py-3 rounded-lg hover:bg-swat-green transition-colors font-medium"
                onClick={toggleSidebar}
              >
                Robots
              </Link>
            </li>
            <li>
              <Link 
                to="/resources" 
                className="block px-4 py-3 rounded-lg hover:bg-swat-green transition-colors font-medium"
                onClick={toggleSidebar}
              >
                Resources
              </Link>
            </li>
            <li>
              <Link 
                to="/sponsors" 
                className="block px-4 py-3 rounded-lg hover:bg-swat-green transition-colors font-medium"
                onClick={toggleSidebar}
              >
                Sponsors
              </Link>
            </li>
            <li>
              <Link 
                to="/awards" 
                className="block px-4 py-3 rounded-lg hover:bg-swat-green transition-colors font-medium"
                onClick={toggleSidebar}
              >
                Awards
              </Link>
            </li>
            {/* Roster for all signed-in users */}
            {user && (
              <li>
                <Link 
                  to="/roster" 
                  className="block px-4 py-3 rounded-lg hover:bg-swat-green transition-colors font-medium"
                  onClick={toggleSidebar}
                >
                  Team Roster
                </Link>
              </li>
            )}
            {/* Admin/Mentor only navigation */}
            {user && (user.role === 'admin' || user.role === 'mentor') && (
              <li>
                <Link 
                  to="/admin" 
                  className="block px-4 py-3 rounded-lg hover:bg-swat-green transition-colors font-medium border-t border-gray-600 mt-2 pt-4"
                  onClick={toggleSidebar}
                >
                  Admin
                </Link>
              </li>
            )}
            {/* Mass Email for Admin, Mentor, or Core Leadership Students */}
            {user && (user.role === 'admin' || user.role === 'mentor' || (user.role === 'student' && user.is_core_leadership)) && (
              <li>
                <Link 
                  to="/mass-email" 
                  className="block px-4 py-3 rounded-lg hover:bg-swat-green transition-colors font-medium"
                  onClick={toggleSidebar}
                >
                  Mass Email
                </Link>
              </li>
            )}
            {/* Maintenance for Students, Mentors, and Admins */}
            {user && (user.maintenance_access || user.role === 'admin' || user.role === 'mentor' || user.role === 'student') && (
              <li>
                <Link 
                  to="/maintenance" 
                  className="block px-4 py-3 rounded-lg hover:bg-swat-green transition-colors font-medium"
                  onClick={toggleSidebar}
                >
                  Maintenance
                </Link>
              </li>
            )}
            {/* Roster Management for Core Leadership, Mentors, and Admins */}
            {user && (user.maintenance_access || user.role === 'admin' || user.role === 'mentor') && (
              <li>
                <Link 
                  to="/roster-management" 
                  className="block px-4 py-3 rounded-lg hover:bg-swat-green transition-colors font-medium"
                  onClick={toggleSidebar}
                >
                  Roster Management
                </Link>
              </li>
            )}
          </ul>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      
      <footer className="bg-swat-black text-swat-white py-8 mt-12 border-t-4 border-swat-green">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-4">
              <img 
                src="/pictures/swat_stamp-black.png" 
                alt="S.W.A.T. Stamp" 
                className="h-16 w-auto mx-auto filter invert"
              />
            </div>
            <p className="font-impact text-lg">&copy; 2025 S.W.A.T. Team 1806. All rights reserved.</p>
            <p className="text-sm text-gray-300 mt-2">
              FIRST Robotics Competition Team 1806 - Smithville Warriors Advancing Technology
            </p>
            <p className="text-xs text-swat-green mt-1 font-medium">
              Smithville, MO
            </p>
          </div>
        </div>
      </footer>

      {/* Registration Modals */}
      <ContractUploadModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        onSuccess={handleContractSuccess}
        contractUrl={contractUrl}
        userName={user?.first_name || user?.email || 'Student'}
      />
      
      <FirstSignupModal
        isOpen={showFirstModal}
        onClose={() => setShowFirstModal(false)}
        onSuccess={handleFirstSignupSuccess}
        firstSignupUrl={firstSignupUrl}
        userName={user?.first_name || user?.email || 'Student'}
      />
    </div>
  );
};

export default Layout;