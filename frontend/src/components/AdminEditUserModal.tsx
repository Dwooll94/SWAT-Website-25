import React, { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';
import DeleteUserModal from './DeleteUserModal';
import { User, Guardian } from '../types/User';

interface AdminEditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: User | null;
  currentUserRole: string;
}

const AdminEditUserModal: React.FC<AdminEditUserModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  user,
  currentUserRole 
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    school_email: '',
    food_allergies: '',
    medical_conditions: ''
  });
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [showGuardianEditor, setShowGuardianEditor] = useState(false);
  const [editingGuardians, setEditingGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        school_email: user.school_email || '',
        food_allergies: user.food_allergies || '',
        medical_conditions: user.medical_conditions || ''
      });
      fetchUserGuardians();
      setError('');
      setSuccessMessage('');
    }
  }, [user, isOpen]);

  const fetchUserGuardians = async () => {
    if (!user) return;
    
    try {
      const response = await api.get(`/auth/users/${user.id}/guardian-info`);
      setGuardians(response.data.guardians || []);
    } catch (err: any) {
      console.error('Failed to fetch guardians:', err);
      setGuardians([]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await api.put(`/auth/users/${user.id}/contact-info`, {
        first_name: formData.first_name.trim() || undefined,
        last_name: formData.last_name.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        school_email: formData.school_email.trim() || undefined,
        food_allergies: formData.food_allergies.trim() || undefined,
        medical_conditions: formData.medical_conditions.trim() || undefined
      });

      if (response.data) {
        setSuccessMessage('User information updated successfully!');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.errors?.[0]?.msg || 
                          'Failed to update user information';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async () => {
    if (!user || currentUserRole !== 'admin') return;

    setLoading(true);
    try {
      await api.put(`/auth/users/${user.id}/status`, {
        is_active: !user.is_active
      });
      setSuccessMessage(`User ${!user.is_active ? 'activated' : 'deactivated'} successfully!`);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update user status';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleMaintenanceToggle = async () => {
    if (!user || currentUserRole !== 'admin') return;

    setLoading(true);
    try {
      await api.put(`/auth/users/${user.id}/maintenance-access`, {
        maintenance_access: !user.maintenance_access
      });
      setSuccessMessage(`Maintenance access ${!user.maintenance_access ? 'granted' : 'revoked'} successfully!`);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update maintenance access';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCoreLeadershipToggle = async () => {
    if (!user || currentUserRole !== 'admin' || user.role !== 'student') return;

    setLoading(true);
    try {
      await api.put(`/auth/users/${user.id}/core-leadership`, {
        is_core_leadership: !user.is_core_leadership
      });
      setSuccessMessage(`Student ${!user.is_core_leadership ? 'granted' : 'removed from'} core leadership successfully!`);
      setTimeout(() => {
        onSuccess();
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update core leadership status';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSuccess = () => {
    setShowDeleteModal(false);
    onSuccess();
    onClose();
  };

  const handleGuardianEdit = () => {
    const initialGuardians = guardians.length > 0 ? [...guardians] : [{ name: '', email: '', phone: '', relationship: '' }];
    setEditingGuardians(initialGuardians);
    setShowGuardianEditor(true);
  };

  const handleGuardianSave = async () => {
    if (!user) return;
    
    // Validate that all guardians have names
    const validGuardians = editingGuardians.filter(g => g.name.trim() !== '');
    if (user.role === 'student' && validGuardians.length === 0) {
      setError('At least one guardian with a name is required for students');
      return;
    }
    
    setLoading(true);
    try {
      await api.put(`/auth/users/${user.id}/guardian-info`, {
        guardians: validGuardians.map(g => ({
          name: g.name.trim(),
          email: g.email?.trim() || undefined,
          phone: g.phone?.trim() || undefined,
          relationship: g.relationship?.trim() || undefined
        }))
      });
      
      setGuardians(validGuardians);
      setShowGuardianEditor(false);
      setEditingGuardians([]);
      setSuccessMessage('Guardian information updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update guardian information';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardianCancel = () => {
    setShowGuardianEditor(false);
    setEditingGuardians([]);
  };

  const addGuardian = () => {
    setEditingGuardians([...editingGuardians, { name: '', email: '', phone: '', relationship: '' }]);
  };

  const removeGuardian = (index: number) => {
    if (editingGuardians.length > 1) {
      setEditingGuardians(editingGuardians.filter((_, i) => i !== index));
    }
  };

  const updateGuardian = (index: number, field: keyof Guardian, value: string) => {
    const updated = [...editingGuardians];
    updated[index] = { ...updated[index], [field]: value };
    setEditingGuardians(updated);
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
    setGuardians([]);
    setShowGuardianEditor(false);
    setError('');
    setSuccessMessage('');
    setShowDeleteModal(false);
    onClose();
  };

  if (!isOpen || !user) return null;

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
      case 'initially_created': return 'Registration Started';
      case 'contract_signed': return 'Contract Signed';
      case 'complete': return 'Complete';
      case 'inactive': return 'Inactive';
      default: return status;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 border-4 border-swat-green max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-impact text-swat-black">EDIT USER</h2>
            <p className="text-sm text-gray-600">
              {user.first_name} {user.last_name} ({user.email})
            </p>
          </div>
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

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Information Panel */}
          <div className="lg:col-span-1 bg-gray-50 p-4 rounded border">
            <h3 className="font-impact text-swat-black mb-4">USER DETAILS</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">Role:</span>
                <span className="ml-2">{formatRole(user.role)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Registration:</span>
                <span className="ml-2">{formatRegistrationStatus(user.registration_status)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Maintenance Access:</span>
                <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user.maintenance_access ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.maintenance_access ? 'Granted' : 'Denied'}
                </span>
              </div>
              {user.role === 'student' && (
                <div>
                  <span className="font-medium text-gray-700">Core Leadership:</span>
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.is_core_leadership ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.is_core_leadership ? 'Core' : 'Regular'}
                  </span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">{user.role === 'student' ? 'Guardians:' : 'Emergency Contacts:'}</span>
                <span className="ml-2">{user.guardian_count}</span>
                {(currentUserRole === 'admin' || currentUserRole === 'mentor') && (
                  <button
                    onClick={handleGuardianEdit}
                    className="ml-2 text-sm text-swat-green hover:text-swat-green-dark transition-colors"
                    disabled={loading}
                  >
                    Edit
                  </button>
                )}
              </div>
              {guardians.length > 0 && (
                <div className="mt-2 space-y-1">
                  {guardians.map((guardian, index) => (
                    <div key={index} className="text-sm text-gray-600 bg-gray-100 rounded p-2">
                      <div className="font-medium">{guardian.name}</div>
                      {guardian.email && <div className="text-xs">📧 {guardian.email}</div>}
                      {guardian.phone && <div className="text-xs">📞 {guardian.phone}</div>}
                      {guardian.relationship && <div className="text-xs capitalize">{guardian.relationship}</div>}
                    </div>
                  ))}
                </div>
              )}
              {user.graduation_year && (
                <div>
                  <span className="font-medium text-gray-700">Graduation:</span>
                  <span className="ml-2">{user.graduation_year}</span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <span className="ml-2">{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
              {user.last_login && (
                <div>
                  <span className="font-medium text-gray-700">Last Login:</span>
                  <span className="ml-2">{new Date(user.last_login).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {/* Admin Controls */}
            {currentUserRole === 'admin' && (
              <div className="mt-4 pt-4 border-t space-y-2">
                <h4 className="font-medium text-gray-700 mb-2">Admin Controls</h4>
                <button
                  onClick={handleStatusToggle}
                  disabled={loading}
                  className={`w-full px-3 py-2 text-sm rounded font-medium transition-colors disabled:opacity-50 ${
                    user.is_active 
                      ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  {user.is_active ? 'Deactivate User' : 'Activate User'}
                </button>
                <button
                  onClick={handleMaintenanceToggle}
                  disabled={loading}
                  className={`w-full px-3 py-2 text-sm rounded font-medium transition-colors disabled:opacity-50 ${
                    user.maintenance_access 
                      ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' 
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }`}
                >
                  {user.maintenance_access ? 'Revoke Maintenance' : 'Grant Maintenance'}
                </button>
                {user.role === 'student' && (
                  <button
                    onClick={handleCoreLeadershipToggle}
                    disabled={loading}
                    className={`w-full px-3 py-2 text-sm rounded font-medium transition-colors disabled:opacity-50 ${
                      user.is_core_leadership 
                        ? 'bg-purple-100 text-purple-800 hover:bg-purple-200' 
                        : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
                    }`}
                  >
                    {user.is_core_leadership ? 'Remove Core Leadership' : 'Grant Core Leadership'}
                  </button>
                )}
                <div className="pt-2 border-t border-gray-200">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    disabled={loading}
                    className="w-full px-3 py-2 text-sm rounded font-medium transition-colors disabled:opacity-50 bg-red-100 text-red-800 hover:bg-red-200 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete User
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information Form */}
          <div className="lg:col-span-2">
            {showGuardianEditor ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-impact text-swat-black">
                    EDIT {user?.role === 'student' ? 'GUARDIANS' : 'EMERGENCY CONTACTS'}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleGuardianCancel}
                      className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleGuardianSave}
                      disabled={loading}
                      className="px-3 py-1 text-sm bg-swat-green hover:bg-swat-green-dark text-white rounded transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {editingGuardians.map((guardian, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-swat-black">
                          {user?.role === 'student' ? 'Guardian' : 'Emergency Contact'} {index + 1}
                        </h4>
                        {editingGuardians.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeGuardian(index)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                          <input
                            type="email"
                            value={guardian.email || ''}
                            onChange={(e) => updateGuardian(index, 'email', e.target.value)}
                            placeholder="guardian@example.com"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                          <select
                            value={guardian.relationship || ''}
                            onChange={(e) => updateGuardian(index, 'relationship', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-transparent"
                          >
                            <option value="">Select relationship...</option>
                            {(user?.role === 'mentor' || user?.role === 'admin') && <option value="Spouse">Spouse</option>}
                            {(user?.role === 'mentor' || user?.role === 'admin') && <option value="Significant Other">Significant Other</option>}
                            {(user?.role === 'mentor' || user?.role === 'admin') && <option value="Friend">Friend</option>}
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
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={addGuardian}
                    className="flex items-center px-4 py-2 border border-swat-green text-swat-green hover:bg-swat-green hover:text-white rounded-md transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Another {user?.role === 'student' ? 'Guardian' : 'Emergency Contact'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="font-impact text-swat-black mb-4">CONTACT INFORMATION</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    maxLength={100}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    maxLength={100}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    maxLength={20}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    School Email
                  </label>
                  <input
                    type="email"
                    name="school_email"
                    value={formData.school_email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Food Allergies
                </label>
                <textarea
                  name="food_allergies"
                  value={formData.food_allergies}
                  onChange={handleChange}
                  rows={3}
                  maxLength={1000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical Conditions
                </label>
                <textarea
                  name="medical_conditions"
                  value={formData.medical_conditions}
                  onChange={handleChange}
                  rows={3}
                  maxLength={1000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-transparent"
                />
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
                  {loading ? 'Updating...' : 'Update Contact Information'}
                </button>
              </div>
            </form>
            )}
          </div>
        </div>
      </div>


      <DeleteUserModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onSuccess={handleDeleteSuccess}
        user={user}
      />
    </div>
  );
};

export default AdminEditUserModal;