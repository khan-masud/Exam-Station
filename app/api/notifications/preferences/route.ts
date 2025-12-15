import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import pool from '@/lib/db';

/**
 * GET /api/notifications/preferences
 * Fetch user's notification preferences
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

    const [preferences] = await pool.query(
      'SELECT * FROM notification_preferences WHERE user_id = ?',
      [decoded.id]
    ) as any;

    if (!preferences || preferences.length === 0) {
      // Create default preferences
      const prefId = crypto.randomUUID();
      await pool.query(
        `INSERT INTO notification_preferences (id, user_id) VALUES (?, ?)`,
        [prefId, decoded.id]
      );

      const [newPrefs] = await pool.query(
        'SELECT * FROM notification_preferences WHERE user_id = ?',
        [decoded.id]
      ) as any;

      return NextResponse.json(newPrefs[0]);
    }

    return NextResponse.json(preferences[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/preferences
 * Update user's notification preferences
 */
export async function PUT(request: NextRequest) {
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

    const body = await request.json();

    // Get all preference fields from request body
    const updates: string[] = [];
    const values: any[] = [];

    const preferenceFields = [
      'email_exam_results',
      'email_exam_reminders',
      'email_system_updates',
      'email_support_responses',
      'email_announcements',
      'email_marketing',
      'inapp_exam_results',
      'inapp_exam_reminders',
      'inapp_system_updates',
      'inapp_support_responses',
      'inapp_announcements',
      'sms_exam_results',
      'sms_exam_reminders',
      'sms_urgent_alerts',
      'push_exam_results',
      'push_exam_reminders',
      'push_support_responses',
      'push_announcements',
      'quiet_hours_enabled',
      'quiet_hours_start',
      'quiet_hours_end',
      'digest_frequency',
    ];

    preferenceFields.forEach(field => {
      if (body.hasOwnProperty(field)) {
        updates.push(`${field} = ?`);
        values.push(body[field]);
      }
    });

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      values.push(decoded.id);

      await pool.query(
        `UPDATE notification_preferences SET ${updates.join(', ')} WHERE user_id = ?`,
        values
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
