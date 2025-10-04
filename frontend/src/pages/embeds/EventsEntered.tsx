import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useIframeResize } from '../../hooks/useIframeResize';

interface EventsEnteredData {
  teamKey: string;
  teamNumber: string;
  count: number;
  byYear: Record<number, number>;
  firstYear: number | null;
  lastYear: number | null;
}

const EventsEntered: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<EventsEnteredData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const team = searchParams.get('team');

  useIframeResize([loading, data]);

  useEffect(() => {
    // Remove body margins/padding for iframe embedding
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    
    

    const fetchData = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
        const url = team
          ? `${apiUrl}/tba-stats/events-entered?team=${team}`
          : `${apiUrl}/tba-stats/events-entered`;

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
      <div className="min-h-screen flex items-start justify-center bg-gradient-to-br from-orange-50 to-amber-100 pt-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-start justify-center bg-gradient-to-br from-red-50 to-pink-100 pt-8">
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
      <div className="min-h-screen flex items-start justify-center bg-gradient-to-br from-gray-50 to-gray-100 pt-8">
        <p className="text-gray-600">No data available</p>
      </div>
    );
  }

  const yearsActive = data.firstYear && data.lastYear ? data.lastYear - data.firstYear + 1 : 0;

  return (
    <div className="min-h-screen flex items-start justify-center bg-gradient-to-br from-orange-50 to-amber-100 p-4 pt-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full">
        <div className="mb-6">
          <div className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
            {data.count}
          </div>
          <div className="text-2xl font-semibold text-gray-700 mt-4">
            Events Entered
          </div>
          <div className="text-sm text-gray-500 mt-2">
            Team {data.teamNumber}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="text-3xl font-bold text-blue-600">{yearsActive}</div>
            <div className="text-xs text-gray-600 mt-1">Years Active</div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
            <div className="text-3xl font-bold text-green-600">
              {data.count > 0 ? (data.count / yearsActive).toFixed(1) : '0'}
            </div>
            <div className="text-xs text-gray-600 mt-1">Events /Year</div>
          </div>
        </div>

        {data.firstYear && data.lastYear && (
          <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg">
            <div className="text-sm text-gray-600">
              Competing since <span className="font-bold text-orange-600">{data.firstYear}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsEntered;
