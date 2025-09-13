import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import InviteMentorModal from '../components/InviteMentorModal';
import UserManagement from '../components/UserManagement';
import SiteConfiguration from '../components/SiteConfiguration';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [showInviteMentorModal, setShowInviteMentorModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'config'>('overview');

  const handleMentorInviteSuccess = () => {
    setSuccessMessage('Mentor invitation sent successfully!');
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  // Check if user has admin or mentor privileges
  const canInviteMentors = user?.role === 'admin' || user?.role === 'mentor';

  if (!canInviteMentors) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Access denied. You must be an administrator or mentor to access this page.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-impact swat-title text-swat-black mb-4">
            ADMIN DASHBOARD
          </h1>
          <p className="text-lg text-gray-700">
            Manage team members and administrative functions
          </p>
        </div>

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {successMessage}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-swat-green text-swat-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-swat-green text-swat-green'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              User Management
            </button>
            {user?.role === 'admin' && (
              <button
                onClick={() => setActiveTab('config')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'config'
                    ? 'border-swat-green text-swat-green'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Site Configuration
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Team Management Section */}
            <div className="bg-gray-100 rounded-lg p-6 border-l-4 border-swat-green">
              <h2 className="text-2xl font-impact text-swat-black mb-6">TEAM MANAGEMENT</h2>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded border">
                <h3 className="font-medium text-gray-900 mb-2">Mentor Invitations</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Invite new mentors to join the team. They will receive an email with login credentials.
                </p>
                <button
                  onClick={() => setShowInviteMentorModal(true)}
                  className="bg-swat-green hover:bg-swat-green-dark text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Invite Mentor
                </button>
              </div>

              <div className="bg-white p-4 rounded border">
                <h3 className="font-medium text-gray-900 mb-2">User Management</h3>
                <p className="text-sm text-gray-600 mb-4">
                  View and manage all team members, registration status, and permissions.
                </p>
                <button
                  onClick={() => setActiveTab('users')}
                  className="bg-swat-green hover:bg-swat-green-dark text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Manage Users
                </button>
              </div>
            </div>
          </div>

          {/* System Information Section */}
          <div className="bg-gray-100 rounded-lg p-6 border-l-4 border-swat-green">
            <h2 className="text-2xl font-impact text-swat-black mb-6">SYSTEM INFORMATION</h2>
            
            <div className="space-y-4">
              <div className="bg-white p-4 rounded border">
                <h3 className="font-medium text-gray-900 mb-2">Current User</h3>
                <div className="text-sm text-gray-600">
                  <p><strong>Role:</strong> {user?.role === 'admin' ? 'Administrator' : 'Mentor'}</p>
                  <p><strong>Email:</strong> {user?.email}</p>
                  {(user?.first_name || user?.last_name) && (
                    <p><strong>Name:</strong> {user?.first_name} {user?.last_name}</p>
                  )}
                </div>
              </div>

              <div className="bg-white p-4 rounded border">
                <h3 className="font-medium text-gray-900 mb-2">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    className="block w-full text-left text-sm text-swat-green hover:text-swat-green-dark transition-colors"
                    onClick={() => window.location.href = '/profile'}
                  >
                    → View Profile
                  </button>
                  <button
                    className="block w-full text-left text-sm text-swat-green hover:text-swat-green-dark transition-colors"
                    onClick={() => window.location.href = '/resources'}
                  >
                    → Manage Resources
                  </button>
                </div>
              </div>
            </div>
          </div>


          {/* Additional Information */}
          <div className="mt-8 bg-blue-50 border border-blue-300 rounded-md p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-blue-800">Admin Dashboard</h3>
                <p className="text-sm text-blue-700 mt-1">
                  This dashboard provides administrative functions for team management. 
                  More features will be added as the system grows.
                </p>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <UserManagement currentUserRole={user?.role || ''} />
        )}

        {/* Site Configuration Tab */}
        {activeTab === 'config' && user?.role === 'admin' && (
          <SiteConfiguration />
        )}
      </div>

      <InviteMentorModal
        isOpen={showInviteMentorModal}
        onClose={() => setShowInviteMentorModal(false)}
        onSuccess={handleMentorInviteSuccess}
      />
    </div>
  );
};

export default Admin;