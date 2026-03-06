'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Tarea, Profile } from '@/lib/types'

export async function getSupervisorProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    return { error: 'No se pudo obtener el perfil' }
  }

  return { profile }
}

export async function getColaboradoresDisponibles() {
  const supabase = await createClient()

  const { data: colaboradores, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 3)
    .order('nombre', { ascending: true })

  if (error) {
    return { error: 'No se pudieron obtener los colaboradores' }
  }

  return { colaboradores }
}

export async function getTareasAsignadas() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const { data: tareas, error } = await supabase
    .from('tareas')
    .select('*')
    .eq('supervisor_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: 'No se pudieron obtener las tareas' }
  }

  return { tareas }
}

export async function asignarTarea(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const tarea: Tarea = {
    id: crypto.randomUUID(),
    titulo: formData.get('titulo') as string,
    descripcion: formData.get('descripcion') as string,
    fecha_limite: formData.get('fecha_limite') as string,
    estado: 'pendiente',
    supervisor_id: user.id,
    colaborador_id: formData.get('colaborador_id') as string,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('tareas')
    .insert([tarea])

  if (error) {
    console.error('Error al asignar tarea:', error)
    return { error: 'No se pudo asignar la tarea' }
  }

  revalidatePath('/supervisor')
  return { success: 'Tarea asignada exitosamente' }
}

export async function actualizarTarea(tareaId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const { error } = await supabase
    .from('tareas')
    .update({
      titulo: formData.get('titulo') as string,
      descripcion: formData.get('descripcion') as string,
      fecha_limite: formData.get('fecha_limite') as string,
      estado: formData.get('estado') as string,
      updated_at: new Date().toISOString(),
    })
    .eq('id', tareaId)
    .eq('supervisor_id', user.id)

  if (error) {
    return { error: 'No se pudo actualizar la tarea' }
  }

  revalidatePath('/supervisor')
  return { success: 'Tarea actualizada' }
}

export async function eliminarTarea(tareaId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const { error } = await supabase
    .from('tareas')
    .delete()
    .eq('id', tareaId)
    .eq('supervisor_id', user.id)

  if (error) {
    return { error: 'No se pudo eliminar la tarea' }
  }

  revalidatePath('/supervisor')
  return { success: 'Tarea eliminada' }
}
