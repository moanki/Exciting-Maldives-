import { supabase } from '../supabase';

/**
 * A wrapper around fetch that automatically adds the Supabase session token
 * to the Authorization header.
 */
export async function apiFetch(url: string, options: RequestInit = {}) {
  console.log(`[apiFetch] Fetching ${url}`);
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers = {
    ...options.headers,
    ...(token && !url.includes('/api/ai/status') ? { 
      'Authorization': `Bearer ${token}`,
      'X-Session-ID': `Bearer ${token}`,
      'X-App-Auth': `Bearer ${token}`
    } : {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
}
