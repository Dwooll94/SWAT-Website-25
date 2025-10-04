import React, { useEffect } from 'react';
import SEO from '../components/SEO';
import { redirectBotIfNeeded } from '../utils/botDetection';

const Awards: React.FC = () => {
  useEffect(() => {
    // Redirect bots to pre-rendered version
    redirectBotIfNeeded('awards');

    // Handle iframe resize messages
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'iframe-resize') {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe) => {
          if (iframe.contentWindow === event.source) {
            // Set height and mark as loaded
            iframe.style.height = `${event.data.height}px`;
            iframe.setAttribute('data-loaded', 'true');
          }
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="bg-white py-12">
      <SEO
        title="Awards & Recognition"
        description="Celebrating SWAT Team 1806's achievements and milestones in FIRST Robotics Competition. View our competition history, awards, and accomplishments on The Blue Alliance."
        keywords="SWAT 1806 awards, FRC awards, Team 1806 achievements, robotics competition awards, regional winners, state championships, FRC history, competition results"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Awards & Recognition
          </h1>
          <p className="text-lg text-gray-600">
            Celebrating our achievements and milestones in FIRST Robotics Competition
          </p>
        </div>

        {/* Team Stats - Live from TBA API */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Team Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <iframe
                src="/embed/regional-wins"
                className="w-full transition-all duration-300"
                style={{ border: 'none', display: 'block', minHeight: '400px' }}
                title="Regional Wins"
                frameBorder="0"
              />
            </div>
            <div>
              <iframe
                src="/embed/event-wins"
                className="w-full transition-all duration-300"
                style={{ border: 'none', display: 'block', minHeight: '400px' }}
                title="Event Wins"
                frameBorder="0"
              />
            </div>
            <div>
              <iframe
                src="/embed/award-count"
                className="w-full transition-all duration-300"
                style={{ border: 'none', display: 'block', minHeight: '400px' }}
                title="Award Count"
                frameBorder="0"
              />
            </div>
            <div>
              <iframe
                src="/embed/events-entered"
                className="w-full transition-all duration-300"
                style={{ border: 'none', display: 'block', minHeight: '400px' }}
                title="Events Entered"
                frameBorder="0"
              />
            </div>
          </div>
        </div>

        {/* Awards By Type*/}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Awards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <iframe
                src="/embed/awards-by-type?pattern=.*Innovation%20in%20Control.*&label=Innovation%20in%20Control%20Award"
                className="w-full transition-all duration-300"
                style={{ border: 'none', display: 'block', minHeight: '450px' }}
                title="Innovation in Control Awards"
                frameBorder="0"
              />
            </div>
            <div>
              <iframe
                src="/embed/awards-by-type?pattern=.*Quality.*&label=Quality%20Award"
                className="w-full transition-all duration-300"
                style={{ border: 'none', display: 'block', minHeight: '450px' }}
                title="Quality Awards"
                frameBorder="0"
              />
            </div>
            <div>
              <iframe
                src="/embed/awards-by-type?pattern=.*Gracious%20Professionalism.*&label=Gracious%20Professionalism%20Award"
                className="w-full transition-all duration-300"
                style={{ border: 'none', display: 'block', minHeight: '450px' }}
                title="Gracious Professionalism Awards"
                frameBorder="0"
              />
            </div>
            <div>
              <iframe
                src="/embed/awards-by-type?pattern=.*Excellence%20in%20Engineering.*&label=Excellence%20in%20Engineering%20Award"
                className="w-full transition-all duration-300"
                style={{ border: 'none', display: 'block', minHeight: '450px' }}
                title="Excellence In Engineering Awards"
                frameBorder="0"
              />
            </div>
          </div>
        </div>

        {/* Recent Performance */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Recent Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <iframe
                src="/embed/most-recent-win"
                className="w-full transition-all duration-300"
                style={{ border: 'none', display: 'block', minHeight: '400px' }}
                title="Most Recent Win"
                frameBorder="0"
              />
            </div>
            <div>
              <iframe
                src="/embed/most-recent-award"
                className="w-full transition-all duration-300"
                style={{ border: 'none', display: 'block', minHeight: '400px' }}
                title="Most Recent Award"
                frameBorder="0"
              />
            </div>
            <div>
              <iframe
                src="/embed/most-recent-results"
                className="w-full transition-all duration-300"
                style={{ border: 'none', display: 'block', minHeight: '500px' }}
                title="Most Recent Results"
                frameBorder="0"
              />
            </div>
          </div>
        </div>


        {/* TBA Link*/}
        <div className="mb-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Complete Team History & Awards
            </h2>
            <p className="text-gray-600 text-center mb-6">
              View our complete competition history, awards, and achievements on The Blue Alliance
            </p>
            
            <div className="mt-6 text-center">
              <a
                href="https://www.thebluealliance.com/team/1806/history"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition duration-200"
              >
                View Full History on TBA
                <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>
        </div>


        {/* FIRST Values */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg p-8 text-white">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-6">
              Embodying FIRST Values
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-xl font-bold mb-2">Gracious Professionalism</div>
                <p className="text-blue-100 text-sm">
                  Competing with respect and integrity
                </p>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold mb-2">Coopertition</div>
                <p className="text-blue-100 text-sm">
                  Competing while cooperating
                </p>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold mb-2">Innovation</div>
                <p className="text-blue-100 text-sm">
                  Creative problem solving
                </p>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold mb-2">Impact</div>
                <p className="text-blue-100 text-sm">
                  Making a difference in our community
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Want to Be Part of Our Success Story?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join Team 1806 and help us continue building excellence in robotics and beyond
          </p>
          <div className="space-x-4">
            <a
              href="/register"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md font-medium transition duration-200"
            >
              Join Our Team
            </a>
            <a
              href="/about"
              className="inline-block bg-gray-300 hover:bg-gray-400 text-gray-700 px-8 py-3 rounded-md font-medium transition duration-200"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Awards;