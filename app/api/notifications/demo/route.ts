import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { createNotification } from '@/lib/notification-service';

/**
 * POST /api/notifications/demo
 * Create a demo notification for testing
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
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Create a demo notification for the current user
    const notificationId = await createNotification({
      recipientId: decoded.userId,
      type: 'system_announcement',
      title: '🎉 Welcome to the Notification System!',
      message: 'This is a demo notification. You\'ll receive notifications for exam results, payment updates, support ticket replies, and more!',
      link: '/student/dashboard'
    });

    return NextResponse.json({
      success: true,
      message: 'Demo notification sent successfully!',
      notificationId
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to send demo notification' },
      { status: 500 }
    );
  }
}
