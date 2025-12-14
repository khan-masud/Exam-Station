import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { writeFile, mkdir, readdir, stat } from 'fs/promises'
import { join } from 'path'
import { createWriteStream, createReadStream } from 'fs'
import archiver from 'archiver'
import { pipeline } from 'stream/promises'

// GET - List all backups
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const backupDir = join(process.cwd(), 'backups')
    
    try {
      await mkdir(backupDir, { recursive: true })
      const files = await readdir(backupDir)
      
      const backups = await Promise.all(
        files
          .filter(file => file.endsWith('.zip'))
          .map(async (file) => {
            const filePath = join(backupDir, file)
            const stats = await stat(filePath)
            return {
              name: file,
              size: stats.size,
              created: stats.mtime,
              path: `/backups/${file}`
            }
          })
      )

      backups.sort((a, b) => b.created.getTime() - a.created.getTime())

      return NextResponse.json({ backups })
    } catch (error) {
      return NextResponse.json({ backups: [] })
    }
  } catch (error) {
    console.error('List backups error:', error)
    return NextResponse.json({ error: 'Failed to list backups' }, { status: 500 })
  }
}

// POST - Create new backup
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { includeUploads, backupType = 'full' } = await req.json()

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const backupName = backupType === 'questions' ? `backup-questions-${timestamp}` : `backup-${timestamp}`
    const backupDir = join(process.cwd(), 'backups')
    const tempDir = join(backupDir, backupName)
    
    await mkdir(tempDir, { recursive: true })

    // 1. Backup Database
    console.log('Starting database backup...')
    console.log('Backup type:', backupType)
    
    // Define table sets
    const questionTables = [
      'subjects', 'topics', 'questions', 'question_options',
      'question_topics', 'question_types', 'question_evaluations',
      'question_feedback'
    ]
    
    // All 72 tables from production schema
    const allTables = [
      // Core tables
      'admin_settings', 'users', 'programs', 'subjects', 'topics',
      
      // Questions
      'questions', 'question_options', 'question_topics', 'question_types',
      'question_evaluations', 'question_feedback',
      
      // Exams
      'exams', 'exam_programs', 'exam_questions', 'exam_question_selections',
      'exam_registrations', 'exam_attempts', 'exam_answers', 'student_answers',
      'answer_drafts', 'exam_results', 'exam_progress',
      
      // Evaluations & Enrollments
      'evaluations', 'program_enrollments',
      
      // Organizations
      'organizations', 'organization_members',
      
      // Payments & Transactions
      'payment_transactions', 'transactions',
      
      // Proctoring & Anti-cheat
      'proctoring_sessions', 'anti_cheat_logs', 'anti_cheat_events',
      'anti_cheat_logs_enhanced',
      
      // User management
      'user_sessions', 'user_preferences', 'user_activity_log', 'user_blocks',
      'user_permissions', 'user_role_assignments',
      
      // Authentication
      'verification_codes', 'password_resets', 'oauth_providers',
      'oauth_accounts', 'oauth_tokens',
      
      // Analytics & Monitoring
      'page_visits', 'api_logs', 'login_attempts', 'system_metrics',
      'revenue_metrics', 'user_engagement_metrics', 'traffic_analytics',
      'cohort_analysis',
      
      // Support System
      'support_tickets', 'support_ticket_messages', 'support_ticket_attachments',
      'support_ticket_custom_fields',
      
      // Theme & Landing Page
      'theme_settings', 'theme_page_sections', 'theme_menu_items',
      'theme_custom_css', 'theme_presets', 'theme_audit_log',
      'landing_config', 'landing_sections', 'landing_menu_items',
      'landing_section_templates', 'landing_gradient_presets',
      'landing_images', 'landing_version_history',
      
      // Notifications & Settings
      'notifications', 'notification_preferences', 'site_settings',
      
      // Newsletter
      'newsletter_subscribers',
      
      // Coupons
      'coupons', 'coupon_usage'
    ]
    
    // Select tables based on backup type
    const tables = backupType === 'questions' ? questionTables : allTables

    const dbBackup: any = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      backupType,
      tables: {}
    }

    for (const table of tables) {
      try {
        const [rows] = await pool.query(`SELECT * FROM ${table}`) as any
        dbBackup.tables[table] = rows
        console.log(`✓ Backed up ${table}: ${rows.length} rows`)
      } catch (error: any) {
        console.log(`⚠ Table ${table} not found or error: ${error.message}`)
        dbBackup.tables[table] = []
      }
    }

    // Save database backup as JSON
    const dbBackupPath = join(tempDir, 'database.json')
    await writeFile(dbBackupPath, JSON.stringify(dbBackup, null, 2))
    console.log('✓ Database backup completed')

    // 2. Backup Configuration Files (skip for questions-only)
    if (backupType === 'full') {
    console.log('Backing up configuration files...')
    const configFiles = ['.env', '.env.local', 'next.config.mjs', 'package.json']
    const configDir = join(tempDir, 'config')
    await mkdir(configDir, { recursive: true })

    for (const file of configFiles) {
      try {
        const sourcePath = join(process.cwd(), file)
        const destPath = join(configDir, file)
        const content = await readFile(sourcePath, 'utf-8')
        await writeFile(destPath, content)
        console.log(`✓ Backed up ${file}`)
      } catch (error) {
        console.log(`⚠ Could not backup ${file}`)
      }
    }
    }

    // 3. Backup Uploads (optional, skip for questions-only)
    if (includeUploads && backupType === 'full') {
      console.log('Backing up uploads...')
      const uploadsSource = join(process.cwd(), 'public', 'uploads')
      const uploadsDest = join(tempDir, 'uploads')
      
      try {
        await copyDir(uploadsSource, uploadsDest)
        console.log('✓ Uploads backed up')
      } catch (error) {
        console.log('⚠ No uploads to backup or error occurred')
      }
    }

    // 4. Create backup metadata
    const metadata = {
      name: backupName,
      created: new Date().toISOString(),
      version: '1.0',
      backupType,
      includeUploads,
      creator: decoded.email,
      tables: Object.keys(dbBackup.tables),
      recordCounts: Object.entries(dbBackup.tables).reduce((acc: any, [table, rows]: [string, any]) => {
        acc[table] = rows.length
        return acc
      }, {})
    }

    await writeFile(join(tempDir, 'metadata.json'), JSON.stringify(metadata, null, 2))

    // 5. Create ZIP archive
    console.log('Creating ZIP archive...')
    const zipPath = join(backupDir, `${backupName}.zip`)
    await createZipArchive(tempDir, zipPath)

    // 6. Clean up temp directory
    await rmDir(tempDir)

    console.log('✓ Backup completed successfully')

    return NextResponse.json({
      success: true,
      backup: {
        name: `${backupName}.zip`,
        path: `/api/admin/backup/download/${backupName}.zip`,
        metadata
      }
    })
  } catch (error) {
    console.error('Backup error:', error)
    return NextResponse.json({ 
      error: 'Failed to create backup',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper: Create ZIP archive
async function createZipArchive(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(outputPath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', () => resolve())
    archive.on('error', (err) => reject(err))

    archive.pipe(output)
    archive.directory(sourceDir, false)
    archive.finalize()
  })
}

// Helper: Copy directory recursively
async function copyDir(src: string, dest: string): Promise<void> {
  await mkdir(dest, { recursive: true })
  const entries = await readdir(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath)
    } else {
      const content = await readFile(srcPath)
      await writeFile(destPath, content)
    }
  }
}

// Helper: Remove directory recursively
async function rmDir(dir: string): Promise<void> {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        await rmDir(fullPath)
      } else {
        await unlink(fullPath)
      }
    }
    
    await rmdir(dir)
  } catch (error) {
    console.error('Error removing directory:', error)
  }
}

import { readFile, unlink, rmdir } from 'fs/promises'
