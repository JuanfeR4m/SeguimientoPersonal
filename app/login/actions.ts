'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    // Es mejor devolver el error real (por ejemplo, si falta confirmar el correo)
    return { error: error.message }
  }

  const user = data.user;

  // Obtener el rol del usuario para redirigir correctamente
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    let redirectPath = '/'
    if (profile?.role === 1) {
      redirectPath = '/admin'
    } else if (profile?.role === 2) {
      redirectPath = '/supervisor'
    } else if (profile?.role === 3) {
      redirectPath = '/colaborador'
    }

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
