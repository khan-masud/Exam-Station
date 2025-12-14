export interface User {
  id: string
  email: string
  full_name: string
  phone?: string
  role: "admin" | "student" | "proctor" | "teacher"
  status: "active" | "inactive" | "suspended"
  created_at: Date
  updated_at: Date
}

export interface AuthContext {
  userId: string
  email: string
  role: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  subscription_plan: "free" | "starter" | "professional" | "enterprise"
  subscription_status: "active" | "inactive" | "suspended"
}

export interface Exam {
  id: string
  title: string
  description: string
  duration_minutes: number
  total_questions: number
  total_marks: number
  exam_date: Date
  exam_start_time: string
  exam_end_time: string
  status: "draft" | "scheduled" | "ongoing" | "completed" | "cancelled"
  proctoring_enabled: boolean
  anti_cheat_enabled: boolean
}

export interface ExamAttempt {
  id: string
  exam_attempt_id: string
  attempt_number: number
  start_time: Date
  end_time?: Date
  submitted_at?: Date
  total_time_spent?: number
  status: "ongoing" | "submitted" | "evaluated" | "abandoned"
}

export interface StudentAnswer {
  id: string
  question_id: string
  answer_text?: string
  selected_option_id?: string
  is_marked_for_review: boolean
  time_spent: number
}
