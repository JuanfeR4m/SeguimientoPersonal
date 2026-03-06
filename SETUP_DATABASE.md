# Configuración de la Base de Datos

Para que el sistema de seguimiento de actividades funcione correctamente, debes ejecutar los siguientes comandos SQL en tu consola de Supabase.

## Paso 1: Acceder a Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión en tu proyecto
3. Ve a la sección **SQL Editor** en el panel lateral izquierdo

## Paso 2: Crear la tabla de tareas

Copia y pega el siguiente código SQL en el editor de Supabase:

```sql
-- Crear tabla de tareas
CREATE TABLE IF NOT EXISTS public.tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha_limite DATE,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_progreso', 'completada')),
  supervisor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  colaborador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "usuarios_pueden_ver_sus_tareas" ON public.tareas
  FOR SELECT USING (
    auth.uid() = supervisor_id OR auth.uid() = colaborador_id
  );

CREATE POLICY "supervisores_pueden_crear_tareas" ON public.tareas
  FOR INSERT WITH CHECK (
    auth.uid() = supervisor_id
  );

CREATE POLICY "supervisores_pueden_actualizar_tareas" ON public.tareas
  FOR UPDATE USING (
    auth.uid() = supervisor_id OR auth.uid() = colaborador_id
  )
  WITH CHECK (
    auth.uid() = supervisor_id OR auth.uid() = colaborador_id
  );

CREATE POLICY "supervisores_pueden_eliminar_tareas" ON public.tareas
  FOR DELETE USING (
    auth.uid() = supervisor_id
  );

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_tareas_colaborador ON public.tareas(colaborador_id);
CREATE INDEX IF NOT EXISTS idx_tareas_supervisor ON public.tareas(supervisor_id);
CREATE INDEX IF NOT EXISTS idx_tareas_estado ON public.tareas(estado);
```

## Paso 3: Actualizar tabla de profiles (si no existe)

Si la tabla `profiles` no existe o no tiene los campos necesarios, copia y pega esto:

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT,
  apellido TEXT,
  correo_electronico TEXT,
  role INTEGER DEFAULT 3, -- 1: admin, 2: supervisor, 3: colaborador
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "usuarios_pueden_ver_su_perfil" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "usuarios_pueden_actualizar_su_perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
```

## Paso 4: Verificar la tabla de seguimiento

La tabla `seguimiento` ya debe existir en tu base de datos. Si no, copia esto:

```sql
CREATE TABLE IF NOT EXISTS public.seguimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha_de_diligenciamiento DATE NOT NULL,
  administracion INTEGER DEFAULT 0,
  proyectos INTEGER DEFAULT 0,
  interventoria INTEGER DEFAULT 0,
  otro INTEGER DEFAULT 0,
  tareas_pendientes TEXT,
  lugar_de_trabajo TEXT,
  proyectos_de_desarrollo TEXT,
  actividades_realizadas TEXT,
  riesgos TEXT,
  nombre_en_mayusculas TEXT,
  apellido_en_mayusculas TEXT,
  correo_electronico TEXT,
  hora_entrada TIME,
  hora_salida TIME,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE public.seguimiento ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "usuarios_ven_su_seguimiento" ON public.seguimiento
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "usuarios_crean_su_seguimiento" ON public.seguimiento
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "usuarios_actualizan_su_seguimiento" ON public.seguimiento
  FOR UPDATE USING (auth.uid() = user_id);
```

## Paso 5: Ejecutar los comandos

1. Haz clic en el botón **"Run"** o presiona **Ctrl + Enter**
2. Deberías ver mensajes de éxito

¡Listo! Ahora el sistema está configurado y funcionando.

## Notas importantes

- Las tablas usan **Row Level Security (RLS)** para proteger los datos
- Los usuarios solo pueden ver sus propias tareas y registros
- Los supervisores pueden crear y asignar tareas a colaboradores
- Asegúrate de que los usuarios tengan los roles correctos en la tabla `profiles` (1: admin, 2: supervisor, 3: colaborador)
