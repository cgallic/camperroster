// Generated from the Supabase schema. Do not edit by hand.
// Regenerate after a migration with the Supabase CLI:
//   supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string | null
          camp_id: string | null
          changed: Json
          id: number
          occurred_at: string
          record_id: string | null
          table_name: string
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id?: string | null
          camp_id?: string | null
          changed?: Json
          id?: number
          occurred_at?: string
          record_id?: string | null
          table_name: string
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string | null
          camp_id?: string | null
          changed?: Json
          id?: number
          occurred_at?: string
          record_id?: string | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      bunk_notes: {
        Row: {
          camp_id: string | null
          camper_name: string
          created_at: string | null
          delivery_date: string
          id: string
          message: string
          printed: boolean | null
          registration_id: string | null
          sender_name: string
          sender_relation: string
        }
        Insert: {
          camp_id?: string | null
          camper_name: string
          created_at?: string | null
          delivery_date: string
          id?: string
          message: string
          printed?: boolean | null
          registration_id?: string | null
          sender_name: string
          sender_relation: string
        }
        Update: {
          camp_id?: string | null
          camper_name?: string
          created_at?: string | null
          delivery_date?: string
          id?: string
          message?: string
          printed?: boolean | null
          registration_id?: string | null
          sender_name?: string
          sender_relation?: string
        }
        Relationships: [
          {
            foreignKeyName: "bunk_notes_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bunk_notes_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_document_status"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "bunk_notes_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      cabin_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          cabin_id: string
          camp_id: string
          id: string
          occupant_role: string
          registration_id: string | null
          staff_application_id: string | null
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          cabin_id: string
          camp_id: string
          id?: string
          occupant_role?: string
          registration_id?: string | null
          staff_application_id?: string | null
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          cabin_id?: string
          camp_id?: string
          id?: string
          occupant_role?: string
          registration_id?: string | null
          staff_application_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cabin_assignments_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabin_occupancy"
            referencedColumns: ["cabin_id"]
          },
          {
            foreignKeyName: "cabin_assignments_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabin_assignments_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabin_assignments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_document_status"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "cabin_assignments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabin_assignments_staff_application_id_fkey"
            columns: ["staff_application_id"]
            isOneToOne: false
            referencedRelation: "staff_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      cabins: {
        Row: {
          camp_id: string | null
          capacity: number
          created_at: string | null
          gender: string
          id: string
          is_open: boolean
          lead_counselor_id: string | null
          max_grade: number
          min_grade: number
          name: string
          session_id: string
          sort_order: number
        }
        Insert: {
          camp_id?: string | null
          capacity?: number
          created_at?: string | null
          gender: string
          id?: string
          is_open?: boolean
          lead_counselor_id?: string | null
          max_grade: number
          min_grade: number
          name: string
          session_id: string
          sort_order?: number
        }
        Update: {
          camp_id?: string | null
          capacity?: number
          created_at?: string | null
          gender?: string
          id?: string
          is_open?: boolean
          lead_counselor_id?: string | null
          max_grade?: number
          min_grade?: number
          name?: string
          session_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "cabins_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabins_lead_counselor_id_fkey"
            columns: ["lead_counselor_id"]
            isOneToOne: false
            referencedRelation: "staff_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabins_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "camp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      camp_members: {
        Row: {
          camp_id: string
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          camp_id: string
          created_at?: string
          role: string
          user_id: string
        }
        Update: {
          camp_id?: string
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "camp_members_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      camp_registration_imports: {
        Row: {
          camp_id: string
          first_name: string
          id: string
          imported_at: string
          last_name: string
          participant_type: string
          season_year: number
          source_data: Json
          source_registration_id: string | null
          source_row: number
          source_sha256: string
          source_sheet: string
          source_status: string | null
          source_workbook: string
        }
        Insert: {
          camp_id: string
          first_name: string
          id: string
          imported_at?: string
          last_name: string
          participant_type: string
          season_year: number
          source_data: Json
          source_registration_id?: string | null
          source_row: number
          source_sha256: string
          source_sheet: string
          source_status?: string | null
          source_workbook: string
        }
        Update: {
          camp_id?: string
          first_name?: string
          id?: string
          imported_at?: string
          last_name?: string
          participant_type?: string
          season_year?: number
          source_data?: Json
          source_registration_id?: string | null
          source_row?: number
          source_sha256?: string
          source_sheet?: string
          source_status?: string | null
          source_workbook?: string
        }
        Relationships: [
          {
            foreignKeyName: "camp_registration_imports_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      camp_sessions: {
        Row: {
          camp_id: string | null
          capacity: number
          created_at: string | null
          deposit_cents: number
          end_date: string
          id: string
          is_active: boolean | null
          max_grade: number
          min_grade: number
          name: string
          organization_id: string | null
          price_cents: number
          start_date: string
        }
        Insert: {
          camp_id?: string | null
          capacity?: number
          created_at?: string | null
          deposit_cents?: number
          end_date: string
          id?: string
          is_active?: boolean | null
          max_grade?: number
          min_grade?: number
          name: string
          organization_id?: string | null
          price_cents?: number
          start_date: string
        }
        Update: {
          camp_id?: string | null
          capacity?: number
          created_at?: string | null
          deposit_cents?: number
          end_date?: string
          id?: string
          is_active?: boolean | null
          max_grade?: number
          min_grade?: number
          name?: string
          organization_id?: string | null
          price_cents?: number
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "camp_sessions_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "camp_sessions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      camp_subscriptions: {
        Row: {
          camp_id: string
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          id: string
          plan: string | null
          quantity: number | null
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string
          updated_at: string
        }
        Insert: {
          camp_id: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string | null
          quantity?: number | null
          status: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id: string
          updated_at?: string
        }
        Update: {
          camp_id?: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          id?: string
          plan?: string | null
          quantity?: number | null
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "camp_subscriptions_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      campers: {
        Row: {
          birth_date: string
          camp_id: string | null
          created_at: string | null
          family_id: string | null
          gender: string
          grade_entering: number
          guardian_id: string
          id: string
          legal_first_name: string
          legal_last_name: string
          photo_url: string | null
          preferred_name: string | null
        }
        Insert: {
          birth_date: string
          camp_id?: string | null
          created_at?: string | null
          family_id?: string | null
          gender: string
          grade_entering: number
          guardian_id: string
          id?: string
          legal_first_name: string
          legal_last_name: string
          photo_url?: string | null
          preferred_name?: string | null
        }
        Update: {
          birth_date?: string
          camp_id?: string | null
          created_at?: string | null
          family_id?: string | null
          gender?: string
          grade_entering?: number
          guardian_id?: string
          id?: string
          legal_first_name?: string
          legal_last_name?: string
          photo_url?: string | null
          preferred_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campers_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campers_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campers_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
        ]
      }
      camps: {
        Row: {
          created_at: string
          director_email: string
          director_name: string
          director_phone: string | null
          id: string
          location: string | null
          logo_url: string | null
          name: string
          primary_color: string | null
          slug: string
          stripe_customer_id: string | null
        }
        Insert: {
          created_at?: string
          director_email: string
          director_name: string
          director_phone?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          slug: string
          stripe_customer_id?: string | null
        }
        Update: {
          created_at?: string
          director_email?: string
          director_name?: string
          director_phone?: string | null
          id?: string
          location?: string | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          slug?: string
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
      daily_photos: {
        Row: {
          activity_tag: string
          camp_id: string
          caption: string | null
          created_at: string | null
          id: string
          photo_url: string
          taken_at: string
          title: string
        }
        Insert: {
          activity_tag: string
          camp_id?: string
          caption?: string | null
          created_at?: string | null
          id?: string
          photo_url: string
          taken_at?: string
          title: string
        }
        Update: {
          activity_tag?: string
          camp_id?: string
          caption?: string | null
          created_at?: string | null
          id?: string
          photo_url?: string
          taken_at?: string
          title?: string
        }
        Relationships: []
      }
      document_records: {
        Row: {
          camp_id: string
          camper_id: string | null
          created_at: string
          document_type_id: string
          expires_on: string | null
          file_content_type: string | null
          file_path: string | null
          id: string
          issued_on: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          season_id: string | null
          staff_application_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          camp_id: string
          camper_id?: string | null
          created_at?: string
          document_type_id: string
          expires_on?: string | null
          file_content_type?: string | null
          file_path?: string | null
          id?: string
          issued_on?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          season_id?: string | null
          staff_application_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          camp_id?: string
          camper_id?: string | null
          created_at?: string
          document_type_id?: string
          expires_on?: string | null
          file_content_type?: string | null
          file_path?: string | null
          id?: string
          issued_on?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          season_id?: string | null
          staff_application_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_records_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_records_camper_id_fkey"
            columns: ["camper_id"]
            isOneToOne: false
            referencedRelation: "campers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_records_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_records_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_records_staff_application_id_fkey"
            columns: ["staff_application_id"]
            isOneToOne: false
            referencedRelation: "staff_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          applies_to: string
          camp_id: string
          code: string
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_required: boolean
          name: string
          requires_signature: boolean
          requires_upload: boolean
          validity_months: number | null
        }
        Insert: {
          applies_to: string
          camp_id: string
          code: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_required?: boolean
          name: string
          requires_signature?: boolean
          requires_upload?: boolean
          validity_months?: number | null
        }
        Update: {
          applies_to?: string
          camp_id?: string
          code?: string
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_required?: boolean
          name?: string
          requires_signature?: boolean
          requires_upload?: boolean
          validity_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_types_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          camp_id: string
          code: string
          id: string
          merge_keys: Json
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          camp_id: string
          code: string
          id?: string
          merge_keys?: Json
          name: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          camp_id?: string
          code?: string
          id?: string
          merge_keys?: Json
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      emar_logs: {
        Row: {
          administered_at: string | null
          administered_by: string
          camper_id: string
          dosage: string
          id: string
          medication_name: string
          notes: string | null
          scheduled_time: string
          session_id: string
        }
        Insert: {
          administered_at?: string | null
          administered_by: string
          camper_id: string
          dosage: string
          id?: string
          medication_name: string
          notes?: string | null
          scheduled_time: string
          session_id: string
        }
        Update: {
          administered_at?: string | null
          administered_by?: string
          camper_id?: string
          dosage?: string
          id?: string
          medication_name?: string
          notes?: string | null
          scheduled_time?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emar_logs_camper_id_fkey"
            columns: ["camper_id"]
            isOneToOne: false
            referencedRelation: "campers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emar_logs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "camp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          camp_id: string
          city: string | null
          created_at: string
          household_name: string
          id: string
          notes: string | null
          state: string | null
          updated_at: string
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          camp_id: string
          city?: string | null
          created_at?: string
          household_name: string
          id?: string
          notes?: string | null
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          camp_id?: string
          city?: string | null
          created_at?: string
          household_name?: string
          id?: string
          notes?: string | null
          state?: string | null
          updated_at?: string
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "families_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      family_invoices: {
        Row: {
          amount_paid_cents: number
          amount_refunded_cents: number
          camp_id: string
          camper_count: number
          created_at: string
          custom_total_cents: number | null
          family_id: string
          financial_aid_cents: number
          id: string
          payment_plan: string
          priced_at: string
          processing_fee_cents: number
          season_id: string
          tier_cents: number
          total_due_cents: number | null
          updated_at: string
        }
        Insert: {
          amount_paid_cents?: number
          amount_refunded_cents?: number
          camp_id: string
          camper_count?: number
          created_at?: string
          custom_total_cents?: number | null
          family_id: string
          financial_aid_cents?: number
          id?: string
          payment_plan?: string
          priced_at?: string
          processing_fee_cents?: number
          season_id: string
          tier_cents?: number
          total_due_cents?: number | null
          updated_at?: string
        }
        Update: {
          amount_paid_cents?: number
          amount_refunded_cents?: number
          camp_id?: string
          camper_count?: number
          created_at?: string
          custom_total_cents?: number | null
          family_id?: string
          financial_aid_cents?: number
          id?: string
          payment_plan?: string
          priced_at?: string
          processing_fee_cents?: number
          season_id?: string
          tier_cents?: number
          total_due_cents?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_invoices_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_invoices_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_invoices_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_aid_applications: {
        Row: {
          amount_awarded_cents: number | null
          amount_requested_cents: number | null
          camp_id: string
          created_at: string
          decided_at: string | null
          decided_by: string | null
          family_id: string
          id: string
          narrative: string | null
          season_id: string
          status: string
        }
        Insert: {
          amount_awarded_cents?: number | null
          amount_requested_cents?: number | null
          camp_id: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          family_id: string
          id?: string
          narrative?: string | null
          season_id: string
          status?: string
        }
        Update: {
          amount_awarded_cents?: number | null
          amount_requested_cents?: number | null
          camp_id?: string
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          family_id?: string
          id?: string
          narrative?: string | null
          season_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_aid_applications_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_aid_applications_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_aid_applications_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      form_definitions: {
        Row: {
          camp_id: string
          created_at: string
          id: string
          intro_text: string | null
          period_id: string
          published_at: string | null
          title: string
          version: number
        }
        Insert: {
          camp_id: string
          created_at?: string
          id?: string
          intro_text?: string | null
          period_id: string
          published_at?: string | null
          title: string
          version?: number
        }
        Update: {
          camp_id?: string
          created_at?: string
          id?: string
          intro_text?: string | null
          period_id?: string
          published_at?: string | null
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "form_definitions_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_definitions_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "registration_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      form_fields: {
        Row: {
          camp_id: string
          created_at: string
          display_order: number
          field_key: string
          field_type: string
          form_id: string
          help_text: string | null
          id: string
          label: string
          options: Json
          required: boolean
          section: string | null
          visible_when: Json | null
        }
        Insert: {
          camp_id: string
          created_at?: string
          display_order?: number
          field_key: string
          field_type: string
          form_id: string
          help_text?: string | null
          id?: string
          label: string
          options?: Json
          required?: boolean
          section?: string | null
          visible_when?: Json | null
        }
        Update: {
          camp_id?: string
          created_at?: string
          display_order?: number
          field_key?: string
          field_type?: string
          form_id?: string
          help_text?: string | null
          id?: string
          label?: string
          options?: Json
          required?: boolean
          section?: string | null
          visible_when?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "form_fields_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_fields_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "form_definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          answers: Json
          camp_id: string
          created_at: string
          form_id: string
          id: string
          registration_id: string | null
          staff_application_id: string | null
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          answers?: Json
          camp_id: string
          created_at?: string
          form_id: string
          id?: string
          registration_id?: string | null
          staff_application_id?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          answers?: Json
          camp_id?: string
          created_at?: string
          form_id?: string
          id?: string
          registration_id?: string | null
          staff_application_id?: string | null
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "form_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_document_status"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "form_submissions_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_staff_application_id_fkey"
            columns: ["staff_application_id"]
            isOneToOne: false
            referencedRelation: "staff_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          address_line1: string
          address_line2: string | null
          auth_user_id: string | null
          camp_id: string | null
          city: string
          created_at: string | null
          email: string
          family_id: string | null
          first_name: string
          id: string
          last_name: string
          organization_id: string | null
          phone: string
          relationship: string
          state: string
          updated_at: string | null
          zip: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          auth_user_id?: string | null
          camp_id?: string | null
          city: string
          created_at?: string | null
          email: string
          family_id?: string | null
          first_name: string
          id?: string
          last_name: string
          organization_id?: string | null
          phone: string
          relationship: string
          state: string
          updated_at?: string | null
          zip: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          auth_user_id?: string | null
          camp_id?: string | null
          city?: string
          created_at?: string | null
          email?: string
          family_id?: string | null
          first_name?: string
          id?: string
          last_name?: string
          organization_id?: string | null
          phone?: string
          relationship?: string
          state?: string
          updated_at?: string | null
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardians_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardians_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardians_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      health_profiles: {
        Row: {
          allergy_details: string | null
          camp_id: string | null
          camper_id: string
          created_at: string | null
          dietary_restrictions: string | null
          epipen_location: string | null
          has_allergies: boolean | null
          has_epipen: boolean | null
          has_medications: boolean | null
          id: string
          immunization_record_url: string | null
          immunization_status: string | null
          medical_conditions: string | null
          medication_details: string | null
          physician_name: string | null
          physician_phone: string | null
          special_care_notes: string | null
          updated_at: string | null
        }
        Insert: {
          allergy_details?: string | null
          camp_id?: string | null
          camper_id: string
          created_at?: string | null
          dietary_restrictions?: string | null
          epipen_location?: string | null
          has_allergies?: boolean | null
          has_epipen?: boolean | null
          has_medications?: boolean | null
          id?: string
          immunization_record_url?: string | null
          immunization_status?: string | null
          medical_conditions?: string | null
          medication_details?: string | null
          physician_name?: string | null
          physician_phone?: string | null
          special_care_notes?: string | null
          updated_at?: string | null
        }
        Update: {
          allergy_details?: string | null
          camp_id?: string | null
          camper_id?: string
          created_at?: string | null
          dietary_restrictions?: string | null
          epipen_location?: string | null
          has_allergies?: boolean | null
          has_epipen?: boolean | null
          has_medications?: boolean | null
          id?: string
          immunization_record_url?: string | null
          immunization_status?: string | null
          medical_conditions?: string | null
          medication_details?: string | null
          physician_name?: string | null
          physician_phone?: string | null
          special_care_notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_profiles_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_profiles_camper_id_fkey"
            columns: ["camper_id"]
            isOneToOne: false
            referencedRelation: "campers"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_policies: {
        Row: {
          camp_id: string | null
          camper_id: string
          card_back_url: string | null
          card_front_url: string | null
          created_at: string | null
          group_number: string | null
          id: string
          insurance_company: string
          member_id: string
          policyholder_name: string
          relationship_to_camper: string
          status: string | null
        }
        Insert: {
          camp_id?: string | null
          camper_id: string
          card_back_url?: string | null
          card_front_url?: string | null
          created_at?: string | null
          group_number?: string | null
          id?: string
          insurance_company: string
          member_id: string
          policyholder_name: string
          relationship_to_camper: string
          status?: string | null
        }
        Update: {
          camp_id?: string | null
          camper_id?: string
          card_back_url?: string | null
          card_front_url?: string | null
          created_at?: string | null
          group_number?: string | null
          id?: string
          insurance_company?: string
          member_id?: string
          policyholder_name?: string
          relationship_to_camper?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "insurance_policies_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_camper_id_fkey"
            columns: ["camper_id"]
            isOneToOne: false
            referencedRelation: "campers"
            referencedColumns: ["id"]
          },
        ]
      }
      kaicalls_logs: {
        Row: {
          call_type: string
          caller_phone: string
          camp_id: string | null
          created_at: string | null
          duration_seconds: number | null
          extracted_actions: Json | null
          full_transcript: string | null
          id: string
          organization_id: string | null
          recipient_phone: string
          recording_url: string | null
          status: string
          summary: string | null
        }
        Insert: {
          call_type: string
          caller_phone: string
          camp_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          extracted_actions?: Json | null
          full_transcript?: string | null
          id?: string
          organization_id?: string | null
          recipient_phone: string
          recording_url?: string | null
          status: string
          summary?: string | null
        }
        Update: {
          call_type?: string
          caller_phone?: string
          camp_id?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          extracted_actions?: Json | null
          full_transcript?: string | null
          id?: string
          organization_id?: string | null
          recipient_phone?: string
          recording_url?: string | null
          status?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kaicalls_logs_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kaicalls_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_rules: {
        Row: {
          auto_send: boolean
          camp_id: string
          id: string
          is_enabled: boolean
          notify_emails: string[]
          template_id: string | null
          trigger_code: string
        }
        Insert: {
          auto_send?: boolean
          camp_id: string
          id?: string
          is_enabled?: boolean
          notify_emails?: string[]
          template_id?: string | null
          trigger_code: string
        }
        Update: {
          auto_send?: boolean
          camp_id?: string
          id?: string
          is_enabled?: boolean
          notify_emails?: string[]
          template_id?: string | null
          trigger_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_rules_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          phone_number: string | null
          settings: Json | null
          slug: string
          stripe_account_id: string | null
          subdomain: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          phone_number?: string | null
          settings?: Json | null
          slug: string
          stripe_account_id?: string | null
          subdomain: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          phone_number?: string | null
          settings?: Json | null
          slug?: string
          stripe_account_id?: string | null
          subdomain?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      outgoing_messages: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          audience_label: string
          body: string
          camp_id: string
          created_at: string
          failure_reason: string | null
          id: string
          recipients: Json
          scheduled_for: string | null
          sent_at: string | null
          source_view: string | null
          status: string
          subject: string
          template_id: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          audience_label: string
          body: string
          camp_id: string
          created_at?: string
          failure_reason?: string | null
          id?: string
          recipients?: Json
          scheduled_for?: string | null
          sent_at?: string | null
          source_view?: string | null
          status?: string
          subject: string
          template_id?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          audience_label?: string
          body?: string
          camp_id?: string
          created_at?: string
          failure_reason?: string | null
          id?: string
          recipients?: Json
          scheduled_for?: string | null
          sent_at?: string | null
          source_view?: string | null
          status?: string
          subject?: string
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outgoing_messages_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outgoing_messages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_history: {
        Row: {
          attended: boolean
          camp_id: string
          camper_id: string | null
          created_at: string
          grade_completed: number | null
          id: string
          participant_type: string
          season_id: string
          staff_application_id: string | null
        }
        Insert: {
          attended?: boolean
          camp_id: string
          camper_id?: string | null
          created_at?: string
          grade_completed?: number | null
          id?: string
          participant_type: string
          season_id: string
          staff_application_id?: string | null
        }
        Update: {
          attended?: boolean
          camp_id?: string
          camper_id?: string | null
          created_at?: string
          grade_completed?: number | null
          id?: string
          participant_type?: string
          season_id?: string
          staff_application_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "participant_history_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_history_camper_id_fkey"
            columns: ["camper_id"]
            isOneToOne: false
            referencedRelation: "campers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_history_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_history_staff_application_id_fkey"
            columns: ["staff_application_id"]
            isOneToOne: false
            referencedRelation: "staff_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      pastoral_flags: {
        Row: {
          camp_id: string
          detail: string | null
          id: string
          raised_at: string
          reason: string
          registration_id: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          staff_application_id: string | null
        }
        Insert: {
          camp_id: string
          detail?: string | null
          id?: string
          raised_at?: string
          reason: string
          registration_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          staff_application_id?: string | null
        }
        Update: {
          camp_id?: string
          detail?: string | null
          id?: string
          raised_at?: string
          reason?: string
          registration_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          staff_application_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pastoral_flags_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pastoral_flags_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_document_status"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "pastoral_flags_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pastoral_flags_staff_application_id_fkey"
            columns: ["staff_application_id"]
            isOneToOne: false
            referencedRelation: "staff_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_schedule_items: {
        Row: {
          amount_cents: number
          camp_id: string
          created_at: string
          due_on: string
          id: string
          invoice_id: string
          late_notice_sent_at: string | null
          reminder_sent_at: string | null
          status: string
        }
        Insert: {
          amount_cents: number
          camp_id: string
          created_at?: string
          due_on: string
          id?: string
          invoice_id: string
          late_notice_sent_at?: string | null
          reminder_sent_at?: string | null
          status?: string
        }
        Update: {
          amount_cents?: number
          camp_id?: string
          created_at?: string
          due_on?: string
          id?: string
          invoice_id?: string
          late_notice_sent_at?: string | null
          reminder_sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedule_items_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedule_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "family_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedule_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["invoice_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          camp_id: string
          created_at: string
          failure_reason: string | null
          id: string
          invoice_id: string
          method: string
          note: string | null
          paid_at: string | null
          refunded_cents: number
          schedule_item_id: string | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount_cents: number
          camp_id: string
          created_at?: string
          failure_reason?: string | null
          id?: string
          invoice_id: string
          method?: string
          note?: string | null
          paid_at?: string | null
          refunded_cents?: number
          schedule_item_id?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount_cents?: number
          camp_id?: string
          created_at?: string
          failure_reason?: string | null
          id?: string
          invoice_id?: string
          method?: string
          note?: string | null
          paid_at?: string | null
          refunded_cents?: number
          schedule_item_id?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "family_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "outstanding_balances"
            referencedColumns: ["invoice_id"]
          },
          {
            foreignKeyName: "payments_schedule_item_id_fkey"
            columns: ["schedule_item_id"]
            isOneToOne: false
            referencedRelation: "payment_schedule_items"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_tiers: {
        Row: {
          camp_id: string
          camper_count: number
          early_cents: number
          id: string
          regular_cents: number
          season_id: string
        }
        Insert: {
          camp_id: string
          camper_count: number
          early_cents: number
          id?: string
          regular_cents: number
          season_id: string
        }
        Update: {
          camp_id?: string
          camper_count?: number
          early_cents?: number
          id?: string
          regular_cents?: number
          season_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_tiers_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pricing_tiers_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_periods: {
        Row: {
          access_token: string | null
          audience: string
          camp_id: string
          closes_at: string | null
          created_at: string
          id: string
          name: string
          opens_at: string | null
          season_id: string
          visibility: string
        }
        Insert: {
          access_token?: string | null
          audience: string
          camp_id: string
          closes_at?: string | null
          created_at?: string
          id?: string
          name: string
          opens_at?: string | null
          season_id: string
          visibility?: string
        }
        Update: {
          access_token?: string | null
          audience?: string
          camp_id?: string
          closes_at?: string | null
          created_at?: string
          id?: string
          name?: string
          opens_at?: string | null
          season_id?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_periods_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_periods_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      registrations: {
        Row: {
          amount_paid_cents: number | null
          buddy_requests: string[] | null
          cabin_id: string | null
          cabin_name: string | null
          camp_id: string | null
          camp_slug: string | null
          camper_id: string
          canteen_balance_cents: number | null
          checked_in: boolean | null
          checked_in_at: string | null
          consents_agreed: Json
          counselor_name: string | null
          created_at: string | null
          guardian_id: string
          id: string
          organization_id: string | null
          payment_plan: string | null
          photo_release_tier: string | null
          progress_percentage: number | null
          session_id: string | null
          signed_at: string | null
          signed_by: string | null
          status: string | null
          step_completed: number | null
          total_tuition_cents: number | null
          updated_at: string | null
        }
        Insert: {
          amount_paid_cents?: number | null
          buddy_requests?: string[] | null
          cabin_id?: string | null
          cabin_name?: string | null
          camp_id?: string | null
          camp_slug?: string | null
          camper_id: string
          canteen_balance_cents?: number | null
          checked_in?: boolean | null
          checked_in_at?: string | null
          consents_agreed?: Json
          counselor_name?: string | null
          created_at?: string | null
          guardian_id: string
          id?: string
          organization_id?: string | null
          payment_plan?: string | null
          photo_release_tier?: string | null
          progress_percentage?: number | null
          session_id?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string | null
          step_completed?: number | null
          total_tuition_cents?: number | null
          updated_at?: string | null
        }
        Update: {
          amount_paid_cents?: number | null
          buddy_requests?: string[] | null
          cabin_id?: string | null
          cabin_name?: string | null
          camp_id?: string | null
          camp_slug?: string | null
          camper_id?: string
          canteen_balance_cents?: number | null
          checked_in?: boolean | null
          checked_in_at?: string | null
          consents_agreed?: Json
          counselor_name?: string | null
          created_at?: string | null
          guardian_id?: string
          id?: string
          organization_id?: string | null
          payment_plan?: string | null
          photo_release_tier?: string | null
          progress_percentage?: number | null
          session_id?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string | null
          step_completed?: number | null
          total_tuition_cents?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabin_occupancy"
            referencedColumns: ["cabin_id"]
          },
          {
            foreignKeyName: "registrations_cabin_id_fkey"
            columns: ["cabin_id"]
            isOneToOne: false
            referencedRelation: "cabins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_camper_id_fkey"
            columns: ["camper_id"]
            isOneToOne: false
            referencedRelation: "campers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "camp_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          camp_id: string
          created_at: string
          early_rate_ends_on: string
          forms_due_on: string
          id: string
          is_active: boolean
          name: string
          year: number
        }
        Insert: {
          camp_id: string
          created_at?: string
          early_rate_ends_on: string
          forms_due_on: string
          id?: string
          is_active?: boolean
          name: string
          year: number
        }
        Update: {
          camp_id?: string
          created_at?: string
          early_rate_ends_on?: string
          forms_due_on?: string
          id?: string
          is_active?: boolean
          name?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "seasons_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      service_areas: {
        Row: {
          camp_id: string
          code: string
          display_order: number
          id: string
          name: string
          target_per_day: number | null
        }
        Insert: {
          camp_id: string
          code: string
          display_order?: number
          id?: string
          name: string
          target_per_day?: number | null
        }
        Update: {
          camp_id?: string
          code?: string
          display_order?: number
          id?: string
          name?: string
          target_per_day?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_areas_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      signatures: {
        Row: {
          camp_id: string
          document_record_id: string | null
          id: string
          registration_id: string | null
          signed_at: string
          signer_ip: unknown
          signer_name: string
          signer_user_agent: string | null
          signer_user_id: string | null
          statement: string
          statement_sha256: string
        }
        Insert: {
          camp_id: string
          document_record_id?: string | null
          id?: string
          registration_id?: string | null
          signed_at?: string
          signer_ip?: unknown
          signer_name: string
          signer_user_agent?: string | null
          signer_user_id?: string | null
          statement: string
          statement_sha256: string
        }
        Update: {
          camp_id?: string
          document_record_id?: string | null
          id?: string
          registration_id?: string | null
          signed_at?: string
          signer_ip?: unknown
          signer_name?: string
          signer_user_agent?: string | null
          signer_user_id?: string | null
          statement?: string
          statement_sha256?: string
        }
        Relationships: [
          {
            foreignKeyName: "signatures_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signatures_document_record_id_fkey"
            columns: ["document_record_id"]
            isOneToOne: false
            referencedRelation: "document_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signatures_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_document_status"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "signatures_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_applications: {
        Row: {
          background_check_id: string | null
          background_status: string | null
          birth_date: string
          camp_id: string | null
          certifications: Json | null
          created_at: string | null
          discussion_note: string | null
          email: string
          experience_notes: string | null
          first_name: string
          flagged_for_discussion: boolean
          id: string
          is_first_time_counselor: boolean
          last_name: string
          organization_id: string | null
          phone: string
          role_applied: string
          status: string | null
          updated_at: string | null
          willing_to_become_lifeguard: boolean
        }
        Insert: {
          background_check_id?: string | null
          background_status?: string | null
          birth_date: string
          camp_id?: string | null
          certifications?: Json | null
          created_at?: string | null
          discussion_note?: string | null
          email: string
          experience_notes?: string | null
          first_name: string
          flagged_for_discussion?: boolean
          id?: string
          is_first_time_counselor?: boolean
          last_name: string
          organization_id?: string | null
          phone: string
          role_applied: string
          status?: string | null
          updated_at?: string | null
          willing_to_become_lifeguard?: boolean
        }
        Update: {
          background_check_id?: string | null
          background_status?: string | null
          birth_date?: string
          camp_id?: string | null
          certifications?: Json | null
          created_at?: string | null
          discussion_note?: string | null
          email?: string
          experience_notes?: string | null
          first_name?: string
          flagged_for_discussion?: boolean
          id?: string
          is_first_time_counselor?: boolean
          last_name?: string
          organization_id?: string | null
          phone?: string
          role_applied?: string
          status?: string | null
          updated_at?: string | null
          willing_to_become_lifeguard?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "staff_applications_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_applications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_references: {
        Row: {
          application_id: string
          call_transcript: string | null
          camp_id: string | null
          created_at: string | null
          director_reviewed: boolean | null
          email: string | null
          id: string
          kaicalls_call_id: string | null
          phone: string
          reference_name: string
          relationship: string
          safety_approved: boolean | null
          safety_reviewed_at: string | null
          safety_reviewed_by: string | null
          sentiment_score: number | null
          status: string | null
          verified_at: string | null
        }
        Insert: {
          application_id: string
          call_transcript?: string | null
          camp_id?: string | null
          created_at?: string | null
          director_reviewed?: boolean | null
          email?: string | null
          id?: string
          kaicalls_call_id?: string | null
          phone: string
          reference_name: string
          relationship: string
          safety_approved?: boolean | null
          safety_reviewed_at?: string | null
          safety_reviewed_by?: string | null
          sentiment_score?: number | null
          status?: string | null
          verified_at?: string | null
        }
        Update: {
          application_id?: string
          call_transcript?: string | null
          camp_id?: string | null
          created_at?: string | null
          director_reviewed?: boolean | null
          email?: string | null
          id?: string
          kaicalls_call_id?: string | null
          phone?: string
          reference_name?: string
          relationship?: string
          safety_approved?: boolean | null
          safety_reviewed_at?: string | null
          safety_reviewed_by?: string | null
          sentiment_score?: number | null
          status?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_references_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "staff_applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_references_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          handler: string
          id: string
          received_at: string
          type: string
        }
        Insert: {
          handler: string
          id: string
          received_at?: string
          type: string
        }
        Update: {
          handler?: string
          id?: string
          received_at?: string
          type?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount_cents: number
          created_at: string | null
          id: string
          organization_id: string | null
          payment_type: string
          registration_id: string | null
          status: string
          stripe_payment_intent_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string | null
          id?: string
          organization_id?: string | null
          payment_type: string
          registration_id?: string | null
          status: string
          stripe_payment_intent_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string | null
          id?: string
          organization_id?: string | null
          payment_type?: string
          registration_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_document_status"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "transactions_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_assignments: {
        Row: {
          assigned_at: string
          camp_id: string
          id: string
          is_primary: boolean
          season_id: string
          service_area_id: string
          staff_application_id: string
        }
        Insert: {
          assigned_at?: string
          camp_id: string
          id?: string
          is_primary?: boolean
          season_id: string
          service_area_id: string
          staff_application_id: string
        }
        Update: {
          assigned_at?: string
          camp_id?: string
          id?: string
          is_primary?: boolean
          season_id?: string
          service_area_id?: string
          staff_application_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_assignments_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_assignments_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_assignments_service_area_id_fkey"
            columns: ["service_area_id"]
            isOneToOne: false
            referencedRelation: "service_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_assignments_service_area_id_fkey"
            columns: ["service_area_id"]
            isOneToOne: false
            referencedRelation: "volunteer_coverage"
            referencedColumns: ["service_area_id"]
          },
          {
            foreignKeyName: "volunteer_assignments_staff_application_id_fkey"
            columns: ["staff_application_id"]
            isOneToOne: false
            referencedRelation: "staff_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_availability: {
        Row: {
          camp_id: string
          id: string
          season_id: string
          serves_on: string
          staff_application_id: string
        }
        Insert: {
          camp_id: string
          id?: string
          season_id: string
          serves_on: string
          staff_application_id: string
        }
        Update: {
          camp_id?: string
          id?: string
          season_id?: string
          serves_on?: string
          staff_application_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_availability_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_availability_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_availability_staff_application_id_fkey"
            columns: ["staff_application_id"]
            isOneToOne: false
            referencedRelation: "staff_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_entries: {
        Row: {
          camp_id: string
          created_at: string
          gender: string | null
          grade: number | null
          id: string
          offered_at: string | null
          position: number
          registration_id: string | null
          season_id: string
          staff_application_id: string | null
          status: string
        }
        Insert: {
          camp_id: string
          created_at?: string
          gender?: string | null
          grade?: number | null
          id?: string
          offered_at?: string | null
          position?: number
          registration_id?: string | null
          season_id: string
          staff_application_id?: string | null
          status?: string
        }
        Update: {
          camp_id?: string
          created_at?: string
          gender?: string | null
          grade?: number | null
          id?: string
          offered_at?: string | null
          position?: number
          registration_id?: string | null
          season_id?: string
          staff_application_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registration_document_status"
            referencedColumns: ["registration_id"]
          },
          {
            foreignKeyName: "waitlist_entries_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlist_entries_staff_application_id_fkey"
            columns: ["staff_application_id"]
            isOneToOne: false
            referencedRelation: "staff_applications"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      cabin_occupancy: {
        Row: {
          cabin_id: string | null
          camp_id: string | null
          campers_assigned: number | null
          capacity: number | null
          gender: string | null
          is_open: boolean | null
          lead_counselor_id: string | null
          max_grade: number | null
          min_grade: number | null
          name: string | null
          sort_order: number | null
          spots_remaining: number | null
        }
        Insert: {
          cabin_id?: string | null
          camp_id?: string | null
          campers_assigned?: never
          capacity?: number | null
          gender?: string | null
          is_open?: boolean | null
          lead_counselor_id?: string | null
          max_grade?: number | null
          min_grade?: number | null
          name?: string | null
          sort_order?: number | null
          spots_remaining?: never
        }
        Update: {
          cabin_id?: string | null
          camp_id?: string | null
          campers_assigned?: never
          capacity?: number | null
          gender?: string | null
          is_open?: boolean | null
          lead_counselor_id?: string | null
          max_grade?: number | null
          min_grade?: number | null
          name?: string | null
          sort_order?: number | null
          spots_remaining?: never
        }
        Relationships: [
          {
            foreignKeyName: "cabins_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cabins_lead_counselor_id_fkey"
            columns: ["lead_counselor_id"]
            isOneToOne: false
            referencedRelation: "staff_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      outstanding_balances: {
        Row: {
          amount_paid_cents: number | null
          balance_cents: number | null
          camp_id: string | null
          family_id: string | null
          household_name: string | null
          invoice_id: string | null
          next_due_on: string | null
          season_id: string | null
          total_due_cents: number | null
        }
        Relationships: [
          {
            foreignKeyName: "family_invoices_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_invoices_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_invoices_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      registration_document_status: {
        Row: {
          camp_id: string | null
          camper_id: string | null
          registration_id: string | null
          required_approved: number | null
          required_outstanding: number | null
          required_total: number | null
        }
        Relationships: [
          {
            foreignKeyName: "registrations_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_camper_id_fkey"
            columns: ["camper_id"]
            isOneToOne: false
            referencedRelation: "campers"
            referencedColumns: ["id"]
          },
        ]
      }
      volunteer_coverage: {
        Row: {
          camp_id: string | null
          season_id: string | null
          serves_on: string | null
          service_area: string | null
          service_area_id: string | null
          shortfall: number | null
          target_per_day: number | null
          volunteers: number | null
        }
        Relationships: [
          {
            foreignKeyName: "volunteer_assignments_camp_id_fkey"
            columns: ["camp_id"]
            isOneToOne: false
            referencedRelation: "camps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "volunteer_availability_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      assign_camper_to_cabin: {
        Args: { p_registration_id: string }
        Returns: string
      }
      assign_staff_to_cabin: {
        Args: {
          p_cabin_id: string
          p_occupant_role: string
          p_staff_application_id: string
        }
        Returns: undefined
      }
      cabin_camper_count: { Args: { p_cabin_id: string }; Returns: number }
      current_user_camp_ids: { Args: never; Returns: string[] }
      family_tuition_cents: {
        Args: { p_as_of?: string; p_camper_count: number; p_season_id: string }
        Returns: number
      }
      has_camp_role: {
        Args: { p_camp_id: string; p_roles: string[] }
        Returns: boolean
      }
      is_camp_director: { Args: { p_camp_id: string }; Returns: boolean }
      is_camp_member: { Args: { p_camp_id: string }; Returns: boolean }
      move_camper_to_cabin: {
        Args: {
          p_cabin_id: string
          p_override?: boolean
          p_registration_id: string
        }
        Returns: undefined
      }
      promote_from_waitlist: {
        Args: {
          p_cabin_id?: string
          p_override?: boolean
          p_waitlist_entry_id: string
        }
        Returns: string
      }
      registration_period_is_open: {
        Args: {
          p_period: Database["public"]["Tables"]["registration_periods"]["Row"]
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
