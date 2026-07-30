import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: 'admin' | 'analyst' | 'user';
          department_id: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      departments: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['departments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['departments']['Insert']>;
      };
      tickets: {
        Row: {
          id: string;
          ticket_number: number;
          title: string;
          description: string;
          status: 'open' | 'pending' | 'in_progress' | 'waiting_user' | 'waiting_parts' | 'waiting_supplier' | 'resolved' | 'cancelled';
          priority: 'low' | 'medium' | 'high' | 'critical';
          category_id: string | null;
          subcategory: string | null;
          requester_id: string;
          assigned_to: string | null;
          department_id: string | null;
          location: string | null;
          phone: string | null;
          asset_id: string | null;
          root_cause: string | null;
          solution_applied: string | null;
          satisfaction_rating: number | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['tickets']['Row'], 'id' | 'ticket_number' | 'created_at' | 'updated_at' | 'resolved_at'>;
        Update: Partial<Database['public']['Tables']['tickets']['Insert']>;
      };
      ticket_comments: {
        Row: {
          id: string;
          ticket_id: string;
          author_id: string;
          content: string;
          is_internal: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ticket_comments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['ticket_comments']['Insert']>;
      };
      ticket_files: {
        Row: {
          id: string;
          ticket_id: string;
          file_name: string;
          file_url: string;
          file_size: number | null;
          file_type: string | null;
          uploaded_by: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ticket_files']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['ticket_files']['Insert']>;
      };
      ticket_history: {
        Row: {
          id: string;
          ticket_id: string;
          user_id: string;
          action: string;
          old_value: string | null;
          new_value: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ticket_history']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['ticket_history']['Insert']>;
      };
      ticket_categories: {
        Row: {
          id: string;
          name: string;
          icon: string | null;
          parent_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['ticket_categories']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['ticket_categories']['Insert']>;
      };
      assets: {
        Row: {
          id: string;
          patrimony: string | null;
          name: string;
          type: string;
          brand: string | null;
          model: string | null;
          serial_number: string | null;
          ip_address: string | null;
          mac_address: string | null;
          location: string | null;
          department_id: string | null;
          user_id: string | null;
          operating_system: string | null;
          processor: string | null;
          ram_memory: string | null;
          storage: string | null;
          warranty_date: string | null;
          notes: string | null;
          status: 'active' | 'maintenance' | 'retired' | 'in_stock';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['assets']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['assets']['Insert']>;
      };
      maintenance: {
        Row: {
          id: string;
          asset_id: string;
          type: string;
          description: string | null;
          periodicity: string | null;
          last_maintenance: string | null;
          next_maintenance: string | null;
          status: 'pending' | 'completed' | 'overdue';
          technician_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['maintenance']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['maintenance']['Insert']>;
      };
      knowledge_base: {
        Row: {
          id: string;
          title: string;
          content: string;
          category: string | null;
          tags: string[] | null;
          author_id: string;
          views: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['knowledge_base']['Row'], 'id' | 'views' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['knowledge_base']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string | null;
          reference_id: string | null;
          reference_type: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };
      settings: {
        Row: {
          id: string;
          key: string;
          value: unknown;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['settings']['Row'], 'id' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['settings']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          entity_type: string | null;
          entity_id: string | null;
          old_value: unknown;
          new_value: unknown;
          ip_address: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
      sla_rules: {
        Row: {
          id: string;
          priority: 'low' | 'medium' | 'high' | 'critical';
          hours: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['sla_rules']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['sla_rules']['Insert']>;
      };
    };
  };
};
