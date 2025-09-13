import React, { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';

interface ConfigItem {
  key: string;
  value: string;
  description: string;
  updated_at: string;
  updated_by_name?: string;
}

const SiteConfiguration: React.FC = () => {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/config/admin/all');
      setConfigs(response.data);
    } catch (err: any) {
      setError('Failed to load configurations');
      console.error('Error fetching configurations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateConfig = async (key: string, value: string) => {
    if (!value.trim()) {
      setError('Value cannot be empty');
      return;
    }

    try {
      setSaving(key);
      setError('');
      
      await api.put(`/config/${key}`, { value: value.trim() });
      
      setSuccess(`${key} updated successfully!`);
      setTimeout(() => setSuccess(''), 3000);
      
      // Refresh configurations
      fetchConfigurations();
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to update ${key}`);
    } finally {
      setSaving(null);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setConfigs(configs.map(config => 
      config.key === key ? { ...config, value } : config
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-lg text-gray-600">Loading configurations...</div>
      </div>
    );
  }

  const importantConfigs = ['contract_url', 'first_signup_url'];
  const importantItems = configs.filter(config => importantConfigs.includes(config.key));
  const otherItems = configs.filter(config => !importantConfigs.includes(config.key));

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-impact text-swat-black mb-6">SITE CONFIGURATION</h2>
        <p className="text-gray-600 mb-8">
          Manage website settings and configuration values. Changes take effect immediately.
        </p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {/* Registration Settings */}
        <div className="mb-10">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
            📋 Registration Settings
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Configure URLs and settings for the student registration process.
          </p>
          
          <div className="space-y-6">
            {importantItems.map((config) => (
              <div key={config.key} className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900 capitalize">
                      {config.key.replace(/_/g, ' ')}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                  </div>
                  {config.updated_by_name && (
                    <div className="text-xs text-gray-500">
                      Last updated by {config.updated_by_name}<br />
                      {new Date(config.updated_at).toLocaleString()}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <input
                    type="url"
                    value={config.value}
                    onChange={(e) => handleInputChange(config.key, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-swat-green"
                    placeholder={`Enter ${config.key.replace(/_/g, ' ')}...`}
                  />
                  <button
                    onClick={() => handleUpdateConfig(config.key, config.value)}
                    disabled={saving === config.key}
                    className="bg-swat-green text-white px-6 py-2 rounded-md hover:bg-swat-green/90 disabled:opacity-50 font-semibold transition-colors"
                  >
                    {saving === config.key ? 'Saving...' : 'Update'}
                  </button>
                </div>
                
                {config.key === 'contract_url' && (
                  <p className="text-xs text-gray-500 mt-2">
                    Students will be redirected to this URL to view and download the team contract.
                  </p>
                )}
                
                {config.key === 'first_signup_url' && (
                  <p className="text-xs text-gray-500 mt-2">
                    Students will be directed to this URL to register with FIRST after uploading their signed contract.
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Other Settings */}
        {otherItems.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
              ⚙️ Other Settings
            </h3>
            
            <div className="space-y-4">
              {otherItems.map((config) => (
                <div key={config.key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900 capitalize">
                        {config.key.replace(/_/g, ' ')}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{config.description}</p>
                    </div>
                    {config.updated_by_name && (
                      <div className="text-xs text-gray-500">
                        Last updated by {config.updated_by_name}<br />
                        {new Date(config.updated_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={config.value}
                      onChange={(e) => handleInputChange(config.key, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-swat-green focus:border-swat-green"
                      placeholder={`Enter ${config.key.replace(/_/g, ' ')}...`}
                    />
                    <button
                      onClick={() => handleUpdateConfig(config.key, config.value)}
                      disabled={saving === config.key}
                      className="bg-swat-green text-white px-6 py-2 rounded-md hover:bg-swat-green/90 disabled:opacity-50 font-semibold transition-colors"
                    >
                      {saving === config.key ? 'Saving...' : 'Update'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteConfiguration;