import pool from './db';
import { socketEvents } from './socket';

export interface NotificationData {
  recipientId: string;
  senderId?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  actionLabel?: string;
}

/**
 * Create a notification in the database
 */
export async function createNotification(data: NotificationData) {
  try {
    const [result] = await pool.query(
      `INSERT INTO notifications 
       (user_id, type, title, message, action_url, action_label) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.recipientId,
        data.type,
        data.title,
        data.message,
        data.link || null,
        data.actionLabel || null
      ]
    ) as any;

    const notificationId = result.insertId;

    // Try to emit socket event, but don't fail if it doesn't work
    try {
      if (typeof socketEvents !== 'undefined' && socketEvents.emitNotification) {
        socketEvents.emitNotification(data.recipientId, {
          id: notificationId,
          user_id: data.recipientId,
          type: data.type,
          title: data.title,
          message: data.message,
          action_url: data.link || null,
          is_read: false,
          created_at: new Date().toISOString()
        });
      }
    } catch (socketError) {
      // Socket emission failed, but notification was created successfully
      // This is okay - polling will pick it up
    }

    return notificationId;
  } catch (error) {
    throw error;
  }
}

/**
 * Send notifications to multiple users
 */
export async function createBulkNotifications(notifications: NotificationData[]) {
  const promises = notifications.map(notification => createNotification(notification));
  return Promise.all(promises);
}

// ============= EXAM NOTIFICATIONS =============

/**
 * Notify student when exam result is published
 */
export async function notifyExamResultPublished(studentId: string, examId: string, examTitle: string, score: number, totalMarks: number) {
  return createNotification({
    recipientId: studentId,
    type: 'exam_result',
    title: 'Exam Result Published',
    message: `Your result for "${examTitle}" is now available. You scored ${score}/${totalMarks}.`,
    link: `/student/results`,
    actionLabel: 'View Results'
  });
}

/**
 * Notify student about upcoming exam
 */
export async function notifyUpcomingExam(studentId: string, examId: string, examTitle: string, startTime: Date) {
  const timeUntil = Math.floor((startTime.getTime() - Date.now()) / (1000 * 60)); // minutes
  const timeText = timeUntil < 60 ? `${timeUntil} minutes` : `${Math.floor(timeUntil / 60)} hours`;
  
  return createNotification({
    recipientId: studentId,
    type: 'exam_reminder',
    title: 'Upcoming Exam Reminder',
    message: `"${examTitle}" starts in ${timeText}. Make sure you're prepared!`,
    link: `/student/browse-exams`,
    actionLabel: 'View Exams'
  });
}

/**
 * Notify student when exam registration is approved
 */
export async function notifyExamRegistrationApproved(studentId: string, examId: string, examTitle: string) {
  return createNotification({
    recipientId: studentId,
    type: 'exam_registration',
    title: 'Exam Registration Approved',
    message: `Your registration for "${examTitle}" has been approved. You can now take the exam.`,
    link: `/student/browse-exams`,
    actionLabel: 'Take Exam'
  });
}

/**
 * Notify student when exam is live
 */
export async function notifyExamNowLive(studentId: string, examId: string, examTitle: string) {
  return createNotification({
    recipientId: studentId,
    type: 'exam_live',
    title: 'Exam is Now Live!',
    message: `"${examTitle}" is now available. Click here to start.`,
    link: `/student/browse-exams`,
    actionLabel: 'Start Exam'
  });
}

// ============= PAYMENT NOTIFICATIONS =============

/**
 * Notify student about payment confirmation
 */
export async function notifyPaymentReceived(studentId: string, paymentId: string, amount: number, purpose: string, currency: string = 'BDT') {
  return createNotification({
    recipientId: studentId,
    type: 'payment_received',
    title: 'Payment Approved ✓',
    message: `Your payment of ${currency} ${amount} for "${purpose}" has been approved and confirmed.`,
    link: `/student/payments`,
    actionLabel: 'View Payments'
  });
}

/**
 * Notify student when payment is pending verification
 */
export async function notifyPaymentPending(studentId: string, paymentId: string, amount: number, currency: string = 'BDT') {
  return createNotification({
    recipientId: studentId,
    type: 'payment_pending',
    title: 'Payment Under Verification',
    message: `Your payment of ${currency} ${amount} is being verified. You'll be notified once confirmed.`,
    link: `/student/payments`,
    actionLabel: 'View Status'
  });
}

/**
 * Notify student when payment is rejected
 */
export async function notifyPaymentRejected(studentId: string, paymentId: string, amount: number, reason?: string, currency: string = 'BDT') {
  return createNotification({
    recipientId: studentId,
    type: 'payment_rejected',
    title: 'Payment Rejected ✗',
    message: `Your payment of ${currency} ${amount} was rejected${reason ? `: ${reason}` : ''}. Please contact support or try again.`,
    link: `/student/payments`,
    actionLabel: 'View Details'
  });
}

// ============= SUPPORT TICKET NOTIFICATIONS =============

/**
 * Notify student when support ticket gets a reply
 */
export async function notifySupportReply(studentId: string, ticketId: string, ticketSubject: string) {
  return createNotification({
    recipientId: studentId,
    type: 'support_reply',
    title: 'New Support Reply',
    message: `Your support ticket "${ticketSubject}" has a new reply from our team.`,
    link: `/student/support/${ticketId}`,
    actionLabel: 'View Reply'
  });
}

/**
 * Notify student when support ticket status changes
 */
