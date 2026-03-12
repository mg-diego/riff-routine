import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';

const intlMiddleware = createIntlMiddleware({
  locales: ['es', 'en'],
  defaultLocale: 'es',
});

export async function middleware(request: NextRequest) {
  let response = intlMiddleware(request);
  const { pathname } = request.nextUrl;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isDemoUser = user?.email === 'demo@riffroutine.com';
  const isProfilePage = pathname.endsWith('/profile') || pathname.includes('/profile/');

  console.log("Current user: ", user)
  console.log("REQUEST user: ", request.nextUrl.pathname)

  if (isProfilePage && isDemoUser) {
    const locale = pathname.split('/')[1] || 'es';
    return NextResponse.redirect(new URL(`/${locale}/home`, request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)']
};