"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, MessageSquare, Clock, AlertCircle, CheckCircle, Loader2, ArrowRight, User, Calendar, Tag, Zap } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

export default function SupportTicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchTickets()
  }, [statusFilter])

  const fetchTickets = async () => {
    try {
      setLoading(true)
      const query = statusFilter !== "all" ? `?status=${statusFilter}` : ""
      const response = await fetch(`/api/support/tickets${query}`, {
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Failed to fetch tickets')

      const data = await response.json()
      setTickets(data.tickets || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
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
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background p-6 pt-20 lg:pt-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Support Tickets</h1>
            <p className="text-muted-foreground mt-2">Manage your support requests</p>
          </div>
          <Button onClick={() => router.push('/student/support/new')} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Total Tickets</p>
                  <p className="text-3xl font-bold">{tickets.length}</p>
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
                  <p className="text-3xl font-bold">{tickets.filter(t => t.status === 'open').length}</p>
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
                  <p className="text-3xl font-bold">{tickets.filter(t => t.status === 'in_progress').length}</p>
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
                  <p className="text-3xl font-bold">{tickets.filter(t => t.status === 'resolved').length}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by title or ticket ID..."
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
              <p className="text-muted-foreground mb-4">
                {statusFilter !== "all" ? "No tickets match the selected status" : "You haven't created any support tickets yet"}
              </p>
              <Button onClick={() => router.push('/student/support/new')}>
                Create Your First Ticket
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredTickets.map((ticket) => (
              <Card 
                key={ticket.id}
                className={`group cursor-pointer hover:shadow-2xl transition-all duration-300 border-0 overflow-hidden bg-gradient-to-br from-card to-card/50 hover:scale-[1.02] ${
                  ticket.priority === 'urgent' ? 'ring-2 ring-red-500 ring-offset-2' :
                  ticket.priority === 'high' ? 'ring-1 ring-orange-300' : ''
                }`}
                onClick={() => router.push(`/student/support/${ticket.id}`)}
              >
                {/* Priority Indicator Bar */}
                <div className={`h-2 w-full ${
                  ticket.priority === 'urgent' ? 'bg-gradient-to-r from-red-500 via-red-600 to-red-500' :
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
                            <Badge className="bg-red-500 text-white animate-pulse flex items-center gap-1">
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
                          <Calendar className="w-4 h-4 text-green-500" />
                          <span>{new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span>{new Date(ticket.updated_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Icon & Action */}
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
