'use client'

import { useState, useTransition, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { ColaboradorSidebar } from '@/components/colaborador-sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import useSWR from 'swr'
import { getColaboradorProfile, getColaboradorTareas, registrarActividad, crearTareaPropios, actualizarEstadoTarea } from './actions'
import type { Profile, Tarea } from '@/lib/types'

const fetcher = async () => {
  const [profileRes, tareasRes] = await Promise.all([
    getColaboradorProfile(),
    getColaboradorTareas(),
  ])
  return { profile: profileRes.profile, tareas: tareasRes.tareas }
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

  const profile = data?.profile as Profile | undefined
  const tareas = data?.tareas as Tarea[] | undefined

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
              {tab === 'actividades' ? 'Registro de Actividades' : 'Mis Tareas'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {tab === 'actividades' ? 'Registra tus labores diarias' : 'Gestiona tus tareas asignadas'}
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

                      {/* Horas dedicadas */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">
                            Administración
                          </label>
                          <input
                            type="number"
                            name="administracion"
                            min="0"
                            className="w-full px-3 py-2 border border-border rounded-md text-foreground text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">
                            Proyectos
                          </label>
                          <input
                            type="number"
                            name="proyectos"
                            min="0"
                            className="w-full px-3 py-2 border border-border rounded-md text-foreground text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">
                            Interventoría
                          </label>
                          <input
                            type="number"
                            name="interventoria"
                            min="0"
                            className="w-full px-3 py-2 border border-border rounded-md text-foreground text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">
                            Otro
                          </label>
                          <input
                            type="number"
                            name="otro"
                            min="0"
                            className="w-full px-3 py-2 border border-border rounded-md text-foreground text-sm"
                          />
                        </div>
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
                        disabled={isSubmittingActivity}
                        className="w-full"
                      >
                        {isSubmittingActivity ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Registrando...
                          </>
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
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Mis Tareas</h2>
                  <Button
                    onClick={() => setShowTareaForm(!showTareaForm)}
                    variant="outline"
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
                  {tareas && tareas.length > 0 ? (
                    tareas.map((tarea) => (
                      <Card key={tarea.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-foreground">{tarea.titulo}</h3>
                              {tarea.descripcion && (
                                <p className="text-sm text-muted-foreground mt-1">{tarea.descripcion}</p>
                              )}
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
