"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import type { Respuesta } from "@/lib/types"

interface EmployeeTableProps {
  registros: Respuesta[]
  isLoading: boolean
  error?: string
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

function formatName(nombre: string | null, apellido: string | null) {
  const parts = [nombre, apellido].filter(Boolean)
  if (parts.length === 0) return "Sin nombre"
  return parts
    .join(" ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function DistribucionBadge({ r }: { r: Respuesta }) {
  const areas = [
    r.administracion && r.administracion > 0 ? "Admin" : null,
    r.proyectos && r.proyectos > 0 ? "Proy" : null,
    r.interventoria && r.interventoria > 0 ? "Interv" : null,
    r.otro && r.otro > 0 ? "Otro" : null,
  ].filter(Boolean)

  if (areas.length === 0) {
    return (
      <Badge
        variant="secondary"
        className="bg-muted text-muted-foreground border-border hover:bg-muted"
      >
        Sin asignar
      </Badge>
    )
  }

  return (
    <div className="flex flex-wrap gap-1">
      {areas.map((area) => (
        <Badge
          key={area}
          variant="default"
          className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
        >
          {area}
        </Badge>
      ))}
    </div>
  )
}

function DetalleDialog({ registro }: { registro: Respuesta }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
          <Eye className="h-3.5 w-3.5" />
          Ver
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {formatName(registro.nombre_en_mayusculas, registro.apellido_en_mayusculas)}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Correo</p>
              <p className="text-sm text-foreground">{registro.correo_electronico || "---"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Fecha</p>
              <p className="text-sm text-foreground">{formatDate(registro.fecha_de_diligenciamiento)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Hora Entrada</p>
              <p className="text-sm text-foreground">{registro.hora_entrada || "---"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Hora Salida</p>
              <p className="text-sm text-foreground">{registro.hora_salida || "---"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Lugar de Trabajo</p>
              <p className="text-sm text-foreground">{registro.lugar_de_trabajo || "---"}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Distribucion</p>
              <div className="flex gap-2 text-sm">
                {registro.administracion ? <span>Admin: {registro.administracion}%</span> : null}
                {registro.proyectos ? <span>Proy: {registro.proyectos}%</span> : null}
                {registro.interventoria ? <span>Interv: {registro.interventoria}%</span> : null}
                {registro.otro ? <span>Otro: {registro.otro}%</span> : null}
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Proyectos de Desarrollo</p>
            <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{registro.proyectos_de_desarrollo || "---"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Actividades Realizadas</p>
            <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{registro.actividades_realizadas || "---"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Riesgos</p>
            <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{registro.riesgos || "---"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Tareas Pendientes</p>
            <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{registro.tareas_pendientes || "---"}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}

export function EmployeeTable({ registros, isLoading, error }: EmployeeTableProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-foreground">
          Registros de Personal
          {!isLoading && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({registros.length} registros)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <div className="p-6 text-center text-destructive text-sm">
            Error al cargar los datos: {error}
          </div>
        )}
        {isLoading ? (
          <TableSkeleton />
        ) : registros.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            No se encontraron registros con los filtros seleccionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-primary hover:bg-primary border-none">
                  <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">ID</TableHead>
                  <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Nombre</TableHead>
                  <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Correo</TableHead>
                  <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Fecha</TableHead>
                  <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Horario</TableHead>
                  <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Lugar</TableHead>
                  <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Distribucion</TableHead>
                  <TableHead className="text-primary-foreground text-xs font-semibold uppercase tracking-wider">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer transition-colors hover:bg-secondary/60">
                    <TableCell className="text-sm text-muted-foreground">{r.id}</TableCell>
                    <TableCell className="font-medium text-foreground">
                      {formatName(r.nombre_en_mayusculas, r.apellido_en_mayusculas)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.correo_electronico || "---"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(r.fecha_de_diligenciamiento)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.hora_entrada || "---"} - {r.hora_salida || "---"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.lugar_de_trabajo || "---"}</TableCell>
                    <TableCell>
                      <DistribucionBadge r={r} />
                    </TableCell>
                    <TableCell>
                      <DetalleDialog registro={r} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
