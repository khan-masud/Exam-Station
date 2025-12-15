import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { createNotification } from '@/lib/notification-service';

/**
 * POST /api/notifications/test
 * Create a test notification for debugging
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

    // Create a test notification for the current user
    const notificationId = await createNotification({
      recipientId: decoded.userId,
      type: 'test',
      title: 'Test Notification',
      message: `This is a test notification created at ${new Date().toLocaleString()}`,
      link: '/student/dashboard'
    });

    return NextResponse.json({
      success: true,
      notificationId,
      message: 'Test notification created successfully',
      userId: decoded.userId
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create test notification', details: error.message },
      { status: 500 }
    );
  }
}
