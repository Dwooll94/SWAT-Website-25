import React, { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';

interface SlideshowImage {
  id: number;
  file_path: string;
  caption?: string;
  display_order: number;
  is_active: boolean;
}

interface ResponsiveSlideshowProps {
  className?: string;
  aspectRatio?: string; // e.g., "16/9", "4/3", "1/1"
}

const ResponsiveSlideshow: React.FC<ResponsiveSlideshowProps> = ({ 
  className = "",
  aspectRatio = "16/9"
}) => {
  const [images, setImages] = useState<SlideshowImage[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Default images from the old website
  const defaultImages: SlideshowImage[] = [
    {
      id: 1,
      file_path: '/pictures/image/slides/_u/2024-MOKANState.jpg',
      caption: '2024 - MOKAN State Championships',
      display_order: 1,
      is_active: true
    },
    {
      id: 2,
      file_path: '/pictures/image/slides/_u/2024-GKC.jpg',
      caption: '2024 - Greater Kansas City Regional',
      display_order: 2,
      is_active: true
    },
    {
      id: 3,
      file_path: '/pictures/image/slides/_u/2023-cowtown.jpg',
      caption: '2023 - Cowtown Throwdown',
      display_order: 3,
      is_active: true
    },
    {
      id: 4,
      file_path: '/pictures/image/slides/_u/2023-remakelearning.jpg',
      caption: '2023 - Remake Learning Days Smithville',
      display_order: 4,
      is_active: true
    },
    {
      id: 5,
      file_path: '/pictures/image/slides/_u/2023-Board-Meeting.jpg',
      caption: '2023 - Smithville School Board Meeting',
      display_order: 5,
      is_active: true
    },
    {
      id: 6,
      file_path: '/pictures/image/slides/_u/2023-greencountry.jpg',
      caption: '2023 - Green Country Regional',
      display_order: 6,
      is_active: true
    },
    {
      id: 7,
      file_path: '/pictures/image/slides/_u/2023-heartland.jpg',
      caption: '2023 - Heartland Regional',
      display_order: 7,
      is_active: true
    },
    {
      id: 8,
      file_path: '/pictures/image/slides/_u/2023-Robot-in-progress.jpg',
      caption: '2023 - Charged Up Competition Bot',
      display_order: 8,
      is_active: true
    }
  ];

  useEffect(() => {
    const fetchSlideshowImages = async () => {
      try {
        const response = await api.get('/slideshow');
        if (response.data && response.data.length > 0) {
          setImages(response.data);
        } else {
          setImages(defaultImages);
        }
      } catch (err) {
        console.error('Error fetching slideshow images:', err);
        setImages(defaultImages);
        setError('Using default images');
      } finally {
        setLoading(false);
      }
    };

    fetchSlideshowImages();
  }, []);

  useEffect(() => {
    if (images.length > 1) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % images.length);
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(timer);
    }
  }, [images.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (loading) {
    return (
      <div 
        className={`relative w-full bg-swat-black rounded-lg flex items-center justify-center ${className}`}
        style={{ aspectRatio }}
      >
        <div className="text-lg text-swat-white">Loading slideshow...</div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div 
        className={`relative w-full bg-swat-black rounded-lg flex items-center justify-center ${className}`}
        style={{ aspectRatio }}
      >
        <div className="text-lg text-swat-white">No slideshow images available</div>
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full bg-swat-black rounded-lg overflow-hidden shadow-xl ${className}`}
      style={{ aspectRatio }}
    >
      {error && (
        <div className="absolute top-2 right-2 bg-yellow-500 text-swat-white px-2 py-1 rounded text-xs z-20">
          {error}
        </div>
      )}
      
      {/* Main image container with proper letterboxing */}
      <div className="relative w-full h-full flex items-center justify-center bg-swat-black">
        <img
          src={images[currentSlide].file_path}
          alt={images[currentSlide].caption || `Slide ${currentSlide + 1}`}
          className="max-w-full max-h-full object-contain transition-opacity duration-500"
          onError={(e) => {
            // Fallback for broken images
            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjQ1MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMzMzIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlMuVy5BLlQuIFRlYW0gMTgwNjwvdGV4dD48dGV4dCB4PSI1MCUiIHk9IjYwJSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE2IiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgTm90IEZvdW5kPC90ZXh0Pjwvc3ZnPg==';
          }}
        />
        
        {/* Caption overlay */}
        {images[currentSlide].caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-swat-black via-swat-black/80 to-transparent text-swat-white p-3 sm:p-4">
            <h4 className="text-sm sm:text-lg font-bold font-impact tracking-wide">
              {images[currentSlide].caption}
            </h4>
          </div>
        )}
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 sm:left-4 top-1/2 transform -translate-y-1/2 bg-swat-black/60 hover:bg-swat-green text-swat-white p-1.5 sm:p-2 rounded-full transition-all z-10 hover:scale-110"
            aria-label="Previous slide"
          >
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={nextSlide}
            className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 bg-swat-black/60 hover:bg-swat-green text-swat-white p-1.5 sm:p-2 rounded-full transition-all z-10 hover:scale-110"
            aria-label="Next slide"
          >
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Slide indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:space-x-2 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all hover:scale-110 ${
                index === currentSlide
                  ? 'bg-swat-green shadow-lg'
                  : 'bg-swat-white/50 hover:bg-swat-white/70'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ResponsiveSlideshow;