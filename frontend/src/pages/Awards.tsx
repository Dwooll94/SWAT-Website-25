import React from 'react';

const Awards: React.FC = () => {
  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Awards & Recognition
          </h1>
          <p className="text-lg text-gray-600">
            Celebrating our achievements and milestones in FIRST Robotics Competition
          </p>
        </div>

        {/* Team 1806 History Embed */}
        <div className="mb-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Complete Team History & Awards
            </h2>
            <p className="text-gray-600 text-center mb-6">
              View our complete competition history, awards, and achievements on The Blue Alliance
            </p>
            
            {/* TBA Embed */}
            <div className="relative w-full" style={{ paddingBottom: '75%' }}>
              <iframe
                src="https://www.thebluealliance.com/team/1806/history"
                className="absolute top-0 left-0 w-full h-full border rounded-lg"
                title="Team 1806 History on The Blue Alliance"
                allowFullScreen
              />
            </div>
            
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

        {/* Recent Highlights */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Recent Highlights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6 border">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-blue-600 mb-2">2024</div>
                <h3 className="text-lg font-semibold text-gray-900">MOKAN State Championships</h3>
              </div>
              <p className="text-gray-600 text-center">
                Competed at the Missouri-Kansas State Championships representing our region
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-blue-600 mb-2">2024</div>
                <h3 className="text-lg font-semibold text-gray-900">Greater Kansas City Regional</h3>
              </div>
              <p className="text-gray-600 text-center">
                Strong performance at our home regional competition
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 border">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-blue-600 mb-2">2023</div>
                <h3 className="text-lg font-semibold text-gray-900">Cowtown Throwdown</h3>
              </div>
              <p className="text-gray-600 text-center">
                Participated in the exciting off-season competition
              </p>
            </div>
          </div>
        </div>

        {/* Team Stats */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Team Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="bg-blue-50 rounded-lg p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">20+</div>
              <div className="text-gray-700 font-medium">Years Competing</div>
            </div>
            <div className="bg-green-50 rounded-lg p-6">
              <div className="text-3xl font-bold text-green-600 mb-2">50+</div>
              <div className="text-gray-700 font-medium">Competitions Attended</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-6">
              <div className="text-3xl font-bold text-purple-600 mb-2">100+</div>
              <div className="text-gray-700 font-medium">Students Impacted</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-6">
              <div className="text-3xl font-bold text-orange-600 mb-2">9 Time</div>
              <div className="text-gray-700 font-medium">Regional Winner</div>
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