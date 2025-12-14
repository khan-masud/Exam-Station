import { query } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { NextRequest, NextResponse } from "next/server"
import { RowDataPacket } from 'mysql2'

interface OAuthSetting extends RowDataPacket {
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
       WHERE setting_key LIKE 'oauth_%'`,
      []
    ) as OAuthSetting[]

    const config: any = {
      googleClientId: "",
      googleClientSecret: "",
      googleEnabled: false,
      facebookAppId: "",
      facebookAppSecret: "",
      facebookEnabled: false,
    }

    if (Array.isArray(settings)) {
      settings.forEach((setting: OAuthSetting) => {
        const key = setting.setting_key.replace("oauth_", "")
        const value = setting.setting_value
        config[key] = value
      })
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error("Error fetching OAuth config:", error)
    return NextResponse.json(
      { error: "Failed to fetch OAuth config" },
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

    const { config } = await req.json()

    for (const [key, value] of Object.entries(config)) {
      const settingKey = `oauth_${key}`

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
    console.error("Error saving OAuth config:", error)
    return NextResponse.json(
      { error: "Failed to save OAuth config" },
      { status: 500 }
    )
  }
}
