import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, api } from '../contexts/AuthContext';
import ResponsiveSlideshow from '../components/ResponsiveSlideshow';
import SponsorSlideshow from '../components/SponsorSlideshow';
import MarkdownRenderer from '../components/MarkdownRenderer';
import moment from 'moment';

interface Subteam {
  id: number;
  name: string;
  description: string | null;
  is_primary: boolean;
  display_order: number;
  is_active: boolean;
}

interface PageData {
  id: number;
  slug: string;
  title: string;
  content: string;
  processed_content?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const Home: React.FC = () => {
  const { user } = useAuth();
  const [teamMotto, setTeamMotto] = useState('Building Tomorrow\'s Leaders Today');
  const [subteams, setSubteams] = useState<Subteam[]>([]);
  const [dynamicHomePage, setDynamicHomePage] = useState<PageData | null>(null);
  const [loadingHomePage, setLoadingHomePage] = useState(true);

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

    const loadSubteams = async () => {
      try {
        const response = await api.get('/subteams/primary');
        setSubteams(response.data || []);
      } catch (error) {
        console.error('Error loading subteams:', error);
        // Keep empty array if API fails
      }
    };

    const loadDynamicHomePage = async () => {
      try {
        const response = await api.get('/pages/slug/home');
        setDynamicHomePage(response.data);
      } catch (error) {
        console.error('No dynamic home page found:', error);
        // No dynamic page available
      } finally {
        setLoadingHomePage(false);
      }
    };

    loadConfiguration();
    loadSubteams();
    loadDynamicHomePage();
  }, []);

  return (
    <div className="bg-white">
      {/* Hero Section with Slideshow */}
      <div className="relative overflow-hidden bg-swat-gradient">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center text-swat-white mb-8 fade-in">
            <h1 className="text-6xl font-impact swat-title mb-6 tracking-wider">S.W.A.T. TEAM 1806</h1>
            <div className="mb-6">
              <p className="text-2xl font-impact mb-2">SMITHVILLE WARRIORS</p>
              <p className="text-2xl font-impact mb-4">ADVANCING TECHNOLOGY</p>
            </div>
            <p className="text-xl mb-4 font-medium">{teamMotto}</p>

            {!user && (
              <Link
                to="/register"
                className="bg-swat-green hover:bg-swat-green-dark text-swat-white px-10 py-4 rounded-lg font-bold text-lg transition-all duration-300 inline-block mb-8 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                JOIN OUR TEAM
              </Link>
            )}
          </div>
          
          {/* Slideshow */}
          <div className="max-w-4xl mx-auto">
            <ResponsiveSlideshow aspectRatio="16/9" className="border-2 border-swat-green" />
          </div>
        </div>
        
      </div>

      {/* Sponsor Slideshow */}
      <SponsorSlideshow />
      
      {/* Dynamic Home Page Content */}
      {!loadingHomePage && dynamicHomePage && (
        <div className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              <div className="prose max-w-none">
                {dynamicHomePage.processed_content ? (
                  <MarkdownRenderer 
                    content={dynamicHomePage.processed_content} 
                    useProcessedContent={true}
                    allowUnsafeHtml={false}
                  />
                ) : (
                  <MarkdownRenderer 
                    content={dynamicHomePage.content} 
                    allowUnsafeHtml={false}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-6 flex items-center justify-center">
              <img 
                src="https://usfirststg.prod.acquia-sites.com/sites/default/files/2024-banner/first_age_frc_rebuilt_logoanimation_gif_800x800%20(1).gif"
                alt="FRC 2026 Rebuilt Game Logo"
                className="h-128 w-auto"
              />
            </div>
            <p className="text-lg mb-8">
              Join us for the 2025-2026 FRC season as we compete in <strong className="text-swat-green">REBUILT</strong>
            </p>
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div className="p-6 bg-swat-black text-swat-white rounded-lg border-2 border-swat-green hover:shadow-lg transition-shadow">
              <div className="text-4xl font-impact text-swat-green mb-2">{moment().diff('2005-09-01', 'years')}</div>
              <div className="text-gray-300 font-medium">Years of Excellence</div>
            </div>
            <div className="p-6 bg-swat-black text-swat-white rounded-lg border-2 border-swat-green hover:shadow-lg transition-shadow">
              <div className="text-4xl font-impact text-swat-green mb-2">10+</div>
              <div className="text-gray-300 font-medium">Active Members</div>
            </div>
            <div className="p-6 bg-swat-black text-swat-white rounded-lg border-2 border-swat-green hover:shadow-lg transition-shadow">
              <div className="text-4xl font-impact text-swat-green mb-2">{subteams.length || '4'}</div>
              <div className="text-gray-300 font-medium">Specialized Subteams</div>
            </div>
            <div className="p-6 bg-swat-black text-swat-white rounded-lg border-2 border-swat-green hover:shadow-lg transition-shadow">
              <div className="text-4xl font-impact text-swat-green mb-2">∞</div>
              <div className="text-gray-300 font-medium">Opportunities</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-impact text-center mb-12 text-swat-black">OUR SUBTEAMS</h2>
          {subteams.length > 0 ? (
            <div className={`grid gap-8 ${
              subteams.length === 1 ? 'grid-cols-1 max-w-md mx-auto' :
              subteams.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto' :
              subteams.length === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto' :
              'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
            }`}>
              {subteams
                .sort((a, b) => a.display_order - b.display_order)
                .map((subteam) => (
                  <div key={subteam.id} className="bg-swat-white rounded-lg shadow-lg p-6 border-l-4 border-swat-green hover:shadow-xl transition-shadow">
                    <h3 className="text-xl font-bold mb-4 text-swat-black font-impact uppercase">
                      {subteam.name}
                    </h3>
                    <p className="text-gray-700">
                      {subteam.description || 'A specialized division of our robotics team.'}
                    </p>
                  </div>
                ))
              }
            </div>
          ) : (
            <div className="text-center text-gray-600">
              <p className="text-lg">Loading our specialized subteams...</p>
            </div>
          )}
        </div>
      </div>

      <div className="py-16 bg-swat-black">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-impact mb-8 text-swat-white">READY TO JOIN?</h2>
          <p className="text-lg text-gray-300 mb-8">
            Whether you're interested in engineering, programming, business, or media, 
            there's a place for you on <span className="text-swat-green font-bold">S.W.A.T. Team 1806</span>. 
            Join us and be part of something bigger!
          </p>
          {!user && (
            <Link
              to="/register"
              className="bg-swat-green hover:bg-swat-green-dark text-swat-white px-10 py-4 rounded-lg font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              GET STARTED
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;