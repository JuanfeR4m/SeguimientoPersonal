'use client'

import { useState, useTransition, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { ColaboradorSidebar } from '@/components/colaborador-sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Clock, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import useSWR from 'swr'
import { getColaboradorProfile, getColaboradorTareas, registrarActividad, crearTareaPropios, actualizarEstadoTarea, getTodasLasTareasColaboradores, getColaboradoresDisponibles } from './actions'
import type { Profile, Tarea } from '@/lib/types'

const fetcher = async () => {
  const [profileRes, tareasRes, equipoRes, colabsRes] = await Promise.all([
    getColaboradorProfile(),
    getColaboradorTareas(),
    getTodasLasTareasColaboradores(),
    getColaboradoresDisponibles(),
  ])
  return { 
    profile: profileRes.profile, 
    tareas: tareasRes.tareas,
    tareasEquipo: equipoRes.tareas,
    colaboradores: colabsRes.colaboradores
  }
}

function ColaboradorContent() {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'actividades'

  const { data, isLoading, mutate } = useSWR('colaborador-data', fetcher, {
    revalidateOnFocus: false,
  })

  const [showTareaForm, setShowTareaForm] = useState(false)
  const [isSubmittingActivity, startActivityTransition] = useTransition()
  const [isSubmittingTask, startTaskTransition] = useTransition()
  const [activityMessage, setActivityMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [taskMessage, setTaskMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [teamFilters, setTeamFilters] = useState({
    searchText: '',
    colaboradorIds: [] as string[],
    fecha: '',
    estado: 'all'
  })

  const [colaboradorSearch, setColaboradorSearch] = useState('')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  const [personalFilters, setPersonalFilters] = useState({
    searchText: '',
    fechaLimite: '',
    estado: 'all'
  })

  // Estado para la suma de porcentajes de esfuerzo
  const [effort, setEffort] = useState({
    administracion: 0,
    proyectos: 0,
    interventoria: 0,
    otro: 0
  })

  const totalEffort = effort.administracion + effort.proyectos + effort.interventoria + effort.otro

  const profile = data?.profile as Profile | undefined
  const colaboradores = data?.colaboradores || [] as Profile[]
  const tareas = data?.tareas as Tarea[] | undefined
  const rawTareasEquipo = data?.tareasEquipo as (Tarea & { perfil?: Profile })[] | undefined

  const today = new Date()
  today.setHours(0, 0, 0, 0)


  // Filtrar personas por el buscador interno (usamos la lista completa de colaboradores)
  const personasFiltradas = colaboradores.filter((p: Profile) => 
    `${p.nombre} ${p.apellido}`.toLowerCase().includes(colaboradorSearch.toLowerCase())
  )

  // Aplicar filtros y ordenamiento a las tareas del equipo
  const tareasEquipo = rawTareasEquipo
    ?.filter(tarea => {
      const matchesSearch = !teamFilters.searchText || 
        tarea.titulo.toLowerCase().includes(teamFilters.searchText.toLowerCase()) ||
        (tarea.descripcion && tarea.descripcion.toLowerCase().includes(teamFilters.searchText.toLowerCase()));
      
      const matchesColab = teamFilters.colaboradorIds.length === 0 || 
        teamFilters.colaboradorIds.includes(tarea.colaborador_id);
        
      const matchesFecha = !teamFilters.fecha || 
        (tarea.fecha_limite && tarea.fecha_limite.includes(teamFilters.fecha));
        
      const isOverdue = tarea.estado !== 'completada' && tarea.fecha_limite && new Date(tarea.fecha_limite) < today;

      const matchesEstado = teamFilters.estado === 'all' || 
        (teamFilters.estado === 'vencida' ? isOverdue : tarea.estado === teamFilters.estado);

      return matchesSearch && matchesColab && matchesFecha && matchesEstado;
    })
    .sort((a, b) => {
      // Ordenar por fecha_limite ascendente (puntos suspensivos para nulos)
      if (!a.fecha_limite && !b.fecha_limite) return 0;
      if (!a.fecha_limite) return 1;
      if (!b.fecha_limite) return -1;
      return new Date(a.fecha_limite).getTime() - new Date(b.fecha_limite).getTime();
    });

  // Aplicar filtros a mis tareas personales
  const filteredTareas = useMemo(() => {
    return tareas?.filter(tarea => {
      const matchesSearch = !personalFilters.searchText || 
        tarea.titulo.toLowerCase().includes(personalFilters.searchText.toLowerCase()) ||
        (tarea.descripcion && tarea.descripcion.toLowerCase().includes(personalFilters.searchText.toLowerCase()));
      
      const matchesFecha = !personalFilters.fechaLimite || 
        (tarea.fecha_limite && new Date(tarea.fecha_limite) <= new Date(personalFilters.fechaLimite + 'T23:59:59'));
        
      const matchesEstado = personalFilters.estado === 'all' || tarea.estado === personalFilters.estado;

      return matchesSearch && matchesFecha && matchesEstado;
    });
  }, [tareas, personalFilters]);

  const handleRegistrarActividad = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const form = e.currentTarget

    startActivityTransition(async () => {
      const result = await registrarActividad(formData)
      if (result.error) {
        setActivityMessage({ type: 'error', text: result.error })
      } else {
        setActivityMessage({ type: 'success', text: result.success || 'Actividad registrada' })
        form.reset()
        mutate()
        setTimeout(() => setActivityMessage(null), 3000)
      }
    })
  }

  const handleCrearTarea = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const form = e.currentTarget

    startTaskTransition(async () => {
      const result = await crearTareaPropios(formData)
      if (result.error) {
        setTaskMessage({ type: 'error', text: result.error })
      } else {
        setTaskMessage({ type: 'success', text: result.success || 'Tarea creada' })
        form.reset()
        setShowTareaForm(false)
        mutate()
        setTimeout(() => setTaskMessage(null), 3000)
      }
    })
  }

  const handleActualizarEstado = async (tareaId: string, nuevoEstado: string) => {
    startActivityTransition(async () => {
      await actualizarEstadoTarea(tareaId, nuevoEstado)
      mutate()
    })
  }

  if (isLoading) {
    return (
      <SidebarProvider>
        <ColaboradorSidebar nombre="Cargando..." apellido="" activeTab={tab} />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (!profile) {
    return (
      <SidebarProvider>
        <ColaboradorSidebar nombre="Error" apellido="" activeTab={tab} />
        <SidebarInset>
          <div className="flex h-screen items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-foreground">No se pudo cargar el perfil</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <ColaboradorSidebar nombre={profile.nombre} apellido={profile.apellido} activeTab={tab} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-6">
          <SidebarTrigger className="-ml-1 text-muted-foreground" />
          <Separator orientation="vertical" className="mr-1 h-5" />
          <div>
            <h1 className="text-sm font-semibold text-foreground">
              {tab === 'actividades' ? 'Registro de Actividades' : tab === 'tareas' ? 'Mis Tareas' : 'Tareas del Equipo'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {tab === 'actividades' 
                ? 'Registra tus labores diarias' 
                : tab === 'tareas' 
                ? 'Gestiona tus tareas asignadas' 
                : 'Progreso de las tareas de tus compañeros'}
            </p>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6 max-w-4xl">
            {/* Tab: Registrar Actividad */}
            {tab === 'actividades' && (
              <div className="space-y-4">
                {activityMessage && (
                  <div
                    className={`rounded-lg p-4 flex items-center gap-3 ${
                      activityMessage.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {activityMessage.type === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    )}
                    <p className="text-sm">{activityMessage.text}</p>
                  </div>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Registrar Actividad Diaria</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleRegistrarActividad} className="space-y-4">
                      {/* Información del usuario (auto-rellenada) */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">
                            Nombre
                          </label>
                          <input
                            type="text"
                            name="nombre_en_mayusculas"
                            value={profile.nombre.toUpperCase()}
                            disabled
                            className="w-full px-3 py-2 border border-border rounded-md bg-muted text-foreground text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">
                            Apellido
                          </label>
                          <input
                            type="text"
                            name="apellido_en_mayusculas"
                            value={profile.apellido.toUpperCase()}
                            disabled
                            className="w-full px-3 py-2 border border-border rounded-md bg-muted text-foreground text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">
                            Correo
                          </label>
                          <input
                            type="email"
                            name="correo_electronico"
                            value={profile.correo_electronico}
                            disabled
                            className="w-full px-3 py-2 border border-border rounded-md bg-muted text-foreground text-sm"
                          />
                        </div>
                      </div>

                      {/* Fecha y horas */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">
                            Fecha <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            name="fecha_de_diligenciamiento"
                            required
                            className="w-full px-3 py-2 border border-border rounded-md text-foreground text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">
                            Hora Entrada
                          </label>
                          <input
                            type="time"
                            name="hora_entrada"
                            className="w-full px-3 py-2 border border-border rounded-md text-foreground text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">
                            Hora Salida
                          </label>
                          <input
                            type="time"
                            name="hora_salida"
                            className="w-full px-3 py-2 border border-border rounded-md text-foreground text-sm"
                          />
                        </div>
                      </div>

                      {/* Horas dedicadas (como porcentaje) */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                          <label className="block text-sm font-medium text-foreground">
                            Distribución de Esfuerzo <span className="text-red-500">*</span>
                          </label>
                          <span className={`text-xs font-bold ${totalEffort > 100 ? 'text-destructive' : 'text-primary'}`}>
                            Total: {totalEffort}% / 100%
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">
                          Asigne el porcentaje de su jornada dedicado a cada área. La suma no debe superar el 100%.
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-[11px] font-medium mb-1 text-muted-foreground">
                              Administración (%)
                            </label>
                            <input
                              type="number"
                              name="administracion"
                              min="0"
                              max="100"
                              className="w-full h-9 px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                              value={effort.administracion || ''}
                              onChange={(e) => setEffort({...effort, administracion: parseInt(e.target.value) || 0})}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium mb-1 text-muted-foreground">
                              Proyectos (%)
                            </label>
                            <input
                              type="number"
                              name="proyectos"
                              min="0"
                              max="100"
                              className="w-full h-9 px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                              value={effort.proyectos || ''}
                              onChange={(e) => setEffort({...effort, proyectos: parseInt(e.target.value) || 0})}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium mb-1 text-muted-foreground">
                              Interventoría (%)
                            </label>
                            <input
                              type="number"
                              name="interventoria"
                              min="0"
                              max="100"
                              className="w-full h-9 px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                              value={effort.interventoria || ''}
                              onChange={(e) => setEffort({...effort, interventoria: parseInt(e.target.value) || 0})}
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-medium mb-1 text-muted-foreground">
                              Otro (%)
                            </label>
                            <input
                              type="number"
                              name="otro"
                              min="0"
                              max="100"
                              className="w-full h-9 px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                              value={effort.otro || ''}
                              onChange={(e) => setEffort({...effort, otro: parseInt(e.target.value) || 0})}
                            />
                          </div>
                        </div>
                        {totalEffort > 100 && (
                          <p className="text-[10px] text-destructive font-medium">
                            La suma total no puede exceder el 100%.
                          </p>
                        )}
                      </div>

                      {/* Lugar y Proyectos de Desarrollo */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">
                            Lugar de Trabajo
                          </label>
                          <input
                            type="text"
                            name="lugar_de_trabajo"
                            className="w-full px-3 py-2 border border-border rounded-md text-foreground text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">
                            Proyectos de Desarrollo
                          </label>
                          <input
                            type="text"
                            name="proyectos_de_desarrollo"
                            className="w-full px-3 py-2 border border-border rounded-md text-foreground text-sm"
                          />
                        </div>
                      </div>

                      {/* Textareas */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">
                          Actividades Realizadas
                        </label>
                        <textarea
                          name="actividades_realizadas"
                          rows={3}
                          className="w-full px-3 py-2 border border-border rounded-md text-foreground text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">
                          Tareas Pendientes
                        </label>
                        <textarea
                          name="tareas_pendientes"
                          rows={3}
                          className="w-full px-3 py-2 border border-border rounded-md text-foreground text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-foreground">
                          Riesgos
                        </label>
                        <textarea
                          name="riesgos"
                          rows={3}
                          className="w-full px-3 py-2 border border-border rounded-md text-foreground text-sm"
                        />
                      </div>

                      <Button
                        type="submit"
                        disabled={isSubmittingActivity || totalEffort > 100}
                        className="w-full"
                      >
                        {isSubmittingActivity ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Registrando...
                          </>
                        ) : totalEffort > 100 ? (
                          'Error: Suma mayor al 100%'
                        ) : (
                          'Registrar Actividad'
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Tab: Mis Tareas */}
            {tab === 'tareas' && (
              <div className="space-y-4">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 mb-6 bg-secondary/5 p-4 rounded-xl border border-secondary/10">
                  <h2 className="text-lg font-semibold text-foreground shrink-0">Mis Tareas</h2>
                  
                  {/* Filtros integrados */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground">Buscar</label>
                      <input
                        type="text"
                        placeholder="Título o descripción..."
                        className="w-full h-8 px-3 text-xs bg-background border border-border rounded-md focus:ring-1 focus:ring-primary outline-none"
                        value={personalFilters.searchText}
                        onChange={(e) => setPersonalFilters({...personalFilters, searchText: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground">Vence antes de</label>
                      <input
                        type="date"
                        className="w-full h-8 px-3 text-xs bg-background border border-border rounded-md focus:ring-1 focus:ring-primary outline-none"
                        value={personalFilters.fechaLimite}
                        onChange={(e) => setPersonalFilters({...personalFilters, fechaLimite: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-muted-foreground">Estado</label>
                      <select
                        className="w-full h-8 px-3 text-xs bg-background border border-border rounded-md focus:ring-1 focus:ring-primary outline-none"
                        value={personalFilters.estado}
                        onChange={(e) => setPersonalFilters({...personalFilters, estado: e.target.value})}
                      >
                        <option value="all">Todos</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="en_progreso">En Proceso</option>
                        <option value="completada">Completada</option>
                      </select>
                    </div>
                  </div>

                  <Button
                    onClick={() => setShowTareaForm(!showTareaForm)}
                    variant={showTareaForm ? "destructive" : "default"}
                    size="sm"
                    className="shrink-0 w-full lg:w-auto mt-2 lg:mt-0"
                  >
                    {showTareaForm ? 'Cancelar' : 'Crear Tarea'}
                  </Button>
                </div>

                {taskMessage && (
                  <div
                    className={`rounded-lg p-4 flex items-center gap-3 ${
                      taskMessage.type === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}
                  >
                    {taskMessage.type === 'success' ? (
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    )}
                    <p className="text-sm">{taskMessage.text}</p>
                  </div>
                )}


                {showTareaForm && (
                  <Card className="border-primary/50">
                    <CardHeader>
                      <CardTitle>Crear Nueva Tarea</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleCrearTarea} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">
                            Título <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="titulo"
                            required
                            className="w-full px-3 py-2 border border-border rounded-md text-foreground text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">
                            Descripción
                          </label>
                          <textarea
                            name="descripcion"
                            rows={3}
                            className="w-full px-3 py-2 border border-border rounded-md text-foreground text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">
                            Fecha Límite
                          </label>
                          <input
                            type="date"
                            name="fecha_limite"
                            className="w-full px-3 py-2 border border-border rounded-md text-foreground text-sm"
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={isSubmittingTask}
                          className="w-full"
                        >
                          {isSubmittingTask ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              Creando...
                            </>
                          ) : (
                            'Crear Tarea'
                          )}
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-3">
                  {filteredTareas && filteredTareas.length > 0 ? (
                    filteredTareas.map((tarea) => (
                      <Card key={tarea.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-foreground">{tarea.titulo}</h3>
                              {tarea.descripcion && (
                                <p className="text-sm text-muted-foreground mt-1">{tarea.descripcion}</p>
                              )}
                              <p className="text-[10px] text-muted-foreground mt-2 italic flex items-center gap-1">
                                <span>Asignado por:</span>
                                <span className="font-medium text-foreground">
                                  {tarea.supervisor_id === profile?.id 
                                    ? 'Mí mismo' 
                                    : (tarea as any).supervisor 
                                      ? `${(tarea as any).supervisor.nombre} ${(tarea as any).supervisor.apellido}`
                                      : 'Sistema'
                                  }
                                </span>
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                tarea.estado === 'completada'
                                  ? 'bg-green-100 text-green-800'
                                  : tarea.estado === 'en_progreso'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {tarea.estado === 'completada'
                                ? 'Completada'
                                : tarea.estado === 'en_progreso'
                                ? 'En Progreso'
                                : 'Pendiente'}
                            </span>
                          </div>

                          {tarea.fecha_limite && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                              <Clock className="h-3 w-3" />
                              Vence: {new Date(tarea.fecha_limite).toLocaleDateString('es-ES')}
                            </p>
                          )}

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={tarea.estado === 'pendiente' ? 'default' : 'outline'}
                              onClick={() => handleActualizarEstado(tarea.id, 'pendiente')}
                              disabled={isSubmittingActivity}
                            >
                              Pendiente
                            </Button>
                            <Button
                              size="sm"
                              variant={tarea.estado === 'en_progreso' ? 'default' : 'outline'}
                              onClick={() => handleActualizarEstado(tarea.id, 'en_progreso')}
                              disabled={isSubmittingActivity}
                            >
                              En Progreso
                            </Button>
                            <Button
                              size="sm"
                              variant={tarea.estado === 'completada' ? 'default' : 'outline'}
                              onClick={() => handleActualizarEstado(tarea.id, 'completada')}
                              disabled={isSubmittingActivity}
                            >
                              Completada
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="pt-6 text-center text-muted-foreground">
                        <p>No tienes tareas asignadas</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
            {/* Tab: Tareas del Equipo */}
            {tab === 'equipo' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-black text-foreground">Progreso del Equipo</h2>
                </div>

                {/* Filtros de Tareas */}
                <Card className="bg-secondary/30 border-none shadow-none">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground">Buscar Proyecto / Tarea</label>
                        <input
                          type="text"
                          placeholder="Título o descripción..."
                          className="w-full h-9 px-3 text-xs bg-background border border-border rounded-md"
                          value={teamFilters.searchText}
                          onChange={(e) => setTeamFilters({...teamFilters, searchText: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground">Compañeros / Personal</label>
                        <div className="relative">
                          <button 
                            type="button"
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            className="w-full h-9 px-3 text-xs bg-background border border-border rounded-md flex items-center justify-between hover:border-primary transition-colors"
                          >
                            <span className="truncate">
                              {teamFilters.colaboradorIds.length > 0 
                                ? `${teamFilters.colaboradorIds.length} seleccionados` 
                                : "Todos"}
                            </span>
                            {showFilterDropdown ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>

                          {showFilterDropdown && (
                            <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg p-2 space-y-2 min-w-[150px]">
                              <input 
                                type="text"
                                placeholder="Buscar persona..."
                                className="w-full h-7 px-2 text-[10px] bg-background border border-border rounded-md"
                                value={colaboradorSearch}
                                onChange={(e) => setColaboradorSearch(e.target.value)}
                                autoFocus
                              />
                              <div className="max-h-32 overflow-y-auto space-y-1">
                                {personasFiltradas.length > 0 ? (
                                  personasFiltradas.map((p: Profile) => (
                                    <label key={p.id} className="flex items-center gap-2 text-[10px] cursor-pointer hover:bg-secondary/50 p-1 rounded transition-colors">
                                      <input 
                                        type="checkbox"
                                        checked={teamFilters.colaboradorIds.includes(p.id)}
                                        onChange={(e) => {
                                          const newIds = e.target.checked 
                                            ? [...teamFilters.colaboradorIds, p.id]
                                            : teamFilters.colaboradorIds.filter(id => id !== p.id);
                                          setTeamFilters({...teamFilters, colaboradorIds: newIds});
                                        }}
                                        className="rounded border-border"
                                      />
                                      <span className="truncate">{p.nombre} {p.apellido}</span>
                                    </label>
                                  ))
                                ) : (
                                  <p className="text-[9px] text-muted-foreground text-center py-2">No se encontraron compañeros</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground">Fecha Límite</label>
                        <input
                          type="date"
                          className="w-full h-9 px-3 text-xs bg-background border border-border rounded-md"
                          value={teamFilters.fecha}
                          onChange={(e) => setTeamFilters({...teamFilters, fecha: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase text-muted-foreground">Estado</label>
                        <select
                          className="w-full h-9 px-3 text-xs bg-background border border-border rounded-md"
                          value={teamFilters.estado}
                          onChange={(e) => setTeamFilters({...teamFilters, estado: e.target.value})}
                        >
                          <option value="all">Todos los estados</option>
                          <option value="pendiente">Pendiente</option>
                          <option value="en_progreso">En Proceso</option>
                          <option value="completada">Completada</option>
                          <option value="vencida">Vencida</option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-4">
                  {tareasEquipo && tareasEquipo.length > 0 ? (
                    tareasEquipo.map((tarea) => {
                      const isOverdue = tarea.estado !== 'completada' && tarea.fecha_limite && new Date(tarea.fecha_limite) < today;
                      return (
                        <Card key={tarea.id} className={`hover:shadow-md transition-shadow border-l-4 ${isOverdue ? 'border-l-destructive bg-destructive/5' : 'border-l-primary'}`}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-foreground">{tarea.titulo}</h3>
                                  {isOverdue && (
                                    <span className="flex items-center gap-1 text-[9px] font-black text-destructive uppercase border border-destructive/20 px-1 rounded bg-destructive/10">
                                      Vencida
                                    </span>
                                  )}
                                </div>
                                {tarea.descripcion && (
                                  <p className="text-sm text-muted-foreground mt-1">{tarea.descripcion}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2 italic">
                                  Realizado por: {tarea.perfil?.nombre} {tarea.perfil?.apellido}
                                </p>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  tarea.estado === 'completada'
                                    ? 'bg-green-100 text-green-800'
                                    : tarea.estado === 'en_progreso'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {tarea.estado === 'completada'
                                  ? 'Completada'
                                  : tarea.estado === 'en_progreso'
                                  ? 'En Proceso'
                                  : 'Pendiente'}
                              </span>
                            </div>

                            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mt-4">
                              <div 
                                className={`h-full transition-all duration-500 ${
                                  tarea.estado === 'completada' 
                                    ? 'bg-green-500 w-full' 
                                    : tarea.estado === 'en_progreso' 
                                    ? 'bg-blue-500 w-1/2' 
                                    : 'bg-yellow-500 w-[10%]'
                                }`}
                              />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="pt-6 text-center text-muted-foreground">
                        <p>No hay actividad registrada en el equipo aún</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function ColaboradorPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <ColaboradorContent />
    </Suspense>
  )
}
