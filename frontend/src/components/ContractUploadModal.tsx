import React, { useState } from 'react';
import { api } from '../contexts/AuthContext';

interface ContractUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contractUrl: string;
  userName: string;
}

const ContractUploadModal: React.FC<ContractUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  contractUrl,
  userName
}) => {
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a PDF or image file (JPG, PNG)');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      setContractFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!contractFile) {
      setError('Please select a contract file to upload');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const formData = new FormData();
      formData.append('contract', contractFile);

      await api.post('/auth/upload-contract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload contract');
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
            <h2 className="text-2xl font-impact text-swat-black">TEAM CONTRACT REQUIRED</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Welcome to S.W.A.T. Team 1806, {userName}! To complete your registration, 
              you need to review and sign our team contract.
            </p>
            
            <div className="bg-swat-green/10 border border-swat-green/20 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-swat-black mb-2">📋 Next Steps:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                <li>Click the link below to view the team contract</li>
                <li>Print and sign the contract (both student and parent/guardian signatures required)</li>
                <li>Take a clear photo or scan the signed contract</li>
                <li>Upload the signed contract using the form below</li>
              </ol>
            </div>

            <div className="mb-6">
              <a
                href={contractUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-swat-green text-white px-6 py-3 rounded-lg hover:bg-swat-green/90 transition-colors font-semibold"
              >
                📄 View Team Contract
              </a>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Signed Contract *
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Accepted formats: PDF, JPG, PNG (max 5MB)
              </p>
            </div>

            {contractFile && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-sm text-green-800">
                  ✓ Selected: {contractFile.name} ({(contractFile.size / (1024 * 1024)).toFixed(2)} MB)
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading || !contractFile}
                className="flex-1 bg-swat-green text-white py-3 px-4 rounded-lg hover:bg-swat-green/90 disabled:opacity-50 font-semibold"
              >
                {loading ? 'Uploading...' : 'Upload Contract'}
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
              <strong>Note:</strong> Your uploaded contract will be securely stored and reviewed by team mentors. 
              Once approved, you'll proceed to the next step of registration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractUploadModal;