import { supabase } from '../supabase';

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

/**
 * Resolves an API URL, prepending the base URL if it's a relative path.
 */
function resolveApiUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  const path = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE_URL}${path}`;
}

/**
 * A wrapper around fetch that automatically adds the Supabase session token
 * to the Authorization header.
 */
export async function apiFetch(url: string, options: RequestInit = {}) {
  const resolvedUrl = resolveApiUrl(url);
  console.log(`[apiFetch] Fetching ${resolvedUrl}`);
  
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = {
    'Accept': 'application/json',
    ...options.headers,
    ...(token && !url.includes('/api/ai/status') ? { 
      'Authorization': `Bearer ${token}`,
      'X-Session-ID': `Bearer ${token}`,
      'X-App-Auth': `Bearer ${token}`
    } : {}),
  };

  const response = await fetch(resolvedUrl, {
    ...options,
    headers,
  });

  return response;
}

/**
 * Safely reads JSON from a response, detecting if the server returned HTML instead.
 * 
 * If HTML comes back from /api routes, the request likely hit the frontend app 
 * or wrong proxy instead of the Express server.
 */
export async function readApiJson<T = any>(response: Response): Promise<T> {
  const text = await response.text();
  
  try {
    const data = JSON.parse(text);
    
    // If response is not ok, throw the best available message
    if (!response.ok) {
      throw new Error(data.error || data.message || `API Error: ${response.status} ${response.statusText}`);
    }
    
    return data;
  } catch (err: any) {
    // If it's already an error with a message we just threw, rethrow it
    if (err.message && !err.message.includes('Unexpected token')) {
      throw err;
    }

    // If it's not JSON, check if it looks like HTML
    const lowerText = text.trim().toLowerCase();
    if (lowerText.startsWith('<!doctype html') || lowerText.startsWith('<html')) {
      const titleMatch = text.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : 'Unknown Page';
      throw new Error(`Server returned HTML ("${title}") instead of JSON. Content teaser: ${text.slice(0, 100).replace(/\n/g, ' ')}...`);
    }
    
    // Fallback for other non-JSON content or empty response
    if (!text.trim()) {
      throw new Error("Server returned an empty response.");
    }

    throw new Error(`Failed to parse server response as JSON: ${text.slice(0, 100)}${text.length > 100 ? '...' : ''}`);
  }
}
