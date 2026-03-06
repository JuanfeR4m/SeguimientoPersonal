'use client'

import { useState, useTransition } from 'react'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { SupervisorSidebar } from '@/components/supervisor-sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Trash2, Edit2, Loader2 } from 'lucide-react'
import useSWR from 'swr'
import { getSupervisorProfile, getColaboradoresDisponibles, getTareasAsignadas, asignarTarea, eliminarTarea } from './actions'
import type { Profile, Tarea } from '@/lib/types'

const fetcher = async () => {
  const [profileRes, colaboradoresRes, tareasRes] = await Promise.all([
    getSupervisorProfile(),
    getColaboradoresDisponibles(),
    getTareasAsignadas(),
  ])
  return {
    profile: profileRes.profile,
    colaboradores: colaboradoresRes.colaboradores,
    tareas: tareasRes.tareas,
  }
}

export default function SupervisorPage() {
  const { data, isLoading, mutate } = useSWR('supervisor-data', fetcher, {
    revalidateOnFocus: false,
  })

  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const profile = data?.profile as Profile | undefined
  const colaboradores = data?.colaboradores || []
  const tareas = data?.tareas as Tarea[] | undefined

  const handleAsignarTarea = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await asignarTarea(formData)
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: result.success || 'Tarea asignada' })
        e.currentTarget.reset()
        setShowForm(false)
        mutate()
        setTimeout(() => setMessage(null), 3000)
      }
    })
  }

  const handleEliminarTarea = async (tareaId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) return

    startTransition(async () => {
      const result = await eliminarTarea(tareaId)
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        mutate()
        setTimeout(() => setMessage(null), 3000)
      }
    })
  }

  if (isLoading) {
    return (
      <SidebarProvider>
        <SupervisorSidebar nombre="Cargando..." apellido="" />
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
        <SupervisorSidebar nombre="Error" apellido="" />
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
      <SupervisorSidebar nombre={profile.nombre} apellido={profile.apellido} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-6">
          <SidebarTrigger className="-ml-1 text-muted-foreground" />
          <Separator orientation="vertical" className="mr-1 h-5" />
          <div>
            <h1 className="text-sm font-semibold text-foreground">Panel de Supervisión</h1>
            <p className="text-xs text-muted-foreground">Asigna y gestiona tareas de colaboradores</p>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-6 max-w-6xl">
            {message && (
              <div
                className={`rounded-lg p-4 flex items-center gap-3 ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                )}
                <p className="text-sm">{message.text}</p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Panel izquierdo: Asignar Tarea */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Asignar Tarea</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!showForm ? (
                      <Button
                        onClick={() => setShowForm(true)}
                        className="w-full"
                      >
                        Nueva Tarea
                      </Button>
                    ) : (
                      <form onSubmit={handleAsignarTarea} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">
                            Colaborador <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="colaborador_id"
                            required
                            className="w-full px-3 py-2 border border-border rounded-md text-foreground text-sm"
                          >
                            <option value="">-- Selecciona un colaborador --</option>
                            {colaboradores.map((colab: any) => (
                              <option key={colab.id} value={colab.id}>
                                {colab.nombre} {colab.apellido}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2 text-foreground">
                            Título <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="titulo"
                            required
                            className="w-full px-3 py-2 border border-border rounded-md text-foreground text-sm"
                            placeholder="Ej: Revisar documento"
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
                            placeholder="Detalles de la tarea..."
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

                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1"
                          >
                            {isSubmitting ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Asignando...
                              </>
                            ) : (
                              'Asignar'
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowForm(false)}
                            className="flex-1"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Panel derecho: Tareas Asignadas */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Tareas Asignadas ({tareas?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {tareas && tareas.length > 0 ? (
                        tareas.map((tarea) => {
                          const colaborador = colaboradores.find((c: any) => c.id === tarea.colaborador_id)
                          return (
                            <Card key={tarea.id} className="border">
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-foreground">{tarea.titulo}</h4>
                                    {tarea.descripcion && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {tarea.descripcion}
                                      </p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-2">
                                      <strong>Asignado a:</strong> {colaborador?.nombre} {colaborador?.apellido}
                                    </p>
                                    {tarea.fecha_limite && (
                                      <p className="text-xs text-muted-foreground">
                                        <strong>Vence:</strong> {new Date(tarea.fecha_limite).toLocaleDateString('es-ES')}
                                      </p>
                                    )}
                                  </div>
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${
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

                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEliminarTarea(tarea.id)}
                                    disabled={isSubmitting}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })
                      ) : (
                        <Card className="border-dashed">
                          <CardContent className="pt-6 text-center text-muted-foreground">
                            <p>No hay tareas asignadas aún</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
