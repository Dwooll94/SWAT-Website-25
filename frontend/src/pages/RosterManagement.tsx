import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../contexts/AuthContext';

interface Subteam {
  id: number;
  name: string;
  description?: string;
  is_primary: boolean;
  display_order: number;
  is_active: boolean;
}

interface StudentWithSubteams {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  graduation_year: number;
  primary_subteam?: {
    id: number;
    name: string;
    is_captain: boolean;
  };
  secondary_subteams: {
    id: number;
    name: string;
    is_captain: boolean;
  }[];
  preferences: {
    id: number;
    name: string;
    preference_rank: number;
  }[];
}

interface RosterData {
  students: StudentWithSubteams[];
  subteams: Subteam[];
}

const RosterManagement: React.FC = () => {
  const { user } = useAuth();
  const [rosterData, setRosterData] = useState<RosterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentWithSubteams | null>(null);
  const [assignmentForm, setAssignmentForm] = useState({
    subteam_id: '',
    is_primary: false,
    is_captain: false
  });

  const hasAccess = user?.maintenance_access || user?.role === 'mentor' || user?.role === 'admin';

  useEffect(() => {
    if (hasAccess) {
      fetchRosterData();
    }
  }, [hasAccess]);

  const fetchRosterData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/roster/management');
      setRosterData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load roster data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !assignmentForm.subteam_id) return;

    try {
      setLoading(true);
      setError('');
      
      await api.post('/roster/assign', {
        student_id: selectedStudent.id,
        subteam_id: parseInt(assignmentForm.subteam_id),
        is_primary: assignmentForm.is_primary,
        is_captain: assignmentForm.is_captain
      });

      setSuccessMessage(`${selectedStudent.first_name} ${selectedStudent.last_name} assigned successfully!`);
      setSelectedStudent(null);
      setAssignmentForm({
        subteam_id: '',
        is_primary: false,
        is_captain: false
      });
      fetchRosterData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign student');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (studentId: string, subteamId: number) => {
    if (!window.confirm('Are you sure you want to remove this student from this subteam?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete('/roster/assign', {
        data: {
          student_id: studentId,
          subteam_id: subteamId
        }
      });
      setSuccessMessage('Student removed from subteam successfully!');
      fetchRosterData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove student');
    } finally {
      setLoading(false);
    }
  };

  const openAssignmentModal = (student: StudentWithSubteams) => {
    setSelectedStudent(student);
    setAssignmentForm({
      subteam_id: '',
      is_primary: false,
      is_captain: false
    });
    setError('');
    setSuccessMessage('');
  };

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">
            You need core leadership, mentor, or admin access to view roster management.
          </p>
        </div>
      </div>
    );
  }

  if (loading && !rosterData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-swat-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading roster data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-impact text-swat-black mb-2">ROSTER MANAGEMENT</h1>
          <p className="text-gray-600 mb-6">
            Manage student subteam assignments and view preferences. Assign students to primary and secondary subteams.
          </p>

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

          {/* Students Grid */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Students ({rosterData?.students.length || 0})</h2>
            
            {rosterData?.students && rosterData.students.length > 0 ? (
              <div className="grid gap-4">
                {rosterData.students
                  .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`))
                  .map((student) => (
                    <div key={student.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">
                            {student.first_name} {student.last_name}
                          </h3>
                          <p className="text-sm text-gray-600">{student.email}</p>
                          <p className="text-sm text-gray-500">Class of {student.graduation_year}</p>
                        </div>
                        <button
                          onClick={() => openAssignmentModal(student)}
                          className="bg-swat-green text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors"
                        >
                          Assign Subteam
                        </button>
                      </div>

                      {/* Current Assignments */}
                      <div className="grid md:grid-cols-3 gap-4 text-sm">
                        {/* Primary Subteam */}
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Primary Subteam</h4>
                          {student.primary_subteam ? (
                            <div className="bg-blue-50 border border-blue-200 rounded p-2 flex justify-between items-center">
                              <div>
                                <span className="font-medium">{student.primary_subteam.name}</span>
                                {student.primary_subteam.is_captain && (
                                  <span className="ml-2 bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded text-xs">
                                    Captain
                                  </span>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveAssignment(student.id, student.primary_subteam!.id)}
                                className="text-red-500 hover:text-red-700 text-xs"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="text-gray-500 italic">Not assigned</div>
                          )}
                        </div>

                        {/* Secondary Subteams */}
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Secondary Subteams</h4>
                          {student.secondary_subteams.length > 0 ? (
                            <div className="space-y-1">
                              {student.secondary_subteams.map((subteam) => (
                                <div key={subteam.id} className="bg-gray-50 border border-gray-200 rounded p-2 flex justify-between items-center">
                                  <div>
                                    <span className="font-medium">{subteam.name}</span>
                                    {subteam.is_captain && (
                                      <span className="ml-2 bg-yellow-100 text-yellow-800 px-1 py-0.5 rounded text-xs">
                                        Captain
                                      </span>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => handleRemoveAssignment(student.id, subteam.id)}
                                    className="text-red-500 hover:text-red-700 text-xs"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-gray-500 italic">None</div>
                          )}
                        </div>

                        {/* Preferences */}
                        <div>
                          <h4 className="font-medium text-gray-800 mb-2">Preferences</h4>
                          {student.preferences.length > 0 ? (
                            <div className="space-y-1">
                              {student.preferences
                                .sort((a, b) => a.preference_rank - b.preference_rank)
                                .map((pref, index) => (
                                  <div key={pref.id} className="text-gray-600">
                                    <span className="font-medium">#{index + 1}:</span> {pref.name}
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <div className="text-gray-500 italic">No preferences set</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                No students found.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              Assign {selectedStudent.first_name} {selectedStudent.last_name}
            </h3>
            
            <form onSubmit={handleAssignStudent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Subteam
                </label>
                <select
                  value={assignmentForm.subteam_id}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, subteam_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                  required
                >
                  <option value="">Choose a subteam...</option>
                  {rosterData?.subteams.map((subteam) => (
                    <option key={subteam.id} value={subteam.id}>
                      {subteam.name} ({subteam.is_primary ? 'Primary' : 'Secondary'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={assignmentForm.is_primary}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, is_primary: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Primary assignment (replaces existing primary)</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={assignmentForm.is_captain}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, is_captain: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Captain role</span>
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-swat-green text-white px-4 py-2 rounded-md hover:bg-green-600 font-medium disabled:opacity-50"
                >
                  {loading ? 'Assigning...' : 'Assign'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RosterManagement;