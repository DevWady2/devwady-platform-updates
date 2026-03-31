export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      academy_nominations: {
        Row: {
          cohort_id: string | null
          course_id: string | null
          created_at: string
          evidence_summary: string | null
          id: string
          linked_job_id: string | null
          nominated_by: string
          nomination_reason: string | null
          nomination_scope: string
          recommendation_id: string | null
          responded_at: string | null
          status: string
          student_user_id: string
          submitted_at: string | null
          target_company_name: string | null
          updated_at: string
        }
        Insert: {
          cohort_id?: string | null
          course_id?: string | null
          created_at?: string
          evidence_summary?: string | null
          id?: string
          linked_job_id?: string | null
          nominated_by: string
          nomination_reason?: string | null
          nomination_scope?: string
          recommendation_id?: string | null
          responded_at?: string | null
          status?: string
          student_user_id: string
          submitted_at?: string | null
          target_company_name?: string | null
          updated_at?: string
        }
        Update: {
          cohort_id?: string | null
          course_id?: string | null
          created_at?: string
          evidence_summary?: string | null
          id?: string
          linked_job_id?: string | null
          nominated_by?: string
          nomination_reason?: string | null
          nomination_scope?: string
          recommendation_id?: string | null
          responded_at?: string | null
          status?: string
          student_user_id?: string
          submitted_at?: string | null
          target_company_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_nominations_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "course_cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_nominations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_nominations_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "academy_recommendations"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_recommendations: {
        Row: {
          cohort_id: string | null
          course_id: string | null
          created_at: string
          evidence_summary: string | null
          id: string
          readiness_snapshot: Json | null
          recommendation_type: string
          recommended_by: string
          status: string
          strength_summary: string | null
          student_user_id: string
          updated_at: string
        }
        Insert: {
          cohort_id?: string | null
          course_id?: string | null
          created_at?: string
          evidence_summary?: string | null
          id?: string
          readiness_snapshot?: Json | null
          recommendation_type?: string
          recommended_by: string
          status?: string
          strength_summary?: string | null
          student_user_id: string
          updated_at?: string
        }
        Update: {
          cohort_id?: string | null
          course_id?: string | null
          created_at?: string
          evidence_summary?: string | null
          id?: string
          readiness_snapshot?: Json | null
          recommendation_type?: string
          recommended_by?: string
          status?: string
          strength_summary?: string | null
          student_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_recommendations_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "course_cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "academy_recommendations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_talent_profiles: {
        Row: {
          allow_nomination: boolean
          allow_opportunity_matching: boolean
          availability_status: string | null
          created_at: string
          cv_url: string | null
          github_url: string | null
          headline: string | null
          id: string
          linkedin_url: string | null
          portfolio_url: string | null
          primary_track: string | null
          specialization_tags: string[] | null
          summary: string | null
          updated_at: string
          user_id: string
          visibility_state: string
        }
        Insert: {
          allow_nomination?: boolean
          allow_opportunity_matching?: boolean
          availability_status?: string | null
          created_at?: string
          cv_url?: string | null
          github_url?: string | null
          headline?: string | null
          id?: string
          linkedin_url?: string | null
          portfolio_url?: string | null
          primary_track?: string | null
          specialization_tags?: string[] | null
          summary?: string | null
          updated_at?: string
          user_id: string
          visibility_state?: string
        }
        Update: {
          allow_nomination?: boolean
          allow_opportunity_matching?: boolean
          availability_status?: string | null
          created_at?: string
          cv_url?: string | null
          github_url?: string | null
          headline?: string | null
          id?: string
          linkedin_url?: string | null
          portfolio_url?: string | null
          primary_track?: string | null
          specialization_tags?: string[] | null
          summary?: string | null
          updated_at?: string
          user_id?: string
          visibility_state?: string
        }
        Relationships: []
      }
      assessment_attempts: {
        Row: {
          assessment_id: string
          attempt_number: number
          cohort_id: string | null
          created_at: string
          feedback: string | null
          id: string
          metadata: Json | null
          reviewed_at: string | null
          reviewed_by: string | null
          score: number | null
          started_at: string | null
          status: string
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          assessment_id: string
          attempt_number?: number
          cohort_id?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          metadata?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          started_at?: string | null
          status?: string
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          assessment_id?: string
          attempt_number?: number
          cohort_id?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          metadata?: Json | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          score?: number | null
          started_at?: string | null
          status?: string
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_attempts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "course_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_attempts_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "course_cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_invitations: {
        Row: {
          compensation_type: string | null
          course_id: string | null
          created_at: string
          duration: string | null
          freelancer_id: string
          id: string
          instructor_id: string
          message: string | null
          responded_at: string | null
          role: string
          status: string
          support_scope: string | null
          updated_at: string
        }
        Insert: {
          compensation_type?: string | null
          course_id?: string | null
          created_at?: string
          duration?: string | null
          freelancer_id: string
          id?: string
          instructor_id: string
          message?: string | null
          responded_at?: string | null
          role?: string
          status?: string
          support_scope?: string | null
          updated_at?: string
        }
        Update: {
          compensation_type?: string | null
          course_id?: string | null
          created_at?: string
          duration?: string | null
          freelancer_id?: string
          id?: string
          instructor_id?: string
          message?: string | null
          responded_at?: string | null
          role?: string
          status?: string
          support_scope?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_invitations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_avatar_url: string | null
          author_name: string | null
          category: string | null
          content: string | null
          content_ar: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          excerpt_ar: string | null
          id: string
          published_at: string | null
          read_time_minutes: number | null
          slug: string
          status: string
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          author_avatar_url?: string | null
          author_name?: string | null
          category?: string | null
          content?: string | null
          content_ar?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          excerpt_ar?: string | null
          id?: string
          published_at?: string | null
          read_time_minutes?: number | null
          slug: string
          status?: string
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          author_avatar_url?: string | null
          author_name?: string | null
          category?: string | null
          content?: string | null
          content_ar?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          excerpt_ar?: string | null
          id?: string
          published_at?: string | null
          read_time_minutes?: number | null
          slug?: string
          status?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cohort_memberships: {
        Row: {
          cohort_id: string
          completion_state: string | null
          id: string
          joined_at: string
          membership_status: string
          user_id: string
        }
        Insert: {
          cohort_id: string
          completion_state?: string | null
          id?: string
          joined_at?: string
          membership_status?: string
          user_id: string
        }
        Update: {
          cohort_id?: string
          completion_state?: string | null
          id?: string
          joined_at?: string
          membership_status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_memberships_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "course_cohorts"
            referencedColumns: ["id"]
          },
        ]
      }
      company_profiles: {
        Row: {
          avg_rating: number | null
          company_name: string
          contact_email: string | null
          contact_phone: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          employee_count: string | null
          founded_year: number | null
          id: string
          industry: string | null
          is_public: boolean | null
          is_verified: boolean | null
          location: string | null
          logo_url: string | null
          slug: string | null
          social_links: Json | null
          tagline: string | null
          tagline_ar: string | null
          total_hires: number | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          avg_rating?: number | null
          company_name: string
          contact_email?: string | null
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          employee_count?: string | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          is_public?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          logo_url?: string | null
          slug?: string | null
          social_links?: Json | null
          tagline?: string | null
          tagline_ar?: string | null
          total_hires?: number | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          avg_rating?: number | null
          company_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          employee_count?: string | null
          founded_year?: number | null
          id?: string
          industry?: string | null
          is_public?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          logo_url?: string | null
          slug?: string | null
          social_links?: Json | null
          tagline?: string | null
          tagline_ar?: string | null
          total_hires?: number | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      company_reviews: {
        Row: {
          company_user_id: string
          created_at: string
          hire_request_id: string | null
          id: string
          is_approved: boolean | null
          rating: number
          review: string | null
          reviewer_user_id: string
          title: string | null
        }
        Insert: {
          company_user_id: string
          created_at?: string
          hire_request_id?: string | null
          id?: string
          is_approved?: boolean | null
          rating: number
          review?: string | null
          reviewer_user_id: string
          title?: string | null
        }
        Update: {
          company_user_id?: string
          created_at?: string
          hire_request_id?: string | null
          id?: string
          is_approved?: boolean | null
          rating?: number
          review?: string | null
          reviewer_user_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_reviews_hire_request_id_fkey"
            columns: ["hire_request_id"]
            isOneToOne: false
            referencedRelation: "hire_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      company_team_members: {
        Row: {
          accepted_at: string | null
          company_user_id: string
          created_at: string
          id: string
          invited_by: string | null
          member_user_id: string
          role: string
        }
        Insert: {
          accepted_at?: string | null
          company_user_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          member_user_id: string
          role?: string
        }
        Update: {
          accepted_at?: string | null
          company_user_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          member_user_id?: string
          role?: string
        }
        Relationships: []
      }
      consulting_bookings: {
        Row: {
          admin_notes: string | null
          amount_usd: number | null
          booking_date: string
          created_at: string
          end_time: string
          expert_id: string
          expert_notes: string | null
          guest_email: string | null
          guest_name: string | null
          guest_phone: string | null
          id: string
          meeting_url: string | null
          notes: string | null
          payment_intent_id: string | null
          payment_status: string | null
          rating: number | null
          review: string | null
          reviewed_at: string | null
          start_time: string
          status: string
          track: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount_usd?: number | null
          booking_date: string
          created_at?: string
          end_time: string
          expert_id: string
          expert_notes?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          meeting_url?: string | null
          notes?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          rating?: number | null
          review?: string | null
          reviewed_at?: string | null
          start_time: string
          status?: string
          track?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount_usd?: number | null
          booking_date?: string
          created_at?: string
          end_time?: string
          expert_id?: string
          expert_notes?: string | null
          guest_email?: string | null
          guest_name?: string | null
          guest_phone?: string | null
          id?: string
          meeting_url?: string | null
          notes?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          rating?: number | null
          review?: string | null
          reviewed_at?: string | null
          start_time?: string
          status?: string
          track?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consulting_bookings_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "consulting_experts"
            referencedColumns: ["id"]
          },
        ]
      }
      consulting_experts: {
        Row: {
          avatar_url: string | null
          bio: string | null
          bio_ar: string | null
          created_at: string
          email: string | null
          github_url: string | null
          id: string
          initials: string
          is_active: boolean | null
          linkedin_url: string | null
          name: string
          name_ar: string
          role: string
          role_ar: string
          session_duration_minutes: number
          session_rate_usd: number
          slug: string
          specializations: string[] | null
          specializations_ar: string[] | null
          track: string
          track_ar: string
          updated_at: string
          user_id: string | null
          years_experience: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          bio_ar?: string | null
          created_at?: string
          email?: string | null
          github_url?: string | null
          id?: string
          initials: string
          is_active?: boolean | null
          linkedin_url?: string | null
          name: string
          name_ar: string
          role: string
          role_ar: string
          session_duration_minutes?: number
          session_rate_usd?: number
          slug: string
          specializations?: string[] | null
          specializations_ar?: string[] | null
          track: string
          track_ar: string
          updated_at?: string
          user_id?: string | null
          years_experience?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          bio_ar?: string | null
          created_at?: string
          email?: string | null
          github_url?: string | null
          id?: string
          initials?: string
          is_active?: boolean | null
          linkedin_url?: string | null
          name?: string
          name_ar?: string
          role?: string
          role_ar?: string
          session_duration_minutes?: number
          session_rate_usd?: number
          slug?: string
          specializations?: string[] | null
          specializations_ar?: string[] | null
          track?: string
          track_ar?: string
          updated_at?: string
          user_id?: string | null
          years_experience?: number | null
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      course_assessments: {
        Row: {
          assessment_type: string
          course_id: string
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          id: string
          instructions: string | null
          instructions_ar: string | null
          is_published: boolean
          is_required: boolean
          max_attempts: number | null
          module_id: string | null
          passing_score: number | null
          sort_order: number
          title_ar: string | null
          title_en: string
          updated_at: string
        }
        Insert: {
          assessment_type?: string
          course_id: string
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          instructions?: string | null
          instructions_ar?: string | null
          is_published?: boolean
          is_required?: boolean
          max_attempts?: number | null
          module_id?: string | null
          passing_score?: number | null
          sort_order?: number
          title_ar?: string | null
          title_en: string
          updated_at?: string
        }
        Update: {
          assessment_type?: string
          course_id?: string
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          instructions?: string | null
          instructions_ar?: string | null
          is_published?: boolean
          is_required?: boolean
          max_attempts?: number | null
          module_id?: string | null
          passing_score?: number | null
          sort_order?: number
          title_ar?: string | null
          title_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_assessments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_assessments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_cohorts: {
        Row: {
          capacity: number | null
          code: string | null
          course_id: string
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string | null
          enrollment_open: boolean
          id: string
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          code?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          enrollment_open?: boolean
          id?: string
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          code?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          enrollment_open?: boolean
          id?: string
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_cohorts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_enrollments: {
        Row: {
          certificate_url: string | null
          completed_at: string | null
          course_id: string
          created_at: string
          enrolled_at: string
          id: string
          payment_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          completed_at?: string | null
          course_id: string
          created_at?: string
          enrolled_at?: string
          id?: string
          payment_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          completed_at?: string | null
          course_id?: string
          created_at?: string
          enrolled_at?: string
          id?: string
          payment_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_enrollments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      course_lessons: {
        Row: {
          attachment_urls: string[] | null
          content_type: string
          course_id: string
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          is_preview: boolean | null
          is_published: boolean | null
          module_id: string | null
          sort_order: number | null
          text_content: string | null
          text_content_ar: string | null
          title_ar: string | null
          title_en: string
          updated_at: string
          video_duration_seconds: number | null
          video_url: string | null
        }
        Insert: {
          attachment_urls?: string[] | null
          content_type?: string
          course_id: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_preview?: boolean | null
          is_published?: boolean | null
          module_id?: string | null
          sort_order?: number | null
          text_content?: string | null
          text_content_ar?: string | null
          title_ar?: string | null
          title_en: string
          updated_at?: string
          video_duration_seconds?: number | null
          video_url?: string | null
        }
        Update: {
          attachment_urls?: string[] | null
          content_type?: string
          course_id?: string
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_preview?: boolean | null
          is_published?: boolean | null
          module_id?: string | null
          sort_order?: number | null
          text_content?: string | null
          text_content_ar?: string | null
          title_ar?: string | null
          title_en?: string
          updated_at?: string
          video_duration_seconds?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      course_milestones: {
        Row: {
          course_id: string
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          id: string
          is_published: boolean
          is_required: boolean
          sort_order: number
          title_ar: string | null
          title_en: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_published?: boolean
          is_required?: boolean
          sort_order?: number
          title_ar?: string | null
          title_en: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          is_published?: boolean
          is_required?: boolean
          sort_order?: number
          title_ar?: string | null
          title_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_milestones_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string
          duration: string | null
          id: string
          lessons: number | null
          sort_order: number | null
          title_ar: string | null
          title_en: string
        }
        Insert: {
          course_id: string
          created_at?: string
          duration?: string | null
          id?: string
          lessons?: number | null
          sort_order?: number | null
          title_ar?: string | null
          title_en: string
        }
        Update: {
          course_id?: string
          created_at?: string
          duration?: string | null
          id?: string
          lessons?: number | null
          sort_order?: number | null
          title_ar?: string | null
          title_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_projects: {
        Row: {
          course_id: string
          created_at: string
          created_by: string | null
          description_ar: string | null
          description_en: string | null
          id: string
          instructions: string | null
          instructions_ar: string | null
          is_capstone: boolean
          is_published: boolean
          is_required: boolean
          sort_order: number
          submission_type: string
          title_ar: string | null
          title_en: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          instructions?: string | null
          instructions_ar?: string | null
          is_capstone?: boolean
          is_published?: boolean
          is_required?: boolean
          sort_order?: number
          submission_type?: string
          title_ar?: string | null
          title_en: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string | null
          description_ar?: string | null
          description_en?: string | null
          id?: string
          instructions?: string | null
          instructions_ar?: string | null
          is_capstone?: boolean
          is_published?: boolean
          is_required?: boolean
          sort_order?: number
          submission_type?: string
          title_ar?: string | null
          title_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_projects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_questions: {
        Row: {
          answer_text: string | null
          answered_at: string | null
          answered_by: string | null
          asked_by: string
          course_id: string
          created_at: string
          id: string
          is_visible_to_class: boolean
          question_text: string
          updated_at: string
        }
        Insert: {
          answer_text?: string | null
          answered_at?: string | null
          answered_by?: string | null
          asked_by: string
          course_id: string
          created_at?: string
          id?: string
          is_visible_to_class?: boolean
          question_text: string
          updated_at?: string
        }
        Update: {
          answer_text?: string | null
          answered_at?: string | null
          answered_by?: string | null
          asked_by?: string
          course_id?: string
          created_at?: string
          id?: string
          is_visible_to_class?: boolean
          question_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_reviews: {
        Row: {
          course_id: string
          created_at: string
          enrollment_id: string
          id: string
          is_approved: boolean | null
          rating: number
          review: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          enrollment_id: string
          id?: string
          is_approved?: boolean | null
          rating: number
          review?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          enrollment_id?: string
          id?: string
          is_approved?: boolean | null
          rating?: number
          review?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_reviews_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
        ]
      }
      course_sessions: {
        Row: {
          attendance_required: boolean
          cohort_id: string | null
          course_id: string
          created_at: string
          created_by: string | null
          description: string | null
          end_at: string
          id: string
          is_published: boolean
          meeting_url: string | null
          session_type: string
          start_at: string
          timezone: string | null
          title: string
          updated_at: string
        }
        Insert: {
          attendance_required?: boolean
          cohort_id?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at: string
          id?: string
          is_published?: boolean
          meeting_url?: string | null
          session_type?: string
          start_at: string
          timezone?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          attendance_required?: boolean
          cohort_id?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string
          id?: string
          is_published?: boolean
          meeting_url?: string | null
          session_type?: string
          start_at?: string
          timezone?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_sessions_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "course_cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_webinars: {
        Row: {
          course_id: string
          created_at: string
          id: string
          schedule: string | null
          sort_order: number | null
          speaker: string | null
          title_ar: string | null
          title_en: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          schedule?: string | null
          sort_order?: number | null
          speaker?: string | null
          title_ar?: string | null
          title_en: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          schedule?: string | null
          sort_order?: number | null
          speaker?: string | null
          title_ar?: string | null
          title_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_webinars_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "training_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      expert_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          expert_id: string
          id: string
          is_active: boolean | null
          is_recurring: boolean
          specific_date: string | null
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          expert_id: string
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean
          specific_date?: string | null
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          expert_id?: string
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean
          specific_date?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "expert_availability_expert_id_fkey"
            columns: ["expert_id"]
            isOneToOne: false
            referencedRelation: "consulting_experts"
            referencedColumns: ["id"]
          },
        ]
      }
      freelancer_portfolio: {
        Row: {
          category: string | null
          client_name: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          github_url: string | null
          id: string
          images: string[] | null
          is_featured: boolean | null
          project_url: string | null
          sort_order: number | null
          technologies: string[] | null
          thumbnail_url: string | null
          title: string
          title_ar: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          client_name?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          github_url?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          project_url?: string | null
          sort_order?: number | null
          technologies?: string[] | null
          thumbnail_url?: string | null
          title: string
          title_ar?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          client_name?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          github_url?: string | null
          id?: string
          images?: string[] | null
          is_featured?: boolean | null
          project_url?: string | null
          sort_order?: number | null
          technologies?: string[] | null
          thumbnail_url?: string | null
          title?: string
          title_ar?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      freelancer_reviews: {
        Row: {
          created_at: string
          freelancer_user_id: string
          hire_request_id: string | null
          id: string
          is_approved: boolean | null
          rating: number
          review: string | null
          reviewer_user_id: string
          skills_demonstrated: string[] | null
          title: string | null
        }
        Insert: {
          created_at?: string
          freelancer_user_id: string
          hire_request_id?: string | null
          id?: string
          is_approved?: boolean | null
          rating: number
          review?: string | null
          reviewer_user_id: string
          skills_demonstrated?: string[] | null
          title?: string | null
        }
        Update: {
          created_at?: string
          freelancer_user_id?: string
          hire_request_id?: string | null
          id?: string
          is_approved?: boolean | null
          rating?: number
          review?: string | null
          reviewer_user_id?: string
          skills_demonstrated?: string[] | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "freelancer_reviews_hire_request_id_fkey"
            columns: ["hire_request_id"]
            isOneToOne: false
            referencedRelation: "hire_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      freelancer_shortlists: {
        Row: {
          company_user_id: string
          created_at: string
          freelancer_user_id: string
          id: string
          notes: string | null
        }
        Insert: {
          company_user_id: string
          created_at?: string
          freelancer_user_id: string
          id?: string
          notes?: string | null
        }
        Update: {
          company_user_id?: string
          created_at?: string
          freelancer_user_id?: string
          id?: string
          notes?: string | null
        }
        Relationships: []
      }
      gallery_photos: {
        Row: {
          created_at: string
          gradient: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          label_ar: string | null
          label_en: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          gradient?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          label_ar?: string | null
          label_en: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          gradient?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          label_ar?: string | null
          label_en?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      gallery_timeline: {
        Row: {
          created_at: string
          description_ar: string | null
          description_en: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          title_ar: string | null
          title_en: string
          updated_at: string
          year_label: string
        }
        Insert: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title_ar?: string | null
          title_en: string
          updated_at?: string
          year_label: string
        }
        Update: {
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          title_ar?: string | null
          title_en?: string
          updated_at?: string
          year_label?: string
        }
        Relationships: []
      }
      hire_requests: {
        Row: {
          budget_range: string | null
          company_id: string
          completed_at: string | null
          created_at: string
          duration: string | null
          freelancer_profile_id: string
          freelancer_response: string | null
          id: string
          is_reviewed_by_company: boolean | null
          is_reviewed_by_freelancer: boolean | null
          job_listing_id: string | null
          message: string | null
          requirements: string | null
          responded_at: string | null
          started_at: string | null
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          budget_range?: string | null
          company_id: string
          completed_at?: string | null
          created_at?: string
          duration?: string | null
          freelancer_profile_id: string
          freelancer_response?: string | null
          id?: string
          is_reviewed_by_company?: boolean | null
          is_reviewed_by_freelancer?: boolean | null
          job_listing_id?: string | null
          message?: string | null
          requirements?: string | null
          responded_at?: string | null
          started_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          budget_range?: string | null
          company_id?: string
          completed_at?: string | null
          created_at?: string
          duration?: string | null
          freelancer_profile_id?: string
          freelancer_response?: string | null
          id?: string
          is_reviewed_by_company?: boolean | null
          is_reviewed_by_freelancer?: boolean | null
          job_listing_id?: string | null
          message?: string | null
          requirements?: string | null
          responded_at?: string | null
          started_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hire_requests_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_requests_freelancer_profile_id_fkey"
            columns: ["freelancer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hire_requests_job_listing_id_fkey"
            columns: ["job_listing_id"]
            isOneToOne: false
            referencedRelation: "job_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_applications: {
        Row: {
          admin_notes: string | null
          bio: string | null
          course_proposal: string | null
          created_at: string
          email: string
          expertise_areas: string[] | null
          full_name: string
          id: string
          linkedin_url: string | null
          portfolio_url: string | null
          reviewed_at: string | null
          sample_content_url: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          bio?: string | null
          course_proposal?: string | null
          created_at?: string
          email: string
          expertise_areas?: string[] | null
          full_name: string
          id?: string
          linkedin_url?: string | null
          portfolio_url?: string | null
          reviewed_at?: string | null
          sample_content_url?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          bio?: string | null
          course_proposal?: string | null
          created_at?: string
          email?: string
          expertise_areas?: string[] | null
          full_name?: string
          id?: string
          linkedin_url?: string | null
          portfolio_url?: string | null
          reviewed_at?: string | null
          sample_content_url?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applicant_email: string | null
          applicant_user_id: string
          cover_note: string | null
          created_at: string
          id: string
          job_id: string
          status: string
          updated_at: string
        }
        Insert: {
          applicant_email?: string | null
          applicant_user_id: string
          cover_note?: string | null
          created_at?: string
          id?: string
          job_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          applicant_email?: string | null
          applicant_user_id?: string
          cover_note?: string | null
          created_at?: string
          id?: string
          job_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      job_listings: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          is_urgent: boolean | null
          location_ar: string | null
          location_en: string | null
          sort_order: number | null
          tags: string[] | null
          title_ar: string | null
          title_en: string
          type_ar: string | null
          type_en: string
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_urgent?: boolean | null
          location_ar?: string | null
          location_en?: string | null
          sort_order?: number | null
          tags?: string[] | null
          title_ar?: string | null
          title_en: string
          type_ar?: string | null
          type_en?: string
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_urgent?: boolean | null
          location_ar?: string | null
          location_en?: string | null
          sort_order?: number | null
          tags?: string[] | null
          title_ar?: string | null
          title_en?: string
          type_ar?: string | null
          type_en?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_listings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "company_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          company_user_id: string
          created_at: string
          description: string | null
          description_ar: string | null
          id: string
          is_active: boolean | null
          is_urgent: boolean | null
          location: string | null
          location_ar: string | null
          requirements: string[] | null
          salary_range: string | null
          tags: string[] | null
          title: string
          title_ar: string | null
          type: string
          updated_at: string
        }
        Insert: {
          company_user_id: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          is_urgent?: boolean | null
          location?: string | null
          location_ar?: string | null
          requirements?: string[] | null
          salary_range?: string | null
          tags?: string[] | null
          title: string
          title_ar?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          company_user_id?: string
          created_at?: string
          description?: string | null
          description_ar?: string | null
          id?: string
          is_active?: boolean | null
          is_urgent?: boolean | null
          location?: string | null
          location_ar?: string | null
          requirements?: string[] | null
          salary_range?: string | null
          tags?: string[] | null
          title?: string
          title_ar?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          enrollment_id: string
          id: string
          is_completed: boolean | null
          last_accessed_at: string | null
          lesson_id: string
          progress_seconds: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          enrollment_id: string
          id?: string
          is_completed?: boolean | null
          last_accessed_at?: string | null
          lesson_id: string
          progress_seconds?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          enrollment_id?: string
          id?: string
          is_completed?: boolean | null
          last_accessed_at?: string | null
          lesson_id?: string
          progress_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "course_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "course_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      media_items: {
        Row: {
          category: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          duration: string | null
          external_url: string | null
          id: string
          is_active: boolean | null
          sort_order: number | null
          thumbnail_url: string | null
          title_ar: string | null
          title_en: string
          type: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          duration?: string | null
          external_url?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title_ar?: string | null
          title_en: string
          type?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          duration?: string | null
          external_url?: string | null
          id?: string
          is_active?: boolean | null
          sort_order?: number | null
          thumbnail_url?: string | null
          title_ar?: string | null
          title_en?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body_ar: string | null
          body_en: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          metadata: Json | null
          title_ar: string | null
          title_en: string
          type: string
          user_id: string
        }
        Insert: {
          body_ar?: string | null
          body_en?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json | null
          title_ar?: string | null
          title_en: string
          type: string
          user_id: string
        }
        Update: {
          body_ar?: string | null
          body_en?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          metadata?: Json | null
          title_ar?: string | null
          title_en?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          created_at: string
          id: string
          path: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          path: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_usd: number
          created_at: string
          currency: string
          description: string | null
          guest_email: string | null
          id: string
          metadata: Json | null
          paid_at: string | null
          reference_id: string | null
          reference_type: string | null
          status: string
          stripe_customer_id: string | null
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_usd: number
          created_at?: string
          currency?: string
          description?: string | null
          guest_email?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_usd?: number
          created_at?: string
          currency?: string
          description?: string | null
          guest_email?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      portfolio_projects: {
        Row: {
          badge: string | null
          badge_ar: string | null
          brand_note: string | null
          brand_note_ar: string | null
          category: string | null
          channels: Json | null
          core_modules: Json | null
          cover_image_url: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          external_url: string | null
          id: string
          img_key: string | null
          in_development: string | null
          in_development_ar: string | null
          is_featured: boolean | null
          links: Json | null
          metrics: Json | null
          slug: string
          sort_order: number | null
          status: string
          subtitle_ar: string | null
          subtitle_en: string | null
          tech: string[] | null
          title_ar: string | null
          title_en: string
          updated_at: string
        }
        Insert: {
          badge?: string | null
          badge_ar?: string | null
          brand_note?: string | null
          brand_note_ar?: string | null
          category?: string | null
          channels?: Json | null
          core_modules?: Json | null
          cover_image_url?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          external_url?: string | null
          id?: string
          img_key?: string | null
          in_development?: string | null
          in_development_ar?: string | null
          is_featured?: boolean | null
          links?: Json | null
          metrics?: Json | null
          slug: string
          sort_order?: number | null
          status?: string
          subtitle_ar?: string | null
          subtitle_en?: string | null
          tech?: string[] | null
          title_ar?: string | null
          title_en: string
          updated_at?: string
        }
        Update: {
          badge?: string | null
          badge_ar?: string | null
          brand_note?: string | null
          brand_note_ar?: string | null
          category?: string | null
          channels?: Json | null
          core_modules?: Json | null
          cover_image_url?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          external_url?: string | null
          id?: string
          img_key?: string | null
          in_development?: string | null
          in_development_ar?: string | null
          is_featured?: boolean | null
          links?: Json | null
          metrics?: Json | null
          slug?: string
          sort_order?: number | null
          status?: string
          subtitle_ar?: string | null
          subtitle_en?: string | null
          tech?: string[] | null
          title_ar?: string | null
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          created_at: string
          id: string
          profile_user_id: string
          viewer_user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          profile_user_id: string
          viewer_user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          profile_user_id?: string
          viewer_user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          batch: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          github_url: string | null
          hourly_rate: string | null
          id: string
          is_available: boolean | null
          is_devwady_alumni: boolean | null
          linkedin_url: string | null
          location: string | null
          phone: string | null
          portfolio_url: string | null
          projects_count: number | null
          rating: number | null
          skills: string[] | null
          slug: string | null
          status_changed_at: string | null
          status_changed_by: string | null
          status_reason: string | null
          track: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          batch?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          github_url?: string | null
          hourly_rate?: string | null
          id?: string
          is_available?: boolean | null
          is_devwady_alumni?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          portfolio_url?: string | null
          projects_count?: number | null
          rating?: number | null
          skills?: string[] | null
          slug?: string | null
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_reason?: string | null
          track?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          batch?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          github_url?: string | null
          hourly_rate?: string | null
          id?: string
          is_available?: boolean | null
          is_devwady_alumni?: boolean | null
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          portfolio_url?: string | null
          projects_count?: number | null
          rating?: number | null
          skills?: string[] | null
          slug?: string | null
          status_changed_at?: string | null
          status_changed_by?: string | null
          status_reason?: string | null
          track?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_reviews: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          review_status: string
          reviewed_at: string | null
          reviewer_id: string
          score: number | null
          submission_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          review_status?: string
          reviewed_at?: string | null
          reviewer_id: string
          score?: number | null
          submission_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          review_status?: string
          reviewed_at?: string | null
          reviewer_id?: string
          score?: number | null
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_reviews_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "project_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      project_submissions: {
        Row: {
          attachment_url: string | null
          cohort_id: string | null
          created_at: string
          id: string
          last_updated_at: string | null
          project_id: string
          submission_status: string
          submission_text: string | null
          submission_url: string | null
          submitted_at: string | null
          user_id: string
        }
        Insert: {
          attachment_url?: string | null
          cohort_id?: string | null
          created_at?: string
          id?: string
          last_updated_at?: string | null
          project_id: string
          submission_status?: string
          submission_text?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          user_id: string
        }
        Update: {
          attachment_url?: string | null
          cohort_id?: string | null
          created_at?: string
          id?: string
          last_updated_at?: string | null
          project_id?: string
          submission_status?: string
          submission_text?: string | null
          submission_url?: string | null
          submitted_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_submissions_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "course_cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_submissions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "course_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_tracking: {
        Row: {
          actual_end_date: string | null
          created_at: string
          description: string | null
          id: string
          paid_usd: number | null
          progress_pct: number | null
          project_manager_id: string | null
          quote_id: string | null
          service_request_id: string | null
          start_date: string | null
          status: string
          target_end_date: string | null
          team_member_ids: string[] | null
          title: string
          total_budget_usd: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          actual_end_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          paid_usd?: number | null
          progress_pct?: number | null
          project_manager_id?: string | null
          quote_id?: string | null
          service_request_id?: string | null
          start_date?: string | null
          status?: string
          target_end_date?: string | null
          team_member_ids?: string[] | null
          title: string
          total_budget_usd?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          actual_end_date?: string | null
          created_at?: string
          description?: string | null
          id?: string
          paid_usd?: number | null
          progress_pct?: number | null
          project_manager_id?: string | null
          quote_id?: string | null
          service_request_id?: string | null
          start_date?: string | null
          status?: string
          target_end_date?: string | null
          team_member_ids?: string[] | null
          title?: string
          total_budget_usd?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tracking_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tracking_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      project_updates: {
        Row: {
          attachments: string[] | null
          author_id: string | null
          body: string | null
          created_at: string
          id: string
          is_visible_to_client: boolean | null
          project_id: string
          title: string
          type: string
        }
        Insert: {
          attachments?: string[] | null
          author_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_visible_to_client?: boolean | null
          project_id: string
          title: string
          type?: string
        }
        Update: {
          attachments?: string[] | null
          author_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_visible_to_client?: boolean | null
          project_id?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_updates_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          discount_pct: number | null
          estimated_duration: string | null
          id: string
          line_items: Json
          notes: string | null
          payment_terms: string | null
          quote_number: string | null
          responded_at: string | null
          sent_at: string | null
          service_request_id: string
          status: string
          subtotal_usd: number
          tax_pct: number | null
          title: string
          total_usd: number
          updated_at: string
          valid_until: string | null
          viewed_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          discount_pct?: number | null
          estimated_duration?: string | null
          id?: string
          line_items?: Json
          notes?: string | null
          payment_terms?: string | null
          quote_number?: string | null
          responded_at?: string | null
          sent_at?: string | null
          service_request_id: string
          status?: string
          subtotal_usd: number
          tax_pct?: number | null
          title: string
          total_usd: number
          updated_at?: string
          valid_until?: string | null
          viewed_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          discount_pct?: number | null
          estimated_duration?: string | null
          id?: string
          line_items?: Json
          notes?: string | null
          payment_terms?: string | null
          quote_number?: string | null
          responded_at?: string | null
          sent_at?: string | null
          service_request_id?: string
          status?: string
          subtotal_usd?: number
          tax_pct?: number | null
          title?: string
          total_usd?: number
          updated_at?: string
          valid_until?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          admin_notes: string | null
          assigned_to: string | null
          attachments: string[] | null
          budget_range: string | null
          category: string | null
          company_name: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          description: string
          id: string
          internal_estimate_usd: number | null
          metadata: Json | null
          preferred_start_date: string | null
          priority: string | null
          requirements: string | null
          service_type: string
          source: string | null
          status: string
          timeline: string | null
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          assigned_to?: string | null
          attachments?: string[] | null
          budget_range?: string | null
          category?: string | null
          company_name?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          description: string
          id?: string
          internal_estimate_usd?: number | null
          metadata?: Json | null
          preferred_start_date?: string | null
          priority?: string | null
          requirements?: string | null
          service_type: string
          source?: string | null
          status?: string
          timeline?: string | null
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          assigned_to?: string | null
          attachments?: string[] | null
          budget_range?: string | null
          category?: string | null
          company_name?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          description?: string
          id?: string
          internal_estimate_usd?: number | null
          metadata?: Json | null
          preferred_start_date?: string | null
          priority?: string | null
          requirements?: string | null
          service_type?: string
          source?: string | null
          status?: string
          timeline?: string | null
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          color: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          features_ar: string[] | null
          features_en: string[] | null
          icon: string
          id: string
          is_active: boolean | null
          section: string
          sort_order: number | null
          title_ar: string | null
          title_en: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          features_ar?: string[] | null
          features_en?: string[] | null
          icon?: string
          id?: string
          is_active?: boolean | null
          section?: string
          sort_order?: number | null
          title_ar?: string | null
          title_en: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          features_ar?: string[] | null
          features_en?: string[] | null
          icon?: string
          id?: string
          is_active?: boolean | null
          section?: string
          sort_order?: number | null
          title_ar?: string | null
          title_en?: string
          updated_at?: string
        }
        Relationships: []
      }
      session_attendance: {
        Row: {
          attendance_status: string
          id: string
          marked_at: string | null
          marked_by: string | null
          notes: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          attendance_status?: string
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          notes?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          attendance_status?: string
          id?: string
          marked_at?: string | null
          marked_by?: string | null
          notes?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "course_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          avatar_url: string | null
          bio_ar: string | null
          bio_en: string | null
          created_at: string
          department: string | null
          email: string | null
          github_url: string | null
          id: string
          is_active: boolean | null
          linkedin_url: string | null
          name_ar: string | null
          name_en: string
          role_ar: string | null
          role_en: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio_ar?: string | null
          bio_en?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          github_url?: string | null
          id?: string
          is_active?: boolean | null
          linkedin_url?: string | null
          name_ar?: string | null
          name_en: string
          role_ar?: string | null
          role_en?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio_ar?: string | null
          bio_en?: string | null
          created_at?: string
          department?: string | null
          email?: string | null
          github_url?: string | null
          id?: string
          is_active?: boolean | null
          linkedin_url?: string | null
          name_ar?: string | null
          name_en?: string
          role_ar?: string | null
          role_en?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name_ar: string | null
          name_en: string
          quote_ar: string | null
          quote_en: string | null
          rating: number
          role_ar: string | null
          role_en: string | null
          section: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name_ar?: string | null
          name_en: string
          quote_ar?: string | null
          quote_en?: string | null
          rating?: number
          role_ar?: string | null
          role_en?: string | null
          section?: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name_ar?: string | null
          name_en?: string
          quote_ar?: string | null
          quote_en?: string | null
          rating?: number
          role_ar?: string | null
          role_en?: string | null
          section?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      training_courses: {
        Row: {
          color: string | null
          course_type: string | null
          created_at: string
          delivery_mode: string
          description_ar: string | null
          description_en: string | null
          duration_ar: string | null
          duration_en: string | null
          emoji: string | null
          icon: string
          id: string
          instructor_id: string | null
          is_active: boolean | null
          is_devwady_course: boolean | null
          is_free: boolean | null
          language: string | null
          learning_product_type: string
          level_ar: string | null
          level_en: string | null
          max_students: number | null
          outcomes_ar: string[] | null
          outcomes_en: string[] | null
          preview_video_url: string | null
          price_usd: number | null
          requires_cohort: boolean
          revenue_share_pct: number | null
          slug: string
          sort_order: number | null
          status: string | null
          supports_assessments: boolean
          supports_live_sessions: boolean
          supports_projects: boolean
          thumbnail_url: string | null
          title_ar: string | null
          title_en: string
          tools: string[] | null
          total_duration_hours: number | null
          total_lessons: number | null
          total_projects: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          course_type?: string | null
          created_at?: string
          delivery_mode?: string
          description_ar?: string | null
          description_en?: string | null
          duration_ar?: string | null
          duration_en?: string | null
          emoji?: string | null
          icon?: string
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          is_devwady_course?: boolean | null
          is_free?: boolean | null
          language?: string | null
          learning_product_type?: string
          level_ar?: string | null
          level_en?: string | null
          max_students?: number | null
          outcomes_ar?: string[] | null
          outcomes_en?: string[] | null
          preview_video_url?: string | null
          price_usd?: number | null
          requires_cohort?: boolean
          revenue_share_pct?: number | null
          slug: string
          sort_order?: number | null
          status?: string | null
          supports_assessments?: boolean
          supports_live_sessions?: boolean
          supports_projects?: boolean
          thumbnail_url?: string | null
          title_ar?: string | null
          title_en: string
          tools?: string[] | null
          total_duration_hours?: number | null
          total_lessons?: number | null
          total_projects?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          course_type?: string | null
          created_at?: string
          delivery_mode?: string
          description_ar?: string | null
          description_en?: string | null
          duration_ar?: string | null
          duration_en?: string | null
          emoji?: string | null
          icon?: string
          id?: string
          instructor_id?: string | null
          is_active?: boolean | null
          is_devwady_course?: boolean | null
          is_free?: boolean | null
          language?: string | null
          learning_product_type?: string
          level_ar?: string | null
          level_en?: string | null
          max_students?: number | null
          outcomes_ar?: string[] | null
          outcomes_en?: string[] | null
          preview_video_url?: string | null
          price_usd?: number | null
          requires_cohort?: boolean
          revenue_share_pct?: number | null
          slug?: string
          sort_order?: number | null
          status?: string | null
          supports_assessments?: boolean
          supports_live_sessions?: boolean
          supports_projects?: boolean
          thumbnail_url?: string | null
          title_ar?: string | null
          title_en?: string
          tools?: string[] | null
          total_duration_hours?: number | null
          total_lessons?: number | null
          total_projects?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          is_primary: boolean | null
          joined_at: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          is_primary?: boolean | null
          joined_at?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          is_primary?: boolean | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_instructor_access_student_talent: {
        Args: { _instructor_id: string; _student_user_id: string }
        Returns: boolean
      }
      can_instructor_recommend_student: {
        Args: {
          _cohort_id: string
          _course_id: string
          _instructor_id: string
          _student_user_id: string
        }
        Returns: boolean
      }
      create_notification: {
        Args: {
          _body_ar?: string
          _body_en?: string
          _link?: string
          _metadata?: Json
          _title_ar?: string
          _title_en: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
      get_account_status: { Args: { _user_id: string }; Returns: string }
      get_course_structure_counts: {
        Args: { p_course_id: string }
        Returns: Json
      }
      get_course_student_profiles: {
        Args: { p_course_ids: string[] }
        Returns: {
          avatar_url: string
          full_name: string
          user_id: string
        }[]
      }
      get_instructor_assistant_profiles: {
        Args: { p_course_id?: string }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
          user_id: string
        }[]
      }
      get_payment_success: {
        Args: { p_session_id: string }
        Returns: {
          amount_usd: number
          booking_date: string
          end_time: string
          expert_name: string
          expert_name_ar: string
          start_time: string
          status: string
        }[]
      }
      get_profile_display_by_id: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          full_name: string
          user_id: string
        }[]
      }
      get_public_expert_by_slug: {
        Args: { p_slug: string }
        Returns: {
          avatar_url: string
          bio: string
          bio_ar: string
          created_at: string
          github_url: string
          id: string
          initials: string
          is_active: boolean
          linkedin_url: string
          name: string
          name_ar: string
          role: string
          role_ar: string
          session_duration_minutes: number
          session_rate_usd: number
          slug: string
          specializations: string[]
          specializations_ar: string[]
          track: string
          track_ar: string
          user_id: string
          years_experience: number
        }[]
      }
      get_public_experts: {
        Args: never
        Returns: {
          avatar_url: string
          bio: string
          bio_ar: string
          created_at: string
          github_url: string
          id: string
          initials: string
          is_active: boolean
          linkedin_url: string
          name: string
          name_ar: string
          role: string
          role_ar: string
          session_duration_minutes: number
          session_rate_usd: number
          slug: string
          specializations: string[]
          specializations_ar: string[]
          track: string
          track_ar: string
          user_id: string
          years_experience: number
        }[]
      }
      get_public_profile: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string
          batch: string
          bio: string
          full_name: string
          github_url: string
          id: string
          is_available: boolean
          is_devwady_alumni: boolean
          linkedin_url: string
          location: string
          portfolio_url: string
          projects_count: number
          rating: number
          skills: string[]
          slug: string
          track: string
          user_id: string
        }[]
      }
      get_public_profile_by_slug: {
        Args: { p_slug: string }
        Returns: {
          avatar_url: string
          batch: string
          bio: string
          created_at: string
          full_name: string
          github_url: string
          id: string
          is_available: boolean
          is_devwady_alumni: boolean
          linkedin_url: string
          location: string
          portfolio_url: string
          projects_count: number
          rating: number
          skills: string[]
          slug: string
          track: string
          updated_at: string
          user_id: string
        }[]
      }
      get_public_profiles_browse: {
        Args: { p_search?: string }
        Returns: {
          avatar_url: string
          batch: string
          bio: string
          full_name: string
          github_url: string
          hourly_rate: string
          id: string
          is_available: boolean
          is_devwady_alumni: boolean
          linkedin_url: string
          location: string
          portfolio_url: string
          projects_count: number
          rating: number
          skills: string[]
          slug: string
          track: string
          user_id: string
        }[]
      }
      get_question_author_profiles: {
        Args: { p_course_ids: string[] }
        Returns: {
          full_name: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_course_instructor: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      student_allows_nomination: {
        Args: { _student_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "individual"
        | "company"
        | "admin"
        | "expert"
        | "student"
        | "instructor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "individual",
        "company",
        "admin",
        "expert",
        "student",
        "instructor",
      ],
    },
  },
} as const
