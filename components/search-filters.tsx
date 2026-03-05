"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, RotateCcw } from "lucide-react"
import { useState } from "react"
import type { Filters } from "@/lib/types"

interface SearchFiltersProps {
  lugares: string[]
  filters: Filters
  onFiltersChange: (filters: Filters) => void
}

export function SearchFilters({ lugares, filters, onFiltersChange }: SearchFiltersProps) {
  const [nombre, setNombre] = useState(filters.nombre || "")
  const [lugar, setLugar] = useState(filters.lugar || "")
  const [fechaDesde, setFechaDesde] = useState(filters.fechaDesde || "")
  const [fechaHasta, setFechaHasta] = useState(filters.fechaHasta || "")

  function handleSearch() {
    onFiltersChange({
      nombre: nombre || undefined,
      lugar: lugar || undefined,
      fechaDesde: fechaDesde || undefined,
      fechaHasta: fechaHasta || undefined,
    })
  }

  function handleReset() {
    setNombre("")
    setLugar("")
    setFechaDesde("")
    setFechaHasta("")
    onFiltersChange({})
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-foreground">Filtros de Busqueda</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-1.5">
            <Label htmlFor="search-name" className="text-xs font-medium text-muted-foreground">
              Nombre del Empleado
            </Label>
            <Input
              id="search-name"
              placeholder="Buscar por nombre..."
              className="h-10 bg-secondary"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Lugar de Trabajo</Label>
            <Select value={lugar} onValueChange={setLugar}>
              <SelectTrigger className="h-10 bg-secondary">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {lugares.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date-from" className="text-xs font-medium text-muted-foreground">
              Fecha Desde
            </Label>
            <Input
              id="date-from"
              type="date"
              className="h-10 bg-secondary"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date-to" className="text-xs font-medium text-muted-foreground">
              Fecha Hasta
            </Label>
            <Input
              id="date-to"
              type="date"
              className="h-10 bg-secondary"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
          <Button
            onClick={handleSearch}
            className="h-10 bg-accent text-accent-foreground hover:bg-accent/90 shadow-md"
          >
            <Search className="mr-2 h-4 w-4" />
            Buscar
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className="h-10"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpiar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
