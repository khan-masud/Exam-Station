"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, DollarSign, CheckCircle, Clock, XCircle, 
  ArrowLeft, Loader2, Upload, FileText 
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { handleFileInputChange, formatFileSize } from "@/lib/utils/file-validation"

// This page uses useSearchParams() which requires dynamic rendering
export const dynamic = 'force-dynamic'

interface Program {
  id: string
  title: string
  description: string | null
  enrollment_fee: number
}

interface PaymentMethod {
  id: string
  name: string
  instructions: string
  details?: {
    bankName?: string
    accountName?: string
    accountNumber?: string
    routingNumber?: string
    swiftCode?: string
    branch?: string
    provider?: string
    number?: string
  } | null
}

interface PaymentConfig {
  currency: string
  requirePaymentProof: boolean
  autoApprove: boolean
}

export default function StudentPaymentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const programId = searchParams.get('programId')
  
  const [program, setProgram] = useState<Program | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    currency: 'USD',
    requirePaymentProof: true,
    autoApprove: false
  })
  const [selectedMethod, setSelectedMethod] = useState("")
  const [transactionId, setTransactionId] = useState("")
  const [amount, setAmount] = useState("")
  const [notes, setNotes] = useState("")
  const [receipt, setReceipt] = useState<File | null>(null)
  const [couponCode, setCouponCode] = useState("")
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [validatingCoupon, setValidatingCoupon] = useState(false)
  const [originalAmount, setOriginalAmount] = useState("")

  useEffect(() => {
    if (programId) {
      fetchProgram()
      fetchPaymentMethods()
    }
  }, [programId])

  const fetchProgram = async () => {
    try {
      const response = await fetch(`/api/programs/${programId}`, {
        credentials: 'include'
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch program')
      }

      const data = await response.json()
      setProgram(data.program)
      
      // Set amount from program fee, with fallback
      const fee = data.program.enrollment_fee
      if (fee != null && !isNaN(Number(fee))) {
        const feeAmount = Number(fee).toFixed(2)
        setAmount(feeAmount)
        setOriginalAmount(feeAmount)
      } else {
        setAmount('0.00')
        setOriginalAmount('0.00')
        toast.error('Program enrollment fee is not set')
      }
    } catch (error) {
      console.error('Failed to fetch program:', error)
      toast.error('Failed to load program details')
      router.push('/student/programs')
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payment-methods', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setPaymentMethods(data.methods || [])
        if (data.config) {
          setPaymentConfig(data.config)
        }
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileInputChange(
      e,
      {
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
        maxNameLength: 200
      },
      (file) => {
        setReceipt(file)
        toast.success(`File "${file.name}" (${formatFileSize(file.size)}) selected successfully`)
      }
    )
  }

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code')
      return
    }

    setValidatingCoupon(true)
    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          code: couponCode,
          amount: parseFloat(originalAmount),
          itemType: 'program',
          itemId: programId
        })
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        setAppliedCoupon(data)
        setAmount(data.finalAmount.toFixed(2))
        toast.success(`Coupon applied! You save ৳${data.discountAmount.toFixed(2)}`)
      } else {
        toast.error(data.error || 'Invalid coupon code')
      }
    } catch (error) {
      toast.error('Failed to validate coupon')
    } finally {
      setValidatingCoupon(false)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setAmount(originalAmount)
    toast.info('Coupon removed')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedMethod) {
      toast.error('Please select a payment method')
      return
    }

    if (!transactionId.trim()) {
      toast.error('Please enter transaction/reference ID')
      return
    }

    if (!amount || Number(amount) <= 0 || isNaN(Number(amount))) {
      toast.error('Please enter a valid amount')
      return
    }

    if (paymentConfig.requirePaymentProof && !receipt) {
      toast.error('Payment receipt is required')
      return
    }

    setSubmitting(true)
    try {
      // Validate and parse amount
      const parsedAmount = parseFloat(amount)
      
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        toast.error('Please enter a valid amount')
        setSubmitting(false)
        return
      }

      // Create FormData to send file
      const formData = new FormData()
      formData.append('programId', programId!)
      formData.append('amount', parsedAmount.toString())
      formData.append('paymentMethod', selectedMethod)
      formData.append('transactionId', transactionId)
      formData.append('notes', notes)
      
      // Add coupon info if applied
      if (appliedCoupon) {
        formData.append('couponId', appliedCoupon.coupon.id)
        formData.append('originalAmount', originalAmount)
        formData.append('discountAmount', appliedCoupon.discountAmount.toString())
      }
      
      // Add payment details (just the method name, not receipt info)
      const paymentDetailsObj = {
        payment_method_name: paymentMethods.find(m => m.id === selectedMethod)?.name || ''
      }
      formData.append('paymentDetails', JSON.stringify(paymentDetailsObj))
      
      // Add receipt file if present (backend will handle saving and creating payment_proof URL)
      if (receipt) {
        formData.append('receipt', receipt)
      }


      const response = await fetch('/api/payments/manual', {
        method: 'POST',
        credentials: 'include',
        // Don't set Content-Type header - let browser set it with boundary for multipart/form-data
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Payment submitted successfully! Waiting for admin approval.')
        router.push('/student/programs')
      } else {
        toast.error(data.error || 'Failed to submit payment')
      }
    } catch (error) {
      toast.error('Failed to submit payment')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!program) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardContent className="p-12 text-center">
            <XCircle className="w-16 h-16 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Program Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The program you're trying to pay for could not be found.
            </p>
            <Link href="/student/programs">
              <Button>Back to Programs</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-card to-background p-6 pt-20 lg:pt-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/student/programs">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Programs
            </Button>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Program Enrollment Payment</h1>
          <p className="text-muted-foreground">
            Complete your payment to enroll in the program
          </p>
        </div>

        {/* Program Info */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Program Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Program Name</Label>
              <p className="text-lg font-semibold">{program.title}</p>
            </div>
            {program.description && (
              <div>
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-sm">{program.description}</p>
              </div>
            )}
            <div className="flex items-center gap-2 p-4 bg-amber-50 dark:bg-amber-950 rounded-lg">
              <DollarSign className="w-6 h-6 text-amber-600" />
              <div>
                <p className="text-sm text-muted-foreground">Enrollment Fee</p>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-500">
                  ৳ {Number(program.enrollment_fee).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Information</CardTitle>
            <CardDescription>
              {paymentConfig.autoApprove 
                ? 'Your payment will be automatically approved and you will be enrolled immediately'
                : 'Submit your payment details for admin verification'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {paymentConfig.autoApprove && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-100">Auto-Approval Enabled</p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Your enrollment will be activated immediately after payment submission
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {!paymentConfig.autoApprove && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 dark:text-blue-100">Admin Approval Required</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      An administrator will review and approve your payment before enrollment is activated
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Method */}
              <div className="space-y-2">
                <Label>Payment Method *</Label>
                {paymentMethods.length === 0 ? (
                  <div className="p-4 border border-dashed rounded-lg text-center text-muted-foreground">
                    <p className="text-sm">No payment methods configured yet.</p>
                    <p className="text-xs mt-1">Please contact administrator.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          selectedMethod === method.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex items-center justify-center ${
                            selectedMethod === method.id
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground'
                          }`}>
                            {selectedMethod === method.id && (
                              <CheckCircle className="w-4 h-4 text-primary-foreground" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold mb-1">{method.name}</p>
                            
                            {/* Bank Transfer Details */}
                            {method.id === 'bank_transfer' && method.details && (
                              <div className="mt-2 p-3 bg-muted/50 rounded text-xs space-y-1">
                                {method.details.bankName && (
                                  <p><span className="font-medium">Bank:</span> {method.details.bankName}</p>
                                )}
                                {method.details.branch && (
                                  <p><span className="font-medium">Branch:</span> {method.details.branch}</p>
                                )}
                                {method.details.accountName && (
                                  <p><span className="font-medium">Account Name:</span> {method.details.accountName}</p>
                                )}
                                {method.details.accountNumber && (
                                  <p><span className="font-medium">Account Number:</span> {method.details.accountNumber}</p>
                                )}
                                {method.details.routingNumber && (
                                  <p><span className="font-medium">Routing Number:</span> {method.details.routingNumber}</p>
                                )}
                                {method.details.swiftCode && (
                                  <p><span className="font-medium">SWIFT Code:</span> {method.details.swiftCode}</p>
                                )}
                              </div>
                            )}

                            {/* Mobile Money Details */}
                            {method.id === 'mobile_money' && method.details && (
                              <div className="mt-2 p-3 bg-muted/50 rounded text-xs space-y-1">
                                {method.details.provider && (
                                  <p><span className="font-medium">Provider:</span> {method.details.provider}</p>
                                )}
                                {method.details.number && (
                                  <p><span className="font-medium">Number:</span> {method.details.number}</p>
                                )}
                                {method.details.accountName && (
                                  <p><span className="font-medium">Account Name:</span> {method.details.accountName}</p>
                                )}
                              </div>
                            )}

                            {/* General Instructions */}
                            {(!method.details || (method.id !== 'bank_transfer' && method.id !== 'mobile_money')) && (
                              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                                {method.instructions}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Coupon Code */}
              <div className="space-y-2">
                <Label htmlFor="couponCode">Coupon Code (Optional)</Label>
                {appliedCoupon ? (
                  <div className="p-4 border-2 border-green-500 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-500" />
                        <span className="font-semibold text-green-900 dark:text-green-100">
                          Coupon Applied: {appliedCoupon.coupon.code}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeCoupon}
                        className="h-8 text-xs"
                      >
                        Remove
                      </Button>
                    </div>
                    {appliedCoupon.coupon.description && (
                      <p className="text-xs text-green-700 dark:text-green-300 mb-3">
                        {appliedCoupon.coupon.description}
                      </p>
                    )}
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Original</p>
                        <p className="font-semibold text-gray-900 dark:text-gray-100">৳{appliedCoupon.originalAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Discount</p>
                        <p className="font-semibold text-green-600 dark:text-green-500">-৳{appliedCoupon.discountAmount.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Final Amount</p>
                        <p className="font-bold text-lg text-gray-900 dark:text-gray-100">৳{appliedCoupon.finalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      id="couponCode"
                      placeholder="Enter coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      disabled={validatingCoupon}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={validateCoupon}
                      disabled={validatingCoupon || !couponCode.trim()}
                    >
                      {validatingCoupon ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Apply'
                      )}
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Have a discount code? Enter it here to reduce your payment amount
                </p>
              </div>

              {/* Transaction ID */}
              <div className="space-y-2">
                <Label htmlFor="transactionId">Transaction/Reference ID *</Label>
                <Input
                  id="transactionId"
                  placeholder="e.g., TXN123456789"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the transaction or reference ID from your payment
                </p>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">Amount Paid *</Label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-sm text-muted-foreground">
                    ৳
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-16"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter the exact amount you paid in BDT
                </p>
              </div>

              {/* Receipt Upload */}
              <div className="space-y-2">
                <Label htmlFor="receipt">
                  Payment Receipt {paymentConfig.requirePaymentProof ? '*' : '(Optional)'}
                </Label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    id="receipt"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="receipt" className="cursor-pointer">
                    {receipt ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <FileText className="w-5 h-5" />
                        <span className="text-sm font-medium">{receipt.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            setReceipt(null)
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">Click to upload receipt</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PNG, JPG, or PDF (max 5MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <textarea
                  id="notes"
                  placeholder="Any additional information about your payment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background min-h-[100px]"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/student/programs')}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || !selectedMethod}
                  className="flex-1"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit Payment
                    </>
                  )}
                </Button>
              </div>

              {/* Info Notice */}
              <div className="flex items-start gap-2 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-blue-700 dark:text-blue-400">
                  <p className="font-semibold mb-1">Payment Verification</p>
                  <p className="text-xs">
                    Your payment will be reviewed by an administrator. You will be enrolled 
                    in the program once your payment is approved.
                  </p>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
