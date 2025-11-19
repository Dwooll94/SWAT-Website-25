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

interface PublicStudent {
  id: string;
  first_name: string;
  last_name: string;
  graduation_year: number;
  primary_subteam_id?: number;
  primary_subteam_name?: string;
  is_captain: boolean;
  is_core_leadership: boolean;
  secondary_subteams: {
    id: number;
    name: string;
    is_captain: boolean;
  }[];
}

interface PublicRosterData {
  students: PublicStudent[];
  subteams: Subteam[];
}

const Roster: React.FC = () => {
  const { user } = useAuth();
  const [rosterData, setRosterData] = useState<PublicRosterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubteam, setSelectedSubteam] = useState<number | 'all'>('all');

  useEffect(() => {
    if (user) {
      fetchRosterData();
    }
  }, [user]);

  const fetchRosterData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/roster/public');
      setRosterData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load roster data');
    } finally {
      setLoading(false);
    }
  };

  const getStudentsBySubteam = () => {
    if (!rosterData) return [];
    
    if (selectedSubteam === 'all') {
      return rosterData.students;
    }
    
    return rosterData.students.filter(student => 
      student.primary_subteam_id === selectedSubteam
    );
  };

  const getStudentsWithoutSubteam = () => {
    if (!rosterData) return [];
    return rosterData.students.filter(student => !student.primary_subteam_id);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
          <p className="text-gray-600">
            Please sign in to view the team roster.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-swat-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading roster...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-impact text-swat-black mb-2">TEAM ROSTER</h1>
          <p className="text-gray-600 mb-6">
            Our current team members organized by subteam assignments.
          </p>

          {/* Subteam Filter */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Subteam
            </label>
            <select
              value={selectedSubteam}
              onChange={(e) => setSelectedSubteam(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
            >
              <option value="all">All Students ({rosterData?.students.length || 0})</option>
              {rosterData?.subteams
                .filter(subteam => subteam.is_primary && subteam.is_active)
                .sort((a, b) => a.display_order - b.display_order)
                .map((subteam) => (
                  <option key={subteam.id} value={subteam.id}>
                    {subteam.name} ({rosterData.students.filter(s => s.primary_subteam_id === subteam.id).length})
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Roster Display */}
        {selectedSubteam === 'all' ? (
          <div className="space-y-8">
            {/* Students by Subteam */}
            {rosterData?.subteams
              .filter(subteam => subteam.is_primary && subteam.is_active)
              .sort((a, b) => a.display_order - b.display_order)
              .map((subteam) => {
                const subteamStudents = rosterData.students.filter(s => s.primary_subteam_id === subteam.id);
                
                if (subteamStudents.length === 0) return null;

                return (
                  <div key={subteam.id} className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-impact text-swat-black mb-4 uppercase">
                      {subteam.name}
                    </h2>
                    {subteam.description && (
                      <p className="text-gray-600 mb-4">{subteam.description}</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {subteamStudents
                        .sort((a, b) => {
                          // Sort captains to the top first
                          if (a.is_captain && !b.is_captain) return -1;
                          if (!a.is_captain && b.is_captain) return 1;
                          // Then sort alphabetically by name
                          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
                        })
                        .map((student) => (
                          <div
                            key={student.id}
                            className="bg-gray-50 rounded-lg p-4 border-l-4 border-swat-green"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {student.first_name} {student.last_name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  Class of {student.graduation_year}
                                </p>
                              </div>
                              <div className="flex flex-col gap-1">
                                {student.is_captain && (
                                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                                    Captain
                                  </span>
                                )}
                                {student.is_core_leadership && (
                                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                                    Core
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}

            {/* Strategy Subteam (secondary subteam) */}
            {(() => {
              if (!rosterData) return null;

              const strategySubteam = rosterData.subteams.find(s => s.name.toLowerCase() === 'strategy' && s.is_active);
              if (!strategySubteam) return null;

              const strategyStudents = rosterData.students.filter(student =>
                student.secondary_subteams?.some(st => st.id === strategySubteam.id)
              );

              if (strategyStudents.length === 0) return null;

              return (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-impact text-swat-black mb-4 uppercase">
                    {strategySubteam.name}
                  </h2>
                  {strategySubteam.description && (
                    <p className="text-gray-600 mb-4">{strategySubteam.description}</p>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {strategyStudents
                      .sort((a, b) => {
                        // Sort captains to the top first
                        const aIsStrategyCaptain = a.secondary_subteams.find(st => st.id === strategySubteam.id)?.is_captain;
                        const bIsStrategyCaptain = b.secondary_subteams.find(st => st.id === strategySubteam.id)?.is_captain;
                        if (aIsStrategyCaptain && !bIsStrategyCaptain) return -1;
                        if (!aIsStrategyCaptain && bIsStrategyCaptain) return 1;
                        // Then sort alphabetically by name
                        return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
                      })
                      .map((student) => {
                        const strategyAssignment = student.secondary_subteams.find(st => st.id === strategySubteam.id);
                        return (
                          <div
                            key={student.id}
                            className="bg-gray-50 rounded-lg p-4 border-l-4 border-swat-green"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {student.first_name} {student.last_name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  Class of {student.graduation_year}
                                </p>
                              </div>
                              <div className="flex flex-col gap-1">
                                {strategyAssignment?.is_captain && (
                                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                                    Captain
                                  </span>
                                )}
                                {student.is_core_leadership && (
                                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                                    Core
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              );
            })()}

            {/* Students without subteam assignment */}
            {getStudentsWithoutSubteam().length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-impact text-swat-black mb-4">
                  UNASSIGNED STUDENTS
                </h2>
                <p className="text-gray-600 mb-4">Students who haven't been assigned to a primary subteam yet.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getStudentsWithoutSubteam()
                    .sort((a, b) => `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`))
                    .map((student) => (
                      <div
                        key={student.id}
                        className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-400"
                      >
                        <h3 className="font-semibold text-gray-900">
                          {student.first_name} {student.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Class of {student.graduation_year}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Single Subteam View */
          <div className="bg-white rounded-lg shadow-md p-6">
            {(() => {
              const subteam = rosterData?.subteams.find(s => s.id === selectedSubteam);
              const students = getStudentsBySubteam();
              
              return (
                <>
                  <h2 className="text-2xl font-impact text-swat-black mb-4 uppercase">
                    {subteam?.name || 'Unknown Subteam'}
                  </h2>
                  {subteam?.description && (
                    <p className="text-gray-600 mb-6">{subteam.description}</p>
                  )}
                  
                  {students.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {students
                        .sort((a, b) => {
                          // Sort captains to the top first
                          if (a.is_captain && !b.is_captain) return -1;
                          if (!a.is_captain && b.is_captain) return 1;
                          // Then sort alphabetically by name
                          return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
                        })
                        .map((student) => (
                          <div
                            key={student.id}
                            className="bg-gray-50 rounded-lg p-4 border-l-4 border-swat-green"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {student.first_name} {student.last_name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  Class of {student.graduation_year}
                                </p>
                              </div>
                              <div className="flex flex-col gap-1">
                                {student.is_captain && (
                                  <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                                    Captain
                                  </span>
                                )}
                                {student.is_core_leadership && (
                                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                                    Core
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      No students assigned to this subteam yet.
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Team Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Team Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-swat-black text-white rounded-lg p-4">
              <div className="text-2xl font-impact text-swat-green">
                {rosterData?.students.length || 0}
              </div>
              <div className="text-sm">Total Members</div>
            </div>
            <div className="bg-swat-black text-white rounded-lg p-4">
              <div className="text-2xl font-impact text-swat-green">
                {rosterData?.subteams.filter(s => s.is_primary && s.is_active).length || 0}
              </div>
              <div className="text-sm">Active Subteams</div>
            </div>
            <div className="bg-swat-black text-white rounded-lg p-4">
              <div className="text-2xl font-impact text-swat-green">
                {rosterData?.students.filter(s => s.is_captain).length || 0}
              </div>
              <div className="text-sm">Team Captains</div>
            </div>
            <div className="bg-swat-black text-white rounded-lg p-4">
              <div className="text-2xl font-impact text-swat-green">
                {rosterData?.students.filter(s => s.primary_subteam_id).length || 0}
              </div>
              <div className="text-sm">Assigned Members</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Roster;