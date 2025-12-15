import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/db';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * PATCH /api/notifications/[id]
 * Mark notification as read/archived
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { is_read, is_archived } = body;

    // Verify ownership
    const [notification] = await pool.query(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [id, decoded.userId]
    ) as any;

    if (!notification || notification.length === 0) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (typeof is_read !== 'undefined') {
      updates.push('is_read = ?');
      values.push(is_read);
      if (is_read) {
        updates.push('read_at = NOW()');
      }
    }

    if (typeof is_archived !== 'undefined') {
      updates.push('is_archived = ?');
      values.push(is_archived);
    }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE notifications SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
        values
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification updated successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id]
 * Delete a notification
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Verify ownership
    const [notification] = await pool.query(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ?',
      [id, decoded.userId]
    ) as any;

    if (!notification || notification.length === 0) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    await pool.query(
      'DELETE FROM notifications WHERE id = ?',
      [id]
    );

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
