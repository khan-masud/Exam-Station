import fs from "fs/promises"
import { existsSync } from "fs"
import path from "path"

// Get the application root directory
function getAppRoot(): string {
  // Try multiple possible root directories in order of preference
  const possibleRoots = [
    process.env.APP_ROOT || '',
    process.cwd(),  // Next.js uses cwd() for the root
    '/home/nationa1/exam.nationalian.com',
    path.dirname(require.main?.filename || ''),
  ].filter(Boolean)

  // First priority: use cwd() if package.json exists there
  const cwd = process.cwd()
  if (existsSync(path.join(cwd, 'package.json'))) {
    console.log('[Install] Using app root from cwd():', cwd)
    return cwd
  }

  // Fallback: find first directory with package.json
  const root = possibleRoots.find(r => r && existsSync(path.join(r, 'package.json')))
  
  if (root) {
    console.log('[Install] Using app root (found package.json):', root)
    return root
  }
  
  console.log('[Install] Could not find app root with package.json, using cwd:', cwd)
  return cwd
}

const APP_ROOT = getAppRoot()
const INSTALL_FLAG_PATH = path.join(APP_ROOT, ".installed")
const ENV_PATH = path.join(APP_ROOT, ".env")

/**
 * Checks if the application is already installed by looking for the .installed flag file
 * and verifying .env file exists.
 * This function is designed to be called server-side.
 * @returns {Promise<boolean>}
 */
export async function isInstalledServer(): Promise<boolean> {
  try {
    console.log('[Install] Checking installation status at:', { APP_ROOT, INSTALL_FLAG_PATH, ENV_PATH })
    
    // Check for installation flag file
    let installedFileExists = false
    try {
      await fs.access(INSTALL_FLAG_PATH)
      installedFileExists = true
      console.log('[Install] ✓ .installed flag file found at:', INSTALL_FLAG_PATH)
    } catch (err: any) {
      console.log('[Install] ✗ .installed flag file not found at:', INSTALL_FLAG_PATH, '(error:', err?.message || String(err), ')')
    }
    
    // Check if .env file exists
    let envFileExists = false
    try {
      await fs.access(ENV_PATH)
      envFileExists = true
      const envContent = await fs.readFile(ENV_PATH, 'utf-8')
      const hasDbConfig = envContent.includes('DB_HOST') && envContent.includes('DB_NAME')
      console.log('[Install] ✓ .env file found at:', ENV_PATH, '(has DB config:', hasDbConfig, ')')
      envFileExists = hasDbConfig // Only consider installed if .env has DB config
    } catch (err: any) {
      console.log('[Install] ✗ .env file not found or unreadable at:', ENV_PATH, '(error:', err?.message || String(err), ')')
    }

    const isInstalled = installedFileExists && envFileExists
    console.log('[Install] Installation status:', { installed: isInstalled, installedFileExists, envFileExists, APP_ROOT })
    
    return isInstalled
  } catch (error) {
    console.error('[Install] Error checking installation status:', error)
    return false
  }
}

/**
 * Marks the application as installed
 * @param {Object} installData - Installation metadata
 */
export async function markAsInstalled(installData: {
  installedAt: string
  dbHost: string
  dbName: string
  dbUser: string
  adminEmail: string
}): Promise<void> {
  try {
    console.log('[Install] Writing .installed flag file to:', INSTALL_FLAG_PATH)
    
    const content = JSON.stringify(installData, null, 2)
    await fs.writeFile(INSTALL_FLAG_PATH, content, 'utf-8')
    
    // Verify the file was actually written
    const written = await fs.readFile(INSTALL_FLAG_PATH, 'utf-8')
    if (written.includes(installData.adminEmail)) {
      console.log('[Install] ✓ .installed flag file successfully written and verified')
    } else {
      console.error('[Install] ✗ .installed flag file written but verification failed')
    }
  } catch (error: any) {
    console.error('[Install] Failed to write .installed flag file:', error)
    throw new Error(`Failed to mark installation: ${error.message}`)
  }
}

/**
 * Writes environment variables to .env file
 * @param {Object} envVars - Environment variables to write
 */
export async function writeEnvFile(envVars: Record<string, string>): Promise<void> {
  try {
    const envContent = Object.entries(envVars)
      .map(([key, value]) => {
        // Escape special characters in values
        const escapedValue = value.includes(' ') || value.includes('#') 
          ? `"${value.replace(/"/g, '\\"')}"` 
          : value
        return `${key}=${escapedValue}`
      })
      .join('\n')

    console.log('[Install] Writing .env file to:', ENV_PATH)
    console.log('[Install] .env content keys:', Object.keys(envVars).join(', '))
    
    await fs.writeFile(ENV_PATH, envContent + '\n', 'utf-8')
    
    // Verify the file was actually written
    const written = await fs.readFile(ENV_PATH, 'utf-8')
    if (written.includes('DB_HOST')) {
      console.log('[Install] ✓ .env file successfully written and verified')
    } else {
      console.error('[Install] ✗ .env file written but verification failed')
    }
  } catch (error: any) {
    console.error('[Install] Failed to write .env file:', error)
    throw new Error(`Failed to write .env file: ${error.message}`)
  }
}

/**
 * Checks if .env file exists
 */
export async function envFileExists(): Promise<boolean> {
  try {
    await fs.access(ENV_PATH)
    return true
  } catch {
    return false
  }
}
