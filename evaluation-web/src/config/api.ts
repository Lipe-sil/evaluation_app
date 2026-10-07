let rawApiUrl =
  (import.meta.env.URL_API as string | undefined) ||
  (import.meta.env.VITE_URL_API as string | undefined) ||
  'http://localhost:8000';

// In SPAs, API requests run in the user's browser (host machine), not inside the Docker network.
// If the URL points to the Docker internal service name "backend", the browser's DNS fails with net::ERR_NAME_NOT_RESOLVED.
// We safely map "backend" to the browser's hostname or localhost.
if (typeof window !== 'undefined') {
  const host = window.location.hostname || 'localhost';
  if (rawApiUrl.includes('://backend')) {
    rawApiUrl = rawApiUrl.replace('://backend', `://${host}`);
  } else if (rawApiUrl.includes('://localhost') && host !== 'localhost') {
    rawApiUrl = rawApiUrl.replace('://localhost', `://${host}`);
  }
}

export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

