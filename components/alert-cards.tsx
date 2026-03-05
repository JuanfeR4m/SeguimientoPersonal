"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle, ClipboardList, Clock, Target } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

interface AlertCardProps {
  title: string
  description: string
  icon: React.ReactNode
  color: "red" | "yellow" | "blue" | "orange"
  value: number
}

const colorMap = {
  red: {
    bg: "bg-red-50",
    icon: "text-red-500",
    border: "border-l-red-500",
    valueBg: "bg-red-100 text-red-700",
  },
  yellow: {
    bg: "bg-amber-50",
    icon: "text-amber-500",
    border: "border-l-amber-500",
    valueBg: "bg-amber-100 text-amber-700",
  },
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-500",
    border: "border-l-blue-500",
    valueBg: "bg-blue-100 text-blue-700",
  },
  orange: {
    bg: "bg-orange-50",
    icon: "text-orange-500",
    border: "border-l-orange-500",
    valueBg: "bg-orange-100 text-orange-700",
  },
}

function AlertCard({ title, description, icon, color, value }: AlertCardProps) {
  const c = colorMap[color]
  return (
    <Card className={`border-l-4 ${c.border} shadow-sm`}>
      <CardContent className="flex items-start gap-4 p-5">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${c.bg}`}>
          <div className={c.icon}>{icon}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold ${c.valueBg}`}>
              {value}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function AlertCardSkeleton() {
  return (
    <Card className="border-l-4 border-l-muted shadow-sm">
      <CardContent className="flex items-start gap-4 p-5">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </CardContent>
    </Card>
  )
}

interface AlertCardsProps {
  alertas?: {
    sinActividades: number
    tareasPendientes: number
    sinHoraSalida: number
    conRiesgos: number
  }
  isLoading: boolean
}

export function AlertCards({ alertas, isLoading }: AlertCardsProps) {
  if (isLoading || !alertas) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <AlertCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AlertCard
        title="Sin Actividades"
        description="Registros sin actividades reportadas"
        icon={<AlertTriangle className="h-5 w-5" />}
        color="red"
        value={alertas.sinActividades}
      />
      <AlertCard
        title="Tareas Pendientes"
        description="Registros con tareas por completar"
        icon={<ClipboardList className="h-5 w-5" />}
        color="yellow"
        value={alertas.tareasPendientes}
      />
      <AlertCard
        title="Sin Hora Salida"
        description="Registros sin hora de salida"
        icon={<Clock className="h-5 w-5" />}
        color="blue"
        value={alertas.sinHoraSalida}
      />
      <AlertCard
        title="Riesgos Reportados"
        description="Registros con riesgos identificados"
        icon={<Target className="h-5 w-5" />}
        color="orange"
        value={alertas.conRiesgos}
      />
    </div>
  )
}
