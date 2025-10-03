import React, { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';
import SEO from '../components/SEO';
import { redirectBotIfNeeded } from '../utils/botDetection';

interface Sponsor {
  id: number;
  name: string;
  logo_path?: string;
  website_url?: string;
  tier: 'title_sponsor' | 'gold' | 'warrior' | 'black' | 'green';
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const Sponsors: React.FC = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect bots to pre-rendered version
    redirectBotIfNeeded('sponsors');

    const fetchSponsors = async () => {
      try {
        const response = await api.get('/sponsors');
        setSponsors(response.data);
      } catch (err) {
        setError('Failed to load sponsors');
        console.error('Error fetching sponsors:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSponsors();
  }, []);

  const titleSponsors = sponsors.filter(s => s.tier === 'title_sponsor').sort((a, b) => a.display_order - b.display_order);
  const goldSponsors = sponsors.filter(s => s.tier === 'gold').sort((a, b) => a.display_order - b.display_order);
  const warriorSponsors = sponsors.filter(s => s.tier === 'warrior').sort((a, b) => a.display_order - b.display_order);
  const blackSponsors = sponsors.filter(s => s.tier === 'black').sort((a, b) => a.display_order - b.display_order);
  const greenSponsors = sponsors.filter(s => s.tier === 'green').sort((a, b) => a.display_order - b.display_order);

  const SponsorGrid = ({ sponsors, tier }: { sponsors: Sponsor[], tier: string }) => {
    if (sponsors.length === 0) return null;

    return (
      <div className="mb-16">
        <h2 className={`text-2xl font-bold text-center mb-8 ${
          tier === 'title_sponsor' ? 'bg-clip-text text-transparent bg-swat-gradient' :
          tier === 'gold' ? 'text-yellow-600' :
          tier === 'warrior' ? 'bg-clip-text text-transparent bg-warrior-gradient' :
          tier === 'black' ? 'text-gray-800' :
          'text-green-600'
        }`}>
          {tier === 'title_sponsor' ? 'Title Sponsor Partner' : 
           tier.charAt(0).toUpperCase() + tier.slice(1) + " Tier Partners"} 
        </h2>
        <div className={`grid gap-8 items-center justify-items-center ${
          tier === 'title_sponsor' ? 'grid-cols-1' : 
          tier === 'gold' ? 'grid-cols-1' : 
          tier === 'warrior' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
          'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        }`}>
          {sponsors.map((sponsor) => {
            const content = (
              <div className="flex flex-col items-center">
                {sponsor.logo_path ? (
                  <img 
                    src={sponsor.logo_path} 
                    alt={sponsor.name}
                    className={`object-contain ${
                      tier === 'title_sponsor' ? 'max-h-80 max-w-full' :
                      tier === 'gold' ? 'max-h-64 max-w-full' : 
                      tier === 'warrior' ? 'h-20 w-auto' :
                      'h-16 w-auto'
                    }`}
                  />
                ) : (
                  <div className={`font-semibold text-gray-700 ${
                    tier === 'title_sponsor' ? 'text-4xl' :
                    tier === 'gold' ? 'text-3xl' :
                    tier === 'warrior' ? 'text-xl' :
                    'text-lg'
                  }`}>
                    {sponsor.name}
                  </div>
                )}
                {tier !== 'title_sponsor' && tier !== 'gold' && sponsor.logo_path && (
                  <div className="mt-2 text-sm font-medium text-gray-600">
                    {sponsor.name}
                  </div>
                )}
              </div>
            );

            if (sponsor.website_url) {
              return (
                <a 
                  key={sponsor.id}
                  href={sponsor.website_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:opacity-80 transition-opacity"
                >
                  {content}
                </a>
              );
            }

            return (
              <div key={sponsor.id}>
                {content}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading sponsors...</div>
      </div>
    );
  }

  return (
    <div className="bg-white py-12">
      <SEO
        title="Sponsors"
        description="Meet the gracious sponsors supporting SWAT Team 1806. These amazing organizations and individuals make our FIRST Robotics Competition team possible through their generous support."
        keywords="SWAT 1806 sponsors, FRC sponsors, robotics team sponsors, Smithville robotics sponsors, FIRST sponsors, team partners, gracious professionalism, community support"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            Our Gracious Sponsors
          </h1>
          <p className="text-lg text-gray-600">
            These amazing organizations and individuals make our team possible
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 rounded-md p-4 mb-8">
            <div className="text-red-700">{error}</div>
          </div>
        )}

        {/* Dynamic Sponsor Tiers */}
        <SponsorGrid sponsors={titleSponsors} tier="title_sponsor" />
        <SponsorGrid sponsors={goldSponsors} tier="gold" />
        <SponsorGrid sponsors={warriorSponsors} tier="warrior" />
        <SponsorGrid sponsors={blackSponsors} tier="black" />
        <SponsorGrid sponsors={greenSponsors} tier="green" />

        {/* Message when no sponsors are configured */}
        {sponsors.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            <p className="text-lg mb-4">We're currently updating our sponsor information.</p>
            <p>Please check back soon to see our amazing supporters!</p>
          </div>
        )}

        {/* Sponsorship Call to Action */}
        <div className="bg-blue-50 rounded-lg p-8 mb-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Interested in Sponsoring S.W.A.T.?
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Help us inspire the next generation of STEM leaders and innovators!
            </p>
            <div className="space-y-4">
              <a
                href="https://forms.gle/BUpCR9KNgTg96KZz5"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold text-lg transition duration-200 mr-4"
              >
                Sponsor Us!
              </a>
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Info for Potential Sponsors:
                </h3>
                <iframe
                  src="https://drive.google.com/viewerng/viewer?embedded=true&url=https://team1806.com/pdfs/SponsorInfo.pdf"
                  width="100%"
                  height="400"
                  className="border rounded-md max-w-2xl mx-auto"
                  title="Sponsor Information PDF"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
          <div className="space-y-2 mb-6">
            <p className="text-gray-700">
              <strong>Email:</strong> robotics@smithville.k12.mo.us
            </p>
          </div>
          
          <div className="flex justify-center space-x-6">
            <a
              href="https://www.facebook.com/swat1806/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img src="/pictures/sponsors/facebook.png" alt="Facebook" className="w-12 h-12" />
            </a>
            <a
              href="https://www.youtube.com/channel/UCeVOdD56gIMVcOtVRwnKNpA"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img src="/pictures/sponsors/youtube.png" alt="YouTube" className="w-12 h-12" />
            </a>
            <a
              href="https://www.twitch.tv/swat1806"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-80 transition-opacity"
            >
              <img src="/pictures/sponsors/twitch.png" alt="Twitch" className="w-12 h-12" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sponsors;