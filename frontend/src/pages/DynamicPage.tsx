import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { api } from '../contexts/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';

interface PageData {
  id: number;
  slug: string;
  title: string;
  content: string;
  processed_content?: string;
  content_preview?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const DynamicPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPage = async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/pages/slug/${slug}`);
        setPage(response.data);
      } catch (error: any) {
        console.error('Error loading page:', error);
        if (error.response?.status === 404) {
          setNotFound(true);
        } else {
          setError('Failed to load page content. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-swat-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading page...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return <Navigate to="/404" replace />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Error Loading Page</h1>
            <p className="text-gray-600 mb-8">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-swat-green text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!page) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Page Header with SWAT Branding */}
        <div className="text-center mb-12 bg-gradient-to-r from-swat-green/5 to-swat-green/10 rounded-xl p-8 border border-swat-green/20">
          <h1 className="text-5xl font-impact text-swat-green mb-4 tracking-wide">
            {page.title}
          </h1>
          {page.updated_at && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>Last updated: {new Date(page.updated_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</span>
            </div>
          )}
        </div>

        {/* Content Area with SWAT Styling */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="prose max-w-none">
            {page.processed_content ? (
              <MarkdownRenderer 
                content={page.processed_content} 
                useProcessedContent={true}
                allowUnsafeHtml={false}
              />
            ) : (
              <MarkdownRenderer 
                content={page.content || `# Welcome to SWAT Team 1806
                
This page is currently being updated. Check back soon for exciting content about our robotics team!

**Smithville Warriors Advancing Technology** - Building Tomorrow's Leaders Today.`} 
                allowUnsafeHtml={false}
              />
            )}
          </div>
        </div>

        {/* Footer with Team Branding */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center space-x-2 text-sm text-gray-500">
            <span>🤖</span>
            <span>SWAT Team 1806 - Smithville Warriors Advancing Technology</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicPage;