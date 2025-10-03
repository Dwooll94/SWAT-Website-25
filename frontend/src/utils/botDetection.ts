/**
 * Bot Detection and Redirect Utility
 *
 * Detects search engine crawlers and bots, and redirects them to pre-rendered pages
 * for better SEO indexing.
 */

/**
 * List of common search engine crawler user agents
 * This includes major search engines and social media crawlers
 */
const BOT_USER_AGENTS = [
  // Google
  'Googlebot',
  'Google-InspectionTool',
  'GoogleOther',
  'APIs-Google',

  // Bing
  'Bingbot',
  'BingPreview',
  'msnbot',

  // Yahoo
  'Slurp',
  'Yahoo',

  // DuckDuckGo
  'DuckDuckBot',

  // Baidu
  'Baiduspider',

  // Yandex
  'YandexBot',

  // Social Media Crawlers
  'facebookexternalhit',
  'Facebot',
  'Twitterbot',
  'LinkedInBot',
  'Slackbot',
  'WhatsApp',
  'TelegramBot',
  'Discordbot',

  // Other Search Engines
  'Applebot',
  'Sogou',
  'Exabot',
  'ia_archiver', // Alexa

  // SEO Tools
  'AhrefsBot',
  'SemrushBot',
  'MJ12bot', // Majestic
  'DotBot',
  'Screaming Frog',
  'SiteAuditBot',

  // Generic bot indicators
  'bot',
  'crawler',
  'spider',
  'scraper',
];

/**
 * Detects if the current user agent is a bot/crawler
 * @returns true if the user agent appears to be a bot
 */
export const isBot = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent || '';

  // Check if any of the bot user agents are present (case insensitive)
  return BOT_USER_AGENTS.some(botAgent =>
    userAgent.toLowerCase().includes(botAgent.toLowerCase())
  );
};

/**
 * Redirects bots to a pre-rendered version of the page
 * @param pageSlug - The slug/path of the page (e.g., 'home', 'sponsors', 'about')
 */
export const redirectBotIfNeeded = (pageSlug: string): void => {
  if (!isBot()) {
    return;
  }

  const botRedirectBase = process.env.REACT_APP_BOT_REDIRECT_BASE_URL;

  if (!botRedirectBase) {
    console.warn('Bot detected but REACT_APP_BOT_REDIRECT_BASE_URL is not configured');
    return;
  }

  // Construct the redirect URL
  const redirectUrl = `${botRedirectBase}/${pageSlug}`;

  // Perform the redirect
  window.location.href = redirectUrl;
};
