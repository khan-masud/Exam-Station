"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Send, Loader2, AlertCircle, CheckCircle, Flag, MessageSquare, Clock, Tag, FileText, User, Paperclip, Download, X } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Input } from "@/components/ui/input"

interface AdminTicket {
  id: string
  title: string
  description: string
  status: string
  priority: string
  category: string
  created_at: string
  updated_at: string
  resolved_at?: string
  [key: string]: any
}

export default function AdminTicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [ticket, setTicket] = useState<AdminTicket | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [newStatus, setNewStatus] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchTicketDetails()
  }, [ticketId])

  useEffect(() => {
    if (ticket) {
      setNewStatus(ticket.status)
    }
  }, [ticket])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchTicketDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 404) {
          toast.error('Ticket not found')
          router.push('/admin/support')
          return
        }
        throw new Error('Failed to fetch ticket')
      }

      const data = await response.json()
      setTicket(data.ticket)
      setMessages(data.messages || [])
      setNewStatus(data.ticket.status)
    } catch (error) {
      console.error('Error fetching ticket:', error)
      toast.error('Failed to load ticket details')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async () => {
    if (!ticket || newStatus === ticket.status) return

    try {
      setUpdatingStatus(true)

      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update ticket status')
      }

      setTicket((prev: AdminTicket | null) => prev ? ({
        ...prev,
        status: newStatus,
        resolved_at: newStatus === 'resolved' ? new Date().toISOString() : prev.resolved_at
      }) : null)

      toast.success('Ticket status updated')
    } catch (error: any) {
      console.error('Error updating status:', error)
      toast.error('Failed to update ticket status')
      setNewStatus(ticket.status)
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!messageText.trim() && attachments.length === 0) {
      toast.error('Please enter a message or attach a file')
      return
    }

    try {
      setSending(true)

      const formData = new FormData()
      formData.append('ticket_id', ticketId)
      formData.append('message_text', messageText)
      
      attachments.forEach(file => {
        formData.append('attachments', file)
      })

      const response = await fetch('/api/support/messages', {
        method: 'POST',
        credentials: 'include',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()

      setMessages((prev: any[]) => [...prev, {
        id: data.message_id,
        ticket_id: ticketId,
        sender_id: data.sender_id,
        message_text: messageText,
        is_admin_response: true,
        created_at: new Date().toISOString(),
        sender_name: 'Support Team',
        attachments: data.attachments || []
      }])

      setMessageText("")
      setAttachments([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      if (ticket?.status === 'open') {
        setTicket((prev: AdminTicket | null) => prev ? { ...prev, status: 'in_progress' } : null)
        setNewStatus('in_progress')
        toast.success('Ticket marked as in progress')
      }
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast.error(error.message || 'Failed to send message')
    } finally {
      setSending(false)
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
      low: 'text-blue-600',
      medium: 'text-yellow-600',
      high: 'text-orange-600',
      urgent: 'text-red-600'
    }
    return colors[priority] || 'text-gray-600'
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const maxSize = 10 * 1024 * 1024
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large. Maximum size is 10MB`)
        return false
      }
      return true
    })
    
    setAttachments(prev => [...prev, ...validFiles])
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!ticket) {
    return null
  }

  const isResolved = ticket.status === 'resolved'

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-card to-background p-6 pt-20 lg:pt-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/support')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tickets
        </Button>

      {/* Ticket Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{ticket.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Ticket ID: <code className="bg-muted px-2 py-1 rounded">{ticket.id}</code>
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-end">
              <Badge className={getStatusColor(ticket.status)}>
                {ticket.status.replace('_', ' ')}
              </Badge>
              <Badge variant="outline" className={getPriorityColor(ticket.priority)}>
                {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
              </Badge>
              {ticket.priority === 'urgent' && (
                <Badge variant="destructive">🚨 URGENT</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-start gap-2">
              <Tag className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground font-semibold">CATEGORY</p>
                <p className="text-sm font-medium capitalize">{ticket.category}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <User className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground font-semibold">STUDENT</p>
                <p className="text-sm font-medium">{ticket.student_name || 'Unknown'}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground font-semibold">CREATED</p>
                <p className="text-sm font-medium">
                  {new Date(ticket.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground font-semibold">UPDATED</p>
                <p className="text-sm font-medium">
                  {new Date(ticket.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            {ticket.admin_id && (
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground font-semibold">ASSIGNED TO</p>
                  <p className="text-sm font-medium">👨‍💼 Assigned</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-muted-foreground mt-1" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground font-semibold mb-2">DESCRIPTION</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{ticket.description}</p>
              
              {ticket.attachments && ticket.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs text-muted-foreground font-semibold">INITIAL ATTACHMENTS</p>
                  <div className="flex flex-wrap gap-2">
                    {ticket.attachments.map((att: any) => (
                      <a
                        key={att.id}
                        href={att.file_path}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                      >
                        <Paperclip className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-900">{att.file_name}</span>
                        <span className="text-xs text-blue-600">({formatFileSize(att.size)})</span>
                        <Download className="w-3 h-3 text-blue-600" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Management */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-3">Update Status</p>
            <div className="flex gap-3">
              <Select value={newStatus} onValueChange={setNewStatus} disabled={updatingStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleStatusChange}
                disabled={updatingStatus || newStatus === ticket.status}
                size="sm"
              >
                {updatingStatus ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Flag className="w-4 h-4 mr-2" />
                    Update
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Section */}
      <Card className="flex flex-col min-h-[700px] md:min-h-[800px]">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Conversation ({messages.length})</CardTitle>
          </div>
        </CardHeader>

        {/* Messages List */}
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No messages yet</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className="flex gap-3">
                  <div className={`flex-1 ${message.is_admin_response ? 'mr-12' : 'ml-12'}`}>
                    <div
                      className={`rounded-lg p-4 ${
                        message.is_admin_response
                          ? 'bg-blue-100 border border-blue-200'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="font-semibold text-sm">
                          {message.is_admin_response ? '👨‍💼 Support Team' : `👤 ${ticket.student_name || 'Student'}`}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleString()}
                        </span>
                      </div>
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.message_text}
                        </p>
                        
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-3 space-y-1 border-t pt-2">
                            {message.attachments.map((att: any) => (
                              <a
                                key={att.id}
                                href={att.file_path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-2 py-1.5 bg-accent/50 rounded hover:bg-accent transition-colors text-xs"
                              >
                                <Paperclip className="w-3 h-3" />
                                <span className="font-medium">{att.file_name}</span>
                                <span className="text-muted-foreground">({formatFileSize(att.size)})</span>
                                <Download className="w-3 h-3 ml-auto" />
                              </a>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>

        <Separator />

        {/* Message Input */}
        <CardContent className="p-4 bg-muted/30">
          <form onSubmit={handleSendMessage} className="space-y-3">
            <Textarea
              placeholder="Type your response..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={sending}
              rows={3}
              maxLength={1000}
            />
            
            {/* Attachment Preview */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg border border-blue-500/30">
                {attachments.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-2 bg-background rounded-md border">
                    <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="ml-2 text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {messageText.length}/1000
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                >
                  <Paperclip className="w-4 h-4 mr-2" />
                  Attach Files
                </Button>
              </div>
              <Button
                type="submit"
                disabled={sending || (!messageText.trim() && attachments.length === 0)}
                size="sm"
              >
                {sending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Response
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className={`border ${isResolved ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
        <CardContent className="p-4">
          <p className={`text-sm ${isResolved ? 'text-green-900' : 'text-blue-900'}`}>
            <strong>💡 Note:</strong> {isResolved ? "This ticket is marked as resolved. " : ""}All messages will be visible to the student. Responding to open tickets will automatically mark them as 'In Progress'.
          </p>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
