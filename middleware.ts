import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  console.log('🔒 [Middleware] ========================================')
  console.log('🔒 [Middleware] REQUEST:', req.nextUrl.pathname)

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const isAuthPage = req.nextUrl.pathname.startsWith('/login') ||
                     req.nextUrl.pathname.startsWith('/register')

  // /onboarding should ONLY be accessible to authenticated users
  const isOnboarding = req.nextUrl.pathname.startsWith('/onboarding')

  console.log('🔒 [Middleware] State:', {
    path: req.nextUrl.pathname,
    hasSession: !!session,
    userId: session?.user?.id,
    isAuthPage,
    isOnboarding
  })

  // If user is NOT signed in:
  // - Allow access to auth pages (/login, /register)
  // - Redirect all other pages (including /onboarding) to /login
  if (!session) {
    if (isAuthPage) {
      console.log('🔒 [Middleware] Allowing unauthenticated user to access auth page')
      return res
    } else {
      console.log('🔒 [Middleware] Redirecting unauthenticated user to /login')
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/login'
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  // If user IS signed in:
  // - Allow ALL pages (including auth pages, onboarding, everything)
  // - The pages themselves will handle redirects appropriately
  // - DON'T interfere with page-level redirect logic
  console.log('🔒 [Middleware] Allowing authenticated user to access', req.nextUrl.pathname)
  return res
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
