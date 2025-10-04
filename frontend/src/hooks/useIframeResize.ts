import { useEffect } from 'react';

/**
 * Custom hook to automatically resize iframe to content height
 * Sends postMessage to parent window with content height
 *
 * @param dependencies - Optional array of dependencies that trigger resize when changed
 */
export const useIframeResize = (dependencies: any[] = []) => {
  useEffect(() => {
    const sendHeight = () => {
      // Force a reflow to get accurate measurements
      document.body.offsetHeight;

      // Use multiple measurements to get the most accurate height
      const body = document.body;
      const html = document.documentElement;

      const height = Math.max(
        body.scrollHeight,
        body.offsetHeight,
        html.clientHeight,
        html.scrollHeight,
        html.offsetHeight
      );

      window.parent.postMessage(
        { type: 'iframe-resize', height },
        '*'
      );
    };

    // Send height multiple times with increasing delays to catch layout changes
    const timeouts = [
      setTimeout(sendHeight, 0),
      setTimeout(sendHeight, 50),
      setTimeout(sendHeight, 150),
      setTimeout(sendHeight, 300)
    ];

    // Create a ResizeObserver to watch for content changes
    const resizeObserver = new ResizeObserver(() => {
      // Add a small delay to ensure DOM has updated
      setTimeout(sendHeight, 0);
    });

    // Observe both body and html elements
    resizeObserver.observe(document.body);
    resizeObserver.observe(document.documentElement);

    // Also send height on window resize
    window.addEventListener('resize', sendHeight);

    // Cleanup
    return () => {
      timeouts.forEach(clearTimeout);
      resizeObserver.disconnect();
      window.removeEventListener('resize', sendHeight);
    };
  }, dependencies);
};
