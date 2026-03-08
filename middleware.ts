import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: No escribas lógica entre createServerClient y auth.getUser()
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Si no hay sesión y la ruta NO es pública → redirigir al login
  const publicPaths = ['/login', '/auth/callback']
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))
  
  // Siempre proteger la ruta raíz (es el dashboard protegido)
  const isRoot = pathname === '/'

  if (!user && (!isPublic || isRoot)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si hay sesión y está en /login → redirigir según rol
  if (user && pathname === '/login') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    let redirectPath = '/'
    if (profile?.role === 1) {
      redirectPath = '/' // Admin va a la raíz
    } else if (profile?.role === 2) {
      redirectPath = '/supervisor'
    } else if (profile?.role === 3) {
      redirectPath = '/colaborador'
    }

    const url = request.nextUrl.clone()
    url.pathname = redirectPath
    return NextResponse.redirect(url)
  }

  // Si hay sesión pero no está en ruta del rol → redirigir
  if (user && !pathname.startsWith('/login')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    let expectedPath = '/'
    if (profile?.role === 1) {
      expectedPath = '/'
    } else if (profile?.role === 2) {
      expectedPath = '/supervisor'
    } else if (profile?.role === 3) {
      expectedPath = '/colaborador'
    }

    // Solo redirigir si está en una ruta diferente y no es pública
    const publicPaths = ['/login', '/auth/callback']
    const isInPublicPath = publicPaths.some((p) => pathname.startsWith(p))
    
    // Si rol es 1 y la ruta es otra que no sea raíz (o API), redirigir
    if (!isInPublicPath && profile?.role === 1 && pathname !== '/' && !pathname.startsWith('/api')) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    // Para supervisores y colaboradores, asegurarse que no salgan de sus rutas
    if (!isInPublicPath && profile?.role !== 1 && !pathname.startsWith(expectedPath) && expectedPath !== '/') {
      const url = request.nextUrl.clone()
      url.pathname = expectedPath
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Aplica a todo excepto archivos estáticos y metadatos de Next.js
    '/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
