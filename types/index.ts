// User related types
export interface User {
  id: string
  email: string
  full_name: string
  fullName?: string // Alternative naming
  role: UserRole
  status: UserStatus
  created_at: string
  last_login_at?: string
  last_login_ip?: string
  is_blocked?: boolean
  blocked_until?: string
}

export type UserRole = "admin" | "student" | "proctor" | "teacher"
export type UserStatus = "active" | "inactive" | "suspended"

// Exam related types
export interface Exam {
  id: string
  title: string
  description?: string | null
  subject_id: string
  subject_name?: string
  program_id?: string | null
  program_name?: string
  duration_minutes: number
  total_questions: number
  total_marks: number
  passing_percentage: number
  passing_marks?: number
  exam_date: string | null
  exam_start_time?: string | null
  exam_end_time?: string | null
  status: ExamStatus
  difficulty_level: DifficultyLevel
  allow_multiple_attempts: boolean
  max_attempts?: number
  enrollment_fee?: number
  instructions?: string | null
  proctoring_enabled?: boolean
  allow_answer_change?: boolean
  show_question_counter?: boolean
  allow_answer_review?: boolean
  created_at: string
  created_by: string
  created_by_name?: string
}

export type ExamStatus = "draft" | "scheduled" | "ongoing" | "completed" | "cancelled"
export type DifficultyLevel = "easy" | "medium" | "hard"

// Question related types
export interface Question {
  id: string
  question_text: string
  question_type_id: number
  question_type_name: string
  subject_id: string
  subject_name?: string
  difficulty_level: DifficultyLevel
  marks: number
  negative_marks: number
  allow_multiple_answers: boolean
  randomize_options: boolean
  explanation?: string
  time_limit?: number | null
  options?: QuestionOption[]
  topics?: string[]
}

export interface QuestionOption {
  id?: string
  option_text: string
  option_label: string
  is_correct: boolean
  order?: number
}

export type QuestionType = 
  | "Single Choice MCQ" 
  | "Multiple Choice MCQ" 
  | "True/False" 
  | "Fill in the Blank" 
  | "Essay" 
  | "Short Answer"

// Program related types
export interface Program {
  id: string
  title: string
  description?: string | null
  cover_image?: string | null
  enrollment_fee: number
  max_students?: number | null
  status: ProgramStatus
  enrolled_count: number
  exam_count?: number
  start_date?: string | null
  end_date?: string | null
  created_at: string
  created_by: string
  created_by_name?: string
  isEnrolled?: boolean
  enrollmentStatus?: string | null
  isFull?: boolean
}

export type ProgramStatus = "draft" | "published" | "archived"

// Payment related types
export interface Transaction {
  id: string
  user_id: string
  userName?: string
  userEmail?: string
  amount: number
  payment_gateway?: string
  gateway?: string
  payment_method?: string
  payment_status?: string
  status?: string
  transaction_reference?: string
  reference?: string
  payment_details?: PaymentDetails | string
  payment_proof?: string | null
  admin_notes?: string | null
  created_at: string
  date?: string
  exam_id?: string
  examTitle?: string
  program_id?: string
  programTitle?: string
}

export interface PaymentDetails {
  payment_method_name?: string
  transaction_id?: string
  [key: string]: any
}

export type PaymentStatus = "pending" | "approved" | "rejected" | "completed" | "failed"

export interface PaymentMethod {
  id: string
  name: string
  instructions: string
  details?: PaymentMethodDetails | null
}

export interface PaymentMethodDetails {
  bankName?: string
  accountName?: string
  accountNumber?: string
  routingNumber?: string
  swiftCode?: string
  branch?: string
  provider?: string
  number?: string
}

// Exam Attempt related types
export interface ExamAttempt {
  id: string
  exam_id: string
  student_id: string
  attempt_number: number
  start_time: string
  end_time?: string | null
  time_spent?: number
  status: AttemptStatus
  obtained_marks?: number
  percentage?: number
  result?: string
  created_at: string
}

export type AttemptStatus = "ongoing" | "submitted" | "evaluated" | "abandoned"

// Exam Result related types
export interface ExamResult {
  id: string
  exam_id: string
  student_id: string
  attempt_id: string
  obtained_marks: number
  percentage: number
  status: ResultStatus
  time_spent: number
  result_date: string
  attempt_number: number
  exam_title?: string
  subject_name?: string
}

export type ResultStatus = "pass" | "fail" | "pending"

// Subject related types
export interface Subject {
  id: string
  name: string
  description?: string
  code?: string
  created_at: string
}

// Topic related types
export interface Topic {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  created_at: string
}

// Dashboard Stats types
export interface AdminDashboardStats {
  totalUsers: number
  usersThisWeek: number
  totalExams: number
  activeExams: number
  examsToday: number
  totalPrograms: number
  publishedPrograms: number
  totalProgramEnrollments: number
  enrollmentsThisWeek: number
  totalAttempts: number
  pendingAttempts: number
  totalRevenue: number
  revenueGrowth: number
  pendingPaymentApprovals?: number
}

export interface StudentDashboardStats {
  totalExamsTaken: number
  averagePercentage: number
  passedCount: number
  failedCount: number
  highestScore: number
  lowestScore: number
  enrolledPrograms: number
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Settings types
export interface SystemSettings {
  userManagement: UserManagementSettings
  payments: PaymentSettings
  antiCheat: AntiCheatSettings
  userPermissions: UserPermissionsSettings
  examSettings: ExamSettingsConfig
  security: SecuritySettings
  general: GeneralSettings
}

export interface UserManagementSettings {
  allowSelfRegistration: boolean
  requireEmailVerification: boolean
  requireAdminApproval: boolean
  minPasswordLength: number
  requireStrongPassword: boolean
  maxLoginAttempts: number
  lockoutDuration: number
}

export interface PaymentSettings {
  allowManualPayments: boolean
  autoApprovePayments: boolean
  paymentCurrency: string
  manualPaymentEnabled: boolean
  allowCash: boolean
  allowBankTransfer: boolean
  allowMobileMoney: boolean
  allowCheque: boolean
  allowOther: boolean
  requirePaymentProof: boolean
  [key: string]: any
}

export interface AntiCheatSettings {
  proctoringEnabled: boolean
  faceDetectionEnabled: boolean
  tabSwitchDetection: boolean
  copyPasteDisabled: boolean
  autoSubmitOnViolation: boolean
  maxViolations: number
}

export interface UserPermissionsSettings {
  studentsCanDownloadCertificates: boolean
  maxExamAttemptsPerStudent: number
  allowExamRetake: boolean
  retakeCooldownDays: number
}

export interface ExamSettingsConfig {
  shuffleQuestions: boolean
  showResultsImmediately: boolean
  allowReviewAfterSubmission: boolean
}

export interface SecuritySettings {
  enableRateLimiting: boolean
  maxRequestsPerMinute: number
}

export interface GeneralSettings {
  organizationName: string
  sessionTimeout: number
}

// Form data types
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  password: string
  full_name: string
  role: UserRole
  organization_name?: string
}

// Utility types
export type SortOrder = "asc" | "desc"
export type FilterOperator = "equals" | "contains" | "startsWith" | "endsWith" | "gt" | "lt" | "gte" | "lte"
