import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { filename } = await params
    const backupPath = join(process.cwd(), 'backups', filename)

    try {
      await unlink(backupPath)
      return NextResponse.json({ success: true, message: 'Backup deleted successfully' })
    } catch (error) {
      return NextResponse.json({ error: 'Backup file not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Delete backup error:', error)
    return NextResponse.json({ error: 'Failed to delete backup' }, { status: 500 })
  }
}
