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
