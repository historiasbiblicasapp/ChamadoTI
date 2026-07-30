export type UserRole = 'admin' | 'analyst' | 'user';

export type TicketStatus =
  | 'open'
  | 'pending'
  | 'in_progress'
  | 'waiting_user'
  | 'waiting_parts'
  | 'waiting_supplier'
  | 'resolved'
  | 'cancelled';

export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export type AssetStatus = 'active' | 'maintenance' | 'retired' | 'in_stock';

export type MaintenanceStatus = 'pending' | 'completed' | 'overdue';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  department_id: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  ticket_number: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
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
  scheduled_date: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
  custom_fields: Record<string, any> | null;
  requester?: Profile;
  assignee?: Profile;
  category?: TicketCategory;
  department?: Department;
  asset?: Asset;
  comments?: TicketComment[];
  files?: TicketFile[];
  history?: TicketHistory[];
}

export interface TicketComment {
  id: string;
  ticket_id: string;
  author_id: string;
  content: string;
  is_internal: boolean;
  created_at: string;
  author?: Profile;
}

export interface TicketFile {
  id: string;
  ticket_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_by: string;
  created_at: string;
  uploader?: Profile;
}

export interface TicketHistory {
  id: string;
  ticket_id: string;
  user_id: string;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  user?: Profile;
}

export interface TicketCategory {
  id: string;
  name: string;
  icon: string | null;
  parent_id: string | null;
  created_at: string;
}

export interface Asset {
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
  status: AssetStatus;
  created_at: string;
  updated_at: string;
  user?: Profile;
  department?: Department;
}

export interface Maintenance {
  id: string;
  asset_id: string;
  type: string;
  description: string | null;
  periodicity: string | null;
  last_maintenance: string | null;
  next_maintenance: string | null;
  status: MaintenanceStatus;
  technician_id: string | null;
  created_at: string;
  asset?: Asset;
  technician?: Profile;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string | null;
  tags: string[] | null;
  author_id: string;
  views: number;
  created_at: string;
  updated_at: string;
  author?: Profile;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string | null;
  reference_id: string | null;
  reference_type: string | null;
  read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_value: unknown;
  new_value: unknown;
  ip_address: string | null;
  created_at: string;
  user?: Profile;
}

export interface SLARule {
  id: string;
  priority: TicketPriority;
  hours: number;
  created_at: string;
}

export interface Setting {
  id: string;
  key: string;
  value: unknown;
  updated_at: string;
}
