import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
}

/**
 * SEO Component for managing page meta tags
 * Uses react-helmet-async to dynamically update meta tags for each page
 */
const SEO: React.FC<SEOProps> = ({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogUrl,
  twitterCard = 'summary_large_image',
}) => {
  // Default values
  const defaultTitle = 'SWAT Team 1806 - Smithville Warriors Advancing Technology';
  const defaultDescription = 'SWAT Team 1806 - Smithville Warriors Advancing Technology. FRC robotics team from Smithville, Missouri competing in FIRST Robotics Competition. Building tomorrow\'s leaders today.';
  const defaultKeywords = 'SWAT 1806, Team 1806, FRC robotics, FIRST Robotics Competition, Smithville robotics, Missouri robotics, STEM education, robotics team, FRC team, engineering, programming';

  // Use custom values or fall back to defaults
  const pageTitle = title ? `${title} | SWAT Team 1806` : defaultTitle;
  const pageDescription = description || defaultDescription;
  const pageKeywords = keywords || defaultKeywords;
  const pageOgTitle = ogTitle || title || defaultTitle;
  const pageOgDescription = ogDescription || description || defaultDescription;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="title" content={pageTitle} />
      <meta name="description" content={pageDescription} />
      <meta name="keywords" content={pageKeywords} />

      {/* Open Graph / Facebook */}
      <meta property="og:title" content={pageOgTitle} />
      <meta property="og:description" content={pageOgDescription} />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {ogUrl && <meta property="og:url" content={ogUrl} />}

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={pageOgTitle} />
      <meta name="twitter:description" content={pageOgDescription} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}
    </Helmet>
  );
};

export default SEO;
