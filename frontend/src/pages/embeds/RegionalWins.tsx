import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useIframeResize } from '../../hooks/useIframeResize';

interface RegionalWinsData {
  teamKey: string;
  teamNumber: string;
  winners: number;
  finalists: number;
  total: number;
}

const RegionalWins: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<RegionalWinsData | null>(null);
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
          ? `${apiUrl}/tba-stats/regional-wins?team=${team}`
          : `${apiUrl}/tba-stats/regional-wins`;

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
      <div className="min-h-screen flex items-start justify-center bg-gradient-to-br from-blue-50 to-indigo-100 pt-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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

  return (
    <div className="min-h-screen flex items-start justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pt-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md w-full">
        <div className="mb-6">
          <div className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
            {data.total}
          </div>
          <div className="text-xl font-semibold text-gray-700 mt-2">
            Regional Wins & Finalists
          </div>
          <div className="text-sm text-gray-500 mt-1">
            Team {data.teamNumber}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4">
            <div className="text-3xl font-bold text-yellow-600">{data.winners}</div>
            <div className="text-sm text-gray-600 mt-1">Winners</div>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4">
            <div className="text-3xl font-bold text-gray-600">{data.finalists}</div>
            <div className="text-sm text-gray-600 mt-1">Finalists</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionalWins;
