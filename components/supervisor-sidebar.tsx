'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Home, CheckSquare } from 'lucide-react'
import { logout } from '@/app/login/actions'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'

interface SupervisorSidebarProps {
  nombre: string
  apellido: string
}

export function SupervisorSidebar({ nombre, apellido }: SupervisorSidebarProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleLogout = async () => {
    startTransition(async () => {
      await logout()
      router.push('/login')
    })
  }

  const navItems = [
    { title: 'Panel Supervisor', href: '/supervisor', icon: Home },
  ]

  return (
    <Sidebar>
      <SidebarHeader className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <CheckSquare className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h2 className="font-mono text-base font-bold tracking-tight text-sidebar-foreground">
              Sistema MAV
            </h2>
            <p className="text-xs text-sidebar-foreground/60">Supervisor</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[11px] uppercase tracking-widest">
            Navegación
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    size="lg"
                    className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                  >
                    <a href={item.href}>
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarSeparator className="mb-3" />
        <div className="mb-3 px-1">
          <p className="text-sm font-semibold text-sidebar-foreground">
            {nombre} {apellido}
          </p>
          <p className="text-xs text-sidebar-foreground/60">Supervisor</p>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              disabled={isPending}
              className="text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>{isPending ? 'Cerrando...' : 'Cerrar Sesión'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
