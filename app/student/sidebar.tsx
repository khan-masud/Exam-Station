"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Home,
  BookOpen,
  ShoppingCart,
  Trophy,
  TrendingUp,
  User,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Award,
  Clock,
  FolderKanban,
  X,
  Menu,
  LifeBuoy,
} from "lucide-react"
import { ThemeAndLanguageToggle } from "@/components/theme-and-language-toggle"
import { NotificationCenter } from "@/components/notification-center"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/context/app-context"
import { translate } from "@/lib/i18n"
import { useSidebar } from "@/hooks/use-sidebar"
import { useEffect, useState } from "react"

export function StudentSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { logout, user } = useAuth()
  const { isBengali } = useAppContext()
  const { isOpen, close, toggle } = useSidebar()
  const [siteName, setSiteName] = useState(translate("app_name", isBengali))

  // Fetch site settings
  useEffect(() => {
    fetch('/api/public/settings')
      .then(res => res.json())
      .then(data => {
        if (data.siteName) {
          setSiteName(data.siteName)
        }
      })
      .catch(() => {})
  }, [])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    close()
  }, [pathname, close])

  const menuItems = [
    { icon: Home, label: translate("dashboard", isBengali), href: "/student/dashboard" },
    { icon: FolderKanban, label: "Programs", href: "/student/programs" },
    { icon: ShoppingCart, label: "Browse Exams", href: "/student/browse-exams" },
    { icon: FileText, label: "Payment History", href: "/student/payments/history" },
    { icon: Clock, label: "My Results", href: "/student/results" },
    { icon: Trophy, label: "Leaderboard", href: "/student/leaderboard" },
    { icon: TrendingUp, label: "Performance", href: "/student/performance" },
    { icon: BarChart3, label: "Analytics", href: "/student/analytics" },
    { icon: Award, label: "Achievements", href: "/student/achievements" },
    { icon: LifeBuoy, label: "Support Tickets", href: "/student/support" },
    { icon: User, label: "My Profile", href: "/student/profile" },
    { icon: Settings, label: "Settings", href: "/student/settings" },
  ]

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  // Check if a menu item is active, including nested routes
  const isActive = (href: string) => {
    if (pathname === href) return true
    // Check if current path starts with href (for nested routes)
    // Special handling for exam routes to avoid conflicts
    if (href === "/student/exams" && pathname.startsWith("/student/exam/")) return true
    if (pathname.startsWith(href + '/')) return true
    return false
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-card/80 backdrop-blur"
        onClick={toggle}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        w-64 bg-card border-r border-border flex-shrink-0
        lg:block
        fixed lg:relative inset-y-0 left-0 z-40 h-screen overflow-y-auto flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      {/* Logo */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {siteName}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Student Portal</p>
        </div>
        <NotificationCenter />
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-border bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <div className="flex items-center gap-3">
          {user?.profilePicture ? (
            <img 
              src={user.profilePicture} 
              alt={user.fullName || 'Student'}
              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold">
              {user?.fullName?.charAt(0).toUpperCase() || 'S'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.fullName || 'Student'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email || ''}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link key={item.href} href={item.href}>
              <Button 
                variant={active ? "default" : "ghost"} 
                className={`w-full justify-start ${active ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : ''}`}
                size="sm"
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Theme and Language Toggle */}
      <div className="p-4 border-t border-border">
        <ThemeAndLanguageToggle />
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <Button onClick={handleLogout} variant="outline" className="w-full justify-start bg-transparent">
          <LogOut className="w-4 h-4 mr-2" />
          {translate("logout", isBengali)}
        </Button>
      </div>
    </aside>
    </>
  )
}
