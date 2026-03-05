"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { StatsGrid } from "@/components/stats-grid"
import { SearchFilters } from "@/components/search-filters"
import { EmployeeTable } from "@/components/employee-table"
import { useState } from "react"
import useSWR from "swr"
import type { Respuesta, DashboardStats, Filters } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

function buildUrl(filters: Filters) {
  const params = new URLSearchParams()
  if (filters.nombre) params.set("nombre", filters.nombre)
  if (filters.lugar) params.set("lugar", filters.lugar)
  if (filters.fechaDesde) params.set("fechaDesde", filters.fechaDesde)
  if (filters.fechaHasta) params.set("fechaHasta", filters.fechaHasta)
  return `/api/respuestas?${params.toString()}`
}

export default function DashboardPage() {
  const [filters, setFilters] = useState<Filters>({})

  const { data, isLoading, error } = useSWR<{
    stats: DashboardStats
    registros: Respuesta[]
    lugares: string[]
  }>(buildUrl(filters), fetcher, {
    revalidateOnFocus: false,
  })

  const stats = data?.stats
  const registros = data?.registros || []
  const lugares = data?.lugares || []

  return (
    <DashboardLayout
      title="Dashboard Principal"
      description="Vista general del sistema de seguimiento de personal"
    >
      <div className="flex flex-col gap-6 p-6">
        <StatsGrid stats={stats} isLoading={isLoading} />
        <SearchFilters
          lugares={lugares}
          filters={filters}
          onFiltersChange={setFilters}
        />
        <EmployeeTable
          registros={registros}
          isLoading={isLoading}
          error={error?.message}
        />
      </div>
    </DashboardLayout>
  )
}
