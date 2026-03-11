'use client'

import { useState, useTransition, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { SupervisorSidebar } from '@/components/supervisor-sidebar'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Trash2, Edit2, Loader2, ClipboardList, Users, BarChart2, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import useSWR from 'swr'
import { getSupervisorProfile, getColaboradoresDisponibles, getTareasAsignadas, asignarTarea, actualizarTarea, eliminarTarea, getTodasLasTareasSistema } from './actions'
import type { Profile, Tarea, Respuesta, Filters, DashboardStats } from '@/lib/types'
import { SearchFilters } from "@/components/search-filters"
import { EmployeeTable } from "@/components/employee-table"
import { StatsGrid } from "@/components/stats-grid"

function buildUrl(filters: Filters) {
  const params = new URLSearchParams()
  if (filters.nombre) params.set("nombre", filters.nombre)
  if (filters.lugar) params.set("lugar", filters.lugar)
  if (filters.fechaDesde) params.set("fechaDesde", filters.fechaDesde)
  if (filters.fechaHasta) params.set("fechaHasta", filters.fechaHasta)
  return `/api/respuestas?${params.toString()}`
}

const apiFetcher = (url: string) => fetch(url).then((r) => r.json())

const fetcher = async () => {
  const [profileRes, colaboradoresRes, tareasRes, equipoRes] = await Promise.all([
    getSupervisorProfile(),
    getColaboradoresDisponibles(),
    getTareasAsignadas(),
    getTodasLasTareasSistema()
  ])
  return {
    profile: profileRes.profile,
    colaboradores: colaboradoresRes.colaboradores,
    tareas: tareasRes.tareas,
    equipo: equipoRes.tareas
  }
}

function SupervisorContent() {
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') || 'inicio'

  const { data, isLoading, mutate } = useSWR('supervisor-data', fetcher, {
    revalidateOnFocus: false,
  })

  const [filters, setFilters] = useState<Filters>({})
  const { data: tableData, isLoading: isTableLoading, error: tableError } = useSWR<{
    stats: DashboardStats
    registros: Respuesta[]
    lugares: string[]
  }>(buildUrl(filters), apiFetcher, {
    revalidateOnFocus: false,
  })

  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  
  const [assignSearch, setAssignSearch] = useState('')
  const [selectedAsignados, setSelectedAsignados] = useState<string[]>([])
  const [showAssignDropdown, setShowAssignDropdown] = useState(false)

  const [teamFilters, setTeamFilters] = useState({
    searchText: '',
    colaboradorIds: [] as string[],
    fecha: '',
    estado: 'all'
  })

  const [colaboradorSearch, setColaboradorSearch] = useState('')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  const profile = data?.profile as Profile | undefined
  const colaboradores = data?.colaboradores || [] as Profile[]
  const tareas = data?.tareas as Tarea[] | undefined
  const rawTareasEquipo = data?.equipo as (Tarea & { perfil?: Profile })[] | undefined

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

  const handleAsignarTarea = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (selectedAsignados.length === 0) {
      setMessage({ type: 'error', text: 'Debes seleccionar al menos una persona' })
      return
    }

    const formData = new FormData(e.currentTarget)
    // Limpiar cualquier colaborador_id previo del FormData si existe (aunque no debería si quitamos el select)
    formData.delete('colaborador_id')
    // Añadir todos los seleccionados
    selectedAsignados.forEach((id: string) => formData.append('colaborador_id', id))
    
    const form = e.currentTarget

    startTransition(async () => {
      const result = await asignarTarea(formData)
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: result.success || 'Tarea asignada' })
        form.reset()
        setSelectedAsignados([])
        setAssignSearch('')
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
        <SupervisorSidebar nombre="Cargando..." apellido="" activeTab={tab} />
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
        <SupervisorSidebar nombre="Error" apellido="" activeTab={tab} />
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

  // Calcular estadísticas rápidas para el menú de inicio
  const tareasPendientes = tareas?.filter(t => t.estado === 'pendiente').length || 0
  const tareasEnProgreso = tareas?.filter(t => t.estado === 'en_progreso').length || 0
  const tareasCompletadas = tareas?.filter(t => t.estado === 'completada').length || 0

  return (
    <SidebarProvider>
      <SupervisorSidebar nombre={profile.nombre} apellido={profile.apellido} activeTab={tab} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-card px-6">
          <SidebarTrigger className="-ml-1 text-muted-foreground" />
          <Separator orientation="vertical" className="mr-1 h-5" />
          <div>
            <h1 className="text-sm font-semibold text-foreground">
              {tab === 'inicio' ? 'Panel de Control' : tab === 'asignar' ? 'Asignar Tareas' : 'Tareas del Equipo'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {tab === 'inicio'
                ? 'Monitorea el desempeño de tu equipo'
                : tab === 'asignar'
                ? 'Distribuye labores al personal'
                : 'Progreso y estado de todas las tareas del sistema'}
            </p>
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

            {/* ── PESTAÑA INICIO ── */}
            {tab === 'inicio' && (
              <div className="space-y-6">
                {/* Bienvenida */}
                <div className="rounded-xl border border-border bg-card p-6">
                  <h2 className="text-2xl font-bold text-foreground">
                    Bienvenido, {profile.nombre} !
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Aquí tienes un resumen de la actividad de tu equipo.
                  </p>
                </div>

                {/* Tarjetas de resumen de tareas */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                          <ClipboardList className="h-5 w-5 text-yellow-700" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Tareas Pendientes</p>
                          <p className="text-2xl font-bold text-foreground">{tareasPendientes}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                          <TrendingUp className="h-5 w-5 text-blue-700" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">En Progreso</p>
                          <p className="text-2xl font-bold text-foreground">{tareasEnProgreso}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                          <CheckCircle2 className="h-5 w-5 text-green-700" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Completadas</p>
                          <p className="text-2xl font-bold text-foreground">{tareasCompletadas}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Stats generales y tabla de registros */}
                <StatsGrid stats={tableData?.stats} isLoading={isTableLoading} />
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">Registros Diarios</h2>
                </div>
                <SearchFilters
                  lugares={tableData?.lugares || []}
                  filters={filters}
                  onFiltersChange={setFilters}
                />
                <EmployeeTable
                  registros={tableData?.registros || []}
                  isLoading={isTableLoading}
                  error={tableError?.message}
                />
              </div>
            )}

            {/* ── PESTAÑA ASIGNAR TAREAS ── */}
            {tab === 'asignar' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Panel izquierdo: Asignar Tarea */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Asignar Tarea</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {!showForm ? (
                        <Button onClick={() => setShowForm(true)} className="w-full">
                          Nueva Tarea
                        </Button>
                      ) : (
                        <form onSubmit={handleAsignarTarea} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-2 text-foreground">
                              Personal Asignable <span className="text-red-500">*</span>
                              <span className="text-[10px] text-muted-foreground ml-2">({selectedAsignados.length} seleccionados)</span>
                            </label>
                            <div className="relative">
                              <button 
                                type="button"
                                onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-md flex items-center justify-between hover:border-primary transition-colors"
                              >
                                <span className="truncate">
                                  {selectedAsignados.length > 0 
                                    ? `${selectedAsignados.length} seleccionados` 
                                    : "-- Selecciona personal --"}
                                </span>
                                {showAssignDropdown ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </button>

                              {showAssignDropdown && (
                                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-md shadow-lg p-2 space-y-2">
                                  <input 
                                    type="text"
                                    placeholder="Buscar personal..."
                                    className="w-full h-8 px-2 text-sm bg-background border border-border rounded-md"
                                    value={assignSearch}
                                    onChange={(e) => setAssignSearch(e.target.value)}
                                    autoFocus
                                  />
                                  <div className="max-h-40 overflow-y-auto space-y-1">
                                    {colaboradores
                                      .filter((c: Profile) => 
                                        `${c.nombre} ${c.apellido}`.toLowerCase().includes(assignSearch.toLowerCase())
                                      )
                                      .map((colab: Profile) => (
                                        <label key={colab.id} className="flex items-center gap-2 p-2 hover:bg-secondary/50 rounded-md cursor-pointer transition-colors">
                                          <input 
                                            type="checkbox"
                                            checked={selectedAsignados.includes(colab.id)}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setSelectedAsignados([...selectedAsignados, colab.id])
                                              } else {
                                                setSelectedAsignados(selectedAsignados.filter((id: string) => id !== colab.id))
                                              }
                                            }}
                                            className="h-4 w-4 rounded border-border text-primary"
                                          />
                                          <div className="flex flex-col">
                                            <span className="text-sm font-medium">{colab.nombre} {colab.apellido}</span>
                                            <span className="text-[10px] text-muted-foreground">
                                              {colab.role === 2 ? 'Supervisor' : 'Colaborador'}
                                            </span>
                                          </div>
                                        </label>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
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
                            <Button type="submit" disabled={isSubmitting} className="flex-1">
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
                                        <strong>Asignado a:</strong> {colaborador?.nombre} {colaborador?.apellido} ({colaborador?.role === 2 ? 'Supervisor' : 'Colaborador'})
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
            )}
            {/* Tab: Tareas del Equipo */}
            {tab === 'equipo' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-black text-foreground">Visualización de Tareas del Equipo</h2>
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
                                  <p className="text-[9px] text-muted-foreground text-center py-2">No se encontraron personas</p>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tareasEquipo && tareasEquipo.length > 0 ? (
                    tareasEquipo.map((tarea) => {
                      const isOverdue = tarea.estado !== 'completada' && tarea.fecha_limite && new Date(tarea.fecha_limite) < today;
                      return (
                        <Card key={tarea.id} className={`hover:shadow-lg transition-all duration-300 border-l-4 ${isOverdue ? 'border-l-destructive bg-destructive/5' : 'border-l-primary'}`}>
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <CardTitle className="text-base font-black truncate max-w-[150px]">
                                  {tarea.titulo}
                                </CardTitle>
                                {isOverdue && (
                                  <span className="flex items-center gap-1 text-[9px] font-black text-destructive uppercase animate-pulse">
                                    <AlertCircle className="h-3 w-3" />
                                    Vencida
                                  </span>
                                )}
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  tarea.estado === 'completada'
                                    ? 'bg-green-100 text-green-700'
                                    : tarea.estado === 'en_progreso'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}
                              >
                                {tarea.estado === 'completada'
                                  ? 'Completada'
                                  : tarea.estado === 'en_progreso'
                                  ? 'En Proceso'
                                  : 'Pendiente'}
                              </span>
                            </div>
                          </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {tarea.descripcion && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {tarea.descripcion}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-2 pt-2 border-t border-border">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-primary">
                                  {tarea.perfil?.nombre?.charAt(0)}{tarea.perfil?.apellido?.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="text-[11px] font-black text-foreground leading-none">
                                  {tarea.perfil?.nombre} {tarea.perfil?.apellido}
                                </p>
                                <p className="text-[9px] text-muted-foreground mt-1">
                                  {tarea.perfil?.role === 2 ? 'Supervisor' : 'Colaborador'}
                                </p>
                              </div>
                            </div>

                            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mt-4">
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
                          </div>
                        </CardContent>
                        </Card>
                      );
                    })
                  ) : (
                    <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                      <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p className="font-medium text-lg text-muted-foreground/50">No hay tareas registradas en el sistema</p>
                    </div>
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

export default function SupervisorPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <SupervisorContent />
    </Suspense>
  )
}
