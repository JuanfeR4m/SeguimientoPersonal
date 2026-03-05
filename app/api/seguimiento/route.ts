import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("respuestas")
    .select("*")
    .order("fecha_de_diligenciamiento", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const registros = data || []

  // Personas con tareas pendientes (campo no vacio)
  const conTareasPendientes = registros.filter(
    (r) => r.tareas_pendientes && r.tareas_pendientes.trim().length > 0
  )

  // Personas con riesgos reportados
  const conRiesgos = registros.filter(
    (r) => r.riesgos && r.riesgos.trim().length > 0
  )

  // Personas sin actividades realizadas
  const sinActividades = registros.filter(
    (r) => !r.actividades_realizadas || r.actividades_realizadas.trim().length === 0
  )

  // Personas sin hora de salida (posiblemente no completaron jornada)
  const sinHoraSalida = registros.filter(
    (r) => !r.hora_salida || r.hora_salida.trim().length === 0
  )

  // Group by unique person for "sin registro" - get latest per person
  const personaMap = new Map<string, typeof registros[0]>()
  for (const r of registros) {
    const key = `${r.nombre_en_mayusculas || ""} ${r.apellido_en_mayusculas || ""}`.trim()
    if (key && !personaMap.has(key)) {
      personaMap.set(key, r)
    }
  }

  return NextResponse.json({
    alertas: {
      sinActividades: sinActividades.length,
      tareasPendientes: conTareasPendientes.length,
      sinHoraSalida: sinHoraSalida.length,
      conRiesgos: conRiesgos.length,
    },
    detalle: {
      sinActividades: sinActividades.slice(0, 20),
      tareasPendientes: conTareasPendientes.slice(0, 20),
      sinHoraSalida: sinHoraSalida.slice(0, 20),
      conRiesgos: conRiesgos.slice(0, 20),
    },
    totalRegistros: registros.length,
  })
}
