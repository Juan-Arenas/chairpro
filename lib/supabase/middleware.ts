import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

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

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If Supabase credentials are missing or invalid, let request pass instantly
  if (!isValidUrl(supabaseUrl) || !supabaseKey || supabaseKey.includes('TU_ANON')) {
    return response;
  }

  // Pass through response instantly without blocking route transitions with remote network calls
  return response;
}
