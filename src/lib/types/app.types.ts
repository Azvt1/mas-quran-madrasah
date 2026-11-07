// ============================================================
// Application Types
// These mirror the database schema exactly.
// ============================================================

export type UserRole          = 'admin' | 'teacher' | 'student'
export type StudentType       = 'iqra' | 'quran'
export type AttendanceStatus  = 'present' | 'late' | 'absent'
export type ClassDay          = 'tuesday' | 'thursday'
export type FileType          = 'pdf' | 'audio' | 'image'
export type InvitationChannel = 'manual' | 'link' | 'whatsapp'

export interface Profile {
  id:         string
  role:       UserRole
  full_name:  string
  phone:      string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Student {
  id:              string
  profile_id:      string | null
  teacher_id:      string | null
  student_type:    StudentType
  date_of_birth:   string | null
  enrollment_date: string
  is_active:       boolean
  created_at:      string
  updated_at:      string
  // Joined fields (optional — populated by specific queries)
  profile?:  Profile
  teacher?:  Profile
}

export interface Invitation {
  id:         string
  created_by: string | null
  email:      string | null
  phone:      string | null
  role:       UserRole
  teacher_id: string | null
  token:      string
  sent_via:   InvitationChannel
  expires_at: string | null
  used_at:    string | null
  created_at: string
}

export interface ClassSession {
  id:           string
  session_date: string
  day_of_week:  ClassDay
  teacher_id:   string | null
  notes:        string | null
  created_at:   string
}

export interface AttendanceRecord {
  id:          string
  session_id:  string
  student_id:  string
  status:      AttendanceStatus
  notes:       string | null
  recorded_at: string
}

export interface IqraProgress {
  id:              string
  student_id:      string
  current_book:    number
  current_page:    number
  completed_pages: Record<string, number[]>
  teacher_notes:   string | null
  updated_at:      string
  updated_by:      string | null
}

export interface QuranProgress {
  id:            string
  student_id:    string
  current_surah: number
  current_juz:   number
  current_page:  number
  teacher_notes: string | null
  updated_at:    string
  updated_by:    string | null
}

export interface ProgressSnapshot {
  id:           string
  student_id:   string
  student_type: StudentType
  data:         Record<string, unknown>
  recorded_at:  string
  recorded_by:  string | null
}

export interface LibraryFile {
  id:          string
  teacher_id:  string | null
  title:       string
  description: string | null
  file_url:    string
  file_type:   FileType
  file_size:   number | null
  created_at:  string
}

export interface Homework {
  id:              string
  teacher_id:      string | null
  title:           string
  instructions:    string | null
  due_date:        string | null
  book_reference:  string | null
  library_file_id: string | null
  audio_file_url:  string | null
  created_at:      string
  updated_at:      string
}

export interface HomeworkAssignment {
  id:           string
  homework_id:  string
  student_id:   string
  is_completed: boolean
  completed_at: string | null
  assigned_at:  string
}

export interface StudentNote {
  id:                     string
  student_id:             string
  teacher_id:             string | null
  content:                string
  is_visible_to_student:  boolean
  created_at:             string
  updated_at:             string
}
