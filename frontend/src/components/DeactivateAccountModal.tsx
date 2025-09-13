import React, { useState } from 'react';
import { api } from '../contexts/AuthContext';

interface DeactivateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userRole: string;
  userName?: string;
}

const DeactivateAccountModal: React.FC<DeactivateAccountModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  userRole,
  userName 
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationText, setConfirmationText] = useState('');

  const handleDeactivate = async () => {
    if (confirmationText !== 'DEACTIVATE') {
      setError('Please type "DEACTIVATE" to confirm');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.put('/auth/deactivate-account');
      
      if (response.data) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to deactivate account';
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

  if (!isOpen) return null;

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
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 border-4 border-orange-500">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-xl font-impact text-orange-600">DEACTIVATE ACCOUNT</h2>
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
          <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-4">
            <div className="flex">
              <svg className="w-5 h-5 text-orange-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-orange-800">Account Deactivation Warning</h3>
                <p className="text-sm text-orange-700 mt-1">
                  Your account will be deactivated and you will no longer be able to log in.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            {userName && (
              <div>
                <span className="text-sm font-medium text-gray-700">Name:</span>
                <span className="ml-2 text-sm text-gray-900">{userName}</span>
              </div>
            )}
            <div>
              <span className="text-sm font-medium text-gray-700">Role:</span>
              <span className="ml-2 text-sm text-gray-900">{formatRole(userRole)}</span>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <div className="flex">
              <svg className="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-blue-800">Important Information</h3>
                <ul className="text-sm text-blue-700 mt-1 space-y-1">
                  <li>• Your data will remain in the system</li>
                  <li>• You can contact an administrator to reactivate your account</li>
                  <li>• You will be automatically logged out after deactivation</li>
                  <li>• Team administrators will be notified of your deactivation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-700 mb-3">
            To confirm deactivation, please type <strong>DEACTIVATE</strong> in the box below:
          </p>
          <input
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            placeholder="Type DEACTIVATE to confirm"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
            onClick={handleDeactivate}
            disabled={loading || confirmationText !== 'DEACTIVATE'}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Deactivating...' : 'Deactivate Account'}
          </button>
        </div>

        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <h4 className="text-xs font-medium text-gray-700 mb-1">After deactivation:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• You will be immediately logged out</li>
            <li>• Your login access will be disabled</li>
            <li>• Your profile and data remain intact</li>
            <li>• Administrators can reactivate your account if needed</li>
            <li>• Contact team leadership to request reactivation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DeactivateAccountModal;