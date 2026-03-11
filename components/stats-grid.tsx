"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Users, MapPin, FolderKanban, Database, Search } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { DashboardStats } from "@/lib/types"

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: "blue" | "orange" | "green" | "navy"
}

const colorMap = {
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    value: "text-blue-700",
    border: "border-l-blue-500",
  },
  orange: {
    bg: "bg-orange-50",
    icon: "text-orange-500",
    value: "text-orange-600",
    border: "border-l-orange-500",
  },
  green: {
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
    value: "text-emerald-700",
    border: "border-l-emerald-500",
  },
  navy: {
    bg: "bg-primary/5",
    icon: "text-primary",
    value: "text-primary",
    border: "border-l-primary",
  },
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const c = colorMap[color]
  return (
    <Card className={`border-l-4 ${c.border} shadow-sm`}>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${c.bg}`}>
          <div className={c.icon}>{icon}</div>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className={`text-2xl font-black tabular-nums ${c.value}`}>{value}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function StatCardSkeleton() {
  return (
    <Card className="border-l-4 border-l-muted shadow-sm">
      <CardContent className="flex items-center gap-4 p-5">
        <Skeleton className="h-11 w-11 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-7 w-12" />
        </div>
      </CardContent>
    </Card>
  )
}

interface StatsGridProps {
  stats?: DashboardStats
  isLoading: boolean
}

export function StatsGrid({ stats, isLoading }: StatsGridProps) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard title="Total Registros" value={stats.totalRegistros} icon={<Database className="h-5 w-5" />} color="navy" />
      <StatCard title="Personal Unico" value={stats.personalUnico} icon={<Users className="h-5 w-5" />} color="orange" />
      <StatCard title="Lugares" value={stats.lugaresUnicos} icon={<MapPin className="h-5 w-5" />} color="green" />
      <StatCard title="Proyectos" value={stats.proyectosDesarrollo} icon={<FolderKanban className="h-5 w-5" />} color="blue" />
      <StatCard title="Resultados" value={stats.resultadosFiltrados} icon={<Search className="h-5 w-5" />} color="navy" />
    </div>
  )
}
