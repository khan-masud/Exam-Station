import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const fromNumber = process.env.TWILIO_PHONE_NUMBER

let twilioClient: any = null

if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken)
}

export async function sendSMS(to: string, message: string) {
  if (!twilioClient) {
    return { success: false, error: 'SMS service not configured' }
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to: to
    })

    return { success: true, sid: result.sid }
  } catch (error: any) {
    throw new Error('Failed to send SMS: ' + error.message)
  }
}

export async function sendExamReminderSMS(phone: string, examTitle: string, examDate: string) {
  const message = 'Reminder: Your exam "' + examTitle + '" is scheduled for ' + examDate + '. Good luck!'
  return sendSMS(phone, message)
}

export async function sendResultNotificationSMS(phone: string, examTitle: string, passed: boolean) {
  const message = 'Your result for "' + examTitle + '" is ready. Status: ' + (passed ? 'PASSED' : 'FAILED') + '. Login to view details.'
  return sendSMS(phone, message)
}

export async function sendOTPSMS(phone: string, otp: string) {
  const message = 'Your OTP is: ' + otp + '. Valid for 10 minutes. Do not share this code.'
  return sendSMS(phone, message)
}
