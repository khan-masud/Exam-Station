"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { 
  LogOut, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Shield, 
  ShieldOff, 
  Eye,
  Trophy,
  Award,
  Target,
  Clock,
  CheckCircle,
  TrendingUp,
  BookOpen,
  Calendar,
  RefreshCw,
  Image,
  DollarSign,
  FileText,
  Lock,
  BarChart3,
  PieChart,
  Download,
  AlertCircle,
  Zap,
  Upload
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface User {
  id: string
  full_name: string
  email: string
  phone?: string
  profile_picture?: string
  role: "admin" | "student" | "proctor" | "teacher"
  status: "active" | "inactive"
  is_verified?: boolean
  created_at: string
  is_blocked?: boolean
  blocked_until?: string
  last_login_at?: string
  last_login_ip?: string
  notification_preference?: "all" | "important" | "none"
  max_attempts?: number
  time_limit_hours?: number
  admin_notes?: string
}

interface BlockInfo {
  id: string
  user_id: string
  user_name: string
  user_email: string
  user_role: string
  reason: string
  blocked_by_name: string
  blocked_at: string
  expires_at: string | null
  is_permanent: boolean
  unblocked_at?: string
}

interface UserStats {
  totalExams: number
  completedExams: number
  averageScore: number
  totalPoints: number
  rank: number
  joinedDate: string
  lastActive: string
  achievements: number
  studyStreak: number
}

interface ProgramStats {
  programId: string
  programName: string
  enrolledDate: string
  completedExams: number
  totalExams: number
  averageScore: number
  status: "active" | "completed" | "dropped"
}

interface TransactionHistory {
  id: string
  type: "enrollment" | "payment" | "refund" | "adjustment"
  description: string
  amount?: number
  date: string
  status: "completed" | "pending" | "failed" | "approved"
  referenceId?: string
  proofImage?: string | null
}

