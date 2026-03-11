'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { ActividadRegistro, Tarea } from '@/lib/types'

export async function getColaboradorProfile() {
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

export async function getColaboradorTareas() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const { data: tareas, error } = await supabase
    .from('tareas')
    .select('*')
    .eq('colaborador_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: 'No se pudieron obtener las tareas' }
  }

  // Obtener los perfiles de los supervisores para mostrar quién asignó la tarea
  const supervisorIds = Array.from(new Set(tareas.map(t => t.supervisor_id)))
  
  if (supervisorIds.length === 0) {
    return { tareas: [] }
  }

  // Usar admin client para poder leer perfiles de supervisores (que pueden estar protegidos por RLS)
  const adminSupabase = await createAdminClient()
  const { data: supervisors } = await adminSupabase
    .from('profiles')
    .select('id, nombre, apellido')
    .in('id', supervisorIds)

  const tareasConSupervisor = tareas.map(tarea => ({
    ...tarea,
    supervisor: supervisors?.find(s => s.id === tarea.supervisor_id)
  }))

  return { tareas: tareasConSupervisor }
}

export async function registrarActividad(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('nombre, apellido, correo_electronico')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    console.error('Error al obtener perfil para registro:', profileError)
    return { error: 'No se pudo obtener la información del perfil' }
  }

  const administracion = parseInt(formData.get('administracion') as string) || 0
  const proyectos = parseInt(formData.get('proyectos') as string) || 0
  const interventoria = parseInt(formData.get('interventoria') as string) || 0
  const otro = parseInt(formData.get('otro') as string) || 0

  if (administracion + proyectos + interventoria + otro > 100) {
    return { error: 'La suma de los porcentajes de esfuerzo no puede superar el 100%' }
  }

  const actividad = {
    fecha_de_diligenciamiento: formData.get('fecha_de_diligenciamiento') as string,
    administracion,
    proyectos,
    interventoria,
    otro,
    tareas_pendientes: formData.get('tareas_pendientes') as string,
    lugar_de_trabajo: formData.get('lugar_de_trabajo') as string,
    proyectos_de_desarrollo: formData.get('proyectos_de_desarrollo') as string,
    actividades_realizadas: formData.get('actividades_realizadas') as string,
    riesgos: formData.get('riesgos') as string,
    nombre_en_mayusculas: profile.nombre.toUpperCase(),
    apellido_en_mayusculas: profile.apellido.toUpperCase(),
    correo_electronico: profile.correo_electronico,
    hora_entrada: formData.get('hora_entrada') as string,
    hora_salida: formData.get('hora_salida') as string,
  }

  const { error: insertError } = await supabase
    .from('respuestas')
    .insert([actividad])

  if (insertError) {
    console.error('Error al registrar actividad:', insertError)
    return { error: 'No se pudo registrar la actividad' }
  }

  revalidatePath('/colaborador')
  return { success: 'Actividad registrada exitosamente' }
}

export async function crearTareaPropios(formData: FormData) {
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
    colaborador_id: user.id,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('tareas')
    .insert([tarea])

  if (error) {
    console.error('Error al crear tarea:', error)
    return { error: 'No se pudo crear la tarea' }
  }

  revalidatePath('/colaborador')
  return { success: 'Tarea creada exitosamente' }
}

export async function actualizarEstadoTarea(tareaId: string, nuevoEstado: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const { error } = await supabase
    .from('tareas')
    .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
    .eq('id', tareaId)
    .eq('colaborador_id', user.id)

  if (error) {
    return { error: 'No se pudo actualizar la tarea' }
  }

  revalidatePath('/colaborador')
  return { success: 'Tarea actualizada' }
}

export async function getTodasLasTareasColaboradores() {
  const supabase = await createAdminClient()
  
  // Obtener todos los perfiles con rol 3 (colaboradores)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nombre, apellido')
    .eq('role', 3)
    
  if (!profiles) return { tareas: [] }
  const profileIds = profiles.map(p => p.id)

  const { data: tareas, error } = await supabase
    .from('tareas')
    .select('*')
    .in('colaborador_id', profileIds)
    .order('created_at', { ascending: false })

  if (error) {
    return { error: 'No se pudieron obtener las tareas del equipo' }
  }

  // Mezclar información de perfiles para mostrar nombres
  const tareasConPerfil = tareas.map(tarea => ({
    ...tarea,
    perfil: profiles.find(p => p.id === tarea.colaborador_id)
  }))

  return { tareas: tareasConPerfil }
}

export async function getColaboradoresDisponibles() {
  const supabase = await createAdminClient()

  const { data: colaboradores, error } = await supabase
    .from('profiles')
    .select('*')
    .in('role', [2, 3]) // Supervisores y colaboradores por igual
    .order('nombre', { ascending: true })

  if (error) {
    return { error: 'No se pudieron obtener los colaboradores' }
  }

  return { colaboradores }
}
