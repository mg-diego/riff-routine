import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { locales, defaultLocale } from './i18n/config';
import { ADMIN_PANEL_CONFIGURED } from './lib/admin';
import { TEACHER_MODE_ENABLED } from './lib/features';

const intlMiddleware = createIntlMiddleware({
  locales: [...locales],
  defaultLocale,
});

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass admin routes only when admins are configured — auth is handled inside the page itself.
  // Otherwise they go through next-intl and end up in the admin layout's 404.
  if (ADMIN_PANEL_CONFIGURED && (pathname === '/admin' || pathname.match(/^\/[a-z]{2}\/admin(\/.*)?$/))) {
    return NextResponse.next();
  }

  // Teacher mode is hidden: send its routes back to home
  const teacherRoute = pathname.match(/^\/([a-z]{2})\/teacher(\/.*)?$/);
  if (!TEACHER_MODE_ENABLED && teacherRoute) {
    return NextResponse.redirect(new URL(`/${teacherRoute[1]}/home`, request.url));
  }

  let response = intlMiddleware(request);

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

  const isDemoUser    = user?.email === 'demo@riffroutine.com';
  const isProfilePage = pathname.endsWith('/profile') || pathname.includes('/profile/');

  if (isProfilePage && isDemoUser) {
    const locale = pathname.split('/')[1] || defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/home`, request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}