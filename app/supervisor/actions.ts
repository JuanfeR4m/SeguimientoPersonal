'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
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
  const supabase = await createAdminClient()

  const { data: colaboradores, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', [2, 3])
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

  const colaboradorIds = formData.getAll('colaborador_id') as string[]
  
  if (colaboradorIds.length === 0) {
    return { error: 'Debes seleccionar al menos una persona' }
  }

  const titulo = formData.get('titulo') as string
  const descripcion = formData.get('descripcion') as string
  const fecha_limite = formData.get('fecha_limite') as string

  const tareas = colaboradorIds.map(id => ({
    id: crypto.randomUUID(),
    titulo,
    descripcion,
    fecha_limite,
    estado: 'pendiente',
    supervisor_id: user.id,
    colaborador_id: id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }))

  const { error } = await supabase
    .from('tareas')
    .insert(tareas)

  if (error) {
    console.error('Error al asignar tarea:', error)
    return { error: 'No se pudo asignar la tarea a uno o más colaboradores' }
  }

  revalidatePath('/supervisor')
  return { success: `Tarea asignada exitosamente a ${colaboradorIds.length} persona(s)` }
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

export async function getTodasLasTareasSistema() {
  const supabase = await createAdminClient()
  
  // Obtener todos los perfiles con rol 2 (supervisores) y 3 (colaboradores)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nombre, apellido, role')
    .in('role', [2, 3])
    
  if (!profiles) return { tareas: [] }
  const profileIds = profiles.map(p => p.id)

  const { data: tareas, error } = await supabase
    .from('tareas')
    .select('*')
    .in('colaborador_id', profileIds)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: 'No se pudieron obtener las tareas del sistema' }
  }

  // Mezclar información de perfiles para mostrar nombres
  const tareasConPerfil = tareas.map(tarea => ({
    ...tarea,
    perfil: profiles.find(p => p.id === tarea.colaborador_id)
  }))

  return { tareas: tareasConPerfil }
}
