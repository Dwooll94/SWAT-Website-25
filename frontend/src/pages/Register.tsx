import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../contexts/AuthContext';

interface Subteam {
  id: number;
  name: string;
  description: string;
  is_primary: boolean;
  display_order: number;
}

interface Guardian {
  name: string;
  email: string;
  phone: string;
  relationship: string;
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    school_email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    graduation_year: '',
    gender: '',
    phone: '',
    food_allergies: '',
    medical_conditions: '',
    heard_about_team: ''
  });
  
  const [guardians, setGuardians] = useState<Guardian[]>([{ name: '', email: '', phone: '', relationship: '' }]);
  const [subteams, setSubteams] = useState<Subteam[]>([]);
  const [primarySubteamPrefs, setPrimarySubteamPrefs] = useState<{ [key: number]: number }>({});
  const [secondarySubteamPrefs, setSecondarySubteamPrefs] = useState<{ [key: number]: boolean }>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const { register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSubteams = async () => {
      try {
        const response = await api.get('/subteams');
        setSubteams(response.data);
      } catch (error) {
        console.error('Failed to fetch subteams:', error);
      }
    };
    fetchSubteams();
  }, []);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGuardianChange = (index: number, field: keyof Guardian, value: string) => {
    const newGuardians = [...guardians];
    newGuardians[index] = { ...newGuardians[index], [field]: value };
    setGuardians(newGuardians);
  };

  const addGuardian = () => {
    if (guardians.length < 2) {
      setGuardians([...guardians, { name: '', email: '', phone: '', relationship: '' }]);
    }
  };

  const removeGuardian = (index: number) => {
    if (guardians.length > 1) {
      setGuardians(guardians.filter((_, i) => i !== index));
    }
  };

  const handleSubteamRankChange = (subteamId: number, rank: number) => {
    const newPrefs = { ...primarySubteamPrefs };
    
    Object.keys(newPrefs).forEach(key => {
      if (newPrefs[parseInt(key)] === rank) {
        delete newPrefs[parseInt(key)];
      }
    });
    
    if (rank > 0) {
      newPrefs[subteamId] = rank;
    }
    
    setPrimarySubteamPrefs(newPrefs);
  };

  const handleSecondarySubteamChange = (subteamId: number, interested: boolean) => {
    setSecondarySubteamPrefs(prev => ({
      ...prev,
      [subteamId]: interested
    }));
  };

  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all required fields');
      return false;
    }
    
    if (!formData.email && !formData.school_email) {
      setError('At least one email address is required');
      return false;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    return true;
  };

  const validateStep2 = () => {
    const primarySubteamCount = Object.keys(primarySubteamPrefs).length;
    const primarySubteams = subteams.filter(s => s.is_primary);
    
    if (primarySubteamCount !== primarySubteams.length) {
      setError('Please rank all primary subteams');
      return false;
    }
    
    return true;
  };

  const handleNext = () => {
    setError('');
    
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const subteam_preferences = [
        ...Object.entries(primarySubteamPrefs).map(([subteam_id, rank]) => ({
          subteam_id: parseInt(subteam_id),
          preference_rank: rank,
          is_interested: true
        })),
        ...Object.entries(secondarySubteamPrefs).map(([subteam_id, interested]) => ({
          subteam_id: parseInt(subteam_id),
          preference_rank: 0,
          is_interested: interested
        }))
      ];

      const validGuardians = guardians.filter(g => g.name.trim() !== '');

      const userData = {
        ...formData,
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : undefined,
        gender: formData.gender as 'male' | 'female' | 'non_binary' | 'prefer_not_to_say' | undefined,
        subteam_preferences,
        guardians: validGuardians
      };

      await register(userData);
      navigate('/profile');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const primarySubteams = subteams.filter(s => s.is_primary);
  const secondarySubteams = subteams.filter(s => !s.is_primary);

  return (
    <div className="min-h-[60vh] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Join SWAT Team 1806
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Step {step} of 3 - Complete your registration
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 rounded-md p-4 mb-6">
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Personal Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  School Email Address (optional)
                </label>
                <input
                  type="email"
                  name="school_email"
                  value={formData.school_email}
                  onChange={handleInputChange}
                  placeholder="@smithville.k12.mo.us"
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    name="graduation_year"
                    min="2025"
                    max="2035"
                    value={formData.graduation_year}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non_binary">Non-binary</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Subteam Preferences</h3>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-4">
                  Primary Subteams (Please rank 1-{primarySubteams.length})
                </h4>
                <div className="space-y-3">
                  {primarySubteams.map((subteam) => (
                    <div key={subteam.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h5 className="font-medium text-gray-900">{subteam.name}</h5>
                          <p className="text-sm text-gray-600 mt-1">{subteam.description}</p>
                        </div>
                        <select
                          value={primarySubteamPrefs[subteam.id] || ''}
                          onChange={(e) => handleSubteamRankChange(subteam.id, parseInt(e.target.value) || 0)}
                          className="ml-4 border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="">Rank</option>
                          {Array.from({ length: primarySubteams.length }, (_, i) => (
                            <option key={i + 1} value={i + 1}>{i + 1}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {secondarySubteams.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-4">
                    Secondary Subteams (Optional)
                  </h4>
                  <div className="space-y-3">
                    {secondarySubteams.map((subteam) => (
                      <div key={subteam.id} className="border rounded-md p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900">{subteam.name}</h5>
                            <p className="text-sm text-gray-600 mt-1">{subteam.description}</p>
                          </div>
                          <label className="flex items-center ml-4">
                            <input
                              type="checkbox"
                              checked={secondarySubteamPrefs[subteam.id] || false}
                              onChange={(e) => handleSecondarySubteamChange(subteam.id, e.target.checked)}
                              className="mr-2"
                            />
                            Interested
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md font-medium"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Where did you hear about our team?
                  </label>
                  <textarea
                    name="heard_about_team"
                    value={formData.heard_about_team}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Food Allergies
                  </label>
                  <textarea
                    name="food_allergies"
                    value={formData.food_allergies}
                    onChange={handleInputChange}
                    rows={2}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Medical Conditions or Accommodations
                  </label>
                  <textarea
                    name="medical_conditions"
                    value={formData.medical_conditions}
                    onChange={handleInputChange}
                    rows={2}
                    placeholder="Any physical or mental conditions relevant for reasonable accommodation or funding purposes"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">Legal Guardian Information</h4>
                    {guardians.length < 2 && (
                      <button
                        type="button"
                        onClick={addGuardian}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        + Add Guardian
                      </button>
                    )}
                  </div>
                  
                  {guardians.map((guardian, index) => (
                    <div key={index} className="border rounded-md p-4 mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="font-medium text-gray-700">Guardian {index + 1}</h5>
                        {guardians.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeGuardian(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Name
                          </label>
                          <input
                            type="text"
                            value={guardian.name}
                            onChange={(e) => handleGuardianChange(index, 'name', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Relationship
                          </label>
                          <input
                            type="text"
                            value={guardian.relationship}
                            onChange={(e) => handleGuardianChange(index, 'relationship', e.target.value)}
                            placeholder="e.g., Parent, Guardian"
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <input
                            type="email"
                            value={guardian.email}
                            onChange={(e) => handleGuardianChange(index, 'email', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={guardian.phone}
                            onChange={(e) => handleGuardianChange(index, 'phone', e.target.value)}
                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md font-medium"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50"
                  >
                    {loading ? 'Creating Account...' : 'Complete Registration'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;