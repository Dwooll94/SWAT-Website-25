import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

interface AwardCountData {
  teamKey: string;
  teamNumber: string;
  count: number;
  byYear: Record<number, number>;
}

const AwardCount: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<AwardCountData | null>(null);
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
          ? `${apiUrl}/tba-stats/awards?team=${team}`
          : `${apiUrl}/tba-stats/awards`;

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
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }} className="flex items-start justify-center bg-gradient-to-br from-purple-50 to-pink-100 pt-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
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

  const recentYears = Object.entries(data.byYear)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .slice(0, 3);

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden' }} className="flex items-start justify-center bg-gradient-to-br from-purple-50 to-pink-100 p-4 pt-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full">
        <div className="mb-6">
          <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
            {data.count}
          </div>
          <div className="text-2xl font-semibold text-gray-700 mt-4">
            Total Awards
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Team {data.teamNumber}
          </div>
        </div>

        {recentYears.length > 0 && (
          <div className="mt-6 space-y-2">
            <div className="text-sm font-semibold text-gray-600 mb-3">Recent Years</div>
            {recentYears.map(([year, count]) => (
              <div key={year} className="flex justify-between items-center bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3">
                <span className="font-medium text-gray-700">{year}</span>
                <span className="text-purple-600 font-bold">{count} awards</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AwardCount;
