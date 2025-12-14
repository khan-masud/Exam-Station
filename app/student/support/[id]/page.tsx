"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Send, Loader2, AlertCircle, CheckCircle, MessageSquare, Clock, Tag, FileText, Paperclip, Download, X } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Input } from "@/components/ui/input"

interface Ticket {
  id: string
  title: string
  description: string
  status: string
  priority: string
  category: string
  created_at: string
  updated_at: string
  [key: string]: any
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [messageText, setMessageText] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchTicketDetails()
  }, [ticketId])

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
          router.push('/student/support')
          return
        }
        throw new Error('Failed to fetch ticket')
      }

      const data = await response.json()
      setTicket(data.ticket)
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Error fetching ticket:', error)
      toast.error('Failed to load ticket details')
    } finally {
      setLoading(false)
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
      
      // Add attachments
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

      // Add new message to list
      setMessages((prev: any[]) => [...prev, {
        id: data.message_id,
        ticket_id: ticketId,
        sender_id: data.sender_id,
        message_text: messageText,
        is_admin_response: false,
        created_at: new Date().toISOString(),
        sender_name: 'You',
        attachments: data.attachments || []
      }])

      setMessageText("")
      setAttachments([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Update ticket status if it was closed
      if (ticket?.status === 'closed') {
        setTicket((prev: Ticket | null) => prev ? { ...prev, status: 'reopened' } : null)
        toast.success('Ticket reopened')
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
    const maxSize = 10 * 1024 * 1024 // 10MB
    
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
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background p-6 pt-20 lg:pt-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/student/support')}
          className="hover:bg-blue-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tickets
        </Button>

        {/* Ticket Header Card */}
        <Card className="overflow-hidden border-2">
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 p-6 text-white">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-mono">
                    {ticket.id}
                  </div>
                  <Badge className={`${getPriorityColor(ticket.priority)} border-white`}>
                    {ticket.priority.toUpperCase()}
                  </Badge>
                </div>
                <h1 className="text-3xl font-bold mb-2">{ticket.title}</h1>
                <div className="flex items-center gap-4 text-sm text-blue-100">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Created {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {ticket.category}
                  </span>
                </div>
              </div>
              <Badge className={`${getStatusColor(ticket.status)} text-base px-4 py-2`}>
                {ticket.status === 'open' && <AlertCircle className="w-4 h-4 mr-2" />}
                {ticket.status === 'resolved' && <CheckCircle className="w-4 h-4 mr-2" />}
                {ticket.status === 'in_progress' && <Clock className="w-4 h-4 mr-2" />}
                {ticket.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </div>
          
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Description</p>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{ticket.description}</p>
            </div>
            
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Initial Attachments</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {ticket.attachments.map((att: any) => (
                    <a
                      key={att.id}
                      href={att.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg hover:shadow-md hover:scale-[1.02] transition-all group"
                    >
                      <div className="p-2 bg-blue-500 rounded-lg">
                        <Paperclip className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-blue-900 truncate">{att.file_name}</p>
                        <p className="text-xs text-blue-600">{formatFileSize(att.size)}</p>
                      </div>
                      <Download className="w-4 h-4 text-blue-600 group-hover:translate-y-0.5 transition-transform" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {isResolved && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 flex items-start gap-3">
                <div className="p-2 bg-green-500 rounded-full">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">Ticket Resolved</p>
                  <p className="text-sm text-green-700 mt-1">
                    Your ticket has been marked as resolved. You can still add messages to reopen it if needed.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Messages Section */}
        <Card className="flex flex-col shadow-lg border-2">
          <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-4">
            <div className="flex items-center gap-2 text-white">
              <MessageSquare className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Conversation</h2>
              <span className="ml-auto px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm">
                {messages.length} {messages.length === 1 ? 'message' : 'messages'}
              </span>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white min-h-[600px] md:min-h-[700px]">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <div className="p-8">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-blue-600" />
                  </div>
                  <p className="text-lg font-medium text-foreground mb-2">No messages yet</p>
                  <p className="text-sm text-muted-foreground">Start the conversation by sending a message below</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3 animate-in slide-in-from-bottom-2 duration-300">
                    <div className={`flex-1 ${message.is_admin_response ? 'mr-8' : 'ml-8'}`}>
                      <div
                        className={`rounded-2xl p-4 shadow-sm ${
                          message.is_admin_response
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                            : 'bg-white border-2 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              message.is_admin_response ? 'bg-white/20' : 'bg-blue-100'
                            }`}>
                              <span className="text-sm">{message.is_admin_response ? '👨‍💼' : '👤'}</span>
                            </div>
                            <p className="font-semibold text-sm">
                              {message.is_admin_response ? 'Support Team' : 'You'}
                            </p>
                          </div>
                          <span className={`text-xs ${
                            message.is_admin_response ? 'text-blue-100' : 'text-muted-foreground'
                          }`}>
                            {new Date(message.created_at).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {message.message_text}
                        </p>
                        
                        {message.attachments && message.attachments.length > 0 && (
                          <div className={`mt-3 space-y-1.5 pt-3 border-t ${
                            message.is_admin_response ? 'border-white/20' : 'border-gray-200'
                          }`}>
                            {message.attachments.map((att: any) => (
                              <a
                                key={att.id}
                                href={att.file_path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-xs group ${
                                  message.is_admin_response 
                                    ? 'bg-white/10 hover:bg-white/20' 
                                    : 'bg-gray-50 hover:bg-gray-100'
                                }`}
                              >
                                <Paperclip className="w-3 h-3" />
                                <span className="font-medium flex-1 truncate">{att.file_name}</span>
                                <span className="text-xs opacity-75">({formatFileSize(att.size)})</span>
                                <Download className="w-3 h-3 group-hover:translate-y-0.5 transition-transform" />
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
          </div>

          <Separator />

          {/* Message Input */}
          <div className="p-6 bg-white border-t-2">
            <form onSubmit={handleSendMessage} className="space-y-4">
              <Textarea
                placeholder={isResolved ? "Add a message to reopen this ticket..." : "Type your message here..."}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={sending}
                rows={3}
                maxLength={1000}
                className="resize-none border-2 focus:border-blue-500 transition-colors"
              />
              
              {/* Attachment Preview */}
              {attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Attachments ({attachments.length})</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 px-3 py-2 bg-blue-50 border-2 border-blue-200 rounded-lg">
                        <Paperclip className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium flex-1 truncate">{file.name}</span>
                        <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(index)}
                          className="p-1 hover:bg-red-100 rounded-full transition-colors"
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-mono">
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
                    className="border-2"
                  >
                    <Paperclip className="w-4 h-4 mr-2" />
                    Attach Files
                  </Button>
                </div>
                <Button
                  type="submit"
                  disabled={sending || (!messageText.trim() && attachments.length === 0)}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Info Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500 rounded-full">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <p className="text-sm text-blue-900 leading-relaxed">
                <strong>Support Response Time:</strong> {isResolved ? "This ticket is marked as resolved. Reply to reopen it. " : ""}Our team typically responds within 24 hours. For urgent issues, please mark your ticket as urgent priority.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
