import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import { join } from 'path'

export async function GET(
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
      const stats = await stat(backupPath)
      const fileStream = createReadStream(backupPath)

      return new NextResponse(fileStream as any, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Length': stats.size.toString(),
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    } catch (error) {
      return NextResponse.json({ error: 'Backup file not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Download backup error:', error)
    return NextResponse.json({ error: 'Failed to download backup' }, { status: 500 })
  }
}
