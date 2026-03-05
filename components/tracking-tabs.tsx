"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import type { Respuesta } from "@/lib/types"

function formatName(nombre: string | null, apellido: string | null) {
  const parts = [nombre, apellido].filter(Boolean)
  if (parts.length === 0) return "Sin nombre"
  return parts
    .join(" ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "---"
  try {
    const date = new Date(dateStr)
    return date.toLocaleDateString("es-CO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  } catch {
    return dateStr
  }
}

function truncate(text: string | null, max: number) {
  if (!text) return "---"
  return text.length > max ? text.slice(0, max) + "..." : text
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  )
}

interface TrackingTabsProps {
  detalle?: {
    sinActividades: Respuesta[]
    tareasPendientes: Respuesta[]
    sinHoraSalida: Respuesta[]
    conRiesgos: Respuesta[]
  }
  isLoading: boolean
}

export function TrackingTabs({ detalle, isLoading }: TrackingTabsProps) {
  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        <Tabs defaultValue="sin-actividades" className="w-full">
          <div className="border-b border-border px-6 pt-5">
            <TabsList className="h-10 w-full justify-start gap-1 bg-secondary/60 p-1">
              <TabsTrigger value="sin-actividades" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-xs font-semibold">
                Sin Actividades
              </TabsTrigger>
              <TabsTrigger value="tareas" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-xs font-semibold">
                Tareas Pendientes
              </TabsTrigger>
              <TabsTrigger value="horas" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-xs font-semibold">
                Sin Hora Salida
              </TabsTrigger>
              <TabsTrigger value="riesgos" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground text-xs font-semibold">
                Riesgos
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="sin-actividades" className="mt-0">
            {isLoading || !detalle ? (
              <TableSkeleton />
            ) : detalle.sinActividades.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Todos los registros tienen actividades reportadas.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary border-none">
                      <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Nombre</TableHead>
                      <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Correo</TableHead>
                      <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Fecha</TableHead>
                      <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Lugar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detalle.sinActividades.map((r) => (
                      <TableRow key={r.id} className="transition-colors hover:bg-secondary/60">
                        <TableCell className="font-medium text-foreground">{formatName(r.nombre_en_mayusculas, r.apellido_en_mayusculas)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.correo_electronico || "---"}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{formatDate(r.fecha_de_diligenciamiento)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.lugar_de_trabajo || "---"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="tareas" className="mt-0">
            {isLoading || !detalle ? (
              <TableSkeleton />
            ) : detalle.tareasPendientes.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No hay tareas pendientes registradas.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary border-none">
                      <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Nombre</TableHead>
                      <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Fecha</TableHead>
                      <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Lugar</TableHead>
                      <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Tareas Pendientes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detalle.tareasPendientes.map((r) => (
                      <TableRow key={r.id} className="transition-colors hover:bg-secondary/60">
                        <TableCell className="font-medium text-foreground">{formatName(r.nombre_en_mayusculas, r.apellido_en_mayusculas)}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{formatDate(r.fecha_de_diligenciamiento)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.lugar_de_trabajo || "---"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs">
                          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 max-w-full">
                            <span className="truncate">{truncate(r.tareas_pendientes, 60)}</span>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="horas" className="mt-0">
            {isLoading || !detalle ? (
              <TableSkeleton />
            ) : detalle.sinHoraSalida.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Todos los registros tienen hora de salida.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary border-none">
                      <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Nombre</TableHead>
                      <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Fecha</TableHead>
                      <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Hora Entrada</TableHead>
                      <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Hora Salida</TableHead>
                      <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Lugar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detalle.sinHoraSalida.map((r) => (
                      <TableRow key={r.id} className="transition-colors hover:bg-secondary/60">
                        <TableCell className="font-medium text-foreground">{formatName(r.nombre_en_mayusculas, r.apellido_en_mayusculas)}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{formatDate(r.fecha_de_diligenciamiento)}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{r.hora_entrada || "---"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100">
                            Sin registrar
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.lugar_de_trabajo || "---"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="riesgos" className="mt-0">
            {isLoading || !detalle ? (
              <TableSkeleton />
            ) : detalle.conRiesgos.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No hay riesgos reportados.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary hover:bg-primary border-none">
                      <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Nombre</TableHead>
                      <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Fecha</TableHead>
                      <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Lugar</TableHead>
                      <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Riesgo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detalle.conRiesgos.map((r) => (
                      <TableRow key={r.id} className="transition-colors hover:bg-secondary/60">
                        <TableCell className="font-medium text-foreground">{formatName(r.nombre_en_mayusculas, r.apellido_en_mayusculas)}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">{formatDate(r.fecha_de_diligenciamiento)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.lugar_de_trabajo || "---"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs">
                          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100 max-w-full">
                            <span className="truncate">{truncate(r.riesgos, 60)}</span>
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
