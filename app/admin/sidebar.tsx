"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  HelpCircle,
  Users,
  CreditCard,
  TrendingUp,
  Settings,
  BarChart3,
  Home,
  LogOut,
  ClipboardList,
  FolderKanban,
  X,
  Menu,
  LifeBuoy,
  Palette,
  Mail,
} from "lucide-react"
import { ThemeAndLanguageToggle } from "@/components/theme-and-language-toggle"
import { NotificationCenter } from "@/components/notification-center"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/context/app-context"
import { translate } from "@/lib/i18n"
import { useSidebar } from "@/hooks/use-sidebar"
import { useEffect, useState } from "react"

export function AdminSidebar() {
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
    { icon: Home, label: translate("dashboard", isBengali), href: "/admin/dashboard" },
    { icon: FolderKanban, label: "Programs", href: "/admin/programs" },
    { icon: ClipboardList, label: "Exam Setter", href: "/admin/exam-setter" },
    { icon: BookOpen, label: translate("subjects", isBengali), href: "/admin/subjects" },
    { icon: HelpCircle, label: translate("questions", isBengali), href: "/admin/questions" },
    { icon: Users, label: translate("users", isBengali), href: "/admin/users" },
    { icon: CreditCard, label: translate("payments", isBengali), href: "/admin/payments" },
    { icon: LifeBuoy, label: "Support Tickets", href: "/admin/support" },
    { icon: Mail, label: "Newsletter", href: "/admin/newsletter" },
    { icon: Palette, label: "Theme Editor", href: "/admin/theme-editor" },
    { icon: BarChart3, label: translate("analytics", isBengali), href: "/admin/analytics" },
    { icon: TrendingUp, label: translate("reports", isBengali), href: "/admin/reports" },
    { icon: Settings, label: translate("settings", isBengali), href: "/admin/settings" },
  ]

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  // Check if a menu item is active, including nested routes
  const isActive = (href: string) => {
    if (pathname === href) return true
    // Check if current path starts with href (for nested routes)
    if (pathname.startsWith(href + '/')) return true
    return false
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden bg-card shadow-lg"
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
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-card border-r border-border h-screen overflow-y-auto flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      {/* Logo */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{siteName} Admin</h1>
        <NotificationCenter />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link key={item.href} href={item.href}>
              <Button variant={active ? "default" : "ghost"} className="w-full justify-start" size="sm">
                <Icon className="w-4 h-4 mr-2" />
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
