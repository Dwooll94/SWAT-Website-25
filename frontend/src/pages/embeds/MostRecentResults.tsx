import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

interface Event {
  key: string;
  name: string;
  start_date: string;
  end_date: string;
  year: number;
}

interface Status {
  qual?: {
    ranking?: {
      rank?: number;
      qual_average?: number;
    };
    num_teams?: number;
  };
  playoff?: {
    status?: string;
    level?: string;
    record?: {
      wins: number;
      losses: number;
      ties: number;
    };
  };
  alliance?: {
    number?: number;
    pick?: number;
  };
}

interface Award {
  name: string;
  award_type: number;
}

interface MostRecentResultsData {
  teamKey: string;
  teamNumber: string;
  event: Event | null;
  status: Status | null;
  awards: Award[] | null;
}

const MostRecentResults: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<MostRecentResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const team = searchParams.get('team');

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
        const url = team
          ? `${apiUrl}/tba-stats/most-recent-results?team=${team}`
          : `${apiUrl}/tba-stats/most-recent-results`;

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
  }, [team]);

  if (loading) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }} className="flex items-start justify-center bg-gradient-to-br from-indigo-50 to-purple-100 pt-8">
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

  if (!data || !data.event) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }} className="flex items-start justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 pt-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-gray-600 font-semibold">No recent events</p>
          <p className="text-sm text-gray-500 mt-2">Team {data?.teamNumber || 'N/A'}</p>
        </div>
      </div>
    );
  }

  const qualRank = data.status?.qual?.ranking?.rank;
  const numTeams = data.status?.qual?.num_teams;
  const allianceNum = data.status?.alliance?.number;
  const playoffRecord = data.status?.playoff?.record;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }} className="flex items-start justify-center bg-gradient-to-br from-indigo-50 to-purple-100 p-4 pt-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full">
        <div className="text-center mb-6">
          <div className="text-2xl font-semibold text-gray-700 mb-2">
            Most Recent Event
          </div>
          <div className="text-sm text-gray-500">
            Team {data.teamNumber}
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mb-6">
          <div className="text-xl font-bold text-indigo-600 mb-2">
            {data.event.name}
          </div>
          <div className="text-sm text-gray-600">
            {new Date(data.event.start_date).toLocaleDateString()} - {new Date(data.event.end_date).toLocaleDateString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data.event.year}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {qualRank && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Qualification Rank</div>
              <div className="text-3xl font-bold text-blue-600">
                {qualRank}{numTeams && <span className="text-lg text-gray-500">/{numTeams}</span>}
              </div>
            </div>
          )}

          {allianceNum && (
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Alliance</div>
              <div className="text-3xl font-bold text-green-600">
                #{allianceNum}
              </div>
            </div>
          )}

          {playoffRecord && (
            <div className="bg-purple-50 rounded-lg p-4 col-span-2">
              <div className="text-sm text-gray-600 mb-1">Playoff Record</div>
              <div className="text-2xl font-bold text-purple-600">
                {playoffRecord.wins}W - {playoffRecord.losses}L - {playoffRecord.ties}T
              </div>
            </div>
          )}
        </div>

        {data.awards && data.awards.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-4">
            <div className="text-sm font-semibold text-gray-700 mb-2">
              Awards ({data.awards.length})
            </div>
            <div className="space-y-1">
              {data.awards.slice(0, 3).map((award, idx) => (
                <div key={idx} className="text-sm text-gray-600">
                  🏅 {award.name}
                </div>
              ))}
              {data.awards.length > 3 && (
                <div className="text-xs text-gray-500 mt-1">
                  +{data.awards.length - 3} more
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MostRecentResults;
