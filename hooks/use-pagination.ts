import { useState, useCallback, useMemo } from 'react'

export interface UsePaginationOptions {
  initialPage?: number
  initialPageSize?: number
  totalItems?: number
}

export interface UsePaginationReturn {
  // Current state
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  
  // Computed values
  offset: number
  hasNextPage: boolean
  hasPrevPage: boolean
  startItem: number
  endItem: number
  
  // Actions
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setTotalItems: (total: number) => void
  nextPage: () => void
  prevPage: () => void
  firstPage: () => void
  lastPage: () => void
  reset: () => void
  
  // Utility
  getQueryParams: () => { page: number; limit: number; offset: number }
}

/**
 * Custom hook for managing pagination state
 * 
 * @example
 * ```tsx
 * const pagination = usePagination({ initialPageSize: 20 })
 * 
 * // In your fetch function
 * const fetchData = async () => {
 *   const { page, limit } = pagination.getQueryParams()
 *   const response = await fetch(`/api/items?page=${page}&limit=${limit}`)
 *   const data = await response.json()
 *   pagination.setTotalItems(data.pagination.total)
 * }
 * 
 * // In your component
 * <DataTablePagination
 *   currentPage={pagination.page}
 *   totalPages={pagination.totalPages}
 *   pageSize={pagination.pageSize}
 *   onPageChange={pagination.setPage}
 *   onPageSizeChange={pagination.setPageSize}
 * />
 * ```
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = 1,
    initialPageSize = 10,
    totalItems: initialTotalItems = 0
  } = options

  const [page, setPageState] = useState(initialPage)
  const [pageSize, setPageSizeState] = useState(initialPageSize)
  const [totalItems, setTotalItems] = useState(initialTotalItems)

  // Computed values
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / pageSize)),
    [totalItems, pageSize]
  )

  const offset = useMemo(
    () => (page - 1) * pageSize,
    [page, pageSize]
  )

  const hasNextPage = useMemo(
    () => page < totalPages,
    [page, totalPages]
  )

  const hasPrevPage = useMemo(
    () => page > 1,
    [page]
  )

  const startItem = useMemo(
    () => totalItems > 0 ? offset + 1 : 0,
    [totalItems, offset]
  )

  const endItem = useMemo(
    () => totalItems > 0 ? Math.min(offset + pageSize, totalItems) : 0,
    [totalItems, offset, pageSize]
  )

  // Actions
  const setPage = useCallback((newPage: number) => {
    setPageState(Math.max(1, Math.min(newPage, totalPages)))
  }, [totalPages])

  const setPageSize = useCallback((newSize: number) => {
    setPageSizeState(Math.max(1, Math.min(newSize, 100)))
    setPageState(1) // Reset to first page when changing page size
  }, [])

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPageState(prev => prev + 1)
    }
  }, [hasNextPage])

  const prevPage = useCallback(() => {
    if (hasPrevPage) {
      setPageState(prev => prev - 1)
    }
  }, [hasPrevPage])

  const firstPage = useCallback(() => {
    setPageState(1)
  }, [])

  const lastPage = useCallback(() => {
    setPageState(totalPages)
  }, [totalPages])

  const reset = useCallback(() => {
    setPageState(initialPage)
    setPageSizeState(initialPageSize)
    setTotalItems(initialTotalItems)
  }, [initialPage, initialPageSize, initialTotalItems])

  const getQueryParams = useCallback(() => ({
    page,
    limit: pageSize,
    offset
  }), [page, pageSize, offset])

  return {
    // State
    page,
    pageSize,
    totalItems,
    totalPages,
    
    // Computed
    offset,
    hasNextPage,
    hasPrevPage,
    startItem,
    endItem,
    
    // Actions
    setPage,
    setPageSize,
    setTotalItems,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    reset,
    
    // Utility
    getQueryParams
  }
}

/**
 * Hook for syncing pagination state with URL query parameters
 */
export function usePaginationWithURL(options: UsePaginationOptions = {}) {
  const pagination = usePagination(options)
  
  // You can extend this to sync with URL params using useSearchParams
  // For now, returns the basic pagination hook
  return pagination
}
