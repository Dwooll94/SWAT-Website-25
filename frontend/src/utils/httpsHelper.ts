/**
 * HTTPS Helper Utilities
 * 
 * Utilities to help ensure proper HTTPS configuration and detect mixed content issues
 */

/**
 * Check if the current environment should use HTTPS
 */
export const shouldUseHTTPS = (): boolean => {
  // In production, always use HTTPS
  if (process.env.NODE_ENV === 'production') {
    return true;
  }
  
  // In development, check if HTTPS is explicitly enabled
  if (process.env.HTTPS === 'true') {
    return true;
  }
  
  // Check if the API URL uses HTTPS
  const apiUrl = process.env.REACT_APP_API_URL || '';
  if (apiUrl.startsWith('https://')) {
    return true;
  }
  
  return false;
};

/**
 * Get the appropriate protocol for the current environment
 */
export const getProtocol = (): 'http:' | 'https:' => {
  return shouldUseHTTPS() ? 'https:' : 'http:';
};

/**
 * Ensure a URL uses the correct protocol for the current environment
 */
export const ensureCorrectProtocol = (url: string): string => {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    // If it's a relative URL, leave it as is
    return url;
  }
  
  const targetProtocol = getProtocol();
  
  if (url.startsWith('http://') && targetProtocol === 'https:') {
    return url.replace('http://', 'https://');
  }
  
  if (url.startsWith('https://') && targetProtocol === 'http:') {
    return url.replace('https://', 'http://');
  }
  
  return url;
};

/**
 * Log mixed content warnings in development
 */
export const checkMixedContent = (url: string, context: string): void => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  const isPageHTTPS = window.location.protocol === 'https:';
  const isResourceHTTP = url.startsWith('http://');
  
  if (isPageHTTPS && isResourceHTTP) {
    console.warn(
      `🔒 Mixed Content Warning: Loading HTTP resource '${url}' on HTTPS page in context: ${context}. ` +
      'This may be blocked by the browser. Consider updating to HTTPS.'
    );
  }
};

/**
 * Development helper to validate all external resources use HTTPS in production
 */
export const validateHTTPSResources = (): void => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  // Check all images
  const images = document.querySelectorAll('img[src^="http://"]');
  images.forEach((img) => {
    console.warn(
      `🔒 HTTP Image detected: ${(img as HTMLImageElement).src}. ` +
      'Consider updating to HTTPS for production.'
    );
  });
  
  // Check all iframes
  const iframes = document.querySelectorAll('iframe[src^="http://"]');
  iframes.forEach((iframe) => {
    console.warn(
      `🔒 HTTP iframe detected: ${(iframe as HTMLIFrameElement).src}. ` +
      'Consider updating to HTTPS for production.'
    );
  });
  
  // Check all scripts
  const scripts = document.querySelectorAll('script[src^="http://"]');
  scripts.forEach((script) => {
    console.warn(
      `🔒 HTTP script detected: ${(script as HTMLScriptElement).src}. ` +
      'Consider updating to HTTPS for production.'
    );
  });
};

/**
 * Get environment-specific configuration
 */
export const getHTTPSConfig = () => {
  return {
    isHTTPS: shouldUseHTTPS(),
    protocol: getProtocol(),
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
    environment: process.env.NODE_ENV,
    httpsEnabled: process.env.HTTPS === 'true',
  };
};

/**
 * Log HTTPS configuration in development
 */
export const logHTTPSConfig = (): void => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  
  const config = getHTTPSConfig();
  
  console.group('🔒 HTTPS Configuration');
  console.log('Environment:', config.environment);
  console.log('HTTPS Enabled:', config.isHTTPS);
  console.log('Protocol:', config.protocol);
  console.log('API URL:', config.apiUrl);
  console.log('Dev Server HTTPS:', config.httpsEnabled);
  console.groupEnd();
  
  if (config.isHTTPS && window.location.protocol === 'http:') {
    console.warn(
      '⚠️  Configuration suggests HTTPS should be used, but current page is HTTP. ' +
      'Consider updating your development setup.'
    );
  }
};