import { NextRequest, NextResponse } from "next/server"
import fs from "fs/promises"
import path from "path"
import { hashPassword } from "@/lib/auth"
import { setPool } from "@/lib/db"
import { v4 as uuidv4 } from "uuid"
import mysql from "mysql2/promise"
import { markAsInstalled, writeEnvFile, isInstalledServer } from "@/lib/installation"
import https from "https"

// Force Node.js runtime for this route (required for fs operations)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Global error handler for this API route
 * Ensures all errors return JSON responses
 */
function handleRouteError(error: any, context: string) {
  return NextResponse.json(
    {
      message: `${context} failed`,
      error: error.message || String(error),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    { status: 500 }
  )
}

// Path to the SQL schema file
const SCHEMA_PATH = path.join(process.cwd(), "scripts", "production-schema.sql")
const MODELS_DIR = path.join(process.cwd(), "public", "models")

const MODEL_BASE_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights'
const FACE_MODELS = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2'
]

/**
 * Downloads a file from URL to destination
 */
async function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`))
        return
      }

      const fileStream = require('fs').createWriteStream(dest)
      response.pipe(fileStream)

      fileStream.on('finish', () => {
        fileStream.close()
        resolve()
      })

      fileStream.on('error', (err: Error) => {
        require('fs').unlink(dest, () => {}) // Delete file on error
        reject(err)
      })
    }).on('error', reject)
  })
}

/**
 * Downloads all face detection models needed for anti-cheat webcam monitoring
 */
async function downloadFaceModels(): Promise<void> {
  
  // Create models directory if it doesn't exist
  await fs.mkdir(MODELS_DIR, { recursive: true })

  for (const modelFile of FACE_MODELS) {
    const url = `${MODEL_BASE_URL}/${modelFile}`
    const dest = path.join(MODELS_DIR, modelFile)
    
    try {
      // Check if file already exists
      try {
        await fs.access(dest)
        continue
      } catch {
        // File doesn't exist, download it
      }

      await downloadFile(url, dest)
    } catch (err) {
      // Don't fail installation if model download fails
    }
  }
  
}

/**
 * Tests database connection with provided credentials
 */
async function testDatabaseConnection(config: {
  host: string
  user: string
  password: string
  database: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    const connection = await mysql.createConnection({
      host: config.host,
      user: config.user,
      password: config.password,
    })

    // Drop database if exists to ensure clean installation
    await connection.query(`DROP DATABASE IF EXISTS \`${config.database}\``)
    // Create fresh database
    await connection.query(`CREATE DATABASE \`${config.database}\``)
    await connection.query(`USE \`${config.database}\``)
    await connection.end()

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Database connection failed",
    }
  }
}

/**
 * Runs the database schema script
 */
