// Database result types for exam system
// Use these interfaces instead of any[] in API routes

export interface ExamAttemptRow {
  id: string
  exam_id: string
  student_id: string
  exam_registration_id: string | null
  start_time: Date
  end_time: Date | null
  duration_minutes: number
  status: 'ongoing' | 'submitted' | 'evaluated' | 'abandoned'
  attempt_number: number
  total_time_spent: number | null
  ip_address: string | null
  user_agent: string | null
  negative_marking: number
  submitted_at: Date | null
  created_at: Date
  updated_at: Date
  // Joined fields
  total_marks?: number
  passing_percentage?: number
  show_results?: boolean
}

export interface ExamResultRow {
  id: string
  exam_id: string
  student_id: string
  attempt_id: string
  attempt_number: number
  total_marks: number
  obtained_marks: number
  percentage: number
  grade: string
  correct_answers: number
  incorrect_answers: number
  unanswered: number
  time_spent: number | null
  status: 'pass' | 'fail'
  negative_marking_applied: number
  result_date: Date
  sections_data: string | null
  created_at: Date
  updated_at: Date
}

export interface ExamAnswerRow {
  id: string
  attempt_id: string
  question_id: string
  answer_text: string | null
  is_correct: boolean
  marks_obtained: number
  time_spent: number | null
  is_marked_for_review: boolean
  created_at: Date
  updated_at: Date
}

export interface QuestionRow {
  id: string
  question_text: string
  question_type_id: string
  subject_id: string
  topic_id: string | null
  difficulty_level: 'easy' | 'medium' | 'hard'
  marks: number
  negative_marks: number
  explanation: string | null
  question_image: string | null
  time_limit: number | null
  randomize_options: boolean
  created_by: string
  created_at: Date
  updated_at: Date
  // Joined fields
  question_type_name?: string
  subject_name?: string
  topic_name?: string
}

export interface QuestionOptionRow {
  id: string
  question_id: string
  option_text: string
  option_label: string
  is_correct: boolean
  sequence: number
  option_image: string | null
  created_at: Date
  updated_at: Date
}

export interface ExamRow {
  id: string
  title: string
  description: string | null
  instructions: string | null
  program_id: string | null
  subject_id: string | null
  duration_minutes: number
  total_questions: number
  total_marks: number
  passing_percentage: number
  passing_marks: number
  exam_date: Date
  exam_start_time: string
  exam_end_time: string
  exam_time: string
  status: 'draft' | 'published' | 'archived' | 'completed'
  proctoring_enabled: boolean
  anti_cheat_enabled: boolean
  randomize_questions: boolean
  randomize_options: boolean
  show_results_immediately: boolean
  allow_review_answers: boolean
  auto_submit_on_time_end: boolean
  enrollment_fee: number
  negative_marking: number
  created_by: string
  created_at: Date
  updated_at: Date
  // Joined fields
  subject_name?: string
  program_name?: string
  program_title?: string
}

export interface ExamProgressRow {
  id: string
  attempt_id: string
  current_question_index: number
  answers_json: string
  flagged_questions_json: string
  last_updated: Date
  created_at: Date
  updated_at: Date
}

export interface AntiCheatEventRow {
  id: string
  attempt_id: string
  event_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  metadata: string
  timestamp: Date
  created_at: Date
}

export interface UserRow {
  id: string
  email: string
  password: string
  full_name: string
  role: 'admin' | 'student' | 'teacher'
  phone: string | null
  avatar: string | null
  status: 'active' | 'inactive' | 'suspended'
  email_verified: boolean
  created_at: Date
  updated_at: Date
}

export interface SubjectRow {
  id: string
  name: string
  code: string
  description: string | null
  created_at: Date
  updated_at: Date
}

export interface ProgramRow {
  id: string
  title: string
  description: string | null
  duration_months: number | null
  fee: number | null
  status: 'active' | 'inactive'
  created_at: Date
  updated_at: Date
}

export interface ExamRegistrationRow {
  id: string
  exam_id: string
  student_id: string
  status: 'registered' | 'cancelled'
  registration_date: Date
  payment_status: 'pending' | 'paid' | 'failed'
  created_at: Date
  updated_at: Date
}

// Utility type for database query results
export type QueryResult<T> = T[]

// Type guards for safer type checking
export function isExamAttemptRow(row: any): row is ExamAttemptRow {
  return row && typeof row.id === 'string' && typeof row.exam_id === 'string'
}

export function isQuestionRow(row: any): row is QuestionRow {
  return row && typeof row.id === 'string' && typeof row.question_text === 'string'
}
