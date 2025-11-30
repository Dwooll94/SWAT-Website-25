import React, { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';

interface ContactInfo {
  first_name?: string;
  last_name?: string;
  phone?: string;
  school_email?: string;
  food_allergies?: string;
  medical_conditions?: string;
}

interface EditContactInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentInfo: ContactInfo;
}

const EditContactInfoModal: React.FC<EditContactInfoModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  currentInfo 
}) => {
  const [formData, setFormData] = useState<ContactInfo>({
    first_name: '',
    last_name: '',
    phone: '',
    school_email: '',
    food_allergies: '',
    medical_conditions: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        first_name: currentInfo.first_name || '',
        last_name: currentInfo.last_name || '',
        phone: currentInfo.phone || '',
        school_email: currentInfo.school_email || '',
        food_allergies: currentInfo.food_allergies || '',
        medical_conditions: currentInfo.medical_conditions || ''
      });
      setError('');
    }
  }, [isOpen, currentInfo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.put('/auth/contact-info', formData);

      if (response.data) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.[0]?.msg || 
                          'Failed to update contact information';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      first_name: '',
      last_name: '',
      phone: '',
      school_email: '',
      food_allergies: '',
      medical_conditions: ''
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 border-4 border-swat-green max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-impact text-swat-black">EDIT CONTACT INFORMATION</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-impact text-swat-black mb-4">PERSONAL INFORMATION</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-impact text-swat-black mb-4">CONTACT INFORMATION</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={20}
                  placeholder="(555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="school_email" className="block text-sm font-medium text-gray-700 mb-1">
                  School Email
                </label>
                <input
                  type="email"
                  id="school_email"
                  name="school_email"
                  value={formData.school_email}
                  onChange={handleChange}
                  placeholder="your.name@smithville.k12.mo.us"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div>
            <h3 className="text-lg font-impact text-swat-black mb-4">MEDICAL INFORMATION</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="food_allergies" className="block text-sm font-medium text-gray-700 mb-1">
                  Food Allergies
                </label>
                <textarea
                  id="food_allergies"
                  name="food_allergies"
                  value={formData.food_allergies}
                  onChange={handleChange}
                  rows={3}
                  maxLength={1000}
                  placeholder="List any food allergies or dietary restrictions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-transparent resize-vertical"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.food_allergies?.length || 0}/1000 characters
                </p>
              </div>

              <div>
                <label htmlFor="medical_conditions" className="block text-sm font-medium text-gray-700 mb-1">
                  Medical Conditions
                </label>
                <textarea
                  id="medical_conditions"
                  name="medical_conditions"
                  value={formData.medical_conditions}
                  onChange={handleChange}
                  rows={3}
                  maxLength={1000}
                  placeholder="List any medical conditions or medications we should be aware of..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-transparent resize-vertical"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.medical_conditions?.length || 0}/1000 characters
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-swat-green hover:bg-swat-green-dark text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Information'}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Privacy Notice:</h3>
          <p className="text-xs text-gray-600">
            Your personally identifiable information is kept confidential and is only used for team communication, 
            safety purposes, and event coordination. Medical information is only shared with team 
            mentors and adult supervisors as needed for your safety. Anonymized verions of this data may be shared
            with various organizations as part of our efforts to secure grants/funding.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EditContactInfoModal;