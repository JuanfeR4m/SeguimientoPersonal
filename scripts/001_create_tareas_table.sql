-- Tabla para almacenar tareas asignadas por supervisores a colaboradores
CREATE TABLE IF NOT EXISTS public.tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha_limite DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'completada')),
  supervisor_id UUID NOT NULL,
  colaborador_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;

-- Política: Supervisores pueden ver todas las tareas que han asignado
CREATE POLICY "supervisores_ver_tareas_asignadas" ON public.tareas
  FOR SELECT USING (
    auth.uid() = supervisor_id OR auth.uid() = colaborador_id
  );

-- Política: Supervisores pueden crear tareas
CREATE POLICY "supervisores_crear_tareas" ON public.tareas
  FOR INSERT WITH CHECK (
    auth.uid() = supervisor_id
  );

-- Política: Supervisores pueden actualizar tareas que asignaron
CREATE POLICY "supervisores_actualizar_tareas" ON public.tareas
  FOR UPDATE USING (
    auth.uid() = supervisor_id OR auth.uid() = colaborador_id
  );

-- Política: Supervisores pueden eliminar tareas que asignaron
CREATE POLICY "supervisores_eliminar_tareas" ON public.tareas
  FOR DELETE USING (
    auth.uid() = supervisor_id
  );

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_tareas_colaborador ON public.tareas(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_tareas_supervisor ON public.tareas(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_tareas_estado ON public.tareas(estado);