async function runDatabaseSchema(connectionOptions: any, importDemoData: boolean = true): Promise<void> {
  let sql = await fs.readFile(SCHEMA_PATH, "utf-8")
  
  // If demo data is not needed, remove INSERT statements for demo data
  // BUT always keep landing config, sections, and menu items (required for landing page)
  if (!importDemoData) {
    // Use a more robust regex to remove multi-line INSERT statements
    // Match INSERT INTO statements (including multi-line) but preserve admin_settings, landing_config, landing_sections, landing_menu_items
    sql = sql.replace(/INSERT INTO `(?!admin_settings|landing_config|landing_sections|landing_menu_items)([^`]+)`[^;]*;/gs, '')
    // Also remove any standalone semicolons or empty lines that might be left
    sql = sql.replace(/^\s*;\s*$/gm, '')
    sql = sql.replace(/\n{3,}/g, '\n\n') // Collapse multiple newlines
    
    // Debug: Check if page_visits CREATE TABLE is still present
    if (!sql.includes('CREATE TABLE') || !sql.includes('page_visits')) {
    }
  }

  // Try executing the whole schema using a dedicated connection with multipleStatements enabled
  let bulkSuccess = false
  try {
    const conn = await mysql.createConnection({
      multipleStatements: true,
      ...connectionOptions,
    })
    
    await conn.query(sql)
    await conn.end()
    
    bulkSuccess = true
    return // SUCCESS! Exit here
  } catch (err: any) {
  }

  // Only reach here if bulk execution failed
  if (bulkSuccess) {
    return // Extra safety check
  }

  // Fallback: try splitting and executing individual statements
  const connection = await mysql.createConnection(connectionOptions)
  
  try {
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"))

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      try {
        await connection.query(statement)
        successCount++
        
        // Log progress every 50 statements
      } catch (err: any) {
        // Only log non-critical errors (like table already exists)
        if (!err.message.includes("already exists")) {
          errorCount++
        }
      }
    }
    
  } finally {
    await connection.end()
  }
}

/**
 * POST /api/install - Handle installation process
 */
export async function POST(req: NextRequest) {
  try {
    // Check if already installed
    if (await isInstalledServer()) {
      return NextResponse.json(
        { message: "Application is already installed." },
        { status: 400 }
      )
    }

    let body: any
    try {
      const text = await req.text()
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { message: "Empty request body" },
          { status: 400 }
        )
      }
      body = JSON.parse(text)
    } catch (parseError: any) {
      console.error("[Install] Request body parse error:", parseError)
      return NextResponse.json(
        { message: "Invalid JSON in request body", error: parseError.message },
        { status: 400 }
      )
    }

    const { dbHost, dbUser, dbPassword, dbName, adminEmail, adminPassword, adminFullName, importDemoData, siteName, siteTagline, appUrl } = body

    // Validation
    if (!dbHost || !dbUser || !dbName || !adminEmail || !adminPassword || !adminFullName) {
      return NextResponse.json(
        { message: "All fields are required." },
        { status: 400 }
      )
    }

    if (adminPassword.length < 6) {
      return NextResponse.json(
        { message: "Admin password must be at least 6 characters long." },
        { status: 400 }
      )
    }

    // Step 1: Test database connection
    const connectionTest = await testDatabaseConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName,
    })

    if (!connectionTest.success) {
      return NextResponse.json(
        {
          message: "Database connection failed",
          error: connectionTest.error,
        },
        { status: 400 }
      )
    }


    // Step 2: Connection configuration
    const connectionOptions = {
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    }

    // Set the global pool for subsequent queries
    await setPool(connectionOptions)

    // Step 3: Run database schema
    try {
      await runDatabaseSchema(connectionOptions, importDemoData !== false) // Default to true if not specified
    } catch (error: any) {
      console.error("[Install] Schema execution error:", error)
      return NextResponse.json(
        {
          message: "Failed to execute database schema",
          error: error.message,
        },
        { status: 500 }
      )
    }

    // Step 3.5: Ensure page_visits table exists (critical for analytics)
    try {
      const { query } = await import("@/lib/db")
      
      // Create page_visits table
      await query(`
        CREATE TABLE IF NOT EXISTS page_visits (
          id char(36) NOT NULL,
          user_id char(36) DEFAULT NULL,
          page_url varchar(255) NOT NULL,
          referrer varchar(255) DEFAULT NULL,
          user_agent text,
          ip_address varchar(45) DEFAULT NULL,
          timestamp datetime NOT NULL DEFAULT current_timestamp(),
          PRIMARY KEY (id),
          KEY idx_user_id (user_id),
          KEY idx_timestamp (timestamp)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `)
      console.log('[Install] ✓ page_visits table verified/created')

      // Create other analytics tables if needed
      await query(`
        CREATE TABLE IF NOT EXISTS traffic_analytics (
          id char(36) NOT NULL,
          date date NOT NULL,
          page_views int DEFAULT 0,
          unique_visitors int DEFAULT 0,
          bounce_rate decimal(5,2) DEFAULT 0,
          avg_session_duration int DEFAULT 0,
          PRIMARY KEY (id),
          KEY idx_date (date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `)

      await query(`
        CREATE TABLE IF NOT EXISTS system_metrics (
          id char(36) NOT NULL,
          timestamp datetime NOT NULL DEFAULT current_timestamp(),
          database_connections int DEFAULT 0,
          error_rate decimal(5,2) DEFAULT 0,
          avg_response_time int DEFAULT 0,
          PRIMARY KEY (id),
          KEY idx_timestamp (timestamp)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `)

      await query(`
        CREATE TABLE IF NOT EXISTS login_attempts (
          id char(36) NOT NULL,
          user_id char(36) DEFAULT NULL,
          email varchar(255) DEFAULT NULL,
          ip_address varchar(45) DEFAULT NULL,
          success tinyint(1) DEFAULT 0,
          timestamp datetime NOT NULL DEFAULT current_timestamp(),
          PRIMARY KEY (id),
          KEY idx_timestamp (timestamp),
          KEY idx_user_id (user_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `)

      await query(`
        CREATE TABLE IF NOT EXISTS api_logs (
          id char(36) NOT NULL,
          endpoint varchar(255) NOT NULL,
          method varchar(10) NOT NULL,
          status_code int NOT NULL,
          response_time int DEFAULT 0,
          user_id char(36) DEFAULT NULL,
          timestamp datetime NOT NULL DEFAULT current_timestamp(),
          PRIMARY KEY (id),
          KEY idx_timestamp (timestamp),
          KEY idx_endpoint (endpoint)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `)

      await query(`
        CREATE TABLE IF NOT EXISTS site_settings (
          id char(36) NOT NULL,
          site_name varchar(255) DEFAULT 'Exam System',
          site_logo varchar(500) DEFAULT NULL,
          primary_color varchar(7) DEFAULT '#3b82f6',
          secondary_color varchar(7) DEFAULT '#8b5cf6',
          created_at datetime NOT NULL DEFAULT current_timestamp(),
          updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `)

      await query(`
        CREATE TABLE IF NOT EXISTS oauth_providers (
          id char(36) NOT NULL,
          provider_name varchar(50) NOT NULL,
          client_id varchar(255) DEFAULT NULL,
          client_secret varchar(255) DEFAULT NULL,
          is_enabled tinyint(1) DEFAULT 0,
          button_color varchar(7) DEFAULT '#000000',
          icon_url varchar(500) DEFAULT NULL,
          created_at datetime NOT NULL DEFAULT current_timestamp(),
          updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (id),
          UNIQUE KEY provider_name (provider_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `)

      await query(`
        CREATE TABLE IF NOT EXISTS verification_codes (
          id char(36) NOT NULL,
          user_id char(36) NOT NULL,
          email varchar(255) DEFAULT NULL,
          phone varchar(20) DEFAULT NULL,
          code varchar(6) NOT NULL,
          type enum('email','phone') NOT NULL,
          verified tinyint(1) DEFAULT 0,
          expires_at timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          created_at timestamp NOT NULL DEFAULT current_timestamp(),
          PRIMARY KEY (id),
          KEY idx_user_id (user_id),
          KEY idx_code (code)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `)

      await query(`
        CREATE TABLE IF NOT EXISTS support_tickets (
          id varchar(36) NOT NULL,
          student_id varchar(36) NOT NULL,
          admin_id varchar(36) DEFAULT NULL,
          title varchar(255) NOT NULL,
          description text NOT NULL,
          category varchar(50) NOT NULL DEFAULT 'other',
          priority varchar(20) NOT NULL DEFAULT 'medium',
          status varchar(50) NOT NULL DEFAULT 'open',
          created_at timestamp NULL DEFAULT current_timestamp(),
          updated_at timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          resolved_at timestamp NULL DEFAULT NULL,
          PRIMARY KEY (id),
          KEY idx_student_id (student_id),
          KEY idx_admin_id (admin_id),
          KEY idx_status (status),
          KEY idx_priority (priority),
          KEY idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `)

      await query(`
        CREATE TABLE IF NOT EXISTS support_ticket_messages (
          id varchar(36) NOT NULL,
          ticket_id varchar(36) NOT NULL,
          sender_id varchar(36) NOT NULL,
          message_text text NOT NULL,
          is_admin_response tinyint(1) DEFAULT 0,
          created_at timestamp NULL DEFAULT current_timestamp(),
          updated_at timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (id),
          KEY idx_ticket_id (ticket_id),
          KEY idx_sender_id (sender_id),
          KEY idx_is_admin_response (is_admin_response),
          KEY idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `)

      await query(`
        CREATE TABLE IF NOT EXISTS support_ticket_attachments (
          id varchar(36) NOT NULL,
          ticket_id varchar(36) NOT NULL,
          message_id varchar(36) DEFAULT NULL,
          file_name varchar(255) NOT NULL,
          file_path varchar(500) NOT NULL,
          mime_type varchar(100) DEFAULT NULL,
          size bigint DEFAULT NULL,
          created_at timestamp NULL DEFAULT current_timestamp(),
          PRIMARY KEY (id),
          KEY idx_ticket_id (ticket_id),
          KEY idx_message_id (message_id),
          KEY idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `)

      await query(`
        CREATE TABLE IF NOT EXISTS support_ticket_custom_fields (
          id varchar(36) NOT NULL,
          ticket_id varchar(36) NOT NULL,
          field_name varchar(255) NOT NULL,
          field_value text,
          PRIMARY KEY (id),
          KEY idx_ticket_id (ticket_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `)

      await query(`
        CREATE TABLE IF NOT EXISTS theme_settings (
          id varchar(36) NOT NULL,
          name varchar(255) NOT NULL,
          description text,
          is_active tinyint(1) DEFAULT 0,
          primary_color varchar(7) DEFAULT '#3b82f6',
          secondary_color varchar(7) DEFAULT '#8b5cf6',
          accent_color varchar(7) DEFAULT '#ec4899',
          background_color varchar(7) DEFAULT '#ffffff',
          text_color varchar(7) DEFAULT '#1f2937',
          border_color varchar(7) DEFAULT '#e5e7eb',
          success_color varchar(7) DEFAULT '#10b981',
          warning_color varchar(7) DEFAULT '#f59e0b',
          danger_color varchar(7) DEFAULT '#ef4444',
          muted_color varchar(7) DEFAULT '#6b7280',
          font_family_heading varchar(255) DEFAULT 'system-ui, -apple-system, sans-serif',
          font_family_body varchar(255) DEFAULT 'system-ui, -apple-system, sans-serif',
          font_size_base int DEFAULT 16,
          font_weight_regular int DEFAULT 400,
          font_weight_medium int DEFAULT 500,
          font_weight_bold int DEFAULT 700,
          line_height_normal decimal(3,2) DEFAULT 1.50,
          border_radius int DEFAULT 6,
          container_max_width int DEFAULT 1280,
          sidebar_width int DEFAULT 256,
          header_height int DEFAULT 64,
          spacing_unit int DEFAULT 4,
          shadow_sm varchar(255) DEFAULT '0 1px 2px 0 rgba(0,0,0,0.05)',
          shadow_md varchar(255) DEFAULT '0 4px 6px -1px rgba(0,0,0,0.1)',
          shadow_lg varchar(255) DEFAULT '0 10px 15px -3px rgba(0,0,0,0.1)',
          logo_url text,
          favicon_url text,
          site_name varchar(255) DEFAULT NULL,
          created_at timestamp NULL DEFAULT current_timestamp(),
          updated_at timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          created_by varchar(36) DEFAULT NULL,
          PRIMARY KEY (id),
          UNIQUE KEY name (name),
          KEY idx_is_active (is_active),
          KEY idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `)

      await query(`
        CREATE TABLE IF NOT EXISTS password_resets (
          id char(36) NOT NULL,
          user_id char(36) NOT NULL,
          email varchar(255) NOT NULL,
          token varchar(255) NOT NULL,
          expires_at datetime NOT NULL,
          used tinyint(1) DEFAULT 0,
          used_at datetime DEFAULT NULL,
          created_at datetime NOT NULL DEFAULT current_timestamp(),
          PRIMARY KEY (id),
          UNIQUE KEY token (token),
          KEY idx_user_id (user_id),
          KEY idx_token (token),
          KEY idx_expires_at (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `)

      await query(`
        CREATE TABLE IF NOT EXISTS oauth_providers (
          id char(36) NOT NULL,
          provider_name varchar(50) NOT NULL,
          provider_type varchar(20) DEFAULT 'oauth2',
          client_id varchar(500) DEFAULT NULL,
          client_secret varchar(500) DEFAULT NULL,
          authorization_url varchar(500) DEFAULT NULL,
          token_url varchar(500) DEFAULT NULL,
          userinfo_url varchar(500) DEFAULT NULL,
          redirect_uri varchar(500) DEFAULT NULL,
          scopes varchar(255) DEFAULT NULL,
          is_enabled tinyint(1) DEFAULT 0,
          button_color varchar(7) DEFAULT '#000000',
          icon_url varchar(500) DEFAULT NULL,
          created_at datetime NOT NULL DEFAULT current_timestamp(),
          updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (id),
          UNIQUE KEY provider_name (provider_name),
          KEY idx_provider_name (provider_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `)

      await query(`
        CREATE TABLE IF NOT EXISTS oauth_accounts (
          id char(36) NOT NULL,
          user_id char(36) NOT NULL,
          provider_name varchar(50) NOT NULL,
          provider_user_id varchar(255) NOT NULL,
          provider_email varchar(255) DEFAULT NULL,
          provider_name_full varchar(255) DEFAULT NULL,
          provider_avatar_url varchar(500) DEFAULT NULL,
          access_token text DEFAULT NULL,
          refresh_token text DEFAULT NULL,
          token_expires_at datetime DEFAULT NULL,
          last_synced_at datetime DEFAULT NULL,
          created_at datetime NOT NULL DEFAULT current_timestamp(),
          updated_at datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (id),
          UNIQUE KEY unique_provider_user (provider_name, provider_user_id),
          KEY idx_user_id (user_id),
          KEY idx_provider_name (provider_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `)

      await query(`
        CREATE TABLE IF NOT EXISTS oauth_tokens (
          id char(36) NOT NULL,
          provider_name varchar(50) NOT NULL,
          state varchar(255) NOT NULL,
          nonce varchar(255) DEFAULT NULL,
          user_id char(36) DEFAULT NULL,
          is_used tinyint(1) DEFAULT 0,
          expires_at datetime NOT NULL,
          created_at datetime NOT NULL DEFAULT current_timestamp(),
          PRIMARY KEY (id),
          UNIQUE KEY state (state),
          KEY idx_state (state),
          KEY idx_user_id (user_id),
          KEY idx_expires_at (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
      `)

      // Insert default OAuth providers (Google and Facebook) with correct redirect_uri
      const googleId = uuidv4()
      const facebookId = uuidv4()
      const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/oauth/callback`
      
      await query(`
        INSERT IGNORE INTO oauth_providers (id, provider_name, provider_type, authorization_url, token_url, userinfo_url, redirect_uri, scopes, icon_url, button_color, is_enabled)
        VALUES 
        (?, 'google', 'oauth2', 'https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', 'https://www.googleapis.com/oauth2/v2/userinfo', ?, 'openid email profile', 'https://www.gstatic.com/images/branding/product/1x/googleg_standard_color_128dp.png', '#4285f4', 0),
        (?, 'facebook', 'oauth2', 'https://www.facebook.com/v18.0/dialog/oauth', 'https://graph.facebook.com/v18.0/oauth/access_token', 'https://graph.facebook.com/me?fields=id,name,email,picture', ?, 'public_profile email', 'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg', '#1877f2', 0)
      `, [googleId, redirectUri, facebookId, redirectUri])

      console.log('[Install] ✓ All analytics tables verified/created')
    } catch (error: any) {
      console.warn("[Install] Failed to ensure analytics tables:", error.message)
      // Don't fail installation if this fails
    }

    // Step 3.5: Create default question types
    try {
      const { query } = await import("@/lib/db")
      
      const questionTypes = [
        [1, 'MCQ', 'Multiple Choice Question'],
        [2, 'True/False', 'True or False question'],
        [3, 'Dropdown', 'Dropdown selection question'],
        [4, 'Short Answer', 'Short text answer'],
        [5, 'Essay', 'Long text essay'],
      ]

      for (const [id, name, description] of questionTypes) {
        await query(
          `INSERT IGNORE INTO question_types (id, name, description)
           VALUES (?, ?, ?)`,
          [id, name, description]
        )
      }
      console.log('[Install] ✓ Question types created (MCQ, True/False, Dropdown, Short Answer, Essay)')
    } catch (error: any) {
      console.warn("[Install] Failed to create question types:", error.message)
      // Don't fail installation if this fails
    }

    // Step 4: Create super admin user
    const hashedPassword = await hashPassword(adminPassword)
    const adminId = uuidv4()

    try {
      // Import query function dynamically after pool is set
      const { query } = await import("@/lib/db")

      const insertUserSql = `
        INSERT INTO users (id, email, password_hash, full_name, role, status)
        VALUES (?, ?, ?, ?, 'admin', 'active')
      `
      await query(insertUserSql, [adminId, adminEmail, hashedPassword, adminFullName])

      // Step 5: Create default organization
      const orgId = uuidv4()
      const orgSlug = adminFullName.toLowerCase().replace(/[^a-z0-9]+/g, "-")
      const insertOrgSql = `
        INSERT INTO organizations (id, name, slug, subscription_plan, subscription_status)
        VALUES (?, ?, ?, 'enterprise', 'active')
      `
      await query(insertOrgSql, [orgId, `${adminFullName}'s Organization`, orgSlug])

      // Step 6: Link admin to organization
      const memberId = uuidv4()
      const insertMemberSql = `
        INSERT INTO organization_members (id, organization_id, user_id, role)
        VALUES (?, ?, ?, 'owner')
      `
      await query(insertMemberSql, [memberId, orgId, adminId])

      // Step 6.5: Create sample transactions only if demo data is enabled
      if (importDemoData !== false) {
        const sampleTransactions = [
          { amount: 99.99, gateway: 'stripe', status: 'completed', ref: 'TXN-100001' },
          { amount: 149.50, gateway: 'paypal', status: 'completed', ref: 'TXN-100002' },
          { amount: 79.00, gateway: 'razorpay', status: 'pending', ref: 'TXN-100003' },
          { amount: 199.99, gateway: 'stripe', status: 'completed', ref: 'TXN-100004' },
          { amount: 59.99, gateway: 'paypal', status: 'failed', ref: 'TXN-100005' },
        ]

        for (const txn of sampleTransactions) {
          const txnId = uuidv4()
          const insertTxnSql = `
            INSERT INTO transactions (id, user_id, amount, payment_gateway, payment_status, transaction_reference)
            VALUES (?, ?, ?, ?, ?, ?)
          `
          await query(insertTxnSql, [txnId, adminId, txn.amount, txn.gateway, txn.status, txn.ref])
        }
      }
    } catch (error: any) {
      return NextResponse.json(
        {
          message: "Failed to create admin user or organization",
          error: error.message,
        },
        { status: 500 }
      )
    }

    // Step 7: Write .env file
    try {
      const finalAppUrl = appUrl || (typeof window !== 'undefined' ? window.location.origin : "http://localhost:3000")
      const envVars = {
        DB_HOST: dbHost,
        DB_USER: dbUser,
        DB_PASSWORD: dbPassword,
        DB_NAME: dbName,
        JWT_SECRET: uuidv4() + uuidv4(), // Generate a random JWT secret
        NODE_ENV: "production",
        NEXT_PUBLIC_APP_URL: finalAppUrl,
      }

      await writeEnvFile(envVars)
    } catch (error: any) {
      // Don't fail installation if .env write fails, just warn
    }

    // Step 8: Ensure landing_config and sections exist
    try {
      const { query } = await import("@/lib/db")
      
      const finalSiteName = siteName || "Exam System"
      const finalSiteTagline = siteTagline || "Your assessment platform"
      const DEFAULT_CONFIG_ID = '550e8400-e29b-41d4-a716-446655440000'
      
      
      try {
        // Create landing config with all required fields
        await query(
          `INSERT INTO landing_config (id, site_name, site_tagline, site_description, is_active, created_by)
           VALUES (?, ?, ?, ?, 1, 'system')
           ON DUPLICATE KEY UPDATE site_name = ?, site_tagline = ?`,
          [
            DEFAULT_CONFIG_ID,
            finalSiteName,
            finalSiteTagline,
            'Professional exam management system',
            finalSiteName,
            finalSiteTagline
          ]
        )
      } catch (e: any) {
      }
      
      try {
        // Insert all sections with proper structure
        const sections = [
          ['550e8400-e29b-41d4-a716-446655440001', DEFAULT_CONFIG_ID, 'Hero Section', 'hero', 0, 1, '#ffffff', JSON.stringify({title:"Welcome to "+finalSiteName,subtitle:"Professional Exam Management System",cta_text:"Get Started",cta_link:"/register",image_url:""})],
          ['550e8400-e29b-41d4-a716-446655440002', DEFAULT_CONFIG_ID, 'Statistics Section', 'statistics', 1, 1, '#f5f5f5', JSON.stringify({title:"By The Numbers",subtitle:"Trusted by educators worldwide",stats:[{label:"Total Exams",value:"50000+"},{label:"Active Students",value:"500K+"},{label:"Success Rate",value:"98%"},{label:"Institutions",value:"1000+"}]})],
          ['550e8400-e29b-41d4-a716-446655440003', DEFAULT_CONFIG_ID, 'Features Section', 'features', 2, 1, '#ffffff', JSON.stringify({title:"Key Features",subtitle:"Everything you need for effective exam management",features:[{title:"Easy Exam Creation",description:"Create and manage exams with an intuitive interface",icon:"📝"},{title:"Secure Testing",description:"Anti-cheat features and proctoring capabilities",icon:"🔒"},{title:"Analytics",description:"Detailed reports and student performance tracking",icon:"📊"}]})],
          ['550e8400-e29b-41d4-a716-446655440004', DEFAULT_CONFIG_ID, 'Programs Section', 'programs', 3, 1, '#f5f5f5', JSON.stringify({title:"Popular Programs",subtitle:"Explore our comprehensive course offerings",programs:[{name:"Engineering",description:"Master technical concepts"},{name:"Business",description:"Leadership and management"},{name:"Sciences",description:"Advanced scientific studies"}]})],
          ['550e8400-e29b-41d4-a716-446655440006', DEFAULT_CONFIG_ID, 'Testimonials Section', 'testimonials', 4, 1, '#ffffff', JSON.stringify({title:"What Our Users Say",subtitle:"Success stories from educators and students",testimonials:[{author:"John Doe",role:"Educator",content:"This platform transformed how I assess my students",image:""},{author:"Jane Smith",role:"Administrator",content:"Best exam management solution we've ever used",image:""},{author:"Mike Johnson",role:"Student",content:"Smooth and secure testing experience",image:""}]})],
          ['550e8400-e29b-41d4-a716-446655440007', DEFAULT_CONFIG_ID, 'Call to Action', 'call-to-action', 5, 1, '#007bff', JSON.stringify({title:"Ready to Transform Your Assessment?",subtitle:"Join thousands of educators using "+finalSiteName,button_text:"Start Your Free Trial",button_link:"/register",button_secondary_text:"Learn More",button_secondary_link:"/features"})],
          ['550e8400-e29b-41d4-a716-446655440009', DEFAULT_CONFIG_ID, 'Newsletter Section', 'newsletter', 6, 1, '#ffffff', JSON.stringify({title:"Stay Updated with "+finalSiteName,subtitle:"Subscribe to our newsletter for the latest news and updates",input_placeholder:"Enter your email address",button_text:"Subscribe Now",description:"We promise not to spam you. Unsubscribe at any time."})],
          ['550e8400-e29b-41d4-a716-446655440008', DEFAULT_CONFIG_ID, 'Custom HTML Section', 'custom-html', 7, 1, '#ffffff', JSON.stringify({html_code:"<!-- Add your custom HTML code here -->\n<div class=\"custom-section\">\n  <p>Edit this section to add your own HTML content</p>\n</div>"})],
          ['550e8400-e29b-41d4-a716-446655440005', DEFAULT_CONFIG_ID, 'Footer', 'footer', 8, 1, '#2c3e50', JSON.stringify({copyright:"© 2025 "+finalSiteName+". All rights reserved.",links:[{label:"Privacy",url:"/privacy"},{label:"Terms",url:"/terms"},{label:"Contact",url:"/contact"}]})]
        ]
        
        for (const section of sections) {
          await query(
            `INSERT IGNORE INTO landing_sections (id, config_id, section_name, section_type, display_order, is_visible, background_color, content)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            section
          )
        }
      } catch (e: any) {
      }
      
      try {
        // Insert default menu items
        const menuItems = [
          ['550e8400-e29b-41d4-a716-446655440010', DEFAULT_CONFIG_ID, 'navbar', 'Home', '/', 'internal', 0],
          ['550e8400-e29b-41d4-a716-446655440011', DEFAULT_CONFIG_ID, 'navbar', 'Features', '#features', 'internal', 1],
          ['550e8400-e29b-41d4-a716-446655440012', DEFAULT_CONFIG_ID, 'navbar', 'Pricing', '/pricing', 'internal', 2],
          ['550e8400-e29b-41d4-a716-446655440013', DEFAULT_CONFIG_ID, 'navbar', 'Login', '/login', 'internal', 3],
          ['550e8400-e29b-41d4-a716-446655440014', DEFAULT_CONFIG_ID, 'navbar', 'Sign Up', '/register', 'internal', 4]
        ]
        
        for (const item of menuItems) {
          await query(
            `INSERT IGNORE INTO landing_menu_items (id, config_id, menu_location, label, url, link_type, display_order, is_visible)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            item
          )
        }
      } catch (e: any) {
      }
      
      // Also update admin_settings for consistency
      try {
        await query(
          `INSERT INTO admin_settings (id, setting_key, setting_value) 
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE setting_value = ?`,
          [uuidv4(), 'general.siteName', JSON.stringify(finalSiteName), JSON.stringify(finalSiteName)]
        )
        
        await query(
          `INSERT INTO admin_settings (id, setting_key, setting_value) 
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE setting_value = ?`,
          [uuidv4(), 'general.siteTagline', JSON.stringify(finalSiteTagline), JSON.stringify(finalSiteTagline)]
        )
      } catch (e: any) {
      }
      
    } catch (error: any) {
      // Don't fail installation if landing setup fails
    }

    // Step 9: Download face detection models for anti-cheat (non-blocking)
    try {
      // Download models in background, don't wait for completion
      downloadFaceModels().then(() => {
        console.log('[Install] ✅ Face detection models downloaded successfully!')
      }).catch(err => {
        console.error('[Install] ❌ Background face models download failed:', err)
      })
      console.log('[Install] 📥 Face models download started in background...')
    } catch (error: any) {
      // Don't fail installation if model download fails
    }

    // Step 10: Create installation flag
    await markAsInstalled({
      installedAt: new Date().toISOString(),
      dbHost,
      dbName,
      dbUser,
      adminEmail,
    })

    // Step 11: Verify installation was recorded
    try {
      const { isInstalledServer } = await import("@/lib/installation")
      
      // Wait a moment for file system to flush
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const verified = await isInstalledServer()
      console.log('[Install] Installation verification:', verified)
      
      if (!verified) {
        console.warn('[Install] ⚠️ WARNING: Installation files not verified after marking as installed!')
        // Still allow completion, but log the warning
      }
    } catch (error: any) {
      console.warn('[Install] Could not verify installation:', error.message)
    }

    return NextResponse.json(
      {
        message: "Installation completed successfully!",
        nextSteps: [
          "Your database has been configured",
          "Admin account has been created",
          "You can now login with your admin credentials",
        ],
      },
      { status: 200 }
    )
  } catch (error: any) {
    return handleRouteError(error, "Installation")
  }
}

/**
 * GET /api/install - Check installation status
 */
export async function GET() {
  try {
    const installed = await isInstalledServer()
    return NextResponse.json({ installed }, { status: 200 })
  } catch (error: any) {
    return handleRouteError(error, "GET installation status")
  }
}

/**
 * PUT /api/install - Test database connection
 */
export async function PUT(req: NextRequest) {
  try {
    let body: any
    try {
      const text = await req.text()
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { message: "Empty request body" },
          { status: 400 }
        )
      }
      body = JSON.parse(text)
    } catch (parseError: any) {
      console.error("[Install] Request body parse error:", parseError)
      return NextResponse.json(
        { message: "Invalid JSON in request body", error: parseError.message },
        { status: 400 }
      )
    }

    const { dbHost, dbUser, dbPassword, dbName } = body

    if (!dbHost || !dbUser || !dbName) {
      return NextResponse.json(
        { message: "Database credentials are required" },
        { status: 400 }
      )
    }

    const result = await testDatabaseConnection({
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      database: dbName,
    })

    if (result.success) {
      return NextResponse.json(
        { message: "Database connection successful!" },
        { status: 200 }
      )
    } else {
      return NextResponse.json(
        { message: "Connection failed", error: result.error },
        { status: 400 }
      )
    }
  } catch (error: any) {
    return handleRouteError(error, "Connection test")
  }
}
