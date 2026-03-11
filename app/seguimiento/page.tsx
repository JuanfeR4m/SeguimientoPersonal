"use client"

import { DashboardLayout } from "@/components/dashboard-layout"
import { AlertCards } from "@/components/alert-cards"
import { TrackingTabs } from "@/components/tracking-tabs"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function SeguimientoPage() {
  const { data, isLoading } = useSWR("/api/seguimiento", fetcher, {
    revalidateOnFocus: false,
  })

  const alertas = data?.alertas
  const detalle = data?.detalle

  return (
    <DashboardLayout title="Seguimiento Semanal" description="Monitoreo de cumplimiento y alertas del personal">
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h2 className="text-lg font-bold text-foreground">Resumen de Alertas</h2>
          <p className="text-sm text-muted-foreground">
            Revisa los indicadores clave basados en los datos registrados
            {data?.totalRegistros !== undefined && (
              <span className="ml-1 font-medium">({data.totalRegistros} registros totales)</span>
            )}
          </p>
        </div>
        <AlertCards alertas={alertas} isLoading={isLoading} />
        <TrackingTabs detalle={detalle} isLoading={isLoading} />
      </div>
    </DashboardLayout>
  )
}
