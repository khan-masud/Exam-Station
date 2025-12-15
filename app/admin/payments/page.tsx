"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Search, RefreshCw, Check, X, Eye, FileText, Image as ImageIcon, Download, TrendingUp, AlertCircle, Clock, XCircle, RefreshCcw, User, Mail, BookOpen, CreditCard, Calendar, DollarSign, Smartphone, Wallet, CheckCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Transaction {
  id: string
  amount: number
  gateway: string
  payment_gateway?: string
  status: string
  payment_status?: string
  date: string
  created_at?: string
  reference?: string
  transaction_reference?: string
  userName?: string
  userEmail?: string
  examTitle?: string
  programTitle?: string
  payment_method?: string
  payment_details?: any
  user_id?: string
  exam_id?: string
  admin_notes?: string
}

interface Summary {
  totalTransactions: number
  totalRevenue: number
  refundedAmount: number
  pendingAmount: number
  failedCount: number
}

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [summary, setSummary] = useState<Summary>({
    totalTransactions: 0,
    totalRevenue: 0,
    refundedAmount: 0,
    pendingAmount: 0,
    failedCount: 0
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [totalPages, setTotalPages] = useState(1)
  const [totalTransactions, setTotalTransactions] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const [newStatus, setNewStatus] = useState<string>("")
  const [processingAction, setProcessingAction] = useState(false)
  const [showProofDialog, setShowProofDialog] = useState(false)
  const [proofImageUrl, setProofImageUrl] = useState("")
  const [dataLoaded, setDataLoaded] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportStartDate, setExportStartDate] = useState("")
  const [exportEndDate, setExportEndDate] = useState("")
  const [exportFormat, setExportFormat] = useState<"csv" | "xml">("csv")
  const [exportLoading, setExportLoading] = useState(false)


  useEffect(() => {
    fetchTransactions()
  }, [currentPage, pageSize])

  // Debounce search and status filter changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1)
      fetchTransactions()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchTerm, statusFilter])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('limit', pageSize.toString())
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter)
      if (searchTerm) params.append('search', searchTerm)

      const response = await fetch(`/api/payments?${params.toString()}`, {
        credentials: 'include'
      })
      
      
      if (response.ok) {
        let data;
        try {
          const text = await response.text()
          data = JSON.parse(text)
        } catch (parseError) {
          throw new Error('Invalid JSON response')
        }
        
        setTransactions(data.transactions || [])
        setSummary(data.summary || {
          totalTransactions: 0,
          totalRevenue: 0,
          refundedAmount: 0,
          pendingAmount: 0,
          failedCount: 0
        })
        if (data.pagination) {
          setTotalPages(data.pagination.totalPages)
          setTotalTransactions(data.pagination.total)
        }
        setDataLoaded(true)
      } else {
        
        let errorData = {}
        try {
          const text = await response.text()
          if (text) {
            errorData = JSON.parse(text)
          }
        } catch (parseError) {
          errorData = { error: 'Failed to parse error response', status: response.status }
        }
        
        
        // Don't show error toast for auth errors as it will redirect anyway
        if (response.status !== 401 && response.status !== 403) {
          toast.error(`Failed to fetch payment transactions (${response.status})`)
        }
        
        // Set empty data to prevent crashes
        setTransactions([])
        setSummary({
          totalTransactions: 0,
          totalRevenue: 0,
          refundedAmount: 0,
          pendingAmount: 0,
          failedCount: 0
        })
      }
    } catch (error: any) {
      
      // Don't show error toast for network errors as they might be auth-related
      // Set empty data to prevent crashes
      setTransactions([])
      setSummary({
        totalTransactions: 0,
        totalRevenue: 0,
        refundedAmount: 0,
        pendingAmount: 0,
        failedCount: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchTransactions()
    setRefreshing(false)
  }

  const handleApprovePayment = async (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setAdminNotes("")
    setShowApprovalDialog(true)
  }

  const confirmApproval = async (approve: boolean) => {
    if (!selectedTransaction) return

    setProcessingAction(true)
    try {
      const response = await fetch(`/api/payments/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          transactionId: selectedTransaction.id,
          approve,
          notes: adminNotes
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(approve ? 'Payment approved successfully' : 'Payment rejected')
        setShowApprovalDialog(false)
        setSelectedTransaction(null)
        setAdminNotes("")
        await fetchTransactions()
      } else {
        toast.error(data.error || 'Failed to process payment')
      }
    } catch (error) {
      toast.error('Failed to process payment')
    } finally {
      setProcessingAction(false)
    }
  }

  const handleChangeStatus = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    const currentStatus = getStatusDisplay(transaction)
    setNewStatus(currentStatus)
    // Properly initialize notes - handle null, undefined, or empty string
    const existingNotes = transaction.admin_notes ? transaction.admin_notes.trim() : ""
    setAdminNotes(existingNotes)
    setShowStatusDialog(true)
  }

  const confirmStatusChange = async () => {
    if (!selectedTransaction || !newStatus) return

    setProcessingAction(true)
    try {
      const response = await fetch(`/api/payments/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          transactionId: selectedTransaction.id,
          status: newStatus,
          notes: adminNotes
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Payment status updated successfully')
        await fetchTransactions()
        setShowStatusDialog(false)
        setSelectedTransaction(null)
        setAdminNotes("")
        setNewStatus("")
      } else {
        toast.error(data.error || 'Failed to update status')
      }
    } catch (error) {
      toast.error('Failed to update status')
    } finally {
      setProcessingAction(false)
    }
  }

  const handleViewProof = (transaction: Transaction) => {
    const paymentDetails = typeof transaction.payment_details === 'string' 
      ? JSON.parse(transaction.payment_details) 
      : transaction.payment_details || {}
    
    if (paymentDetails.payment_proof) {
      setProofImageUrl(paymentDetails.payment_proof)
      setShowProofDialog(true)
    } else {
      toast.error('No payment proof available')
    }
  }

  const handleExportTransactions = async () => {
    if (!exportStartDate || !exportEndDate) {
      toast.error('Please select both start and end dates')
      return
    }

    if (new Date(exportStartDate) > new Date(exportEndDate)) {
      toast.error('Start date must be before end date')
      return
    }

    setExportLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('startDate', exportStartDate)
      params.append('endDate', exportEndDate)
      params.append('format', exportFormat)


      const response = await fetch(`/api/payments/export?${params.toString()}`, {
        credentials: 'include'
      })


      if (!response.ok) {
        const errorText = await response.text()
        try {
          const jsonError = JSON.parse(errorText)
          throw new Error(`API Error: ${jsonError.error || 'Unknown error'} - ${jsonError.details || ''}`)
        } catch {
          throw new Error(`Export failed with status ${response.status}: ${errorText.substring(0, 200)}`)
        }
      }

      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const fileName = `transactions_${exportStartDate}_to_${exportEndDate}.${exportFormat}`
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(`Transactions exported successfully as ${exportFormat.toUpperCase()}`)
      setShowExportDialog(false)
      setExportStartDate("")
      setExportEndDate("")
    } catch (error: any) {
      toast.error(error.message || 'Failed to export transactions')
    } finally {
      setExportLoading(false)
    }
  }

  const handleDownloadPaymentDetails = (transaction: Transaction) => {
    const status = getStatusDisplay(transaction)
    const gateway = getGatewayDisplay(transaction)
    
    let paymentDetails: any = {}
    try {
      paymentDetails = typeof transaction.payment_details === 'string' 
        ? JSON.parse(transaction.payment_details) 
        : transaction.payment_details || {}
    } catch (e) {
      paymentDetails = {}
    }

    // Create PDF-like HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Payment Receipt - ${transaction.id.substring(0, 8)}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
            color: #333;
            background: #f5f5f5;
          }
          .receipt {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
          }
          .header h1 {
            color: #2563eb;
            margin: 0 0 10px 0;
            font-size: 28px;
          }
          .header p {
            color: #666;
            margin: 5px 0;
          }
          .section {
            margin: 25px 0;
          }
          .section-title {
            font-weight: bold;
            color: #2563eb;
            font-size: 16px;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }
          .info-item {
            padding: 10px;
            background: #f9fafb;
            border-left: 3px solid #e5e7eb;
            border-radius: 4px;
          }
          .info-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 4px;
          }
          .info-value {
            font-size: 14px;
            font-weight: 600;
            color: #111827;
          }
          .amount-box {
            text-align: center;
            padding: 20px;
            background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
            color: white;
            border-radius: 8px;
            margin: 20px 0;
          }
          .amount-box .label {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 5px;
          }
          .amount-box .amount {
            font-size: 36px;
            font-weight: bold;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-approved { background: #d1fae5; color: #065f46; }
          .status-completed { background: #d1fae5; color: #065f46; }
          .status-cancelled { background: #fee2e2; color: #991b1b; }
          .status-refunded { background: #dbeafe; color: #1e40af; }
          .status-failed { background: #fee2e2; color: #991b1b; }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          .notes-box {
            background: #fffbeb;
            border: 1px solid #fcd34d;
            border-radius: 6px;
            padding: 15px;
            margin: 15px 0;
          }
          @media print {
            body { background: white; padding: 0; }
            .receipt { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>Payment Receipt</h1>
            <p>Transaction ID: <strong>${transaction.id}</strong></p>
            <p>${new Date(transaction.date || transaction.created_at || Date.now()).toLocaleString()}</p>
          </div>

          <div class="amount-box">
            <div class="label">Total Amount</div>
            <div class="amount">৳ {transaction.amount.toFixed(2)}</div>
          </div>

          <div class="section">
            <div class="section-title">Payment Status</div>
            <span class="status-badge status-${status.toLowerCase().replace('_', '-')}">${status}</span>
          </div>

          <div class="section">
            <div class="section-title">Student Information</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Full Name</div>
                <div class="info-value">${transaction.userName || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Email Address</div>
                <div class="info-value">${transaction.userEmail || 'N/A'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Student ID</div>
                <div class="info-value">${transaction.user_id || 'N/A'}</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Payment Details</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Payment Gateway</div>
                <div class="info-value">${gateway}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Payment Method</div>
                <div class="info-value">${transaction.payment_method || 'N/A'}</div>
              </div>
              ${paymentDetails.transaction_id ? `
              <div class="info-item">
                <div class="info-label">User Transaction ID</div>
                <div class="info-value">${paymentDetails.transaction_id}</div>
              </div>
              ` : ''}
              <div class="info-item">
                <div class="info-label">System Reference</div>
                <div class="info-value">${transaction.reference || transaction.transaction_reference || 'N/A'}</div>
              </div>
            </div>
          </div>

          ${transaction.examTitle || transaction.programTitle ? `
          <div class="section">
            <div class="section-title">Enrollment Details</div>
            <div class="info-grid">
              ${transaction.examTitle ? `
              <div class="info-item">
                <div class="info-label">Exam</div>
                <div class="info-value">${transaction.examTitle}</div>
              </div>
              ` : ''}
              ${transaction.programTitle ? `
              <div class="info-item">
                <div class="info-label">Program</div>
                <div class="info-value">${transaction.programTitle}</div>
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}

          ${paymentDetails.notes ? `
          <div class="section">
            <div class="section-title">Notes</div>
            <div class="notes-box">
              ${paymentDetails.notes}
            </div>
          </div>
          ` : ''}

          ${paymentDetails.payment_proof ? `
          <div class="section">
            <div class="section-title">Payment Proof</div>
            <div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">
              <img src="${paymentDetails.payment_proof}" alt="Payment Proof" style="max-width: 100%; max-height: 400px; border: 2px solid #e5e7eb; border-radius: 4px;">
            </div>
          </div>
          ` : ''}

          <div class="footer">
            <p><strong>Exam Management System</strong></p>
            <p>This is an official payment receipt generated on ${new Date().toLocaleString()}</p>
            <p>For inquiries, please contact the administration office.</p>
          </div>
        </div>
      </body>
      </html>
    `

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    
    // Open in new window and trigger print dialog
    const printWindow = window.open(url, '_blank')
    if (printWindow) {
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print()
        }, 250)
      }
    }
    
    // Also allow direct download
    setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 1000)
    
    toast.success('Opening print dialog... Use "Save as PDF" in the print options')
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      approved: "default",
      completed: "default", // legacy
      pending: "secondary",
      pending_approval: "secondary", // legacy
      cancelled: "destructive",
      rejected: "destructive", // legacy
      refunded: "outline",
      failed: "destructive",
      unknown: "outline"
    }
    return colors[status] || "outline"
  }

  const getStatusDisplay = (tx: Transaction) => {
    const status = tx.payment_status || tx.status
    // If status is null/undefined, check if it's a manual payment and default to pending
    if (!status) {
      const gateway = tx.payment_gateway || tx.gateway
      const method = tx.payment_method
      // If it has a payment method (cash, bank_transfer, etc), it's likely pending
      if (method && (gateway === 'manual' || !gateway)) {
        return 'pending'
      }
      return 'pending'
    }
    // Map legacy statuses to new ones
    if (status === 'completed') return 'approved'
    if (status === 'rejected') return 'cancelled'
    if (status === 'pending_approval') return 'pending'
    return status
  }

  const getGatewayDisplay = (tx: Transaction) => {
    const gateway = tx.payment_gateway || tx.gateway
    // If gateway is null but has payment_method, it's a manual payment
    if (!gateway && tx.payment_method) {
      return 'manual'
    }
    return gateway || 'online'
  }

  const filteredTransactions = transactions.filter((t) => {
    // Parse payment details to check user transaction ID
    let userTransactionId = ''
    try {
      const paymentDetails = typeof t.payment_details === 'string' 
        ? JSON.parse(t.payment_details) 
        : t.payment_details || {}
      userTransactionId = paymentDetails.transaction_id || ''
    } catch (e) {
      userTransactionId = ''
    }

    const matchesSearch = 
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.examTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.programTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      userTransactionId.toLowerCase().includes(searchTerm.toLowerCase())
    
    const status = getStatusDisplay(t)
    const matchesFilter = 
      statusFilter === "all" ||
      (statusFilter === "pending" && status === "pending") ||
      (statusFilter === "approved" && status === "approved") ||
      (statusFilter === "cancelled" && status === "cancelled") ||
      (statusFilter === "refunded" && status === "refunded") ||
      (statusFilter === "failed" && status === "failed")
    
    return matchesSearch && matchesFilter
  })

  const pendingApprovalCount = transactions.filter(t => {
    const status = getStatusDisplay(t)
    const gateway = getGatewayDisplay(t)
    return status === 'pending' && gateway === 'manual'
  }).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payment Transactions</h1>
          <p className="text-muted-foreground">Track all payment activities</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowExportDialog(true)} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Pending Approvals Alert */}
      {pendingApprovalCount > 0 && statusFilter !== 'pending' && (
          <Card className="border-l-4 border-l-amber-500 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <Eye className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900">
                      {pendingApprovalCount} payment{pendingApprovalCount > 1 ? 's' : ''} awaiting approval
                    </p>
                    <p className="text-sm text-amber-700">
                      Manual payments submitted by students require your review
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setStatusFilter('pending')}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  Review Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold mt-2">{summary.totalTransactions}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">৳ {summary.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Refunded Amount</p>
                  <p className="text-2xl font-bold text-blue-600 mt-2">৳ {summary.refundedAmount.toFixed(2)}</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <RefreshCcw className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all ${statusFilter === 'pending' ? 'ring-2 ring-amber-500' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'pending' ? 'all' : 'pending')}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Approval</p>
                  <p className="text-2xl font-bold text-amber-600 mt-2">{pendingApprovalCount}</p>
                  {pendingApprovalCount > 0 && (
                    <p className="text-xs text-amber-600 mt-1">Click to filter</p>
                  )}
                </div>
                <div className="bg-amber-100 p-3 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Failed Transactions</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">{summary.failedCount}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-lg">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={statusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All
          </Button>
          <Button
            variant={statusFilter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("pending")}
            className={pendingApprovalCount > 0 ? "relative" : ""}
          >
            Pending Approval
            {pendingApprovalCount > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-amber-500 text-white">
                {pendingApprovalCount}
              </span>
            )}
          </Button>
          <Button
            variant={statusFilter === "approved" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("approved")}
          >
            Approved
          </Button>
          <Button
            variant={statusFilter === "cancelled" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("cancelled")}
          >
            Cancelled
          </Button>
          <Button
            variant={statusFilter === "refunded" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("refunded")}
          >
            Refunded
          </Button>
          <Button
            variant={statusFilter === "failed" ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter("failed")}
          >
            Failed
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by transaction ID, user transaction ID, user, or exam..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="text-center py-8">Loading transactions...</div>
        ) : filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Transactions Found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try a different search term' : 'No payment transactions yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTransactions.map((tx) => {
              const status = getStatusDisplay(tx)
              const gateway = getGatewayDisplay(tx)
              const isPending = status === 'pending'
              const isManual = gateway === 'manual'
              const showApprovalButtons = status === 'pending' && isManual
              
              let paymentDetails: any = {}
              try {
                paymentDetails = typeof tx.payment_details === 'string' 
                  ? JSON.parse(tx.payment_details) 
                  : tx.payment_details || {}
              } catch (e) {
                paymentDetails = {}
              }

              const hasPaymentProof = paymentDetails.payment_proof && paymentDetails.payment_proof !== null && paymentDetails.payment_proof !== ''
              const hasLegacyReceipt = !hasPaymentProof && paymentDetails.receipt_uploaded === true && paymentDetails.receipt_filename

              return (
                <Card 
                  key={tx.id}
                  className={showApprovalButtons ? "border-l-4 border-l-amber-500 shadow-lg" : ""}
                >
                  <CardContent className="p-6">
                    {/* Header Section */}
                    <div className="flex items-center justify-between mb-4 pb-3 border-b">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          status === 'approved' ? 'bg-green-100' :
                          status === 'pending' ? 'bg-amber-100' :
                          status === 'refunded' ? 'bg-blue-100' :
                          status === 'failed' ? 'bg-red-100' : 'bg-gray-100'
                        }`}>
                          {status === 'approved' ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                           status === 'pending' ? <AlertCircle className="w-5 h-5 text-amber-600" /> :
                           status === 'refunded' ? <RefreshCcw className="w-5 h-5 text-blue-600" /> :
                           status === 'failed' ? <X className="w-5 h-5 text-red-600" /> :
                           <Clock className="w-5 h-5 text-gray-600" />}
                        </div>
                        <div>
                          <h3 className="font-semibold">Transaction #{tx.id.substring(0, 8)}</h3>
                          <p className="text-xs text-muted-foreground">{tx.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">৳ {tx.amount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 inline mr-1" />
                          {new Date(tx.date || tx.created_at || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant={getStatusColor(status) as any}>
                        {status.replace('_', ' ').toUpperCase()}
                      </Badge>
                      {tx.payment_method && (
                        <Badge variant="outline" className="bg-blue-50 border-blue-300">
                          <CreditCard className="w-3 h-3 mr-1" />
                          {tx.payment_method}
                        </Badge>
                      )}
                      {isManual && (
                        <Badge variant="outline" className="bg-amber-50 border-amber-300">
                          <Wallet className="w-3 h-3 mr-1" />
                          Manual Payment
                        </Badge>
                      )}
                      <Badge variant="outline" className="bg-purple-50 border-purple-300">
                        <Smartphone className="w-3 h-3 mr-1" />
                        {getGatewayDisplay(tx)}
                      </Badge>
                    </div>

                    {/* User Transaction ID - Highlighted */}
                    {tx.reference && (
                      <div className="mb-4 p-2 bg-green-50 rounded-lg border-2 border-dashed border-green-300">
                        <p className="text-sm font-mono text-green-700">USER TRANSACTION ID: <span className="text-lg font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">{tx.reference.toUpperCase()}</span></p>
                      </div>
                    )}

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Student Info */}
                      {tx.userName && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">STUDENT</p>
                          <div className="flex items-start gap-2">
                            <User className="w-4 h-4 text-slate-600 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">{tx.userName}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {tx.userEmail}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Enrollment Info */}
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <p className="text-xs font-semibold text-muted-foreground mb-1">ENROLLMENT</p>
                        <div className="flex items-start gap-2">
                          <BookOpen className="w-4 h-4 text-slate-600 mt-0.5" />
                          <div>
                            {tx.examTitle && (
                              <>
                                <p className="text-sm font-medium">Exam: {tx.examTitle}</p>
                              </>
                            )}
                            {tx.programTitle && (
                              <p className="text-sm font-medium">Program: {tx.programTitle}</p>
                            )}
                            {!tx.examTitle && !tx.programTitle && (
                              <p className="text-xs text-muted-foreground">No enrollment info</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Transaction Details */}
                      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 md:col-span-2">
                        <p className="text-xs font-semibold text-muted-foreground mb-2">TRANSACTION DETAILS</p>
                        <div className="space-y-2">
                          {tx.reference && (
                            <p className="text-xs">
                              <span className="font-semibold">User Transaction ID:</span> <span className="font-mono font-bold uppercase bg-blue-100 px-2 py-1 rounded">{tx.reference}</span>
                            </p>
                          )}
                          <p className="text-xs">
                            <span className="font-semibold">Date & Time:</span> {new Date(tx.date || tx.created_at || Date.now()).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Notes if available */}
                      {paymentDetails.notes && (
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 md:col-span-2">
                          <p className="text-xs font-semibold text-yellow-900 mb-1">📝 PAYMENT NOTES</p>
                          <p className="text-xs text-yellow-900">{paymentDetails.notes}</p>
                        </div>
                      )}

                      {/* Admin Notes if available */}
                      {tx.admin_notes && (
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 md:col-span-2">
                          <p className="text-xs font-semibold text-blue-900 mb-1">📋 ADMIN NOTES</p>
                          <p className="text-xs text-blue-900 whitespace-pre-wrap">{tx.admin_notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {/* Payment Proof Button */}
                      {hasPaymentProof && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewProof(tx)}
                          className="flex-1"
                        >
                          <ImageIcon className="w-4 h-4 mr-2" />
                          View Proof
                        </Button>
                      )}

                      {/* Legacy Receipt Button */}
                      {hasLegacyReceipt && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewProof(tx)}
                          className="flex-1"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Receipt
                        </Button>
                      )}

                      {/* Download Receipt Button */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPaymentDetails(tx)}
                        className="flex-1"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>

                      {/* Approve Button (for manual payments) */}
                      {showApprovalButtons && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => handleApprovePayment(tx)}
                            className="bg-green-600 hover:bg-green-700 flex-1"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleChangeStatus(tx)}
                            className="flex-1"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}

                      {/* Change Status Button (for approved transactions) */}
                      {!showApprovalButtons && status !== 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleChangeStatus(tx)}
                          className="flex-1"
                        >
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Change Status
                        </Button>
                      )}
                    </div>

                    {/* Download Payment Details Option */}
                    <div className="mt-4 pt-3 border-t">
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalTransactions > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalTransactions)} of {totalTransactions} transactions
            </div>
            <div className="flex items-center gap-2">
              <select className="px-2 py-1 border rounded" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1}>Previous</Button>
              <span className="px-3 py-1 text-sm">Page {currentPage} of {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages}>Next</Button>
            </div>
          </div>
        )}

        {/* Approval Dialog */}
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Review Payment</DialogTitle>
              <DialogDescription>
                Review and approve or reject this manual payment submission.
              </DialogDescription>
            </DialogHeader>
            
            {selectedTransaction && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-semibold">৳ {selectedTransaction.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Method</p>
                    <p className="font-semibold">{selectedTransaction.payment_method || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Student</p>
                    <p className="font-semibold">{selectedTransaction.userName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-semibold">
                      {new Date(selectedTransaction.date || selectedTransaction.created_at || Date.now()).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Payment Proof Preview */}
                {(() => {
                  const paymentDetails = typeof selectedTransaction.payment_details === 'string' 
                    ? JSON.parse(selectedTransaction.payment_details) 
                    : selectedTransaction.payment_details || {}
                  
                  if (paymentDetails.payment_proof) {
                    return (
                      <div>
                        <Label>Payment Proof</Label>
                        <div className="mt-2 border rounded-lg overflow-hidden">
                          <img 
                            src={paymentDetails.payment_proof} 
                            alt="Payment Proof" 
                            className="w-full max-h-[300px] object-contain bg-muted cursor-pointer"
                            onClick={() => {
                              setProofImageUrl(paymentDetails.payment_proof)
                              setShowProofDialog(true)
                            }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Click to view full size</p>
                      </div>
                    )
                  }
                  return null
                })()}

                <div>
                  <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
                  <Textarea
                    id="admin-notes"
                    placeholder="Add notes about this approval/rejection..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowApprovalDialog(false)}
                disabled={processingAction}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => confirmApproval(false)}
                disabled={processingAction}
              >
                <X className="w-4 h-4 mr-1" />
                {processingAction ? 'Processing...' : 'Reject'}
              </Button>
              <Button
                variant="default"
                onClick={() => confirmApproval(true)}
                disabled={processingAction}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-1" />
                {processingAction ? 'Processing...' : 'Approve'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Status Change Dialog */}
        <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Payment Status</DialogTitle>
              <DialogDescription>
                Update the status of this transaction. This will affect the student's enrollment and payment record.
              </DialogDescription>
            </DialogHeader>
            
            {selectedTransaction && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-semibold">৳ {selectedTransaction.amount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current Status</p>
                    <Badge variant={getStatusColor(getStatusDisplay(selectedTransaction)) as any}>
                      {getStatusDisplay(selectedTransaction).toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Student</p>
                    <p className="font-semibold">{selectedTransaction.userName}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Method</p>
                    <p className="font-semibold">{selectedTransaction.payment_method || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="new-status">New Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="refunded">Refunded</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status-notes">Admin Notes (Optional)</Label>
                  {selectedTransaction.admin_notes && (
                    <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                      <p className="text-xs text-muted-foreground mb-1">Existing Notes:</p>
                      <p className="text-sm text-blue-900 whitespace-pre-wrap">{selectedTransaction.admin_notes}</p>
                    </div>
                  )}
                  <Textarea
                    id="status-notes"
                    placeholder="Add notes about this status change..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowStatusDialog(false)}
                disabled={processingAction}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={confirmStatusChange}
                disabled={processingAction || !newStatus}
              >
                {processingAction ? 'Processing...' : 'Update Status'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Payment Proof Dialog */}
        <Dialog open={showProofDialog} onOpenChange={setShowProofDialog}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Payment Proof</DialogTitle>
              <DialogDescription>
                Image uploaded by the student as proof of payment
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex justify-center items-center min-h-[400px] bg-muted rounded-lg">
              {proofImageUrl ? (
                <img 
                  src={proofImageUrl} 
                  alt="Payment Proof" 
                  className="max-w-full max-h-[600px] object-contain rounded-lg"
                />
              ) : (
                <p className="text-muted-foreground">No image available</p>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowProofDialog(false)}
              >
                Close
              </Button>
              {proofImageUrl && (
                <Button
                  variant="default"
                  onClick={() => window.open(proofImageUrl, '_blank')}
                >
                  Open in New Tab
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Export Dialog */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Export Transactions</DialogTitle>
              <DialogDescription>
                Export transaction history in CSV or XML format within a date range
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="export-format">Format</Label>
                <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                    <SelectItem value="xml">XML (Data)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={exportStartDate}
                  onChange={(e) => setExportStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={exportEndDate}
                  onChange={(e) => setExportEndDate(e.target.value)}
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  <strong>Format Details:</strong>
                  <br />
                  • <strong>CSV:</strong> Import into Excel, Google Sheets, or other spreadsheet applications
                  <br />
                  • <strong>XML:</strong> Machine-readable format for data integration
                </p>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => setShowExportDialog(false)}
                disabled={exportLoading}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleExportTransactions}
                disabled={exportLoading || !exportStartDate || !exportEndDate}
              >
                {exportLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
  )
}
