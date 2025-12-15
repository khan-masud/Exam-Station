"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Clock, AlertCircle, CheckCircle, Loader2, Eye, TrendingUp, ArrowRight, User, Calendar, Tag, Zap, UserCircle } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function AdminSupportDashboard() {
  const router = useRouter()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    urgent_count: 0
  })

  useEffect(() => {
    fetchTickets()
  }, [statusFilter, priorityFilter])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (statusFilter !== "all") params.append("status", statusFilter)
      if (priorityFilter !== "all") params.append("priority", priorityFilter)
      
      const query = params.toString() ? `?${params.toString()}` : ""
      const response = await fetch(`/api/support/tickets${query}`, {
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Failed to fetch tickets')

      const data = await response.json()
      const allTickets = data.tickets || []
      
      setTickets(allTickets)

      // Calculate stats
      setStats({
        total: allTickets.length,
        open: allTickets.filter((t: any) => t.status === 'open').length,
        in_progress: allTickets.filter((t: any) => t.status === 'in_progress').length,
        resolved: allTickets.filter((t: any) => t.status === 'resolved').length,
        urgent_count: allTickets.filter((t: any) => t.priority === 'urgent').length
      })
    } catch (error) {
      toast.error('Failed to load support tickets')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      reopened: 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-blue-50 border-blue-200',
      medium: 'bg-yellow-50 border-yellow-200',
      high: 'bg-orange-50 border-orange-200',
      urgent: 'bg-red-50 border-red-200'
    }
    return colors[priority] || 'bg-gray-50 border-gray-200'
  }

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-card to-background p-6 pt-20 lg:pt-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground mt-2">Manage and respond to customer support requests</p>
        </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Total Tickets</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Open</p>
                <p className="text-3xl font-bold">{stats.open}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">In Progress</p>
                <p className="text-3xl font-bold">{stats.in_progress}</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Resolved</p>
                <p className="text-3xl font-bold">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={stats.urgent_count > 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Urgent</p>
                <p className="text-3xl font-bold">{stats.urgent_count}</p>
              </div>
              <Zap className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search by title, ID, or student name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Tickets Found</h3>
            <p className="text-muted-foreground">
              {statusFilter !== "all" || priorityFilter !== "all"
                ? "No tickets match the selected filters"
                : "All tickets have been resolved"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTickets.map((ticket) => (
            <Card
              key={ticket.id}
              className={`group cursor-pointer hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden bg-gradient-to-br from-card to-card/50 hover:scale-[1.01] ${
                ticket.priority === 'urgent' ? 'ring-2 ring-red-500 ring-offset-2' :
                ticket.priority === 'high' ? 'ring-1 ring-orange-300' : ''
              }`}
              onClick={() => router.push(`/admin/support/${ticket.id}`)}
            >
              {/* Priority Indicator Bar */}
              <div className={`h-2 w-full ${
                ticket.priority === 'urgent' ? 'bg-gradient-to-r from-red-500 via-red-600 to-red-500 animate-pulse' :
                ticket.priority === 'high' ? 'bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500' :
                ticket.priority === 'medium' ? 'bg-gradient-to-r from-yellow-500 via-yellow-600 to-yellow-500' :
                'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500'
              }`} />
              
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0 space-y-4">
                    {/* Header */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {ticket.title}
                        </h3>
                        {ticket.priority === 'urgent' && (
                          <Badge className="bg-red-500 text-white animate-pulse flex items-center gap-1 px-3">
                            <Zap className="w-3 h-3" />
                            URGENT
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${getStatusColor(ticket.status)} font-medium px-3 py-1`}>
                          {ticket.status === 'open' && <AlertCircle className="w-3 h-3 mr-1" />}
                          {ticket.status === 'resolved' && <CheckCircle className="w-3 h-3 mr-1" />}
                          {ticket.status === 'in_progress' && <Clock className="w-3 h-3 mr-1" />}
                          {ticket.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 px-3 py-1">
                          <Tag className="w-3 h-3 mr-1" />
                          {ticket.category}
                        </Badge>
                        <Badge variant="outline" className={`px-3 py-1 ${
                          ticket.priority === 'urgent' ? 'bg-red-50 border-red-300 text-red-700' :
                          ticket.priority === 'high' ? 'bg-orange-50 border-orange-300 text-orange-700' :
                          ticket.priority === 'medium' ? 'bg-yellow-50 border-yellow-300 text-yellow-700' :
                          'bg-blue-50 border-blue-300 text-blue-700'
                        }`}>
                          {ticket.priority.toUpperCase()}
                        </Badge>
                        {ticket.admin_id && (
                          <Badge variant="outline" className="bg-green-50 border-green-300 text-green-700 px-3 py-1">
                            <UserCircle className="w-3 h-3 mr-1" />
                            Assigned
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {ticket.description}
                    </p>

                    {/* Footer Metadata */}
                    <div className="flex items-center gap-6 text-sm pt-2 border-t">
                      <div className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        <span className="font-medium">{ticket.message_count}</span>
                        <span>messages</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4 text-purple-500" />
                        <span className="font-medium">{ticket.student_name || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4 text-green-500" />
                        <span>{new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span>{new Date(ticket.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button & Status Icon */}
                  <div className="flex flex-col items-center gap-3">
                    <div className={`p-3 rounded-full ${
                      ticket.status === 'resolved' ? 'bg-green-100' :
                      ticket.status === 'in_progress' ? 'bg-yellow-100' :
                      ticket.status === 'open' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      {ticket.status === 'resolved' && (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      )}
                      {ticket.status === 'open' && (
                        <AlertCircle className="w-6 h-6 text-blue-600" />
                      )}
                      {ticket.status === 'in_progress' && (
                        <Clock className="w-6 h-6 text-yellow-600" />
                      )}
                      {ticket.status === 'closed' && (
                        <CheckCircle className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/admin/support/${ticket.id}`)
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </Button>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}
