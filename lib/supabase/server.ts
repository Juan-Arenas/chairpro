import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

export function createServerSupabase() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const safeUrl = isValidUrl(url) ? url! : 'https://placeholder.supabase.co';
  const safeKey = key && !key.includes('TU_ANON') ? key : 'placeholder-anon-key';

  return createServerClient(
    safeUrl,
    safeKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Can't set cookies in Server Components — only in Route Handlers / Server Actions
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Same as above
          }
        },
      },
    }
  );
}

// Admin client with service_role key — for SuperAdmin operations only
export function createAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const safeUrl = isValidUrl(url) ? url! : 'https://placeholder.supabase.co';
  const safeKey = key && !key.includes('TU_SERVICE_ROLE') ? key : 'placeholder-service-key';

  return createServerClient(
    safeUrl,
    safeKey,
    {
      cookies: {
        get() { return undefined; },
        set() {},
        remove() {},
      },
    }
  );
}
