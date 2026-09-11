// تعريفات أنواع بيانات قاعدة البيانات (مطابقة لملف supabase/schema.sql + migration_02)

export type Behavior =
  | "ممتاز"
  | "جيد جدًا"
  | "جيد"
  | "يحتاج متابعة"
  | "يحتاج تحسين";

export type RecitationType = "جديد" | "مراجعة";

export type AttendanceStatus = "حضور" | "غياب" | "غياب مبرر" | "تأخر";

// عدد الصفحات محصور بين 1 و5، والتقييم محصور بين 1 و3 (حسب جدول النقاط)
export type PagesCount = 1 | 2 | 3 | 4 | 5;
export type Rating = 1 | 2 | 3;
export type DressCode = 0 | 1 | 2 | 3;
export type Manners = 0 | 5;

export interface Profile {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
}

export interface Student {
  id: string;
  teacher_id: string;
  name: string;
  phone: string | null;
  housing: string | null;
  previous_memorization: string | null;
  notes: string | null;
  accumulated_points: number; // النقاط السابقة (تراكمية، تلقائية)
  distributed_points: number; // النقاط الموزعة (يدوية من المعلم)
  grand_total: number; // المجموع الكلي (تلقائي = السابقة + الموزعة)
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  teacher_id: string;
  date: string;
  status: AttendanceStatus;
  is_present: boolean; // محسوب تلقائيًا من status (حضور/تأخر = true)
  surah: string | null;
  from_ayah: number | null;
  to_ayah: number | null;
  recitation_type: RecitationType | null;
  evaluation: string | null;
  behavior: Behavior | null;
  notes: string | null;
  // حقول نظام النقاط الجديد
  pages: PagesCount | null;
  rating: Rating | null;
  dress_code: DressCode;
  manners: Manners;
  discipline: number; // اختياري، رقم حر موجب أو سالب
  total_points: number; // محسوب تلقائيًا في قاعدة البيانات
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; name: string; email: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      students: {
        Row: Student;
        Insert: Partial<Student> & { teacher_id: string; name: string };
        Update: Partial<Student>;
        Relationships: [];
      };
      attendance_records: {
        Row: AttendanceRecord;
        Insert: Omit<Partial<AttendanceRecord>, "is_present" | "total_points"> & {
          student_id: string;
          teacher_id: string;
          date: string;
          status: AttendanceStatus;
        };
        Update: Partial<AttendanceRecord>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_mosque_ranking: {
        Args: { p_student_id: string };
        Returns: number;
      };
      is_current_user_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      calc_memorization_points: {
        Args: { p_pages: number | null; p_rating: number | null };
        Returns: number;
      };
      calc_status_points: {
        Args: { p_status: string };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
