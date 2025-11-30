/**
 * Avatar Helper Utilities
 * Provides functions for loading team avatars from local cache with automatic backend proxy fallback
 *
 * Fallback behavior:
 * 1. Try local cache first (/teamavatars/frc1806.png)
 * 2. If missing, fetch from backend proxy (bypasses CORS) and cache in localStorage
 * 3. If backend proxy fails, hide gracefully
 */

// In-memory cache for avatar fetches in progress (prevent duplicate requests)
const fetchingAvatars = new Map<string, Promise<string | null>>();

// localStorage key prefix for cached avatar data
const AVATAR_CACHE_PREFIX = 'avatar_';
const CACHE_DURATION_DAYS = 7;

/**
 * Fetch avatar from backend proxy (bypasses CORS)
 */
async function fetchAvatarFromBackend(year: number, teamNum: number): Promise<string | null> {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

    // Fetch from backend proxy endpoint
    const response = await fetch(`${apiUrl}/avatars/${year}/${teamNum}`);

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`Avatar not found for team ${teamNum}`);
      } else if (response.status === 503) {
        console.warn('Avatar service not configured on backend');
      } else {
        console.warn(`Backend avatar proxy error for team ${teamNum}: ${response.status}`);
      }
      return null;
    }

    const data = await response.json();

    // The backend returns { success: true, data: base64Data, teamNumber: number }
    if (data.success && data.data) {
      const base64Data = data.data;

      // Cache in localStorage with timestamp
      const cacheData = {
        data: base64Data,
        timestamp: Date.now()
      };
      localStorage.setItem(`${AVATAR_CACHE_PREFIX}${teamNum}`, JSON.stringify(cacheData));

      // Return as data URL
      return `data:image/png;base64,${base64Data}`;
    }

    return null;
  } catch (error) {
    console.error(`Failed to fetch avatar for team ${teamNum} from backend:`, error);
    return null;
  }
}

/**
 * Get cached avatar from localStorage
 */
function getCachedAvatar(teamNum: number): string | null {
  try {
    const cached = localStorage.getItem(`${AVATAR_CACHE_PREFIX}${teamNum}`);
    if (!cached) return null;

    const cacheData = JSON.parse(cached);
    const ageInDays = (Date.now() - cacheData.timestamp) / (1000 * 60 * 60 * 24);

    // Return cached data if less than 7 days old
    if (ageInDays < CACHE_DURATION_DAYS) {
      return `data:image/png;base64,${cacheData.data}`;
    }

    // Cache is stale, remove it
    localStorage.removeItem(`${AVATAR_CACHE_PREFIX}${teamNum}`);
    return null;
  } catch (error) {
    console.error(`Failed to read cached avatar for team ${teamNum}:`, error);
    return null;
  }
}

/**
 * Get the avatar URL for a team from local cache
 * @param year - Competition year
 * @param teamKey - Team key (e.g., 'frc1806')
 * @returns Local avatar URL
 */
export function getTeamAvatarUrl(year: number, teamKey: string): string {
  // Return local avatar URL
  // Avatars are pre-downloaded to /teamavatars/ using the FIRST API
  return `/teamavatars/${teamKey}.png`;
}

/**
 * Handle avatar load error with automatic FIRST API fallback
 * @param event - Image error event
 * @param year - Competition year
 * @param teamKey - Team key (e.g., 'frc1806')
 */
export async function handleAvatarError(
  event: React.SyntheticEvent<HTMLImageElement>,
  year: number,
  teamKey: string
): Promise<void> {
  const img = event.currentTarget;
  const teamNum = parseInt(teamKey.replace('frc', ''));

  // Hide immediately to prevent alt text from showing
  img.style.display = 'none';

  // Check if we're already using a data URL (already tried fallback)
  if (img.src.startsWith('data:')) {
    return;
  }

  // Check localStorage cache first
  const cached = getCachedAvatar(teamNum);
  if (cached) {
    img.src = cached;
    img.style.display = '';  // Show once loaded
    return;
  }

  // Check if we're already fetching this avatar
  const fetchKey = `${year}-${teamNum}`;
  if (fetchingAvatars.has(fetchKey)) {
    const result = await fetchingAvatars.get(fetchKey);
    if (result) {
      img.src = result;
      img.style.display = '';  // Show once loaded
    }
    return;
  }

  // Fetch from backend proxy
  const fetchPromise = fetchAvatarFromBackend(year, teamNum);
  fetchingAvatars.set(fetchKey, fetchPromise);

  try {
    const result = await fetchPromise;
    if (result) {
      img.src = result;
      img.style.display = '';  // Show once loaded
    }
  } finally {
    // Clean up the fetch promise after a short delay
    setTimeout(() => fetchingAvatars.delete(fetchKey), 1000);
  }
}
