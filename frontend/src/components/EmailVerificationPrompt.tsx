import React, { useState } from 'react';
import { api } from '../contexts/AuthContext';

interface EmailVerificationPromptProps {
  userEmail: string;
  onClose?: () => void;
}

const EmailVerificationPrompt: React.FC<EmailVerificationPromptProps> = ({ userEmail, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');

  const handleResendVerification = async () => {
    setLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const userEmailData = {
        user_email : userEmail 
      };
      const response = (await api.post('/auth/resend-verification', userEmailData));
      setMessage(response.data.message);
      setMessageType('success');
    } catch (error: any) {
      setMessage(error.response?.data?.message || 'Failed to resend verification email');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.081 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Email Verification Required
          </h3>
          
          <p className="text-sm text-gray-600 mb-4">
            Please verify your email address (<strong>{userEmail}</strong>) to access your account. 
            Check your inbox for the verification link.
          </p>

          {message && (
            <div className={`mb-4 p-3 rounded ${
              messageType === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <p className="text-sm">{message}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleResendVerification}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md font-medium"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                </span>
              ) : (
                'Resend Verification Email'
              )}
            </button>
            
            {onClose && (
              <button
                onClick={onClose}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md font-medium"
              >
                Close
              </button>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Don't see the email? Check your spam folder or try resending.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPrompt;