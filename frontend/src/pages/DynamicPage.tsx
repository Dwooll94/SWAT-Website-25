import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { api } from '../contexts/AuthContext';
import MarkdownRenderer from '../components/MarkdownRenderer';

interface PageData {
  id: number;
  slug: string;
  title: string;
  content: string;
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
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
            {page.title}
          </h1>
          {page.updated_at && (
            <p className="text-sm text-gray-500">
              Last updated: {new Date(page.updated_at).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="prose max-w-none">
          <MarkdownRenderer content={page.content || 'This page has no content yet.'} />
        </div>
      </div>
    </div>
  );
};

export default DynamicPage;