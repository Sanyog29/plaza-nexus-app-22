export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
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
          purchase_date?: string | null
          serial_number?: string | null
          service_frequency_months?: number | null
          status?: string
          updated_at?: string
          warranty_expiry?: string | null
          zone?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
          commission_amount: number | null
          created_at: string
          customer_instructions: string | null
          discount_applied: number | null
          feedback_submitted_at: string | null
          feedback_text: string | null
          id: string
          is_scheduled: boolean | null
          offer_code_used: string | null
          order_type: string | null
          pickup_time: string
          preparation_time_minutes: number | null
          rating: number | null
          scheduled_pickup_time: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
          vendor_id: string | null
          vendor_payout_amount: number | null
        }
        Insert: {
          commission_amount?: number | null
          created_at?: string
          customer_instructions?: string | null
          discount_applied?: number | null
          feedback_submitted_at?: string | null
          feedback_text?: string | null
          id?: string
          is_scheduled?: boolean | null
          offer_code_used?: string | null
          order_type?: string | null
          pickup_time: string
          preparation_time_minutes?: number | null
          rating?: number | null
          scheduled_pickup_time?: string | null
          status?: string
          total_amount: number
          updated_at?: string
          user_id: string
          vendor_id?: string | null
          vendor_payout_amount?: number | null
        }
        Update: {
          commission_amount?: number | null
          created_at?: string
          customer_instructions?: string | null
          discount_applied?: number | null
          feedback_submitted_at?: string | null
          feedback_text?: string | null
          id?: string
          is_scheduled?: boolean | null
          offer_code_used?: string | null
          order_type?: string | null
          pickup_time?: string
          preparation_time_minutes?: number | null
          rating?: number | null
          scheduled_pickup_time?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
          vendor_payout_amount?: number | null
        }
        Relationships: [
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
            foreignKeyName: "content_items_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        ]
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
            foreignKeyName: "daily_checklists_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "deliveries_pickup_by_fkey"
            columns: ["pickup_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "escalation_logs_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          assigned_to: string | null
          category_id: string | null
          completed_at: string | null
          created_at: string
          description: string
          estimated_completion: string | null
          id: string
          location: string
          priority: Database["public"]["Enums"]["request_priority"]
          reported_by: string | null
          sla_breach_at: string | null
          status: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category_id?: string | null
          completed_at?: string | null
          created_at?: string
          description: string
          estimated_completion?: string | null
          id?: string
          location: string
          priority?: Database["public"]["Enums"]["request_priority"]
          reported_by?: string | null
          sla_breach_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string
          estimated_completion?: string | null
          id?: string
          location?: string
          priority?: Database["public"]["Enums"]["request_priority"]
          reported_by?: string | null
          sla_breach_at?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "maintenance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "meal_subscriptions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
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
      profile_audit_logs: {
        Row: {
          action_type: string
          changed_by: string | null
          changes: Json
          id: string
          ip_address: unknown | null
          profile_id: string
          timestamp: string | null
          user_agent: string | null
        }
        Insert: {
          action_type: string
          changed_by?: string | null
          changes: Json
          id?: string
          ip_address?: unknown | null
          profile_id: string
          timestamp?: string | null
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          changed_by?: string | null
          changes?: Json
          id?: string
          ip_address?: unknown | null
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
            foreignKeyName: "profile_audit_logs_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approval_status: Database["public"]["Enums"]["approval_status"]
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          department: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relationship: string | null
          first_name: string | null
          floor: string | null
          id: string
          interests: string[] | null
          last_name: string | null
          notification_preferences: Json | null
          office_number: string | null
          phone_number: string | null
          profile_visibility: string | null
          rejection_reason: string | null
          role: Database["public"]["Enums"]["app_role"]
          skills: string[] | null
          updated_at: string
          zone: string | null
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name?: string | null
          floor?: string | null
          id: string
          interests?: string[] | null
          last_name?: string | null
          notification_preferences?: Json | null
          office_number?: string | null
          phone_number?: string | null
          profile_visibility?: string | null
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          skills?: string[] | null
          updated_at?: string
          zone?: string | null
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["approval_status"]
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          department?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relationship?: string | null
          first_name?: string | null
          floor?: string | null
          id?: string
          interests?: string[] | null
          last_name?: string | null
          notification_preferences?: Json | null
          office_number?: string | null
          phone_number?: string | null
          profile_visibility?: string | null
          rejection_reason?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          skills?: string[] | null
          updated_at?: string
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
      request_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          request_id: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          request_id?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          request_id?: string | null
          uploaded_by?: string
        }
        Relationships: [
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
            foreignKeyName: "request_status_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
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
            foreignKeyName: "service_providers_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "shift_change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
        ]
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
            foreignKeyName: "staff_skills_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "task_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
            foreignKeyName: "task_assignments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
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
      user_invitations: {
        Row: {
          created_at: string
          department: string | null
          email: string
          expires_at: string
          first_name: string | null
          floor: string | null
          id: string
          invitation_token: string
          invited_by: string | null
          last_name: string | null
          office_number: string | null
          phone_number: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          email: string
          expires_at?: string
          first_name?: string | null
          floor?: string | null
          id?: string
          invitation_token?: string
          invited_by?: string | null
          last_name?: string | null
          office_number?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          email?: string
          expires_at?: string
          first_name?: string | null
          floor?: string | null
          id?: string
          invitation_token?: string
          invited_by?: string | null
          last_name?: string | null
          office_number?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
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
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
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
          id: string
          image_url: string | null
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
          id?: string
          image_url?: string | null
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
          id?: string
          image_url?: string | null
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
      vendor_staff: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          permissions: Json | null
          role: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          role?: string
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          role?: string
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
          average_rating: number | null
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
          stall_location: string | null
          total_orders: number | null
          updated_at: string
        }
        Insert: {
          average_rating?: number | null
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
          stall_location?: string | null
          total_orders?: number | null
          updated_at?: string
        }
        Update: {
          average_rating?: number | null
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
          stall_location?: string | null
          total_orders?: number | null
          updated_at?: string
        }
        Relationships: []
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
      [_ in never]: never
    }
    Functions: {
      admin_create_user_invitation: {
        Args: {
          invitation_email: string
          invitation_first_name: string
          invitation_last_name: string
          invitation_role: string
          invitation_department?: string
          invitation_phone_number?: string
          invitation_office_number?: string
          invitation_floor?: string
        }
        Returns: Json
      }
      admin_delete_user: {
        Args: { target_user_id: string }
        Returns: Json
      }
      approve_user: {
        Args: { target_user_id: string; approver_id: string }
        Returns: boolean
      }
      calculate_cross_module_kpis: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_daily_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_staff_workload_score: {
        Args: { target_staff_id: string }
        Returns: number
      }
      calculate_user_performance_score: {
        Args: { target_user_id: string; score_date?: string }
        Returns: Json
      }
      calculate_utility_consumption: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_vendor_daily_analytics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_sla_breaches: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_amc_alerts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_notification: {
        Args: {
          target_user_id: string
          notification_title: string
          notification_message: string
          notification_type?: string
          action_url?: string
        }
        Returns: string
      }
      end_security_shift: {
        Args: { handover_notes?: string }
        Returns: boolean
      }
      execute_workflow_trigger: {
        Args: { trigger_name: string; event_data: Json }
        Returns: string
      }
      generate_analytics_summary: {
        Args: { summary_date: string; summary_type: string }
        Returns: undefined
      }
      generate_pickup_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_recurring_bookings: {
        Args: {
          base_booking_id: string
          recurrence_rule: Json
          end_date: string
        }
        Returns: number
      }
      generate_visitor_qr_data: {
        Args: { visitor_id: string }
        Returns: Json
      }
      get_invitation_details: {
        Args: { token: string }
        Returns: Json
      }
      get_recent_sla_breaches: {
        Args: { days_back?: number }
        Returns: {
          id: string
          request_id: string
          escalation_type: string
          penalty_amount: number
          escalation_reason: string
          created_at: string
          metadata: Json
          request_title: string
          request_priority: string
          request_status: string
          request_sla_breach_at: string
        }[]
      }
      get_system_setting: {
        Args: { setting_category: string; setting_key: string }
        Returns: Json
      }
      get_user_management_data: {
        Args: Record<PropertyKey, never> | { caller_id: string }
        Returns: {
          id: string
          first_name: string
          last_name: string
          role: string
          created_at: string
          updated_at: string
          email: string
          confirmed_at: string
          last_sign_in_at: string
        }[]
      }
      get_user_management_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_permissions: {
        Args: { user_id: string }
        Returns: Json
      }
      is_admin: {
        Args: { uid: string }
        Returns: boolean
      }
      is_approved_user: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_ops_staff: {
        Args: { uid: string }
        Returns: boolean
      }
      is_staff: {
        Args: { uid: string }
        Returns: boolean
      }
      is_vendor_staff_for_vendor: {
        Args: { user_id: string; target_vendor_id: string }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          action_type: string
          resource_type: string
          resource_id?: string
          old_values?: Json
          new_values?: Json
        }
        Returns: string
      }
      log_workflow_execution: {
        Args: { rule_id: string; context: Json; log_entry: Json }
        Returns: string
      }
      reject_user: {
        Args: { target_user_id: string; approver_id: string; reason: string }
        Returns: boolean
      }
      set_system_setting: {
        Args: {
          setting_category: string
          setting_key: string
          setting_value: Json
          setting_type?: string
          setting_description?: string
        }
        Returns: boolean
      }
      start_security_shift: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      suggest_optimal_staff_assignment: {
        Args: {
          task_category: string
          required_skills?: string[]
          priority?: string
        }
        Returns: {
          staff_id: string
          staff_name: string
          workload_score: number
          skill_match_percentage: number
          availability_status: string
        }[]
      }
      update_user_role: {
        Args:
          | { user_id: string; new_role: string }
          | { user_id: string; new_role: string; caller_id: string }
        Returns: boolean
      }
      update_user_role_safe: {
        Args: { target_user_id: string; new_role_text: string }
        Returns: boolean
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
      approval_status: "pending" | "approved" | "rejected"
      request_priority: "low" | "medium" | "high" | "urgent"
      request_status: "pending" | "in_progress" | "completed" | "cancelled"
      utility_type:
        | "electricity"
        | "water"
        | "gas"
        | "internet"
        | "hvac"
        | "waste_management"
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
      ],
      approval_status: ["pending", "approved", "rejected"],
      request_priority: ["low", "medium", "high", "urgent"],
      request_status: ["pending", "in_progress", "completed", "cancelled"],
      utility_type: [
        "electricity",
        "water",
        "gas",
        "internet",
        "hvac",
        "waste_management",
      ],
    },
  },
} as const
