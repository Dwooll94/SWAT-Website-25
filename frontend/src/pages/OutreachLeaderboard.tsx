import React, { useState, useEffect } from 'react';
import { useAuth, api } from '../contexts/AuthContext';

interface LeaderboardEntry {
  user_id: string;
  first_name: string;
  last_name: string;
  graduation_year: number;
  years_on_team: number;
  total_points: number;
  events_organized: number;
  events_assisted: number;
  requirements_met: boolean;
  is_new_student: boolean;
  points_needed: number;
  events_needed: number;
}

interface OutreachEvent {
  id: number;
  event_name: string;
  event_date: string;
  event_description?: string;
  hours_length?: number;
  created_by_name: string;
  created_at: string;
  participant_count: number;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  graduation_year: number;
}

interface Participant {
  id: number;
  user_id: string;
  first_name: string;
  last_name: string;
  participation_type: 'organizer' | 'assistant';
  points_awarded: number;
  notes?: string;
}

const OutreachLeaderboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'logging'>('leaderboard');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [events, setEvents] = useState<OutreachEvent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Event creation/edit form
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null);
  const [eventForm, setEventForm] = useState({
    event_name: '',
    event_date: '',
    event_description: '',
    hours_length: ''
  });

  // Participant form
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showParticipantForm, setShowParticipantForm] = useState(false);
  const [participantForm, setParticipantForm] = useState({
    student_id: '',
    participation_type: 'assistant' as 'organizer' | 'assistant',
    notes: ''
  });

  const hasLoggingAccess = user?.maintenance_access || user?.role === 'mentor' || user?.role === 'admin';

  // Calculate point multiplier based on event duration
  const calculateMultiplier = (hoursLength: number | null | undefined): number => {
    if (!hoursLength) return 1;
    return Math.floor(hoursLength / 4) + 1;
  };

  // Get the currently selected event
  const currentEvent = events.find(e => e.id === selectedEvent);
  const currentMultiplier = calculateMultiplier(currentEvent?.hours_length);

  useEffect(() => {
    fetchLeaderboard();
    if (hasLoggingAccess) {
      fetchEvents();
      fetchStudents();
    }
  }, [hasLoggingAccess]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/outreach/leaderboard');
      setLeaderboard(response.data.leaderboard);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await api.get('/outreach/events');
      setEvents(response.data.events);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load events');
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get('/outreach/students');
      setStudents(response.data.students);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load students');
    }
  };

  const fetchParticipants = async (eventId: number) => {
    try {
      const response = await api.get(`/outreach/events/${eventId}/participants`);
      setParticipants(response.data.participants);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load participants');
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      if (editingEventId) {
        // Update existing event
        const response = await api.put(`/outreach/events/${editingEventId}`, {
          ...eventForm,
          hours_length: eventForm.hours_length ? parseFloat(eventForm.hours_length) : null
        });

        setSuccessMessage(
          response.data.pointsRecalculated
            ? 'Event updated successfully! Participant points recalculated.'
            : 'Event updated successfully!'
        );
      } else {
        // Create new event
        await api.post('/outreach/events', {
          ...eventForm,
          hours_length: eventForm.hours_length ? parseFloat(eventForm.hours_length) : null
        });

        setSuccessMessage('Event created successfully!');
      }

      setShowEventForm(false);
      setEditingEventId(null);
      setEventForm({ event_name: '', event_date: '', event_description: '', hours_length: '' });
      fetchEvents();
      fetchLeaderboard();

      // If we were editing the selected event, refresh participants
      if (editingEventId && editingEventId === selectedEvent) {
        fetchParticipants(editingEventId);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${editingEventId ? 'update' : 'create'} event`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEvent = (event: OutreachEvent) => {
    setEditingEventId(event.id);
    setEventForm({
      event_name: event.event_name,
      event_date: event.event_date.split('T')[0], // Format date for input
      event_description: event.event_description || '',
      hours_length: event.hours_length?.toString() || ''
    });
    setShowEventForm(true);
  };

  const handleCancelEventForm = () => {
    setShowEventForm(false);
    setEditingEventId(null);
    setEventForm({ event_name: '', event_date: '', event_description: '', hours_length: '' });
  };

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      setLoading(true);
      setError('');

      await api.post(`/outreach/events/${selectedEvent}/participants`, participantForm);

      setSuccessMessage('Participant added successfully!');
      setShowParticipantForm(false);
      setParticipantForm({ student_id: '', participation_type: 'assistant', notes: '' });
      fetchParticipants(selectedEvent);
      fetchLeaderboard();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add participant');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveParticipant = async (eventId: number, participationId: number) => {
    if (!window.confirm('Are you sure you want to remove this participant?')) return;

    try {
      setLoading(true);
      await api.delete(`/outreach/events/${eventId}/participants/${participationId}`);
      setSuccessMessage('Participant removed successfully!');
      fetchParticipants(eventId);
      fetchLeaderboard();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove participant');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!window.confirm('Are you sure you want to delete this event? All participant records will also be deleted.')) return;

    try {
      setLoading(true);
      await api.delete(`/outreach/events/${eventId}`);
      setSuccessMessage('Event deleted successfully!');
      if (selectedEvent === eventId) {
        setSelectedEvent(null);
        setParticipants([]);
      }
      fetchEvents();
      fetchLeaderboard();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete event');
    } finally {
      setLoading(false);
    }
  };

  const selectEvent = (eventId: number) => {
    setSelectedEvent(eventId);
    fetchParticipants(eventId);
  };

  const handleResetLeaderboard = async () => {
    if (!window.confirm(
      '⚠️ WARNING: This will permanently delete ALL outreach events and participation records.\n\n' +
      'This action CANNOT be undone!\n\n' +
      'Are you absolutely sure you want to reset the entire outreach leaderboard?'
    )) {
      return;
    }

    // Second confirmation
    if (!window.confirm(
      'This is your final confirmation.\n\n' +
      'Type YES in the next prompt to proceed with deleting all outreach data.'
    )) {
      return;
    }

    const confirmation = window.prompt('Type YES in all caps to confirm deletion:');
    if (confirmation !== 'YES') {
      setError('Reset cancelled. You must type YES to confirm.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await api.post('/outreach/reset-leaderboard');
      setSuccessMessage('Outreach leaderboard has been completely reset!');
      setSelectedEvent(null);
      setParticipants([]);
      fetchEvents();
      fetchLeaderboard();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading && leaderboard.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-swat-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-impact text-swat-black mb-2">OUTREACH LEADERBOARD</h1>
          <p className="text-gray-600 mb-6">
            Track outreach participation and requirements. New students need 10 points, returning students need 18 points + organize 1 event.
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

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`${
                  activeTab === 'leaderboard'
                    ? 'border-swat-green text-swat-green'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                Leaderboard
              </button>
              {hasLoggingAccess && (
                <button
                  onClick={() => setActiveTab('logging')}
                  className={`${
                    activeTab === 'logging'
                      ? 'border-swat-green text-swat-green'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  Event Logging
                </button>
              )}
            </nav>
          </div>

          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Requirements & Point System</h3>
                <ul className="text-sm text-gray-700 space-y-1 mb-3">
                  <li>• <strong>New Students (YOT ≤ 1):</strong> 10 points</li>
                  <li>• <strong>Returning Students (YOT &gt; 1):</strong> 18 points + organize 1 event</li>
                </ul>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">Base Points:</h4>
                <ul className="text-sm text-gray-700 space-y-1 mb-3">
                  <li>• <strong>Organizing an event:</strong> 8 points</li>
                  <li>• <strong>Assisting at an event:</strong> 5 points</li>
                </ul>
                <h4 className="font-semibold text-gray-900 mb-1 text-sm">Duration Multiplier:</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Points are multiplied based on event duration</li>
                  <li>• <strong>Formula:</strong> multiplier = floor(hours / 4) + 1</li>
                  <li>• <strong>Examples:</strong> 3.99h = 1×, 4h = 2×, 8h = 3×, 12h = 4×</li>
                  <li className="text-xs text-gray-600 italic mt-1">See section 4.2 of Student Handbook for details</li>
                </ul>
              </div>

              {leaderboard.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Class
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          YOT
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Points
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Organized
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Assisted
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leaderboard.map((entry, index) => {
                        // Calculate rank considering ties
                        let rank = 1;
                        for (let i = 0; i < index; i++) {
                          if (leaderboard[i].total_points !== entry.total_points) {
                            rank = i + 2; // +2 because we want rank after all previous different scores
                          }
                        }

                        // Determine if this is truly rank 1 or rank 2 for medal display
                        const actualRank = index === 0 ? 1 :
                                          (leaderboard[0].total_points === entry.total_points ? 1 :
                                           (index === 1 || (index > 1 && leaderboard[1].total_points === entry.total_points) ? 2 : rank));

                        const isFirstPlace = actualRank === 1;
                        const isSecondPlace = actualRank === 2 && leaderboard[0].total_points !== entry.total_points;

                        return (
                          <tr key={entry.user_id} className={isFirstPlace ? 'bg-yellow-50' : isSecondPlace ? 'bg-gray-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {isFirstPlace ? '🏆' : isSecondPlace ? '🥈' : rank}
                            </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {entry.first_name} {entry.last_name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.graduation_year}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.years_on_team}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-semibold text-swat-green">
                              {entry.total_points}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.events_organized}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {entry.events_assisted}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {entry.requirements_met ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Complete
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                {entry.points_needed > 0 && `${entry.points_needed} pts`}
                                {entry.points_needed > 0 && entry.events_needed > 0 && ', '}
                                {entry.events_needed > 0 && `${entry.events_needed} event`}
                              </span>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No leaderboard data available.
                </div>
              )}
            </div>
          )}

          {/* Event Logging Tab */}
          {activeTab === 'logging' && hasLoggingAccess && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Outreach Events</h2>
                <div className="flex gap-2">
                  {user?.role === 'admin' && (
                    <button
                      onClick={handleResetLeaderboard}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                      disabled={loading}
                    >
                      Reset Leaderboard
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (showEventForm) {
                        handleCancelEventForm();
                      } else {
                        setShowEventForm(true);
                      }
                    }}
                    className="bg-swat-green text-white px-4 py-2 rounded hover:bg-green-600 transition-colors"
                  >
                    {showEventForm ? 'Cancel' : 'Create Event'}
                  </button>
                </div>
              </div>

              {/* Event Creation/Edit Form */}
              {showEventForm && (
                <form onSubmit={handleCreateEvent} className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">
                    {editingEventId ? 'Edit Event' : 'Create New Event'}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={eventForm.event_name}
                        onChange={(e) => setEventForm({ ...eventForm, event_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={eventForm.event_date}
                        onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={eventForm.event_description}
                      onChange={(e) => setEventForm({ ...eventForm, event_description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                      rows={3}
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duration (hours)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={eventForm.hours_length}
                      onChange={(e) => setEventForm({ ...eventForm, hours_length: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                      placeholder="e.g., 2.5"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-swat-green text-white px-4 py-2 rounded hover:bg-green-600 font-medium disabled:opacity-50"
                  >
                    {loading ? (editingEventId ? 'Updating...' : 'Creating...') : (editingEventId ? 'Update Event' : 'Create Event')}
                  </button>
                </form>
              )}

              {/* Events List */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Events Column */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Events ({events.length})</h3>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-shadow ${
                          selectedEvent === event.id
                            ? 'border-swat-green bg-green-50'
                            : 'border-gray-200 hover:shadow-md'
                        }`}
                        onClick={() => selectEvent(event.id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{event.event_name}</h4>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditEvent(event);
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(event.id);
                              }}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {new Date(event.event_date).toLocaleDateString()}
                        </p>
                        {event.hours_length && (
                          <p className="text-sm text-gray-500 mb-1">
                            {event.hours_length} hours
                            {event.hours_length >= 4 && (
                              <span className="ml-1 text-swat-green font-medium">
                                ({calculateMultiplier(event.hours_length)}× points)
                              </span>
                            )}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          {event.participant_count} participant{event.participant_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Participants Column */}
                <div>
                  {selectedEvent ? (
                    <>
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-semibold text-gray-900">Participants</h3>
                        <button
                          onClick={() => setShowParticipantForm(!showParticipantForm)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        >
                          {showParticipantForm ? 'Cancel' : 'Add Participant'}
                        </button>
                      </div>

                      {/* Add Participant Form */}
                      {showParticipantForm && (
                        <form onSubmit={handleAddParticipant} className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Student <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={participantForm.student_id}
                              onChange={(e) => setParticipantForm({ ...participantForm, student_id: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                              required
                            >
                              <option value="">Select a student...</option>
                              {students.map((student) => (
                                <option key={student.id} value={student.id}>
                                  {student.first_name} {student.last_name} ({student.graduation_year})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Participation Type <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={participantForm.participation_type}
                              onChange={(e) =>
                                setParticipantForm({
                                  ...participantForm,
                                  participation_type: e.target.value as 'organizer' | 'assistant'
                                })
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                            >
                              <option value="assistant">
                                Assistant (5 × {currentMultiplier} = {5 * currentMultiplier} points)
                              </option>
                              <option value="organizer">
                                Organizer (8 × {currentMultiplier} = {8 * currentMultiplier} points)
                              </option>
                            </select>
                            {currentEvent?.hours_length && currentEvent.hours_length >= 4 && (
                              <p className="text-xs text-gray-500 mt-1">
                                Multiplier: {currentMultiplier}× (based on {currentEvent.hours_length} hour event)
                              </p>
                            )}
                          </div>
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Notes
                            </label>
                            <textarea
                              value={participantForm.notes}
                              onChange={(e) => setParticipantForm({ ...participantForm, notes: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
                              rows={2}
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={loading}
                            className="bg-swat-green text-white px-4 py-2 rounded hover:bg-green-600 text-sm font-medium disabled:opacity-50"
                          >
                            {loading ? 'Adding...' : 'Add Participant'}
                          </button>
                        </form>
                      )}

                      {/* Participants List */}
                      <div className="space-y-2 max-h-[500px] overflow-y-auto">
                        {participants.map((participant) => (
                          <div
                            key={participant.id}
                            className="border border-gray-200 rounded-lg p-3 flex justify-between items-center"
                          >
                            <div>
                              <div className="font-medium text-gray-900">
                                {participant.first_name} {participant.last_name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {participant.participation_type === 'organizer' ? 'Organizer' : 'Assistant'} -{' '}
                                <span className="font-semibold text-swat-green">{participant.points_awarded} pts</span>
                              </div>
                              {participant.notes && (
                                <div className="text-xs text-gray-500 mt-1">{participant.notes}</div>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveParticipant(selectedEvent, participant.id)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                        {participants.length === 0 && (
                          <div className="text-center text-gray-500 py-4">No participants yet</div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      Select an event to view and manage participants
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OutreachLeaderboard;
