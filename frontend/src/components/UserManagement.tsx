import React, { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';
import AdminEditUserModal from './AdminEditUserModal';
import DeleteUserModal from './DeleteUserModal';
import { User } from '../types/User';

interface UserManagementProps {
  currentUserRole: string;
}

const UserManagement: React.FC<UserManagementProps> = ({ currentUserRole }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMessage, setReportMessage] = useState('');

  const fetchUsers = async (search?: string) => {
    try {
      setLoading(true);
      const params = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await api.get(`/auth/users${params}`);
      setUsers(response.data);
      setError('');
    } catch (err: any) {
      setError('Failed to load users');
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleEditSuccess = () => {
    fetchUsers(searchQuery);
  };

  const handleDeleteSuccess = () => {
    fetchUsers(searchQuery);
  };

  const handleRegistrationStatusChange = async (userId: string, newStatus: string) => {
    try {
      await api.put(`/auth/users/${userId}/registration-status`, { status: newStatus });
      fetchUsers(searchQuery);
    } catch (err: any) {
      setError('Failed to update registration status');
      console.error('Failed to update registration status:', err);
    }
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'student': return 'Student';
      case 'mentor': return 'Mentor';
      case 'admin': return 'Administrator';
      default: return role;
    }
  };

  const formatRegistrationStatus = (status: string) => {
    switch (status) {
      case 'initially_created': return 'Started';
      case 'contract_signed': return 'Contract Signed';
      case 'complete': return 'Complete';
      case 'inactive': return 'Inactive';
      default: return status;
    }
  };

  const getDisplayName = (user: User) => {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return fullName || user.email;
  };

  const getGuardianMailtoLink = (user: User) => {
    const emails = user.guardians
      ?.filter(guardian => guardian.email && guardian.email.trim())
      .map(guardian => guardian.email!.trim());
    
    if (!emails || emails.length === 0) return null;
    
    const subject = encodeURIComponent(`S.W.A.T. Team 1806 - Regarding ${getDisplayName(user)}`);
    const body = encodeURIComponent(`Hello,\n\nI am contacting you regarding ${getDisplayName(user)} from S.W.A.T. Team 1806.\n\nBest regards,\nS.W.A.T. Team 1806`);
    
    return `mailto:${emails.join(',')}?subject=${subject}&body=${body}`;
  };

  const getFirstGuardianPhone = (user: User) => {
    const firstGuardianWithPhone = user.guardians?.find(guardian => guardian.phone && guardian.phone.trim());
    return firstGuardianWithPhone?.phone?.trim() || null;
  };

  const formatPhoneForTel = (phone: string) => {
    // Remove all non-digit characters for tel: link
    return phone.replace(/\D/g, '');
  };

  const handleGenerateReport = async (reportType: 'student-emails' | 'all-emails' | 'food-allergies') => {
    try {
      setReportLoading(true);
      setReportMessage('');
      setError('');

      const response = await api.get(`/reports/${reportType}`);

      if (reportType === 'food-allergies') {
        // Copy the detailed allergies to clipboard
        const { detailed, count } = response.data;
        let reportText = `Food Allergies Report (${count} people)\n\n`;
        detailed.forEach((item: any) => {
          reportText += `${item.name} (${item.role}): ${item.allergies}\n`;
        });

        await navigator.clipboard.writeText(reportText);
        setReportMessage(`Food allergies report copied to clipboard (${count} people with allergies)`);
      } else {
        // Copy emails to clipboard
        const { emails, count } = response.data;
        await navigator.clipboard.writeText(emails);
        setReportMessage(`${count} email addresses copied to clipboard`);
      }

      // Clear message after 5 seconds
      setTimeout(() => setReportMessage(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate report');
      console.error('Failed to generate report:', err);
    } finally {
      setReportLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600">Loading users...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-impact text-swat-black mb-4">USER MANAGEMENT</h2>

        {/* Reports Section */}
        {(currentUserRole === 'admin' || currentUserRole === 'mentor') && (
          <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Reports</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleGenerateReport('student-emails')}
                disabled={reportLoading}
                className="bg-swat-green hover:bg-swat-green-dark text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reportLoading ? 'Generating...' : 'Student Emails'}
              </button>
              <button
                onClick={() => handleGenerateReport('all-emails')}
                disabled={reportLoading}
                className="bg-swat-green hover:bg-swat-green-dark text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reportLoading ? 'Generating...' : 'All Emails (Students, Guardians, Mentors)'}
              </button>
              <button
                onClick={() => handleGenerateReport('food-allergies')}
                disabled={reportLoading}
                className="bg-swat-green hover:bg-swat-green-dark text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {reportLoading ? 'Generating...' : 'Food Allergies'}
              </button>
            </div>
            {reportMessage && (
              <div className="mt-3 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded">
                {reportMessage}
              </div>
            )}
          </div>
        )}

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-transparent"
            />
            <button
              type="submit"
              className="bg-swat-green hover:bg-swat-green-dark text-white px-6 py-2 rounded-md font-medium transition-colors"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchUsers();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </form>

        {/* Results Summary */}
        <div className="text-sm text-gray-600 mb-4">
          {searchQuery ? (
            <span>Found {users.length} user(s) matching "{searchQuery}"</span>
          ) : (
            <span>Showing all {users.length} users</span>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Registration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Maintenance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Core Leadership
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guardians
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {getDisplayName(user)}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.school_email && (
                        <div className="text-xs text-gray-400">{user.school_email}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-800'
                        : user.role === 'mentor'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {formatRole(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {currentUserRole === 'admin' || currentUserRole === 'mentor' ? (
                      <select
                        value={user.registration_status}
                        onChange={(e) => handleRegistrationStatusChange(user.id, e.target.value)}
                        className={`text-xs font-semibold rounded px-2 py-1 border ${
                          user.registration_status === 'complete'
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : user.registration_status === 'contract_signed'
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                            : 'bg-gray-100 text-gray-800 border-gray-300'
                        }`}
                      >
                        <option value="initially_created">Started</option>
                        <option value="contract_signed">Contract Signed</option>
                        <option value="complete">Complete</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.registration_status === 'complete'
                          ? 'bg-green-100 text-green-800'
                          : user.registration_status === 'contract_signed'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {formatRegistrationStatus(user.registration_status)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.maintenance_access ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.maintenance_access ? 'Granted' : 'Denied'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role === 'student' ? (
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_core_leadership ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.is_core_leadership ? 'Core' : 'Regular'}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <span>{user.guardian_count}</span>
                      {user.guardian_count > 0 && (
                        <div className="flex space-x-1">
                          {getGuardianMailtoLink(user) && (
                            <a
                              href={getGuardianMailtoLink(user)!}
                              className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                              title={`Email ${user.guardians?.filter(g => g.email).length} guardian${user.guardians?.filter(g => g.email).length !== 1 ? 's' : ''}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                            </a>
                          )}
                          {getFirstGuardianPhone(user) && (
                            <a
                              href={`tel:+1${formatPhoneForTel(getFirstGuardianPhone(user)!)}`}
                              className="text-green-600 hover:text-green-800 transition-colors p-1"
                              title={`Call ${getFirstGuardianPhone(user)}`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-swat-green hover:text-swat-green-dark transition-colors"
                      >
                        Edit
                      </button>
                      {currentUserRole === 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(user)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {searchQuery ? 'No users found matching your search.' : 'No users found.'}
            </div>
          </div>
        )}
      </div>

      <AdminEditUserModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={handleEditSuccess}
        user={selectedUser}
        currentUserRole={currentUserRole}
      />

      <DeleteUserModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleDeleteSuccess}
        user={selectedUser}
      />
    </div>
  );
};

export default UserManagement;