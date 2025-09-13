import React, { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';

interface Sponsor {
  id: number;
  name: string;
  logo_path: string | null;
  website_url: string | null;
  tier: 'title_sponsor' | 'gold' | 'warrior' | 'black' | 'green';
}

const SponsorSlideshow: React.FC = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadSponsors = async () => {
      try {
        const [titleResponse, goldResponse, warriorResponse] = await Promise.all([
          api.get('/sponsors?tier=title_sponsor'),
          api.get('/sponsors?tier=gold'),
          api.get('/sponsors?tier=warrior')
        ]);
        
        const titleSponsors: Sponsor[] = titleResponse.data;
        const goldSponsors: Sponsor[] = goldResponse.data;
        const warriorSponsors: Sponsor[] = warriorResponse.data;
        
        setSponsors([...titleSponsors, ...goldSponsors, ...warriorSponsors]);
      } catch (error) {
        console.error('Error loading sponsors:', error);
      }
    };

    loadSponsors();
  }, []);

  useEffect(() => {
    if (sponsors.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % sponsors.length);
      }, 4000);

      return () => clearInterval(interval);
    }
  }, [sponsors.length]);

  if (sponsors.length === 0) {
    return null;
  }

  const currentSponsor = sponsors[currentIndex];

  const handleSponsorClick = () => {
    if (currentSponsor.website_url) {
      window.open(currentSponsor.website_url, '_blank');
    }
  };

  return (
    <div className="bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <div 
          className={`bg-white rounded-lg shadow-lg p-8 border-4 ${
            currentSponsor.tier === 'title_sponsor' ? 'border-purple-600' : 
            currentSponsor.tier === 'gold'? 'border-yellow-400':
            'border-green-600'
          } transition-all duration-500 ${
            currentSponsor.website_url ? 'cursor-pointer hover:shadow-xl' : ''
          }`}
          onClick={handleSponsorClick}
        >
          <div className="mb-4">
            {currentSponsor.logo_path ? (
              <img
                src={currentSponsor.logo_path}
                alt={`${currentSponsor.name} logo`}
                className="max-h-24 mx-auto object-contain"
              />
            ) : (
              <div className="text-2xl font-bold text-gray-600">
                {currentSponsor.name}
              </div>
            )}
          </div>
          <h3 className="text-2xl font-impact text-swat-black mb-2">
            Thank You, {currentSponsor.name}!
          </h3>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold text-white ${
            currentSponsor.tier === 'title_sponsor' 
              ? 'bg-swat-gradient' 
              : currentSponsor.tier === 'gold' ? 'bg-yellow-500' : 'bg-warrior-gradient'
          }`}>
            {currentSponsor.tier === 'title_sponsor' ? 'Title' : currentSponsor.tier.charAt(0).toUpperCase() + currentSponsor.tier.slice(1)} Sponsor
          </div>
        </div>
        
        {sponsors.length > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            {sponsors.map((_, index) => (
              <button
                key={index}
                className={`w-3 h-3 rounded-full transition-colors ${
            currentSponsor.tier === 'title_sponsor' 
              ? 'bg-swat-gradient' 
              : currentSponsor.tier === 'gold' ? 'bg-yellow-500' : 'bg-warrior-gradient'
          }`}
                onClick={() => setCurrentIndex(index)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SponsorSlideshow;