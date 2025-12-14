import { query } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { RowDataPacket } from 'mysql2'

interface NotificationSetting extends RowDataPacket {
  setting_key: string
  setting_value: string
}

export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const settings = await query(
      `SELECT setting_key, setting_value FROM admin_settings 
       WHERE setting_key LIKE 'notification_%'`,
      []
    ) as NotificationSetting[]

    const notificationSettings: any = {
      emailNotifications: true,
      smsNotifications: false,
      inAppNotifications: true,
      pushNotifications: true,
      digestFrequency: "daily",
      notifyOnNewExam: true,
      notifyOnPayment: true,
      notifyOnResultRelease: true,
      notifyOnSystemUpdates: true,
    }

    if (Array.isArray(settings)) {
      settings.forEach((setting: NotificationSetting) => {
        const key = setting.setting_key.replace("notification_", "")
        const value = setting.setting_value
        notificationSettings[key] = value === "true" ? true : value === "false" ? false : value
      })
    }

    return NextResponse.json({ settings: notificationSettings })
  } catch (error) {
    console.error("Error fetching notification settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch notification settings" },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { settings } = await req.json()

    for (const [key, value] of Object.entries(settings)) {
      const settingKey = `notification_${key}`

      const existing = await query(
        `SELECT id FROM admin_settings WHERE setting_key = ?`,
        [settingKey]
      )

      if ((existing as any[])?.length > 0) {
        await query(
          `UPDATE admin_settings SET setting_value = ? WHERE setting_key = ?`,
          [JSON.stringify(value), settingKey]
        )
      } else {
        await query(
          `INSERT INTO admin_settings (setting_key, setting_value) VALUES (?, ?)`,
          [settingKey, JSON.stringify(value)]
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving notification settings:", error)
    return NextResponse.json(
      { error: "Failed to save notification settings" },
      { status: 500 }
    )
  }
}
