'use client'

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { StatsGrid } from "@/components/stats-grid"
import { SearchFilters } from "@/components/search-filters"
import { EmployeeTable } from "@/components/employee-table"
import { useState } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import type { Respuesta, DashboardStats, Filters, Profile } from "@/lib/types"
import { Loader2 } from "lucide-react"

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
  const [isChecking, setIsChecking] = useState(true)
  const router = useRouter()

  // Mover useSWR ANTES del return condicional (Reglas de Hooks)
  const { data, isLoading, error } = useSWR<{
    stats: DashboardStats
    registros: Respuesta[]
    lugares: string[]
  }>(buildUrl(filters), fetcher, {
    revalidateOnFocus: false,
  })

  // Verificar el rol del usuario
  useEffect(() => {
    const checkRole = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        // Si el usuario no es admin (role 1), redirigir
        if (profile?.role === 2) {
          router.push('/supervisor')
        } else if (profile?.role === 3) {
          router.push('/colaborador')
        }
      }

      setIsChecking(false)
    }

    checkRole()
  }, [router])

  if (isChecking) {
    return (
      <DashboardLayout
        title="Verificando acceso..."
        description="Por favor espera"
      >
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

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
