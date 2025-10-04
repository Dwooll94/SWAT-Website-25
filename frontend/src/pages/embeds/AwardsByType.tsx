import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * AwardsByType - Embeddable component for displaying awards filtered by regex pattern
 *
 * Usage:
 * /embed/awards-by-type?pattern=.*(Impact|Chairman's).*&label=Impact%20Awards
 * /embed/awards-by-type?pattern=.*Innovation%20in%20Control.*&label=Innovation%20in%20Control
 * /embed/awards-by-type?team=1806&pattern=.*Dean's%20List.*&label=Dean's%20List%20Awards
 *
 * Query Parameters:
 * - team: Team number (optional, defaults to configured team)
 * - pattern: Regex pattern to match award names (required)
 * - label: Display label for the award category (required)
 */

interface Award {
  event_key: string;
  award_type: number;
  name: string;
  year: number;
}

interface AwardsByTypeData {
  teamKey: string;
  teamNumber: string;
  count: number;
  awards: Award[];
  pattern: string;
  label: string;
}

const AwardsByType: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<AwardsByTypeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const team = searchParams.get('team');
  const pattern = searchParams.get('pattern') || '.*';
  const label = searchParams.get('label') || 'Awards';

  useEffect(() => {
    // Remove body margins/padding for iframe embedding
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const fetchData = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

        const params = new URLSearchParams();
        if (team) params.append('team', team);
        params.append('pattern', pattern);
        params.append('label', label);

        const url = `${apiUrl}/tba-stats/awards-by-type?${params.toString()}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data');

        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [team, pattern, label]);

  if (loading) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }} className="flex items-start justify-center bg-gradient-to-br from-indigo-50 to-blue-100 pt-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }} className="flex items-start justify-center bg-gradient-to-br from-red-50 to-pink-100 pt-8">
        <div className="text-center p-8">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-red-600 font-semibold">Error loading data</p>
          <p className="text-gray-600 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }} className="flex items-start justify-center bg-gradient-to-br from-gray-50 to-gray-100 pt-8">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  const recentAwards = data.awards
    .sort((a, b) => b.year - a.year)
    .slice(0, 3);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }} className="flex items-start justify-center bg-gradient-to-br from-indigo-50 to-blue-100 p-4 pt-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full">
        <div className="mb-6">
          <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
            {data.count}x
          </div>
          <div className="text-2xl font-semibold text-gray-700 mt-4">
            {data.label}
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Team {data.teamNumber}
          </div>
        </div>

        {recentAwards.length > 0 && (
          <div className="mt-6 space-y-2">
            <div className="text-sm font-semibold text-gray-600 mb-3">Recent Awards</div>
            {recentAwards.map((award, idx) => (
              <div key={idx} className="flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-3">
                <div className="text-left flex-1">
                  <div className="font-medium text-gray-700 text-sm">{award.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{award.year}</div>
                </div>
              </div>
            ))}
            {data.awards.length > 3 && (
              <div className="text-xs text-gray-500 mt-2">
                +{data.awards.length - 3} more
              </div>
            )}
          </div>
        )}

        {data.count === 0 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg">
            <div className="text-4xl mb-2">🔍</div>
            <div className="text-sm text-gray-600">
              No matching awards found
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AwardsByType;
