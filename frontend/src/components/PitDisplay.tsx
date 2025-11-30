import React, { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';
import { extractRankingPoints, getTeamRankingPoints } from '../utils/scoringUtils';
import { getTeamAvatarUrl, handleAvatarError } from '../utils/avatarHelper';
import { randomInt } from 'crypto';

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
    playoff_record?: { wins: number; losses: number; ties: number };
    playoff_status?: string;
    overall_status_str?: string;
    next_match_key?: string;
    last_match_key?: string;
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

const PitDisplay: React.FC = () => {
  const [eventSummary, setEventSummary] = useState<EventSummary | null>(null);
  const [matchSchedule, setMatchSchedule] = useState<EventMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [streamVisible, setStreamVisible] = useState(false);
  const streamContainerRef = React.useRef<HTMLDivElement>(null);

  // Easter egg state
  const [keySequence, setKeySequence] = useState<string[]>([]);
  const [testDataActive, setTestDataActive] = useState(false);

  useEffect(() => {
    if (!testDataActive) {
      fetchEventData();

      // Set up polling for updates every 30 seconds during events (but not when test data is active)
      const interval = setInterval(fetchEventData, 30000);
      return () => clearInterval(interval);
    }
  }, [testDataActive]);

  // Easter egg: Ctrl + 1806 key sequence
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && ['1', '8', '0', '6'].includes(e.key)) {
        setKeySequence(prev => {
          const newSequence = [...prev, e.key];

          // Check if sequence matches 1-8-0-6
          if (newSequence.length > 4) {
            return [e.key]; // Reset if too long
          }

          // Check for complete sequence
          if (newSequence.length === 4 &&
              newSequence[0] === '1' &&
              newSequence[1] === '8' &&
              newSequence[2] === '0' &&
              newSequence[3] === '6') {
            toggleTestData();
            return [];
          }

          return newSequence;
        });
      } else if (!e.ctrlKey && keySequence.length > 0) {
        // Reset if Ctrl is released
        setKeySequence([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keySequence]);

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
    if (testDataActive) return; // Don't fetch if test data is active

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

  const toggleTestData = () => {
    if (testDataActive) {
      // Deactivate test data and resume normal operation
      setTestDataActive(false);
      setEventSummary(null);
      setMatchSchedule([]);
      setStreamVisible(false);
      setLoading(true);
      // fetchEventData will be called by useEffect when testDataActive changes
      return;
    }

    // Activate test data
    setTestDataActive(true);
    setLoading(false);
    setStreamVisible(true);

    


    const randomInt = (min: number, max: number) =>
    Math.floor(Math.random() * (max - min + 1)) + min;

    // Pool of alliance partner teams
    const allianceTeams = ['frc254', 'frc1678', 'frc973', 'frc1114', 'frc118', 'frc1987', 'frc1986', 'frc1730', 'frc1710', 'frc4522', 'frc2345', 'frc2457', 'frc16', 'frc6424', 'frc125', 'frc2056', 'frc1023', 'frc1939', 'frc987', 'frc4766', 'frc935', 'frc1825', 'frc1756', 'frc3284', 'frc5098', 'frc2001', 'frc1785', 'frc1763', 'frc1764', 'frc4959', 'frc5119', 'frc5126', 'frc9410', 'frc1108', 'frc1208', 'frc1785', 'frc1802', 'frc1827', 'frc1997', 'frc1847', 'frc2410', 'frc2560', 'frc4329', 'frc4455', 'frc4931', 'frc5268', 'frc5801', 'frc5809', 'frc5968', 'frc7064', 'frc7662', 'frc8112', 'frc9428', 'frc9445', 'frc1706', 'frc2165', 'frc2383', 'frc2352', 'frc3160', 'frc6026', 'frc10378', 'frc5550', 'frc3931', 'frc1561'];
    const opponentTeams = ['frc254', 'frc1678', 'frc973', 'frc1114', 'frc118', 'frc1987', 'frc1986', 'frc1730', 'frc1710', 'frc4522', 'frc2345', 'frc2457', 'frc16', 'frc6424', 'frc125', 'frc2056', 'frc1023', 'frc1939', 'frc987', 'frc4766', 'frc935', 'frc1825', 'frc1756', 'frc3284', 'frc5098', 'frc2001', 'frc1785', 'frc1763', 'frc1764', 'frc4959', 'frc5119', 'frc5126', 'frc9410', 'frc1108', 'frc1208', 'frc1785', 'frc1802', 'frc1827', 'frc1997', 'frc1847', 'frc2410', 'frc2560', 'frc4329', 'frc4455', 'frc4931', 'frc5268', 'frc5801', 'frc5809', 'frc5968', 'frc7064', 'frc7662', 'frc8112', 'frc9428', 'frc9445', 'frc1706', 'frc2165', 'frc2383', 'frc2352', 'frc3160', 'frc6026', 'frc10378', 'frc5550', 'frc3931', 'frc1561'];
    // Shuffle array helper
    const shuffleArray = <T,>(array: T[]): T[] => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    var lastMatch = 1;
    const matchProgress = randomInt(0, 9); //not actual matches, just hours
    var firstMatchTime = (Date.now() / 1000) - (matchProgress * 2400);
    var nextMatchTime = firstMatchTime;
    var hitCurrentTime = false;
    var summaryLastMatch = 0;
    var summaryMatchProgress = 0;
    // Generate test match schedule (alternate 1806 between red and blue)
    const testMatches: EventMatch[] = [];
    for (let i = 1; i <= 10; i++) {
      const is1806OnRed = i % 2 === 1; // Odd matches on red, even matches on blue
      var matchGap = randomInt(3, 16);
      var currentMatch = lastMatch + matchGap;
      var nextMatchTime = nextMatchTime + matchGap * randomInt(420, 600);
      const hasScore = nextMatchTime < (Date.now() / 1000); // Only matches before current time have been completed
      if(!hitCurrentTime && !hasScore){
        summaryLastMatch = lastMatch;
        summaryMatchProgress = i;
        hitCurrentTime = true;
      }
      lastMatch = currentMatch;

      // Generate alliance partners and opponents
      const shuffledAllies = shuffleArray(allianceTeams);
      const shuffledOpponents = shuffleArray(opponentTeams);
      const alliancePartners = shuffledAllies.slice(0, 2);
      const opponents = shuffledOpponents.slice(0, 3);

      testMatches.push({
        match_key: `2024test_qm${i}`,
        comp_level: 'qm',
        match_number: currentMatch,
        time: nextMatchTime,
        red_alliance: {
          team_keys: is1806OnRed
            ? ['frc1806', ...alliancePartners]
            : opponents,
          score: hasScore ? (is1806OnRed ? 180 : 106) : undefined

        },
        blue_alliance: {
          team_keys: is1806OnRed
            ? opponents
            : ['frc1806', ...alliancePartners],
          score: hasScore ? (is1806OnRed ? 106 : 180) : undefined
        },
        winning_alliance: hasScore ? (is1806OnRed ? 'red' : 'blue') : undefined,
        score_breakdown: hasScore ? {
          red: {
            rp: is1806OnRed ? (i % 3 === 0 ? 3 : 2) : (i % 4 === 0 ? 2 : 1),
            bargeBonusAchieved: is1806OnRed ? (i % 2 === 0) : (i % 5 === 0),
            coralBonusAchieved: is1806OnRed ? true : (i % 3 === 0),
            autoBonusAchieved: is1806OnRed ? (i % 3 === 0) : (i % 4 === 0)
          },
          blue: {
            rp: is1806OnRed ? (i % 4 === 0 ? 2 : 1) : (i % 3 === 0 ? 3 : 2),
            bargeBonusAchieved: is1806OnRed ? (i % 5 === 0) : (i % 2 === 0),
            coralBonusAchieved: is1806OnRed ? (i % 3 === 0) : true,
            autoBonusAchieved: is1806OnRed ? (i % 4 === 0) : (i % 3 === 0)
          }
        } : undefined
      });
    }
    setMatchSchedule(testMatches);

    // Generate test event data
    setEventSummary({
      event: {
        event_key: '2025test',
        name: 'Test Event - Electric Zoo',
        event_code: 'test',
        city: 'Zoo City',
        state_prov: 'MO',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        year: 2025,
        webcasts: [
          {
            type: 'youtube',
            channel: 'uDPbvlQq3BQ' // 10 hours of electric zoo
          }
        ]
      },
      teamStatus: {
        qual_ranking: 1,
        qual_avg: 5.1806,
        qual_record: { wins: summaryMatchProgress-1, losses: 0, ties: 0 },
        playoff_alliance: 1,
        playoff_status: 'won',
        overall_status_str: '🎉 Event Winner!',
        opr: 180.6,
        dpr: 18.06,
        ccwm: 1806
      },
      teamKey: 'frc1806',
      teamNumber: '1806',
      nextMatch: testMatches.at(summaryMatchProgress-1)
      ,
      lastMatch: {
        match_key: ((testMatches.at(summaryMatchProgress-2)?.match_key) || "oops"),
        comp_level: 'qm',
        match_number: summaryLastMatch,
        winning_alliance: testMatches.at(summaryMatchProgress-2)?.red_alliance.team_keys.includes('frc1806')?'red':'blue',
        red_alliance: {
          team_keys: ((testMatches.at(summaryMatchProgress-2)?.red_alliance.team_keys || ['frc1806', 'frc254', 'frc1678'])),
          score: ((testMatches.at(summaryMatchProgress-2)?.red_alliance.score) || 180)
        },
        blue_alliance: {
          team_keys: ((testMatches.at(summaryMatchProgress-2)?.blue_alliance.team_keys || ['frc973', 'frc1114', 'frc118'])),
          score: ((testMatches.at(summaryMatchProgress-2)?.blue_alliance.score) || 106)
        },
        score_breakdown: {
          red: {
            rp: 3,
            bargeBonusAchieved: true,
            coralBonusAchieved: true,
            autoBonusAchieved: false
          },
          blue: {
            rp: 1,
            bargeBonusAchieved: false,
            coralBonusAchieved: false,
            autoBonusAchieved: true
          }
        }
      },
      turnaroundTime: Math.floor(((testMatches.at(summaryMatchProgress)?.time || 0)) - (testMatches.at(summaryMatchProgress-1)?.time || 0)),
      turnaroundAllianceColor: (testMatches.at(summaryMatchProgress)?.blue_alliance.team_keys.includes('frc1806') ? 'blue' : 'red')
    });
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

  const getCompLevelDisplay = (compLevel: string, matchNumber: number) => {
    const levels: { [key: string]: string } = {
      'qm': 'Quals',
      'ef': 'Eighths',
      'qf': 'Quarters',
      'sf': 'Playoff',
      'f': 'Finals'
    };
    
    if (compLevel === 'sf') {
      // For semifinals, show "Playoff #N" where N is the match number
      return `${levels[compLevel]} #${matchNumber}`;
    }
    
    return levels[compLevel] || compLevel.toUpperCase();
  };

  const getMatchDisplayNumber = (compLevel: string, matchNumber: number) => {
    // For semifinals, don't show additional match number since it's in the comp level
    if (compLevel === 'sf') {
      return '';
    }
    // For other matches, show the match number normally
    return ` ${matchNumber}`;
  };

  const isEliminationMatch = (compLevel: string) => {
    return ['ef', 'qf', 'sf', 'f'].includes(compLevel);
  };

  const getActualMatchNumber = (matchKey: string, compLevel: string, matchNumber: number) => {
    // For semifinals, parse the actual match number from the match key
    // TBA format: 2025txhou_sf1m1, 2025txhou_sf2m1, etc.
    if (compLevel === 'sf' && matchKey) {
      const sfMatch = matchKey.match(/_sf(\d+)m\d+$/);
      if (sfMatch) {
        return parseInt(sfMatch[1]);
      }
    }
    
    // For other elimination matches, might need similar parsing
    if (compLevel === 'qf' && matchKey) {
      const qfMatch = matchKey.match(/_qf(\d+)m\d+$/);
      if (qfMatch) {
        return parseInt(qfMatch[1]);
      }
    }
    
    if (compLevel === 'ef' && matchKey) {
      const efMatch = matchKey.match(/_ef(\d+)m\d+$/);
      if (efMatch) {
        return parseInt(efMatch[1]);
      }
    }
    
    // Fall back to the provided match number for quals and other formats
    return matchNumber;
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
    <div className="bg-swat-black text-swat-white p-4 min-h-screen w-full">
      {/* Main Content Grid - Stream on left, Info boxes on right */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 mb-4">
        {/* Stream Section */}
        <div className="space-y-3">
          {event.webcasts && event.webcasts.length > 0 && (
            <div ref={streamContainerRef}>
              <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden max-h-[70vh]">
                {!streamVisible ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-swat-green mx-auto mb-2"></div>
                      <div>Loading stream...</div>
                    </div>
                  </div>
                ) : event.webcasts[0].type === 'twitch' ? (
                  <iframe
                    key={`twitch-${streamVisible}`}
                    src={`https://player.twitch.tv/?channel=${event.webcasts[0].channel}&parent=${window.location.hostname}&parent=localhost&autoplay=true&muted=false`}
                    width="100%"
                    height="100%"
                    allowFullScreen
                    allow="autoplay; fullscreen; picture-in-picture"
                    className="border-0"
                  />
                ) : event.webcasts[0].type === 'youtube' ? (
                  <iframe
                    key={`youtube-${streamVisible}`}
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
        </div>

        {/* Info Boxes Section */}
        <div className="space-y-3">
          {/* Event Header at top of right column */}
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-impact text-swat-green">
                {event.name}
              </h2>
              <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                LIVE
              </div>
            </div>
            <div className="text-sm text-gray-300">
              {event.city}, {event.state_prov} • Team {teamNumber}
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-gray-800 rounded-lg p-3">
            <h3 className="text-lg font-bold text-swat-green mb-2">Current Status</h3>
            <div className="grid grid-cols-4 gap-x-4 gap-y-2 text-base">
              {teamStatus.qual_ranking && (
                <>
                  <span className="text-gray-300">Rank:</span>
                  <span className={`font-bold ${getRankingColor(teamStatus.qual_ranking)}`}>
                    #{teamStatus.qual_ranking}
                  </span>
                </>
              )}
              {teamStatus.qual_record && (
                <>
                  <span className="text-gray-300">Record:</span>
                  <span className="font-bold">
                    <span className="text-green-400">{teamStatus.qual_record.wins}</span>
                    <span className="text-gray-400">-</span>
                    <span className="text-red-400">{teamStatus.qual_record.losses}</span>
                    {teamStatus.qual_record.ties > 0 && (
                      <>
                        <span className="text-gray-400">-</span>
                        <span className="text-yellow-400">{teamStatus.qual_record.ties}</span>
                      </>
                    )}
                  </span>
                </>
              )}
              {teamStatus.opr && (
                <>
                  <span className="text-gray-300">OPR:</span>
                  <span className="text-blue-400 font-mono font-bold">{teamStatus.opr}</span>
                </>
              )}
              {teamStatus.qual_avg && (
                <>
                  <span className="text-gray-300">Avg RP:</span>
                  <span className="text-purple-400 font-mono font-bold">{teamStatus.qual_avg.toFixed(1)}</span>
                </>
              )}
            </div>
            {teamStatus.overall_status_str && (
              <div className="mt-2 pt-2 border-t border-gray-600 text-base">
                <span className="text-gray-300">Status: </span>
                <span
                  className="text-swat-green font-semibold"
                  dangerouslySetInnerHTML={{ __html: teamStatus.overall_status_str }}
                />
              </div>
            )}
          </div>

          {/* Next Match */}
          {nextMatch && (
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold text-swat-green">Next Match</h3>
                <span className="text-2xl font-bold inline-flex items-center gap-2">
                  {(() => {
                    const actualMatchNum = getActualMatchNumber(nextMatch.match_key, nextMatch.comp_level, nextMatch.match_number);
                    return getCompLevelDisplay(nextMatch.comp_level, actualMatchNum) + getMatchDisplayNumber(nextMatch.comp_level, actualMatchNum);
                  })()}
                  {(() => {
                    const teamKey = eventSummary?.teamKey || 'frc1806';
                    const isOnRed = nextMatch.red_alliance.team_keys?.includes(teamKey);
                    const isOnBlue = nextMatch.blue_alliance.team_keys?.includes(teamKey);
                    if (isOnRed) {
                      return <div className="w-4 h-4 bg-red-500 rounded-full"></div>;
                    } else if (isOnBlue) {
                      return <div className="w-4 h-4 bg-blue-500 rounded-full"></div>;
                    }
                    return null;
                  })()}
                </span>
              </div>
              <div className="mb-2">
                <span className="text-base text-gray-300">Time: </span>
                <span className="text-lg font-mono font-bold">{formatTime(nextMatch.predicted_time || nextMatch.time)}</span>
                {nextMatch.predicted_time && (
                  <span className="text-base text-swat-green ml-2 font-bold">
                    ({formatTimeUntil(nextMatch.predicted_time)})
                  </span>
                )}
              </div>
              <div className="space-y-2 text-base">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-red-500 rounded flex-shrink-0"></div>
                  <div className="flex gap-1.5 flex-wrap">
                    {nextMatch.red_alliance.team_keys?.map(key => (
                      <div key={key} className="flex items-center gap-1">
                        <img
                          src={getTeamAvatarUrl(event.year, key)}
                          alt={key.replace('frc', '')}
                          className="w-6 h-6 rounded"
                          loading="lazy"
                          onError={(e) => handleAvatarError(e, event.year, key)}
                        />
                        <span className="font-semibold">{key.replace('frc', '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-500 rounded flex-shrink-0"></div>
                  <div className="flex gap-1.5 flex-wrap">
                    {nextMatch.blue_alliance.team_keys?.map(key => (
                      <div key={key} className="flex items-center gap-1">
                        <img
                          src={getTeamAvatarUrl(event.year, key)}
                          alt={key.replace('frc', '')}
                          className="w-6 h-6 rounded"
                          loading="lazy"
                          onError={(e) => handleAvatarError(e, event.year, key)}
                        />
                        <span className="font-semibold">{key.replace('frc', '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {turnaroundTime && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <span className="text-base text-gray-300">Turnaround: </span>
                  <span className="text-lg font-mono font-bold">{formatTurnaroundTime(turnaroundTime)}</span>
                  {turnaroundAllianceColor && (
                    <div className={`inline-block w-4 h-4 rounded-full ml-2 ${
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
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xl font-bold text-swat-green">Last Match</h3>
                <span className="text-2xl font-bold inline-flex items-center gap-2">
                  {(() => {
                    const actualMatchNum = getActualMatchNumber(lastMatch.match_key, lastMatch.comp_level, lastMatch.match_number);
                    return getCompLevelDisplay(lastMatch.comp_level, actualMatchNum) + getMatchDisplayNumber(lastMatch.comp_level, actualMatchNum);
                  })()}
                  {(() => {
                    const teamKey = eventSummary?.teamKey || 'frc1806';
                    const isOnRed = lastMatch.red_alliance.team_keys?.includes(teamKey);
                    const isOnBlue = lastMatch.blue_alliance.team_keys?.includes(teamKey);
                    if (isOnRed) {
                      return <div className="w-4 h-4 bg-red-500 rounded-full"></div>;
                    } else if (isOnBlue) {
                      return <div className="w-4 h-4 bg-blue-500 rounded-full"></div>;
                    }
                    return null;
                  })()}
                </span>
              </div>
              <div className="space-y-2 text-base mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-red-500 rounded flex-shrink-0"></div>
                    <div className="flex gap-1.5 flex-wrap">
                      {lastMatch.red_alliance.team_keys?.map(key => (
                        <div key={key} className="flex items-center gap-1">
                          <img
                            src={getTeamAvatarUrl(event.year, key)}
                            alt={key.replace('frc', '')}
                            className="w-6 h-6 rounded"
                            loading="lazy"
                            onError={(e) => handleAvatarError(e, event.year, key)}
                          />
                          <span className="font-semibold">{key.replace('frc', '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <span className={`text-xl font-bold ${lastMatch.winning_alliance === 'red' ? 'text-red-400' : 'text-gray-400'}`}>
                    {lastMatch.red_alliance.score}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-500 rounded flex-shrink-0"></div>
                    <div className="flex gap-1.5 flex-wrap">
                      {lastMatch.blue_alliance.team_keys?.map(key => (
                        <div key={key} className="flex items-center gap-1">
                          <img
                            src={getTeamAvatarUrl(event.year, key)}
                            alt={key.replace('frc', '')}
                            className="w-6 h-6 rounded"
                            loading="lazy"
                            onError={(e) => handleAvatarError(e, event.year, key)}
                          />
                          <span className="font-semibold">{key.replace('frc', '')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <span className={`text-xl font-bold ${lastMatch.winning_alliance === 'blue' ? 'text-blue-400' : 'text-gray-400'}`}>
                    {lastMatch.blue_alliance.score}
                  </span>
                </div>
              </div>
              {lastMatch.score_breakdown && !isEliminationMatch(lastMatch.comp_level) && (
                <div className="text-sm text-gray-400">
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
                            <span className="text-purple-400 font-bold text-base">{teamRP.rp}</span>
                          </div>
                          {Object.keys(teamRP.breakdown).length > 0 && (
                            <div className="text-sm">
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
                          <span>Red Bonus RP: </span>
                          <span className="text-red-400 font-bold text-base">{allRP.redRP}</span>
                          <span className="text-gray-400 mx-2">•</span>
                          <span>Blue Bonus RP: </span>
                          <span className="text-blue-400 font-bold text-base">{allRP.blueRP}</span>
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
              {isEliminationMatch(lastMatch.comp_level) && (
                <div className="text-sm text-gray-400">
                  <div>
                    <span>Result: </span>
                    <span className={`font-bold text-base ${
                      lastMatch.winning_alliance === (lastMatch.red_alliance.team_keys?.includes(eventSummary.teamKey) ? 'red' : 'blue')
                        ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {lastMatch.winning_alliance === (lastMatch.red_alliance.team_keys?.includes(eventSummary.teamKey) ? 'red' : 'blue')
                        ? 'Win' : 'Loss'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Match Schedule at Bottom */}
      <div className="bg-gray-800 rounded-lg p-4 max-h-[28vh] overflow-y-auto">
        <h3 className="text-xl font-bold text-swat-green mb-3">Match Schedule</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {matchSchedule.map((match) => {
            const allianceColor = getAllianceColor(eventSummary.teamKey, match);
            const winner = allianceColor === match.winning_alliance;
            return (
              <div
                key={match.match_key}
                className={`p-3 rounded ${
                  allianceColor === 'red' ? 'bg-red-900/30 border border-red-500/30' :
                  allianceColor === 'blue' ? 'bg-blue-900/30 border border-blue-500/30' : 'bg-gray-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-base">
                      {(() => {
                        const actualMatchNum = getActualMatchNumber(match.match_key, match.comp_level, match.match_number);
                        return getCompLevelDisplay(match.comp_level, actualMatchNum) + getMatchDisplayNumber(match.comp_level, actualMatchNum);
                      })()}
                    </span>
                    {match.winning_alliance && winner !== undefined && (
                      <span className={`text-xs font-bold ${winner ? 'text-green-400' : 'text-red-400'}`}>
                        {winner ? 'W' : 'L'}
                      </span>
                    )}
                    {match.score_breakdown && allianceColor && !isEliminationMatch(match.comp_level) && (
                      <>
                        {(() => {
                          const teamRP = getTeamRankingPoints(
                            match.score_breakdown,
                            eventSummary.event.year,
                            eventSummary.teamKey,
                            match.red_alliance.team_keys || [],
                            match.blue_alliance.team_keys || []
                          );
                          return teamRP ? (
                            <span className="text-purple-400 font-semibold text-xs">+{teamRP.rp} RP</span>
                          ) : null;
                        })()}
                      </>
                    )}
                  </div>
                  <span className="text-sm text-gray-400">
                    {formatTime(match.predicted_time || match.time)}
                  </span>
                </div>

                {/* Alliances with inline scores */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-red-500 rounded flex-shrink-0"></div>
                      <div className="flex gap-1 flex-wrap items-center">
                        {match.red_alliance.team_keys?.map(key => (
                          <div key={key} className="flex items-center gap-0.5">
                            <img
                              src={getTeamAvatarUrl(eventSummary.event.year, key)}
                              alt={key.replace('frc', '')}
                              className="w-4 h-4 rounded"
                              loading="lazy"
                              onError={(e) => handleAvatarError(e, eventSummary.event.year, key)}
                            />
                            <span className="text-gray-300 text-sm font-medium">{key.replace('frc', '')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {match.winning_alliance && (
                      <span className={`font-bold text-sm ml-2 ${
                        match.winning_alliance === 'red' ? 'text-red-400' : 'text-gray-500'
                      }`}>
                        {match.red_alliance.score}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-3 bg-blue-500 rounded flex-shrink-0"></div>
                      <div className="flex gap-1 flex-wrap items-center">
                        {match.blue_alliance.team_keys?.map(key => (
                          <div key={key} className="flex items-center gap-0.5">
                            <img
                              src={getTeamAvatarUrl(eventSummary.event.year, key)}
                              alt={key.replace('frc', '')}
                              className="w-4 h-4 rounded"
                              loading="lazy"
                              onError={(e) => handleAvatarError(e, eventSummary.event.year, key)}
                            />
                            <span className="text-gray-300 text-sm font-medium">{key.replace('frc', '')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {match.winning_alliance && (
                      <span className={`font-bold text-sm ml-2 ${
                        match.winning_alliance === 'blue' ? 'text-blue-400' : 'text-gray-500'
                      }`}>
                        {match.blue_alliance.score}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PitDisplay;