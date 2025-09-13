import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../contexts/AuthContext';
import ChangePasswordModal from '../components/ChangePasswordModal';
import EditContactInfoModal from '../components/EditContactInfoModal';
import EditGuardianModal from '../components/EditGuardianModal';
import DeactivateAccountModal from '../components/DeactivateAccountModal';

interface Guardian {
  id?: number;
  name: string;
  email?: string;
  phone?: string;
  relationship?: string;
}

interface UserProfile {
  id: string;
  email: string;
  school_email?: string;
  role: string;
  registration_status: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  graduation_year?: number;
  gender?: string;
  food_allergies?: string;
  medical_conditions?: string;
  heard_about_team?: string;
  maintenance_access: boolean;
  subteamPreferences: any[];
  guardians: Guardian[];
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [showEditGuardianModal, setShowEditGuardianModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setProfile(response.data);
    } catch (err: any) {
      setError('Failed to load profile information');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChangeSuccess = () => {
    setSuccessMessage('Password changed successfully!');
    setTimeout(() => setSuccessMessage(''), 5000);
  };

  const handleContactInfoUpdateSuccess = () => {
    setSuccessMessage('Contact information updated successfully!');
    setTimeout(() => setSuccessMessage(''), 5000);
    // Refresh profile data
    fetchProfile();
  };

  const handleGuardianInfoUpdateSuccess = () => {
    setSuccessMessage('Guardian information updated successfully!');
    setTimeout(() => setSuccessMessage(''), 5000);
    // Refresh profile data
    fetchProfile();
  };

  const handleAccountDeactivationSuccess = () => {
    // Redirect to login page after successful deactivation
    // This will effectively log out the user since their account is now inactive
    window.location.href = '/login?message=account_deactivated';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const isEmergencyContact = profile.role === 'mentor' || profile.role === 'admin';
  const contactLabel = isEmergencyContact ? 'Emergency Contact' : 'Guardian';
  const contactsLabel = isEmergencyContact ? 'Emergency Contacts' : 'Guardians';

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
    <div className="bg-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-impact swat-title text-swat-black mb-4">
            MY PROFILE
          </h1>
          <p className="text-lg text-gray-700">
            View and manage your account information
          </p>
        </div>

        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {successMessage}
          </div>
        )}

