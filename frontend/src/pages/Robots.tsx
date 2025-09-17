import React, { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';
import { renderTextWithNewlines } from '../utils/textUtils';

interface Robot {
  id: number;
  year: number;
  name: string;
  game: string;
  description: string | null;
  image_path: string | null;
  achievements: string | null;
  cad_link: string | null;
  code_link: string | null;
  created_at: string;
  updated_at: string;
}

const Robots: React.FC = () => {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedRobot, setExpandedRobot] = useState<number | null>(null);

  useEffect(() => {
    const fetchRobots = async () => {
      try {
        const response = await api.get('/robots');
        setRobots(response.data.sort((a: Robot, b: Robot) => b.year - a.year));
      } catch (err: any) {
        console.error('Error fetching robots:', err);
        setError('Failed to load robots data');
      } finally {
        setLoading(false);
      }
    };

    fetchRobots();
  }, []);

  const toggleExpanded = (robotId: number) => {
    setExpandedRobot(expandedRobot === robotId ? null : robotId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-swat-black text-swat-white flex items-center justify-center">
        <div className="text-2xl font-impact">Loading robots timeline...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-swat-black text-swat-white flex items-center justify-center">
        <div className="text-xl text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-swat-black text-swat-white py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-impact text-swat-green mb-4">
            ROBOTS TIMELINE
          </h1>
          <p className="text-lg md:text-xl text-swat-white/80">
            A journey through S.W.A.T. Team 1806's robot history
          </p>
        </div>

        {robots.length === 0 ? (
          <div className="text-center text-xl text-swat-white/70">
            No robots data available yet.
          </div>
        ) : (
          <div className="relative max-w-6xl mx-auto">
            {/* Timeline vertical line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 bg-swat-green h-full hidden md:block"></div>
            
            {/* Timeline on mobile - left aligned */}
            <div className="absolute left-8 w-1 bg-swat-green h-full md:hidden"></div>

            {robots.map((robot, index) => (
              <div
                key={robot.id}
                className={`relative mb-12 md:mb-16 ${
                  index % 2 === 0 ? 'md:pr-1/2 md:text-right' : 'md:pl-1/2 md:ml-1/2'
                } pl-16 md:pl-0`}
              >
                {/* Timeline circle */}
                <div className="absolute w-6 h-6 bg-swat-green rounded-full border-4 border-swat-black left-5 top-6 md:left-1/2 md:transform md:-translate-x-1/2 z-10"></div>
                
                {/* Content container */}
                <div
                  className={`bg-swat-white text-swat-black rounded-lg shadow-xl p-6 md:p-8 relative ${
                    index % 2 === 0 ? 'md:mr-8' : 'md:ml-8'
                  }`}
                >
                  {/* Arrow pointing to timeline */}
                  <div
                    className={`absolute top-6 w-0 h-0 hidden md:block ${
                      index % 2 === 0
                        ? 'right-0 transform translate-x-full border-l-8 border-l-swat-white border-y-8 border-y-transparent'
                        : 'left-0 transform -translate-x-full border-r-8 border-r-swat-white border-y-8 border-y-transparent'
                    }`}
                  ></div>

                  {/* Robot header */}
                  <div className="mb-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-2xl md:text-3xl font-impact text-swat-green">
                          {robot.year}: {robot.game}
                        </h2>
                        <h3 className="text-xl md:text-2xl font-bold text-swat-black mt-1">
                          {robot.name}
                        </h3>
                      </div>
                      
                      {robot.image_path && (
                        <div className="flex-shrink-0">
                          <img
                            src={robot.image_path}
                            alt={`${robot.name} - ${robot.year}`}
                            className="w-32 h-32 md:w-40 md:h-40 object-contain rounded-lg bg-swat-black/5 cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => toggleExpanded(robot.id)}
                          />
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => toggleExpanded(robot.id)}
                      className="bg-swat-green text-swat-white px-6 py-2 rounded-full hover:bg-swat-green/80 transition-colors font-semibold"
                    >
                      {expandedRobot === robot.id ? 'Show Less' : 'Learn More'}
                    </button>
                  </div>

                  {/* Expanded content */}
                  {expandedRobot === robot.id && (
                    <div className="border-t-2 border-swat-green/20 pt-6 mt-6 space-y-6">
                      {robot.description && (
                        <div>
                          <h4 className="text-lg font-bold text-swat-green mb-2">
                            Robot Description:
                          </h4>
                          <div className="text-swat-black/80 leading-relaxed">
                            {renderTextWithNewlines(robot.description)}
                          </div>
                        </div>
                      )}

                      {robot.achievements && (
                        <div>
                          <h4 className="text-lg font-bold text-swat-green mb-2">
                            Achievements & Competition Results:
                          </h4>
                          <div className="text-swat-black/80 leading-relaxed">
                            {renderTextWithNewlines(robot.achievements)}
                          </div>
                        </div>
                      )}

                      {(robot.cad_link || robot.code_link) && (
                        <div>
                          <h4 className="text-lg font-bold text-swat-green mb-2">
                            Resources:
                          </h4>
                          <div className={index %2 === 0? "h-10 w-auto flex-right gap-3" : "h-10 w-auto flex-left gap-3" }>
                            {robot.cad_link && (
                              <a
                                href={robot.cad_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                              >
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a2 2 0 104 0 2 2 0 00-4 0zm6 0a2 2 0 104 0 2 2 0 00-4 0z" clipRule="evenodd" />
                                </svg>
                                CAD Files
                              </a>
                            )}
                            {robot.code_link && (
                              <a
                                href={robot.code_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors font-semibold"
                              >
                                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                Source Code
                              </a>
                            )}
                          </div>
                        </div>
                      )}

                      {robot.image_path && (
                        <div>
                          <h4 className="text-lg font-bold text-swat-green mb-2">
                            Robot Image:
                          </h4>
                          <img
                            src={robot.image_path}
                            alt={`${robot.name} - Full view`}
                            className="w-full max-w-md mx-auto rounded-lg shadow-lg bg-swat-black/5"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Robots;