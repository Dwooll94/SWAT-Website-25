import React, { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';
import { extractRankingPoints, getTeamRankingPoints } from '../utils/scoringUtils';

interface EventSummary {
  event: {
    event_key: string;
    name: string;
    event_code: string;
    city: string;
    state_prov: string;
    start_date: string;
    end_date: string;
    year: number;
    webcasts: Array<{
      type: string;
      channel: string;
    }>;
  };
  teamStatus: {
    qual_ranking?: number;
    qual_avg?: number;
    qual_record?: { wins: number; losses: number; ties: number };
    playoff_alliance?: number;
    playoff_status?: string;
    overall_status_str?: string;
    opr?: number;
    dpr?: number;
    ccwm?: number;
  };
  nextMatch?: {
    match_key: string;
    comp_level: string;
    match_number: number;
    time?: number;
    predicted_time?: number;
    red_alliance: {
      team_keys: string[];
      score?: number;
    };
    blue_alliance: {
      team_keys: string[];
      score?: number;
    };
  };
  lastMatch?: {
    match_key: string;
    comp_level: string;
    match_number: number;
    winning_alliance?: string;
    red_alliance: {
      team_keys: string[];
      score: number;
    };
    blue_alliance: {
      team_keys: string[];
      score: number;
    };
    score_breakdown?: any;
  };
  teamKey: string;
  teamNumber: string;
  turnaroundTime?: number;
  turnaroundAllianceColor?: 'red' | 'blue';
}

interface EventMatch {
  match_key: string;
  comp_level: string;
  match_number: number;
  time?: number;
  predicted_time?: number;
  red_alliance: {
    team_keys: string[];
    score?: number;
  };
  blue_alliance: {
    team_keys: string[];
    score?: number;
  };
  winning_alliance?: string;
  score_breakdown?: any;
}

const LiveEventDisplay: React.FC = () => {
  const [eventSummary, setEventSummary] = useState<EventSummary | null>(null);
  const [matchSchedule, setMatchSchedule] = useState<EventMatch[]>([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [streamVisible, setStreamVisible] = useState(false);
  const streamContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEventData();
    
    // Set up polling for updates every 30 seconds during events
    const interval = setInterval(fetchEventData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Intersection observer to detect when stream container is visible
  useEffect(() => {
    if (!streamContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Add a small delay to ensure the container is fully loaded
            setTimeout(() => {
              setStreamVisible(true);
            }, 500);
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.5 // Trigger when 50% of the element is visible
      }
    );

    observer.observe(streamContainerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [eventSummary]); // Re-run when eventSummary changes

  const fetchEventData = async () => {
    try {
      const [summaryResponse, scheduleResponse] = await Promise.all([
        api.get('/events/summary'),
        api.get('/events/matches')
      ]);

      setEventSummary(summaryResponse.data);
      setMatchSchedule(scheduleResponse.data || []);
      setError('');
    } catch (err: any) {
      console.error('Error fetching event data:', err);
      if (err.response?.status !== 404) {
        setError('Failed to load event data');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return 'TBD';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatTimeUntil = (timestamp?: number) => {
    if (!timestamp) return null;
    const now = Date.now() / 1000;
    const diff = timestamp - now;
    
    if (diff <= 0) return 'Now';
    if (diff < 60) return `${Math.floor(diff)}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
  };

  const formatTurnaroundTime = (seconds?: number) => {
    if (!seconds) return null;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getCompLevelDisplay = (compLevel: string) => {
    const levels: { [key: string]: string } = {
      'qm': 'Quals',
      'ef': 'Eighths',
      'qf': 'Quarters',
      'sf': 'Semis',
      'f': 'Finals'
    };
    return levels[compLevel] || compLevel.toUpperCase();
  };

  const getAllianceColor = (teamKey: string, match: EventMatch) => {
    if (match.red_alliance.team_keys?.includes(teamKey)) return 'red';
    if (match.blue_alliance.team_keys?.includes(teamKey)) return 'blue';
    return null;
  };

  const getRankingColor = (rank?: number, totalTeams: number = 40) => {
    if (!rank) return 'text-gray-600';
    const percentile = rank / totalTeams;
    if (percentile <= 0.1) return 'text-green-600 font-bold'; // Top 10%
    if (percentile <= 0.25) return 'text-green-500'; // Top 25%
    if (percentile <= 0.5) return 'text-yellow-600'; // Top 50%
    if (percentile <= 0.75) return 'text-orange-500'; // Top 75%
    return 'text-red-500'; // Bottom 25%
  };

  if (loading) {
    return (
      <div className="bg-swat-black text-swat-white p-6 rounded-lg">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-600 rounded mb-4"></div>
          <div className="h-4 bg-gray-600 rounded mb-2"></div>
          <div className="h-4 bg-gray-600 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!eventSummary || !eventSummary.event) {
    return null; // No active event
  }

  const { event, teamStatus, nextMatch, lastMatch, teamNumber, turnaroundTime, turnaroundAllianceColor } = eventSummary;

  return (
    <div className="bg-swat-black text-swat-white p-6 rounded-lg border-4 border-swat-green mb-8 w-full">
      {/* Event Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-impact text-swat-green mb-1">
            LIVE: {event.name}
          </h2>
          <p className="text-gray-300">
            {event.city}, {event.state_prov} • Team {teamNumber}
          </p>
        </div>
        <div className="text-right">
          <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
            LIVE
          </div>
        </div>
      </div>

      {/* Stream Embed */}
      {event.webcasts && event.webcasts.length > 0 && (
        <div className="mb-6" ref={streamContainerRef}>
          <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
            {!streamVisible ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-swat-green mx-auto mb-2"></div>
                  <div>Loading stream...</div>
                </div>
              </div>
            ) : event.webcasts[0].type === 'twitch' ? (
              <iframe
                key={`twitch-${streamVisible}`} // Force re-render when visible
                src={`https://player.twitch.tv/?channel=${event.webcasts[0].channel}&parent=${window.location.hostname}&parent=localhost&autoplay=true&muted=false`}
                width="100%"
                height="100%"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture"
                className="border-0"
              />
            ) : event.webcasts[0].type === 'youtube' ? (
              <iframe
                key={`youtube-${streamVisible}`} // Force re-render when visible
                src={`https://www.youtube.com/embed/${event.webcasts[0].channel}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1`}
                width="100%"
                height="100%"
                allowFullScreen
                allow="autoplay; fullscreen; picture-in-picture"
                className="border-0"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Stream not available
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Current Status */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-bold text-swat-green mb-3">Current Status</h3>
          {teamStatus.qual_ranking && (
            <div className="mb-2">
              <span className="text-gray-300">Rank: </span>
              <span className={`font-bold ${getRankingColor(teamStatus.qual_ranking)}`}>
                #{teamStatus.qual_ranking}
              </span>
            </div>
          )}
          {teamStatus.qual_record && (
            <div className="mb-2">
              <span className="text-gray-300">Record: </span>
              <span className="text-green-400">{teamStatus.qual_record.wins}</span>
              <span className="text-gray-400">-</span>
              <span className="text-red-400">{teamStatus.qual_record.losses}</span>
              {teamStatus.qual_record.ties > 0 && (
                <>
                  <span className="text-gray-400">-</span>
                  <span className="text-yellow-400">{teamStatus.qual_record.ties}</span>
                </>
              )}
            </div>
          )}
          {teamStatus.opr && (
            <div className="mb-2">
              <span className="text-gray-300">OPR: </span>
              <span className="text-blue-400 font-mono">{teamStatus.opr}</span>
            </div>
          )}
          {teamStatus.qual_avg && (
            <div className="mb-2">
              <span className="text-gray-300">Avg RP: </span>
              <span className="text-purple-400 font-mono">{teamStatus.qual_avg.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Next Match */}
        {nextMatch && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-bold text-swat-green mb-3">Next Match</h3>
            <div className="mb-2">
              <span className="text-xl font-bold">
                {getCompLevelDisplay(nextMatch.comp_level)} {nextMatch.match_number}
              </span>
            </div>
            <div className="mb-2">
              <span className="text-gray-300">Time: </span>
              <span className="font-mono">{formatTime(nextMatch.predicted_time || nextMatch.time)}</span>
              {nextMatch.predicted_time && (
                <span className="text-sm text-swat-green ml-2">
                  ({formatTimeUntil(nextMatch.predicted_time)})
                </span>
              )}
            </div>
            <div className="space-y-1 text-sm">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                <span>{nextMatch.red_alliance.team_keys?.map(key => key.replace('frc', '')).join(', ')}</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                <span>{nextMatch.blue_alliance.team_keys?.map(key => key.replace('frc', '')).join(', ')}</span>
              </div>
            </div>
            {turnaroundTime && (
              <div className="mt-3 pt-3 border-t border-gray-600">
                <span className="text-gray-300">Turnaround: </span>
                <span className="font-mono">{formatTurnaroundTime(turnaroundTime)}</span>
                {turnaroundAllianceColor && (
                  <div className={`inline-block w-3 h-3 rounded-full ml-2 ${
                    turnaroundAllianceColor === 'red' ? 'bg-red-500' : 'bg-blue-500'
                  }`}></div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Last Match */}
        {lastMatch && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-bold text-swat-green mb-3">Last Match</h3>
            <div className="mb-2">
              <span className="text-xl font-bold">
                {getCompLevelDisplay(lastMatch.comp_level)} {lastMatch.match_number}
              </span>
            </div>
            <div className="space-y-1 text-sm mb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                  <span>{lastMatch.red_alliance.team_keys?.map(key => key.replace('frc', '')).join(', ')}</span>
                </div>
                <span className={`font-bold ${lastMatch.winning_alliance === 'red' ? 'text-red-400' : 'text-gray-400'}`}>
                  {lastMatch.red_alliance.score}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                  <span>{lastMatch.blue_alliance.team_keys?.map(key => key.replace('frc', '')).join(', ')}</span>
                </div>
                <span className={`font-bold ${lastMatch.winning_alliance === 'blue' ? 'text-blue-400' : 'text-gray-400'}`}>
                  {lastMatch.blue_alliance.score}
                </span>
              </div>
            </div>
            {lastMatch.score_breakdown && (
              <div className="text-xs text-gray-400">
                {(() => {
                  const teamRP = getTeamRankingPoints(
                    lastMatch.score_breakdown,
                    event.year,
                    eventSummary.teamKey,
                    lastMatch.red_alliance.team_keys || [],
                    lastMatch.blue_alliance.team_keys || []
                  );
                  const allRP = extractRankingPoints(lastMatch.score_breakdown, event.year);
                  
                  if (teamRP) {
                    return (
                      <div>
                        <div className="mb-1">
                          <span>Team RP: </span>
                          <span className="text-purple-400 font-bold">{teamRP.rp}</span>
                        </div>
                        {Object.keys(teamRP.breakdown).length > 0 && (
                          <div className="text-xs">
                            {Object.entries(teamRP.breakdown).map(([name, achieved]) => (
                              <span key={name} className={`mr-2 ${achieved ? 'text-green-400' : 'text-red-400'}`}>
                                {name}: {achieved ? '✓' : '✗'}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  } else if (allRP) {
                    return (
                      <div>
                        <span>Red RP: </span>
                        <span className="text-red-400 font-bold">{allRP.redRP}</span>
                        <span className="text-gray-400 mx-2">•</span>
                        <span>Blue RP: </span>
                        <span className="text-blue-400 font-bold">{allRP.blueRP}</span>
                      </div>
                    );
                  } else {
                    return (
                      <div>
                        <span>RP: </span>
                        <span className="text-gray-500">Not available</span>
                      </div>
                    );
                  }
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Match Schedule Button */}
      <div className="mt-6 text-center">
        <button
          onClick={() => setShowSchedule(!showSchedule)}
          className="bg-swat-green hover:bg-swat-green-dark text-swat-white px-6 py-2 rounded-lg font-bold transition-colors"
        >
          {showSchedule ? 'Hide' : 'Show'} Match Schedule
        </button>
      </div>

      {/* Match Schedule Sidebar */}
      {showSchedule && (
        <div className="mt-6 bg-gray-800 rounded-lg p-4 max-h-96 overflow-y-auto">
          <h3 className="text-lg font-bold text-swat-green mb-3">Match Schedule</h3>
          <div className="space-y-2">
            {matchSchedule.map((match) => {
              const allianceColor = getAllianceColor(eventSummary.teamKey, match);
              const winner = allianceColor === match.winning_alliance;
              return (
                <div
                  key={match.match_key}
                  className={`flex justify-between items-center p-2 rounded ${
                    allianceColor === 'red' ? 'bg-red-900/30' : 
                    allianceColor === 'blue' ? 'bg-blue-900/30' : 'bg-gray-700'
                  }`}
                >
                  <div>
                    <span className="font-bold">
                      {getCompLevelDisplay(match.comp_level)} {match.match_number} 
                    </span>
                    <div className="text-sm text-gray-400">
                      {formatTime(match.predicted_time || match.time)}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    {match.winning_alliance && (
                      <div className={`font-bold ${
                        match.winning_alliance === 'red' ? 'text-red-400' : 'text-blue-400'
                      }`}>
                        {match.winning_alliance && winner ? "W" : "L"} {match.red_alliance.score} - {match.blue_alliance.score}
                      </div>
                    )}
                    {match.score_breakdown && allianceColor && (
                      <div className="text-xs text-gray-400">
                        {(() => {
                          const teamRP = getTeamRankingPoints(
                            match.score_breakdown,
                            eventSummary.event.year,
                            eventSummary.teamKey,
                            match.red_alliance.team_keys || [],
                            match.blue_alliance.team_keys || []
                          );
                          return teamRP ? (
                            <span className="text-purple-400">+{teamRP.rp} RP</span>
                          ) : null;
                        })()}
                      </div>
                    )}
                    {allianceColor && (
                      <div className={`text-xs ${
                        allianceColor === 'red' ? 'text-red-400' : 'text-blue-400'
                      }`}>
                        {allianceColor.toUpperCase()} Alliance
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveEventDisplay;