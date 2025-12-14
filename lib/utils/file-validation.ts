import { toast } from "sonner"

export interface FileValidationOptions {
  maxSize?: number // in bytes
  allowedTypes?: string[]
  maxNameLength?: number
}

export interface FileValidationResult {
  valid: boolean
  error?: string
  file?: File
}

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024 // 5MB
const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf'
]
const DEFAULT_MAX_NAME_LENGTH = 200

/**
 * Validates a file based on provided options
 * @param file - The file to validate
 * @param options - Validation options
 * @returns Validation result
 */
export function validateFile(
  file: File | null | undefined,
  options: FileValidationOptions = {}
): FileValidationResult {
  if (!file) {
    return {
      valid: false,
      error: 'No file provided'
    }
  }

  const {
    maxSize = DEFAULT_MAX_SIZE,
    allowedTypes = DEFAULT_ALLOWED_TYPES,
    maxNameLength = DEFAULT_MAX_NAME_LENGTH
  } = options

  // Validate file type
  if (!allowedTypes.includes(file.type)) {
    const allowedExtensions = allowedTypes
      .map(type => type.split('/')[1].toUpperCase())
      .join(', ')
    return {
      valid: false,
      error: `Only ${allowedExtensions} files are allowed`
    }
  }

  // Validate file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(0)
    return {
      valid: false,
      error: `File size must be less than ${maxSizeMB}MB`
    }
  }

  // Validate file name length
  if (file.name.length > maxNameLength) {
    return {
      valid: false,
      error: 'File name is too long'
    }
  }

  // Check for potentially dangerous file names
  const dangerousPatterns = [
    /\.\.\//, // Path traversal
    /[<>:"|?*]/, // Invalid filename characters
    /^\./, // Hidden files
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(file.name)) {
      return {
        valid: false,
        error: 'Invalid file name'
      }
    }
  }

  return {
    valid: true,
    file
  }
}

/**
 * Validates and shows toast notifications for file validation
 * @param file - The file to validate
 * @param options - Validation options
 * @returns The validated file or null
 */
export function validateFileWithToast(
  file: File | null | undefined,
  options: FileValidationOptions = {}
): File | null {
  const result = validateFile(file, options)
  
  if (!result.valid) {
    toast.error(result.error || 'File validation failed')
    return null
  }

  return result.file || null
}

/**
 * Handles file input change with validation
 * @param event - The change event from file input
 * @param options - Validation options
 * @param onSuccess - Callback when file is valid
 * @param onError - Callback when file is invalid
 */
export function handleFileInputChange(
  event: React.ChangeEvent<HTMLInputElement>,
  options: FileValidationOptions = {},
  onSuccess?: (file: File) => void,
  onError?: (error: string) => void
): void {
  const file = event.target.files?.[0]
  
  if (!file) {
    return
  }

  const result = validateFile(file, options)

  if (!result.valid) {
    // Reset input
    event.target.value = ''
    
    if (onError) {
      onError(result.error || 'File validation failed')
    } else {
      toast.error(result.error || 'File validation failed')
    }
    return
  }

  if (onSuccess && result.file) {
    onSuccess(result.file)
  }
}

/**
 * Formats file size for display
 * @param bytes - Size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Gets file extension from filename
 * @param filename - The filename
 * @returns File extension (lowercase, without dot)
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase()
}

/**
 * Checks if file is an image
 * @param file - The file to check
 * @returns True if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Checks if file is a PDF
 * @param file - The file to check
 * @returns True if file is a PDF
 */
export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf'
}
