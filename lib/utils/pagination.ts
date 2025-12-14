export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
}

export interface PaginationResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

/**
 * Build SQL pagination clause with LIMIT and OFFSET
 */
export function buildPaginationClause(page: number = 1, limit: number = 10): {
  sql: string
  offset: number
  limit: number
} {
  const validatedPage = Math.max(1, page)
  const validatedLimit = Math.min(Math.max(1, limit), 100) // Max 100 items per page
  const offset = (validatedPage - 1) * validatedLimit

  return {
    sql: `LIMIT ? OFFSET ?`,
    offset,
    limit: validatedLimit
  }
}

/**
 * Build pagination metadata for API responses
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
) {
  const totalPages = Math.ceil(total / limit)
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  }
}

/**
 * Parse pagination parameters from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
  page: number
  limit: number
} {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(
    Math.max(1, parseInt(searchParams.get('limit') || '10')),
    100
  )

  return { page, limit }
}

/**
 * Build WHERE clause from filters object
 */
export function buildWhereClause(
  filters: Record<string, any>,
  searchFields?: string[]
): {
  where: string
  params: any[]
} {
  const whereClauses: string[] = []
  const params: any[] = []

  // Handle search across multiple fields
  if (filters.search && searchFields && searchFields.length > 0) {
    const searchClauses = searchFields.map(field => `${field} LIKE ?`)
    whereClauses.push(`(${searchClauses.join(' OR ')})`)
    searchFields.forEach(() => params.push(`%${filters.search}%`))
  }

  // Handle individual filters
  Object.entries(filters).forEach(([key, value]) => {
    if (key === 'search') return // Already handled above
    
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        // IN clause for arrays
        if (value.length > 0) {
          whereClauses.push(`${key} IN (${value.map(() => '?').join(',')})`)
          params.push(...value)
        }
      } else {
        whereClauses.push(`${key} = ?`)
        params.push(value)
      }
    }
  })

  const where = whereClauses.length > 0 
    ? `WHERE ${whereClauses.join(' AND ')}` 
    : ''

  return { where, params }
}

/**
 * Build ORDER BY clause
 */
export function buildOrderByClause(
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'desc',
  allowedFields: string[] = []
): string {
  if (!sortBy) return ''
  
  // Security: only allow whitelisted fields
  if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    return ''
  }

  const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC'
  return `ORDER BY ${sortBy} ${order}`
}

/**
 * Complete pagination helper - combines all utilities
 */
export function buildPaginatedQuery(params: {
  baseSelect: string
  table: string
  joins?: string
  filters?: Record<string, any>
  searchFields?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  allowedSortFields?: string[]
  page?: number
  limit?: number
}): {
  dataQuery: string
  countQuery: string
  queryParams: any[]
  pagination: ReturnType<typeof buildPaginationClause>
} {
  const {
    baseSelect,
    table,
    joins = '',
    filters = {},
    searchFields = [],
    sortBy,
    sortOrder = 'desc',
    allowedSortFields = [],
    page = 1,
    limit = 10
  } = params

  // Build WHERE clause
  const { where, params: whereParams } = buildWhereClause(filters, searchFields)

  // Build ORDER BY clause
  const orderBy = buildOrderByClause(sortBy, sortOrder, allowedSortFields) || 'ORDER BY id DESC'

  // Build pagination
  const pagination = buildPaginationClause(page, limit)

  // Build complete queries
  const dataQuery = `
    ${baseSelect}
    FROM ${table}
    ${joins}
    ${where}
    ${orderBy}
    ${pagination.sql}
  `.trim()

  const countQuery = `
    SELECT COUNT(*) as total
    FROM ${table}
    ${joins}
    ${where}
  `.trim()

  const queryParams = [...whereParams, pagination.limit, pagination.offset]

  return {
    dataQuery,
    countQuery,
    queryParams: whereParams, // For count query
    pagination
  }
}

/**
 * Client-side pagination component props helper
 */
export function usePaginationProps(
  currentPage: number,
  totalPages: number,
  onPageChange: (page: number) => void
) {
  return {
    currentPage,
    totalPages,
    onPageChange,
    canGoPrev: currentPage > 1,
    canGoNext: currentPage < totalPages,
    goToFirst: () => onPageChange(1),
    goToLast: () => onPageChange(totalPages),
    goToPrev: () => onPageChange(Math.max(1, currentPage - 1)),
    goToNext: () => onPageChange(Math.min(totalPages, currentPage + 1)),
    getPageNumbers: (maxVisible: number = 5) => {
      const pages: number[] = []
      const half = Math.floor(maxVisible / 2)
      
      let start = Math.max(1, currentPage - half)
      let end = Math.min(totalPages, start + maxVisible - 1)
      
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1)
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      return pages
    }
  }
}