export async function notifySupportStatusChange(studentId: string, ticketId: string, ticketSubject: string, newStatus: string) {
  return createNotification({
    recipientId: studentId,
    type: 'support_status',
    title: 'Support Ticket Updated',
    message: `Your ticket "${ticketSubject}" status changed to: ${newStatus}`,
    link: `/student/support/${ticketId}`,
    actionLabel: 'View Ticket'
  });
}

/**
 * Notify admin about new support ticket
 */
export async function notifyAdminNewTicket(ticketId: string, ticketSubject: string, studentName: string) {
  // Get all admin users
  const [admins] = await pool.query(
    `SELECT id FROM users WHERE role = 'admin'`
  ) as any;

  if (!admins || admins.length === 0) {
    throw new Error('No admin users found in the system');
  }

  const notifications = admins.map((admin: any) => ({
    recipientId: admin.id,
    type: 'new_support_ticket',
    title: 'New Support Ticket',
    message: `${studentName} created a new ticket: "${ticketSubject}"`,
    link: `/admin/support`,
    actionLabel: 'View Ticket'
  }));

  const results = await createBulkNotifications(notifications);
  return results;
}

/**
 * Notify admin about student reply to ticket
 */
export async function notifyAdminTicketReply(ticketId: string, ticketSubject: string, studentName: string) {
  const [admins] = await pool.query(
    `SELECT id FROM users WHERE role = 'admin'`
  ) as any;

  const notifications = admins.map((admin: any) => ({
    recipientId: admin.id,
    type: 'ticket_reply',
    title: 'New Ticket Reply',
    message: `${studentName} replied to ticket: "${ticketSubject}"`,
    link: `/admin/support/${ticketId}`,
    actionLabel: 'View Reply'
  }));

  return createBulkNotifications(notifications);
}

// ============= PROGRAM NOTIFICATIONS =============

/**
 * Notify student when enrolled in a program
 */
export async function notifyProgramEnrollment(studentId: string, programId: string, programName: string) {
  return createNotification({
    recipientId: studentId,
    type: 'program_enrollment',
    title: 'Program Enrollment Confirmed',
    message: `You've been successfully enrolled in "${programName}".`,
    link: `/student/programs`,
    actionLabel: 'View Programs'
  });
}

/**
 * Notify student when program access expires soon
 */
export async function notifyProgramExpiringSoon(studentId: string, programId: string, programName: string, daysLeft: number) {
  return createNotification({
    recipientId: studentId,
    type: 'program_expiring',
    title: 'Program Access Expiring',
    message: `Your access to "${programName}" will expire in ${daysLeft} days.`,
    link: `/student/programs`,
    actionLabel: 'Renew Access'
  });
}

// ============= SYSTEM NOTIFICATIONS =============

/**
 * Send system announcement to all users or specific role
 */
export async function sendSystemAnnouncement(
  title: string, 
  message: string, 
  link?: string, 
  role?: 'student' | 'admin' | 'all'
) {
  let query = `SELECT id FROM users WHERE 1=1`;
  const params: any[] = [];

  if (role && role !== 'all') {
    query += ` AND role = ?`;
    params.push(role);
  }

  const [users] = await pool.query(query, params) as any;

  const notifications = users.map((user: any) => ({
    recipientId: user.id,
    type: 'system_announcement',
    title,
    message,
    link: link || undefined
  }));

  return createBulkNotifications(notifications);
}

/**
 * Notify user about account updates
 */
export async function notifyAccountUpdate(userId: string, updateType: string, details: string) {
  return createNotification({
    recipientId: userId,
    type: 'account_update',
    title: 'Account Updated',
    message: `Your ${updateType} has been updated: ${details}`,
    link: `/student/profile`,
    actionLabel: 'View Profile'
  });
}

// ============= ADMIN NOTIFICATIONS =============

/**
 * Notify admin about new user registration
 */
export async function notifyAdminNewUser(userId: string, userName: string, userEmail: string) {
  const [admins] = await pool.query(
    `SELECT id FROM users WHERE role = 'admin'`
  ) as any;

  const notifications = admins.map((admin: any) => ({
    recipientId: admin.id,
    type: 'new_user',
    title: 'New User Registration',
    message: `${userName} (${userEmail}) has registered on the platform.`,
    link: `/admin/users`,
    actionLabel: 'View User'
  }));

  return createBulkNotifications(notifications);
}

/**
 * Notify admin about new payment
 */
export async function notifyAdminNewPayment(paymentId: string, studentName: string, amount: number, method: string, currency: string = 'BDT') {
  const [admins] = await pool.query(
    `SELECT id FROM users WHERE role = 'admin'`
  ) as any;

  const notifications = admins.map((admin: any) => ({
    recipientId: admin.id,
    type: 'new_payment',
    title: 'New Payment Submission',
    message: `${studentName} submitted a payment of ${currency} ${amount} via ${method}.`,
    link: `/admin/payments`,
    actionLabel: 'Review Payment'
  }));

  return createBulkNotifications(notifications);
}

/**
 * Notify admin about exam submission
 */
export async function notifyAdminExamSubmission(examId: string, examTitle: string, studentName: string) {
  const [admins] = await pool.query(
    `SELECT id FROM users WHERE role = 'admin'`
  ) as any;

  const notifications = admins.map((admin: any) => ({
    recipientId: admin.id,
    type: 'exam_submission',
    title: 'New Exam Submission',
    message: `${studentName} completed "${examTitle}" and submitted for evaluation.`,
    link: `/admin/exams`,
    actionLabel: 'Review Exam'
  }));

  return createBulkNotifications(notifications);
}
