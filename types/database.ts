import type { UserRole } from "@/types/domain";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      roles: {
        Row: {
          id: UserRole;
          label: string;
          created_at: string;
        };
        Insert: {
          id: UserRole;
          label: string;
          created_at?: string;
        };
        Update: {
          label?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          role: UserRole;
          role_source: "explicit" | "fallback";
          avatar_path: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          role: UserRole;
          role_source?: "explicit" | "fallback";
          avatar_path?: string | null;
          created_at?: string;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          role?: UserRole;
          role_source?: "explicit" | "fallback";
          avatar_path?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      programs: {
        Row: {
          id: string;
          title: string;
          slug: string;
          description: string;
          price_cents: number;
          shopify_product_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          description: string;
          price_cents: number;
          shopify_product_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          slug?: string;
          description?: string;
          price_cents?: number;
          shopify_product_id?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      program_modules: {
        Row: {
          id: string;
          program_id: string;
          title: string;
          description: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          program_id: string;
          title: string;
          description?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      program_lessons: {
        Row: {
          id: string;
          program_id: string;
          module_id: string;
          title: string;
          summary: string;
          content: string;
          sort_order: number;
          estimated_minutes: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          program_id: string;
          module_id: string;
          title: string;
          summary?: string;
          content?: string;
          sort_order?: number;
          estimated_minutes?: number;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          module_id?: string;
          title?: string;
          summary?: string;
          content?: string;
          sort_order?: number;
          estimated_minutes?: number;
          is_published?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      lesson_tasks: {
        Row: {
          id: string;
          lesson_id: string;
          title: string;
          instructions: string;
          task_type: Database["public"]["Enums"]["lesson_task_type"];
          sort_order: number;
          is_required: boolean;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lesson_id: string;
          title: string;
          instructions?: string;
          task_type?: Database["public"]["Enums"]["lesson_task_type"];
          sort_order?: number;
          is_required?: boolean;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          instructions?: string;
          task_type?: Database["public"]["Enums"]["lesson_task_type"];
          sort_order?: number;
          is_required?: boolean;
          due_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      cohorts: {
        Row: {
          id: string;
          teacher_id: string;
          program_id: string | null;
          title: string;
          description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          program_id?: string | null;
          title: string;
          description?: string;
          created_at?: string;
        };
        Update: {
          program_id?: string | null;
          title?: string;
          description?: string;
        };
        Relationships: [];
      };
      teacher_student_assignments: {
        Row: {
          id: string;
          teacher_id: string;
          student_id: string;
          cohort_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          student_id: string;
          cohort_id?: string | null;
          created_at?: string;
        };
        Update: {
          cohort_id?: string | null;
        };
        Relationships: [];
      };
      program_resources: {
        Row: {
          id: string;
          program_id: string;
          module_id: string | null;
          lesson_id: string | null;
          title: string;
          description: string;
          resource_type: "link" | "file";
          external_url: string | null;
          bucket: string | null;
          storage_path: string | null;
          file_name: string | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          program_id: string;
          module_id?: string | null;
          lesson_id?: string | null;
          title: string;
          description?: string;
          resource_type: "link" | "file";
          external_url?: string | null;
          bucket?: string | null;
          storage_path?: string | null;
          file_name?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          module_id?: string | null;
          lesson_id?: string | null;
          title?: string;
          description?: string;
          resource_type?: "link" | "file";
          external_url?: string | null;
          bucket?: string | null;
          storage_path?: string | null;
          file_name?: string | null;
          is_published?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_lesson_progress: {
        Row: {
          id: string;
          user_id: string;
          program_id: string;
          lesson_id: string;
          status: "not_started" | "in_progress" | "completed";
          last_viewed_at: string | null;
          completed_at: string | null;
          updated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          program_id: string;
          lesson_id: string;
          status?: "not_started" | "in_progress" | "completed";
          last_viewed_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
          created_at?: string;
        };
        Update: {
          status?: "not_started" | "in_progress" | "completed";
          last_viewed_at?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      lesson_reflections: {
        Row: {
          id: string;
          user_id: string;
          program_id: string;
          lesson_id: string;
          note: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          program_id: string;
          lesson_id: string;
          note: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          note?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      lesson_task_progress: {
        Row: {
          id: string;
          user_id: string;
          program_id: string;
          lesson_id: string;
          task_id: string;
          status: Database["public"]["Enums"]["lesson_task_status"];
          response_text: string | null;
          project_id: string | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          program_id: string;
          lesson_id: string;
          task_id: string;
          status?: Database["public"]["Enums"]["lesson_task_status"];
          response_text?: string | null;
          project_id?: string | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          status?: Database["public"]["Enums"]["lesson_task_status"];
          response_text?: string | null;
          project_id?: string | null;
          updated_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          student_id: string;
          program_id: string | null;
          lesson_id: string | null;
          lesson_task_id: string | null;
          personalized_brief_id: string | null;
          personalized_reason: string | null;
          target_skills: string[] | null;
          workspace_rubric: Json;
          workspace_timeline: Json;
          title: string;
          subject: string;
          description: string;
          status: Database["public"]["Enums"]["project_status"];
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          program_id?: string | null;
          lesson_id?: string | null;
          lesson_task_id?: string | null;
          personalized_brief_id?: string | null;
          personalized_reason?: string | null;
          target_skills?: string[] | null;
          workspace_rubric?: Json;
          workspace_timeline?: Json;
          title: string;
          subject: string;
          description: string;
          status?: Database["public"]["Enums"]["project_status"];
          created_at?: string;
        };
        Update: {
          program_id?: string | null;
          lesson_id?: string | null;
          lesson_task_id?: string | null;
          personalized_brief_id?: string | null;
          personalized_reason?: string | null;
          target_skills?: string[] | null;
          workspace_rubric?: Json;
          workspace_timeline?: Json;
          title?: string;
          subject?: string;
          description?: string;
          status?: Database["public"]["Enums"]["project_status"];
        };
        Relationships: [];
      };
      project_milestones: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string;
          sort_order: number;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string;
          sort_order?: number;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          sort_order?: number;
          due_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_tasks: {
        Row: {
          id: string;
          project_id: string;
          milestone_id: string | null;
          title: string;
          description: string;
          task_type: string;
          sort_order: number;
          is_required: boolean;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          milestone_id?: string | null;
          title: string;
          description?: string;
          task_type?: string;
          sort_order?: number;
          is_required?: boolean;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          milestone_id?: string | null;
          title?: string;
          description?: string;
          task_type?: string;
          sort_order?: number;
          is_required?: boolean;
          due_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_resources: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string;
          resource_type: string;
          external_url: string | null;
          sort_order: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          title: string;
          description?: string;
          resource_type?: string;
          external_url?: string | null;
          sort_order?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          resource_type?: string;
          external_url?: string | null;
          sort_order?: number;
          created_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_task_progress: {
        Row: {
          id: string;
          project_id: string;
          task_id: string;
          user_id: string;
          status: Database["public"]["Enums"]["lesson_task_status"];
          response_text: string | null;
          submission_id: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          task_id: string;
          user_id: string;
          status?: Database["public"]["Enums"]["lesson_task_status"];
          response_text?: string | null;
          submission_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: Database["public"]["Enums"]["lesson_task_status"];
          response_text?: string | null;
          submission_id?: string | null;
          completed_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_reflections: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          note: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          note?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          note?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      student_interest_assessments: {
        Row: {
          student_id: string;
          career_preference: string | null;
          entertainment_preference: string | null;
          work_style: string | null;
          industry_interest: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          student_id: string;
          career_preference?: string | null;
          entertainment_preference?: string | null;
          work_style?: string | null;
          industry_interest?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          career_preference?: string | null;
          entertainment_preference?: string | null;
          work_style?: string | null;
          industry_interest?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      student_skill_diagnostics: {
        Row: {
          student_id: string;
          reading_level: string | null;
          writing_level: string | null;
          math_level: string | null;
          history_level: string | null;
          logic_level: string | null;
          strengths: string[] | null;
          weaknesses: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          student_id: string;
          reading_level?: string | null;
          writing_level?: string | null;
          math_level?: string | null;
          history_level?: string | null;
          logic_level?: string | null;
          strengths?: string[] | null;
          weaknesses?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          reading_level?: string | null;
          writing_level?: string | null;
          math_level?: string | null;
          history_level?: string | null;
          logic_level?: string | null;
          strengths?: string[] | null;
          weaknesses?: string[] | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      personalized_project_briefs: {
        Row: {
          id: string;
          teacher_id: string;
          cohort_id: string | null;
          group_name: string | null;
          project_mode: string;
          subject: string;
          title: string;
          description: string;
          teacher_priorities: string;
          focus_strengths: string[] | null;
          focus_weaknesses: string[] | null;
          skills_targeted: string[] | null;
          milestones: Json;
          rubric: Json;
          timeline: Json;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          cohort_id?: string | null;
          group_name?: string | null;
          project_mode?: string;
          subject: string;
          title: string;
          description: string;
          teacher_priorities?: string;
          focus_strengths?: string[] | null;
          focus_weaknesses?: string[] | null;
          skills_targeted?: string[] | null;
          milestones?: Json;
          rubric?: Json;
          timeline?: Json;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          cohort_id?: string | null;
          group_name?: string | null;
          project_mode?: string;
          subject?: string;
          title?: string;
          description?: string;
          teacher_priorities?: string;
          focus_strengths?: string[] | null;
          focus_weaknesses?: string[] | null;
          skills_targeted?: string[] | null;
          milestones?: Json;
          rubric?: Json;
          timeline?: Json;
          status?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      personalized_project_brief_students: {
        Row: {
          id: string;
          brief_id: string;
          student_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          brief_id: string;
          student_id: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      project_hooks: {
        Row: {
          id: string;
          title: string;
          summary: string;
          details: string;
          status: "draft" | "approved" | "archived";
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          summary: string;
          details: string;
          status?: "draft" | "approved" | "archived";
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          summary?: string;
          details?: string;
          status?: "draft" | "approved" | "archived";
          created_by?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_roles: {
        Row: {
          id: string;
          title: string;
          summary: string;
          details: string;
          status: "draft" | "approved" | "archived";
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          summary: string;
          details: string;
          status?: "draft" | "approved" | "archived";
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          summary?: string;
          details?: string;
          status?: "draft" | "approved" | "archived";
          created_by?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_scenarios: {
        Row: {
          id: string;
          title: string;
          summary: string;
          details: string;
          status: "draft" | "approved" | "archived";
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          summary: string;
          details: string;
          status?: "draft" | "approved" | "archived";
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          summary?: string;
          details?: string;
          status?: "draft" | "approved" | "archived";
          created_by?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_activities: {
        Row: {
          id: string;
          title: string;
          summary: string;
          details: string;
          status: "draft" | "approved" | "archived";
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          summary: string;
          details: string;
          status?: "draft" | "approved" | "archived";
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          summary?: string;
          details?: string;
          status?: "draft" | "approved" | "archived";
          created_by?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      project_outputs: {
        Row: {
          id: string;
          title: string;
          summary: string;
          details: string;
          status: "draft" | "approved" | "archived";
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          summary: string;
          details: string;
          status?: "draft" | "approved" | "archived";
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          summary?: string;
          details?: string;
          status?: "draft" | "approved" | "archived";
          created_by?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          project_id: string;
          student_id: string;
          submission_text: string;
          status: Database["public"]["Enums"]["project_status"];
          submitted_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          student_id: string;
          submission_text: string;
          status?: Database["public"]["Enums"]["project_status"];
          submitted_at?: string;
        };
        Update: {
          submission_text?: string;
          status?: Database["public"]["Enums"]["project_status"];
        };
        Relationships: [
          {
            foreignKeyName: "submissions_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      feedback: {
        Row: {
          id: string;
          project_id: string;
          submission_id: string;
          student_id: string;
          teacher_id: string;
          teacher_name: string;
          score: number;
          comment: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          submission_id: string;
          student_id: string;
          teacher_id: string;
          teacher_name: string;
          score: number;
          comment: string;
          created_at?: string;
        };
        Update: {
          teacher_name?: string;
          score?: number;
          comment?: string;
        };
        Relationships: [
          {
            foreignKeyName: "feedback_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "feedback_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          }
        ];
      };
      assessments: {
        Row: {
          id: string;
          student_id: string;
          teacher_id: string;
          title: string;
          subject: string;
          topic: string | null;
          description: string;
          status: Database["public"]["Enums"]["assessment_status"];
          due_date: string | null;
          score: number | null;
          ai_score: number | null;
          teacher_override_score: number | null;
          ai_feedback: string | null;
          teacher_comment: string | null;
          weak_topics: string[] | null;
          source: "manual" | "ai";
          cohort_id: string | null;
          completed_at: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          teacher_id: string;
          title: string;
          subject: string;
          topic?: string | null;
          description?: string;
          status?: Database["public"]["Enums"]["assessment_status"];
          due_date?: string | null;
          score?: number | null;
          ai_score?: number | null;
          teacher_override_score?: number | null;
          ai_feedback?: string | null;
          teacher_comment?: string | null;
          weak_topics?: string[] | null;
          source?: "manual" | "ai";
          cohort_id?: string | null;
          completed_at?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          teacher_id?: string;
          title?: string;
          subject?: string;
          topic?: string | null;
          description?: string;
          status?: Database["public"]["Enums"]["assessment_status"];
          due_date?: string | null;
          score?: number | null;
          ai_score?: number | null;
          teacher_override_score?: number | null;
          ai_feedback?: string | null;
          teacher_comment?: string | null;
          weak_topics?: string[] | null;
          source?: "manual" | "ai";
          cohort_id?: string | null;
          completed_at?: string | null;
          reviewed_at?: string | null;
        };
        Relationships: [];
      };
      assessment_questions: {
        Row: {
          id: string;
          assessment_id: string;
          prompt: string;
          question_type: Database["public"]["Enums"]["assessment_question_type"];
          topic: string;
          sort_order: number;
          points: number;
          options: Json;
          correct_answer: string;
          correct_answer_keywords: Json;
          explanation: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          assessment_id: string;
          prompt: string;
          question_type: Database["public"]["Enums"]["assessment_question_type"];
          topic: string;
          sort_order?: number;
          points?: number;
          options?: Json;
          correct_answer: string;
          correct_answer_keywords?: Json;
          explanation?: string | null;
          created_at?: string;
        };
        Update: {
          prompt?: string;
          question_type?: Database["public"]["Enums"]["assessment_question_type"];
          topic?: string;
          sort_order?: number;
          points?: number;
          options?: Json;
          correct_answer?: string;
          correct_answer_keywords?: Json;
          explanation?: string | null;
        };
        Relationships: [];
      };
      assessment_responses: {
        Row: {
          id: string;
          assessment_id: string;
          question_id: string;
          student_id: string;
          response_text: string | null;
          is_correct: boolean | null;
          score_awarded: number | null;
          ai_feedback: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          assessment_id: string;
          question_id: string;
          student_id: string;
          response_text?: string | null;
          is_correct?: boolean | null;
          score_awarded?: number | null;
          ai_feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          response_text?: string | null;
          is_correct?: boolean | null;
          score_awarded?: number | null;
          ai_feedback?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      enrollments: {
        Row: {
          id: string;
          user_id: string;
          program_id: string | null;
          source_purchase_id: string | null;
          status: string;
          access_reason: string | null;
          granted_by_admin_id: string | null;
          revoked_at: string | null;
          revoked_by_admin_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          program_id?: string | null;
          source_purchase_id?: string | null;
          status?: string;
          access_reason?: string | null;
          granted_by_admin_id?: string | null;
          revoked_at?: string | null;
          revoked_by_admin_id?: string | null;
          created_at?: string;
        };
        Update: {
          program_id?: string | null;
          source_purchase_id?: string | null;
          status?: string;
          access_reason?: string | null;
          granted_by_admin_id?: string | null;
          revoked_at?: string | null;
          revoked_by_admin_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_program_id_fkey";
            columns: ["program_id"];
            isOneToOne: false;
            referencedRelation: "programs";
            referencedColumns: ["id"];
          }
        ];
      };
      purchases: {
        Row: {
          id: string;
          user_id: string | null;
          shopify_order_id: string;
          email: string | null;
          amount_cents: number | null;
          currency: string | null;
          status: string;
          processing_state: string;
          processing_error: string | null;
          raw_payload: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          shopify_order_id: string;
          email?: string | null;
          amount_cents?: number | null;
          currency?: string | null;
          status?: string;
          processing_state?: string;
          processing_error?: string | null;
          raw_payload?: Json | null;
          created_at?: string;
        };
        Update: {
          user_id?: string | null;
          email?: string | null;
          amount_cents?: number | null;
          currency?: string | null;
          status?: string;
          processing_state?: string;
          processing_error?: string | null;
          raw_payload?: Json | null;
        };
        Relationships: [];
      };
      files: {
        Row: {
          id: string;
          owner_id: string;
          project_id: string | null;
          submission_id: string | null;
          bucket: string;
          storage_path: string;
          file_name: string;
          mime_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          project_id?: string | null;
          submission_id?: string | null;
          bucket: string;
          storage_path: string;
          file_name: string;
          mime_type?: string | null;
          created_at?: string;
        };
        Update: {
          project_id?: string | null;
          submission_id?: string | null;
          bucket?: string;
          storage_path?: string;
          file_name?: string;
          mime_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "files_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "files_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          }
        ];
      };
      parent_student_links: {
        Row: {
          id: string;
          parent_id: string;
          student_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          student_id: string;
          created_at?: string;
        };
        Update: never;
        Relationships: [];
      };
      pending_program_access: {
        Row: {
          id: string;
          email: string;
          program_id: string;
          purchase_id: string | null;
          status: string;
          claimed_by_user_id: string | null;
          resolved_by_admin_id: string | null;
          resolution_note: string | null;
          created_at: string;
          claimed_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          program_id: string;
          purchase_id?: string | null;
          status?: string;
          claimed_by_user_id?: string | null;
          resolved_by_admin_id?: string | null;
          resolution_note?: string | null;
          created_at?: string;
          claimed_at?: string | null;
        };
        Update: {
          status?: string;
          claimed_by_user_id?: string | null;
          resolved_by_admin_id?: string | null;
          resolution_note?: string | null;
          claimed_at?: string | null;
        };
        Relationships: [];
      };
      notification_settings: {
        Row: {
          type: string;
          label: string;
          description: string;
          audience: UserRole;
          is_enabled: boolean;
          in_app_enabled: boolean;
          email_enabled: boolean;
          updated_by_admin_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          type: string;
          label: string;
          description: string;
          audience: UserRole;
          is_enabled?: boolean;
          in_app_enabled?: boolean;
          email_enabled?: boolean;
          updated_by_admin_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          label?: string;
          description?: string;
          audience?: UserRole;
          is_enabled?: boolean;
          in_app_enabled?: boolean;
          email_enabled?: boolean;
          updated_by_admin_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          role: UserRole;
          type: string;
          title: string;
          body: string;
          action_href: string | null;
          dedupe_key: string;
          status: string;
          email_status: string;
          email_error: string | null;
          metadata: Json;
          scheduled_for: string;
          read_at: string | null;
          archived_at: string | null;
          email_attempted_at: string | null;
          email_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: UserRole;
          type: string;
          title: string;
          body: string;
          action_href?: string | null;
          dedupe_key: string;
          status?: string;
          email_status?: string;
          email_error?: string | null;
          metadata?: Json;
          scheduled_for?: string;
          read_at?: string | null;
          archived_at?: string | null;
          email_attempted_at?: string | null;
          email_sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          body?: string;
          action_href?: string | null;
          status?: string;
          email_status?: string;
          email_error?: string | null;
          metadata?: Json;
          scheduled_for?: string;
          read_at?: string | null;
          archived_at?: string | null;
          email_attempted_at?: string | null;
          email_sent_at?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_user_preferences: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          in_app_enabled: boolean;
          email_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          in_app_enabled?: boolean;
          email_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          in_app_enabled?: boolean;
          email_enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_runs: {
        Row: {
          id: string;
          trigger_source: string;
          triggered_by_admin_id: string | null;
          status: string;
          started_at: string;
          completed_at: string | null;
          users_processed: number;
          notifications_created: number;
          emails_attempted: number;
          emails_sent: number;
          emails_failed: number;
          summary: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trigger_source: string;
          triggered_by_admin_id?: string | null;
          status?: string;
          started_at?: string;
          completed_at?: string | null;
          users_processed?: number;
          notifications_created?: number;
          emails_attempted?: number;
          emails_sent?: number;
          emails_failed?: number;
          summary?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          triggered_by_admin_id?: string | null;
          status?: string;
          completed_at?: string | null;
          users_processed?: number;
          notifications_created?: number;
          emails_attempted?: number;
          emails_sent?: number;
          emails_failed?: number;
          summary?: string | null;
          error_message?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      link_child_to_parent_by_email: {
        Args: {
          target_email: string;
        };
        Returns: {
          status: string;
          linked_student_id: string | null;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      project_status: "draft" | "submitted" | "reviewed" | "needs_revision";
      assessment_status: "assigned" | "submitted" | "graded";
      assessment_question_type: "multiple_choice" | "short_answer" | "true_false";
      lesson_task_type: "checkpoint" | "submission";
      lesson_task_status: "not_started" | "in_progress" | "submitted" | "completed" | "needs_revision";
    };
    CompositeTypes: Record<string, never>;
  };
};
