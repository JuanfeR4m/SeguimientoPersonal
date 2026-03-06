export interface Respuesta {
  id: number
  nombre_en_mayusculas: string | null
  apellido_en_mayusculas: string | null
  correo_electronico: string | null
  hora_entrada: string | null
  hora_salida: string | null
  fecha_de_diligenciamiento: string | null
  lugar_de_trabajo: string | null
  administracion: number | null
  proyectos: number | null
  interventoria: number | null
  otro: number | null
  proyectos_de_desarrollo: string | null
  actividades_realizadas: string | null
  riesgos: string | null
  tareas_pendientes: string | null
}

export interface DashboardStats {
  totalRegistros: number
  personalUnico: number
  lugaresUnicos: number
  proyectosDesarrollo: number
  resultadosFiltrados: number
}

export interface Filters {
  nombre?: string
  lugar?: string
  fechaDesde?: string
  fechaHasta?: string
}

export interface Profile {
  id: string
  nombre: string
  apellido: string
  correo_electronico: string
  role: number
}

export interface Tarea {
  id: string
  titulo: string
  descripcion?: string
  fecha_limite?: string
  estado: 'pendiente' | 'en_progreso' | 'completada'
  supervisor_id: string
  colaborador_id: string
  created_at: string
  updated_at: string
}

export interface ActividadRegistro {
  id: string
  fecha_de_diligenciamiento: string
  administracion: number
  proyectos: number
  interventoria: number
  otro: number
  tareas_pendientes: string
  lugar_de_trabajo: string
  proyectos_de_desarrollo: string
  actividades_realizadas: string
  riesgos: string
  nombre_en_mayusculas: string
  apellido_en_mayusculas: string
  correo_electronico: string
  hora_entrada: string
  hora_salida: string
  user_id: string
}
