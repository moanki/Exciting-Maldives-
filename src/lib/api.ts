import { supabase } from '../supabase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Resolves an API URL, prepending the base URL if it's a relative path.
 */
function resolveApiUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Ensure we don't have double slashes if API_BASE_URL ends with / and url starts with /
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = url.startsWith('/') ? url : `/${url}`;
  
  return `${base}${path}`;
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
export async function readApiJson(response: Response) {
  const text = await response.text();
  
  try {
    return JSON.parse(text);
  } catch (err) {
    // If it's not JSON, check if it looks like HTML
    if (text.trim().toLowerCase().startsWith('<!doctype html') || text.trim().toLowerCase().startsWith('<html')) {
      throw new Error("Server returned HTML instead of JSON. Check API route, proxy, or API base URL.");
    }
    
    // Fallback for other non-JSON content
    throw new Error(`Failed to parse server response as JSON: ${text.slice(0, 100)}${text.length > 100 ? '...' : ''}`);
  }
}
