import React, { useState } from 'react';
import { api } from '../contexts/AuthContext';

interface FirstSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  firstSignupUrl: string;
  userName: string;
}

const FirstSignupModal: React.FC<FirstSignupModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  firstSignupUrl,
  userName
}) => {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!confirmed) {
      setError('Please confirm that you have completed FIRST registration');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await api.post('/auth/complete-first-signup');

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to complete FIRST signup');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-impact text-swat-black">FIRST REGISTRATION REQUIRED</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Great job, {userName}! Your signed contract has been approved. 
              The final step is to register with FIRST (For Inspiration and Recognition of Science and Technology).
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-swat-black mb-2">🎯 What is FIRST?</h3>
              <p className="text-sm text-gray-700 mb-3">
                FIRST is the organization that runs the robotics competitions we participate in. 
                All team members must be registered in their system to compete.
              </p>
              <h4 className="font-semibold text-gray-800 mb-2">Required Steps:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                <li>Click the registration link below</li>
                <li>Create your FIRST account and join FRC Team 1806</li>
                <li>Have your parent/guardian complete the consent and release forms</li>
                <li>Return here and confirm completion</li>
              </ol>
            </div>

            <div className="mb-6">
              <a
                href={firstSignupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                🔗 Register with FIRST
              </a>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Make sure to join <strong>FRC Team 1806</strong> specifically</li>
                <li>• Parent/guardian signatures are required for students under 18</li>
                <li>• Keep your FIRST login information safe - you'll need it all season</li>
                <li>• Contact a mentor if you need help with registration</li>
              </ul>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-2 border-swat-green rounded-lg p-4">
              <label className="flex items-start space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => {
                    setConfirmed(e.target.checked);
                    if (e.target.checked) setError('');
                  }}
                  className="mt-1 w-4 h-4 text-swat-green border-2 border-gray-300 rounded focus:ring-swat-green"
                />
                <span className="text-sm text-gray-800 leading-relaxed">
                  I, <strong>{userName}</strong>, certify that I have signed up for 
                  <strong> FRC Team 1806</strong> in FIRST's system and that my parents have 
                  signed the consent and release forms.
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || !confirmed}
                className="flex-1 bg-swat-green text-white py-3 px-4 rounded-lg hover:bg-swat-green/90 disabled:opacity-50 font-semibold"
              >
                {loading ? 'Processing...' : 'Complete Registration'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
              >
                Cancel
              </button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              <strong>Need Help?</strong> If you're having trouble with FIRST registration, 
              contact a team mentor or check our resources page for detailed instructions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstSignupModal;