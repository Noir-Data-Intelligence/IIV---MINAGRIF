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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      animal_events: {
        Row: {
          animal_id: string
          created_at: string
          details: Json | null
          event_date: string
          event_type: Database["public"]["Enums"]["animal_event_type"]
          id: string
          notes: string | null
          recorded_by: string | null
        }
        Insert: {
          animal_id: string
          created_at?: string
          details?: Json | null
          event_date?: string
          event_type: Database["public"]["Enums"]["animal_event_type"]
          id?: string
          notes?: string | null
          recorded_by?: string | null
        }
        Update: {
          animal_id?: string
          created_at?: string
          details?: Json | null
          event_date?: string
          event_type?: Database["public"]["Enums"]["animal_event_type"]
          id?: string
          notes?: string | null
          recorded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animal_events_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
      animal_health_records: {
        Row: {
          animal_id: string
          created_at: string
          diagnosis: string | null
          dosage: string | null
          id: string
          next_due_date: string | null
          product_name: string | null
          record_date: string
          record_type: string
          recorded_by: string | null
          treatment: string | null
          veterinarian: string | null
        }
        Insert: {
          animal_id: string
          created_at?: string
          diagnosis?: string | null
          dosage?: string | null
          id?: string
          next_due_date?: string | null
          product_name?: string | null
          record_date?: string
          record_type: string
          recorded_by?: string | null
          treatment?: string | null
          veterinarian?: string | null
        }
        Update: {
          animal_id?: string
          created_at?: string
          diagnosis?: string | null
          dosage?: string | null
          id?: string
          next_due_date?: string | null
          product_name?: string | null
          record_date?: string
          record_type?: string
          recorded_by?: string | null
          treatment?: string | null
          veterinarian?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "animal_health_records_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animals"
            referencedColumns: ["id"]
          },
        ]
      }
      animals: {
        Row: {
          birth_date: string | null
          breed: string | null
          created_at: string
          created_by: string | null
          current_weight_kg: number | null
          father_tag: string | null
          id: string
          mother_tag: string | null
          name: string | null
          notes: string | null
          sex: Database["public"]["Enums"]["animal_sex"]
          species: string
          station_id: string
          status: Database["public"]["Enums"]["animal_status"]
          tag: string
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          breed?: string | null
          created_at?: string
          created_by?: string | null
          current_weight_kg?: number | null
          father_tag?: string | null
          id?: string
          mother_tag?: string | null
          name?: string | null
          notes?: string | null
          sex: Database["public"]["Enums"]["animal_sex"]
          species: string
          station_id: string
          status?: Database["public"]["Enums"]["animal_status"]
          tag: string
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          breed?: string | null
          created_at?: string
          created_by?: string | null
          current_weight_kg?: number | null
          father_tag?: string | null
          id?: string
          mother_tag?: string | null
          name?: string | null
          notes?: string | null
          sex?: Database["public"]["Enums"]["animal_sex"]
          species?: string
          station_id?: string
          status?: Database["public"]["Enums"]["animal_status"]
          tag?: string
          updated_at?: string
        }
        Relationships: []
      }
      asset_maintenance: {
        Row: {
          asset_id: string
          cost: number
          created_at: string
          description: string
          id: string
          maintenance_date: string
          next_due_date: string | null
          notes: string | null
          performed_by: string | null
          provider: string | null
          type: Database["public"]["Enums"]["maintenance_type"]
        }
        Insert: {
          asset_id: string
          cost?: number
          created_at?: string
          description: string
          id?: string
          maintenance_date?: string
          next_due_date?: string | null
          notes?: string | null
          performed_by?: string | null
          provider?: string | null
          type?: Database["public"]["Enums"]["maintenance_type"]
        }
        Update: {
          asset_id?: string
          cost?: number
          created_at?: string
          description?: string
          id?: string
          maintenance_date?: string
          next_due_date?: string | null
          notes?: string | null
          performed_by?: string | null
          provider?: string | null
          type?: Database["public"]["Enums"]["maintenance_type"]
        }
        Relationships: []
      }
      assets: {
        Row: {
          acquisition_cost: number
          acquisition_date: string | null
          category: string
          code: string
          created_at: string
          created_by: string | null
          current_value: number | null
          department_id: string | null
          description: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          responsible_user_id: string | null
          serial_number: string | null
          station_id: string | null
          status: Database["public"]["Enums"]["asset_status"]
          updated_at: string
        }
        Insert: {
          acquisition_cost?: number
          acquisition_date?: string | null
          category: string
          code: string
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          department_id?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          responsible_user_id?: string | null
          serial_number?: string | null
          station_id?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
        }
        Update: {
          acquisition_cost?: number
          acquisition_date?: string | null
          category?: string
          code?: string
          created_at?: string
          created_by?: string | null
          current_value?: number | null
          department_id?: string | null
          description?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          responsible_user_id?: string | null
          serial_number?: string | null
          station_id?: string | null
          status?: Database["public"]["Enums"]["asset_status"]
          updated_at?: string
        }
        Relationships: []
      }
      batch_distributions: {
        Row: {
          batch_id: string
          created_at: string
          destination: string
          distributed_by: string | null
          distribution_date: string
          id: string
          notes: string | null
          quantity: number
        }
        Insert: {
          batch_id: string
          created_at?: string
          destination: string
          distributed_by?: string | null
          distribution_date?: string
          id?: string
          notes?: string | null
          quantity: number
        }
        Update: {
          batch_id?: string
          created_at?: string
          destination?: string
          distributed_by?: string | null
          distribution_date?: string
          id?: string
          notes?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "batch_distributions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "production_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      breeders: {
        Row: {
          birth_date: string | null
          breed: string | null
          center_id: string
          created_at: string
          id: string
          name: string | null
          notes: string | null
          species: string
          status: Database["public"]["Enums"]["breeder_status"]
          tag: string
          updated_at: string
        }
        Insert: {
          birth_date?: string | null
          breed?: string | null
          center_id: string
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          species: string
          status?: Database["public"]["Enums"]["breeder_status"]
          tag: string
          updated_at?: string
        }
        Update: {
          birth_date?: string | null
          breed?: string | null
          center_id?: string
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          species?: string
          status?: Database["public"]["Enums"]["breeder_status"]
          tag?: string
          updated_at?: string
        }
        Relationships: []
      }
      budgets: {
        Row: {
          account_id: string
          created_at: string
          department_id: string | null
          id: string
          notes: string | null
          planned_amount: number
          updated_at: string
          year: number
        }
        Insert: {
          account_id: string
          created_at?: string
          department_id?: string | null
          id?: string
          notes?: string | null
          planned_amount?: number
          updated_at?: string
          year: number
        }
        Update: {
          account_id?: string
          created_at?: string
          department_id?: string | null
          id?: string
          notes?: string | null
          planned_amount?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          assunto: string
          created_at: string
          email: string
          id: string
          lida: boolean
          mensagem: string
          nome: string
          notified: boolean
          respondida: boolean
          updated_at: string
        }
        Insert: {
          assunto: string
          created_at?: string
          email: string
          id?: string
          lida?: boolean
          mensagem: string
          nome: string
          notified?: boolean
          respondida?: boolean
          updated_at?: string
        }
        Update: {
          assunto?: string
          created_at?: string
          email?: string
          id?: string
          lida?: boolean
          mensagem?: string
          nome?: string
          notified?: boolean
          respondida?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      crop_fields: {
        Row: {
          area_ha: number
          created_at: string
          crop_id: string
          expected_harvest: string | null
          field_code: string | null
          id: string
          notes: string | null
          planting_date: string | null
          station_id: string
          status: Database["public"]["Enums"]["crop_field_status"]
          updated_at: string
        }
        Insert: {
          area_ha?: number
          created_at?: string
          crop_id: string
          expected_harvest?: string | null
          field_code?: string | null
          id?: string
          notes?: string | null
          planting_date?: string | null
          station_id: string
          status?: Database["public"]["Enums"]["crop_field_status"]
          updated_at?: string
        }
        Update: {
          area_ha?: number
          created_at?: string
          crop_id?: string
          expected_harvest?: string | null
          field_code?: string | null
          id?: string
          notes?: string | null
          planting_date?: string | null
          station_id?: string
          status?: Database["public"]["Enums"]["crop_field_status"]
          updated_at?: string
        }
        Relationships: []
      }
      crops: {
        Row: {
          created_at: string
          cycle_days: number | null
          id: string
          name: string
          notes: string | null
          scientific_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cycle_days?: number | null
          id?: string
          name: string
          notes?: string | null
          scientific_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cycle_days?: number | null
          id?: string
          name?: string
          notes?: string | null
          scientific_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      dashboard_alert_acks: {
        Row: {
          acknowledged_until: string
          created_at: string
          id: string
          metric_key: string
          user_id: string
        }
        Insert: {
          acknowledged_until: string
          created_at?: string
          id?: string
          metric_key: string
          user_id: string
        }
        Update: {
          acknowledged_until?: string
          created_at?: string
          id?: string
          metric_key?: string
          user_id?: string
        }
        Relationships: []
      }
      dashboard_alert_history: {
        Row: {
          action_notes: string | null
          action_status: string
          assigned_at: string | null
          assigned_department_id: string | null
          assigned_to: string | null
          created_at: string
          id: string
          label: string
          metric_key: string
          resolved_at: string | null
          threshold: number
          tone: string
          user_id: string
          value: number
        }
        Insert: {
          action_notes?: string | null
          action_status?: string
          assigned_at?: string | null
          assigned_department_id?: string | null
          assigned_to?: string | null
          created_at?: string
          id?: string
          label: string
          metric_key: string
          resolved_at?: string | null
          threshold: number
          tone?: string
          user_id: string
          value: number
        }
        Update: {
          action_notes?: string | null
          action_status?: string
          assigned_at?: string | null
          assigned_department_id?: string | null
          assigned_to?: string | null
          created_at?: string
          id?: string
          label?: string
          metric_key?: string
          resolved_at?: string | null
          threshold?: number
          tone?: string
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_id: string | null
          responsible_user_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_id?: string | null
          responsible_user_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          responsible_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      document_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      document_links: {
        Row: {
          created_at: string
          created_by: string | null
          document_id: string
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_id: string
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_id?: string
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_links_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_permissions: {
        Row: {
          can_edit: boolean
          created_at: string
          department_id: string | null
          document_id: string
          id: string
          role: Database["public"]["Enums"]["app_role"] | null
        }
        Insert: {
          can_edit?: boolean
          created_at?: string
          department_id?: string | null
          document_id: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
        }
        Update: {
          can_edit?: boolean
          created_at?: string
          department_id?: string | null
          document_id?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "document_permissions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_permissions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          change_notes: string | null
          created_at: string
          document_id: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          uploaded_by: string
          version_number: number
        }
        Insert: {
          change_notes?: string | null
          created_at?: string
          document_id: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by: string
          version_number: number
        }
        Update: {
          change_notes?: string | null
          created_at?: string
          document_id?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          uploaded_by?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category_id: string | null
          created_at: string
          current_version_id: string | null
          description: string | null
          expiry_date: string | null
          id: string
          owner_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          status: Database["public"]["Enums"]["document_status"]
          tags: string[]
          title: string
          updated_at: string
          visibility: Database["public"]["Enums"]["document_visibility"]
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          current_version_id?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          owner_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          tags?: string[]
          title: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["document_visibility"]
        }
        Update: {
          category_id?: string | null
          created_at?: string
          current_version_id?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          owner_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          tags?: string[]
          title?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["document_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "documents_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "document_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_contracts: {
        Row: {
          contract_type: Database["public"]["Enums"]["contract_type"]
          created_at: string
          created_by: string | null
          currency: string
          department_id: string | null
          employee_id: string
          end_date: string | null
          id: string
          is_active: boolean
          notes: string | null
          position: string
          salary: number
          start_date: string
          updated_at: string
        }
        Insert: {
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          created_by?: string | null
          currency?: string
          department_id?: string | null
          employee_id: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          position: string
          salary?: number
          start_date: string
          updated_at?: string
        }
        Update: {
          contract_type?: Database["public"]["Enums"]["contract_type"]
          created_at?: string
          created_by?: string | null
          currency?: string
          department_id?: string | null
          employee_id?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          position?: string
          salary?: number
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_evaluations: {
        Row: {
          acknowledged_at: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          cycle_id: string
          employee_id: string
          evaluation_date: string | null
          evaluator_id: string | null
          general_comments: string | null
          global_score: number | null
          id: string
          improvements: string | null
          rejection_reason: string | null
          status: string
          strengths: string | null
          submitted_at: string | null
          updated_at: string
          validated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          cycle_id: string
          employee_id: string
          evaluation_date?: string | null
          evaluator_id?: string | null
          general_comments?: string | null
          global_score?: number | null
          id?: string
          improvements?: string | null
          rejection_reason?: string | null
          status?: string
          strengths?: string | null
          submitted_at?: string | null
          updated_at?: string
          validated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          cycle_id?: string
          employee_id?: string
          evaluation_date?: string | null
          evaluator_id?: string | null
          general_comments?: string | null
          global_score?: number | null
          id?: string
          improvements?: string | null
          rejection_reason?: string | null
          status?: string
          strengths?: string | null
          submitted_at?: string | null
          updated_at?: string
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_evaluations_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "evaluation_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_leaves: {
        Row: {
          approved_by: string | null
          created_at: string
          created_by: string | null
          days: number | null
          employee_id: string
          end_date: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          reason: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          days?: number | null
          employee_id: string
          end_date: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          days?: number | null
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          reason?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          updated_at?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          address: string | null
          birth_date: string | null
          created_at: string
          department_id: string | null
          email: string | null
          emergency_contact: string | null
          emergency_phone: string | null
          employee_number: string
          full_name: string
          gender: string | null
          hire_date: string | null
          id: string
          is_active: boolean
          national_id: string | null
          notes: string | null
          phone: string | null
          qualifications: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          employee_number: string
          full_name: string
          gender?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          qualifications?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          created_at?: string
          department_id?: string | null
          email?: string | null
          emergency_contact?: string | null
          emergency_phone?: string | null
          employee_number?: string
          full_name?: string
          gender?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean
          national_id?: string | null
          notes?: string | null
          phone?: string | null
          qualifications?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      evaluation_criteria: {
        Row: {
          created_at: string
          cycle_id: string
          description: string | null
          display_order: number | null
          id: string
          name: string
          weight: number
        }
        Insert: {
          created_at?: string
          cycle_id: string
          description?: string | null
          display_order?: number | null
          id?: string
          name: string
          weight?: number
        }
        Update: {
          created_at?: string
          cycle_id?: string
          description?: string | null
          display_order?: number | null
          id?: string
          name?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_criteria_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "evaluation_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_cycles: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          name: string
          start_date: string
          status: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          name: string
          start_date: string
          status?: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      evaluation_history: {
        Row: {
          action: string
          actor_id: string | null
          changes: Json | null
          comment: string | null
          created_at: string
          evaluation_id: string
          from_status: string | null
          id: string
          to_status: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          changes?: Json | null
          comment?: string | null
          created_at?: string
          evaluation_id: string
          from_status?: string | null
          id?: string
          to_status?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          changes?: Json | null
          comment?: string | null
          created_at?: string
          evaluation_id?: string
          from_status?: string | null
          id?: string
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_history_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "employee_evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluation_scores: {
        Row: {
          comment: string | null
          created_at: string
          criteria_id: string
          evaluation_id: string
          id: string
          score: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          criteria_id: string
          evaluation_id: string
          id?: string
          score: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          criteria_id?: string
          evaluation_id?: string
          id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "evaluation_scores_criteria_id_fkey"
            columns: ["criteria_id"]
            isOneToOne: false
            referencedRelation: "evaluation_criteria"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluation_scores_evaluation_id_fkey"
            columns: ["evaluation_id"]
            isOneToOne: false
            referencedRelation: "employee_evaluations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_accounts: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          type: Database["public"]["Enums"]["financial_account_type"]
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          type: Database["public"]["Enums"]["financial_account_type"]
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: Database["public"]["Enums"]["financial_account_type"]
          updated_at?: string
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          currency: string
          department_id: string | null
          description: string
          id: string
          notes: string | null
          recorded_by: string | null
          reference: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          transaction_date: string
          type: Database["public"]["Enums"]["financial_account_type"]
          updated_at: string
        }
        Insert: {
          account_id: string
          amount?: number
          created_at?: string
          currency?: string
          department_id?: string | null
          description: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_date?: string
          type: Database["public"]["Enums"]["financial_account_type"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          currency?: string
          department_id?: string | null
          description?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          transaction_date?: string
          type?: Database["public"]["Enums"]["financial_account_type"]
          updated_at?: string
        }
        Relationships: []
      }
      harvests: {
        Row: {
          created_at: string
          field_id: string
          harvest_date: string
          id: string
          notes: string | null
          quality_grade: string | null
          quantity: number
          recorded_by: string | null
          unit: string
        }
        Insert: {
          created_at?: string
          field_id: string
          harvest_date?: string
          id?: string
          notes?: string | null
          quality_grade?: string | null
          quantity?: number
          recorded_by?: string | null
          unit?: string
        }
        Update: {
          created_at?: string
          field_id?: string
          harvest_date?: string
          id?: string
          notes?: string | null
          quality_grade?: string | null
          quantity?: number
          recorded_by?: string | null
          unit?: string
        }
        Relationships: []
      }
      hero_slides: {
        Row: {
          created_at: string
          cta_label: string
          cta_link: string
          id: string
          image_path: string | null
          image_url: string | null
          kicker: string
          published: boolean
          sort_order: number
          subtitle: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_label?: string
          cta_link?: string
          id?: string
          image_path?: string | null
          image_url?: string | null
          kicker: string
          published?: boolean
          sort_order?: number
          subtitle: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_label?: string
          cta_link?: string
          id?: string
          image_path?: string | null
          image_url?: string | null
          kicker?: string
          published?: boolean
          sort_order?: number
          subtitle?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ia_centers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          location: string | null
          name: string
          notes: string | null
          responsible_user_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          notes?: string | null
          responsible_user_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          notes?: string | null
          responsible_user_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      insemination_records: {
        Row: {
          animal_id: string
          created_at: string
          dose_id: string | null
          expected_birth_date: string | null
          id: string
          insemination_date: string
          notes: string | null
          pregnancy_confirmed_at: string | null
          result: Database["public"]["Enums"]["insemination_result"]
          technician_id: string | null
          updated_at: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          dose_id?: string | null
          expected_birth_date?: string | null
          id?: string
          insemination_date?: string
          notes?: string | null
          pregnancy_confirmed_at?: string | null
          result?: Database["public"]["Enums"]["insemination_result"]
          technician_id?: string | null
          updated_at?: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          dose_id?: string | null
          expected_birth_date?: string | null
          id?: string
          insemination_date?: string
          notes?: string | null
          pregnancy_confirmed_at?: string | null
          result?: Database["public"]["Enums"]["insemination_result"]
          technician_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lab_analyses: {
        Row: {
          analysis_type: string
          animal_id: string | null
          animal_species: string | null
          client_name: string
          created_at: string
          id: string
          laboratory_id: string
          notes: string | null
          requested_by: string | null
          sample_type: string
          scheduled_date: string
          status: Database["public"]["Enums"]["analysis_status"]
          updated_at: string
        }
        Insert: {
          analysis_type: string
          animal_id?: string | null
          animal_species?: string | null
          client_name: string
          created_at?: string
          id?: string
          laboratory_id: string
          notes?: string | null
          requested_by?: string | null
          sample_type: string
          scheduled_date: string
          status?: Database["public"]["Enums"]["analysis_status"]
          updated_at?: string
        }
        Update: {
          analysis_type?: string
          animal_id?: string | null
          animal_species?: string | null
          client_name?: string
          created_at?: string
          id?: string
          laboratory_id?: string
          notes?: string | null
          requested_by?: string | null
          sample_type?: string
          scheduled_date?: string
          status?: Database["public"]["Enums"]["analysis_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_analyses_laboratory_id_fkey"
            columns: ["laboratory_id"]
            isOneToOne: false
            referencedRelation: "laboratories"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_results: {
        Row: {
          analysis_id: string
          concluded_at: string
          concluded_by: string | null
          created_at: string
          id: string
          result_details: Json | null
          result_text: string
        }
        Insert: {
          analysis_id: string
          concluded_at?: string
          concluded_by?: string | null
          created_at?: string
          id?: string
          result_details?: Json | null
          result_text: string
        }
        Update: {
          analysis_id?: string
          concluded_at?: string
          concluded_by?: string | null
          created_at?: string
          id?: string
          result_details?: Json | null
          result_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: true
            referencedRelation: "lab_analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      lab_supplies: {
        Row: {
          created_at: string
          expiry_date: string | null
          id: string
          laboratory_id: string
          min_stock: number
          name: string
          quantity: number
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          laboratory_id: string
          min_stock?: number
          name: string
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expiry_date?: string | null
          id?: string
          laboratory_id?: string
          min_stock?: number
          name?: string
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_supplies_laboratory_id_fkey"
            columns: ["laboratory_id"]
            isOneToOne: false
            referencedRelation: "laboratories"
            referencedColumns: ["id"]
          },
        ]
      }
      laboratories: {
        Row: {
          created_at: string
          department_id: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "laboratories_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      legislation: {
        Row: {
          ano: string
          created_at: string
          descricao: string | null
          id: string
          num: string
          pdf_path: string | null
          published: boolean
          slug: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          ano: string
          created_at?: string
          descricao?: string | null
          id?: string
          num: string
          pdf_path?: string | null
          published?: boolean
          slug: string
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          ano?: string
          created_at?: string
          descricao?: string | null
          id?: string
          num?: string
          pdf_path?: string | null
          published?: boolean
          slug?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      livestock_production: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          product_type: string
          production_date: string
          quantity: number
          recorded_by: string | null
          station_id: string
          unit: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          product_type: string
          production_date?: string
          quantity?: number
          recorded_by?: string | null
          station_id: string
          unit?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          product_type?: string
          production_date?: string
          quantity?: number
          recorded_by?: string | null
          station_id?: string
          unit?: string
        }
        Relationships: []
      }
      mission_expenses: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["mission_expense_category"]
          created_at: string
          currency: string
          description: string
          expense_date: string
          id: string
          mission_id: string
          receipt_url: string | null
          recorded_by: string | null
        }
        Insert: {
          amount?: number
          category?: Database["public"]["Enums"]["mission_expense_category"]
          created_at?: string
          currency?: string
          description: string
          expense_date?: string
          id?: string
          mission_id: string
          receipt_url?: string | null
          recorded_by?: string | null
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["mission_expense_category"]
          created_at?: string
          currency?: string
          description?: string
          expense_date?: string
          id?: string
          mission_id?: string
          receipt_url?: string | null
          recorded_by?: string | null
        }
        Relationships: []
      }
      mission_guides: {
        Row: {
          created_at: string
          guide_number: string
          id: string
          issue_date: string
          issued_by: string | null
          mission_id: string
          notes: string | null
          per_diem: number | null
          transport: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          guide_number: string
          id?: string
          issue_date?: string
          issued_by?: string | null
          mission_id: string
          notes?: string | null
          per_diem?: number | null
          transport?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          guide_number?: string
          id?: string
          issue_date?: string
          issued_by?: string | null
          mission_id?: string
          notes?: string | null
          per_diem?: number | null
          transport?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_guides_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      mission_participants: {
        Row: {
          created_at: string
          id: string
          mission_id: string
          per_diem: number
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mission_id: string
          per_diem?: number
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mission_id?: string
          per_diem?: number
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mission_reports: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          attachments_url: string | null
          created_at: string
          id: string
          mission_id: string
          outcomes: string | null
          report_date: string
          report_url: string | null
          status: string
          submitted_by: string | null
          summary: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          attachments_url?: string | null
          created_at?: string
          id?: string
          mission_id: string
          outcomes?: string | null
          report_date?: string
          report_url?: string | null
          status?: string
          submitted_by?: string | null
          summary: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          attachments_url?: string | null
          created_at?: string
          id?: string
          mission_id?: string
          outcomes?: string | null
          report_date?: string
          report_url?: string | null
          status?: string
          submitted_by?: string | null
          summary?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mission_reports_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
      }
      missions: {
        Row: {
          budget: number
          created_at: string
          created_by: string | null
          currency: string
          department_id: string | null
          destination: string
          end_date: string
          id: string
          notes: string | null
          purpose: string | null
          start_date: string
          status: Database["public"]["Enums"]["mission_status"]
          title: string
          updated_at: string
        }
        Insert: {
          budget?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          department_id?: string | null
          destination: string
          end_date: string
          id?: string
          notes?: string | null
          purpose?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["mission_status"]
          title: string
          updated_at?: string
        }
        Update: {
          budget?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          department_id?: string | null
          destination?: string
          end_date?: string
          id?: string
          notes?: string | null
          purpose?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["mission_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      nitrogen_tanks: {
        Row: {
          capacity_l: number
          center_id: string
          code: string
          created_at: string
          current_level_l: number
          id: string
          last_refill_date: string | null
          min_level_l: number
          notes: string | null
          updated_at: string
        }
        Insert: {
          capacity_l?: number
          center_id: string
          code: string
          created_at?: string
          current_level_l?: number
          id?: string
          last_refill_date?: string | null
          min_level_l?: number
          notes?: string | null
          updated_at?: string
        }
        Update: {
          capacity_l?: number
          center_id?: string
          code?: string
          created_at?: string
          current_level_l?: number
          id?: string
          last_refill_date?: string | null
          min_level_l?: number
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      nonconformities: {
        Row: {
          audit_id: string | null
          corrective_action: string | null
          created_at: string
          deadline: string | null
          department_id: string | null
          description: string
          id: string
          reported_by: string | null
          resolved_at: string | null
          severity: Database["public"]["Enums"]["nonconformity_severity"]
          status: Database["public"]["Enums"]["nonconformity_status"]
          title: string
          updated_at: string
        }
        Insert: {
          audit_id?: string | null
          corrective_action?: string | null
          created_at?: string
          deadline?: string | null
          department_id?: string | null
          description: string
          id?: string
          reported_by?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["nonconformity_severity"]
          status?: Database["public"]["Enums"]["nonconformity_status"]
          title: string
          updated_at?: string
        }
        Update: {
          audit_id?: string | null
          corrective_action?: string | null
          created_at?: string
          deadline?: string | null
          department_id?: string | null
          description?: string
          id?: string
          reported_by?: string | null
          resolved_at?: string | null
          severity?: Database["public"]["Enums"]["nonconformity_severity"]
          status?: Database["public"]["Enums"]["nonconformity_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nonconformities_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "quality_audits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nonconformities_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      noticias: {
        Row: {
          author_id: string | null
          categoria: string
          conteudo: string | null
          created_at: string
          destaque: boolean
          id: string
          image_path: string | null
          published: boolean
          published_at: string | null
          resumo: string | null
          slug: string
          titulo: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          categoria?: string
          conteudo?: string | null
          created_at?: string
          destaque?: boolean
          id?: string
          image_path?: string | null
          published?: boolean
          published_at?: string | null
          resumo?: string | null
          slug: string
          titulo: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          categoria?: string
          conteudo?: string | null
          created_at?: string
          destaque?: boolean
          id?: string
          image_path?: string | null
          published?: boolean
          published_at?: string | null
          resumo?: string | null
          slug?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      process_attachments: {
        Row: {
          created_at: string
          document_id: string | null
          file_path: string | null
          id: string
          label: string
          process_id: string
          step_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          file_path?: string | null
          id?: string
          label: string
          process_id: string
          step_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string | null
          file_path?: string | null
          id?: string
          label?: string
          process_id?: string
          step_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_attachments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_attachments_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_attachments_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "process_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      process_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: Database["public"]["Enums"]["process_event_type"]
          id: string
          payload: Json | null
          process_id: string
          step_id: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: Database["public"]["Enums"]["process_event_type"]
          id?: string
          payload?: Json | null
          process_id: string
          step_id?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: Database["public"]["Enums"]["process_event_type"]
          id?: string
          payload?: Json | null
          process_id?: string
          step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_events_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_events_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "process_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      process_steps: {
        Row: {
          assignee_role: Database["public"]["Enums"]["app_role"] | null
          assignee_user_id: string | null
          completed_at: string | null
          created_at: string
          due_at: string | null
          id: string
          name: string
          notes: string | null
          order_index: number
          process_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["process_step_status"]
          type_step_id: string | null
        }
        Insert: {
          assignee_role?: Database["public"]["Enums"]["app_role"] | null
          assignee_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          name: string
          notes?: string | null
          order_index: number
          process_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["process_step_status"]
          type_step_id?: string | null
        }
        Update: {
          assignee_role?: Database["public"]["Enums"]["app_role"] | null
          assignee_user_id?: string | null
          completed_at?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          order_index?: number
          process_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["process_step_status"]
          type_step_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_steps_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_steps_type_step_id_fkey"
            columns: ["type_step_id"]
            isOneToOne: false
            referencedRelation: "process_type_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      process_type_steps: {
        Row: {
          created_at: string
          default_role: Database["public"]["Enums"]["app_role"] | null
          id: string
          name: string
          order_index: number
          process_type_id: string
          sla_days: number | null
        }
        Insert: {
          created_at?: string
          default_role?: Database["public"]["Enums"]["app_role"] | null
          id?: string
          name: string
          order_index: number
          process_type_id: string
          sla_days?: number | null
        }
        Update: {
          created_at?: string
          default_role?: Database["public"]["Enums"]["app_role"] | null
          id?: string
          name?: string
          order_index?: number
          process_type_id?: string
          sla_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "process_type_steps_process_type_id_fkey"
            columns: ["process_type_id"]
            isOneToOne: false
            referencedRelation: "process_types"
            referencedColumns: ["id"]
          },
        ]
      }
      process_types: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          sla_days: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          sla_days?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sla_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      processes: {
        Row: {
          closed_at: string | null
          code: string
          created_at: string
          current_step_id: string | null
          description: string | null
          due_date: string | null
          id: string
          linked_entity_id: string | null
          linked_entity_type: string | null
          mission_id: string | null
          opened_at: string
          priority: Database["public"]["Enums"]["process_priority"]
          requester_id: string
          status: Database["public"]["Enums"]["process_status"]
          title: string
          type_id: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          code: string
          created_at?: string
          current_step_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          mission_id?: string | null
          opened_at?: string
          priority?: Database["public"]["Enums"]["process_priority"]
          requester_id: string
          status?: Database["public"]["Enums"]["process_status"]
          title: string
          type_id: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          code?: string
          created_at?: string
          current_step_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          linked_entity_id?: string | null
          linked_entity_type?: string | null
          mission_id?: string | null
          opened_at?: string
          priority?: Database["public"]["Enums"]["process_priority"]
          requester_id?: string
          status?: Database["public"]["Enums"]["process_status"]
          title?: string
          type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processes_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processes_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "process_types"
            referencedColumns: ["id"]
          },
        ]
      }
      production_batches: {
        Row: {
          batch_number: string
          created_at: string
          expiry_date: string
          id: string
          notes: string | null
          produced_by: string | null
          product_id: string
          production_date: string
          quantity_distributed: number
          quantity_produced: number
          status: Database["public"]["Enums"]["production_status"]
          updated_at: string
        }
        Insert: {
          batch_number: string
          created_at?: string
          expiry_date: string
          id?: string
          notes?: string | null
          produced_by?: string | null
          product_id: string
          production_date: string
          quantity_distributed?: number
          quantity_produced?: number
          status?: Database["public"]["Enums"]["production_status"]
          updated_at?: string
        }
        Update: {
          batch_number?: string
          created_at?: string
          expiry_date?: string
          id?: string
          notes?: string | null
          produced_by?: string | null
          product_id?: string
          production_date?: string
          quantity_distributed?: number
          quantity_produced?: number
          status?: Database["public"]["Enums"]["production_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_batches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      production_plans: {
        Row: {
          actual_quantity: number | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          planned_end: string
          planned_quantity: number
          planned_start: string
          product_id: string
          status: Database["public"]["Enums"]["production_status"]
          updated_at: string
        }
        Insert: {
          actual_quantity?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          planned_end: string
          planned_quantity: number
          planned_start: string
          product_id: string
          status?: Database["public"]["Enums"]["production_status"]
          updated_at?: string
        }
        Update: {
          actual_quantity?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          planned_end?: string
          planned_quantity?: number
          planned_start?: string
          product_id?: string
          status?: Database["public"]["Enums"]["production_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_plans_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          product_type: string
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          product_type: string
          unit?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          product_type?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          joined_at: string | null
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string | null
          project_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string | null
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "research_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      publications: {
        Row: {
          abstract: string | null
          authors: Json
          created_at: string
          created_by: string | null
          doi: string | null
          id: string
          project_id: string | null
          title: string
          type: string
          updated_at: string
          url: string | null
          venue: string | null
          year: number | null
        }
        Insert: {
          abstract?: string | null
          authors?: Json
          created_at?: string
          created_by?: string | null
          doi?: string | null
          id?: string
          project_id?: string | null
          title: string
          type?: string
          updated_at?: string
          url?: string | null
          venue?: string | null
          year?: number | null
        }
        Update: {
          abstract?: string | null
          authors?: Json
          created_at?: string
          created_by?: string | null
          doi?: string | null
          id?: string
          project_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
          venue?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "publications_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "research_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      quality_audits: {
        Row: {
          audit_type: string
          auditor: string
          completed_date: string | null
          created_at: string
          created_by: string | null
          department_id: string | null
          findings: string | null
          id: string
          laboratory_id: string | null
          recommendations: string | null
          scheduled_date: string
          status: Database["public"]["Enums"]["audit_status"]
          title: string
          updated_at: string
        }
        Insert: {
          audit_type: string
          auditor: string
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          findings?: string | null
          id?: string
          laboratory_id?: string | null
          recommendations?: string | null
          scheduled_date: string
          status?: Database["public"]["Enums"]["audit_status"]
          title: string
          updated_at?: string
        }
        Update: {
          audit_type?: string
          auditor?: string
          completed_date?: string | null
          created_at?: string
          created_by?: string | null
          department_id?: string | null
          findings?: string | null
          id?: string
          laboratory_id?: string | null
          recommendations?: string | null
          scheduled_date?: string
          status?: Database["public"]["Enums"]["audit_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quality_audits_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quality_audits_laboratory_id_fkey"
            columns: ["laboratory_id"]
            isOneToOne: false
            referencedRelation: "laboratories"
            referencedColumns: ["id"]
          },
        ]
      }
      research_lines: {
        Row: {
          area: string | null
          coordinator_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          coordinator_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          coordinator_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      research_projects: {
        Row: {
          created_at: string
          created_by: string | null
          end_date: string | null
          funding_amount: number | null
          funding_source: string | null
          id: string
          line_id: string | null
          objectives: string | null
          partners: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          funding_amount?: number | null
          funding_source?: string | null
          id?: string
          line_id?: string | null
          objectives?: string | null
          partners?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          funding_amount?: number | null
          funding_source?: string | null
          id?: string
          line_id?: string | null
          objectives?: string | null
          partners?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "research_projects_line_id_fkey"
            columns: ["line_id"]
            isOneToOne: false
            referencedRelation: "research_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          can_view: boolean
          can_write: boolean
          module: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          can_view?: boolean
          can_write?: boolean
          module: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          can_view?: boolean
          can_write?: boolean
          module?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      semen_doses: {
        Row: {
          available_quantity: number
          breeder_id: string
          collection_date: string
          created_at: string
          id: string
          notes: string | null
          quality_grade: Database["public"]["Enums"]["semen_quality"] | null
          quantity: number
          tank_id: string | null
          updated_at: string
        }
        Insert: {
          available_quantity?: number
          breeder_id: string
          collection_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          quality_grade?: Database["public"]["Enums"]["semen_quality"] | null
          quantity?: number
          tank_id?: string | null
          updated_at?: string
        }
        Update: {
          available_quantity?: number
          breeder_id?: string
          collection_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          quality_grade?: Database["public"]["Enums"]["semen_quality"] | null
          quantity?: number
          tank_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          location: string | null
          name: string
          responsible_user_id: string | null
          station_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          responsible_user_id?: string | null
          station_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          responsible_user_id?: string | null
          station_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_items: {
        Row: {
          category: Database["public"]["Enums"]["stock_category"]
          created_at: string
          expiry_date: string | null
          id: string
          location_id: string | null
          min_stock: number
          name: string
          notes: string | null
          quantity: number
          sku: string | null
          supplier: string | null
          unit: string
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["stock_category"]
          created_at?: string
          expiry_date?: string | null
          id?: string
          location_id?: string | null
          min_stock?: number
          name: string
          notes?: string | null
          quantity?: number
          sku?: string | null
          supplier?: string | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["stock_category"]
          created_at?: string
          expiry_date?: string | null
          id?: string
          location_id?: string | null
          min_stock?: number
          name?: string
          notes?: string | null
          quantity?: number
          sku?: string | null
          supplier?: string | null
          unit?: string
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_locations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          laboratory_id: string | null
          name: string
          station_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          laboratory_id?: string | null
          name: string
          station_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          laboratory_id?: string | null
          name?: string
          station_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          from_location_id: string | null
          id: string
          item_id: string
          movement_date: string
          performed_by: string | null
          quantity: number
          reason: string | null
          to_location_id: string | null
          type: Database["public"]["Enums"]["stock_movement_type"]
        }
        Insert: {
          created_at?: string
          from_location_id?: string | null
          id?: string
          item_id: string
          movement_date?: string
          performed_by?: string | null
          quantity: number
          reason?: string | null
          to_location_id?: string | null
          type: Database["public"]["Enums"]["stock_movement_type"]
        }
        Update: {
          created_at?: string
          from_location_id?: string | null
          id?: string
          item_id?: string
          movement_date?: string
          performed_by?: string | null
          quantity?: number
          reason?: string | null
          to_location_id?: string | null
          type?: Database["public"]["Enums"]["stock_movement_type"]
        }
        Relationships: []
      }
      training_participants: {
        Row: {
          certificate_url: string | null
          completed: boolean
          created_at: string
          id: string
          score: number | null
          training_id: string
          user_id: string
        }
        Insert: {
          certificate_url?: string | null
          completed?: boolean
          created_at?: string
          id?: string
          score?: number | null
          training_id: string
          user_id: string
        }
        Update: {
          certificate_url?: string | null
          completed?: boolean
          created_at?: string
          id?: string
          score?: number | null
          training_id?: string
          user_id?: string
        }
        Relationships: []
      }
      trainings: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          hours: number
          id: string
          location: string | null
          notes: string | null
          start_date: string
          status: Database["public"]["Enums"]["training_status"]
          title: string
          trainer: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          hours?: number
          id?: string
          location?: string | null
          notes?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["training_status"]
          title: string
          trainer?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          hours?: number
          id?: string
          location?: string | null
          notes?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["training_status"]
          title?: string
          trainer?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_dashboard_prefs: {
        Row: {
          charts: string[]
          created_at: string
          kpis: string[]
          thresholds: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          charts?: string[]
          created_at?: string
          kpis?: string[]
          thresholds?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          charts?: string[]
          created_at?: string
          kpis?: string[]
          thresholds?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_departments: {
        Row: {
          created_at: string
          department_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_departments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
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
      admin_list_profiles: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          full_name: string
          id: string
          phone: string
          updated_at: string
          user_id: string
        }[]
      }
      can_edit_document: {
        Args: { _doc_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_document: {
        Args: { _doc_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_documents_object: { Args: { _name: string }; Returns: boolean }
      get_my_profile: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          full_name: string
          id: string
          phone: string
          updated_at: string
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
      is_admin: { Args: never; Returns: boolean }
      is_process_actor: {
        Args: { _process_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      analysis_status: "agendada" | "em_progresso" | "concluida" | "cancelada"
      animal_event_type:
        | "nascimento"
        | "pesagem"
        | "vacinacao"
        | "tratamento"
        | "transferencia"
        | "venda"
        | "morte"
        | "abate"
        | "observacao"
      animal_sex: "macho" | "femea"
      animal_status: "activo" | "vendido" | "morto" | "abatido" | "transferido"
      app_role: "admin" | "tecnico" | "gestor" | "diretor" | "colaborador"
      asset_status:
        | "activo"
        | "em_manutencao"
        | "avariado"
        | "abatido"
        | "reservado"
      audit_status: "planeada" | "em_curso" | "concluida" | "cancelada"
      breeder_status: "activo" | "inactivo" | "baixado"
      contract_type:
        | "efectivo"
        | "termo_certo"
        | "termo_incerto"
        | "prestacao_servicos"
        | "estagio"
      crop_field_status:
        | "planeado"
        | "plantado"
        | "em_crescimento"
        | "colhido"
        | "abandonado"
      document_status:
        | "rascunho"
        | "submetido"
        | "aprovado"
        | "rejeitado"
        | "arquivado"
      document_visibility: "publico" | "departamento" | "privado"
      financial_account_type: "receita" | "despesa"
      insemination_result: "pendente" | "confirmada" | "falhou"
      leave_status: "pendente" | "aprovada" | "rejeitada" | "concluida"
      leave_type:
        | "ferias"
        | "doenca"
        | "maternidade"
        | "paternidade"
        | "luto"
        | "sem_vencimento"
        | "outro"
      maintenance_type: "preventiva" | "correctiva" | "inspeccao" | "calibracao"
      mission_expense_category:
        | "transporte"
        | "alojamento"
        | "alimentacao"
        | "combustivel"
        | "outro"
      mission_status:
        | "planeada"
        | "submetida"
        | "aprovada"
        | "em_curso"
        | "concluida"
        | "cancelada"
      nonconformity_severity: "menor" | "maior" | "critica"
      nonconformity_status:
        | "aberta"
        | "em_resolucao"
        | "resolvida"
        | "encerrada"
      notification_type: "info" | "sucesso" | "aviso" | "erro"
      process_event_type:
        | "aberto"
        | "atribuido"
        | "avancado"
        | "devolvido"
        | "comentario"
        | "anexo"
        | "fechado"
        | "cancelado"
      process_priority: "baixa" | "normal" | "alta" | "urgente"
      process_status: "aberto" | "em_curso" | "concluido" | "cancelado"
      process_step_status: "pendente" | "em_curso" | "concluida" | "devolvida"
      production_status: "planeada" | "em_producao" | "concluida" | "suspensa"
      semen_quality: "A" | "B" | "C"
      stock_category:
        | "laboratorio"
        | "vacinas"
        | "agricola"
        | "pecuaria"
        | "administrativo"
        | "semen"
        | "combustivel"
      stock_movement_type: "entrada" | "saida" | "transferencia" | "ajuste"
      training_status: "planeada" | "em_curso" | "concluida" | "cancelada"
      transaction_status: "pendente" | "pago" | "cancelado"
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
      analysis_status: ["agendada", "em_progresso", "concluida", "cancelada"],
      animal_event_type: [
        "nascimento",
        "pesagem",
        "vacinacao",
        "tratamento",
        "transferencia",
        "venda",
        "morte",
        "abate",
        "observacao",
      ],
      animal_sex: ["macho", "femea"],
      animal_status: ["activo", "vendido", "morto", "abatido", "transferido"],
      app_role: ["admin", "tecnico", "gestor", "diretor", "colaborador"],
      asset_status: [
        "activo",
        "em_manutencao",
        "avariado",
        "abatido",
        "reservado",
      ],
      audit_status: ["planeada", "em_curso", "concluida", "cancelada"],
      breeder_status: ["activo", "inactivo", "baixado"],
      contract_type: [
        "efectivo",
        "termo_certo",
        "termo_incerto",
        "prestacao_servicos",
        "estagio",
      ],
      crop_field_status: [
        "planeado",
        "plantado",
        "em_crescimento",
        "colhido",
        "abandonado",
      ],
      document_status: [
        "rascunho",
        "submetido",
        "aprovado",
        "rejeitado",
        "arquivado",
      ],
      document_visibility: ["publico", "departamento", "privado"],
      financial_account_type: ["receita", "despesa"],
      insemination_result: ["pendente", "confirmada", "falhou"],
      leave_status: ["pendente", "aprovada", "rejeitada", "concluida"],
      leave_type: [
        "ferias",
        "doenca",
        "maternidade",
        "paternidade",
        "luto",
        "sem_vencimento",
        "outro",
      ],
      maintenance_type: ["preventiva", "correctiva", "inspeccao", "calibracao"],
      mission_expense_category: [
        "transporte",
        "alojamento",
        "alimentacao",
        "combustivel",
        "outro",
      ],
      mission_status: [
        "planeada",
        "submetida",
        "aprovada",
        "em_curso",
        "concluida",
        "cancelada",
      ],
      nonconformity_severity: ["menor", "maior", "critica"],
      nonconformity_status: [
        "aberta",
        "em_resolucao",
        "resolvida",
        "encerrada",
      ],
      notification_type: ["info", "sucesso", "aviso", "erro"],
      process_event_type: [
        "aberto",
        "atribuido",
        "avancado",
        "devolvido",
        "comentario",
        "anexo",
        "fechado",
        "cancelado",
      ],
      process_priority: ["baixa", "normal", "alta", "urgente"],
      process_status: ["aberto", "em_curso", "concluido", "cancelado"],
      process_step_status: ["pendente", "em_curso", "concluida", "devolvida"],
      production_status: ["planeada", "em_producao", "concluida", "suspensa"],
      semen_quality: ["A", "B", "C"],
      stock_category: [
        "laboratorio",
        "vacinas",
        "agricola",
        "pecuaria",
        "administrativo",
        "semen",
        "combustivel",
      ],
      stock_movement_type: ["entrada", "saida", "transferencia", "ajuste"],
      training_status: ["planeada", "em_curso", "concluida", "cancelada"],
      transaction_status: ["pendente", "pago", "cancelado"],
    },
  },
} as const
