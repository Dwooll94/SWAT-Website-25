import React, { useState } from 'react';
import { api } from '../contexts/AuthContext';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  role: string;
}

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  user 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationText, setConfirmationText] = useState('');

  const handleDelete = async () => {
    if (!user) return;

    if (confirmationText !== 'DELETE') {
      setError('Please type "DELETE" to confirm');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.delete(`/auth/users/${user.id}`);
      
      if (response.data) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete user';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setConfirmationText('');
    setError('');
    onClose();
  };

  if (!isOpen || !user) return null;

  const displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;

  const formatRole = (role: string) => {
    switch (role) {
      case 'student': return 'Student';
      case 'mentor': return 'Mentor';
      case 'admin': return 'Administrator';
      default: return role;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 border-4 border-red-500">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-xl font-impact text-red-600">DELETE USER</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-6">
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-red-800">Permanent Deletion Warning</h3>
                <p className="text-sm text-red-700 mt-1">
                  This action cannot be undone. All user data will be permanently deleted.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-700">User:</span>
              <span className="ml-2 text-sm text-gray-900">{displayName}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Email:</span>
              <span className="ml-2 text-sm text-gray-900">{user.email}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-700">Role:</span>
              <span className="ml-2 text-sm text-gray-900">{formatRole(user.role)}</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-700 mb-3">
            To confirm deletion, please type <strong>DELETE</strong> in the box below:
          </p>
          <input
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            disabled={loading}
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || confirmationText !== 'DELETE'}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Deleting...' : 'Delete User'}
          </button>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <h4 className="text-xs font-medium text-gray-700 mb-1">What will be deleted:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• User account and login credentials</li>
            <li>• Personal information and contact details</li>
            <li>• Guardian/emergency contact information</li>
            <li>• Subteam preferences and team associations</li>
            <li>• All related database records</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;