export default function UsersPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [userRole, setUserRole] = useState("all")
  const [showModal, setShowModal] = useState(false)
  const [showBlockDialog, setShowBlockDialog] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [blockingUser, setBlockingUser] = useState<User | null>(null)
  const [viewingUser, setViewingUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [blocks, setBlocks] = useState<BlockInfo[]>([])
  const [userBlockingHistory, setUserBlockingHistory] = useState<BlockInfo[]>([])
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [programStats, setProgramStats] = useState<ProgramStats[]>([])
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistory[]>([])
  const [showPaymentProofDialog, setShowPaymentProofDialog] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionHistory | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    phone: "",
    password: "",
    newPassword: "",
    confirmPassword: "",
    profile_picture: "",
    role: "student" as const,
    is_verified: false,
    notification_preference: "all" as const,
    max_attempts: null as number | null,
    time_limit_hours: null as number | null,
    admin_notes: ""
  })
  const [blockFormData, setBlockFormData] = useState({
    reason: "",
    duration: 24,
    isPermanent: false
  })

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers()
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    fetchUsers()
    fetchBlocks()
  }, [userRole, currentPage, pageSize])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (userRole !== 'all') {
        params.append('role', userRole)
      }
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      params.append('page', currentPage.toString())
      params.append('limit', pageSize.toString())

      const response = await fetch(`/api/users?${params.toString()}`, {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        // Convert numeric boolean values (0/1) to actual booleans
        const convertedUsers = (data.users || []).map((u: any) => ({
          ...u,
          is_blocked: Boolean(u.is_blocked),
          is_verified: u.is_verified !== undefined ? Boolean(u.is_verified) : u.is_verified
        }))
        setUsers(convertedUsers)
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages)
          setTotalUsers(data.pagination.total)
        }
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
    }
    setLoading(false)
  }

  const fetchBlocks = async () => {
    try {
      const response = await fetch('/api/admin/blocks', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        // Convert numeric boolean values (0/1) to actual booleans
        const convertedBlocks = (data.blocks || []).map((b: any) => ({
          ...b,
          is_permanent: Boolean(b.is_permanent)
        }))
        setBlocks(convertedBlocks)
      }
    } catch (error) {
      console.error('Error fetching blocks:', error)
    }
  }

  const fetchUserStats = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/stats`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setUserStats(data)
      } else {
        toast.error('Failed to load user statistics')
      }
    } catch (error) {
      console.error('Error fetching user stats:', error)
      toast.error('Failed to load user statistics')
    }
  }

  const fetchProgramStats = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/program-stats`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Program stats fetched:', data)
        setProgramStats(data.programs || [])
      } else {
        const error = await response.text()
        console.error('Program stats error response:', response.status, error)
        setProgramStats([])
      }
    } catch (error) {
      console.error('Error fetching program stats:', error)
      setProgramStats([])
    }
  }

  const fetchTransactionHistory = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/transactions`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Transaction history fetched:', data)
        setTransactionHistory(data.transactions || [])
      } else {
        const error = await response.text()
        console.error('Transaction history error response:', response.status, error)
        setTransactionHistory([])
      }
    } catch (error) {
      console.error('Error fetching transaction history:', error)
      setTransactionHistory([])
    }
  }

  const fetchUserBlockingHistory = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/blocks?userId=${userId}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUserBlockingHistory(data.blocks || [])
      } else {
        setUserBlockingHistory([])
      }
    } catch (error) {
      console.error('Error fetching user blocking history:', error)
      setUserBlockingHistory([])
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchUsers(), fetchBlocks()])
    setRefreshing(false)
  }

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleOpenModal = (editUser?: User) => {
    if (editUser) {
      setEditingUser(editUser)
      setFormData({ 
        name: editUser.full_name, 
        email: editUser.email,
        phone: editUser.phone || "",
        password: "",
        newPassword: "",
        confirmPassword: "",
        profile_picture: editUser.profile_picture || "",
        role: editUser.role as any,
        is_verified: editUser.is_verified || false,
        notification_preference: (editUser.notification_preference || "all") as "all",
        max_attempts: editUser.max_attempts || null,
        time_limit_hours: editUser.time_limit_hours || null,
        admin_notes: editUser.admin_notes || ""
      })
    } else {
      setEditingUser(null)
      setFormData({ 
        name: "", 
        email: "", 
        phone: "",
        password: "", 
        newPassword: "",
        confirmPassword: "",
        profile_picture: "",
        role: "student",
        is_verified: false,
        notification_preference: "all",
        max_attempts: null,
        time_limit_hours: null,
        admin_notes: ""
      })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUser(null)
    setFormData({ 
      name: "", 
      email: "", 
      phone: "",
      password: "", 
      newPassword: "",
      confirmPassword: "",
      profile_picture: "",
      role: "student",
      is_verified: false,
      notification_preference: "all",
      max_attempts: null,
      time_limit_hours: null,
      admin_notes: ""
    })
  }

  const handleOpenBlockDialog = (user: User) => {
    setBlockingUser(user)
    setBlockFormData({ reason: "", duration: 24, isPermanent: false })
    setShowBlockDialog(true)
  }

  const handleOpenProfileDialog = async (user: User) => {
    setViewingUser(user)
    setShowProfileDialog(true)
    await Promise.all([
      fetchUserStats(user.id),
      fetchProgramStats(user.id),
      fetchTransactionHistory(user.id),
      fetchUserBlockingHistory(user.id)
    ])
  }

  const handleBlockUser = async () => {
    if (!blockingUser || !blockFormData.reason) {
      toast.error("Please provide a reason for blocking")
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: blockingUser.id,
          reason: blockFormData.reason,
          duration: blockFormData.isPermanent ? null : blockFormData.duration,
          isPermanent: blockFormData.isPermanent
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success("User blocked successfully")
        setShowBlockDialog(false)
        setBlockingUser(null)
        await fetchUsers()
        await fetchBlocks()
        
        // Update the viewing user if profile dialog is open
        if (viewingUser && viewingUser.id === blockingUser.id) {
          setViewingUser({
            ...viewingUser,
            is_blocked: true,
            blocked_until: data.blocked_until || null
          })
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to block user')
      }
    } catch (error) {
      console.error('Error blocking user:', error)
      toast.error('Failed to block user')
    } finally {
      setSaving(false)
    }
  }

  const handleUnblockUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/blocks?userId=${userId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })

      if (response.ok) {
        console.log('Unblock response:', response)
        const data = await response.json()
        console.log('Unblock data:', data)
        
        // Wait a moment then refresh
        await new Promise(resolve => setTimeout(resolve, 300))
        
        toast.success("User unblocked successfully")
        
        // Force refresh users list
        await fetchUsers()
        await fetchBlocks()
        
        // Update the viewing user if profile dialog is open
        if (viewingUser && viewingUser.id === userId) {
          setViewingUser({
            ...viewingUser,
            is_blocked: false,
            blocked_until: undefined
          })
        }
      } else {
        const error = await response.json()
        console.error('Unblock error response:', error)
        toast.error(error.error || 'Failed to unblock user')
      }
    } catch (error) {
      console.error('Error unblocking user:', error)
      toast.error('Failed to unblock user')
    }
  }

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email) {
      toast.error("Please fill in all fields")
      return
    }

    if (!editingUser && !formData.password) {
      toast.error("Password is required for new users")
      return
    }

    // Validate password change if editing user
    if (editingUser && formData.newPassword) {
      if (formData.newPassword.length < 8) {
        toast.error("Password must be at least 8 characters")
        return
      }
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error("Passwords do not match")
        return
      }
    }

    setSaving(true)
    try {
      if (editingUser) {
        const updatePayload: any = {
          id: editingUser.id,
          full_name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          profile_picture: formData.profile_picture || null,
          role: formData.role,
          is_verified: formData.is_verified,
          notification_preference: formData.notification_preference,
          max_attempts: formData.max_attempts,
          time_limit_hours: formData.time_limit_hours,
          admin_notes: formData.admin_notes || null
        }

        // Include password change if provided
        if (formData.newPassword) {
          updatePayload.new_password = formData.newPassword
        }

        const response = await fetch(`/api/users`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updatePayload)
        })

        if (response.ok) {
          await fetchUsers()
          handleCloseModal()
          toast.success("User updated successfully")
        } else {
          const error = await response.json()
          toast.error(error.error || 'Failed to update user')
        }
      } else {
        const response = await fetch(`/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            full_name: formData.name,
            email: formData.email,
            phone: formData.phone || null,
            profile_picture: formData.profile_picture || null,
            password: formData.password,
            role: formData.role,
            organization_id: user?.organizationId || null,
            is_verified: formData.is_verified,
            notification_preference: formData.notification_preference,
            max_attempts: formData.max_attempts,
            time_limit_hours: formData.time_limit_hours,
            admin_notes: formData.admin_notes || null
          })
        })

        if (response.ok) {
          await fetchUsers()
          handleCloseModal()
          toast.success("User created successfully")
        } else {
          const error = await response.json()
          toast.error(error.error || 'Failed to create user')
        }
      }
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error('Failed to save user')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteUser = async (id: string) => {
    if (confirm("Are you sure you want to delete this user?")) {
      try {
        const response = await fetch(`/api/users?id=${id}`, {
          method: 'DELETE',
          credentials: 'include'
        })

        if (response.ok) {
          await fetchUsers()
          toast.success("User deleted successfully")
        } else {
          const error = await response.json()
          toast.error(error.error || 'Failed to delete user')
        }
      } catch (error) {
        console.error('Error deleting user:', error)
        toast.error('Failed to delete user')
      }
    }
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      student: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      proctor: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      teacher: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    }
    return colors[role] || "bg-gray-100 text-gray-800"
  }

  const getTimeRemaining = (expiresAt: string | null, isPermanent: boolean) => {
    if (isPermanent || !expiresAt) return "Permanent"
    
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()
    
    if (diff <= 0) return "Expired"
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''}`
    return `${hours} hour${hours > 1 ? 's' : ''}`
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-card to-background p-6 pt-20 lg:pt-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-2">Manage users, view profiles, and control access</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRefresh} variant="outline" size="lg" disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleLogout} variant="outline" size="lg">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Link href="/admin/dashboard" className="text-primary hover:underline text-sm mb-6 inline-block">
          ← Back to Dashboard
        </Link>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">All Users</TabsTrigger>
            <TabsTrigger value="blocked">Blocked Users ({blocks.length})</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Controls */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      fetchUsers()
                    }
                  }}
                  className="pl-10"
                />
              </div>
              <Button onClick={fetchUsers} variant="outline">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value)}
                className="px-4 py-2 border border-border rounded-lg bg-background"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="student">Student</option>
                <option value="proctor">Proctor</option>
                <option value="teacher">Teacher</option>
              </select>
              <Button onClick={() => handleOpenModal()}>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>

            {/* Users Table */}
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr className="border-b">
                        <th className="px-6 py-3 text-left text-sm font-semibold">User</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Last Login</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Joined</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                {u.profile_picture ? (
                                  <img 
                                    src={u.profile_picture} 
                                    alt={u.full_name}
                                    className="w-full h-full object-cover rounded-full"
                                  />
                                ) : (
                                  <AvatarFallback className="bg-linear-to-r from-blue-600 to-purple-600 text-white">
                                    {(u.full_name || 'U').charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                              <div>
                                <div className="font-medium">{u.full_name}</div>
                                <>
                                  {u.is_blocked ? (
                                    <Badge variant="destructive" className="text-xs mt-1">
                                      <Shield className="w-3 h-3 mr-1" />
                                      Blocked
                                    </Badge>
                                  ) : null}
                                </>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{u.email}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(u.role)}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={u.status === "active" ? "text-green-600 font-semibold" : "text-gray-500"}>
                              {u.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenProfileDialog(u)}
                                title="View Profile"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenModal(u)}
                                title="Edit User"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              {u.role !== 'admin' && (
                                <>
                                  {u.is_blocked ? (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleUnblockUser(u.id)}
                                      title="Unblock User"
                                      className="text-green-600"
                                    >
                                      <ShieldOff className="w-4 h-4" />
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleOpenBlockDialog(u)}
                                      title="Block User"
                                      className="text-orange-600"
                                    >
                                      <Shield className="w-4 h-4" />
                                    </Button>
                                  )}
                                </>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteUser(u.id)}
                                title="Delete User"
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {users.length === 0 && !loading && (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">No users found</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalUsers > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers} users
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="px-3 py-1 border border-border rounded bg-background text-sm"
                  >
                    <option value="10">10 per page</option>
                    <option value="20">20 per page</option>
                    <option value="50">50 per page</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="px-3 py-1 text-sm flex items-center">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Blocked Users Tab - CONTINUED IN NEXT PART */}

          {/* Blocked Users Tab */}
          <TabsContent value="blocked" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Currently Blocked Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                {blocks.length === 0 ? (
                  <div className="py-12 text-center">
                    <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                    <p className="text-lg font-semibold">No Blocked Users</p>
                    <p className="text-sm text-muted-foreground mt-2">All users have access to the system</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Reason</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Blocked By</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Blocked At</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Expires In</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {blocks.map((block) => (
                          <tr key={block.id} className="border-b hover:bg-muted/50">
                            <td className="px-4 py-3">
                              <div className="font-medium">{block.user_name}</div>
                              <div className="text-xs text-muted-foreground">{block.user_email}</div>
                            </td>
                            <td className="px-4 py-3">
                              <Badge className={getRoleColor(block.user_role)}>
                                {block.user_role}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 max-w-xs">
                              <p className="text-sm truncate" title={block.reason}>
                                {block.reason}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-sm">{block.blocked_by_name}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {new Date(block.blocked_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3">
                              <Badge variant={block.is_permanent ? "destructive" : "secondary"}>
                                {getTimeRemaining(block.expires_at, block.is_permanent)}
                              </Badge>
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUnblockUser(block.user_id)}
                              >
                                <ShieldOff className="w-4 h-4 mr-1" />
                                Unblock
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add/Edit User Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-background z-10">
                <h2 className="text-xl font-bold">{editingUser ? "Edit User" : "Add User"}</h2>
                <button onClick={handleCloseModal} className="p-1 hover:bg-muted rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <CardContent className="p-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="restrictions">Restrictions</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                  </TabsList>

                  {/* Basic Info Tab */}
                  <TabsContent value="basic" className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Full Name *</label>
                      <Input
                        placeholder="Enter full name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Email *</label>
                      <Input
                        placeholder="Enter email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Phone Number</label>
                      <Input
                        placeholder="Enter phone number"
                        type="tel"
                        value={formData.phone || ""}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Profile Picture URL</label>
                      <Input
                        placeholder="Enter profile picture URL"
                        type="url"
                        value={formData.profile_picture || ""}
                        onChange={(e) => setFormData({ ...formData, profile_picture: e.target.value })}
                      />
                      {formData.profile_picture && (
                        <div className="mt-2 p-2 border rounded-lg bg-muted">
                          <img 
                            src={formData.profile_picture} 
                            alt="Profile preview" 
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {!editingUser && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Password *</label>
                        <Input
                          placeholder="Enter password"
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Role *</label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                      >
                        <option value="student">Student</option>
                        <option value="proctor">Proctor</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox
                        id="verified"
                        checked={formData.is_verified}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, is_verified: checked as boolean })
                        }
                      />
                      <label htmlFor="verified" className="text-sm font-medium cursor-pointer">
                        Email Verified
                      </label>
                    </div>
                  </TabsContent>

                  {/* Settings Tab */}
                  <TabsContent value="settings" className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Notification Preference</label>
                      <select
                        value={formData.notification_preference || "all"}
                        onChange={(e) => setFormData({ ...formData, notification_preference: e.target.value as any })}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                      >
                        <option value="all">All Notifications</option>
                        <option value="important">Important Only</option>
                        <option value="none">No Notifications</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Admin Notes</label>
                      <Textarea
                        placeholder="Add any notes about this user (internal use only)..."
                        value={formData.admin_notes || ""}
                        onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">
                        Use the Restrictions tab to set activity limits and exam attempt controls.
                      </p>
                    </div>
                  </TabsContent>

                  {/* Restrictions Tab */}
                  <TabsContent value="restrictions" className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Maximum Exam Attempts per Exam</label>
                      <Input
                        placeholder="Leave empty for unlimited"
                        type="number"
                        min="1"
                        max="100"
                        value={formData.max_attempts || ""}
                        onChange={(e) => setFormData({ ...formData, max_attempts: e.target.value ? Number(e.target.value) : null })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Limits how many times a student can attempt each exam (0 = unlimited)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Daily Time Limit (Hours)</label>
                      <Input
                        placeholder="Leave empty for unlimited"
                        type="number"
                        min="1"
                        max="24"
                        value={formData.time_limit_hours || ""}
                        onChange={(e) => setFormData({ ...formData, time_limit_hours: e.target.value ? Number(e.target.value) : null })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Maximum hours per day this user can spend taking exams
                      </p>
                    </div>

                    <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">
                        These restrictions help manage exam load and prevent abuse. Leave empty for no restrictions.
                      </p>
                    </div>
                  </TabsContent>

                  {/* Security Tab */}
                  <TabsContent value="security" className="space-y-4">
                    {editingUser && (
                      <>
                        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <Lock className="w-3 h-3" />
                            Leave all fields empty to keep current password unchanged
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">New Password</label>
                          <Input
                            placeholder="Leave empty to keep current password"
                            type="password"
                            value={formData.newPassword || ""}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                          />
                          <p className="text-xs text-muted-foreground">
                            Minimum 8 characters with uppercase, lowercase, and numbers
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Confirm Password</label>
                          <Input
                            placeholder="Re-enter new password"
                            type="password"
                            value={formData.confirmPassword || ""}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          />
                        </div>

                        {formData.newPassword && formData.newPassword !== formData.confirmPassword && (
                          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-3">
                            <p className="text-xs text-red-600 dark:text-red-400">
                              Passwords do not match
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {!editingUser && (
                      <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                        <p className="text-xs text-muted-foreground">
                          For new users, set the password in the Basic Info tab
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="flex gap-2 pt-6 border-t mt-6">
                  <Button variant="outline" onClick={handleCloseModal} className="flex-1" disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveUser} className="flex-1" disabled={saving}>
                    {saving ? "Saving..." : editingUser ? "Update" : "Add"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Block User Dialog */}
        <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-orange-600" />
                Block User: {blockingUser?.full_name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Reason for Blocking</label>
                <Textarea
                  placeholder="Enter the reason for blocking this user..."
                  value={blockFormData.reason}
                  onChange={(e) => setBlockFormData({ ...blockFormData, reason: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="permanent"
                  checked={blockFormData.isPermanent}
                  onCheckedChange={(checked) => 
                    setBlockFormData({ ...blockFormData, isPermanent: checked as boolean })
                  }
                />
                <label htmlFor="permanent" className="text-sm font-medium">
                  Permanent Block
                </label>
              </div>

              {!blockFormData.isPermanent && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration</label>
                  <Select
                    value={blockFormData.duration.toString()}
                    onValueChange={(value) => 
                      setBlockFormData({ ...blockFormData, duration: Number(value) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="6">6 hours</SelectItem>
                      <SelectItem value="12">12 hours</SelectItem>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="72">3 days</SelectItem>
                      <SelectItem value="168">1 week</SelectItem>
                      <SelectItem value="720">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowBlockDialog(false)}
                  className="flex-1"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBlockUser}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  disabled={saving}
                >
                  {saving ? "Blocking..." : "Block User"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* User Profile Dialog */}
        <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Avatar className="h-16 w-16">
                  {viewingUser?.profile_picture ? (
                    <img 
                      src={viewingUser.profile_picture} 
                      alt={viewingUser.full_name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <AvatarFallback className="bg-linear-to-r from-blue-600 to-purple-600 text-white text-lg">
                      {(viewingUser?.full_name || 'U').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <div className="text-xl">{viewingUser?.full_name}</div>
                  <div className="text-sm text-muted-foreground font-normal">{viewingUser?.email}</div>
                  {viewingUser?.phone && (
                    <div className="text-xs text-muted-foreground">{viewingUser.phone}</div>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>

            {viewingUser && userStats && (
              <div className="space-y-6 py-4">
                {/* User Profile Info Card */}
                <Card className="border-2 border-blue-200 dark:border-blue-800 bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex items-center gap-6">
                        <Avatar className="h-24 w-24 border-4 border-white dark:border-slate-900 shadow-lg">
                          {viewingUser.profile_picture ? (
                            <img 
                              src={viewingUser.profile_picture} 
                              alt={viewingUser.full_name}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            <AvatarFallback className="bg-linear-to-r from-blue-600 to-purple-600 text-white text-2xl font-bold">
                              {(viewingUser.full_name || 'U').charAt(0).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="space-y-3">
                          <div>
                            <h2 className="text-2xl font-bold text-foreground">{viewingUser.full_name}</h2>
                            <p className="text-sm text-muted-foreground">{viewingUser.email}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className="bg-blue-600">{viewingUser.role}</Badge>
                            <Badge variant={viewingUser.status === 'active' ? 'default' : 'secondary'}>
                              {viewingUser.status}
                            </Badge>
                            {viewingUser.is_verified && (
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                ✓ Verified
                              </Badge>
                            )}
                            {viewingUser.is_blocked && (
                              <Badge variant="destructive">
                                🔒 Blocked
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-2">
                        <div>
                          <p className="text-3xl font-bold text-purple-600">#{userStats.rank}</p>
                          <p className="text-xs text-muted-foreground">Rank</p>
                        </div>
                        <div className="pt-2">
                          <p className="text-2xl font-bold text-green-600">{userStats.averageScore}%</p>
                          <p className="text-xs text-muted-foreground">Avg Score</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="programs">Programs</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-6">
                    {/* Quick Stats - Enhanced */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                              <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{userStats.totalExams}</p>
                              <p className="text-xs text-muted-foreground">Total Exams</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{userStats.completedExams}</p>
                              <p className="text-xs text-muted-foreground">Completed</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                              <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{userStats.totalPoints}</p>
                              <p className="text-xs text-muted-foreground">Total Points</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                              <Award className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{userStats.achievements}</p>
                              <p className="text-xs text-muted-foreground">Achievements</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                              <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{userStats.studyStreak}</p>
                              <p className="text-xs text-muted-foreground">Day Streak</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Performance Overview */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          Performance Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Completion Rate</span>
                            <span className="font-semibold">
                              {userStats.totalExams > 0 
                                ? Math.round((userStats.completedExams / userStats.totalExams) * 100)
                                : 0}%
                            </span>
                          </div>
                          <Progress 
                            value={userStats.totalExams > 0 
                              ? (userStats.completedExams / userStats.totalExams) * 100 
                              : 0} 
                            className="h-2"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>Average Score</span>
                            <span className="font-semibold">{userStats.averageScore}%</span>
                          </div>
                          <Progress value={userStats.averageScore} className="h-2" />
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                              <Award className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                              <p className="text-lg font-bold">{userStats.achievements}</p>
                              <p className="text-xs text-muted-foreground">Achievements</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                              <Target className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                              <p className="text-lg font-bold">{userStats.studyStreak}</p>
                              <p className="text-xs text-muted-foreground">Day Streak</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                              <Trophy className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-lg font-bold">{userStats.totalPoints}</p>
                              <p className="text-xs text-muted-foreground">Total Points</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
                              <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">
                                {new Date(userStats.joinedDate).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-muted-foreground">Joined Date</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Activity Tab */}
                  <TabsContent value="activity" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Last Active</p>
                              <p className="text-sm font-semibold">
                                {new Date(userStats.lastActive).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                              <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Member Since</p>
                              <p className="text-sm font-semibold">
                                {new Date(userStats.joinedDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {viewingUser.last_login_at && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                            Login Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Last Login:</span>
                            <span className="font-semibold">{new Date(viewingUser.last_login_at).toLocaleString()}</span>
                          </div>
                          {viewingUser.last_login_ip && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Last IP:</span>
                              <span className="font-mono text-xs">{viewingUser.last_login_ip}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {viewingUser.is_blocked && (
                      <Card className="border-red-200 dark:border-red-800">
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2 text-red-600">
                            <Shield className="w-4 h-4" />
                            User Blocked
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Blocked Until:</span>
                            <span className="font-semibold">
                              {viewingUser.blocked_until 
                                ? new Date(viewingUser.blocked_until).toLocaleString()
                                : "Permanent"}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="details" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Account Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">User ID:</span>
                          <span className="font-mono text-xs">{viewingUser.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Role:</span>
                          <Badge variant="outline" className="capitalize">{viewingUser.role}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={viewingUser.status === "active" ? "default" : "secondary"} className="capitalize">
                            {viewingUser.status}
                          </Badge>
                        </div>
                        {viewingUser.is_verified !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Verified:</span>
                            <Badge variant={viewingUser.is_verified ? "default" : "secondary"}>
                              {viewingUser.is_verified ? "Yes" : "No"}
                            </Badge>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created:</span>
                          <span>{new Date(viewingUser.created_at).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {(viewingUser.phone || viewingUser.notification_preference || viewingUser.max_attempts !== null || viewingUser.time_limit_hours !== null) && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            User Settings
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          {viewingUser.phone && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Phone:</span>
                              <span>{viewingUser.phone}</span>
                            </div>
                          )}
                          {viewingUser.notification_preference && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Notifications:</span>
                              <Badge variant="outline" className="capitalize">{viewingUser.notification_preference}</Badge>
                            </div>
                          )}
                          {viewingUser.max_attempts !== null && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Max Attempts:</span>
                              <span>{viewingUser.max_attempts === 0 ? "Unlimited" : viewingUser.max_attempts}</span>
                            </div>
                          )}
                          {viewingUser.time_limit_hours !== null && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Daily Time Limit:</span>
                              <span>{viewingUser.time_limit_hours} hours</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {viewingUser.admin_notes && (
                      <Card className="bg-blue-50 dark:bg-blue-950">
                        <CardHeader>
                          <CardTitle className="text-sm">Admin Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm whitespace-pre-wrap">{viewingUser.admin_notes}</p>
                        </CardContent>
                      </Card>
                    )}

                    {/* Blocking History */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Blocking History
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {userBlockingHistory && userBlockingHistory.length > 0 ? (
                          <div className="space-y-3">
                            {userBlockingHistory.map((block, idx) => (
                              <div key={idx} className="border rounded-lg p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Badge variant={block.is_permanent ? "destructive" : "secondary"}>
                                      {block.is_permanent ? "Permanent" : "Temporary"}
                                    </Badge>
                                    {block.expires_at && !block.is_permanent && (
                                      <span className="text-xs text-muted-foreground">
                                        Expires: {new Date(block.expires_at).toLocaleDateString()} {new Date(block.expires_at).toLocaleTimeString()}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(block.blocked_at).toLocaleDateString()}
                                  </span>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground">Reason:</p>
                                  <p className="text-sm">{block.reason || "No reason provided"}</p>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    Blocked by: <strong>{block.blocked_by_name || "System"}</strong>
                                  </span>
                                  {!block.is_permanent && block.expires_at && (
                                    <span className="text-orange-600">
                                      Expires: {new Date(block.expires_at).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No blocking history</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Programs Tab */}
                  <TabsContent value="programs" className="space-y-4">
                    {programStats && programStats.length > 0 ? (
                      <div className="space-y-4">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <Card>
                            <CardContent className="p-3">
                              <div className="text-xs text-muted-foreground">Total Programs</div>
                              <div className="text-2xl font-bold">{programStats.length}</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-3">
                              <div className="text-xs text-muted-foreground">Active</div>
                              <div className="text-2xl font-bold text-blue-600">{programStats.filter(p => p.status === 'active').length}</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-3">
                              <div className="text-xs text-muted-foreground">Total Exams</div>
                              <div className="text-2xl font-bold">{programStats.reduce((sum, p) => sum + (p.totalExams || 0), 0)}</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-3">
                              <div className="text-xs text-muted-foreground">Avg Score</div>
                              <div className="text-2xl font-bold text-green-600">{(programStats.reduce((sum, p) => sum + (p.averageScore || 0), 0) / programStats.length).toFixed(1)}%</div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Analytics Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Performance Chart */}
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />
                                Performance by Program
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={programStats.map(p => ({
                                  name: p.programName.substring(0, 10),
                                  score: p.averageScore,
                                  completed: p.completedExams,
                                  total: p.totalExams
                                }))}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" fontSize={12} />
                                  <YAxis fontSize={12} />
                                  <Tooltip formatter={(value) => typeof value === 'number' ? value.toFixed(1) : value} />
                                  <Bar dataKey="score" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>

                          {/* Status Distribution */}
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <PieChart className="w-4 h-4" />
                                Program Status
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ResponsiveContainer width="100%" height={250}>
                                <RechartsPie
                                  data={[
                                    { name: 'Active', value: programStats.filter(p => p.status === 'active').length, color: '#3b82f6' },
                                    { name: 'Completed', value: programStats.filter(p => p.status === 'completed').length, color: '#10b981' },
                                    { name: 'Dropped', value: programStats.filter(p => p.status === 'dropped').length, color: '#ef4444' }
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={90}
                                  dataKey="value"
                                >
                                  {[
                                    { name: 'Active', value: programStats.filter(p => p.status === 'active').length, color: '#3b82f6' },
                                    { name: 'Completed', value: programStats.filter(p => p.status === 'completed').length, color: '#10b981' },
                                    { name: 'Dropped', value: programStats.filter(p => p.status === 'dropped').length, color: '#ef4444' }
                                  ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </RechartsPie>
                              </ResponsiveContainer>
                              <div className="flex gap-4 justify-center text-xs mt-4">
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                  <span>Active: {programStats.filter(p => p.status === 'active').length}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded-full bg-green-600"></div>
                                  <span>Completed: {programStats.filter(p => p.status === 'completed').length}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                  <span>Dropped: {programStats.filter(p => p.status === 'dropped').length}</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Completion Progress Chart */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              Exam Completion Progress
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                              <LineChart data={programStats.map(p => ({
                                name: p.programName.substring(0, 15),
                                completed: p.completedExams,
                                pending: p.totalExams - p.completedExams,
                                total: p.totalExams
                              }))}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={12} />
                                <YAxis fontSize={12} />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} name="Completed" />
                                <Line type="monotone" dataKey="pending" stroke="#f59e0b" strokeWidth={2} name="Pending" />
                              </LineChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        {/* Detailed Programs */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-semibold">Program Details & Rankings</h3>
                          {programStats.map((program, idx) => {
                            const rank = Math.floor(program.averageScore / 20) + 1;
                            const rankLabels = ['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];
                            const rankColors = ['bg-red-100 text-red-800', 'bg-orange-100 text-orange-800', 'bg-yellow-100 text-yellow-800', 'bg-blue-100 text-blue-800', 'bg-green-100 text-green-800'];
                            
                            return (
                              <Card key={program.programId} className="overflow-hidden hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3 bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <div className="text-lg font-bold text-muted-foreground">#{idx + 1}</div>
                                        <CardTitle className="text-base">{program.programName}</CardTitle>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Badge variant={program.status === "active" ? "default" : program.status === "completed" ? "secondary" : "outline"} className="whitespace-nowrap">
                                        {program.status === 'active' && '🟢 Active'}
                                        {program.status === 'completed' && '✓ Completed'}
                                        {program.status === 'dropped' && '⊘ Dropped'}
                                      </Badge>
                                      <Badge className={`${rankColors[Math.min(rank - 1, rankColors.length - 1)]} border-0 font-semibold`}>
                                        {rankLabels[Math.min(rank - 1, rankLabels.length - 1)]}
                                      </Badge>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4">
                                  {/* Performance Gauge */}
                                  <div className="bg-linear-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <Trophy className="w-5 h-5 text-amber-500" />
                                        <span className="font-semibold">Performance Score</span>
                                      </div>
                                      <span className="text-2xl font-bold text-blue-600">{program.averageScore.toFixed(1)}%</span>
                                    </div>
                                    <Progress value={program.averageScore} className="h-3" />
                                    <div className="text-xs text-muted-foreground mt-2">
                                      {program.averageScore >= 80 ? '🌟 Excellent - Outstanding performance!' : 
                                       program.averageScore >= 70 ? '⭐ Good - Well done!' :
                                       program.averageScore >= 60 ? '📈 Fair - Keep improving' : 
                                       '⚠️ Below Average - Needs focus'}
                                    </div>
                                  </div>

                                  {/* Enrollment Details */}
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                      <div className="text-xs text-muted-foreground">Enrollment Date</div>
                                      <div className="font-semibold flex items-center gap-1">
                                        <Calendar className="w-4 h-4" />
                                        {new Date(program.enrolledDate).toLocaleDateString()}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-muted-foreground">Duration</div>
                                      <div className="font-semibold flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {Math.floor((Date.now() - new Date(program.enrolledDate).getTime()) / (1000 * 60 * 60 * 24))} days
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-muted-foreground">Completion Rate</div>
                                      <div className="font-semibold flex items-center gap-1">
                                        <Zap className="w-4 h-4" />
                                        {program.totalExams > 0 ? Math.round((program.completedExams / program.totalExams) * 100) : 0}%
                                      </div>
                                    </div>
                                  </div>

                                  {/* Exam Analytics */}
                                  <div className="grid grid-cols-3 gap-3">
                                    <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                                      <CardContent className="p-3 text-center">
                                        <div className="text-2xl font-bold text-green-600">{program.completedExams}</div>
                                        <div className="text-xs text-muted-foreground">Completed</div>
                                      </CardContent>
                                    </Card>
                                    <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                                      <CardContent className="p-3 text-center">
                                        <div className="text-2xl font-bold text-amber-600">{program.totalExams - program.completedExams}</div>
                                        <div className="text-xs text-muted-foreground">Pending</div>
                                      </CardContent>
                                    </Card>
                                    <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                                      <CardContent className="p-3 text-center">
                                        <div className="text-2xl font-bold text-blue-600">{program.totalExams}</div>
                                        <div className="text-xs text-muted-foreground">Total</div>
                                      </CardContent>
                                    </Card>
                                  </div>

                                  {/* Exam Progress Bar */}
                                  <div>
                                    <div className="flex justify-between text-sm mb-2">
                                      <span className="flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                        Exam Progress
                                      </span>
                                      <span className="font-bold">{program.completedExams}/{program.totalExams}</span>
                                    </div>
                                    <Progress 
                                      value={program.totalExams > 0 ? (program.completedExams / program.totalExams) * 100 : 0} 
                                      className="h-2.5"
                                    />
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <BookOpen className="w-16 h-16 mx-auto mb-3 opacity-30" />
                        <p className="text-base font-medium">No Program Enrollments</p>
                        <p className="text-sm mt-1">This user has not enrolled in any programs yet</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Transactions Tab */}
                  <TabsContent value="transactions" className="space-y-4">
                    {transactionHistory && transactionHistory.length > 0 ? (
                      <div className="space-y-4">
                        {/* Transaction Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <Card>
                            <CardContent className="p-3">
                              <div className="text-xs text-muted-foreground">Total Transactions</div>
                              <div className="text-2xl font-bold">{transactionHistory.length}</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-3">
                              <div className="text-xs text-muted-foreground">Total Amount</div>
                              <div className="text-2xl font-bold text-green-600">
                                ${(transactionHistory.reduce((sum, t) => sum + ((t.amount && parseFloat(String(t.amount))) || 0), 0)).toFixed(2)}
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-3">
                              <div className="text-xs text-muted-foreground">Completed</div>
                              <div className="text-2xl font-bold text-blue-600">
                                {transactionHistory.filter(t => t.status === 'completed' || t.status === 'approved').length}
                              </div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-3">
                              <div className="text-xs text-muted-foreground">Pending</div>
                              <div className="text-2xl font-bold text-amber-600">
                                {transactionHistory.filter(t => t.status === 'pending').length}
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Transactions List */}
                        <div className="space-y-2">
                          {transactionHistory.map((transaction, idx) => (
                            <Card key={transaction.id} className="overflow-hidden hover:shadow-md transition-all hover:border-primary/50">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div className="flex gap-4 items-start">
                                    {/* Icon */}
                                    <div className={`p-2.5 rounded-lg shrink-0 ${
                                      transaction.type === "payment" ? "bg-green-100 dark:bg-green-900" :
                                      transaction.type === "enrollment" ? "bg-blue-100 dark:bg-blue-900" :
                                      "bg-gray-100 dark:bg-gray-800"
                                    }`}>
                                      {transaction.type === "payment" ? (
                                        <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                                      ) : transaction.type === "refund" ? (
                                        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                                      ) : transaction.type === "enrollment" ? (
                                        <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                      ) : (
                                        <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                      )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2 mb-1">
                                        <div className="flex-1">
                                          <p className="font-semibold text-sm capitalize">
                                            {transaction.type === 'payment' ? '💳 Payment Transaction' :
                                             transaction.type === 'enrollment' ? '📚 Program Enrollment' :
                                             transaction.type === 'refund' ? '↩️ Refund' :
                                             '📄 Transaction'}
                                          </p>
                                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{transaction.description}</p>
                                        </div>
                                        <div className="text-right whitespace-nowrap shrink-0">
                                          <p className="font-bold text-sm">${transaction.amount ? parseFloat(String(transaction.amount)).toFixed(2) : '0.00'}</p>
                                          <Badge 
                                            variant={
                                              transaction.status === "completed" || transaction.status === "approved" ? "default" : 
                                              transaction.status === "pending" ? "secondary" : 
                                              "destructive"
                                            }
                                            className="text-xs mt-1"
                                          >
                                            {transaction.status === 'completed' || transaction.status === 'approved' ? '✓ Completed' :
                                             transaction.status === 'pending' ? '⏳ Pending' :
                                             '✗ Failed'}
                                          </Badge>
                                        </div>
                                      </div>

                                      {/* Metadata Row */}
                                      <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t flex-wrap">
                                        <div className="flex items-center gap-1">
                                          <Calendar className="w-3.5 h-3.5" />
                                          {new Date(transaction.date).toLocaleDateString()} {new Date(transaction.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                        <div className="w-1 h-1 rounded-full bg-muted-foreground/50"></div>
                                        {transaction.referenceId && (
                                          <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded font-mono text-xs">
                                            ID: <span className="select-all font-semibold">{transaction.referenceId}</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Action Buttons */}
                                      {transaction.type === 'payment' && (transaction.status === 'completed' || transaction.status === 'approved') && (
                                        <div className="flex gap-2 mt-3 pt-2 border-t">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs h-8"
                                            onClick={() => {
                                              setSelectedTransaction(transaction)
                                              setShowPaymentProofDialog(true)
                                            }}
                                          >
                                            <Eye className="w-3.5 h-3.5 mr-1" />
                                            View Proof
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-xs h-8"
                                            onClick={() => {
                                              const text = `Transaction Details\nType: ${transaction.type}\nAmount: $${transaction.amount ? parseFloat(String(transaction.amount)).toFixed(2) : '0.00'}\nStatus: ${transaction.status}\nID: ${transaction.referenceId}\nDate: ${new Date(transaction.date).toLocaleString()}`;
                                              navigator.clipboard.writeText(text);
                                              toast.success('Transaction details copied!');
                                            }}
                                          >
                                            <Download className="w-3.5 h-3.5 mr-1" />
                                            Copy Details
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {/* Transaction Analytics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Transaction Chart */}
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />
                                Amount by Type
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={[
                                  { 
                                    type: 'Payment', 
                                    amount: transactionHistory.filter(t => t.type === 'payment').reduce((s, t) => s + ((t.amount && parseFloat(String(t.amount))) || 0), 0) 
                                  },
                                  { 
                                    type: 'Enrollment', 
                                    amount: transactionHistory.filter(t => t.type === 'enrollment').reduce((s, t) => s + ((t.amount && parseFloat(String(t.amount))) || 0), 0) 
                                  }
                                ]}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="type" fontSize={12} />
                                  <YAxis fontSize={12} />
                                  <Tooltip formatter={(value) => typeof value === 'number' ? '$' + value.toFixed(2) : value} />
                                  <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                                </BarChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>

                          {/* Status Distribution */}
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm flex items-center gap-2">
                                <PieChart className="w-4 h-4" />
                                Status Distribution
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ResponsiveContainer width="100%" height={200}>
                                <RechartsPie
                                  data={[
                                    { name: 'Completed', value: transactionHistory.filter(t => t.status === 'completed' || t.status === 'approved').length, color: '#10b981' },
                                    { name: 'Pending', value: transactionHistory.filter(t => t.status === 'pending').length, color: '#f59e0b' },
                                    { name: 'Failed', value: transactionHistory.filter(t => t.status === 'failed').length, color: '#ef4444' }
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={70}
                                  dataKey="value"
                                >
                                  {[
                                    { name: 'Completed', value: transactionHistory.filter(t => t.status === 'completed' || t.status === 'approved').length, color: '#10b981' },
                                    { name: 'Pending', value: transactionHistory.filter(t => t.status === 'pending').length, color: '#f59e0b' },
                                    { name: 'Failed', value: transactionHistory.filter(t => t.status === 'failed').length, color: '#ef4444' }
                                  ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </RechartsPie>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Transaction Stats */}
                        <Card className="bg-muted/50">
                          <CardContent className="p-4">
                            <p className="text-sm font-semibold mb-3">Transaction Summary</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">First Transaction:</span>
                                <p className="font-semibold">{transactionHistory.length > 0 ? new Date(transactionHistory[transactionHistory.length - 1]?.date).toLocaleDateString() : 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Latest Transaction:</span>
                                <p className="font-semibold">{transactionHistory.length > 0 ? new Date(transactionHistory[0]?.date).toLocaleDateString() : 'N/A'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Enrollments:</span>
                                <p className="font-semibold text-blue-600">{transactionHistory.filter(t => t.type === 'enrollment').length}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Payments:</span>
                                <p className="font-semibold text-green-600">{transactionHistory.filter(t => t.type === 'payment').length}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <DollarSign className="w-16 h-16 mx-auto mb-3 opacity-30" />
                        <p className="text-base font-medium">No Transactions</p>
                        <p className="text-sm mt-1">This user has no transaction or enrollment history yet</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Details Tab */}
                </Tabs>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Payment Proof Dialog */}
        <Dialog open={showPaymentProofDialog} onOpenChange={setShowPaymentProofDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Payment Proof & Details</DialogTitle>
            </DialogHeader>
            {selectedTransaction && (
              <div className="space-y-4">
                {/* Transaction Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Transaction Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground text-xs">Transaction ID</span>
                        <div className="flex gap-2 items-start mt-1">
                          <p className="font-mono font-bold break-all text-base bg-muted p-2 rounded flex-1">{(selectedTransaction.referenceId || 'N/A').toUpperCase()}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="mt-0"
                            onClick={() => {
                              navigator.clipboard.writeText((selectedTransaction.referenceId || '').toUpperCase())
                              toast.success('Transaction ID copied!')
                            }}
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Amount</span>
                        <p className="font-bold text-2xl text-green-600 mt-1">${selectedTransaction.amount ? parseFloat(String(selectedTransaction.amount)).toFixed(2) : '0.00'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Type</span>
                        <p className="font-semibold capitalize mt-1">{selectedTransaction.type}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-xs">Status</span>
                        <Badge variant={selectedTransaction.status === 'approved' || selectedTransaction.status === 'completed' ? 'default' : 'secondary'} className="mt-1">
                          {selectedTransaction.status === 'completed' ? '✓ Completed' : selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-muted-foreground text-xs">Description</span>
                        <p className="text-sm mt-1">{selectedTransaction.description}</p>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-muted-foreground text-xs">Date & Time</span>
                        <p className="font-semibold mt-1">{new Date(selectedTransaction.date).toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Payment Proof Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Payment Proof / Receipt
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Proof Image Viewer */}
                      {selectedTransaction.proofImage ? (
                        <div className="border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900">
                          <img 
                            src={selectedTransaction.proofImage} 
                            alt="Payment Proof" 
                            className="w-full h-auto max-h-96 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = '';
                              e.currentTarget.parentElement!.innerHTML = '<div class="text-center p-6"><p class="text-sm text-muted-foreground">Unable to load proof image</p></div>';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-6 bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                          <div className="text-center space-y-3">
                            <div className="flex justify-center">
                              <FileText className="w-16 h-16 text-amber-500 opacity-60" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">No Payment Proof Available</p>
                              <p className="text-xs text-muted-foreground mt-1">This transaction does not have an attached proof document</p>
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-between gap-2">
                  <Button variant="outline" onClick={() => {
                    const text = `PAYMENT PROOF EXPORT\n\n${'='.repeat(50)}\n\nTransaction ID: ${selectedTransaction.referenceId}\nAmount: $${selectedTransaction.amount ? parseFloat(String(selectedTransaction.amount)).toFixed(2) : '0.00'}\nType: ${selectedTransaction.type}\nStatus: ${selectedTransaction.status}\nDate: ${new Date(selectedTransaction.date).toLocaleString()}\nDescription: ${selectedTransaction.description}\n\n${'='.repeat(50)}`;
                    navigator.clipboard.writeText(text);
                    toast.success('Transaction details copied to clipboard!');
                  }}>
                    <Download className="w-4 h-4 mr-2" />
                    Copy Details
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowPaymentProofDialog(false)}>
                      Close
                    </Button>
                    <Button onClick={() => {
                      const text = `PAYMENT PROOF EXPORT\n\n${'='.repeat(50)}\n\nTransaction ID: ${selectedTransaction.referenceId}\nAmount: $${selectedTransaction.amount ? parseFloat(String(selectedTransaction.amount)).toFixed(2) : '0.00'}\nType: ${selectedTransaction.type}\nStatus: ${selectedTransaction.status}\nDate: ${new Date(selectedTransaction.date).toLocaleString()}\nDescription: ${selectedTransaction.description}\n\n${'='.repeat(50)}`;
                      const blob = new Blob([text], { type: 'text/plain' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `payment-proof-${selectedTransaction.referenceId}-${new Date().getTime()}.txt`;
                      a.click();
                      window.URL.revokeObjectURL(url);
                      toast.success('Payment proof exported!');
                    }}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
