import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/db';
import { socketEvents } from '@/lib/socket';

/**
 * GET /api/notifications
 * Fetch user's notifications
 */
export async function GET(request: NextRequest) {
  try {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unread') === 'true';

    let query = 'SELECT * FROM notifications WHERE user_id = ?';
    const params: any[] = [decoded.userId];

    if (unreadOnly) {
      query += ' AND is_read = FALSE';
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [notifications] = await pool.query(query, params) as any;

    // Get unread count
    const [unreadResult] = await pool.query(
      `SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0`,
      [decoded.userId]
    ) as any;

    const unreadCount = (Array.isArray(unreadResult) && unreadResult[0]) ? unreadResult[0].unread : 0;

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM notifications WHERE user_id = ?${unreadOnly ? ' AND is_read = FALSE' : ''}`,
      [decoded.userId]
    ) as any;

    const total = (Array.isArray(countResult) && countResult[0]) ? countResult[0].total : 0;

    return NextResponse.json({
      notifications: Array.isArray(notifications) ? notifications : [],
      total,
      unread: unreadCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Create a notification (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      user_id,
      type,
      category,
      title,
      message,
      description,
      action_url,
      action_label,
      priority,
      send_email,
      send_sms,
      send_push,
      related_entity_type,
      related_entity_id,
    } = body;

    const notificationId = crypto.randomUUID();

    const [result] = await pool.query(
      `INSERT INTO notifications (
        user_id, type, category, title, message, description,
        action_url, action_label, priority, send_email, send_sms, send_push,
        related_entity_type, related_entity_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        user_id, type, category || 'general', title, message, description,
        action_url, action_label, priority || 'normal', send_email || false, send_sms || false,
        send_push || true, related_entity_type, related_entity_id,
      ]
    ) as any;

    const insertId = (result && result.insertId) ? result.insertId : crypto.randomUUID();

    try {
      socketEvents.emitNotification(user_id, {
        id: insertId,
        user_id,
        type,
        category: category || 'general',
        title,
        message,
        description,
        action_url,
        action_label,
        priority: priority || 'normal',
        is_read: false,
        created_at: new Date().toISOString()
      });
    } catch (socketError) {
      // Socket emission failed, but notification was created
    }

    return NextResponse.json({
      success: true,
      id: insertId,
      message: 'Notification created successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
