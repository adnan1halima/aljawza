// تعريفات أنواع بيانات قاعدة البيانات (مطابقة لملف supabase/schema.sql)

export type Behavior =
  | "ممتاز"
  | "جيد جدًا"
  | "جيد"
  | "يحتاج متابعة"
  | "يحتاج تحسين";

export type RecitationType = "جديد" | "مراجعة";

export interface Profile {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
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
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  teacher_id: string;
  date: string;
  is_present: boolean;
  surah: string | null;
  from_ayah: number | null;
  to_ayah: number | null;
  memorization_amount: number;
  recitation_type: RecitationType | null;
  evaluation: string | null;
  behavior: Behavior | null;
  notes: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; name: string; email: string };
        Update: Partial<Profile>;
      };
      students: {
        Row: Student;
        Insert: Partial<Student> & { teacher_id: string; name: string };
        Update: Partial<Student>;
      };
      attendance_records: {
        Row: AttendanceRecord;
        Insert: Partial<AttendanceRecord> & {
          student_id: string;
          teacher_id: string;
          date: string;
          is_present: boolean;
        };
        Update: Partial<AttendanceRecord>;
      };
    };
  };
}
