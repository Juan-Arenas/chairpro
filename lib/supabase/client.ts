import { createBrowserClient } from '@supabase/ssr';

function isValidUrl(url?: string): boolean {
  if (!url) return false;
  if (url.includes('TU_URL') || url.includes('your-project') || url.includes('YOUR_')) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Safe fallback if not configured yet
  const safeUrl = isValidUrl(url) ? url! : 'https://placeholder.supabase.co';
  const safeKey = key && !key.includes('TU_ANON') ? key : 'placeholder-anon-key';

  return createBrowserClient(safeUrl, safeKey);
}
