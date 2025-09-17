import React, { useState, useEffect } from 'react';
import { api } from '../contexts/AuthContext';
import { renderTextWithNewlines } from '../utils/textUtils';

interface Resource {
  id: number;
  title: string;
  description?: string;
  url?: string;
  file_path?: string;
  category_id: number;
  display_order: number;
  is_active: boolean;
}

interface ResourceCategory {
  id: number;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
  resources?: Resource[];
}

const Resources: React.FC = () => {
  const [categories, setCategories] = useState<ResourceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await api.get('/resources');
        setCategories(response.data);
      } catch (err) {
        setError('Failed to load resources');
        console.error('Error fetching resources:', err);
        // Fallback to hardcoded resources if API fails
        setCategories(defaultCategories);
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, []);

  const defaultCategories: ResourceCategory[] = [
    {
      id: 1,
      name: 'Competition & Events',
      description: 'Current and previous event results and analysis',
      display_order: 1,
      is_active: true,
      resources: [
        {
          id: 1,
          title: 'The Blue Alliance',
          description: 'Official FRC competition results and statistics',
          url: 'https://thebluealliance.com/',
          category_id: 1,
          display_order: 1,
          is_active: true
        },
        {
          id: 2,
          title: 'FIRST Event Web',
          description: 'Official FIRST event listings and information',
          url: 'https://frc-events.firstinspires.org/',
          category_id: 1,
          display_order: 2,
          is_active: true
        },
        {
          id: 3,
          title: 'Statbotics',
          description: 'Advanced FRC statistics and predictions',
          url: 'https://statbotics.io/',
          category_id: 1,
          display_order: 3,
          is_active: true
        }
      ]
    },
    {
      id: 2,
      name: 'General Training',
      description: 'Comprehensive training resources from top teams',
      display_order: 2,
      is_active: true,
      resources: [
        {
          id: 4,
          title: 'Team 1678 Training Resources',
          description: 'Complete training suite from Citrus Circuits',
          url: 'https://drive.google.com/drive/folders/1JZJlnreqyJaHZKyZtouAvN6F6doAdw4b',
          category_id: 2,
          display_order: 1,
          is_active: true
        },
        {
          id: 5,
          title: 'Team 3847 Training Resources',
          description: 'Comprehensive documentation and guides',
          url: 'https://docs.google.com/document/d/e/2PACX-1vQk_ghFBN7682QI_17lbBCx8V_RXNomQRR7er-UIzlllsbdpO4RWOQAVnGFZAEypeNm2grS2G9oxFMp/pub',
          category_id: 2,
          display_order: 2,
          is_active: true
        },
        {
          id: 6,
          title: 'FIRST Technical Resources',
          description: 'Official FIRST technical documentation',
          url: 'https://www.firstinspires.org/resource-library/frc/technical-resources',
          category_id: 2,
          display_order: 3,
          is_active: true
        },
        {
          id: 7,
          title: 'Team 1806 Fall 2021 Training Archives',
          description: 'Our own training videos and materials',
          url: 'https://www.youtube.com/watch?v=Ry-zt5mYMUk&list=PLQjLmjiPahMucwW7h_I0U_LEk1-sbVlOA',
          category_id: 2,
          display_order: 4,
          is_active: true
        }
      ]
    },
    {
      id: 3,
      name: 'CAD & Design',
      description: 'Computer-aided design resources and tools',
      display_order: 3,
      is_active: true,
      resources: [
        {
          id: 8,
          title: 'Onshape 4 FRC',
          description: 'Onshape setup and tutorials for FRC',
          url: 'https://onshape4frc.com',
          category_id: 3,
          display_order: 1,
          is_active: true
        },
        {
          id: 9,
          title: 'Open Alliance',
          description: 'See what other teams are building',
          url: 'https://www.theopenalliance.com/',
          category_id: 3,
          display_order: 2,
          is_active: true
        },
        {
          id: 10,
          title: 'FRC Mechanism Encyclopedia',
          description: 'Comprehensive guide to robot mechanisms',
          url: 'https://www.projectb.net.au/resources/robot-mechanisms/',
          category_id: 3,
          display_order: 3,
          is_active: true
        },
        {
          id: 11,
          title: 'ReCalc Design Calculators',
          description: 'Engineering calculators for FRC design',
          url: 'https://www.reca.lc/',
          category_id: 3,
          display_order: 4,
          is_active: true
        }
      ]
    },
    {
      id: 4,
      name: 'Programming',
      description: 'Software development resources and documentation',
      display_order: 4,
      is_active: true,
      resources: [
        {
          id: 12,
          title: 'Team 1806 GitHub',
          description: 'Our open-source robot code',
          url: 'https://github.com/frc1806',
          category_id: 4,
          display_order: 1,
          is_active: true
        },
        {
          id: 13,
          title: 'WPILib Documentation',
          description: 'Official FRC programming documentation',
          url: 'https://docs.wpilib.org/en/stable/index.html',
          category_id: 4,
          display_order: 2,
          is_active: true
        },
        {
          id: 14,
          title: 'Rev Robotics Documentation',
          description: 'Documentation for Rev hardware and software',
          url: 'https://docs.revrobotics.com/docs/',
          category_id: 4,
          display_order: 3,
          is_active: true
        },
        {
          id: 15,
          title: 'CTRE Phoenix v6 Documentation',
          description: 'Current CTRE Phoenix documentation',
          url: 'https://v6.docs.ctr-electronics.com/en/stable/',
          category_id: 4,
          display_order: 4,
          is_active: true
        }
      ]
    },
    {
      id: 5,
      name: 'Maintenance & Assembly',
      description: 'Robot maintenance and assembly guides',
      display_order: 5,
      is_active: true,
      resources: [
        {
          id: 16,
          title: 'FRC Maintenance Guide',
          description: 'Comprehensive maintenance documentation',
          url: 'https://maintenance.spectrum3847.org/',
          category_id: 5,
          display_order: 1,
          is_active: true
        },
        {
          id: 17,
          title: 'FRC Bumper Guide',
          description: 'Official FIRST bumper construction guide',
          url: 'https://www.firstinspires.org/sites/default/files/uploads/resource_library/frc/technical-resources/frc_bumperguide.pdf',
          category_id: 5,
          display_order: 2,
          is_active: true
        },
        {
          id: 18,
          title: 'Team 3928 Bumper Guide',
          description: 'Detailed bumper construction tutorial',
          url: 'https://www.teamneutrino.org/resources/frc/bumpers/',
          category_id: 5,
          display_order: 3,
          is_active: true
        }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading resources...</div>
      </div>
    );
  }

  const displayCategories = categories.length > 0 ? categories : defaultCategories;

  return (
    <div className="bg-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-impact swat-title text-swat-black mb-4">
            RESOURCES
          </h1>
          <p className="text-lg text-gray-700">
            Essential tools, documentation, and learning materials for FIRST Robotics Competition
          </p>
        </div>

        {error && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-md p-4 mb-8">
            <div className="text-yellow-700">
              {error} - Showing default resources
            </div>
          </div>
        )}

        <div className="space-y-12">
          {displayCategories.map((category) => (
            <div key={category.id} className="bg-gray-100 rounded-lg p-8 border-l-4 border-swat-green">
              <div className="mb-6">
                <h2 className="text-2xl font-impact text-swat-black mb-2">
                  {category.name}
                </h2>
                {category.description && (
                  <div className="text-gray-700">{renderTextWithNewlines(category.description)}</div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.resources?.map((resource) => (
                  <div key={resource.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow border-l-2 border-swat-green">
                    <h3 className="text-lg font-bold text-swat-black mb-2">
                      {resource.url ? (
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-swat-green hover:text-swat-green-dark transition-colors"
                        >
                          {resource.title}
                        </a>
                      ) : (
                        resource.title
                      )}
                    </h3>
                    {resource.description && (
                      <div className="text-gray-600 text-sm mb-3">{renderTextWithNewlines(resource.description)}</div>
                    )}
                    {resource.url && (
                      <div className="mt-auto">
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm bg-swat-green hover:bg-swat-green-dark text-white px-3 py-2 rounded font-medium transition-colors"
                        >
                          Visit Resource
                          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-swat-black rounded-lg p-8 text-center border-4 border-swat-green">
          <h2 className="text-2xl font-impact text-swat-white mb-4">
            CAN'T FIND WHAT YOU'RE LOOKING FOR?
          </h2>
          <p className="text-lg text-gray-300 mb-6">
            Contact our team mentors or check out our GitHub for more resources
          </p>
          <div className="space-x-4">
            <a
              href="https://github.com/frc1806"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-swat-green hover:bg-swat-green-dark text-white px-6 py-3 rounded-md font-medium transition-colors"
            >
              Visit Our GitHub
            </a>
            <a
              href="mailto:robotics@smithville.k12.mo.us"
              className="inline-block bg-swat-white hover:bg-gray-200 text-swat-black px-6 py-3 rounded-md font-medium transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;