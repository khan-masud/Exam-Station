import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"

export interface DataTablePaginationProps {
  currentPage: number
  totalPages: number
  totalItems?: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  showPageSizeSelector?: boolean
  pageSizeOptions?: number[]
  maxVisiblePages?: number
  className?: string
  isLoading?: boolean
}

export function DataTablePagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  showPageSizeSelector = true,
  pageSizeOptions = [10, 20, 50, 100],
  maxVisiblePages = 5,
  className = "",
  isLoading = false
}: DataTablePaginationProps) {
  const canGoPrev = currentPage > 1 && !isLoading
  const canGoNext = currentPage < totalPages && !isLoading

  // Calculate visible page numbers
  const getVisiblePages = () => {
    const pages: number[] = []
    const half = Math.floor(maxVisiblePages / 2)
    
    let start = Math.max(1, currentPage - half)
    let end = Math.min(totalPages, start + maxVisiblePages - 1)
    
    if (end - start < maxVisiblePages - 1) {
      start = Math.max(1, end - maxVisiblePages + 1)
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    return pages
  }

  const visiblePages = getVisiblePages()
  const showFirstLast = totalPages > maxVisiblePages

  // Calculate item range
  const startItem = totalItems ? (currentPage - 1) * pageSize + 1 : 0
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : 0

  if (totalPages === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No items to display
      </div>
    )
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
      {/* Left side - Items info and page size selector */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        {totalItems !== undefined && (
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{startItem}</span> to{" "}
            <span className="font-medium">{endItem}</span> of{" "}
            <span className="font-medium">{totalItems}</span> items
          </div>
        )}
        
        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Per page:</span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(parseInt(value))}
              disabled={isLoading}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Right side - Page navigation */}
      <div className="flex items-center gap-2">
        {/* First page button */}
        {showFirstLast && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(1)}
            disabled={!canGoPrev}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Previous page button */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrev}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        <div className="flex items-center gap-1">
          {visiblePages.map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(page)}
              disabled={isLoading}
              aria-label={`Go to page ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </Button>
          ))}
        </div>

        {/* Next page button */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          aria-label="Go to next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page button */}
        {showFirstLast && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onPageChange(totalPages)}
            disabled={!canGoNext}
            aria-label="Go to last page"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Simplified pagination component without page size selector
 */
export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  className = "",
  isLoading = false
}: Pick<DataTablePaginationProps, "currentPage" | "totalPages" | "onPageChange" | "className" | "isLoading">) {
  return (
    <DataTablePagination
      currentPage={currentPage}
      totalPages={totalPages}
      pageSize={10}
      onPageChange={onPageChange}
      showPageSizeSelector={false}
      className={className}
      isLoading={isLoading}
    />
  )
}