        <div className="bg-gray-100 rounded-lg p-8 border-l-4 border-swat-green">
          {/* Account Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-impact text-swat-black mb-6">ACCOUNT INFORMATION</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="bg-white p-3 rounded border">{profile.email}</div>
              </div>
              {profile.school_email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Email</label>
                  <div className="bg-white p-3 rounded border">{profile.school_email}</div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <div className="bg-white p-3 rounded border">{formatRole(profile.role)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Registration Status</label>
                <div className="bg-white p-3 rounded border">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    profile.registration_status === 'complete' 
                      ? 'bg-green-100 text-green-800' 
                      : profile.registration_status === 'contract_signed'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {formatRegistrationStatus(profile.registration_status)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setShowEditContactModal(true)}
                className="bg-swat-green hover:bg-swat-green-dark text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                Edit Contact Info
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="bg-swat-green hover:bg-swat-green-dark text-white px-6 py-2 rounded-md font-medium transition-colors"
              >
                Change Password
              </button>
            </div>
          </div>

          {/* Personal Information */}
          <div className="mb-8">
            <h2 className="text-2xl font-impact text-swat-black mb-6">PERSONAL INFORMATION</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {profile.first_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <div className="bg-white p-3 rounded border">{profile.first_name}</div>
                </div>
              )}
              {profile.last_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <div className="bg-white p-3 rounded border">{profile.last_name}</div>
                </div>
              )}
              {profile.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <div className="bg-white p-3 rounded border">{profile.phone}</div>
                </div>
              )}
              {profile.graduation_year && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year</label>
                  <div className="bg-white p-3 rounded border">{profile.graduation_year}</div>
                </div>
              )}
              {profile.gender && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <div className="bg-white p-3 rounded border">
                    {profile.gender.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information */}
          {(profile.food_allergies || profile.medical_conditions || profile.heard_about_team) && (
            <div className="mb-8">
              <h2 className="text-2xl font-impact text-swat-black mb-6">ADDITIONAL INFORMATION</h2>
              <div className="space-y-6">
                {profile.food_allergies && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Food Allergies</label>
                    <div className="bg-white p-3 rounded border">{profile.food_allergies}</div>
                  </div>
                )}
                {profile.medical_conditions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medical Conditions</label>
                    <div className="bg-white p-3 rounded border">{profile.medical_conditions}</div>
                  </div>
                )}
                {profile.heard_about_team && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">How did you hear about our team?</label>
                    <div className="bg-white p-3 rounded border">{profile.heard_about_team}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Guardian/Emergency Contact Information */}
          {profile.guardians && profile.guardians.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-impact text-swat-black">{contactsLabel.toUpperCase()} INFORMATION</h2>
                <button
                  onClick={() => setShowEditGuardianModal(true)}
                  className="bg-swat-green hover:bg-swat-green-dark text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Edit {contactsLabel}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.guardians.map((guardian, index) => (
                  <div key={guardian.id || index} className="bg-white p-4 rounded border">
                    <h3 className="font-medium text-gray-900 mb-2">
                      {guardian.relationship ? `${guardian.relationship}: ${guardian.name}` : guardian.name}
                    </h3>
                    {guardian.email && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Email:</span> {guardian.email}
                      </p>
                    )}
                    {guardian.phone && (
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Phone:</span> {guardian.phone}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Guardian/Emergency Contact Information if none exists */}
          {(!profile.guardians || profile.guardians.length === 0) && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-impact text-swat-black">{contactsLabel.toUpperCase()} INFORMATION</h2>
                <button
                  onClick={() => setShowEditGuardianModal(true)}
                  className="bg-swat-green hover:bg-swat-green-dark text-white px-4 py-2 rounded-md font-medium transition-colors"
                >
                  Add {contactsLabel}
                </button>
              </div>
              <div className="bg-yellow-50 border border-yellow-300 rounded-md p-4">
                <div className="flex">
                  <svg className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">{contactLabel} Information {isEmergencyContact? "Recommended": "Required"}</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Please add at least one {contactLabel.toLowerCase()}{isEmergencyContact? "." :" contact for emergency purposes and team communications."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin/Mentor Access */}
          {(profile.role === 'admin' || profile.role === 'mentor') && (
            <div className="mb-8">
              <h2 className="text-2xl font-impact text-swat-black mb-6">ACCESS PERMISSIONS</h2>
              <div className="bg-white p-4 rounded border">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-700">Maintenance Access:</span>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    profile.maintenance_access 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {profile.maintenance_access ? 'Granted' : 'Denied'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Account Management Section */}
        {profile.role !== 'admin' && (
          <div className="mt-8 bg-gray-50 rounded-lg p-6 border-l-4 border-orange-400">
            <h2 className="text-xl font-impact text-gray-900 mb-4">ACCOUNT MANAGEMENT</h2>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Deactivate Account</h3>
                <p className="text-sm text-gray-600 mb-4">
                  If you need to temporarily step away from the team, you can deactivate your account. 
                  Contact an administrator to reactivate it when you're ready to return.
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-4">
                  <div className="flex">
                    <svg className="w-4 h-4 text-orange-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs text-orange-700">
                      Deactivation will prevent you from logging in, but your data will be preserved.
                    </p>
                  </div>
                </div>
              </div>
              <div className="ml-6">
                <button
                  onClick={() => setShowDeactivateModal(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Deactivate Account
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need to update your information? Contact a team mentor or administrator.
          </p>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={handlePasswordChangeSuccess}
      />

      <EditContactInfoModal
        isOpen={showEditContactModal}
        onClose={() => setShowEditContactModal(false)}
        onSuccess={handleContactInfoUpdateSuccess}
        currentInfo={{
          first_name: profile?.first_name,
          last_name: profile?.last_name,
          phone: profile?.phone,
          school_email: profile?.school_email,
          food_allergies: profile?.food_allergies,
          medical_conditions: profile?.medical_conditions
        }}
      />

      <EditGuardianModal
        isOpen={showEditGuardianModal}
        onClose={() => setShowEditGuardianModal(false)}
        onSuccess={handleGuardianInfoUpdateSuccess}
        currentGuardians={profile?.guardians || []}
        userRole={profile?.role}
      />

      <DeactivateAccountModal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        onSuccess={handleAccountDeactivationSuccess}
        userRole={profile?.role || ''}
        userName={`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim()}
      />
    </div>
  );
};

export default Profile;