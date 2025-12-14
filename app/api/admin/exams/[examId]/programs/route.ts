import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

// GET - Fetch programs assigned to an exam
export async function GET(req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { examId } = await params

    const [programs] = await pool.execute<RowDataPacket[]>(
      `SELECT p.id, p.title, p.enrollment_fee, p.status
       FROM exam_programs ep
       JOIN programs p ON ep.program_id = p.id
       WHERE ep.exam_id = ?`,
      [examId]
    )

    return NextResponse.json({ programs })
  } catch (error) {
    console.error('Fetch exam programs error:', error)
    return NextResponse.json({ error: 'Failed to fetch programs' }, { status: 500 })
  }
}

// POST - Assign programs to an exam
export async function POST(req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { examId } = await params
    const { programIds } = await req.json()

    if (!Array.isArray(programIds)) {
      return NextResponse.json({ error: 'programIds must be an array' }, { status: 400 })
    }

    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      // Delete existing program assignments
      await connection.execute(
        'DELETE FROM exam_programs WHERE exam_id = ?',
        [examId]
      )

      // Insert new program assignments
      if (programIds.length > 0) {
        const values = programIds.map(programId => [examId, programId])
        await connection.query(
          'INSERT INTO exam_programs (exam_id, program_id) VALUES ?',
          [values]
        )
      }

      await connection.commit()
      return NextResponse.json({ 
        success: true, 
        message: 'Programs updated successfully',
        count: programIds.length 
      })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Update exam programs error:', error)
    return NextResponse.json({ error: 'Failed to update programs' }, { status: 500 })
  }
}
