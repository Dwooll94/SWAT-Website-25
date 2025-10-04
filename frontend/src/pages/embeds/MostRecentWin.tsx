import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

interface Award {
  event_key: string;
  award_type: number;
  name: string;
  year: number;
}

interface MostRecentWinData {
  teamKey: string;
  teamNumber: string;
  mostRecentWin: Award | null;
  eventName: string | null;
}

const MostRecentWin: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<MostRecentWinData | null>(null);
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
          ? `${apiUrl}/tba-stats/most-recent-win?team=${team}`
          : `${apiUrl}/tba-stats/most-recent-win`;

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
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }} className="flex items-start justify-center bg-gradient-to-br from-yellow-50 to-amber-100 pt-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mx-auto"></div>
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

  if (!data || !data.mostRecentWin) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }} className="flex items-start justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4 pt-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full">
          <div className="text-5xl mb-4">🏆</div>
          <p className="text-gray-600 font-semibold">No wins recorded</p>
          <p className="text-sm text-gray-500 mt-2">Team {data?.teamNumber || 'N/A'}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }} className="flex items-start justify-center bg-gradient-to-br from-yellow-50 to-amber-100 p-4 pt-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full">
        <div className="mb-6">
          <div className="text-6xl mb-4">🏆</div>
          <div className="text-2xl font-semibold text-gray-700 mb-2">
            Most Recent Win
          </div>
          <div className="text-sm text-gray-500">
            Team {data.teamNumber}
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-6 space-y-3">
          <div className="text-4xl font-bold text-yellow-600">
            {data.mostRecentWin.year}
          </div>
          <div className="text-lg font-semibold text-gray-700">
            {data.mostRecentWin.name}
          </div>
          {data.eventName && (
            <div className="text-sm text-gray-600">
              {data.eventName}
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
          <div className="text-sm text-gray-600">
            Latest tournament victory
          </div>
        </div>
      </div>
    </div>
  );
};

export default MostRecentWin;
