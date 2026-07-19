"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { 
  LayoutDashboard, 
  Users, 
  FileQuestion, 
  GraduationCap, 
  BarChart3, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  Search, 
  ChevronDown 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Loader } from "@/components/ui/loader"

// Sidebar navigation items
const NAV_ITEMS = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Students", href: "/admin/students", icon: Users, badge: "12" },
  { label: "Questions", href: "/admin/questions", icon: FileQuestion },
  { label: "Exams", href: "/admin/exams", icon: GraduationCap },
  { label: "Results", href: "/admin/results", icon: BarChart3 },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
  const { data: session, status } = useSession()

  // Dynamic user session state
  const [adminName, setAdminName] = React.useState("Admin User")
  const [adminEmail, setAdminEmail] = React.useState("admin@cissikar.com")
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    if (status === "loading") {
      return
    }

    if (status === "unauthenticated" || !session?.user) {
      router.push("/login")
      return
    }

    const role = (session.user as any).role
    if (role !== "admin") {
      // Access denied if user is not an administrator
      router.push("/login")
      return
    }

    setAdminName(session.user.name || "Administrator")
    setAdminEmail(session.user.email || "admin@cissikar.com")
    setIsLoading(false)
  }, [session, status, router])

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false })
      router.push("/login")
    } catch (err) {
      console.error("Signout error:", err)
      router.push("/login")
    }
  }

  // Get initials for profile badge
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader size="lg" />
        <span className="text-sm font-medium text-muted-foreground animate-pulse">
          Verifying administrative credentials...
        </span>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-muted/30">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col w-64 border-r bg-background transition-transform duration-300 md:translate-x-0 md:static md:flex",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="p-1.5 bg-primary rounded-lg text-primary-foreground">
              <GraduationCap className="size-5" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Cissikar Admin
            </span>
          </Link>
          <Button 
            variant="ghost" 
            size="icon-sm" 
            className="md:hidden text-muted-foreground"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all group outline-none",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-xs" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => setIsSidebarOpen(false)}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("size-4 shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <Badge 
                    variant={isActive ? "secondary" : "outline"} 
                    className={cn("px-1.5 py-0 rounded-md text-[10px] font-semibold", isActive ? "bg-primary-foreground/20 text-primary-foreground border-transparent" : "text-muted-foreground border-border")}
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer (Logout) */}
        <div className="p-4 border-t bg-muted/20">
          <Button
            variant="destructive"
            className="w-full justify-start gap-3 cursor-pointer text-xs h-9"
            onClick={handleLogout}
          >
            <LogOut className="size-4" />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Header Component */}
        <header className="h-16 border-b bg-background/95 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30">
          
          {/* Left: Mobile Toggle & Page context */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground -ml-2"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="size-5" />
            </Button>
            
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Admin Portal</span>
              <span>/</span>
              <span className="capitalize">
                {pathname?.split("/").filter(Boolean).pop() || "Dashboard"}
              </span>
            </div>
          </div>

          {/* Right: Actions & Profile */}
          <div className="flex items-center gap-4">
            
            {/* Quick Search */}
            <div className="relative hidden md:block w-48 lg:w-64">
              <Search className="absolute left-2.5 top-2 size-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                className="h-8 w-full rounded-lg border border-input bg-muted/20 pl-9 pr-3 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-all"
              />
            </div>

            {/* Notifications */}
            <Button variant="ghost" size="icon-sm" className="relative text-muted-foreground">
              <Bell className="size-4" />
              <span className="absolute top-1 right-1 size-2 rounded-full bg-primary" />
            </Button>

            {/* Divider */}
            <div className="h-6 w-px bg-border hidden sm:block" />

            {/* Profile Dropdown */}
            <div className="flex items-center gap-2 cursor-pointer group">
              <div className="size-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                {getInitials(adminName)}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold leading-tight text-foreground">{adminName}</span>
                <span className="text-[10px] text-muted-foreground">{adminEmail}</span>
              </div>
              <ChevronDown className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors hidden sm:block" />
            </div>

          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        {/* Footer Component */}
        <footer className="border-t bg-background py-4 px-6 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Cissikar Exams Admin Portal &copy; 2026. All rights reserved.
            </span>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
            </div>
          </div>
        </footer>

      </div>
    </div>
  )
}
