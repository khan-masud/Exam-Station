"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

type Tx = {
  id: string
  amount: number
  payment_method?: string
  payment_details: any
  date?: string
  created_at?: string
  payment_status?: string
  programTitle?: string
  examTitle?: string
}

export default function PaymentHistoryPage() {
  const [transactions, setTransactions] = useState<Tx[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState("")

  const fetchPayments = async (p = 1) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/payments?page=${p}&limit=${limit}`, { credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        const items = data.transactions || []
        setTransactions(items)
        const totalCount = data.summary?.totalTransactions || 0
        setTotal(totalCount)
        setTotalPages(Math.max(1, Math.ceil(totalCount / limit)))
      } else {
        console.error('Failed fetching payments', data)
      }
    } catch (err) {
      console.error('Fetch error', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // fetch when page changes
    fetchPayments(page)
  }, [page])

  const openProof = (tx: Tx) => {
    const details = typeof tx.payment_details === 'string' ? JSON.parse(tx.payment_details) : tx.payment_details || {}
    const url = details.payment_proof
    if (url) window.open(url, '_blank')
    else alert('No payment proof available')
  }

  const formatDate = (d?: string) => new Date(d || Date.now()).toLocaleString()

  const getStatusClass = (s: string) => {
    const st = (s || '').toLowerCase()
    if (st === 'approved' || st === 'completed') return 'text-green-700 bg-green-50'
    if (st === 'pending' || st === 'pending_approval') return 'text-amber-800 bg-amber-50'
    if (st === 'cancelled' || st === 'rejected' || st === 'failed') return 'text-red-700 bg-red-50'
    if (st === 'refunded') return 'text-blue-700 bg-blue-50'
    return 'text-muted-foreground bg-transparent'
  }

  const filtered = transactions.filter(t => {
    const details = typeof t.payment_details === 'string' ? JSON.parse(t.payment_details) : t.payment_details || {}
    const userTx = details.transaction_id || ''
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      t.id.toLowerCase().includes(q) ||
      (t.programTitle || '').toLowerCase().includes(q) ||
      (t.examTitle || '').toLowerCase().includes(q) ||
      (t.payment_method || '').toLowerCase().includes(q) ||
      userTx.toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Payment History</h1>
        <div className="w-1/3">
          <Input placeholder="Search by transaction id, user tx id, program or exam" value={search} onChange={(e:any)=>setSearch(e.target.value)} className="pl-3" />
        </div>
      </div>

      {loading && <div className="py-8 text-center">Loading...</div>}

      <div className="space-y-4">
        {filtered.map(tx => {
          const details = typeof tx.payment_details === 'string' ? JSON.parse(tx.payment_details) : tx.payment_details || {}
          const status = tx.payment_status || 'pending'
          return (
            <Card key={tx.id}>
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">Transaction #{tx.id.substring(0,8)}</h3>
                    <Badge>{status.toUpperCase()}</Badge>
                    {tx.payment_method && <Badge variant="outline">{tx.payment_method}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Amount: <span className="font-medium">৳ {tx.amount.toFixed(2)}</span></p>
                  <p className="text-sm mt-1">Status: <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusClass(status)}`}>{status.replace('_', ' ').toUpperCase()}</span></p>
                  {tx.programTitle && <p className="text-sm text-muted-foreground">Program: <span className="font-medium">{tx.programTitle}</span></p>}
                  {tx.examTitle && <p className="text-sm text-muted-foreground">Exam: <span className="font-medium">{tx.examTitle}</span></p>}
                  {details.transaction_id && <p className="text-sm text-primary">User Transaction ID: {details.transaction_id}</p>}
                  {details.notes && <p className="text-xs text-muted-foreground italic">Notes: {details.notes}</p>}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <p className="text-sm text-muted-foreground">{formatDate(tx.date || tx.created_at)}</p>
                  <div className="flex flex-col gap-2 mt-2 w-48">
                    <Button onClick={() => openProof(tx)} variant={details.payment_proof ? 'default' : 'outline'} size="sm">View Payment Proof</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex items-center justify-center mt-6 gap-4">
        <Button disabled={loading || page <= 1} onClick={() => setPage(p => Math.max(1, p-1))}>Previous</Button>
        <div className="text-sm text-muted-foreground">Page {page} of {totalPages} ({total} transactions)</div>
        <Button disabled={loading || page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p+1))}>Next</Button>
      </div>
    </div>
  )
}
