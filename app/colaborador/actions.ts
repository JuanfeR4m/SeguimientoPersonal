'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
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

  return { tareas }
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

  const actividad = {
    fecha_de_diligenciamiento: formData.get('fecha_de_diligenciamiento') as string,
    administracion: parseInt(formData.get('administracion') as string) || 0,
    proyectos: parseInt(formData.get('proyectos') as string) || 0,
    interventoria: parseInt(formData.get('interventoria') as string) || 0,
    otro: parseInt(formData.get('otro') as string) || 0,
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
