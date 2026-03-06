'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  console.log('[v0] Intentando login con email:', email)

  const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password })

  console.log('[v0] Resultado auth:', { authData, error })

  if (error) {
    console.log('[v0] Error de autenticacion:', error.message)
    // Devolvemos el error al cliente en vez de redireccionar
    return { error: 'Usuario o contraseña incorrectos' }
  }

  // Obtener el rol del usuario para redirigir correctamente
  const { data: { user } } = await supabase.auth.getUser()
  console.log('[v0] Usuario obtenido:', user?.id, user?.email)
  
  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    console.log('[v0] Perfil encontrado:', profile)
    console.log('[v0] Error de perfil:', profileError)

    let redirectPath = '/'
    if (profile?.role === 1) {
      redirectPath = '/admin'
    } else if (profile?.role === 2) {
      redirectPath = '/supervisor'
    } else if (profile?.role === 3) {
      redirectPath = '/colaborador'
    }

    console.log('[v0] Redirigiendo a:', redirectPath)
    revalidatePath('/', 'layout')
    redirect(redirectPath)
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

// ─── RECUPERAR CONTRASEÑA ────────────────────────────────────────────────────
export async function sendPasswordRecovery(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Por favor ingresa un correo electrónico válido' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/update-password`,
  })

  if (error) {
    return { error: 'No se pudo enviar el correo. Intenta de nuevo.' }
  }

  return { success: `Se han enviado las instrucciones de recuperación a: ${email}` }
}
