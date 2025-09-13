import React, { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';

interface Guardian {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  relationship?: string;
}

interface EditGuardianModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentGuardians: Guardian[];
  userRole?: string;
}

const EditGuardianModal: React.FC<EditGuardianModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  currentGuardians,
  userRole 
}) => {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEmergencyContact = userRole === 'mentor' || userRole === 'admin';
  const contactLabel = isEmergencyContact ? 'Emergency Contact' : 'Guardian';
  const contactsLabel = isEmergencyContact ? 'Emergency Contacts' : 'Guardians';

  useEffect(() => {
    if (isOpen) {
      if (currentGuardians.length > 0) {
        setGuardians([...currentGuardians]);
      } else {
        // Start with one empty contact if none exist
        setGuardians([{ name: '', email: '', phone: '', relationship: '' }]);
      }
      setError('');
    }
  }, [isOpen, currentGuardians]);

  const addGuardian = () => {
    setGuardians([...guardians, { name: '', email: '', phone: '', relationship: '' }]);
  };

  const removeGuardian = (index: number) => {
    if (guardians.length > 1) {
      setGuardians(guardians.filter((_, i) => i !== index));
    }
  };

  const updateGuardian = (index: number, field: keyof Guardian, value: string) => {
    const updatedGuardians = [...guardians];
    updatedGuardians[index] = { ...updatedGuardians[index], [field]: value };
    setGuardians(updatedGuardians);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate that all contacts have names
    const validGuardians = guardians.filter(g => g.name.trim() !== '');
    if (validGuardians.length === 0) {
      setError(`At least one ${contactLabel.toLowerCase()} with a name is required`);
      return;
    }

    setLoading(true);

    try {
      const response = await api.put('/auth/guardian-info', {
        guardians: validGuardians.map(g => ({
          name: g.name.trim(),
          email: g.email?.trim() || undefined,
          phone: g.phone?.trim() || undefined,
          relationship: g.relationship?.trim() || undefined
        }))
      });

      if (response.data) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.[0]?.msg || 
                          'Failed to update guardian information';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setGuardians([]);
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-4xl w-full mx-4 border-4 border-swat-green max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-impact text-swat-black">EDIT {contactsLabel.toUpperCase()} INFORMATION</h2>
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
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {isEmergencyContact 
                ? 'Please provide contact information for at least one emergency contact. This information is used for emergency situations and team communications.'
                : 'Please provide contact information for at least one parent or legal guardian. This information is used for emergency contacts and team communications.'}
            </p>
          </div>

          {guardians.map((guardian, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-impact text-swat-black">
                  {contactLabel.toUpperCase()} {index + 1}
                </h3>
                {guardians.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeGuardian(index)}
                    className="text-red-600 hover:text-red-800 p-1"
                    aria-label={`Remove ${contactLabel} ${index + 1}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={guardian.name}
                    onChange={(e) => updateGuardian(index, 'name', e.target.value)}
                    required
                    maxLength={100}
                    placeholder="e.g., John Smith"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={guardian.email || ''}
                    onChange={(e) => updateGuardian(index, 'email', e.target.value)}
                    placeholder="guardian@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={guardian.phone || ''}
                    onChange={(e) => updateGuardian(index, 'phone', e.target.value)}
                    maxLength={20}
                    placeholder="(555) 123-4567"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-transparent"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relationship
                  </label>
                  <select
                    value={guardian.relationship || ''}
                    onChange={(e) => updateGuardian(index, 'relationship', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-transparent"
                  >
                    <option value="">Select relationship...</option>
                    {isEmergencyContact? <option value="Spouse">Spouse</option> : ""}
                    {isEmergencyContact? <option value="Significant Other">Significant Other</option> : ""}
                    {isEmergencyContact? <option value="Sibling">Sibling</option> : ""}
                    {isEmergencyContact? <option value="Friend">Friend</option> : ""}
                    <option value="Parent">Parent</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Guardian">Legal Guardian</option>
                    <option value="Grandparent">Grandparent</option>
                    <option value="Stepparent">Stepparent</option>
                    <option value="Other">Other</option>

                  </select>
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-center">
            <button
              type="button"
              onClick={addGuardian}
              className="flex items-center px-4 py-2 border border-swat-green text-swat-green hover:bg-swat-green hover:text-white rounded-md transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Another {contactLabel}
            </button>
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
              {loading ? 'Updating...' : `Update ${contactLabel} Information`}
            </button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Privacy & Usage:</h3>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• {contactLabel} information is used for emergency contacts and team communications</li>
            <li>• Information is kept confidential and only shared with team mentors and supervisors</li>
            <li>• At least one {contactLabel.toLowerCase()} with contact information is required for {isEmergencyContact ? 'emergency situations' : 'student safety'}</li>
            <li>• Multiple {contactsLabel.toLowerCase()} can be added for comprehensive emergency contacts</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EditGuardianModal;