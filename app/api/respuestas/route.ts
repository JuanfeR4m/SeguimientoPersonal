import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)

  const nombre = searchParams.get("nombre") || ""
  const lugar = searchParams.get("lugar") || ""
  const fechaDesde = searchParams.get("fechaDesde") || ""
  const fechaHasta = searchParams.get("fechaHasta") || ""

  // Get all data for stats
  const { data: allData, error: allError } = await supabase
    .from("respuestas")
    .select("*")
    .order("fecha_de_diligenciamiento", { ascending: false })

  if (allError) {
    return NextResponse.json({ error: allError.message }, { status: 500 })
  }

  // Build filtered query
  let query = supabase
    .from("respuestas")
    .select("*")
    .order("fecha_de_diligenciamiento", { ascending: false })

  if (nombre) {
    query = query.or(
      `nombre_en_mayusculas.ilike.%${nombre}%,apellido_en_mayusculas.ilike.%${nombre}%`
    )
  }

  if (lugar && lugar !== "all") {
    query = query.ilike("lugar_de_trabajo", `%${lugar}%`)
  }

  if (fechaDesde) {
    query = query.gte("fecha_de_diligenciamiento", fechaDesde)
  }

  if (fechaHasta) {
    query = query.lte("fecha_de_diligenciamiento", `${fechaHasta}T23:59:59`)
  }

  const { data: filteredData, error: filteredError } = await query

  if (filteredError) {
    return NextResponse.json({ error: filteredError.message }, { status: 500 })
  }

  // Calculate stats from all data
  const nombresUnicos = new Set(
    (allData || []).map(
      (r) => `${r.nombre_en_mayusculas || ""} ${r.apellido_en_mayusculas || ""}`.trim()
    ).filter(Boolean)
  )
  const lugaresUnicos = new Set(
    (allData || []).map((r) => r.lugar_de_trabajo).filter(Boolean)
  )
  const proyectosUnicos = new Set(
    (allData || []).map((r) => r.proyectos_de_desarrollo).filter(Boolean)
  )

  const stats = {
    totalRegistros: (allData || []).length,
    personalUnico: nombresUnicos.size,
    lugaresUnicos: lugaresUnicos.size,
    proyectosDesarrollo: proyectosUnicos.size,
    resultadosFiltrados: (filteredData || []).length,
  }

  const lugares = Array.from(lugaresUnicos).sort()

  return NextResponse.json({
    stats,
    registros: filteredData || [],
    lugares,
  })
}
