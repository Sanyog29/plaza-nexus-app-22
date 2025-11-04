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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      access_logs: {
        Row: {
          access_method: string
          access_point_id: string | null
          access_type: string
          card_id: string | null
          created_at: string
          failure_reason: string | null
          floor: string | null
          id: string
          location: string
          metadata: Json | null
          property_id: string | null
          success: boolean
          timestamp: string
          user_id: string | null
          visitor_id: string | null
          zone: string | null
        }
        Insert: {
          access_method: string
          access_point_id?: string | null
          access_type: string
          card_id?: string | null
          created_at?: string
          failure_reason?: string | null
          floor?: string | null
          id?: string
          location: string
          metadata?: Json | null
          property_id?: string | null
          success: boolean
          timestamp?: string
          user_id?: string | null
          visitor_id?: string | null
          zone?: string | null
        }
        Update: {
          access_method?: string
          access_point_id?: string | null
          access_type?: string
          card_id?: string | null
          created_at?: string
          failure_reason?: string | null
          floor?: string | null
          id?: string
          location?: string
          metadata?: Json | null
          property_id?: string | null
          success?: boolean
          timestamp?: string
          user_id?: string | null
          visitor_id?: string | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_logs_access_point_id_fkey"
            columns: ["access_point_id"]
            isOneToOne: false
            referencedRelation: "access_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_logs_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      access_points: {
        Row: {
          configuration: Json | null
          created_at: string
          device_id: string | null
          device_type: string
          firmware_version: string | null
          floor: string
          id: string
          ip_address: unknown
          is_active: boolean
          last_ping: string | null
          location: string
          name: string
          status: string
          updated_at: string
          zone: string | null
        }
        Insert: {
          configuration?: Json | null
          created_at?: string
          device_id?: string | null
          device_type?: string
          firmware_version?: string | null
          floor: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_ping?: string | null
          location: string
          name: string
          status?: string
          updated_at?: string
          zone?: string | null
        }
        Update: {
          configuration?: Json | null
          created_at?: string
          device_id?: string | null
          device_type?: string
          firmware_version?: string | null
          floor?: string
          id?: string
          ip_address?: unknown
          is_active?: boolean
          last_ping?: string | null
          location?: string
          name?: string
          status?: string
          updated_at?: string
          zone?: string | null
        }
        Relationships: []
      }
      ai_models: {
        Row: {
          accuracy_score: number | null
          created_at: string
          id: string
          is_active: boolean
          last_trained_at: string | null
          model_config: Json
          model_name: string
          model_type: string
          updated_at: string
          version: string
        }
        Insert: {
          accuracy_score?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_trained_at?: string | null
          model_config?: Json
          model_name: string
          model_type: string
          updated_at?: string
          version?: string
        }
        Update: {
          accuracy_score?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_trained_at?: string | null
          model_config?: Json
          model_name?: string
          model_type?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      alerts: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string
          severity: string
          title: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          severity?: string
          title: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          severity?: string
          title?: string
        }
        Relationships: []
      }
      amc_alerts: {
        Row: {
          alert_date: string
          alert_type: string
          asset_id: string
          created_at: string
          due_date: string
          id: string
          is_resolved: boolean
          is_sent: boolean
          notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          updated_at: string
        }
        Insert: {
          alert_date: string
          alert_type: string
          asset_id: string
          created_at?: string
          due_date: string
          id?: string
          is_resolved?: boolean
          is_sent?: boolean
          notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string
        }
        Update: {
          alert_date?: string
          alert_type?: string
          asset_id?: string
          created_at?: string
          due_date?: string
          id?: string
          is_resolved?: boolean
          is_sent?: boolean
          notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "amc_alerts_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amc_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amc_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amc_alerts_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_summaries: {
        Row: {
          calculated_at: string
          id: string
          metric_category: string
          metric_data: Json
          summary_date: string
          summary_type: string
        }
        Insert: {
          calculated_at?: string
          id?: string
          metric_category: string
          metric_data?: Json
          summary_date: string
          summary_type: string
        }
        Update: {
          calculated_at?: string
          id?: string
          metric_category?: string
          metric_data?: Json
          summary_date?: string
          summary_type?: string
        }
        Relationships: []
      }
      assets: {
        Row: {
          amc_contract_number: string | null
          amc_cost: number | null
          amc_end_date: string | null
          amc_start_date: string | null
          amc_vendor: string | null
          asset_name: string
          asset_type: string
          brand: string | null
          created_at: string
          floor: string
          id: string
          installation_date: string | null
          last_service_date: string | null
          location: string
          model_number: string | null
          next_service_due: string | null
          notes: string | null
          photo_urls: string[] | null
          property_id: string | null
          purchase_date: string | null
          serial_number: string | null
          service_frequency_months: number | null
          status: string
          updated_at: string
          warranty_expiry: string | null
          zone: string | null
        }
        Insert: {
          amc_contract_number?: string | null
          amc_cost?: number | null
          amc_end_date?: string | null
          amc_start_date?: string | null
          amc_vendor?: string | null
          asset_name: string
          asset_type: string
          brand?: string | null
          created_at?: string
          floor: string
          id?: string
          installation_date?: string | null
          last_service_date?: string | null
          location: string
          model_number?: string | null
          next_service_due?: string | null
          notes?: string | null
          photo_urls?: string[] | null
          property_id?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          service_frequency_months?: number | null
          status?: string
          updated_at?: string
          warranty_expiry?: string | null
          zone?: string | null
        }
        Update: {
          amc_contract_number?: string | null
          amc_cost?: number | null
          amc_end_date?: string | null
          amc_start_date?: string | null
          amc_vendor?: string | null
          asset_name?: string
          asset_type?: string
          brand?: string | null
          created_at?: string
          floor?: string
          id?: string
          installation_date?: string | null
          last_service_date?: string | null
          location?: string
          model_number?: string | null
          next_service_due?: string | null
          notes?: string | null
          photo_urls?: string[] | null
          property_id?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          service_frequency_months?: number | null
          status?: string
          updated_at?: string
          warranty_expiry?: string | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      automated_reports: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          last_generated: string | null
          next_generation: string | null
          recipients: Json | null
          report_name: string
          report_type: string
          schedule_config: Json
          template_config: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_generated?: string | null
          next_generation?: string | null
          recipients?: Json | null
          report_name: string
          report_type: string
          schedule_config: Json
          template_config?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          last_generated?: string | null
          next_generation?: string | null
          recipients?: Json | null
          report_name?: string
          report_type?: string
          schedule_config?: Json
          template_config?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          actions: Json
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          priority: number
          rule_name: string
          rule_type: string
          trigger_conditions: Json
          updated_at: string
        }
        Insert: {
          actions: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          rule_name: string
          rule_type: string
          trigger_conditions: Json
          updated_at?: string
        }
        Update: {
          actions?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          priority?: number
          rule_name?: string
          rule_type?: string
          trigger_conditions?: Json
          updated_at?: string
        }
        Relationships: []
      }
      bill_auditor_roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          permissions: Json | null
          role_code: string
          role_name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          permissions?: Json | null
          role_code: string
          role_name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          permissions?: Json | null
          role_code?: string
          role_name?: string
        }
        Relationships: []
      }
      booking_templates: {
        Row: {
          buffer_time_minutes: number | null
          capacity_needed: number | null
          created_at: string
          description: string | null
          duration_minutes: number
          equipment_needed: Json | null
          id: string
          room_type_preference: string | null
          template_name: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          buffer_time_minutes?: number | null
          capacity_needed?: number | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          equipment_needed?: Json | null
          id?: string
          room_type_preference?: string | null
          template_name: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          buffer_time_minutes?: number | null
          capacity_needed?: number | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          equipment_needed?: Json | null
          id?: string
          room_type_preference?: string | null
          template_name?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      broadcasts: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          importance: string | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          importance?: string | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          importance?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcasts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcasts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcasts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_allocations: {
        Row: {
          allocated_amount: number
          allocation_month: string
          category: string
          cost_center_id: string
          created_at: string
          id: string
          spent_amount: number | null
          updated_at: string
        }
        Insert: {
          allocated_amount: number
          allocation_month: string
          category: string
          cost_center_id: string
          created_at?: string
          id?: string
          spent_amount?: number | null
          updated_at?: string
        }
        Update: {
          allocated_amount?: number
          allocation_month?: string
          category?: string
          cost_center_id?: string
          created_at?: string
          id?: string
          spent_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_allocations_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      building_areas: {
        Row: {
          coordinates: Json | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          zone_type: string | null
        }
        Insert: {
          coordinates?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          zone_type?: string | null
        }
        Update: {
          coordinates?: Json | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          zone_type?: string | null
        }
        Relationships: []
      }
      building_floors: {
        Row: {
          created_at: string | null
          description: string | null
          floor_number: number | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          floor_number?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          floor_number?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      bulk_user_uploads: {
        Row: {
          completed_at: string | null
          created_at: string
          error_summary: Json | null
          failed_records: number
          filename: string
          id: string
          success_summary: Json | null
          successful_records: number
          total_records: number
          upload_status: string
          uploaded_by: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_summary?: Json | null
          failed_records?: number
          filename: string
          id?: string
          success_summary?: Json | null
          successful_records?: number
          total_records?: number
          upload_status?: string
          uploaded_by: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_summary?: Json | null
          failed_records?: number
          filename?: string
          id?: string
          success_summary?: Json | null
          successful_records?: number
          total_records?: number
          upload_status?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_uploaded_by"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_uploaded_by"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_uploaded_by"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      cafeteria_menu_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          name: string
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          name: string
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          name?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cafeteria_menu_categories_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      cafeteria_menu_items: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean | null
          is_vegan: boolean | null
          is_vegetarian: boolean | null
          name: string
          price: number
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          name: string
          price: number
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean | null
          is_vegan?: boolean | null
          is_vegetarian?: boolean | null
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "cafeteria_menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cafeteria_menu_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      cafeteria_orders: {
        Row: {
          bill_number: string | null
          commission_amount: number | null
          created_at: string
          created_by: string | null
          customer_instructions: string | null
          discount_applied: number | null
          feedback_submitted_at: string | null
          feedback_text: string | null
          id: string
          is_scheduled: boolean | null
          kot_sent_at: string | null
          offer_code_used: string | null
          order_channel: string | null
          order_type: string | null
          paid_at: string | null
          payment_status: string | null
          pickup_time: string
          preparation_time_minutes: number | null
          property_id: string | null
          rating: number | null
          scheduled_pickup_time: string | null
          service_type: string | null
          status: string
          table_number: string | null
          total_amount: number
          updated_at: string
          user_id: string
          vendor_id: string | null
          vendor_payout_amount: number | null
        }
        Insert: {
          bill_number?: string | null
          commission_amount?: number | null
          created_at?: string
          created_by?: string | null
          customer_instructions?: string | null
          discount_applied?: number | null
          feedback_submitted_at?: string | null
          feedback_text?: string | null
          id?: string
          is_scheduled?: boolean | null
          kot_sent_at?: string | null
          offer_code_used?: string | null
          order_channel?: string | null
          order_type?: string | null
          paid_at?: string | null
          payment_status?: string | null
          pickup_time: string
          preparation_time_minutes?: number | null
          property_id?: string | null
          rating?: number | null
          scheduled_pickup_time?: string | null
          service_type?: string | null
          status?: string
          table_number?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
          vendor_id?: string | null
          vendor_payout_amount?: number | null
        }
        Update: {
          bill_number?: string | null
          commission_amount?: number | null
          created_at?: string
          created_by?: string | null
          customer_instructions?: string | null
          discount_applied?: number | null
          feedback_submitted_at?: string | null
          feedback_text?: string | null
          id?: string
          is_scheduled?: boolean | null
          kot_sent_at?: string | null
          offer_code_used?: string | null
          order_channel?: string | null
          order_type?: string | null
          paid_at?: string | null
          payment_status?: string | null
          pickup_time?: string
          preparation_time_minutes?: number | null
          property_id?: string | null
          rating?: number | null
          scheduled_pickup_time?: string | null
          service_type?: string | null
          status?: string
          table_number?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
          vendor_payout_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cafeteria_orders_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cafeteria_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      category_group_mappings: {
        Row: {
          auto_assignment_priority: number | null
          category_id: string
          created_at: string
          group_id: string
          id: string
          priority_override: string | null
          required_specializations: string[] | null
          staff_group: Database["public"]["Enums"]["staff_group_type"] | null
        }
        Insert: {
          auto_assignment_priority?: number | null
          category_id: string
          created_at?: string
          group_id: string
          id?: string
          priority_override?: string | null
          required_specializations?: string[] | null
          staff_group?: Database["public"]["Enums"]["staff_group_type"] | null
        }
        Update: {
          auto_assignment_priority?: number | null
          category_id?: string
          created_at?: string
          group_id?: string
          id?: string
          priority_override?: string | null
          required_specializations?: string[] | null
          staff_group?: Database["public"]["Enums"]["staff_group_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "category_group_mappings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "maintenance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_group_mappings_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "staff_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      certifications_master: {
        Row: {
          certification_name: string
          created_at: string
          id: string
          is_active: boolean | null
          is_mandatory: boolean | null
          issuing_authority: string | null
          skill_category: string | null
          validity_months: number | null
        }
        Insert: {
          certification_name: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          issuing_authority?: string | null
          skill_category?: string | null
          validity_months?: number | null
        }
        Update: {
          certification_name?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          issuing_authority?: string | null
          skill_category?: string | null
          validity_months?: number | null
        }
        Relationships: []
      }
      commission_records: {
        Row: {
          commission_amount: number
          commission_rate: number
          created_at: string
          id: string
          order_amount: number
          order_id: string
          processed_at: string | null
          status: string | null
          vendor_id: string
          vendor_payout_amount: number
        }
        Insert: {
          commission_amount: number
          commission_rate: number
          created_at?: string
          id?: string
          order_amount: number
          order_id: string
          processed_at?: string | null
          status?: string | null
          vendor_id: string
          vendor_payout_amount: number
        }
        Update: {
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          order_amount?: number
          order_id?: string
          processed_at?: string | null
          status?: string | null
          vendor_id?: string
          vendor_payout_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "commission_records_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "cafeteria_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commission_records_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_messages: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          is_read_by: Json | null
          message_content: string
          message_type: string
          metadata: Json | null
          sender_id: string
          thread_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_read_by?: Json | null
          message_content: string
          message_type?: string
          metadata?: Json | null
          sender_id: string
          thread_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_read_by?: Json | null
          message_content?: string
          message_type?: string
          metadata?: Json | null
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "communication_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "communication_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_threads: {
        Row: {
          created_at: string
          created_by: string
          entity_id: string | null
          id: string
          is_archived: boolean
          last_message_at: string | null
          participants: Json
          subject: string
          thread_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          entity_id?: string | null
          id?: string
          is_archived?: boolean
          last_message_at?: string | null
          participants?: Json
          subject: string
          thread_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          entity_id?: string | null
          id?: string
          is_archived?: boolean
          last_message_at?: string | null
          participants?: Json
          subject?: string
          thread_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      content_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      content_items: {
        Row: {
          category_id: string | null
          content: string
          content_type: string
          created_at: string | null
          created_by: string | null
          file_size: number | null
          file_url: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          title: string
          updated_at: string | null
          updated_by: string | null
          version: number | null
        }
        Insert: {
          category_id?: string | null
          content: string
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
        }
        Update: {
          category_id?: string | null
          content?: string
          content_type?: string
          created_at?: string | null
          created_by?: string | null
          file_size?: number | null
          file_url?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "content_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_items_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_centers: {
        Row: {
          budget_annual: number | null
          budget_monthly: number | null
          code: string
          created_at: string
          department: string | null
          id: string
          is_active: boolean
          manager_id: string | null
          name: string
          updated_at: string
        }
        Insert: {
          budget_annual?: number | null
          budget_monthly?: number | null
          code: string
          created_at?: string
          department?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          budget_annual?: number | null
          budget_monthly?: number | null
          code?: string
          created_at?: string
          department?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_centers_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_centers_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      crisis_keywords: {
        Row: {
          auto_escalate_to_level: number
          category: string | null
          created_at: string
          id: string
          keyword: string
          severity_score: number
        }
        Insert: {
          auto_escalate_to_level?: number
          category?: string | null
          created_at?: string
          id?: string
          keyword: string
          severity_score?: number
        }
        Update: {
          auto_escalate_to_level?: number
          category?: string | null
          created_at?: string
          id?: string
          keyword?: string
          severity_score?: number
        }
        Relationships: []
      }
      daily_checklists: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          checklist_items: Json
          checklist_type: string
          completed_at: string | null
          completion_status: string
          created_at: string
          id: string
          notes: string | null
          photo_urls: string[] | null
          staff_id: string
          updated_at: string
          zone: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          checklist_items?: Json
          checklist_type: string
          completed_at?: string | null
          completion_status?: string
          created_at?: string
          id?: string
          notes?: string | null
          photo_urls?: string[] | null
          staff_id: string
          updated_at?: string
          zone: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          checklist_items?: Json
          checklist_type?: string
          completed_at?: string | null
          completion_status?: string
          created_at?: string
          id?: string
          notes?: string | null
          photo_urls?: string[] | null
          staff_id?: string
          updated_at?: string
          zone?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_checklists_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_checklists_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_checklists_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_checklists_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_checklists_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_checklists_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      data_flow_metrics: {
        Row: {
          avg_processing_time_ms: number | null
          created_at: string | null
          flow_type: string
          id: string
          last_execution: string | null
          metric_date: string | null
          records_processed: number | null
          source_module: string
          success_rate: number | null
          target_module: string
        }
        Insert: {
          avg_processing_time_ms?: number | null
          created_at?: string | null
          flow_type: string
          id?: string
          last_execution?: string | null
          metric_date?: string | null
          records_processed?: number | null
          source_module: string
          success_rate?: number | null
          target_module: string
        }
        Update: {
          avg_processing_time_ms?: number | null
          created_at?: string | null
          flow_type?: string
          id?: string
          last_execution?: string | null
          metric_date?: string | null
          records_processed?: number | null
          source_module?: string
          success_rate?: number | null
          target_module?: string
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          created_at: string
          delivery_date: string
          delivery_service: string | null
          delivery_time: string | null
          id: string
          logged_by: string | null
          package_description: string | null
          package_type: string | null
          photo_urls: string[] | null
          pickup_at: string | null
          pickup_by: string | null
          pickup_code: string | null
          property_id: string | null
          received_by: string | null
          recipient_company: string | null
          recipient_contact: string | null
          recipient_name: string
          sender_company: string | null
          sender_name: string | null
          special_instructions: string | null
          status: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_date?: string
          delivery_service?: string | null
          delivery_time?: string | null
          id?: string
          logged_by?: string | null
          package_description?: string | null
          package_type?: string | null
          photo_urls?: string[] | null
          pickup_at?: string | null
          pickup_by?: string | null
          pickup_code?: string | null
          property_id?: string | null
          received_by?: string | null
          recipient_company?: string | null
          recipient_contact?: string | null
          recipient_name: string
          sender_company?: string | null
          sender_name?: string | null
          special_instructions?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_date?: string
          delivery_service?: string | null
          delivery_time?: string | null
          id?: string
          logged_by?: string | null
          package_description?: string | null
          package_type?: string | null
          photo_urls?: string[] | null
          pickup_at?: string | null
          pickup_by?: string | null
          pickup_code?: string | null
          property_id?: string | null
          received_by?: string | null
          recipient_company?: string | null
          recipient_contact?: string | null
          recipient_name?: string
          sender_company?: string | null
          sender_name?: string | null
          special_instructions?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_logged_by_fkey"
            columns: ["logged_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_pickup_by_fkey"
            columns: ["pickup_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_pickup_by_fkey"
            columns: ["pickup_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_pickup_by_fkey"
            columns: ["pickup_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_notifications: {
        Row: {
          created_at: string
          delivery_id: string
          id: string
          is_read: boolean | null
          notification_type: string
          sent_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delivery_id: string
          id?: string
          is_read?: boolean | null
          notification_type: string
          sent_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delivery_id?: string
          id?: string
          is_read?: boolean | null
          notification_type?: string
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_notifications_delivery_id_fkey"
            columns: ["delivery_id"]
            isOneToOne: false
            referencedRelation: "deliveries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_department_id: string | null
          specializations: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_department_id?: string | null
          specializations?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_department_id?: string | null
          specializations?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_parent_department_id_fkey"
            columns: ["parent_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      dietary_preferences: {
        Row: {
          allergies: string[] | null
          created_at: string
          dietary_restrictions: string[] | null
          id: string
          meal_preferences: Json | null
          notification_preferences: Json | null
          preferred_cuisines: string[] | null
          spice_tolerance: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string[] | null
          created_at?: string
          dietary_restrictions?: string[] | null
          id?: string
          meal_preferences?: Json | null
          notification_preferences?: Json | null
          preferred_cuisines?: string[] | null
          spice_tolerance?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string[] | null
          created_at?: string
          dietary_restrictions?: string[] | null
          id?: string
          meal_preferences?: Json | null
          notification_preferences?: Json | null
          preferred_cuisines?: string[] | null
          spice_tolerance?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dietary_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dietary_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dietary_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_events: {
        Row: {
          aggregate_id: string
          created_at: string | null
          domain: string
          event_id: string
          event_type: string
          id: string
          metadata: Json
          payload: Json
        }
        Insert: {
          aggregate_id: string
          created_at?: string | null
          domain: string
          event_id: string
          event_type: string
          id?: string
          metadata?: Json
          payload?: Json
        }
        Update: {
          aggregate_id?: string
          created_at?: string | null
          domain?: string
          event_id?: string
          event_type?: string
          id?: string
          metadata?: Json
          payload?: Json
        }
        Relationships: []
      }
      enhanced_staff_availability: {
        Row: {
          auto_offline_at: string | null
          availability_status: Database["public"]["Enums"]["availability_status_type"]
          created_at: string
          current_workload: number
          id: string
          is_available: boolean
          last_status_change: string
          max_concurrent_tickets: number
          specialization: string[] | null
          staff_group: Database["public"]["Enums"]["staff_group_type"] | null
          staff_id: string
          updated_at: string
        }
        Insert: {
          auto_offline_at?: string | null
          availability_status?: Database["public"]["Enums"]["availability_status_type"]
          created_at?: string
          current_workload?: number
          id?: string
          is_available?: boolean
          last_status_change?: string
          max_concurrent_tickets?: number
          specialization?: string[] | null
          staff_group?: Database["public"]["Enums"]["staff_group_type"] | null
          staff_id: string
          updated_at?: string
        }
        Update: {
          auto_offline_at?: string | null
          availability_status?: Database["public"]["Enums"]["availability_status_type"]
          created_at?: string
          current_workload?: number
          id?: string
          is_available?: boolean
          last_status_change?: string
          max_concurrent_tickets?: number
          specialization?: string[] | null
          staff_group?: Database["public"]["Enums"]["staff_group_type"] | null
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enhanced_staff_availability_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enhanced_staff_availability_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enhanced_staff_availability_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          category: string
          created_at: string
          id: string
          last_maintenance_date: string | null
          location: string
          name: string
          next_maintenance_date: string | null
          notes: string | null
          purchase_cost: number | null
          purchase_date: string | null
          status: string
          updated_at: string
          warranty_expiry: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          last_maintenance_date?: string | null
          location: string
          name: string
          next_maintenance_date?: string | null
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          status?: string
          updated_at?: string
          warranty_expiry?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          last_maintenance_date?: string | null
          location?: string
          name?: string
          next_maintenance_date?: string | null
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          status?: string
          updated_at?: string
          warranty_expiry?: string | null
        }
        Relationships: []
      }
      escalation_logs: {
        Row: {
          created_at: string
          escalated_from: string | null
          escalated_to: string | null
          escalation_reason: string | null
          escalation_type: string
          id: string
          metadata: Json | null
          penalty_amount: number | null
          request_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          escalated_from?: string | null
          escalated_to?: string | null
          escalation_reason?: string | null
          escalation_type: string
          id?: string
          metadata?: Json | null
          penalty_amount?: number | null
          request_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          escalated_from?: string | null
          escalated_to?: string | null
          escalation_reason?: string | null
          escalation_type?: string
          id?: string
          metadata?: Json | null
          penalty_amount?: number | null
          request_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalation_logs_escalated_from_fkey"
            columns: ["escalated_from"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_logs_escalated_from_fkey"
            columns: ["escalated_from"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_logs_escalated_from_fkey"
            columns: ["escalated_from"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_logs_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_logs_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_logs_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_logs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "active_maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_logs_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      escalation_predictions: {
        Row: {
          actual_escalated: boolean | null
          escalation_date: string | null
          id: string
          model_version: string | null
          predicted_escalation_probability: number
          prediction_date: string
          recommended_actions: Json | null
          request_id: string | null
          risk_factors: Json | null
        }
        Insert: {
          actual_escalated?: boolean | null
          escalation_date?: string | null
          id?: string
          model_version?: string | null
          predicted_escalation_probability: number
          prediction_date?: string
          recommended_actions?: Json | null
          request_id?: string | null
          risk_factors?: Json | null
        }
        Update: {
          actual_escalated?: boolean | null
          escalation_date?: string | null
          id?: string
          model_version?: string | null
          predicted_escalation_probability?: number
          prediction_date?: string
          recommended_actions?: Json | null
          request_id?: string | null
          risk_factors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "escalation_predictions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "active_maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_predictions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      executive_reports: {
        Row: {
          ai_insights: Json | null
          file_url: string | null
          generated_at: string
          generated_by: string | null
          id: string
          is_automated: boolean | null
          report_data: Json
          report_period: string
          report_type: string
        }
        Insert: {
          ai_insights?: Json | null
          file_url?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          is_automated?: boolean | null
          report_data: Json
          report_period: string
          report_type: string
        }
        Update: {
          ai_insights?: Json | null
          file_url?: string | null
          generated_at?: string
          generated_by?: string | null
          id?: string
          is_automated?: boolean | null
          report_data?: Json
          report_period?: string
          report_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "executive_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "executive_reports_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      external_integrations: {
        Row: {
          config: Json
          created_at: string
          error_count: number | null
          id: string
          integration_name: string
          integration_type: string
          is_enabled: boolean
          last_sync_at: string | null
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          error_count?: number | null
          id?: string
          integration_name: string
          integration_type: string
          is_enabled?: boolean
          last_sync_at?: string | null
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          error_count?: number | null
          id?: string
          integration_name?: string
          integration_type?: string
          is_enabled?: boolean
          last_sync_at?: string | null
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      feature_requests: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          business_justification: string | null
          category: string
          comments: Json | null
          created_at: string
          description: string
          estimated_effort: string | null
          expected_completion: string | null
          id: string
          priority: string
          requested_by: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          votes: number | null
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          business_justification?: string | null
          category: string
          comments?: Json | null
          created_at?: string
          description: string
          estimated_effort?: string | null
          expected_completion?: string | null
          id?: string
          priority?: string
          requested_by: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          votes?: number | null
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          business_justification?: string | null
          category?: string
          comments?: Json | null
          created_at?: string
          description?: string
          estimated_effort?: string | null
          expected_completion?: string | null
          id?: string
          priority?: string
          requested_by?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          votes?: number | null
        }
        Relationships: []
      }
      financial_reports: {
        Row: {
          average_order_value: number | null
          created_at: string
          customer_satisfaction_score: number | null
          id: string
          peak_hours: Json | null
          report_date: string
          report_type: string
          top_selling_items: Json | null
          total_commission_amount: number
          total_orders: number
          total_payout_amount: number
          total_sales_amount: number
          vendor_id: string | null
        }
        Insert: {
          average_order_value?: number | null
          created_at?: string
          customer_satisfaction_score?: number | null
          id?: string
          peak_hours?: Json | null
          report_date: string
          report_type: string
          top_selling_items?: Json | null
          total_commission_amount?: number
          total_orders?: number
          total_payout_amount?: number
          total_sales_amount?: number
          vendor_id?: string | null
        }
        Update: {
          average_order_value?: number | null
          created_at?: string
          customer_satisfaction_score?: number | null
          id?: string
          peak_hours?: Json | null
          report_date?: string
          report_type?: string
          top_selling_items?: Json | null
          total_commission_amount?: number
          total_orders?: number
          total_payout_amount?: number
          total_sales_amount?: number
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_reports_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      gateway_logs: {
        Row: {
          created_at: string | null
          error: string | null
          id: string
          latency_ms: number | null
          method: string
          path: string
          request_id: string
          service: string
          status_code: number | null
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: string
          latency_ms?: number | null
          method: string
          path: string
          request_id: string
          service: string
          status_code?: number | null
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: string
          latency_ms?: number | null
          method?: string
          path?: string
          request_id?: string
          service?: string
          status_code?: number | null
          timestamp?: string | null
        }
        Relationships: []
      }
      hot_desk_bookings: {
        Row: {
          auto_checkin: boolean | null
          booking_date: string
          checked_in_at: string | null
          checked_out_at: string | null
          created_at: string
          desk_id: string
          end_time: string
          id: string
          notes: string | null
          start_time: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_checkin?: boolean | null
          booking_date: string
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string
          desk_id: string
          end_time: string
          id?: string
          notes?: string | null
          start_time: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_checkin?: boolean | null
          booking_date?: string
          checked_in_at?: string | null
          checked_out_at?: string | null
          created_at?: string
          desk_id?: string
          end_time?: string
          id?: string
          notes?: string | null
          start_time?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hot_desk_bookings_desk_id_fkey"
            columns: ["desk_id"]
            isOneToOne: false
            referencedRelation: "hot_desks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hot_desk_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hot_desk_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hot_desk_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      hot_desks: {
        Row: {
          amenities: string[] | null
          coordinates_x: number | null
          coordinates_y: number | null
          created_at: string
          desk_number: string
          equipment_available: string[] | null
          floor: string
          id: string
          is_accessible: boolean | null
          is_available: boolean | null
          location_description: string | null
          max_booking_duration_hours: number | null
          photo_url: string | null
          updated_at: string
          zone: string
        }
        Insert: {
          amenities?: string[] | null
          coordinates_x?: number | null
          coordinates_y?: number | null
          created_at?: string
          desk_number: string
          equipment_available?: string[] | null
          floor: string
          id?: string
          is_accessible?: boolean | null
          is_available?: boolean | null
          location_description?: string | null
          max_booking_duration_hours?: number | null
          photo_url?: string | null
          updated_at?: string
          zone: string
        }
        Update: {
          amenities?: string[] | null
          coordinates_x?: number | null
          coordinates_y?: number | null
          created_at?: string
          desk_number?: string
          equipment_available?: string[] | null
          floor?: string
          id?: string
          is_accessible?: boolean | null
          is_available?: boolean | null
          location_description?: string | null
          max_booking_duration_hours?: number | null
          photo_url?: string | null
          updated_at?: string
          zone?: string
        }
        Relationships: []
      }
      import_batches: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          error_summary: Json | null
          failed_items: number
          filename: string
          id: string
          status: string
          success_summary: Json | null
          successful_items: number
          total_items: number
          vendor_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_summary?: Json | null
          failed_items?: number
          filename: string
          id?: string
          status?: string
          success_summary?: Json | null
          successful_items?: number
          total_items?: number
          vendor_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          error_summary?: Json | null
          failed_items?: number
          filename?: string
          id?: string
          status?: string
          success_summary?: Json | null
          successful_items?: number
          total_items?: number
          vendor_id?: string
        }
        Relationships: []
      }
      info_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      info_items: {
        Row: {
          category_id: string | null
          contact_email: string | null
          contact_phone: string | null
          contact_role: string | null
          content: string | null
          created_at: string
          description: string | null
          display_order: number | null
          file_size: string | null
          file_type: string | null
          file_url: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_role?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          file_size?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contact_role?: string | null
          content?: string | null
          created_at?: string
          description?: string | null
          display_order?: number | null
          file_size?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "info_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "info_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_roles: {
        Row: {
          app_role: Database["public"]["Enums"]["app_role"]
          color_class: string | null
          created_at: string
          default_department: string | null
          default_specialization: string | null
          id: string
          is_active: boolean
          requires_specialization: boolean
          slug: string
          sort_order: number | null
          title: string
          updated_at: string
          user_category:
            | Database["public"]["Enums"]["user_category_type"]
            | null
        }
        Insert: {
          app_role: Database["public"]["Enums"]["app_role"]
          color_class?: string | null
          created_at?: string
          default_department?: string | null
          default_specialization?: string | null
          id?: string
          is_active?: boolean
          requires_specialization?: boolean
          slug: string
          sort_order?: number | null
          title: string
          updated_at?: string
          user_category?:
            | Database["public"]["Enums"]["user_category_type"]
            | null
        }
        Update: {
          app_role?: Database["public"]["Enums"]["app_role"]
          color_class?: string | null
          created_at?: string
          default_department?: string | null
          default_specialization?: string | null
          id?: string
          is_active?: boolean
          requires_specialization?: boolean
          slug?: string
          sort_order?: number | null
          title?: string
          updated_at?: string
          user_category?:
            | Database["public"]["Enums"]["user_category_type"]
            | null
        }
        Relationships: []
      }
      iot_sensor_data: {
        Row: {
          device_id: string
          id: string
          is_anomaly: boolean | null
          location: string
          metadata: Json | null
          reading_value: number
          sensor_type: string
          timestamp: string
          unit: string
        }
        Insert: {
          device_id: string
          id?: string
          is_anomaly?: boolean | null
          location: string
          metadata?: Json | null
          reading_value: number
          sensor_type: string
          timestamp?: string
          unit: string
        }
        Update: {
          device_id?: string
          id?: string
          is_anomaly?: boolean | null
          location?: string
          metadata?: Json | null
          reading_value?: number
          sensor_type?: string
          timestamp?: string
          unit?: string
        }
        Relationships: []
      }
      item_feedback: {
        Row: {
          created_at: string
          feedback_text: string | null
          id: string
          order_item_id: string
          rating: number
          user_id: string
          vendor_item_id: string
        }
        Insert: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          order_item_id: string
          rating: number
          user_id: string
          vendor_item_id: string
        }
        Update: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          order_item_id?: string
          rating?: number
          user_id?: string
          vendor_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_feedback_order_item_id_fkey"
            columns: ["order_item_id"]
            isOneToOne: false
            referencedRelation: "order_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_feedback_vendor_item_id_fkey"
            columns: ["vendor_item_id"]
            isOneToOne: false
            referencedRelation: "vendor_menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_articles: {
        Row: {
          category: string
          content: string
          created_at: string | null
          difficulty: string
          estimated_time_minutes: number
          id: string
          image_urls: string[] | null
          is_active: boolean | null
          required_tools: string[] | null
          safety_warnings: string[] | null
          steps: Json
          success_rate: number | null
          tags: string[] | null
          times_used: number | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          category: string
          content: string
          created_at?: string | null
          difficulty: string
          estimated_time_minutes?: number
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          required_tools?: string[] | null
          safety_warnings?: string[] | null
          steps?: Json
          success_rate?: number | null
          tags?: string[] | null
          times_used?: number | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          difficulty?: string
          estimated_time_minutes?: number
          id?: string
          image_urls?: string[] | null
          is_active?: boolean | null
          required_tools?: string[] | null
          safety_warnings?: string[] | null
          steps?: Json
          success_rate?: number | null
          tags?: string[] | null
          times_used?: number | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      knowledge_base_usage: {
        Row: {
          article_id: string
          completed_at: string | null
          escalated_to_maintenance: boolean | null
          escalation_request_id: string | null
          feedback_rating: number | null
          feedback_text: string | null
          id: string
          started_at: string | null
          success: boolean | null
          user_id: string
        }
        Insert: {
          article_id: string
          completed_at?: string | null
          escalated_to_maintenance?: boolean | null
          escalation_request_id?: string | null
          feedback_rating?: number | null
          feedback_text?: string | null
          id?: string
          started_at?: string | null
          success?: boolean | null
          user_id: string
        }
        Update: {
          article_id?: string
          completed_at?: string | null
          escalated_to_maintenance?: boolean | null
          escalation_request_id?: string | null
          feedback_rating?: number | null
          feedback_text?: string | null
          id?: string
          started_at?: string | null
          success?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_usage_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_base_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_usage_escalation_request_id_fkey"
            columns: ["escalation_request_id"]
            isOneToOne: false
            referencedRelation: "active_maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_usage_escalation_request_id_fkey"
            columns: ["escalation_request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_aggregations: {
        Row: {
          calculation_config: Json | null
          created_at: string | null
          current_value: number
          id: string
          kpi_category: string
          kpi_name: string
          last_calculated: string | null
          metadata: Json | null
          target_value: number | null
          trend_direction: string | null
        }
        Insert: {
          calculation_config?: Json | null
          created_at?: string | null
          current_value: number
          id?: string
          kpi_category: string
          kpi_name: string
          last_calculated?: string | null
          metadata?: Json | null
          target_value?: number | null
          trend_direction?: string | null
        }
        Update: {
          calculation_config?: Json | null
          created_at?: string | null
          current_value?: number
          id?: string
          kpi_category?: string
          kpi_name?: string
          last_calculated?: string | null
          metadata?: Json | null
          target_value?: number | null
          trend_direction?: string | null
        }
        Relationships: []
      }
      kpi_metrics: {
        Row: {
          calculation_method: string | null
          current_value: number
          id: string
          is_critical: boolean | null
          last_updated: string
          metric_category: string
          metric_name: string
          target_value: number | null
          threshold_max: number | null
          threshold_min: number | null
          unit: string | null
        }
        Insert: {
          calculation_method?: string | null
          current_value: number
          id?: string
          is_critical?: boolean | null
          last_updated?: string
          metric_category: string
          metric_name: string
          target_value?: number | null
          threshold_max?: number | null
          threshold_min?: number | null
          unit?: string | null
        }
        Update: {
          calculation_method?: string | null
          current_value?: number
          id?: string
          is_critical?: boolean | null
          last_updated?: string
          metric_category?: string
          metric_name?: string
          target_value?: number | null
          threshold_max?: number | null
          threshold_min?: number | null
          unit?: string | null
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          id: string
          points: number
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
          vendor_specific_points: Json | null
        }
        Insert: {
          id?: string
          points?: number
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
          vendor_specific_points?: Json | null
        }
        Update: {
          id?: string
          points?: number
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
          vendor_specific_points?: Json | null
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_id: string | null
          points: number
          transaction_type: string
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points: number
          transaction_type: string
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points?: number
          transaction_type?: string
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "cafeteria_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      main_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      maintenance_categories: {
        Row: {
          category_group: string | null
          created_at: string
          description: string | null
          estimated_resolution_minutes: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          usage_count: number | null
        }
        Insert: {
          category_group?: string | null
          created_at?: string
          description?: string | null
          estimated_resolution_minutes?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          usage_count?: number | null
        }
        Update: {
          category_group?: string | null
          created_at?: string
          description?: string | null
          estimated_resolution_minutes?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          usage_count?: number | null
        }
        Relationships: []
      }
      maintenance_processes: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_processes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_processes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_processes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_request_bulk_uploads: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_summary: Json | null
          failed_records: number | null
          filename: string
          id: string
          success_summary: Json | null
          successful_records: number | null
          total_records: number | null
          upload_status: string
          uploaded_by: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_summary?: Json | null
          failed_records?: number | null
          filename: string
          id?: string
          success_summary?: Json | null
          successful_records?: number | null
          total_records?: number | null
          upload_status?: string
          uploaded_by?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_summary?: Json | null
          failed_records?: number | null
          filename?: string
          id?: string
          success_summary?: Json | null
          successful_records?: number | null
          total_records?: number | null
          upload_status?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      maintenance_request_feedback: {
        Row: {
          communication_rating: number | null
          created_at: string
          feedback_text: string | null
          id: string
          quality_rating: number | null
          request_id: string
          response_time_rating: number | null
          satisfaction_rating: number
          updated_at: string
          user_id: string
          would_recommend: boolean | null
        }
        Insert: {
          communication_rating?: number | null
          created_at?: string
          feedback_text?: string | null
          id?: string
          quality_rating?: number | null
          request_id: string
          response_time_rating?: number | null
          satisfaction_rating: number
          updated_at?: string
          user_id: string
          would_recommend?: boolean | null
        }
        Update: {
          communication_rating?: number | null
          created_at?: string
          feedback_text?: string | null
          id?: string
          quality_rating?: number | null
          request_id?: string
          response_time_rating?: number | null
          satisfaction_rating?: number
          updated_at?: string
          user_id?: string
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_request_feedback_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "active_maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_request_feedback_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          acknowledgment_deadline: string | null
          after_photo_url: string | null
          assigned_at: string | null
          assigned_group: string | null
          assigned_to: string | null
          assignment_acknowledged_at: string | null
          auto_assigned_count: number
          auto_assignment_attempts: number
          auto_detected_location: boolean | null
          before_photo_url: string | null
          building_area_id: string | null
          building_floor_id: string | null
          category_id: string | null
          closure_reason: string | null
          completed_at: string | null
          created_at: string
          crisis_detected_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string
          en_route_at: string | null
          escalated_at: string | null
          escalation_level: number | null
          estimated_arrival: string | null
          estimated_completion: string | null
          gps_coordinates: Json | null
          id: string
          is_crisis: boolean
          issue_type: string | null
          location: string
          main_category_id: string | null
          next_escalation_at: string | null
          priority: Database["public"]["Enums"]["request_priority"]
          process_id: string | null
          property_id: string | null
          reported_by: string | null
          resolution_sla_at: string | null
          response_sla_at: string | null
          response_sla_breach_at: string | null
          sla_breach_at: string | null
          staff_group: Database["public"]["Enums"]["staff_group_type"] | null
          status: Database["public"]["Enums"]["request_status"]
          sub_category_id: string | null
          technician_location: Json | null
          title: string
          updated_at: string
          work_started_at: string | null
          workflow_step: number | null
        }
        Insert: {
          acknowledgment_deadline?: string | null
          after_photo_url?: string | null
          assigned_at?: string | null
          assigned_group?: string | null
          assigned_to?: string | null
          assignment_acknowledged_at?: string | null
          auto_assigned_count?: number
          auto_assignment_attempts?: number
          auto_detected_location?: boolean | null
          before_photo_url?: string | null
          building_area_id?: string | null
          building_floor_id?: string | null
          category_id?: string | null
          closure_reason?: string | null
          completed_at?: string | null
          created_at?: string
          crisis_detected_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description: string
          en_route_at?: string | null
          escalated_at?: string | null
          escalation_level?: number | null
          estimated_arrival?: string | null
          estimated_completion?: string | null
          gps_coordinates?: Json | null
          id?: string
          is_crisis?: boolean
          issue_type?: string | null
          location: string
          main_category_id?: string | null
          next_escalation_at?: string | null
          priority?: Database["public"]["Enums"]["request_priority"]
          process_id?: string | null
          property_id?: string | null
          reported_by?: string | null
          resolution_sla_at?: string | null
          response_sla_at?: string | null
          response_sla_breach_at?: string | null
          sla_breach_at?: string | null
          staff_group?: Database["public"]["Enums"]["staff_group_type"] | null
          status?: Database["public"]["Enums"]["request_status"]
          sub_category_id?: string | null
          technician_location?: Json | null
          title: string
          updated_at?: string
          work_started_at?: string | null
          workflow_step?: number | null
        }
        Update: {
          acknowledgment_deadline?: string | null
          after_photo_url?: string | null
          assigned_at?: string | null
          assigned_group?: string | null
          assigned_to?: string | null
          assignment_acknowledged_at?: string | null
          auto_assigned_count?: number
          auto_assignment_attempts?: number
          auto_detected_location?: boolean | null
          before_photo_url?: string | null
          building_area_id?: string | null
          building_floor_id?: string | null
          category_id?: string | null
          closure_reason?: string | null
          completed_at?: string | null
          created_at?: string
          crisis_detected_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string
          en_route_at?: string | null
          escalated_at?: string | null
          escalation_level?: number | null
          estimated_arrival?: string | null
          estimated_completion?: string | null
          gps_coordinates?: Json | null
          id?: string
          is_crisis?: boolean
          issue_type?: string | null
          location?: string
          main_category_id?: string | null
          next_escalation_at?: string | null
          priority?: Database["public"]["Enums"]["request_priority"]
          process_id?: string | null
          property_id?: string | null
          reported_by?: string | null
          resolution_sla_at?: string | null
          response_sla_at?: string | null
          response_sla_breach_at?: string | null
          sla_breach_at?: string | null
          staff_group?: Database["public"]["Enums"]["staff_group_type"] | null
          status?: Database["public"]["Enums"]["request_status"]
          sub_category_id?: string | null
          technician_location?: Json | null
          title?: string
          updated_at?: string
          work_started_at?: string | null
          workflow_step?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_assigned_group_fkey"
            columns: ["assigned_group"]
            isOneToOne: false
            referencedRelation: "staff_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_building_area_id_fkey"
            columns: ["building_area_id"]
            isOneToOne: false
            referencedRelation: "building_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_building_floor_id_fkey"
            columns: ["building_floor_id"]
            isOneToOne: false
            referencedRelation: "building_floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "main_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_main_category_id_fkey"
            columns: ["main_category_id"]
            isOneToOne: false
            referencedRelation: "main_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "maintenance_processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_sub_category_id_fkey"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "sub_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_subscriptions: {
        Row: {
          auto_order: boolean | null
          created_at: string
          delivery_preferences: Json | null
          end_date: string | null
          id: string
          is_active: boolean | null
          max_daily_amount: number | null
          meal_types: string[]
          preferred_items: Json | null
          start_date: string
          subscription_type: string
          updated_at: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          auto_order?: boolean | null
          created_at?: string
          delivery_preferences?: Json | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_daily_amount?: number | null
          meal_types: string[]
          preferred_items?: Json | null
          start_date: string
          subscription_type: string
          updated_at?: string
          user_id: string
          vendor_id: string
        }
        Update: {
          auto_order?: boolean | null
          created_at?: string
          delivery_preferences?: Json | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          max_daily_amount?: number | null
          meal_types?: string[]
          preferred_items?: Json | null
          start_date?: string
          subscription_type?: string
          updated_at?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_subscriptions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      meters: {
        Row: {
          account_number: string | null
          connection_type: string | null
          created_at: string | null
          id: string
          installation_date: string | null
          last_reading_date: string | null
          metadata: Json | null
          meter_location: string | null
          meter_number: string
          meter_type: string
          sanctioned_load: number | null
          site_id: string
          status: string | null
          tariff_category: string | null
          updated_at: string | null
          utility_provider: string | null
          voltage_level: string | null
        }
        Insert: {
          account_number?: string | null
          connection_type?: string | null
          created_at?: string | null
          id?: string
          installation_date?: string | null
          last_reading_date?: string | null
          metadata?: Json | null
          meter_location?: string | null
          meter_number: string
          meter_type: string
          sanctioned_load?: number | null
          site_id: string
          status?: string | null
          tariff_category?: string | null
          updated_at?: string | null
          utility_provider?: string | null
          voltage_level?: string | null
        }
        Update: {
          account_number?: string | null
          connection_type?: string | null
          created_at?: string | null
          id?: string
          installation_date?: string | null
          last_reading_date?: string | null
          metadata?: Json | null
          meter_location?: string | null
          meter_number?: string
          meter_type?: string
          sanctioned_load?: number | null
          site_id?: string
          status?: string | null
          tariff_category?: string | null
          updated_at?: string | null
          utility_provider?: string | null
          voltage_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meters_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      microservice_health: {
        Row: {
          checks: Json
          created_at: string | null
          id: string
          metadata: Json | null
          service_name: string
          status: string | null
          timestamp: string | null
        }
        Insert: {
          checks?: Json
          created_at?: string | null
          id?: string
          metadata?: Json | null
          service_name: string
          status?: string | null
          timestamp?: string | null
        }
        Update: {
          checks?: Json
          created_at?: string | null
          id?: string
          metadata?: Json | null
          service_name?: string
          status?: string | null
          timestamp?: string | null
        }
        Relationships: []
      }
      microservice_logs: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          level: string | null
          message: string
          service_name: string
          timestamp: string | null
          trace_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          level?: string | null
          message: string
          service_name: string
          timestamp?: string | null
          trace_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          level?: string | null
          message?: string
          service_name?: string
          timestamp?: string | null
          trace_id?: string | null
        }
        Relationships: []
      }
      microservice_metrics: {
        Row: {
          created_at: string | null
          id: string
          metric_name: string
          service_name: string
          tags: Json | null
          timestamp: string | null
          unit: string
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          metric_name: string
          service_name: string
          tags?: Json | null
          timestamp?: string | null
          unit: string
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          metric_name?: string
          service_name?: string
          tags?: Json | null
          timestamp?: string | null
          unit?: string
          value?: number
        }
        Relationships: []
      }
      microservice_traces: {
        Row: {
          created_at: string | null
          duration_ms: number
          id: string
          metadata: Json | null
          operation: string
          parent_span_id: string | null
          service_name: string
          span_id: string
          status: string | null
          timestamp: string | null
          trace_id: string
        }
        Insert: {
          created_at?: string | null
          duration_ms: number
          id?: string
          metadata?: Json | null
          operation: string
          parent_span_id?: string | null
          service_name: string
          span_id: string
          status?: string | null
          timestamp?: string | null
          trace_id: string
        }
        Update: {
          created_at?: string | null
          duration_ms?: number
          id?: string
          metadata?: Json | null
          operation?: string
          parent_span_id?: string | null
          service_name?: string
          span_id?: string
          status?: string | null
          timestamp?: string | null
          trace_id?: string
        }
        Relationships: []
      }
      ml_models: {
        Row: {
          accuracy_score: number | null
          created_at: string
          id: string
          is_active: boolean
          last_trained_at: string | null
          model_config: Json
          model_name: string
          model_type: string
          updated_at: string
          version: string
        }
        Insert: {
          accuracy_score?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_trained_at?: string | null
          model_config?: Json
          model_name: string
          model_type: string
          updated_at?: string
          version?: string
        }
        Update: {
          accuracy_score?: number | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_trained_at?: string | null
          model_config?: Json
          model_name?: string
          model_type?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      ml_predictions: {
        Row: {
          actual_outcome: Json | null
          confidence_score: number | null
          id: string
          is_validated: boolean | null
          model_id: string
          prediction_date: string
          prediction_type: string
          prediction_value: Json
          target_id: string | null
          target_type: string
        }
        Insert: {
          actual_outcome?: Json | null
          confidence_score?: number | null
          id?: string
          is_validated?: boolean | null
          model_id: string
          prediction_date?: string
          prediction_type: string
          prediction_value: Json
          target_id?: string | null
          target_type: string
        }
        Update: {
          actual_outcome?: Json | null
          confidence_score?: number | null
          id?: string
          is_validated?: boolean | null
          model_id?: string
          prediction_date?: string
          prediction_type?: string
          prediction_value?: Json
          target_id?: string | null
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ml_predictions_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ml_models"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_sync_queue: {
        Row: {
          action_type: string
          created_at: string
          data: Json
          device_id: string | null
          id: string
          record_id: string | null
          sync_status: string
          synced_at: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          data: Json
          device_id?: string | null
          id?: string
          record_id?: string | null
          sync_status?: string
          synced_at?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          data?: Json
          device_id?: string | null
          id?: string
          record_id?: string | null
          sync_status?: string
          synced_at?: string | null
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      operational_departments: {
        Row: {
          created_at: string
          department_head_id: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_head_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_head_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operational_departments_department_head_id_fkey"
            columns: ["department_head_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_departments_department_head_id_fkey"
            columns: ["department_head_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operational_departments_department_head_id_fkey"
            columns: ["department_head_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      operational_zones: {
        Row: {
          building: string | null
          created_at: string
          department_id: string | null
          description: string | null
          floor: string | null
          id: string
          is_active: boolean | null
          updated_at: string
          zone_code: string | null
          zone_name: string
        }
        Insert: {
          building?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          floor?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
          zone_code?: string | null
          zone_name: string
        }
        Update: {
          building?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          floor?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string
          zone_code?: string | null
          zone_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "operational_zones_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "operational_departments"
            referencedColumns: ["id"]
          },
        ]
      }
      optimization_recommendations: {
        Row: {
          confidence_score: number | null
          created_at: string
          description: string
          id: string
          implementation_effort: string | null
          implemented_at: string | null
          metadata: Json | null
          potential_savings: number | null
          priority: string
          recommendation_type: string
          status: string | null
          title: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          description: string
          id?: string
          implementation_effort?: string | null
          implemented_at?: string | null
          metadata?: Json | null
          potential_savings?: number | null
          priority?: string
          recommendation_type: string
          status?: string | null
          title: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          description?: string
          id?: string
          implementation_effort?: string | null
          implemented_at?: string | null
          metadata?: Json | null
          potential_savings?: number | null
          priority?: string
          recommendation_type?: string
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      order_discounts: {
        Row: {
          applied_by: string
          created_at: string | null
          discount_reason: string | null
          discount_type: string
          discount_value: number
          id: string
          manager_approval_pin: string | null
          order_id: string | null
        }
        Insert: {
          applied_by: string
          created_at?: string | null
          discount_reason?: string | null
          discount_type: string
          discount_value: number
          id?: string
          manager_approval_pin?: string | null
          order_id?: string | null
        }
        Update: {
          applied_by?: string
          created_at?: string | null
          discount_reason?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          manager_approval_pin?: string | null
          order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_discounts_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "cafeteria_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_feedback: {
        Row: {
          created_at: string
          feedback_text: string | null
          hygiene_rating: number | null
          id: string
          is_anonymous: boolean | null
          order_id: string
          overall_rating: number
          service_rating: number | null
          speed_rating: number | null
          taste_rating: number | null
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          feedback_text?: string | null
          hygiene_rating?: number | null
          id?: string
          is_anonymous?: boolean | null
          order_id: string
          overall_rating: number
          service_rating?: number | null
          speed_rating?: number | null
          taste_rating?: number | null
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          feedback_text?: string | null
          hygiene_rating?: number | null
          id?: string
          is_anonymous?: boolean | null
          order_id?: string
          overall_rating?: number
          service_rating?: number | null
          speed_rating?: number | null
          taste_rating?: number | null
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_feedback_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "cafeteria_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_feedback_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          item_feedback: string | null
          item_id: string
          item_rating: number | null
          notes: string | null
          order_id: string | null
          quantity: number
          special_instructions: string | null
          unit_price: number
          vendor_item_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_feedback?: string | null
          item_id: string
          item_rating?: number | null
          notes?: string | null
          order_id?: string | null
          quantity: number
          special_instructions?: string | null
          unit_price: number
          vendor_item_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          item_feedback?: string | null
          item_id?: string
          item_rating?: number | null
          notes?: string | null
          order_id?: string | null
          quantity?: number
          special_instructions?: string | null
          unit_price?: number
          vendor_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_order_items_order"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "cafeteria_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "cafeteria_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_vendor_item_id_fkey"
            columns: ["vendor_item_id"]
            isOneToOne: false
            referencedRelation: "vendor_menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          order_id: string | null
          payment_method: string
          processed_by: string
          shift_id: string | null
          transaction_ref: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          order_id?: string | null
          payment_method: string
          processed_by: string
          shift_id?: string | null
          transaction_ref?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string
          processed_by?: string
          shift_id?: string | null
          transaction_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "cafeteria_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "pos_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      order_timeline: {
        Row: {
          created_by: string | null
          id: string
          notes: string | null
          order_id: string | null
          status: string
          timestamp: string | null
        }
        Insert: {
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          status: string
          timestamp?: string | null
        }
        Update: {
          created_by?: string | null
          id?: string
          notes?: string | null
          order_id?: string | null
          status?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_timeline_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "cafeteria_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_users: {
        Row: {
          approved_at: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          last_login_at: string | null
          last_name: string | null
          organization_id: string
          phone_number: string | null
          role_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          organization_id: string
          phone_number?: string | null
          role_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          organization_id?: string
          phone_number?: string | null
          role_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "bill_auditor_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          billing_email: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          id: string
          industry: string | null
          is_active: boolean | null
          logo_url: string | null
          max_sites: number | null
          max_users: number | null
          name: string
          org_code: string
          postal_code: string | null
          settings: Json | null
          state: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          billing_email?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          max_sites?: number | null
          max_users?: number | null
          name: string
          org_code: string
          postal_code?: string | null
          settings?: Json | null
          state?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          billing_email?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          industry?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          max_sites?: number | null
          max_users?: number | null
          name?: string
          org_code?: string
          postal_code?: string | null
          settings?: Json | null
          state?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      parking_requests: {
        Row: {
          approved: boolean | null
          created_at: string
          duration: string
          id: string
          user_id: string | null
          vehicle_number: string
          visit_date: string
          visitor_id: string | null
        }
        Insert: {
          approved?: boolean | null
          created_at?: string
          duration: string
          id?: string
          user_id?: string | null
          vehicle_number: string
          visit_date: string
          visitor_id?: string | null
        }
        Update: {
          approved?: boolean | null
          created_at?: string
          duration?: string
          id?: string
          user_id?: string | null
          vehicle_number?: string
          visit_date?: string
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parking_requests_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          average_completion_time_minutes: number
          calculated_at: string
          completed_requests: number
          id: string
          metric_date: string
          sla_breaches: number
          total_requests: number
        }
        Insert: {
          average_completion_time_minutes?: number
          calculated_at?: string
          completed_requests?: number
          id?: string
          metric_date: string
          sla_breaches?: number
          total_requests?: number
        }
        Update: {
          average_completion_time_minutes?: number
          calculated_at?: string
          completed_requests?: number
          id?: string
          metric_date?: string
          sla_breaches?: number
          total_requests?: number
        }
        Relationships: []
      }
      point_redemptions: {
        Row: {
          fulfilled_at: string | null
          fulfilled_by: string | null
          id: string
          points_spent: number
          redeemed_at: string
          redemption_code: string | null
          reward_id: string
          status: string
          technician_id: string
        }
        Insert: {
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          points_spent: number
          redeemed_at?: string
          redemption_code?: string | null
          reward_id: string
          status?: string
          technician_id: string
        }
        Update: {
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          points_spent?: number
          redeemed_at?: string
          redemption_code?: string | null
          reward_id?: string
          status?: string
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_redemptions_fulfilled_by_fkey"
            columns: ["fulfilled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_redemptions_fulfilled_by_fkey"
            columns: ["fulfilled_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_redemptions_fulfilled_by_fkey"
            columns: ["fulfilled_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "point_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_redemptions_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_redemptions_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_redemptions_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      point_rewards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          points_required: number
          reward_type: string
          reward_value: string | null
          stock_quantity: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          points_required: number
          reward_type: string
          reward_value?: string | null
          stock_quantity?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          points_required?: number
          reward_type?: string
          reward_value?: string | null
          stock_quantity?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          metadata: Json | null
          points: number
          reason: string
          request_id: string | null
          technician_id: string
          transaction_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          points: number
          reason: string
          request_id?: string | null
          technician_id: string
          transaction_type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          points?: number
          reason?: string
          request_id?: string | null
          technician_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "active_maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "point_transactions_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_shifts: {
        Row: {
          card_collected: number | null
          cash_collected: number | null
          cashier_id: string
          closing_cash: number | null
          created_at: string | null
          id: string
          opening_cash: number | null
          shift_end: string | null
          shift_start: string | null
          status: string | null
          terminal_id: string | null
          total_sales: number | null
          updated_at: string | null
          upi_collected: number | null
        }
        Insert: {
          card_collected?: number | null
          cash_collected?: number | null
          cashier_id: string
          closing_cash?: number | null
          created_at?: string | null
          id?: string
          opening_cash?: number | null
          shift_end?: string | null
          shift_start?: string | null
          status?: string | null
          terminal_id?: string | null
          total_sales?: number | null
          updated_at?: string | null
          upi_collected?: number | null
        }
        Update: {
          card_collected?: number | null
          cash_collected?: number | null
          cashier_id?: string
          closing_cash?: number | null
          created_at?: string | null
          id?: string
          opening_cash?: number | null
          shift_end?: string | null
          shift_start?: string | null
          status?: string | null
          terminal_id?: string | null
          total_sales?: number | null
          updated_at?: string | null
          upi_collected?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_shifts_terminal_id_fkey"
            columns: ["terminal_id"]
            isOneToOne: false
            referencedRelation: "pos_terminals"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_terminals: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          terminal_code: string
          terminal_name: string
          updated_at: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          terminal_code: string
          terminal_name: string
          updated_at?: string | null
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          terminal_code?: string
          terminal_name?: string
          updated_at?: string | null
          vendor_id?: string
        }
        Relationships: []
      }
      predictive_insights: {
        Row: {
          confidence_score: number
          created_at: string
          id: string
          insight_type: string
          model_id: string | null
          prediction_data: Json
          target_entity_id: string | null
          target_entity_type: string
          valid_until: string
        }
        Insert: {
          confidence_score: number
          created_at?: string
          id?: string
          insight_type: string
          model_id?: string | null
          prediction_data: Json
          target_entity_id?: string | null
          target_entity_type: string
          valid_until: string
        }
        Update: {
          confidence_score?: number
          created_at?: string
          id?: string
          insight_type?: string
          model_id?: string | null
          prediction_data?: Json
          target_entity_id?: string | null
          target_entity_type?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "predictive_insights_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
        ]
      }
      procurement_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          notification_type: string
          read_at: string | null
          requisition_list_id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          notification_type: string
          read_at?: string | null
          requisition_list_id: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: string
          read_at?: string | null
          requisition_list_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "procurement_notifications_requisition_list_id_fkey"
            columns: ["requisition_list_id"]
            isOneToOne: false
            referencedRelation: "requisition_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_audit_logs: {
        Row: {
          action_type: string
          changed_by: string | null
          changes: Json
          id: string
          ip_address: unknown
          profile_id: string
          timestamp: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          changed_by?: string | null
          changes: Json
          id?: string
          ip_address?: unknown
          profile_id: string
          timestamp?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          changed_by?: string | null
          changes?: Json
          id?: string
          ip_address?: unknown
          profile_id?: string
          timestamp?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_audit_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_audit_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_audit_logs_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_audit_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_audit_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_audit_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          assigned_role_title: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          department: string | null
          designation: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          employee_id: string | null
          employee_id_encrypted: string | null
          first_name: string | null
          floor: string | null
          government_id: string | null
          government_id_encrypted: string | null
          id: string
          interests: string[] | null
          is_active: boolean | null
          last_name: string | null
          mobile_number: string | null
          mobile_number_encrypted: string | null
          notification_preferences: Json | null
          office_number: string | null
          onboarding_date: string | null
          phone_number: string | null
          phone_number_encrypted: string | null
          primary_property_id: string | null
          profile_visibility: string | null
          rejection_reason: string | null
          shift_end: string | null
          shift_start: string | null
          skills: string[] | null
          specialization: string | null
          supervisor_id: string | null
          updated_at: string
          user_category:
            | Database["public"]["Enums"]["user_category_type"]
            | null
          zone: string | null
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          assigned_role_title?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          designation?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employee_id?: string | null
          employee_id_encrypted?: string | null
          first_name?: string | null
          floor?: string | null
          government_id?: string | null
          government_id_encrypted?: string | null
          id: string
          interests?: string[] | null
          is_active?: boolean | null
          last_name?: string | null
          mobile_number?: string | null
          mobile_number_encrypted?: string | null
          notification_preferences?: Json | null
          office_number?: string | null
          onboarding_date?: string | null
          phone_number?: string | null
          phone_number_encrypted?: string | null
          primary_property_id?: string | null
          profile_visibility?: string | null
          rejection_reason?: string | null
          shift_end?: string | null
          shift_start?: string | null
          skills?: string[] | null
          specialization?: string | null
          supervisor_id?: string | null
          updated_at?: string
          user_category?:
            | Database["public"]["Enums"]["user_category_type"]
            | null
          zone?: string | null
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          assigned_role_title?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          designation?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          employee_id?: string | null
          employee_id_encrypted?: string | null
          first_name?: string | null
          floor?: string | null
          government_id?: string | null
          government_id_encrypted?: string | null
          id?: string
          interests?: string[] | null
          is_active?: boolean | null
          last_name?: string | null
          mobile_number?: string | null
          mobile_number_encrypted?: string | null
          notification_preferences?: Json | null
          office_number?: string | null
          onboarding_date?: string | null
          phone_number?: string | null
          phone_number_encrypted?: string | null
          primary_property_id?: string | null
          profile_visibility?: string | null
          rejection_reason?: string | null
          shift_end?: string | null
          shift_start?: string | null
          skills?: string[] | null
          specialization?: string | null
          supervisor_id?: string | null
          updated_at?: string
          user_category?:
            | Database["public"]["Enums"]["user_category_type"]
            | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_primary_property_id_fkey"
            columns: ["primary_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      properties: {
        Row: {
          address: string | null
          city: string | null
          code: string
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          postal_code: string | null
          property_type: string | null
          settings: Json | null
          state: string | null
          status: string | null
          timezone: string | null
          total_floors: number | null
          total_units: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          postal_code?: string | null
          property_type?: string | null
          settings?: Json | null
          state?: string | null
          status?: string | null
          timezone?: string | null
          total_floors?: number | null
          total_units?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          postal_code?: string | null
          property_type?: string | null
          settings?: Json | null
          state?: string | null
          status?: string | null
          timezone?: string | null
          total_floors?: number | null
          total_units?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      property_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          is_primary: boolean | null
          property_id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_primary?: boolean | null
          property_id: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          is_primary?: boolean | null
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_assignments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      real_time_events: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string
          event_data: Json
          event_type: string
          id: string
          severity: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type: string
          event_data?: Json
          event_type: string
          id?: string
          severity?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          event_data?: Json
          event_type?: string
          id?: string
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      report_generations: {
        Row: {
          error_message: string | null
          file_url: string | null
          generated_at: string | null
          generation_status: string | null
          id: string
          metadata: Json | null
          report_data: Json
          report_id: string
        }
        Insert: {
          error_message?: string | null
          file_url?: string | null
          generated_at?: string | null
          generation_status?: string | null
          id?: string
          metadata?: Json | null
          report_data: Json
          report_id: string
        }
        Update: {
          error_message?: string | null
          file_url?: string | null
          generated_at?: string | null
          generation_status?: string | null
          id?: string
          metadata?: Json | null
          report_data?: Json
          report_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_generations_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "automated_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_history: {
        Row: {
          error_message: string | null
          export_format: string
          file_size_bytes: number | null
          file_url: string | null
          filter_config: Json | null
          generated_at: string | null
          generated_by: string | null
          id: string
          metrics_snapshot: Json | null
          report_type: string
          scheduled_report_id: string | null
          status: string
        }
        Insert: {
          error_message?: string | null
          export_format: string
          file_size_bytes?: number | null
          file_url?: string | null
          filter_config?: Json | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          metrics_snapshot?: Json | null
          report_type: string
          scheduled_report_id?: string | null
          status?: string
        }
        Update: {
          error_message?: string | null
          export_format?: string
          file_size_bytes?: number | null
          file_url?: string | null
          filter_config?: Json | null
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          metrics_snapshot?: Json | null
          report_type?: string
          scheduled_report_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_history_scheduled_report_id_fkey"
            columns: ["scheduled_report_id"]
            isOneToOne: false
            referencedRelation: "scheduled_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      request_attachments: {
        Row: {
          attachment_type: string | null
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          metadata: Json | null
          request_id: string | null
          stage: string | null
          uploaded_by: string
        }
        Insert: {
          attachment_type?: string | null
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          metadata?: Json | null
          request_id?: string | null
          stage?: string | null
          uploaded_by: string
        }
        Update: {
          attachment_type?: string | null
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          metadata?: Json | null
          request_id?: string | null
          stage?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_attachments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "active_maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_attachments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          request_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          request_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          request_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_comments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "active_maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_comments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_offer_recipients: {
        Row: {
          id: string
          notified_at: string
          offer_id: string
          responded_at: string | null
          response: string
          user_id: string
        }
        Insert: {
          id?: string
          notified_at?: string
          offer_id: string
          responded_at?: string | null
          response?: string
          user_id: string
        }
        Update: {
          id?: string
          notified_at?: string
          offer_id?: string
          responded_at?: string | null
          response?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_offer_recipients_offer_id_fkey"
            columns: ["offer_id"]
            isOneToOne: false
            referencedRelation: "request_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_offer_recipients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_offer_recipients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_offer_recipients_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      request_offers: {
        Row: {
          category_id: string | null
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          expires_at: string
          id: string
          level: number
          request_id: string
          status: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          expires_at: string
          id?: string
          level?: number
          request_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          level?: number
          request_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_offers_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "maintenance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_offers_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_offers_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_offers_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "active_maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_offers_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          notes: string | null
          request_id: string
          status: Database["public"]["Enums"]["request_status"]
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          notes?: string | null
          request_id: string
          status: Database["public"]["Enums"]["request_status"]
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          notes?: string | null
          request_id?: string
          status?: Database["public"]["Enums"]["request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "request_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_status_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "active_maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_status_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      request_time_extensions: {
        Row: {
          additional_hours: number
          created_at: string
          id: string
          notes: string | null
          reason: string
          request_id: string
          requested_by: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          additional_hours: number
          created_at?: string
          id?: string
          notes?: string | null
          reason: string
          request_id: string
          requested_by: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          additional_hours?: number
          created_at?: string
          id?: string
          notes?: string | null
          reason?: string
          request_id?: string
          requested_by?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_time_extensions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "active_maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_time_extensions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_time_extensions_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_time_extensions_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_time_extensions_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_time_extensions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_time_extensions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_time_extensions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      request_workflow_states: {
        Row: {
          after_photos_required: boolean
          after_photos_uploaded: boolean
          before_photos_required: boolean
          before_photos_uploaded: boolean
          completed_at: string | null
          created_at: string
          current_stage: string
          id: string
          request_id: string
          started_at: string | null
          technician_id: string | null
          updated_at: string
        }
        Insert: {
          after_photos_required?: boolean
          after_photos_uploaded?: boolean
          before_photos_required?: boolean
          before_photos_uploaded?: boolean
          completed_at?: string | null
          created_at?: string
          current_stage?: string
          id?: string
          request_id: string
          started_at?: string | null
          technician_id?: string | null
          updated_at?: string
        }
        Update: {
          after_photos_required?: boolean
          after_photos_uploaded?: boolean
          before_photos_required?: boolean
          before_photos_uploaded?: boolean
          completed_at?: string | null
          created_at?: string
          current_stage?: string
          id?: string
          request_id?: string
          started_at?: string | null
          technician_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "request_workflow_states_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "active_maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_workflow_states_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_workflow_states_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_workflow_states_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_workflow_states_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      request_workflow_transitions: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          created_at: string | null
          from_status: Database["public"]["Enums"]["request_status"] | null
          id: string
          metadata: Json | null
          notes: string | null
          request_id: string
          to_status: Database["public"]["Enums"]["request_status"]
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["request_status"] | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          request_id: string
          to_status: Database["public"]["Enums"]["request_status"]
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          created_at?: string | null
          from_status?: Database["public"]["Enums"]["request_status"] | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          request_id?: string
          to_status?: Database["public"]["Enums"]["request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "request_workflow_transitions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_workflow_transitions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_workflow_transitions_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_workflow_transitions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "active_maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "request_workflow_transitions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      requisition_categories: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      requisition_items_master: {
        Row: {
          category_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          item_name: string
          unit: string
          unit_limit: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          item_name: string
          unit?: string
          unit_limit?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          item_name?: string
          unit?: string
          unit_limit?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requisition_items_master_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "requisition_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      requisition_list_items: {
        Row: {
          category_name: string
          created_at: string
          description: string | null
          id: string
          item_master_id: string
          item_name: string
          quantity: number
          requisition_list_id: string
          unit: string
          unit_limit: number
        }
        Insert: {
          category_name: string
          created_at?: string
          description?: string | null
          id?: string
          item_master_id: string
          item_name: string
          quantity: number
          requisition_list_id: string
          unit: string
          unit_limit: number
        }
        Update: {
          category_name?: string
          created_at?: string
          description?: string | null
          id?: string
          item_master_id?: string
          item_name?: string
          quantity?: number
          requisition_list_id?: string
          unit?: string
          unit_limit?: number
        }
        Relationships: [
          {
            foreignKeyName: "requisition_list_items_item_master_id_fkey"
            columns: ["item_master_id"]
            isOneToOne: false
            referencedRelation: "requisition_items_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisition_list_items_requisition_list_id_fkey"
            columns: ["requisition_list_id"]
            isOneToOne: false
            referencedRelation: "requisition_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      requisition_lists: {
        Row: {
          accepted_at: string | null
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          closed_at: string | null
          created_at: string
          created_by: string
          created_by_name: string
          expected_delivery_date: string | null
          grn_document_url: string | null
          id: string
          manager_approved_at: string | null
          manager_id: string | null
          manager_remarks: string | null
          notes: string | null
          order_number: string
          po_number: string | null
          priority: Database["public"]["Enums"]["requisition_priority"]
          property_id: string
          received_at: string | null
          rejection_reason: string | null
          status: Database["public"]["Enums"]["requisition_status"]
          total_items: number | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          created_by: string
          created_by_name: string
          expected_delivery_date?: string | null
          grn_document_url?: string | null
          id?: string
          manager_approved_at?: string | null
          manager_id?: string | null
          manager_remarks?: string | null
          notes?: string | null
          order_number: string
          po_number?: string | null
          priority?: Database["public"]["Enums"]["requisition_priority"]
          property_id: string
          received_at?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["requisition_status"]
          total_items?: number | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string
          created_by_name?: string
          expected_delivery_date?: string | null
          grn_document_url?: string | null
          id?: string
          manager_approved_at?: string | null
          manager_id?: string | null
          manager_remarks?: string | null
          notes?: string | null
          order_number?: string
          po_number?: string | null
          priority?: Database["public"]["Enums"]["requisition_priority"]
          property_id?: string
          received_at?: string | null
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["requisition_status"]
          total_items?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requisition_lists_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      requisition_status_history: {
        Row: {
          changed_by: string
          changed_by_role: Database["public"]["Enums"]["app_role"] | null
          created_at: string
          id: string
          metadata: Json | null
          new_status: Database["public"]["Enums"]["requisition_status"]
          old_status: Database["public"]["Enums"]["requisition_status"] | null
          remarks: string | null
          requisition_list_id: string
        }
        Insert: {
          changed_by: string
          changed_by_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_status: Database["public"]["Enums"]["requisition_status"]
          old_status?: Database["public"]["Enums"]["requisition_status"] | null
          remarks?: string | null
          requisition_list_id: string
        }
        Update: {
          changed_by?: string
          changed_by_role?: Database["public"]["Enums"]["app_role"] | null
          created_at?: string
          id?: string
          metadata?: Json | null
          new_status?: Database["public"]["Enums"]["requisition_status"]
          old_status?: Database["public"]["Enums"]["requisition_status"] | null
          remarks?: string | null
          requisition_list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "requisition_status_history_requisition_list_id_fkey"
            columns: ["requisition_list_id"]
            isOneToOne: false
            referencedRelation: "requisition_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      room_bookings: {
        Row: {
          attendee_count: number | null
          av_equipment_requests: Json | null
          buffer_time_minutes: number | null
          catering_orders: Json | null
          created_at: string
          description: string | null
          dietary_requirements: string[] | null
          duration_minutes: number | null
          end_time: string
          equipment_needed: Json | null
          estimated_cost: number | null
          id: string
          is_recurring: boolean | null
          meeting_agenda: string | null
          parent_booking_id: string | null
          recurrence_rule: Json | null
          room_id: string
          setup_requirements: string | null
          start_time: string
          status: string
          template_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          attendee_count?: number | null
          av_equipment_requests?: Json | null
          buffer_time_minutes?: number | null
          catering_orders?: Json | null
          created_at?: string
          description?: string | null
          dietary_requirements?: string[] | null
          duration_minutes?: number | null
          end_time: string
          equipment_needed?: Json | null
          estimated_cost?: number | null
          id?: string
          is_recurring?: boolean | null
          meeting_agenda?: string | null
          parent_booking_id?: string | null
          recurrence_rule?: Json | null
          room_id: string
          setup_requirements?: string | null
          start_time: string
          status?: string
          template_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          attendee_count?: number | null
          av_equipment_requests?: Json | null
          buffer_time_minutes?: number | null
          catering_orders?: Json | null
          created_at?: string
          description?: string | null
          dietary_requirements?: string[] | null
          duration_minutes?: number | null
          end_time?: string
          equipment_needed?: Json | null
          estimated_cost?: number | null
          id?: string
          is_recurring?: boolean | null
          meeting_agenda?: string | null
          parent_booking_id?: string | null
          recurrence_rule?: Json | null
          room_id?: string
          setup_requirements?: string | null
          start_time?: string
          status?: string
          template_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "room_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_bookings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_equipment: {
        Row: {
          created_at: string
          equipment_name: string
          equipment_type: string
          id: string
          is_available: boolean | null
          requires_setup: boolean | null
          room_id: string
          setup_time_minutes: number | null
          usage_instructions: string | null
        }
        Insert: {
          created_at?: string
          equipment_name: string
          equipment_type: string
          id?: string
          is_available?: boolean | null
          requires_setup?: boolean | null
          room_id: string
          setup_time_minutes?: number | null
          usage_instructions?: string | null
        }
        Update: {
          created_at?: string
          equipment_name?: string
          equipment_type?: string
          id?: string
          is_available?: boolean | null
          requires_setup?: boolean | null
          room_id?: string
          setup_time_minutes?: number | null
          usage_instructions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_equipment_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number
          created_at: string
          description: string | null
          facilities: string[] | null
          id: string
          image_url: string | null
          location: string
          name: string
        }
        Insert: {
          capacity: number
          created_at?: string
          description?: string | null
          facilities?: string[] | null
          id?: string
          image_url?: string | null
          location: string
          name: string
        }
        Update: {
          capacity?: number
          created_at?: string
          description?: string | null
          facilities?: string[] | null
          id?: string
          image_url?: string | null
          location?: string
          name?: string
        }
        Relationships: []
      }
      scheduled_reports: {
        Row: {
          created_at: string | null
          created_by: string | null
          export_formats: string[]
          filter_config: Json
          id: string
          is_active: boolean | null
          last_generated_at: string | null
          next_generation_at: string | null
          recipients: Json
          report_name: string
          report_type: string
          schedule_config: Json
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          export_formats?: string[]
          filter_config: Json
          id?: string
          is_active?: boolean | null
          last_generated_at?: string | null
          next_generation_at?: string | null
          recipients: Json
          report_name: string
          report_type: string
          schedule_config: Json
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          export_formats?: string[]
          filter_config?: Json
          id?: string
          is_active?: boolean | null
          last_generated_at?: string | null
          next_generation_at?: string | null
          recipients?: Json
          report_name?: string
          report_type?: string
          schedule_config?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          action: string
          error_message: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          resource_id: string | null
          resource_type: string
          success: boolean
          timestamp: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type: string
          success: boolean
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string
          success?: boolean
          timestamp?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      security_incidents: {
        Row: {
          actions_taken: string | null
          assigned_to: string | null
          created_at: string
          description: string
          evidence: Json | null
          floor: string | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          id: string
          incident_type: string
          location: string
          metadata: Json | null
          occurred_at: string
          reported_at: string
          reported_by: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string
          title: string
          updated_at: string
          witnesses: Json | null
          zone: string | null
        }
        Insert: {
          actions_taken?: string | null
          assigned_to?: string | null
          created_at?: string
          description: string
          evidence?: Json | null
          floor?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          incident_type: string
          location: string
          metadata?: Json | null
          occurred_at?: string
          reported_at?: string
          reported_by: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string
          witnesses?: Json | null
          zone?: string | null
        }
        Update: {
          actions_taken?: string | null
          assigned_to?: string | null
          created_at?: string
          description?: string
          evidence?: Json | null
          floor?: string | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          id?: string
          incident_type?: string
          location?: string
          metadata?: Json | null
          occurred_at?: string
          reported_at?: string
          reported_by?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
          witnesses?: Json | null
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_incidents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incidents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incidents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incidents_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incidents_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incidents_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      security_metrics: {
        Row: {
          calculated_at: string
          created_at: string
          floor: string | null
          id: string
          location: string | null
          metadata: Json | null
          metric_date: string
          metric_type: string
          metric_unit: string
          metric_value: number
          zone: string | null
        }
        Insert: {
          calculated_at?: string
          created_at?: string
          floor?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          metric_date: string
          metric_type: string
          metric_unit?: string
          metric_value: number
          zone?: string | null
        }
        Update: {
          calculated_at?: string
          created_at?: string
          floor?: string | null
          id?: string
          location?: string | null
          metadata?: Json | null
          metric_date?: string
          metric_type?: string
          metric_unit?: string
          metric_value?: number
          zone?: string | null
        }
        Relationships: []
      }
      security_permissions: {
        Row: {
          access_level: string
          created_at: string
          expires_at: string | null
          granted_at: string
          granted_by: string
          id: string
          is_active: boolean
          permission_type: string
          resource_id: string | null
          resource_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_level?: string
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by: string
          id?: string
          is_active?: boolean
          permission_type: string
          resource_id?: string | null
          resource_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_level?: string
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string
          id?: string
          is_active?: boolean
          permission_type?: string
          resource_id?: string | null
          resource_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      security_shifts: {
        Row: {
          created_at: string
          guard_id: string
          handover_notes: string | null
          id: string
          notes: string | null
          shift_end: string | null
          shift_start: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          guard_id: string
          handover_notes?: string | null
          id?: string
          notes?: string | null
          shift_end?: string | null
          shift_start?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          guard_id?: string
          handover_notes?: string | null
          id?: string
          notes?: string | null
          shift_end?: string | null
          shift_start?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_shifts_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_shifts_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_shifts_guard_id_fkey"
            columns: ["guard_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      security_systems: {
        Row: {
          configuration: Json | null
          created_at: string
          floor: string
          id: string
          installation_date: string | null
          is_active: boolean
          last_check: string | null
          location: string
          model: string | null
          name: string
          status: string
          system_type: string
          updated_at: string
          vendor: string | null
          warranty_expiry: string | null
          zone: string | null
        }
        Insert: {
          configuration?: Json | null
          created_at?: string
          floor: string
          id?: string
          installation_date?: string | null
          is_active?: boolean
          last_check?: string | null
          location: string
          model?: string | null
          name: string
          status?: string
          system_type: string
          updated_at?: string
          vendor?: string | null
          warranty_expiry?: string | null
          zone?: string | null
        }
        Update: {
          configuration?: Json | null
          created_at?: string
          floor?: string
          id?: string
          installation_date?: string | null
          is_active?: boolean
          last_check?: string | null
          location?: string
          model?: string | null
          name?: string
          status?: string
          system_type?: string
          updated_at?: string
          vendor?: string | null
          warranty_expiry?: string | null
          zone?: string | null
        }
        Relationships: []
      }
      sensitive_profile_access_log: {
        Row: {
          access_reason: string | null
          accessed_by: string | null
          created_at: string
          fields_accessed: string[]
          id: string
          ip_address: unknown
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          accessed_by?: string | null
          created_at?: string
          fields_accessed: string[]
          id?: string
          ip_address?: unknown
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          accessed_by?: string | null
          created_at?: string
          fields_accessed?: string[]
          id?: string
          ip_address?: unknown
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sensitive_profile_access_log_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensitive_profile_access_log_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensitive_profile_access_log_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      service_bookings: {
        Row: {
          assigned_at: string | null
          booking_date: string
          booking_time: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          rating: number | null
          review_text: string | null
          service_item_id: string | null
          service_provider_id: string | null
          started_at: string | null
          status: string
          total_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          booking_date: string
          booking_time: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rating?: number | null
          review_text?: string | null
          service_item_id?: string | null
          service_provider_id?: string | null
          started_at?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          booking_date?: string
          booking_time?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          rating?: number | null
          review_text?: string | null
          service_item_id?: string | null
          service_provider_id?: string | null
          started_at?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_service_bookings_service_provider_id"
            columns: ["service_provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_service_bookings_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_service_bookings_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_service_bookings_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_service_item_id_fkey"
            columns: ["service_item_id"]
            isOneToOne: false
            referencedRelation: "service_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_bookings_service_provider_id_fkey"
            columns: ["service_provider_id"]
            isOneToOne: false
            referencedRelation: "service_providers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_items: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          image_url: string | null
          is_available: boolean
          name: string
          price: number | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name: string
          price?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          name?: string
          price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      service_penalty_matrix: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          priority: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          priority: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          priority?: string
        }
        Relationships: []
      }
      service_providers: {
        Row: {
          availability_schedule: Json | null
          background_verified: boolean | null
          certification_documents: string[] | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          provider_name: string
          rating: number | null
          specializations: string[] | null
          total_completed_services: number | null
          updated_at: string | null
          user_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          availability_schedule?: Json | null
          background_verified?: boolean | null
          certification_documents?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          provider_name: string
          rating?: number | null
          specializations?: string[] | null
          total_completed_services?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          availability_schedule?: Json | null
          background_verified?: boolean | null
          certification_documents?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          provider_name?: string
          rating?: number | null
          specializations?: string[] | null
          total_completed_services?: number | null
          updated_at?: string | null
          user_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_providers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_providers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_providers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_providers_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_providers_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_providers_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      service_records: {
        Row: {
          actions_taken: string | null
          asset_id: string
          cost: number | null
          created_at: string
          id: string
          invoice_number: string | null
          invoice_url: string | null
          issues_found: string | null
          next_service_date: string | null
          parts_replaced: string | null
          performed_by: string | null
          performed_by_user_id: string | null
          service_date: string
          service_description: string
          service_rating: number | null
          service_type: string
          updated_at: string
          warranty_extended_until: string | null
        }
        Insert: {
          actions_taken?: string | null
          asset_id: string
          cost?: number | null
          created_at?: string
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          issues_found?: string | null
          next_service_date?: string | null
          parts_replaced?: string | null
          performed_by?: string | null
          performed_by_user_id?: string | null
          service_date: string
          service_description: string
          service_rating?: number | null
          service_type: string
          updated_at?: string
          warranty_extended_until?: string | null
        }
        Update: {
          actions_taken?: string | null
          asset_id?: string
          cost?: number | null
          created_at?: string
          id?: string
          invoice_number?: string | null
          invoice_url?: string | null
          issues_found?: string | null
          next_service_date?: string | null
          parts_replaced?: string | null
          performed_by?: string | null
          performed_by_user_id?: string | null
          service_date?: string
          service_description?: string
          service_rating?: number | null
          service_type?: string
          updated_at?: string
          warranty_extended_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_records_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_records_performed_by_user_id_fkey"
            columns: ["performed_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_records_performed_by_user_id_fkey"
            columns: ["performed_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_records_performed_by_user_id_fkey"
            columns: ["performed_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_change_requests: {
        Row: {
          created_at: string | null
          id: string
          original_shift_end: string
          original_shift_start: string
          reason: string
          requested_by: string
          requested_shift_end: string
          requested_shift_start: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          original_shift_end: string
          original_shift_start: string
          reason: string
          requested_by: string
          requested_shift_end: string
          requested_shift_start: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          original_shift_end?: string
          original_shift_start?: string
          reason?: string
          requested_by?: string
          requested_shift_end?: string
          requested_shift_start?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shift_change_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_change_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_change_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_schedules: {
        Row: {
          break_end: string | null
          break_start: string | null
          created_at: string
          id: string
          notes: string | null
          shift_end: string
          shift_start: string
          shift_type: string
          staff_id: string
          status: string
          updated_at: string
        }
        Insert: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          shift_end: string
          shift_start: string
          shift_type?: string
          staff_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          break_end?: string | null
          break_start?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          shift_end?: string
          shift_start?: string
          shift_type?: string
          staff_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_schedules_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      simple_task_categories: {
        Row: {
          created_at: string
          description: string | null
          estimated_time_minutes: number | null
          id: string
          is_active: boolean
          name: string
          required_skills: string[] | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_time_minutes?: number | null
          id?: string
          is_active?: boolean
          name: string
          required_skills?: string[] | null
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_time_minutes?: number | null
          id?: string
          is_active?: boolean
          name?: string
          required_skills?: string[] | null
        }
        Relationships: []
      }
      site_access: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          organization_user_id: string
          site_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          organization_user_id: string
          site_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          organization_user_id?: string
          site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_access_organization_user_id_fkey"
            columns: ["organization_user_id"]
            isOneToOne: false
            referencedRelation: "organization_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_access_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string | null
          area_sqft: number | null
          city: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          organization_id: string
          postal_code: string | null
          site_code: string
          site_name: string
          site_type: string | null
          state: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          area_sqft?: number | null
          city?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          organization_id: string
          postal_code?: string | null
          site_code: string
          site_name: string
          site_type?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          area_sqft?: number | null
          city?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          organization_id?: string
          postal_code?: string | null
          site_code?: string
          site_name?: string
          site_type?: string | null
          state?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      skills_master: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          skill_name: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          skill_name: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          skill_name?: string
        }
        Relationships: []
      }
      sla_configs: {
        Row: {
          category_id: string
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["request_priority"]
          resolution_time_minutes: number
          response_time_minutes: number
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          priority: Database["public"]["Enums"]["request_priority"]
          resolution_time_minutes: number
          response_time_minutes: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["request_priority"]
          resolution_time_minutes?: number
          response_time_minutes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sla_configs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_configurations: {
        Row: {
          auto_escalate: boolean | null
          created_at: string | null
          escalation_minutes: number | null
          escalation_rules: Json | null
          exclude_hours: Json | null
          id: string
          is_active: boolean | null
          main_category_id: string | null
          priority: string
          resolution_sla_minutes: number
          response_sla_minutes: number
          sub_category_id: string | null
        }
        Insert: {
          auto_escalate?: boolean | null
          created_at?: string | null
          escalation_minutes?: number | null
          escalation_rules?: Json | null
          exclude_hours?: Json | null
          id?: string
          is_active?: boolean | null
          main_category_id?: string | null
          priority: string
          resolution_sla_minutes: number
          response_sla_minutes: number
          sub_category_id?: string | null
        }
        Update: {
          auto_escalate?: boolean | null
          created_at?: string | null
          escalation_minutes?: number | null
          escalation_rules?: Json | null
          exclude_hours?: Json | null
          id?: string
          is_active?: boolean | null
          main_category_id?: string | null
          priority?: string
          resolution_sla_minutes?: number
          response_sla_minutes?: number
          sub_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sla_configurations_main_category_id_fkey"
            columns: ["main_category_id"]
            isOneToOne: false
            referencedRelation: "main_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sla_configurations_sub_category_id_fkey"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "sub_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_escalation_rules: {
        Row: {
          category_filter: string | null
          created_at: string | null
          escalation_level: number | null
          id: string
          is_active: boolean | null
          priority: string
          target_minutes: number
          updated_at: string | null
        }
        Insert: {
          category_filter?: string | null
          created_at?: string | null
          escalation_level?: number | null
          id?: string
          is_active?: boolean | null
          priority: string
          target_minutes: number
          updated_at?: string | null
        }
        Update: {
          category_filter?: string | null
          created_at?: string | null
          escalation_level?: number | null
          id?: string
          is_active?: boolean | null
          priority?: string
          target_minutes?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      staff_area_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          created_at: string
          department_id: string
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          staff_id: string
          updated_at: string
          zone_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string
          department_id: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          staff_id: string
          updated_at?: string
          zone_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          created_at?: string
          department_id?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          staff_id?: string
          updated_at?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_area_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_area_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_area_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_area_assignments_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "operational_departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_area_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_area_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_area_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_area_assignments_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "operational_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_attendance: {
        Row: {
          check_in_time: string
          check_out_time: string | null
          created_at: string
          id: string
          location: string | null
          metadata: Json | null
          staff_id: string
          updated_at: string
          zone_qr_code: string
        }
        Insert: {
          check_in_time?: string
          check_out_time?: string | null
          created_at?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          staff_id: string
          updated_at?: string
          zone_qr_code: string
        }
        Update: {
          check_in_time?: string
          check_out_time?: string | null
          created_at?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          staff_id?: string
          updated_at?: string
          zone_qr_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_availability: {
        Row: {
          auto_offline_at: string | null
          availability_status: string
          created_at: string
          id: string
          is_available: boolean
          last_status_change: string
          staff_id: string
          updated_at: string
        }
        Insert: {
          auto_offline_at?: string | null
          availability_status?: string
          created_at?: string
          id?: string
          is_available?: boolean
          last_status_change?: string
          staff_id: string
          updated_at?: string
        }
        Update: {
          auto_offline_at?: string | null
          availability_status?: string
          created_at?: string
          id?: string
          is_available?: boolean
          last_status_change?: string
          staff_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_availability_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_availability_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_availability_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_certifications: {
        Row: {
          certification_id: string
          certification_number: string | null
          created_at: string
          document_url: string | null
          expiry_date: string | null
          id: string
          is_verified: boolean | null
          issued_date: string | null
          issuing_authority: string | null
          staff_id: string
          updated_at: string
          verified_by: string | null
        }
        Insert: {
          certification_id: string
          certification_number?: string | null
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          is_verified?: boolean | null
          issued_date?: string | null
          issuing_authority?: string | null
          staff_id: string
          updated_at?: string
          verified_by?: string | null
        }
        Update: {
          certification_id?: string
          certification_number?: string | null
          created_at?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          is_verified?: boolean | null
          issued_date?: string | null
          issuing_authority?: string | null
          staff_id?: string
          updated_at?: string
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_certifications_certification_id_fkey"
            columns: ["certification_id"]
            isOneToOne: false
            referencedRelation: "certifications_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_certifications_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_certifications_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_certifications_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_certifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_certifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_certifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_group_assignments: {
        Row: {
          created_at: string
          group_id: string
          id: string
          is_backup: boolean
          staff_id: string
          staff_level: number
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          is_backup?: boolean
          staff_id: string
          staff_level?: number
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          is_backup?: boolean
          staff_id?: string
          staff_level?: number
        }
        Relationships: [
          {
            foreignKeyName: "staff_group_assignments_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "staff_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_group_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_group_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_group_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_groups: {
        Row: {
          created_at: string
          description: string | null
          group_name: string
          group_type: string
          id: string
          is_active: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          group_name: string
          group_type: string
          id?: string
          is_active?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          group_name?: string
          group_type?: string
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      staff_role_requests: {
        Row: {
          created_at: string
          id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      staff_skills: {
        Row: {
          created_at: string | null
          id: string
          last_used_at: string | null
          proficiency_level: number
          skill_name: string
          updated_at: string | null
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          proficiency_level: number
          skill_name: string
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_used_at?: string | null
          proficiency_level?: number
          skill_name?: string
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_skills_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_skills_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_skills_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_skills_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_training_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          program_id: string
          progress_percentage: number
          score: number | null
          staff_id: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          program_id: string
          progress_percentage?: number
          score?: number | null
          staff_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          program_id?: string
          progress_percentage?: number
          score?: number | null
          staff_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_training_progress_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "training_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_training_progress_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_training_progress_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_training_progress_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_workload_metrics: {
        Row: {
          active_tasks: number
          availability_status: string
          calculated_at: string
          completed_tasks: number
          efficiency_score: number
          id: string
          metric_date: string
          staff_id: string
          total_work_hours: number
        }
        Insert: {
          active_tasks?: number
          availability_status?: string
          calculated_at?: string
          completed_tasks?: number
          efficiency_score?: number
          id?: string
          metric_date: string
          staff_id: string
          total_work_hours?: number
        }
        Update: {
          active_tasks?: number
          availability_status?: string
          calculated_at?: string
          completed_tasks?: number
          efficiency_score?: number
          id?: string
          metric_date?: string
          staff_id?: string
          total_work_hours?: number
        }
        Relationships: [
          {
            foreignKeyName: "staff_workload_metrics_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_workload_metrics_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_workload_metrics_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_alerts: {
        Row: {
          alert_type: string
          created_at: string
          current_stock_quantity: number | null
          id: string
          is_resolved: boolean | null
          resolved_at: string | null
          threshold_quantity: number | null
          vendor_id: string
          vendor_item_id: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          current_stock_quantity?: number | null
          id?: string
          is_resolved?: boolean | null
          resolved_at?: string | null
          threshold_quantity?: number | null
          vendor_id: string
          vendor_item_id: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          current_stock_quantity?: number | null
          id?: string
          is_resolved?: boolean | null
          resolved_at?: string | null
          threshold_quantity?: number | null
          vendor_id?: string
          vendor_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_alerts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_alerts_vendor_item_id_fkey"
            columns: ["vendor_item_id"]
            isOneToOne: false
            referencedRelation: "vendor_menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_categories: {
        Row: {
          auto_escalate: boolean | null
          created_at: string | null
          default_priority: string | null
          description: string | null
          escalation_minutes: number | null
          estimated_resolution_minutes: number | null
          id: string
          is_active: boolean | null
          main_category_id: string
          name: string
          resolution_sla_minutes: number | null
          response_sla_minutes: number | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          auto_escalate?: boolean | null
          created_at?: string | null
          default_priority?: string | null
          description?: string | null
          escalation_minutes?: number | null
          estimated_resolution_minutes?: number | null
          id?: string
          is_active?: boolean | null
          main_category_id: string
          name: string
          resolution_sla_minutes?: number | null
          response_sla_minutes?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_escalate?: boolean | null
          created_at?: string | null
          default_priority?: string | null
          description?: string | null
          escalation_minutes?: number | null
          estimated_resolution_minutes?: number | null
          id?: string
          is_active?: boolean | null
          main_category_id?: string
          name?: string
          resolution_sla_minutes?: number | null
          response_sla_minutes?: number | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sub_categories_main_category_id_fkey"
            columns: ["main_category_id"]
            isOneToOne: false
            referencedRelation: "main_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          category: string
          created_at: string | null
          data_type: string
          description: string | null
          id: string
          is_encrypted: boolean | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          category: string
          created_at?: string | null
          data_type?: string
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          category?: string
          created_at?: string | null
          data_type?: string
          description?: string | null
          id?: string
          is_encrypted?: boolean | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      task_assignments: {
        Row: {
          actual_completion: string | null
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          assigned_by: string
          assigned_to: string
          assignment_notes: string | null
          created_at: string
          estimated_completion: string | null
          id: string
          request_id: string
          supervisor_approval: boolean | null
          updated_at: string
        }
        Insert: {
          actual_completion?: string | null
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_by: string
          assigned_to: string
          assignment_notes?: string | null
          created_at?: string
          estimated_completion?: string | null
          id?: string
          request_id: string
          supervisor_approval?: boolean | null
          updated_at?: string
        }
        Update: {
          actual_completion?: string | null
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_by?: string
          assigned_to?: string
          assignment_notes?: string | null
          created_at?: string
          estimated_completion?: string | null
          id?: string
          request_id?: string
          supervisor_approval?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "active_maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_points: {
        Row: {
          created_at: string
          current_tier: string
          id: string
          points_balance: number
          points_earned: number
          points_spent: number
          technician_id: string
          total_lifetime_points: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_tier?: string
          id?: string
          points_balance?: number
          points_earned?: number
          points_spent?: number
          technician_id: string
          total_lifetime_points?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_tier?: string
          id?: string
          points_balance?: number
          points_earned?: number
          points_spent?: number
          technician_id?: string
          total_lifetime_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_points_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_points_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_points_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_feedback: {
        Row: {
          communication_rating: number | null
          created_at: string
          feedback_text: string | null
          id: string
          quality_rating: number | null
          rating: number
          request_id: string | null
          response_time_rating: number | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          communication_rating?: number | null
          created_at?: string
          feedback_text?: string | null
          id?: string
          quality_rating?: number | null
          rating: number
          request_id?: string | null
          response_time_rating?: number | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          communication_rating?: number | null
          created_at?: string
          feedback_text?: string | null
          id?: string
          quality_rating?: number | null
          rating?: number
          request_id?: string | null
          response_time_rating?: number | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_feedback_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "active_maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_feedback_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_feedback_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_feedback_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_feedback_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_assignment_attempts: {
        Row: {
          attempt_reason: string
          attempt_result: string
          attempted_at: string
          attempted_staff_id: string | null
          id: string
          request_id: string
          staff_group: Database["public"]["Enums"]["staff_group_type"] | null
        }
        Insert: {
          attempt_reason: string
          attempt_result: string
          attempted_at?: string
          attempted_staff_id?: string | null
          id?: string
          request_id: string
          staff_group?: Database["public"]["Enums"]["staff_group_type"] | null
        }
        Update: {
          attempt_reason?: string
          attempt_result?: string
          attempted_at?: string
          attempted_staff_id?: string | null
          id?: string
          request_id?: string
          staff_group?: Database["public"]["Enums"]["staff_group_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_assignment_attempts_attempted_staff_id_fkey"
            columns: ["attempted_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_assignment_attempts_attempted_staff_id_fkey"
            columns: ["attempted_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_assignment_attempts_attempted_staff_id_fkey"
            columns: ["attempted_staff_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_assignment_attempts_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "active_maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_assignment_attempts_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_assignment_history: {
        Row: {
          acknowledged_at: string | null
          assigned_at: string
          assigned_by: string | null
          assigned_to: string | null
          assignment_reason: string | null
          assignment_type: string
          id: string
          request_id: string
          unassigned_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          assigned_at?: string
          assigned_by?: string | null
          assigned_to?: string | null
          assignment_reason?: string | null
          assignment_type: string
          id?: string
          request_id: string
          unassigned_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          assigned_at?: string
          assigned_by?: string | null
          assigned_to?: string | null
          assignment_reason?: string | null
          assignment_type?: string
          id?: string
          request_id?: string
          unassigned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_assignment_history_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_assignment_history_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_assignment_history_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_assignment_history_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_assignment_history_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_assignment_history_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_assignment_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "active_maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_assignment_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_closures: {
        Row: {
          after_photo_url: string | null
          before_photo_url: string | null
          closed_at: string
          closed_by: string
          created_at: string
          id: string
          request_id: string
          updated_at: string
        }
        Insert: {
          after_photo_url?: string | null
          before_photo_url?: string | null
          closed_at?: string
          closed_by: string
          created_at?: string
          id?: string
          request_id: string
          updated_at?: string
        }
        Update: {
          after_photo_url?: string | null
          before_photo_url?: string | null
          closed_at?: string
          closed_by?: string
          created_at?: string
          id?: string
          request_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ticket_closures_request_id"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "active_maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ticket_closures_request_id"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      training_programs: {
        Row: {
          created_at: string
          description: string | null
          difficulty_level: number
          duration_hours: number
          expiry_months: number | null
          id: string
          is_mandatory: boolean
          program_name: string
          required_skills: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty_level: number
          duration_hours: number
          expiry_months?: number | null
          id?: string
          is_mandatory?: boolean
          program_name: string
          required_skills?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty_level?: number
          duration_hours?: number
          expiry_months?: number | null
          id?: string
          is_mandatory?: boolean
          program_name?: string
          required_skills?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      user_approval_audit: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_status: string | null
          old_status: string | null
          performed_by: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_status?: string | null
          old_status?: string | null
          performed_by?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_status?: string | null
          old_status?: string | null
          performed_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          created_at: string
          department: string | null
          email: string
          emp_id: string | null
          expires_at: string
          first_name: string | null
          floor: string | null
          id: string
          invitation_token: string
          invited_by: string | null
          last_name: string | null
          mobile_number: string | null
          office_number: string | null
          password: string | null
          phone_number: string | null
          property_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          role_title: string | null
          specialization: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          emp_id?: string | null
          expires_at?: string
          first_name?: string | null
          floor?: string | null
          id?: string
          invitation_token?: string
          invited_by?: string | null
          last_name?: string | null
          mobile_number?: string | null
          office_number?: string | null
          password?: string | null
          phone_number?: string | null
          property_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          role_title?: string | null
          specialization?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          emp_id?: string | null
          expires_at?: string
          first_name?: string | null
          floor?: string | null
          id?: string
          invitation_token?: string
          invited_by?: string | null
          last_name?: string | null
          mobile_number?: string | null
          office_number?: string | null
          password?: string | null
          phone_number?: string | null
          property_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          role_title?: string | null
          specialization?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_invitations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      user_performance_scores: {
        Row: {
          attendance_rate: number | null
          avg_response_time_hours: number | null
          created_at: string | null
          customer_satisfaction_score: number | null
          efficiency_score: number | null
          id: string
          metric_date: string
          productivity_score: number | null
          quality_score: number | null
          reliability_score: number | null
          sla_compliance_rate: number | null
          total_tasks_completed: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attendance_rate?: number | null
          avg_response_time_hours?: number | null
          created_at?: string | null
          customer_satisfaction_score?: number | null
          efficiency_score?: number | null
          id?: string
          metric_date: string
          productivity_score?: number | null
          quality_score?: number | null
          reliability_score?: number | null
          sla_compliance_rate?: number | null
          total_tasks_completed?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attendance_rate?: number | null
          avg_response_time_hours?: number | null
          created_at?: string | null
          customer_satisfaction_score?: number | null
          efficiency_score?: number | null
          id?: string
          metric_date?: string
          productivity_score?: number | null
          quality_score?: number | null
          reliability_score?: number | null
          sla_compliance_rate?: number | null
          total_tasks_completed?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_performance_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_performance_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_performance_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      utility_meters: {
        Row: {
          contract_end_date: string | null
          contract_number: string | null
          contract_start_date: string | null
          created_at: string
          floor: string
          id: string
          installation_date: string | null
          last_reading_date: string | null
          last_reading_value: number | null
          location: string
          meter_number: string
          meter_status: string
          monthly_budget: number | null
          notes: string | null
          supplier_name: string | null
          unit_of_measurement: string
          updated_at: string
          utility_type: Database["public"]["Enums"]["utility_type"]
          zone: string | null
        }
        Insert: {
          contract_end_date?: string | null
          contract_number?: string | null
          contract_start_date?: string | null
          created_at?: string
          floor: string
          id?: string
          installation_date?: string | null
          last_reading_date?: string | null
          last_reading_value?: number | null
          location: string
          meter_number: string
          meter_status?: string
          monthly_budget?: number | null
          notes?: string | null
          supplier_name?: string | null
          unit_of_measurement: string
          updated_at?: string
          utility_type: Database["public"]["Enums"]["utility_type"]
          zone?: string | null
        }
        Update: {
          contract_end_date?: string | null
          contract_number?: string | null
          contract_start_date?: string | null
          created_at?: string
          floor?: string
          id?: string
          installation_date?: string | null
          last_reading_date?: string | null
          last_reading_value?: number | null
          location?: string
          meter_number?: string
          meter_status?: string
          monthly_budget?: number | null
          notes?: string | null
          supplier_name?: string | null
          unit_of_measurement?: string
          updated_at?: string
          utility_type?: Database["public"]["Enums"]["utility_type"]
          zone?: string | null
        }
        Relationships: []
      }
      utility_readings: {
        Row: {
          consumption: number | null
          cost_per_unit: number | null
          created_at: string
          id: string
          meter_id: string
          notes: string | null
          photo_url: string | null
          reading_date: string
          reading_method: string | null
          reading_value: number
          recorded_by: string | null
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          consumption?: number | null
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          meter_id: string
          notes?: string | null
          photo_url?: string | null
          reading_date: string
          reading_method?: string | null
          reading_value: number
          recorded_by?: string | null
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          consumption?: number | null
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          meter_id?: string
          notes?: string | null
          photo_url?: string | null
          reading_date?: string
          reading_method?: string | null
          reading_value?: number
          recorded_by?: string | null
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "utility_readings_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "utility_meters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_readings_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_readings_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "utility_readings_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_analytics: {
        Row: {
          average_order_value: number | null
          created_at: string | null
          customer_satisfaction_avg: number | null
          id: string
          metric_date: string
          peak_hour_end: number | null
          peak_hour_start: number | null
          popular_items: Json | null
          total_items_sold: number | null
          total_orders: number | null
          total_revenue: number | null
          vendor_id: string | null
        }
        Insert: {
          average_order_value?: number | null
          created_at?: string | null
          customer_satisfaction_avg?: number | null
          id?: string
          metric_date: string
          peak_hour_end?: number | null
          peak_hour_start?: number | null
          popular_items?: Json | null
          total_items_sold?: number | null
          total_orders?: number | null
          total_revenue?: number | null
          vendor_id?: string | null
        }
        Update: {
          average_order_value?: number | null
          created_at?: string | null
          customer_satisfaction_avg?: number | null
          id?: string
          metric_date?: string
          peak_hour_end?: number | null
          peak_hour_start?: number | null
          popular_items?: Json | null
          total_items_sold?: number | null
          total_orders?: number | null
          total_revenue?: number | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_analytics_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_documents: {
        Row: {
          document_type: Database["public"]["Enums"]["vendor_document_type"]
          document_url: string
          id: string
          uploaded_at: string
          vendor_id: string
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          document_type: Database["public"]["Enums"]["vendor_document_type"]
          document_url: string
          id?: string
          uploaded_at?: string
          vendor_id: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          document_type?: Database["public"]["Enums"]["vendor_document_type"]
          document_url?: string
          id?: string
          uploaded_at?: string
          vendor_id?: string
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_documents_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendor_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_financial_reports: {
        Row: {
          commission_amount: number | null
          created_at: string | null
          id: string
          net_amount: number | null
          report_data: Json | null
          report_date: string
          tax_amount: number | null
          total_orders: number | null
          total_sales: number | null
          updated_at: string | null
          vendor_id: string
          vendor_payout: number | null
        }
        Insert: {
          commission_amount?: number | null
          created_at?: string | null
          id?: string
          net_amount?: number | null
          report_data?: Json | null
          report_date: string
          tax_amount?: number | null
          total_orders?: number | null
          total_sales?: number | null
          updated_at?: string | null
          vendor_id: string
          vendor_payout?: number | null
        }
        Update: {
          commission_amount?: number | null
          created_at?: string | null
          id?: string
          net_amount?: number | null
          report_data?: Json | null
          report_date?: string
          tax_amount?: number | null
          total_orders?: number | null
          total_sales?: number | null
          updated_at?: string | null
          vendor_id?: string
          vendor_payout?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_financial_reports_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_menu_item_images: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          image_url: string
          is_primary: boolean | null
          menu_item_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_primary?: boolean | null
          menu_item_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_primary?: boolean | null
          menu_item_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_menu_item_images_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "vendor_menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_menu_items: {
        Row: {
          allergens: string[] | null
          availability_schedule: Json | null
          average_rating: number | null
          category_id: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          dietary_tags: string[] | null
          half_plate_price: number | null
          id: string
          image_url: string | null
          import_batch_id: string | null
          ingredients: Json | null
          is_available: boolean | null
          is_featured: boolean | null
          low_stock_threshold: number | null
          name: string
          nutritional_info: Json | null
          preparation_time_minutes: number | null
          price: number
          profit_margin: number | null
          spice_level: number | null
          stock_quantity: number | null
          total_orders: number | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          allergens?: string[] | null
          availability_schedule?: Json | null
          average_rating?: number | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          dietary_tags?: string[] | null
          half_plate_price?: number | null
          id?: string
          image_url?: string | null
          import_batch_id?: string | null
          ingredients?: Json | null
          is_available?: boolean | null
          is_featured?: boolean | null
          low_stock_threshold?: number | null
          name: string
          nutritional_info?: Json | null
          preparation_time_minutes?: number | null
          price: number
          profit_margin?: number | null
          spice_level?: number | null
          stock_quantity?: number | null
          total_orders?: number | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          allergens?: string[] | null
          availability_schedule?: Json | null
          average_rating?: number | null
          category_id?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          dietary_tags?: string[] | null
          half_plate_price?: number | null
          id?: string
          image_url?: string | null
          import_batch_id?: string | null
          ingredients?: Json | null
          is_available?: boolean | null
          is_featured?: boolean | null
          low_stock_threshold?: number | null
          name?: string
          nutritional_info?: Json | null
          preparation_time_minutes?: number | null
          price?: number
          profit_margin?: number | null
          spice_level?: number | null
          stock_quantity?: number | null
          total_orders?: number | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "cafeteria_menu_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_menu_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_menu_schedules: {
        Row: {
          availability_date: string
          created_at: string
          day_of_week: number | null
          end_date: string | null
          id: string
          is_active: boolean
          menu_item_id: string
          schedule_type: string
          start_date: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          availability_date: string
          created_at?: string
          day_of_week?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          menu_item_id: string
          schedule_type?: string
          start_date?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          availability_date?: string
          created_at?: string
          day_of_week?: number | null
          end_date?: string | null
          id?: string
          is_active?: boolean
          menu_item_id?: string
          schedule_type?: string
          start_date?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_menu_schedules_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "vendor_menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          priority: string | null
          title: string
          type: string
          vendor_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          priority?: string | null
          title: string
          type: string
          vendor_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          priority?: string | null
          title?: string
          type?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_notifications_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_offers: {
        Row: {
          applicable_items: Json | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          end_date: string
          id: string
          is_active: boolean | null
          maximum_discount_amount: number | null
          minimum_order_amount: number | null
          offer_code: string | null
          requires_admin_approval: boolean | null
          start_date: string
          title: string
          updated_at: string
          usage_limit: number | null
          used_count: number | null
          vendor_id: string
        }
        Insert: {
          applicable_items?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          end_date: string
          id?: string
          is_active?: boolean | null
          maximum_discount_amount?: number | null
          minimum_order_amount?: number | null
          offer_code?: string | null
          requires_admin_approval?: boolean | null
          start_date: string
          title: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
          vendor_id: string
        }
        Update: {
          applicable_items?: Json | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          end_date?: string
          id?: string
          is_active?: boolean | null
          maximum_discount_amount?: number | null
          minimum_order_amount?: number | null
          offer_code?: string | null
          requires_admin_approval?: boolean | null
          start_date?: string
          title?: string
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_offers_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_payouts: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          net_payout_amount: number
          notes: string | null
          orders_count: number
          paid_at: string | null
          payment_reference: string | null
          payout_period_end: string
          payout_period_start: string
          processed_at: string | null
          status: string | null
          total_commission_amount: number
          total_sales_amount: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          net_payout_amount: number
          notes?: string | null
          orders_count: number
          paid_at?: string | null
          payment_reference?: string | null
          payout_period_end: string
          payout_period_start: string
          processed_at?: string | null
          status?: string | null
          total_commission_amount: number
          total_sales_amount: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          net_payout_amount?: number
          notes?: string | null
          orders_count?: number
          paid_at?: string | null
          payment_reference?: string | null
          payout_period_end?: string
          payout_period_start?: string
          processed_at?: string | null
          status?: string | null
          total_commission_amount?: number
          total_sales_amount?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_payouts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_performance_metrics: {
        Row: {
          average_preparation_time: number | null
          created_at: string | null
          customer_return_rate: number | null
          id: string
          metric_date: string
          order_accuracy_rate: number | null
          order_fulfillment_rate: number | null
          vendor_id: string | null
        }
        Insert: {
          average_preparation_time?: number | null
          created_at?: string | null
          customer_return_rate?: number | null
          id?: string
          metric_date: string
          order_accuracy_rate?: number | null
          order_fulfillment_rate?: number | null
          vendor_id?: string | null
        }
        Update: {
          average_preparation_time?: number | null
          created_at?: string | null
          customer_return_rate?: number | null
          id?: string
          metric_date?: string
          order_accuracy_rate?: number | null
          order_fulfillment_rate?: number | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_performance_metrics_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_profiles: {
        Row: {
          business_address: string
          contact_person: string
          created_at: string
          email: string
          gst_number: string | null
          id: string
          is_active: boolean
          notes: string | null
          pan_number: string | null
          phone: string
          updated_at: string
          vendor_name: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          business_address: string
          contact_person: string
          created_at?: string
          email: string
          gst_number?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          pan_number?: string | null
          phone: string
          updated_at?: string
          vendor_name: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          business_address?: string
          contact_person?: string
          created_at?: string
          email?: string
          gst_number?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          pan_number?: string | null
          phone?: string
          updated_at?: string
          vendor_name?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      vendor_staff: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          permissions: Json | null
          role: string
          updated_at: string | null
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          role?: string
          updated_at?: string | null
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          role?: string
          updated_at?: string | null
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_staff_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          average_rating: number | null
          bank_account_holder_name: string | null
          bank_account_number: string | null
          bank_ifsc_code: string | null
          commission_rate: number | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          cuisine_type: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          operating_hours: Json | null
          pan_number: string | null
          payment_gateway_config: Json | null
          rejection_reason: string | null
          stall_location: string | null
          store_config: Json | null
          total_orders: number | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          average_rating?: number | null
          bank_account_holder_name?: string | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          commission_rate?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          cuisine_type?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          operating_hours?: Json | null
          pan_number?: string | null
          payment_gateway_config?: Json | null
          rejection_reason?: string | null
          stall_location?: string | null
          store_config?: Json | null
          total_orders?: number | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          average_rating?: number | null
          bank_account_holder_name?: string | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          commission_rate?: number | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          cuisine_type?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          operating_hours?: Json | null
          pan_number?: string | null
          payment_gateway_config?: Json | null
          rejection_reason?: string | null
          stall_location?: string | null
          store_config?: Json | null
          total_orders?: number | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendors_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_approval_requests: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          created_at: string
          host_user_id: string
          id: string
          notification_sent_at: string | null
          rejection_reason: string | null
          response_deadline: string | null
          updated_at: string
          visitor_id: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          created_at?: string
          host_user_id: string
          id?: string
          notification_sent_at?: string | null
          rejection_reason?: string | null
          response_deadline?: string | null
          updated_at?: string
          visitor_id: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          created_at?: string
          host_user_id?: string
          id?: string
          notification_sent_at?: string | null
          rejection_reason?: string | null
          response_deadline?: string | null
          updated_at?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_approval_requests_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_approval_requests_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_approval_requests_host_user_id_fkey"
            columns: ["host_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_approval_requests_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      visitor_check_logs: {
        Row: {
          action_type: string
          id: string
          location: string | null
          metadata: Json | null
          notes: string | null
          performed_by: string | null
          timestamp: string
          visitor_id: string
        }
        Insert: {
          action_type: string
          id?: string
          location?: string | null
          metadata?: Json | null
          notes?: string | null
          performed_by?: string | null
          timestamp?: string
          visitor_id: string
        }
        Update: {
          action_type?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          notes?: string | null
          performed_by?: string | null
          timestamp?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_check_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_check_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_check_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_check_logs_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_photos: {
        Row: {
          captured_at: string
          captured_by: string | null
          id: string
          metadata: Json | null
          photo_type: string
          photo_url: string
          visitor_id: string
        }
        Insert: {
          captured_at?: string
          captured_by?: string | null
          id?: string
          metadata?: Json | null
          photo_type: string
          photo_url: string
          visitor_id: string
        }
        Update: {
          captured_at?: string
          captured_by?: string | null
          id?: string
          metadata?: Json | null
          photo_type?: string
          photo_url?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_photos_captured_by_fkey"
            columns: ["captured_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_photos_captured_by_fkey"
            columns: ["captured_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_photos_captured_by_fkey"
            columns: ["captured_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_photos_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_timers: {
        Row: {
          created_at: string
          id: string
          is_sent: boolean | null
          scheduled_time: string
          timer_type: string
          updated_at: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_sent?: boolean | null
          scheduled_time: string
          timer_type: string
          updated_at?: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_sent?: boolean | null
          scheduled_time?: string
          timer_type?: string
          updated_at?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_timers_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      visitors: {
        Row: {
          access_level: string | null
          approval_status: string | null
          category_id: string | null
          check_in_time: string | null
          check_out_time: string | null
          company: string | null
          contact_number: string | null
          created_at: string
          entry_time: string | null
          exit_time: string | null
          host_department: string | null
          host_id: string
          id: string
          name: string
          notes: string | null
          office_number: string | null
          status: string | null
          updated_at: string | null
          visit_date: string
          visit_purpose: string
          visitor_badge_number: string | null
        }
        Insert: {
          access_level?: string | null
          approval_status?: string | null
          category_id?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          company?: string | null
          contact_number?: string | null
          created_at?: string
          entry_time?: string | null
          exit_time?: string | null
          host_department?: string | null
          host_id: string
          id?: string
          name: string
          notes?: string | null
          office_number?: string | null
          status?: string | null
          updated_at?: string | null
          visit_date: string
          visit_purpose: string
          visitor_badge_number?: string | null
        }
        Update: {
          access_level?: string | null
          approval_status?: string | null
          category_id?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          company?: string | null
          contact_number?: string | null
          created_at?: string
          entry_time?: string | null
          exit_time?: string | null
          host_department?: string | null
          host_id?: string
          id?: string
          name?: string
          notes?: string | null
          office_number?: string | null
          status?: string | null
          updated_at?: string | null
          visit_date?: string
          visit_purpose?: string
          visitor_badge_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visitors_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "visitor_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_actions: {
        Row: {
          action_config: Json | null
          action_type: string
          created_at: string | null
          execution_order: number | null
          id: string
          is_active: boolean | null
          target_module: string
          trigger_id: string
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          created_at?: string | null
          execution_order?: number | null
          id?: string
          is_active?: boolean | null
          target_module: string
          trigger_id: string
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          created_at?: string | null
          execution_order?: number | null
          id?: string
          is_active?: boolean | null
          target_module?: string
          trigger_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_actions_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "workflow_triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_execution_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          execution_data: Json
          id: string
          metadata: Json | null
          started_at: string | null
          status: string | null
          trigger_id: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          execution_data: Json
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string | null
          trigger_id: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          execution_data?: Json
          id?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string | null
          trigger_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_execution_logs_trigger_id_fkey"
            columns: ["trigger_id"]
            isOneToOne: false
            referencedRelation: "workflow_triggers"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          error_message: string | null
          execution_log: Json | null
          execution_status: string
          id: string
          metadata: Json | null
          started_at: string
          trigger_context: Json
          workflow_rule_id: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          execution_log?: Json | null
          execution_status?: string
          id?: string
          metadata?: Json | null
          started_at?: string
          trigger_context: Json
          workflow_rule_id: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          execution_log?: Json | null
          execution_status?: string
          id?: string
          metadata?: Json | null
          started_at?: string
          trigger_context?: Json
          workflow_rule_id?: string
        }
        Relationships: []
      }
      workflow_triggers: {
        Row: {
          conditions: Json | null
          created_at: string | null
          event_type: string
          id: string
          is_active: boolean | null
          source_module: string
          trigger_name: string
          updated_at: string | null
        }
        Insert: {
          conditions?: Json | null
          created_at?: string | null
          event_type: string
          id?: string
          is_active?: boolean | null
          source_module: string
          trigger_name: string
          updated_at?: string | null
        }
        Update: {
          conditions?: Json | null
          created_at?: string | null
          event_type?: string
          id?: string
          is_active?: boolean | null
          source_module?: string
          trigger_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      zone_qr_codes: {
        Row: {
          created_at: string
          floor: string
          id: string
          is_active: boolean
          location_description: string | null
          qr_code_data: string
          updated_at: string
          zone_name: string
        }
        Insert: {
          created_at?: string
          floor: string
          id?: string
          is_active?: boolean
          location_description?: string | null
          qr_code_data: string
          updated_at?: string
          zone_name: string
        }
        Update: {
          created_at?: string
          floor?: string
          id?: string
          is_active?: boolean
          location_description?: string | null
          qr_code_data?: string
          updated_at?: string
          zone_name?: string
        }
        Relationships: []
      }
    }
    Views: {
      active_maintenance_requests: {
        Row: {
          acknowledgment_deadline: string | null
          after_photo_url: string | null
          assigned_at: string | null
          assigned_group: string | null
          assigned_to: string | null
          assignment_acknowledged_at: string | null
          auto_assigned_count: number | null
          auto_assignment_attempts: number | null
          auto_detected_location: boolean | null
          before_photo_url: string | null
          building_area_id: string | null
          building_floor_id: string | null
          category_id: string | null
          closure_reason: string | null
          completed_at: string | null
          created_at: string | null
          crisis_detected_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          en_route_at: string | null
          escalated_at: string | null
          escalation_level: number | null
          estimated_arrival: string | null
          estimated_completion: string | null
          gps_coordinates: Json | null
          id: string | null
          is_crisis: boolean | null
          issue_type: string | null
          location: string | null
          main_category_id: string | null
          next_escalation_at: string | null
          priority: Database["public"]["Enums"]["request_priority"] | null
          process_id: string | null
          reported_by: string | null
          resolution_sla_at: string | null
          response_sla_at: string | null
          response_sla_breach_at: string | null
          sla_breach_at: string | null
          staff_group: Database["public"]["Enums"]["staff_group_type"] | null
          status: Database["public"]["Enums"]["request_status"] | null
          sub_category_id: string | null
          technician_location: Json | null
          title: string | null
          updated_at: string | null
          work_started_at: string | null
          workflow_step: number | null
        }
        Insert: {
          acknowledgment_deadline?: string | null
          after_photo_url?: string | null
          assigned_at?: string | null
          assigned_group?: string | null
          assigned_to?: string | null
          assignment_acknowledged_at?: string | null
          auto_assigned_count?: number | null
          auto_assignment_attempts?: number | null
          auto_detected_location?: boolean | null
          before_photo_url?: string | null
          building_area_id?: string | null
          building_floor_id?: string | null
          category_id?: string | null
          closure_reason?: string | null
          completed_at?: string | null
          created_at?: string | null
          crisis_detected_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          en_route_at?: string | null
          escalated_at?: string | null
          escalation_level?: number | null
          estimated_arrival?: string | null
          estimated_completion?: string | null
          gps_coordinates?: Json | null
          id?: string | null
          is_crisis?: boolean | null
          issue_type?: string | null
          location?: string | null
          main_category_id?: string | null
          next_escalation_at?: string | null
          priority?: Database["public"]["Enums"]["request_priority"] | null
          process_id?: string | null
          reported_by?: string | null
          resolution_sla_at?: string | null
          response_sla_at?: string | null
          response_sla_breach_at?: string | null
          sla_breach_at?: string | null
          staff_group?: Database["public"]["Enums"]["staff_group_type"] | null
          status?: Database["public"]["Enums"]["request_status"] | null
          sub_category_id?: string | null
          technician_location?: Json | null
          title?: string | null
          updated_at?: string | null
          work_started_at?: string | null
          workflow_step?: number | null
        }
        Update: {
          acknowledgment_deadline?: string | null
          after_photo_url?: string | null
          assigned_at?: string | null
          assigned_group?: string | null
          assigned_to?: string | null
          assignment_acknowledged_at?: string | null
          auto_assigned_count?: number | null
          auto_assignment_attempts?: number | null
          auto_detected_location?: boolean | null
          before_photo_url?: string | null
          building_area_id?: string | null
          building_floor_id?: string | null
          category_id?: string | null
          closure_reason?: string | null
          completed_at?: string | null
          created_at?: string | null
          crisis_detected_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          en_route_at?: string | null
          escalated_at?: string | null
          escalation_level?: number | null
          estimated_arrival?: string | null
          estimated_completion?: string | null
          gps_coordinates?: Json | null
          id?: string | null
          is_crisis?: boolean | null
          issue_type?: string | null
          location?: string | null
          main_category_id?: string | null
          next_escalation_at?: string | null
          priority?: Database["public"]["Enums"]["request_priority"] | null
          process_id?: string | null
          reported_by?: string | null
          resolution_sla_at?: string | null
          response_sla_at?: string | null
          response_sla_breach_at?: string | null
          sla_breach_at?: string | null
          staff_group?: Database["public"]["Enums"]["staff_group_type"] | null
          status?: Database["public"]["Enums"]["request_status"] | null
          sub_category_id?: string | null
          technician_location?: Json | null
          title?: string | null
          updated_at?: string | null
          work_started_at?: string | null
          workflow_step?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_assigned_group_fkey"
            columns: ["assigned_group"]
            isOneToOne: false
            referencedRelation: "staff_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_building_area_id_fkey"
            columns: ["building_area_id"]
            isOneToOne: false
            referencedRelation: "building_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_building_floor_id_fkey"
            columns: ["building_floor_id"]
            isOneToOne: false
            referencedRelation: "building_floors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "main_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_main_category_id_fkey"
            columns: ["main_category_id"]
            isOneToOne: false
            referencedRelation: "main_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "maintenance_processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_sub_category_id_fkey"
            columns: ["sub_category_id"]
            isOneToOne: false
            referencedRelation: "sub_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_public: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"] | null
          approved_at: string | null
          approved_by: string | null
          assigned_role_title: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          department: string | null
          designation: string | null
          email: string | null
          first_name: string | null
          floor: string | null
          id: string | null
          interests: string[] | null
          is_active: boolean | null
          last_name: string | null
          mobile_number: string | null
          notification_preferences: Json | null
          office_number: string | null
          onboarding_date: string | null
          phone_number: string | null
          profile_visibility: string | null
          rejection_reason: string | null
          role: Database["public"]["Enums"]["app_role"] | null
          shift_end: string | null
          shift_start: string | null
          skills: string[] | null
          specialization: string | null
          supervisor_id: string | null
          updated_at: string | null
          user_category:
            | Database["public"]["Enums"]["user_category_type"]
            | null
          zone: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_with_role: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"] | null
          approved_at: string | null
          approved_by: string | null
          assigned_role_title: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          department: string | null
          designation: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          employee_id: string | null
          employee_id_encrypted: string | null
          first_name: string | null
          floor: string | null
          government_id: string | null
          government_id_encrypted: string | null
          id: string | null
          interests: string[] | null
          is_active: boolean | null
          last_name: string | null
          mobile_number: string | null
          mobile_number_encrypted: string | null
          notification_preferences: Json | null
          office_number: string | null
          onboarding_date: string | null
          phone_number: string | null
          phone_number_encrypted: string | null
          primary_property_id: string | null
          profile_visibility: string | null
          rejection_reason: string | null
          role: string | null
          shift_end: string | null
          shift_start: string | null
          skills: string[] | null
          specialization: string | null
          supervisor_id: string | null
          updated_at: string | null
          user_category:
            | Database["public"]["Enums"]["user_category_type"]
            | null
          zone: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_primary_property_id_fkey"
            columns: ["primary_property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles_with_role"
            referencedColumns: ["id"]
          },
        ]
      }
      v_index_health: {
        Row: {
          idx_scan: number | null
          idx_tup_fetch: number | null
          idx_tup_read: number | null
          index_size: string | null
          indexname: unknown
          schemaname: unknown
          tablename: unknown
          usage_status: string | null
        }
        Relationships: []
      }
      v_query_performance: {
        Row: {
          idx_scan: number | null
          idx_tup_fetch: number | null
          index_usage_pct: number | null
          modifications: number | null
          schemaname: unknown
          seq_scan: number | null
          seq_tup_read: number | null
          tablename: unknown
        }
        Relationships: []
      }
      v_slow_queries: {
        Row: {
          avg_rows_per_scan: number | null
          index_scans: number | null
          recommendation: string | null
          rows_read_sequentially: number | null
          schemaname: unknown
          sequential_scans: number | null
          table_rows: number | null
          tablename: unknown
        }
        Relationships: []
      }
      v_table_stats: {
        Row: {
          bloat_pct: number | null
          dead_rows: number | null
          last_analyze: string | null
          last_autovacuum: string | null
          last_vacuum: string | null
          live_rows: number | null
          schemaname: unknown
          tablename: unknown
          total_size: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_request_offer: { Args: { p_request_id: string }; Returns: Json }
      acknowledge_ticket: { Args: { ticket_id: string }; Returns: boolean }
      add_business_hours: {
        Args: { hours_to_add: number; start_time: string }
        Returns: string
      }
      admin_add_vendor_staff: {
        Args: { p_is_active?: boolean; p_user_id: string; p_vendor_id: string }
        Returns: Json
      }
      admin_approve_vendor: {
        Args: { target_vendor_id: string }
        Returns: Json
      }
      admin_backfill_profiles_from_auth: { Args: never; Returns: Json }
      admin_bulk_create_maintenance_requests: {
        Args: { requests_data: Json; upload_id: string }
        Returns: Json
      }
      admin_bulk_create_users: { Args: { users_data: Json }; Returns: Json }
      admin_cascade_delete_user_data:
        | {
            Args: { calling_user_id: string; target_user_id: string }
            Returns: Json
          }
        | { Args: { target_user_id: string }; Returns: Json }
      admin_cleanup_orphaned_vendor_staff: { Args: never; Returns: Json }
      admin_create_user_invitation:
        | {
            Args: {
              invitation_department?: string
              invitation_email: string
              invitation_first_name: string
              invitation_floor?: string
              invitation_last_name: string
              invitation_office_number?: string
              invitation_phone_number?: string
              invitation_role: string
              invitation_specialization?: string
            }
            Returns: Json
          }
        | {
            Args: {
              invitation_department?: string
              invitation_email: string
              invitation_emp_id?: string
              invitation_first_name: string
              invitation_floor?: string
              invitation_last_name: string
              invitation_office_number?: string
              invitation_password?: string
              invitation_phone_number?: string
              invitation_role: string
              invitation_specialization?: string
            }
            Returns: Json
          }
        | {
            Args: {
              invitation_department?: string
              invitation_email: string
              invitation_emp_id?: string
              invitation_first_name: string
              invitation_floor?: string
              invitation_last_name: string
              invitation_office_number?: string
              invitation_password?: string
              invitation_phone_number?: string
              invitation_property_id?: string
              invitation_role: string
              invitation_specialization?: string
            }
            Returns: Json
          }
        | {
            Args: {
              invitation_department?: string
              invitation_email: string
              invitation_first_name: string
              invitation_floor?: string
              invitation_last_name: string
              invitation_office_number?: string
              invitation_phone_number?: string
              invitation_role: string
            }
            Returns: Json
          }
      admin_create_user_with_validation: {
        Args: {
          p_department?: string
          p_email: string
          p_emp_id?: string
          p_first_name: string
          p_last_name: string
          p_mobile_number: string
          p_password?: string
          p_role: string
          p_specialization?: string
        }
        Returns: Json
      }
      admin_create_vendor: { Args: { vendor_data: Json }; Returns: Json }
      admin_delete_user: { Args: { target_user_id: string }; Returns: Json }
      admin_get_approved_users: {
        Args: never
        Returns: {
          email: string
          first_name: string
          id: string
          last_name: string
          role: string
        }[]
      }
      admin_get_unassigned_users: {
        Args: never
        Returns: {
          email: string
          first_name: string
          last_name: string
          role: string
          user_id: string
        }[]
      }
      admin_get_vendor_staff_assignments: {
        Args: never
        Returns: {
          assigned_at: string
          assignment_id: string
          email: string
          first_name: string
          is_active: boolean
          last_name: string
          user_id: string
          vendor_id: string
          vendor_name: string
        }[]
      }
      admin_reject_vendor: {
        Args: { reason: string; target_vendor_id: string }
        Returns: Json
      }
      analyze_query_performance: {
        Args: never
        Returns: {
          impact: string
          issue_type: string
          recommendation: string
          table_name: string
        }[]
      }
      approve_user: {
        Args: { approver_id: string; target_user_id: string }
        Returns: Json
      }
      assign_and_start_request:
        | { Args: { p_request_id: string }; Returns: Json }
        | { Args: { p_request_id: string; p_staff_id: string }; Returns: Json }
      assign_staff_to_zone: {
        Args: {
          p_department_id: string
          p_is_primary?: boolean
          p_staff_id: string
          p_zone_id: string
        }
        Returns: string
      }
      backfill_vendor_analytics: { Args: never; Returns: undefined }
      broadcast_request_offer: {
        Args: { p_expires_in_minutes?: number; p_request_id: string }
        Returns: Json
      }
      calculate_advanced_metrics: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: Json
      }
      calculate_business_hours: {
        Args: { end_time: string; start_time: string }
        Returns: number
      }
      calculate_cross_module_kpis: { Args: never; Returns: undefined }
      calculate_daily_metrics: { Args: never; Returns: undefined }
      calculate_staff_workload_score: {
        Args: { target_staff_id: string }
        Returns: number
      }
      calculate_user_performance_score: {
        Args: { score_date?: string; target_user_id: string }
        Returns: Json
      }
      calculate_utility_consumption: { Args: never; Returns: undefined }
      calculate_vendor_daily_analytics: { Args: never; Returns: undefined }
      call_booking_reminders: { Args: never; Returns: undefined }
      can_view_profile_sensitive_data: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      can_view_sensitive_profile_data: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      check_sla_breaches: { Args: never; Returns: undefined }
      complete_request: {
        Args: { p_closure_reason?: string; p_request_id: string }
        Returns: Json
      }
      create_amc_alerts: { Args: never; Returns: undefined }
      create_notification: {
        Args: {
          action_url?: string
          notification_message: string
          notification_title: string
          notification_type?: string
          target_user_id: string
        }
        Returns: string
      }
      decline_request_offer: { Args: { p_request_id: string }; Returns: Json }
      decrypt_sensitive_field: {
        Args: { ciphertext: string; field_name: string; profile_id: string }
        Returns: string
      }
      encrypt_sensitive_field: {
        Args: { field_name: string; plaintext: string }
        Returns: string
      }
      end_security_shift: {
        Args: { handover_notes?: string }
        Returns: boolean
      }
      execute_workflow_trigger: {
        Args: { event_data: Json; trigger_name: string }
        Returns: string
      }
      generate_analytics_summary: {
        Args: { summary_date: string; summary_type: string }
        Returns: undefined
      }
      generate_comprehensive_analytics: {
        Args: {
          p_comparison_enabled?: boolean
          p_end_date: string
          p_start_date: string
        }
        Returns: {
          change_percentage: number
          current_period: Json
          metric_category: string
          previous_period: Json
        }[]
      }
      generate_pickup_code: { Args: never; Returns: string }
      generate_recurring_bookings: {
        Args: {
          base_booking_id: string
          end_date: string
          recurrence_rule: Json
        }
        Returns: number
      }
      generate_visitor_qr_data: { Args: { visitor_id: string }; Returns: Json }
      get_full_profile: { Args: { profile_id: string }; Returns: Json }
      get_invitation_by_token: { Args: { token: string }; Returns: Json }
      get_invitation_details: { Args: { token: string }; Returns: Json }
      get_public_profile_fields: {
        Args: { profile_id: string }
        Returns: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          avatar_url: string
          bio: string
          department: string
          designation: string
          first_name: string
          floor: string
          id: string
          interests: string[]
          last_name: string
          role: Database["public"]["Enums"]["app_role"]
          skills: string[]
          zone: string
        }[]
      }
      get_recent_sla_breaches: {
        Args: { days_back?: number }
        Returns: {
          created_at: string
          escalation_reason: string
          escalation_type: string
          id: string
          metadata: Json
          penalty_amount: number
          request_id: string
          request_priority: string
          request_sla_breach_at: string
          request_status: string
          request_title: string
        }[]
      }
      get_role_defaults: { Args: { role_slug: string }; Returns: Json }
      get_role_from_title: { Args: { input_role: string }; Returns: string }
      get_room_availability_data: {
        Args: { target_date: string }
        Returns: {
          end_time: string
          room_id: string
          start_time: string
          status: string
        }[]
      }
      get_sensitive_profile_fields: {
        Args: { profile_id: string }
        Returns: {
          email: string
          emergency_contact_name: string
          emergency_contact_phone: string
          emergency_contact_relationship: string
          employee_id: string
          government_id: string
          mobile_number: string
          office_number: string
          password_hash: string
          phone_number: string
        }[]
      }
      get_system_setting: {
        Args: { setting_category: string; setting_key: string }
        Returns: Json
      }
      get_user_display_name: { Args: { user_uuid: string }; Returns: string }
      get_user_management_data: {
        Args: { filter_property_id?: string }
        Returns: {
          approval_status: string
          approved_at: string
          approved_by: string
          assigned_role_title: string
          confirmed_at: string
          created_at: string
          department: string
          email: string
          first_name: string
          has_profile: boolean
          id: string
          is_primary: boolean
          last_name: string
          last_sign_in_at: string
          phone_number: string
          property_id: string
          property_name: string
          rejection_reason: string
          role: string
          specialization: string
          updated_at: string
        }[]
      }
      get_user_management_stats: { Args: never; Returns: Json }
      get_user_organizations: {
        Args: { _user_id: string }
        Returns: {
          organization_id: string
        }[]
      }
      get_user_permissions: { Args: { user_id: string }; Returns: Json }
      get_user_primary_property: { Args: { _user_id: string }; Returns: string }
      get_user_properties: {
        Args: { _user_id: string }
        Returns: {
          is_primary: boolean
          property_code: string
          property_id: string
          property_name: string
        }[]
      }
      get_user_role: { Args: { target_user_id: string }; Returns: string }
      get_vendor_cumulative_analytics: {
        Args: { p_period?: string; p_vendor_id: string }
        Returns: {
          average_order_value: number
          commission_earned: number
          customer_satisfaction: number
          period_end: string
          period_start: string
          total_orders: number
          total_revenue: number
        }[]
      }
      has_role:
        | { Args: { _role: string; _user_id: string }; Returns: boolean }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
      infer_main_category_id: {
        Args: { desc_text: string; title_text: string }
        Returns: string
      }
      is_admin: { Args: { uid: string }; Returns: boolean }
      is_admin_secure: { Args: { user_id: string }; Returns: boolean }
      is_approved_user: { Args: { user_id: string }; Returns: boolean }
      is_field_executive: { Args: { user_id: string }; Returns: boolean }
      is_food_vendor: { Args: { uid: string }; Returns: boolean }
      is_food_vendor_staff_for_vendor: {
        Args: { target_vendor_id: string; user_id: string }
        Returns: boolean
      }
      is_l1: { Args: { uid: string }; Returns: boolean }
      is_l2: { Args: { uid: string }; Returns: boolean }
      is_l3: { Args: { uid: string }; Returns: boolean }
      is_l4: { Args: { uid: string }; Returns: boolean }
      is_management: { Args: { uid: string }; Returns: boolean }
      is_ops_staff: { Args: { uid: string }; Returns: boolean }
      is_procurement_staff: { Args: { user_id: string }; Returns: boolean }
      is_property_manager: { Args: { user_id: string }; Returns: boolean }
      is_staff: { Args: { uid: string }; Returns: boolean }
      is_super_admin: { Args: { user_id: string }; Returns: boolean }
      is_vendor_staff_for_vendor: {
        Args: { target_vendor_id: string; user_id: string }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          action_type: string
          new_values?: Json
          old_values?: Json
          resource_id?: string
          resource_type: string
        }
        Returns: string
      }
      log_unauthorized_access_attempt: {
        Args: {
          attempted_action: string
          attempted_table: string
          user_category?: string
        }
        Returns: undefined
      }
      log_workflow_execution: {
        Args: { context: Json; log_entry: Json; rule_id: string }
        Returns: string
      }
      mark_order_paid_and_complete: {
        Args: { p_order_id: string }
        Returns: boolean
      }
      permanent_delete_old_requests: {
        Args: { days_old?: number }
        Returns: Json
      }
      reject_user: {
        Args: { approver_id: string; reason: string; target_user_id: string }
        Returns: Json
      }
      request_time_extension: {
        Args: {
          additional_hours: number
          notes?: string
          reason: string
          request_id: string
        }
        Returns: Json
      }
      resolve_app_role: {
        Args: { input_role: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      restore_soft_deleted_requests: {
        Args: { request_ids: string[] }
        Returns: Json
      }
      review_time_extension: {
        Args: { approved: boolean; extension_id: string; review_notes?: string }
        Returns: Json
      }
      role_level: {
        Args: { user_role: Database["public"]["Enums"]["app_role"] }
        Returns: string
      }
      role_requires_department: {
        Args: { user_role: Database["public"]["Enums"]["app_role"] }
        Returns: boolean
      }
      sanitize_text_input: {
        Args: { input: string; max_length?: number }
        Returns: string
      }
      set_system_setting: {
        Args: {
          setting_category: string
          setting_description?: string
          setting_key: string
          setting_type?: string
          setting_value: Json
        }
        Returns: boolean
      }
      set_vendor_qr: {
        Args: {
          p_custom_qr_url?: string
          p_use_custom?: boolean
          p_vendor_id: string
        }
        Returns: boolean
      }
      soft_delete_maintenance_requests: {
        Args: { deleted_by_user: string; request_ids: string[] }
        Returns: Json
      }
      start_security_shift: { Args: never; Returns: string }
      suggest_optimal_staff_assignment: {
        Args: {
          priority?: string
          required_skills?: string[]
          task_category: string
        }
        Returns: {
          availability_status: string
          skill_match_percentage: number
          staff_id: string
          staff_name: string
          workload_score: number
        }[]
      }
      toggle_access_point_lock: {
        Args: { lock_state: boolean; point_id: string }
        Returns: boolean
      }
      update_enhanced_staff_availability: {
        Args: {
          auto_offline_minutes?: number
          new_status: Database["public"]["Enums"]["availability_status_type"]
        }
        Returns: boolean
      }
      update_staff_availability: {
        Args: { auto_offline_minutes?: number; new_status: string }
        Returns: boolean
      }
      update_user_property_assignment: {
        Args: { new_property_id: string; target_user_id: string }
        Returns: Json
      }
      update_user_role:
        | { Args: { new_role: string; user_id: string }; Returns: boolean }
        | {
            Args: { caller_id: string; new_role: string; user_id: string }
            Returns: boolean
          }
      update_user_role_and_department: {
        Args: {
          dept?: string
          role_text: string
          spec?: string
          target_user_id: string
        }
        Returns: Json
      }
      update_user_role_safe: {
        Args: { new_role_text: string; target_user_id: string }
        Returns: boolean
      }
      user_belongs_to_property: {
        Args: { property_id: string; user_id: string }
        Returns: boolean
      }
      user_has_property_access: {
        Args: { _property_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_site_access: {
        Args: { _site_id: string; _user_id: string }
        Returns: boolean
      }
      user_in_organization: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      validate_and_create_cafeteria_order: {
        Args: {
          p_customer_instructions?: string
          p_order_items: Json
          p_pickup_time: string
          p_total_amount: number
          p_vendor_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "ops_supervisor"
        | "field_staff"
        | "tenant_manager"
        | "vendor"
        | "staff"
        | "mst"
        | "fe"
        | "hk"
        | "se"
        | "assistant_manager"
        | "assistant_floor_manager"
        | "assistant_general_manager"
        | "assistant_vice_president"
        | "vp"
        | "ceo"
        | "cxo"
        | "tenant"
        | "super_tenant"
        | "super_admin"
        | "procurement_manager"
        | "purchase_executive"
        | "property_manager"
      approval_status: "pending" | "approved" | "rejected"
      availability_status_type: "available" | "busy" | "offline" | "on_leave"
      request_priority: "low" | "medium" | "high" | "urgent"
      request_status:
        | "pending"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "assigned"
        | "en_route"
      requisition_priority: "low" | "normal" | "high" | "urgent"
      requisition_status:
        | "draft"
        | "pending_manager_approval"
        | "manager_approved"
        | "manager_rejected"
        | "assigned_to_procurement"
        | "po_raised"
        | "in_transit"
        | "received"
        | "closed"
        | "cancelled"
      sla_priority_type: "critical" | "high" | "medium" | "low"
      staff_group_type: "mst_field" | "housekeeping" | "security"
      user_category_type: "tenant" | "food_vendor" | "staff" | "admin"
      utility_type:
        | "electricity"
        | "water"
        | "gas"
        | "internet"
        | "hvac"
        | "waste_management"
      vendor_document_type:
        | "gst_certificate"
        | "tds_certificate"
        | "address_proof"
        | "identity_proof_front"
        | "identity_proof_back"
        | "other"
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
        "admin",
        "ops_supervisor",
        "field_staff",
        "tenant_manager",
        "vendor",
        "staff",
        "mst",
        "fe",
        "hk",
        "se",
        "assistant_manager",
        "assistant_floor_manager",
        "assistant_general_manager",
        "assistant_vice_president",
        "vp",
        "ceo",
        "cxo",
        "tenant",
        "super_tenant",
        "super_admin",
        "procurement_manager",
        "purchase_executive",
        "property_manager",
      ],
      approval_status: ["pending", "approved", "rejected"],
      availability_status_type: ["available", "busy", "offline", "on_leave"],
      request_priority: ["low", "medium", "high", "urgent"],
      request_status: [
        "pending",
        "in_progress",
        "completed",
        "cancelled",
        "assigned",
        "en_route",
      ],
      requisition_priority: ["low", "normal", "high", "urgent"],
      requisition_status: [
        "draft",
        "pending_manager_approval",
        "manager_approved",
        "manager_rejected",
        "assigned_to_procurement",
        "po_raised",
        "in_transit",
        "received",
        "closed",
        "cancelled",
      ],
      sla_priority_type: ["critical", "high", "medium", "low"],
      staff_group_type: ["mst_field", "housekeeping", "security"],
      user_category_type: ["tenant", "food_vendor", "staff", "admin"],
      utility_type: [
        "electricity",
        "water",
        "gas",
        "internet",
        "hvac",
        "waste_management",
      ],
      vendor_document_type: [
        "gst_certificate",
        "tds_certificate",
        "address_proof",
        "identity_proof_front",
        "identity_proof_back",
        "other",
      ],
    },
  },
} as const
