"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"
import { LayoutDashboard, ClipboardCheck, BarChart3, LogOut, Shield } from "lucide-react"
import { logout } from "@/app/login/actions"
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
} from "@/components/ui/sidebar"

const navItems = [
  { title: "Inicio", href: "/", icon: LayoutDashboard },
  { title: "Seguimiento", href: "/seguimiento", icon: ClipboardCheck },
  { title: "Reportes", href: "#", icon: BarChart3, disabled: true },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleLogout = async () => {
    startTransition(async () => {
      await logout()
      router.push('/login')
    })
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
            <Shield className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight text-sidebar-foreground">
              Central MAV
            </h2>
            <p className="text-xs text-sidebar-foreground/60">Panel Directivo</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50 text-[11px] uppercase tracking-widest">
            Navegacion
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={item.title}
                    size="lg"
                    className={
                      pathname === item.href
                        ? "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground"
                        : item.disabled
                          ? "opacity-40 pointer-events-none"
                          : ""
                    }
                  >
                    <Link href={item.href} aria-disabled={item.disabled}>
                      <item.icon className="h-5 w-5" />
                      <span className="font-medium">{item.title}</span>
                    </Link>
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
          <p className="text-sm font-semibold text-sidebar-foreground">Admin</p>
          <p className="text-xs text-sidebar-foreground/60">Director General</p>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleLogout}
              disabled={isPending}
              size="default"
              className="text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-destructive cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>{isPending ? 'Cerrando...' : 'Cerrar Sesion'}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
