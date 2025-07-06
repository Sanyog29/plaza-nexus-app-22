export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
          id: string
          image_url: string | null
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
        }
        Relationships: []
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
          created_at: string
          id: string
          pickup_time: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pickup_time: string
          status?: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          pickup_time?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      loyalty_points: {
        Row: {
          id: string
          points: number
          total_earned: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          points?: number
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          points?: number
          total_earned?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
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
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points: number
          transaction_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_id?: string | null
          points?: number
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "cafeteria_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_categories: {
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
      order_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          notes: string | null
          order_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          notes?: string | null
          order_id?: string | null
          quantity: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          notes?: string | null
          order_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          first_name: string | null
          floor: string | null
          id: string
          last_name: string | null
          office_number: string | null
          phone_number: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          zone: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          first_name?: string | null
          floor?: string | null
          id: string
          last_name?: string | null
          office_number?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          zone?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          first_name?: string | null
          floor?: string | null
          id?: string
          last_name?: string | null
          office_number?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          zone?: string | null
        }
        Relationships: []
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
          created_at: string
          description: string | null
          end_time: string
          id: string
          room_id: string
          start_time: string
          status: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          room_id: string
          start_time: string
          status?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          room_id?: string
          start_time?: string
          status?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_bookings_room_id_fkey"
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
          booking_date: string
          booking_time: string
          created_at: string
          id: string
          notes: string | null
          service_item_id: string | null
          status: string
          total_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          created_at?: string
          id?: string
          notes?: string | null
          service_item_id?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          created_at?: string
          id?: string
          notes?: string | null
          service_item_id?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_bookings_service_item_id_fkey"
            columns: ["service_item_id"]
            isOneToOne: false
            referencedRelation: "service_items"
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
      calculate_daily_metrics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_utility_consumption: {
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
      generate_analytics_summary: {
        Args: { summary_date: string; summary_type: string }
        Returns: undefined
      }
      generate_visitor_qr_data: {
        Args: { visitor_id: string }
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
      get_user_permissions: {
        Args: { user_id: string }
        Returns: Json
      }
      is_admin: {
        Args: { uid: string }
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
      start_security_shift: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      update_user_role: {
        Args:
          | { user_id: string; new_role: string }
          | { user_id: string; new_role: string; caller_id: string }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
