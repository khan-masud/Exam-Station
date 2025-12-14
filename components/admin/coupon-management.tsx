"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Percent, 
  DollarSign,
  Calendar,
  Users,
  Tag,
  Loader2
} from "lucide-react"

interface Coupon {
  id: number
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_amount: number | null
  max_discount: number | null
  usage_limit: number | null
  per_user_limit: number
  used_count: number
  valid_from: string | null
  valid_until: string | null
  applicable_to: 'all' | 'programs' | 'exams' | 'specific_items'
  applicable_items: string | null
  is_active: boolean
  created_at: string
  created_by_name?: string
}

export function CouponManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null)
  const [programs, setPrograms] = useState<any[]>([])
  const [exams, setExams] = useState<any[]>([])
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_amount: '',
    max_discount: '',
    usage_limit: '',
    per_user_limit: '1',
    valid_from: '',
    valid_until: '',
    applicable_to: 'all' as 'all' | 'programs' | 'exams' | 'specific_items',
    applicable_items: '',
    is_active: true
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadCoupons()
    loadProgramsAndExams()
  }, [])

  const loadProgramsAndExams = async () => {
    try {
      // Load programs
      const programsRes = await fetch('/api/programs', { credentials: 'include' })
      if (programsRes.ok) {
        const programsData = await programsRes.json()
        setPrograms(programsData.programs || [])
      }

      // Load exams
      const examsRes = await fetch('/api/exams', { credentials: 'include' })
      if (examsRes.ok) {
        const examsData = await examsRes.json()
        setExams(examsData.exams || [])
      }
    } catch (error) {
      console.error('Failed to load programs/exams:', error)
    }
  }

  const loadCoupons = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/coupons', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setCoupons(data.coupons || [])
      }
    } catch (error) {
      console.error('Failed to load coupons:', error)
      toast.error('Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.code || !formData.discount_value) {
      toast.error('Code and discount value are required')
      return
    }

    setSubmitting(true)
    try {
      const url = editingCoupon 
        ? `/api/admin/coupons/${editingCoupon.id}`
        : '/api/admin/coupons'
      
      const method = editingCoupon ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          discount_value: parseFloat(formData.discount_value),
          min_amount: formData.min_amount ? parseFloat(formData.min_amount) : null,
          max_discount: formData.max_discount ? parseFloat(formData.max_discount) : null,
          usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
          per_user_limit: parseInt(formData.per_user_limit),
          valid_from: formData.valid_from || null,
          valid_until: formData.valid_until || null,
        })
      })

      if (response.ok) {
        toast.success(editingCoupon ? 'Coupon updated successfully' : 'Coupon created successfully')
        loadCoupons()
        handleCloseDialog()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to save coupon')
      }
    } catch (error) {
      console.error('Failed to save coupon:', error)
      toast.error('Failed to save coupon')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return

    try {
      const response = await fetch(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        toast.success('Coupon deleted successfully')
        loadCoupons()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete coupon')
      }
    } catch (error) {
      console.error('Failed to delete coupon:', error)
      toast.error('Failed to delete coupon')
    }
  }

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_amount: coupon.min_amount?.toString() || '',
      max_discount: coupon.max_discount?.toString() || '',
      usage_limit: coupon.usage_limit?.toString() || '',
      per_user_limit: coupon.per_user_limit.toString(),
      valid_from: coupon.valid_from ? new Date(coupon.valid_from).toISOString().slice(0, 16) : '',
      valid_until: coupon.valid_until ? new Date(coupon.valid_until).toISOString().slice(0, 16) : '',
      applicable_to: coupon.applicable_to,
      applicable_items: coupon.applicable_items || '',
      is_active: coupon.is_active
    })
    setShowDialog(true)
  }

  const handleCloseDialog = () => {
    setShowDialog(false)
    setEditingCoupon(null)
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: '',
      min_amount: '',
      max_discount: '',
      usage_limit: '',
      per_user_limit: '1',
      valid_from: '',
      valid_until: '',
      applicable_to: 'all',
      applicable_items: '',
      is_active: true
    })
  }

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('Coupon code copied to clipboard')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getApplicableItemsDisplay = (coupon: Coupon) => {
    if (coupon.applicable_to === 'all') {
      return 'All Items'
    }

    if (!coupon.applicable_items) {
      return coupon.applicable_to === 'programs' ? 'All Programs' : 'All Exams'
    }

    const itemIds = coupon.applicable_items.split(',').filter(id => id)
    const items = coupon.applicable_to === 'programs' ? programs : exams
    const names = itemIds
      .map(id => items.find(item => item.id.toString() === id)?.title || `#${id}`)
      .slice(0, 2)

    if (names.length === 0) {
      return coupon.applicable_to === 'programs' ? 'Specific Programs' : 'Specific Exams'
    }

    return names.join(', ') + (itemIds.length > 2 ? ` +${itemIds.length - 2} more` : '')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Coupon Management</CardTitle>
            <CardDescription>
              Create and manage discount coupons for your programs and exams
            </CardDescription>
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Coupon
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No coupons created yet</p>
            <Button className="mt-4" onClick={() => setShowDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Coupon
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="px-2 py-1 bg-primary/10 text-primary rounded font-mono font-semibold">
                        {coupon.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCouponCode(coupon.code)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      {!coupon.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                      {coupon.usage_limit && coupon.used_count >= coupon.usage_limit && (
                        <Badge variant="destructive">Limit Reached</Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="text-muted-foreground">Discount</p>
                        <p className="font-semibold flex items-center gap-1">
                          {coupon.discount_type === 'percentage' ? (
                            <>
                              <Percent className="w-3 h-3" />
                              {coupon.discount_value}%
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-3 h-3" />
                              ৳{coupon.discount_value}
                            </>
                          )}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground">Usage</p>
                        <p className="font-semibold">
                          {coupon.used_count} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : ''}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground">Valid Until</p>
                        <p className="font-semibold">
                          {coupon.valid_until ? formatDate(coupon.valid_until) : 'No expiry'}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-muted-foreground">Applicable To</p>
                        <p className="font-semibold text-xs" title={getApplicableItemsDisplay(coupon)}>
                          {getApplicableItemsDisplay(coupon)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(coupon)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(coupon.id.toString())}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </DialogTitle>
            <DialogDescription>
              Configure your discount coupon settings
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code">Coupon Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., SAVE20"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Discount Type */}
              <div className="space-y-2">
                <Label htmlFor="discount_type">Discount Type *</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value: 'percentage' | 'fixed') => 
                    setFormData({ ...formData, discount_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (৳)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Discount Value */}
              <div className="space-y-2">
                <Label htmlFor="discount_value">
                  {formData.discount_type === 'percentage' ? 'Percentage' : 'Amount'} *
                </Label>
                <Input
                  id="discount_value"
                  type="number"
                  step="0.01"
                  min="0"
                  max={formData.discount_type === 'percentage' ? '100' : undefined}
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  placeholder={formData.discount_type === 'percentage' ? '20' : '100'}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Min Amount */}
              <div className="space-y-2">
                <Label htmlFor="min_amount">Minimum Amount (৳)</Label>
                <Input
                  id="min_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.min_amount}
                  onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
                  placeholder="No minimum"
                />
              </div>

              {/* Max Discount */}
              {formData.discount_type === 'percentage' && (
                <div className="space-y-2">
                  <Label htmlFor="max_discount">Max Discount (৳)</Label>
                  <Input
                    id="max_discount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.max_discount}
                    onChange={(e) => setFormData({ ...formData, max_discount: e.target.value })}
                    placeholder="No limit"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Usage Limit */}
              <div className="space-y-2">
                <Label htmlFor="usage_limit">Total Usage Limit</Label>
                <Input
                  id="usage_limit"
                  type="number"
                  min="0"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                  placeholder="Unlimited"
                />
              </div>

              {/* Per User Limit */}
              <div className="space-y-2">
                <Label htmlFor="per_user_limit">Per User Limit</Label>
                <Input
                  id="per_user_limit"
                  type="number"
                  min="1"
                  value={formData.per_user_limit}
                  onChange={(e) => setFormData({ ...formData, per_user_limit: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Valid From */}
              <div className="space-y-2">
                <Label htmlFor="valid_from">Valid From</Label>
                <Input
                  id="valid_from"
                  type="datetime-local"
                  value={formData.valid_from}
                  onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                />
              </div>

              {/* Valid Until */}
              <div className="space-y-2">
                <Label htmlFor="valid_until">Valid Until</Label>
                <Input
                  id="valid_until"
                  type="datetime-local"
                  value={formData.valid_until}
                  onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                />
              </div>
            </div>

            {/* Applicable To */}
            <div className="space-y-2">
              <Label htmlFor="applicable_to">Applicable To</Label>
              <Select
                value={formData.applicable_to}
                onValueChange={(value: 'all' | 'programs' | 'exams' | 'specific_items') => 
                  setFormData({ ...formData, applicable_to: value, applicable_items: '' })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  <SelectItem value="programs">Specific Programs</SelectItem>
                  <SelectItem value="exams">Specific Exams</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Specific Items Selection */}
            {(formData.applicable_to === 'programs' || formData.applicable_to === 'exams') && (
              <div className="space-y-2">
                <Label>
                  Select {formData.applicable_to === 'programs' ? 'Programs' : 'Exams'}
                </Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                  {formData.applicable_to === 'programs' ? (
                    programs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No programs available</p>
                    ) : (
                      programs.map((program) => {
                        const selectedItems = formData.applicable_items ? formData.applicable_items.split(',') : []
                        const isSelected = selectedItems.includes(program.id.toString())
                        
                        return (
                          <div key={program.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`program-${program.id}`}
                              checked={isSelected}
                              onChange={(e) => {
                                let items = selectedItems.filter(id => id)
                                if (e.target.checked) {
                                  items.push(program.id.toString())
                                } else {
                                  items = items.filter(id => id !== program.id.toString())
                                }
                                setFormData({ ...formData, applicable_items: items.join(',') })
                              }}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor={`program-${program.id}`} className="cursor-pointer font-normal">
                              {program.title}
                            </Label>
                          </div>
                        )
                      })
                    )
                  ) : (
                    exams.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No exams available</p>
                    ) : (
                      exams.map((exam) => {
                        const selectedItems = formData.applicable_items ? formData.applicable_items.split(',') : []
                        const isSelected = selectedItems.includes(exam.id.toString())
                        
                        return (
                          <div key={exam.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`exam-${exam.id}`}
                              checked={isSelected}
                              onChange={(e) => {
                                let items = selectedItems.filter(id => id)
                                if (e.target.checked) {
                                  items.push(exam.id.toString())
                                } else {
                                  items = items.filter(id => id !== exam.id.toString())
                                }
                                setFormData({ ...formData, applicable_items: items.join(',') })
                              }}
                              className="rounded border-gray-300"
                            />
                            <Label htmlFor={`exam-${exam.id}`} className="cursor-pointer font-normal">
                              {exam.title}
                            </Label>
                          </div>
                        )
                      })
                    )
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Selected: {formData.applicable_items ? formData.applicable_items.split(',').filter(id => id).length : 0}
                </p>
              </div>
            )}

            {/* Active Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <Label>Active Status</Label>
                <p className="text-sm text-muted-foreground">
                  Only active coupons can be used by students
                </p>
              </div>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingCoupon ? 'Update Coupon' : 'Create Coupon'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
