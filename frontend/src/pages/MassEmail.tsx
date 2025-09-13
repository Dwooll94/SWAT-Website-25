import React, { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';

interface Recipient {
  id: string;
  name: string;
  email: string;
  role?: string;
  is_core_leadership?: boolean;
  relationship?: string;
  student_name?: string;
}

interface RecipientGroups {
  students_guardians_mentors: Recipient[];
  students_and_mentors: Recipient[];
  students_only: Recipient[];
}

const MassEmail: React.FC = () => {
  const [recipientGroups, setRecipientGroups] = useState<RecipientGroups | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('students_guardians_mentors');
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sendCopyToSender, setSendCopyToSender] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchRecipients();
  }, []);

  useEffect(() => {
    if (recipientGroups && selectedGroup) {
      const groupRecipients = recipientGroups[selectedGroup as keyof RecipientGroups] || [];
      setSelectedRecipients(groupRecipients);
    }
  }, [selectedGroup, recipientGroups]);

  const fetchRecipients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/email/recipients');
      setRecipientGroups(response.data);
      setError('');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load recipients';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGroupChange = (groupKey: string) => {
    setSelectedGroup(groupKey);
  };

  const handleRecipientToggle = (recipient: Recipient) => {
    setSelectedRecipients(prev => {
      const exists = prev.find(r => r.id === recipient.id);
      if (exists) {
        return prev.filter(r => r.id !== recipient.id);
      } else {
        return [...prev, recipient];
      }
    });
  };

  const handleSelectAll = () => {
    if (!recipientGroups) return;
    const groupRecipients = recipientGroups[selectedGroup as keyof RecipientGroups] || [];
    setSelectedRecipients([...groupRecipients]);
  };

  const handleDeselectAll = () => {
    setSelectedRecipients([]);
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedRecipients.length === 0) {
      setError('Please select at least one recipient');
      return;
    }

    if (!subject.trim() || !message.trim()) {
      setError('Subject and message are required');
      return;
    }

    setSending(true);
    setError('');
    setSuccessMessage('');

    try {
      await api.post('/email/send-mass', {
        recipient_group: selectedGroup,
        recipients: selectedRecipients,
        subject: subject.trim(),
        message: message.trim(),
        send_copy_to_sender: sendCopyToSender
      });

      setSuccessMessage(`Email sent successfully to ${selectedRecipients.length} recipient(s)!`);
      setSelectedRecipients([]);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to send email';
      setError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const getGroupDisplayName = (key: string) => {
    switch (key) {
      case 'students_guardians_mentors': return 'All Students, Student Guardians, and Mentors';
      case 'students_and_mentors': return 'All Students and Mentors';
      case 'students_only': return 'All Students';
      default: return key;
    }
  };

  const getRecipientDisplay = (recipient: Recipient) => {
    if (recipient.relationship && recipient.student_name) {
      return `${recipient.name} (${recipient.relationship} of ${recipient.student_name})`;
    }
    if (recipient.role) {
      return `${recipient.name} (${recipient.role.charAt(0).toUpperCase() + recipient.role.slice(1)})`;
    }
    return recipient.name;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-600">Loading recipients...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-impact text-swat-black mb-2">MASS EMAIL</h1>
        <p className="text-gray-600">Send emails to team members and guardians</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSendEmail} className="space-y-6">
        {/* Recipient Selection */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-impact text-swat-black mb-4">RECIPIENTS</h2>
          
          {/* Group Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Group</label>
            <select
              value={selectedGroup}
              onChange={(e) => handleGroupChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-transparent"
            >
              {recipientGroups && Object.keys(recipientGroups).map(key => (
                <option key={key} value={key}>
                  {getGroupDisplayName(key)} ({(recipientGroups[key as keyof RecipientGroups] || []).length})
                </option>
              ))}
            </select>
          </div>

          {/* Recipient List */}
          {recipientGroups && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium text-gray-700">
                  {selectedRecipients.length} of {(recipientGroups[selectedGroup as keyof RecipientGroups] || []).length} selected
                </span>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-sm text-swat-green hover:text-swat-green-dark transition-colors"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md p-3 space-y-2">
                {(recipientGroups[selectedGroup as keyof RecipientGroups] || []).map(recipient => (
                  <label key={recipient.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={selectedRecipients.some(r => r.id === recipient.id)}
                      onChange={() => handleRecipientToggle(recipient)}
                      className="h-4 w-4 text-swat-green focus:ring-swat-green border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {getRecipientDisplay(recipient)}
                      </div>
                      <div className="text-xs text-gray-500">{recipient.email}</div>
                      {recipient.is_core_leadership && (
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 mt-1">
                          Core Leadership
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Email Composition */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-impact text-swat-black mb-4">COMPOSE EMAIL</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={200}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-transparent"
                placeholder="Enter email subject..."
              />
              <div className="text-xs text-gray-500 mt-1">{subject.length}/200 characters</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={5000}
                rows={10}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-transparent"
                placeholder="Enter your message..."
              />
              <div className="text-xs text-gray-500 mt-1">{message.length}/5000 characters</div>
            </div>

            <div className="flex items-center">
              <input
                id="send-copy"
                type="checkbox"
                checked={sendCopyToSender}
                onChange={(e) => setSendCopyToSender(e.target.checked)}
                className="h-4 w-4 text-swat-green focus:ring-swat-green border-gray-300 rounded"
              />
              <label htmlFor="send-copy" className="ml-2 text-sm text-gray-700">
                Send a copy to myself
              </label>
            </div>
          </div>
        </div>

        {/* Send Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => {
              setSubject('');
              setMessage('');
              setSelectedRecipients([]);
              setSendCopyToSender(false);
              setError('');
              setSuccessMessage('');
            }}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={sending}
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={sending || selectedRecipients.length === 0 || !subject.trim() || !message.trim()}
            className="px-6 py-2 bg-swat-green hover:bg-swat-green-dark text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? 'Sending...' : `Send Email (${selectedRecipients.length})`}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MassEmail;