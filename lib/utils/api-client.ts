import { toast } from "sonner"

export interface APIError {
  error: string
  status: number
  details?: any
}

export class APIClient {
  private baseURL: string

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`
      let errorData: any = {}

      try {
        errorData = await response.json()
        errorMessage = errorData.error || errorData.message || errorMessage
      } catch {
        // Response is not JSON, use status text
        errorMessage = response.statusText || errorMessage
      }

      throw {
        error: errorMessage,
        status: response.status,
        details: errorData
      } as APIError
    }

    // Handle empty responses (204 No Content, etc.)
    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T
    }

    try {
      return await response.json()
    } catch (error) {
      throw {
        error: 'Failed to parse response JSON',
        status: response.status,
        details: error
      } as APIError
    }
  }

  async get<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    return this.handleResponse<T>(response)
  }

  async post<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const isFormData = data instanceof FormData

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      credentials: 'include',
      headers: isFormData ? options?.headers : {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: isFormData ? data : JSON.stringify(data),
      ...options,
    })

    return this.handleResponse<T>(response)
  }

  async put<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const isFormData = data instanceof FormData

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      credentials: 'include',
      headers: isFormData ? options?.headers : {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: isFormData ? data : JSON.stringify(data),
      ...options,
    })

    return this.handleResponse<T>(response)
  }

  async patch<T = any>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: JSON.stringify(data),
      ...options,
    })

    return this.handleResponse<T>(response)
  }

  async delete<T = any>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    return this.handleResponse<T>(response)
  }
}

// Create a singleton instance
export const apiClient = new APIClient()

// Helper function to handle API calls with toast notifications
export async function apiCallWithToast<T = any>(
  apiCall: () => Promise<T>,
  options?: {
    loadingMessage?: string
    successMessage?: string
    errorMessage?: string
    showLoading?: boolean
    showSuccess?: boolean
    showError?: boolean
  }
): Promise<T | null> {
  const {
    loadingMessage = 'Processing...',
    successMessage = 'Success!',
    errorMessage = 'An error occurred',
    showLoading = false,
    showSuccess = false,
    showError = true
  } = options || {}

  let toastId: string | number | undefined

  try {
    if (showLoading) {
      toastId = toast.loading(loadingMessage)
    }

    const result = await apiCall()

    if (toastId) {
      toast.dismiss(toastId)
    }

    if (showSuccess) {
      toast.success(successMessage)
    }

    return result
  } catch (error) {
    if (toastId) {
      toast.dismiss(toastId)
    }

    if (showError) {
      const message = (error as APIError).error || errorMessage
      toast.error(message)
    }

    // Rethrow if you want calling code to handle it
    return null
  }
}

// Helper to build query string
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ''
}
