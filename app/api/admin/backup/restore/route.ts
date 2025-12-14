import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import pool from '@/lib/db'
import { mkdir, writeFile, readdir, readFile } from 'fs/promises'
import { join } from 'path'
import { createWriteStream } from 'fs'
import AdmZip from 'adm-zip'

export async function POST(req: NextRequest) {
  let connection: any = null
  
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

    const formData = await req.formData()
    const file = formData.get('backup') as File
    const restoreUploads = formData.get('restoreUploads') === 'true'
    const clearExisting = formData.get('clearExisting') === 'true'

    if (!file) {
      return NextResponse.json({ error: 'No backup file provided' }, { status: 400 })
    }

    console.log('Starting restore process...')
    console.log('Restore options:', { restoreUploads, clearExisting })

    // Save uploaded file temporarily
    const tempDir = join(process.cwd(), 'temp', `restore-${Date.now()}`)
    await mkdir(tempDir, { recursive: true })
    
    const uploadPath = join(tempDir, 'backup.zip')
    const bytes = await file.arrayBuffer()
    await writeFile(uploadPath, Buffer.from(bytes))

    console.log('✓ Backup file uploaded')

    // Extract ZIP file
    const extractDir = join(tempDir, 'extracted')
    await mkdir(extractDir, { recursive: true })
    
    const zip = new AdmZip(uploadPath)
    zip.extractAllTo(extractDir, true)
    
    console.log('✓ Backup file extracted')

    // Read metadata
    const metadataPath = join(extractDir, 'metadata.json')
    const metadata = JSON.parse(await readFile(metadataPath, 'utf-8'))
    console.log('Backup metadata:', metadata)

    // Read database backup
    const dbBackupPath = join(extractDir, 'database.json')
    const dbBackup = JSON.parse(await readFile(dbBackupPath, 'utf-8'))
    const backupType = dbBackup.backupType || metadata.backupType || 'full'
    
    console.log('✓ Database backup loaded')
    console.log('Backup type:', backupType)

    // Get a connection for transaction
    connection = await pool.getConnection()
    await connection.beginTransaction()

    console.log('✓ Database transaction started')

    // Clear existing data if requested
    if (clearExisting) {
      console.log('Clearing existing data...')
      
      // Disable foreign key checks
      await connection.query('SET FOREIGN_KEY_CHECKS = 0')
      
      // Define table clear lists
      const questionTablesClear = [
        'question_feedback', 'question_evaluations', 'question_topics',
        'question_options', 'questions',
        'topics', 'subjects'
      ]
      
      const allTablesClear = [
        // Clear in reverse dependency order
        'newsletter_subscribers',
        'notification_preferences', 'notifications',
        'coupon_usage', 'coupons',
        'landing_version_history', 'landing_images', 'landing_menu_items',
        'landing_sections', 'landing_section_templates', 'landing_gradient_presets',
        'landing_config',
        'theme_audit_log', 'theme_presets', 'theme_custom_css',
        'theme_menu_items', 'theme_page_sections',
        'support_ticket_custom_fields', 'support_ticket_attachments',
        'support_ticket_messages', 'support_tickets',
        'cohort_analysis', 'traffic_analytics', 'user_engagement_metrics',
        'revenue_metrics', 'system_metrics', 'login_attempts', 'api_logs',
        'page_visits',
        'anti_cheat_logs_enhanced', 'anti_cheat_events', 'anti_cheat_logs',
        'proctoring_sessions',
        'payment_transactions', 'transactions',
        'exam_results', 'evaluations',
        'answer_drafts', 'student_answers', 'exam_answers', 'exam_progress',
        'exam_attempts',
        'exam_registrations', 'program_enrollments',
        'exam_question_selections', 'exam_questions', 'exam_programs', 'exams',
        'question_feedback', 'question_evaluations', 'question_topics',
        'question_options', 'questions',
        'topics', 'subjects', 'programs',
        'organization_members', 'organizations',
        'oauth_tokens', 'oauth_accounts',
        'user_activity_log', 'user_preferences', 'user_sessions',
        'user_role_assignments', 'user_permissions', 'user_blocks'
      ]
      
      const tablesToClear = backupType === 'questions' ? questionTablesClear : allTablesClear

      for (const table of tablesToClear) {
        try {
          await connection.query(`DELETE FROM ${table}`)
          console.log(`✓ Cleared ${table}`)
        } catch (error: any) {
          console.log(`⚠ Could not clear ${table}: ${error.message}`)
        }
      }

      await connection.query('SET FOREIGN_KEY_CHECKS = 1')
    }

    // Restore data table by table - all 72 tables in dependency order
    console.log('Restoring database tables...')
    
    const questionRestoreOrder = [
      'subjects', 'topics', 'question_types', 'questions',
      'question_options', 'question_topics', 'question_evaluations',
      'question_feedback'
    ]
    
    const fullRestoreOrder = [
      // Core settings first
      'admin_settings', 'site_settings',
      
      // Users and authentication
      'users',
      'user_blocks', 'user_permissions', 'user_role_assignments',
      'user_sessions', 'user_preferences', 'user_activity_log',
      'verification_codes', 'password_resets',
      'oauth_providers', 'oauth_accounts', 'oauth_tokens',
      
      // Organizations
      'organizations', 'organization_members',
      
      // Academic structure
      'programs', 'subjects', 'topics',
      'question_types',
      
      // Questions
      'questions', 'question_options', 'question_topics',
      'question_evaluations', 'question_feedback',
      
      // Exams
      'exams', 'exam_programs', 'exam_questions', 'exam_question_selections',
      
      // Enrollments and registrations
      'program_enrollments', 'exam_registrations',
      
      // Exam execution
      'exam_attempts', 'exam_progress', 'exam_answers', 'student_answers',
      'answer_drafts',
      
      // Evaluations and results
      'evaluations', 'exam_results',
      
      // Payments
      'payment_transactions', 'transactions',
      
      // Proctoring and security
      'proctoring_sessions', 'anti_cheat_logs', 'anti_cheat_events',
      'anti_cheat_logs_enhanced',
      
      // Analytics
      'page_visits', 'api_logs', 'login_attempts',
      'system_metrics', 'revenue_metrics', 'user_engagement_metrics',
      'traffic_analytics', 'cohort_analysis',
      
      // Support system
      'support_tickets', 'support_ticket_messages',
      'support_ticket_attachments', 'support_ticket_custom_fields',
      
      // Theme customization
      'theme_settings', 'theme_page_sections', 'theme_menu_items',
      'theme_custom_css', 'theme_presets', 'theme_audit_log',
      
      // Landing page
      'landing_config', 'landing_gradient_presets', 'landing_section_templates',
      'landing_sections', 'landing_menu_items', 'landing_images',
      'landing_version_history',
      
      // Notifications
      'notifications', 'notification_preferences',
      
      // Newsletter
      'newsletter_subscribers',
      
      // Coupons
      'coupons', 'coupon_usage'
    ]
    
    const restoreOrder = backupType === 'questions' ? questionRestoreOrder : fullRestoreOrder

    await connection.query('SET FOREIGN_KEY_CHECKS = 0')

    const restored: any = {}

    for (const table of restoreOrder) {
      if (dbBackup.tables[table] && dbBackup.tables[table].length > 0) {
        try {
          const rows = dbBackup.tables[table]
          
          for (const row of rows) {
            const columns = Object.keys(row)
            const values = Object.values(row)
            const placeholders = columns.map(() => '?').join(', ')
            
            const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
            
            try {
              await connection.query(query, values)
            } catch (insertError: any) {
              if (insertError.code === 'ER_DUP_ENTRY') {
                // Skip duplicate entries
                continue
              }
              throw insertError
            }
          }
          
          restored[table] = rows.length
          console.log(`✓ Restored ${table}: ${rows.length} rows`)
        } catch (error: any) {
          console.error(`✗ Error restoring ${table}:`, error.message)
          restored[table] = `Error: ${error.message}`
        }
      }
    }

    await connection.query('SET FOREIGN_KEY_CHECKS = 1')

    // Commit transaction
    await connection.commit()
    console.log('✓ Database restore completed')

    // Restore uploads if requested
    if (restoreUploads) {
      console.log('Restoring uploads...')
      const uploadsSource = join(extractDir, 'uploads')
      const uploadsDest = join(process.cwd(), 'public', 'uploads')
      
      try {
        await copyDir(uploadsSource, uploadsDest)
        console.log('✓ Uploads restored')
      } catch (error) {
        console.log('⚠ No uploads to restore or error occurred')
      }
    }

    // Restore configuration files (skip for questions-only)
    if (backupType === 'full') {
    console.log('Restoring configuration files...')
    const configSource = join(extractDir, 'config')
    
    try {
      const configFiles = await readdir(configSource)
      for (const file of configFiles) {
        if (file === '.env' || file === '.env.local') {
          const content = await readFile(join(configSource, file), 'utf-8')
          await writeFile(join(process.cwd(), file), content)
          console.log(`✓ Restored ${file}`)
        }
      }
    } catch (error) {
      console.log('⚠ No config files to restore')
    }
    }

    // Clean up temp files
    await rmDir(tempDir)

    console.log('✓ Restore completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Backup restored successfully',
      restored,
      metadata
    })
  } catch (error: any) {
    console.error('Restore error:', error)
    
    // Rollback transaction on error
    if (connection) {
      try {
        await connection.rollback()
        console.log('✓ Transaction rolled back')
      } catch (rollbackError) {
        console.error('Rollback error:', rollbackError)
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to restore backup',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  } finally {
    if (connection) {
      connection.release()
    }
  }
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
    const { readdir, unlink, rmdir } = await import('fs/promises')
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
