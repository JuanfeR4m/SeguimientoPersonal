# SeguimientoPersonal

Sistema de seguimiento de personal con registro de actividades diarias y gestión de tareas.

## Características

- **Dashboard Administrativo**: Panel principal para visualizar estadísticas y registros de seguimiento
- **Panel de Colaborador**: Los colaboradores pueden registrar sus actividades diarias y gestionar tareas asignadas
- **Panel de Supervisor**: Los supervisores pueden asignar tareas a colaboradores y monitorizarlas
- **Autenticación con Supabase**: Sistema seguro de login y gestión de usuarios
- **Row Level Security (RLS)**: Protección de datos con políticas de seguridad a nivel de base de datos

## Configuración Inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar la base de datos

Abre `SETUP_DATABASE.md` para ver las instrucciones SQL que debes ejecutar en Supabase.

### 3. Variables de entorno

Las siguientes variables deben estar configuradas en Vercel o en tu archivo `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### 4. Crear usuarios de prueba

Crea usuarios en Supabase y asigna los siguientes roles en la tabla `profiles`:
- Role 1: Administrador
- Role 2: Supervisor
- Role 3: Colaborador

## Rutas disponibles

- `/` - Dashboard principal (solo para admins - role 1)
- `/login` - Página de inicio de sesión
- `/colaborador` - Área de colaborador (role 3)
- `/supervisor` - Panel de supervisor (role 2)
- `/admin` - Panel administrativo (role 1)

## Estructura del proyecto

```
app/
├── page.tsx                 # Dashboard principal
├── login/                   # Autenticación
├── colaborador/            # Rutas del colaborador
│   ├── page.tsx           # Página principal colaborador
│   ├── layout.tsx         # Layout colaborador
│   └── actions.ts         # Acciones del servidor
├── supervisor/            # Rutas del supervisor
│   ├── page.tsx          # Página principal supervisor
│   ├── layout.tsx        # Layout supervisor
│   └── actions.ts        # Acciones del servidor
└── admin/                # Rutas del admin
    ├── page.tsx         # Página principal admin
    └── layout.tsx       # Layout admin

components/
├── colaborador-sidebar.tsx  # Sidebar para colaborador
├── supervisor-sidebar.tsx   # Sidebar para supervisor
└── ...

lib/
├── supabase/           # Clientes de Supabase
│   ├── client.ts      # Cliente navegador
│   └── server.ts      # Cliente servidor
└── types.ts           # Tipos TypeScript
```

## Scripts disponibles

```bash
npm run dev      # Inicia el servidor de desarrollo
npm run build    # Construye la aplicación
npm run start    # Inicia el servidor de producción
npm run lint     # Ejecuta linter
```

## Notas de desarrollo

- El middleware (`middleware.ts`) maneja la redirección automática según el rol del usuario
- Las acciones del servidor usan `'use server'` para operaciones con Supabase
- El sistema usa `useSWR` para la revalidación de datos en el cliente
- Todas las operaciones respetan Row Level Security (RLS) configurado en Supabase
