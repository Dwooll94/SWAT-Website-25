import React, { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';

interface EventConfig {
  id?: number;
  key: string;
  value: string | null;
  description: string;
  is_encrypted: boolean;
  updated_at?: string;
  updated_by?: string;
}

interface EventSystemStatus {
  isEnabled: boolean;
  hasActiveEvent: boolean;
  activeEvent?: {
    name: string;
    event_code: string;
    start_date: string;
    end_date: string;
  };
  teamNumber: string;
  hasApiKey: boolean;
  lastUpdated?: string;
}

const EventConfiguration: React.FC = () => {
  const [config, setConfig] = useState<EventConfig[]>([]);
  const [systemStatus, setSystemStatus] = useState<EventSystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [saving, setSaving] = useState<string | null>(null);

  // Form states for editable configs
  const [formData, setFormData] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchEventConfig();
    fetchSystemStatus();
  }, []);

  const fetchEventConfig = async () => {
    try {
      const response = await api.get('/events/config');
      setConfig(response.data || []);
      
      // Initialize form data
      const initialFormData: { [key: string]: string } = {};
      response.data?.forEach((item: EventConfig) => {
        initialFormData[item.key] = item.value || '';
      });
      setFormData(initialFormData);
    } catch (err: any) {
      console.error('Error fetching event config:', err);
      setError('Failed to load event configuration');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStatus = async () => {
    try {
      const response = await api.get('/events/status');
      setSystemStatus(response.data);
    } catch (err: any) {
      console.error('Error fetching system status:', err);
    }
  };

  const handleConfigUpdate = async (key: string, value: string, description?: string) => {
    setSaving(key);
    setError('');
    setSuccessMessage('');

    try {
      await api.post('/events/config', {
        key,
        value,
        description
      });

      setSuccessMessage(`${key} updated successfully!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh config and status
      await fetchEventConfig();
      await fetchSystemStatus();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to update ${key}`);
    } finally {
      setSaving(null);
    }
  };

  const handleManualAction = async (action: string) => {
    setSaving(action);
    setError('');
    setSuccessMessage('');

    try {
      let endpoint = '';
      let message = '';
      
      switch (action) {
        case 'check-events':
          endpoint = '/events/check-events';
          message = 'Event check completed!';
          break;
        case 'update-status':
          endpoint = '/events/update-status';
          message = 'Team status updated!';
          break;
        case 'update-matches':
          endpoint = '/events/update-matches';
          message = 'Match data updated!';
          break;
        case 'cleanup-cache':
          endpoint = '/events/cleanup-cache';
          message = 'Cache cleaned up!';
          break;
        default:
          throw new Error('Invalid action');
      }

      await api.post(endpoint);
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh status after actions
      await fetchSystemStatus();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to execute ${action}`);
    } finally {
      setSaving(null);
    }
  };

  const getConfigDisplay = (configItem: EventConfig) => {
    const sensitiveKeys = ['tba_api_key', 'tba_webhook_secret'];
    const booleanKeys = ['enable_event_display'];
    const numericKeys = ['event_check_interval', 'match_check_interval'];

    if (sensitiveKeys.includes(configItem.key)) {
      return (
        <div className="space-y-2">
          <input
            type="password"
            value={formData[configItem.key] || ''}
            onChange={(e) => setFormData({...formData, [configItem.key]: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
            placeholder={configItem.key === 'tba_api_key' ? 'Enter TBA API Key' : 'Enter Webhook Secret'}
          />
          <button
            onClick={() => handleConfigUpdate(configItem.key, formData[configItem.key], configItem.description)}
            disabled={saving === configItem.key}
            className="bg-swat-green hover:bg-swat-green-dark text-white px-3 py-1 rounded text-sm disabled:opacity-50"
          >
            {saving === configItem.key ? 'Saving...' : 'Update'}
          </button>
        </div>
      );
    }

    if (booleanKeys.includes(configItem.key)) {
      return (
        <div className="space-y-2">
          <select
            value={formData[configItem.key] || 'false'}
            onChange={(e) => setFormData({...formData, [configItem.key]: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
          >
            <option value="false">Disabled</option>
            <option value="true">Enabled</option>
          </select>
          <button
            onClick={() => handleConfigUpdate(configItem.key, formData[configItem.key], configItem.description)}
            disabled={saving === configItem.key}
            className="bg-swat-green hover:bg-swat-green-dark text-white px-3 py-1 rounded text-sm disabled:opacity-50"
          >
            {saving === configItem.key ? 'Saving...' : 'Update'}
          </button>
        </div>
      );
    }

    if (numericKeys.includes(configItem.key)) {
      return (
        <div className="space-y-2">
          <input
            type="number"
            value={formData[configItem.key] || ''}
            onChange={(e) => setFormData({...formData, [configItem.key]: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
            placeholder="Seconds"
            min="1"
          />
          <button
            onClick={() => handleConfigUpdate(configItem.key, formData[configItem.key], configItem.description)}
            disabled={saving === configItem.key}
            className="bg-swat-green hover:bg-swat-green-dark text-white px-3 py-1 rounded text-sm disabled:opacity-50"
          >
            {saving === configItem.key ? 'Saving...' : 'Update'}
          </button>
        </div>
      );
    }

    // Default text input
    return (
      <div className="space-y-2">
        <input
          type="text"
          value={formData[configItem.key] || ''}
          onChange={(e) => setFormData({...formData, [configItem.key]: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green"
          placeholder={configItem.description || `Enter ${configItem.key}`}
        />
        <button
          onClick={() => handleConfigUpdate(configItem.key, formData[configItem.key], configItem.description)}
          disabled={saving === configItem.key}
          className="bg-swat-green hover:bg-swat-green-dark text-white px-3 py-1 rounded text-sm disabled:opacity-50"
        >
          {saving === configItem.key ? 'Saving...' : 'Update'}
        </button>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-300 rounded"></div>
        <div className="h-4 bg-gray-300 rounded"></div>
        <div className="h-4 bg-gray-300 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-impact text-swat-black mb-4">EVENT SYSTEM CONFIGURATION</h2>
        <p className="text-gray-600 mb-6">
          Configure The Blue Alliance (TBA) integration for live event displays during FRC competitions.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          {successMessage}
        </div>
      )}

      {/* System Status */}
      {systemStatus && (
        <div className="bg-gray-50 rounded-lg p-6 border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-gray-600">Event Display:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    systemStatus.isEnabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {systemStatus.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600">TBA API Key:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    systemStatus.hasApiKey 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {systemStatus.hasApiKey ? 'Configured' : 'Missing'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-gray-600">Team Number:</span>
                  <span className="ml-2 font-mono text-swat-green">{systemStatus.teamNumber}</span>
                </div>
              </div>
            </div>
            <div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="text-gray-600">Active Event:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                    systemStatus.hasActiveEvent 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {systemStatus.hasActiveEvent ? 'Yes' : 'None'}
                  </span>
                </div>
                {systemStatus.activeEvent && (
                  <div className="text-sm text-gray-600">
                    <div className="font-medium">{systemStatus.activeEvent.name}</div>
                    <div>{systemStatus.activeEvent.event_code}</div>
                    <div>{new Date(systemStatus.activeEvent.start_date).toLocaleDateString()} - {new Date(systemStatus.activeEvent.end_date).toLocaleDateString()}</div>
                  </div>
                )}
                {systemStatus.lastUpdated && (
                  <div className="text-xs text-gray-500">
                    Last updated: {new Date(systemStatus.lastUpdated).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Settings */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Configuration Settings</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6">
            {config.map((configItem) => (
              <div key={configItem.key} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1 mr-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {configItem.key.split('_').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ')}
                    </label>
                    {configItem.description && (
                      <p className="text-xs text-gray-500 mb-2">{configItem.description}</p>
                    )}
                    {getConfigDisplay(configItem)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Actions */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Manual Actions</h3>
          <p className="text-sm text-gray-600">Manually trigger system actions for testing or troubleshooting.</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleManualAction('check-events')}
              disabled={saving === 'check-events'}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50 flex items-center justify-center"
            >
              {saving === 'check-events' ? 'Checking...' : 'Check for Active Events'}
            </button>
            <button
              onClick={() => handleManualAction('update-status')}
              disabled={saving === 'update-status'}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50 flex items-center justify-center"
            >
              {saving === 'update-status' ? 'Updating...' : 'Update Team Status'}
            </button>
            <button
              onClick={() => handleManualAction('update-matches')}
              disabled={saving === 'update-matches'}
              className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50 flex items-center justify-center"
            >
              {saving === 'update-matches' ? 'Updating...' : 'Update Match Data'}
            </button>
            <button
              onClick={() => handleManualAction('cleanup-cache')}
              disabled={saving === 'cleanup-cache'}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded font-medium disabled:opacity-50 flex items-center justify-center"
            >
              {saving === 'cleanup-cache' ? 'Cleaning...' : 'Clean Up Cache'}
            </button>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-md font-semibold text-blue-900 mb-2">Setup Instructions</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>1. Get TBA API Key:</strong> Register at thebluealliance.com/account and create an API key</p>
          <p><strong>2. Configure Team Number:</strong> Set your FRC team number (e.g., 254, 1806, etc.)</p>
          <p><strong>3. Enable System:</strong> Set "Enable Event Display" to "Enabled"</p>
          <p><strong>4. Test:</strong> Use "Check for Active Events" to test the integration</p>
          <p><strong>Note:</strong> The system automatically checks for events every hour and updates match data every 5 minutes during active events.</p>
        </div>
      </div>
    </div>
  );
};

export default EventConfiguration;