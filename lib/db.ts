import mysql, { ConnectionOptions, Pool } from "mysql2/promise"

const defaultConnectionOptions: ConnectionOptions = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "exam_system",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
}

let pool: Pool | null = null

// Initialize pool on first import
function initializePool(): Pool {
  if (pool) return pool
  
  pool = mysql.createPool(defaultConnectionOptions)
  
  return pool
}

export function getPool(): Pool {
  if (!pool) {
    return initializePool()
  }
  return pool
}

export async function setPool(options: ConnectionOptions) {
  // Close the existing pool before creating a new one
  if (pool) {
    try {
      await pool.end()
      console.log('[DB] Old pool closed')
    } catch (err) {
      console.warn('[DB] Error closing old pool:', err)
    }
  }
  
  console.log('[DB] Creating new pool with config:', {
    host: options.host,
    user: options.user,
    database: options.database,
    port: options.port,
  })
  
  pool = mysql.createPool(options)
  
  return pool
}

export async function query(sql: string, values?: any[]): Promise<any[]> {
  const currentPool = getPool()
  try {
    const [results] = await currentPool.query(sql, values || [])
    return results as any[]
  } catch (error) {
    console.error("[DB] Database query error:", error)
    throw error
  }
}

export async function getConnection() {
  const currentPool = getPool()
  return await currentPool.getConnection()
}

// Create a proxy object that always returns the current pool
// This allows "import pool from '@/lib/db'" to work with dynamic pool updates
class PoolProxy {
  execute(sql: string, values?: any[]) {
    return getPool().execute(sql, values) as any
  }
  query(sql: string, values?: any[]) {
    return getPool().query(sql, values) as any
  }
  getConnection() {
    return getPool().getConnection() as any
  }
  once(event: string, listener: Function) {
    return getPool().once(event as any, listener as any)
  }
  on(event: string, listener: Function) {
    return getPool().on(event as any, listener as any)
  }
  end() {
    return getPool().end() as any
  }
}

const proxyPool = new PoolProxy()

export default proxyPool as unknown as Pool
