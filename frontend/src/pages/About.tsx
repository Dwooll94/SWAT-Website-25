import React, { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';

const About: React.FC = () => {
  const [teamMotto, setTeamMotto] = useState('Building Tomorrow\'s Leaders Today');

  useEffect(() => {
    const loadConfiguration = async () => {
      try {
        const response = await api.get('/config');
        if (response.data.team_motto) {
          setTeamMotto(response.data.team_motto);
        }
      } catch (error) {
        console.error('Error loading configuration:', error);
        // Keep default motto if API fails
      }
    };

    loadConfiguration();
  }, []);

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-8">
            About SWAT Team 1806
          </h1>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Mission Statement</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              To inspire young people to be science and technology leaders and innovators 
              by engaging them in exciting mentor-based programs that build science, 
              engineering, and technology skills.
            </p>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Team Motto</h2>
            <p className="text-xl text-blue-600 font-semibold text-center py-4">
              "{teamMotto}"
            </p>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">About S.W.A.T.</h2>
            <div className="prose prose-lg text-gray-600">
              <p className="mb-4">
                <strong>S.W.A.T.</strong> stands for <strong>Smithville Warriors Advancing Technology</strong>
              </p>
              <p className="mb-4">
                We are FIRST Robotics Competition Team 1806, based in Smithville, Missouri. 
                Our team has been competing in FRC for over 15 years, building robots and 
                developing the next generation of STEM leaders.
              </p>
              <div className="mb-6 flex items-center justify-center">
                <div className="text-center">
                  <img 
                    src="https://usfirststg.prod.acquia-sites.com/sites/default/files/2024-banner/first_age_frc_rebuilt_logoanimation_gif_800x800%20(1).gif"
                    alt="FRC 2026 Rebuilt Game Logo"
                    className="h-16 w-auto mx-auto mb-2"
                  />
                  <p className="text-sm text-gray-500">2025-2026 FRC Game</p>
                </div>
              </div>
              <p className="mb-4">
                Currently competing in the 2025-2026 season with the game <strong>Rebuilt</strong>, 
                we continue our tradition of excellence in robotics competition while 
                emphasizing community outreach and student development.
              </p>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="prose prose-lg text-gray-600">
              <p>
                SWAT Team 1806 has been a cornerstone of STEM education in Smithville, Missouri 
                for over 15 years. As a FIRST Robotics Competition team, we bring together 
                students, mentors, and community members to design, build, and program robots 
                that compete in challenging games.
              </p>
              <p>
                Our team is more than just robotics - we're a community that fosters innovation, 
                collaboration, and leadership. Students gain hands-on experience in engineering, 
                programming, business, and media while developing essential life skills.
              </p>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What We Do</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Build Robots</h3>
                <p className="text-gray-600">
                  Design and construct competitive robots for the annual FIRST Robotics Competition, 
                  combining mechanical engineering, electronics, and programming.
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Compete</h3>
                <p className="text-gray-600">
                  Participate in regional and national competitions, working alongside teams 
                  from around the world in exciting robotics challenges.
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Learn</h3>
                <p className="text-gray-600">
                  Develop technical skills in CAD, programming, machining, and electronics 
                  while building leadership and teamwork abilities.
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Give Back</h3>
                <p className="text-gray-600">
                  Engage with our community through outreach programs, STEM education initiatives, 
                  and inspiring the next generation of innovators.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center bg-blue-50 rounded-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Join Our Team</h2>
            <p className="text-lg text-gray-600 mb-6">
              Ready to be part of something amazing? Whether you're interested in engineering, 
              programming, business, or media, there's a place for you on Team 1806.
            </p>
            <a
              href="/register"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition duration-200"
            >
              Get Started Today
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;