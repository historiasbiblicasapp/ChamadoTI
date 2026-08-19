import { supabase } from '../lib/supabase';
import { calculateSLARemaining } from '../utils/formatters';
import { SLA_HOURS, DEFAULT_ANALYST_EMAIL } from '../utils/constants';
import type { Ticket, Profile, Asset, Department, TicketCategory, SLARule, KnowledgeArticle, Notification, AuditLog, Setting } from '../types';

export const api = {
  // Auth
  auth: {
    signIn: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    resetPassword: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    },
    getUser: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    },
    getProfile: async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  },

  // Tickets
  tickets: {
    list: async (filters?: { status?: string; priority?: string; assigned_to?: string }) => {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          requester:profiles!tickets_requester_id_fkey(full_name, role),
          assignee:profiles!tickets_assigned_to_fkey(full_name),
          category:ticket_categories(name, icon),
          department:departments(name),
           asset:assets(name, patrimony)
         `)
         .order('created_at', { ascending: false });

       if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.priority) query = query.eq('priority', filters.priority);
      if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to);

      const { data, error } = await query;
      if (error) throw error;
      return data as Ticket[];
    },
    get: async (id: string) => {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          requester:profiles!tickets_requester_id_fkey(full_name, role, phone),
          assignee:profiles!tickets_assigned_to_fkey(full_name),
          category:ticket_categories(name, icon),
          department:departments(name),
          asset:assets(name, patrimony, type, brand, model),
          comments:ticket_comments(*, author:profiles(full_name)),
          files:ticket_files(*, uploader:profiles(full_name)),
          history:ticket_history(*, user:profiles(full_name))
        `)
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Ticket;
    },
    create: async (ticket: Partial<Ticket>) => {
      const { data: { user } } = await supabase.auth.getUser();
      let analystId: string | null = null;
      try {
        const { data } = await supabase
          .rpc('get_profile_id_by_email', { p_email: DEFAULT_ANALYST_EMAIL });
        analystId = data;
      } catch (e) {
        console.warn('RPC get_profile_id_by_email não disponível, pulando analista padrão');
      }
      const payload = { ...ticket, requester_id: user?.id, assigned_to: analystId };
      console.log('Creating ticket with payload:', payload);
      const { data, error } = await supabase
        .from('tickets')
        .insert(payload)
        .select()
        .single();
      if (error) {
        console.error('Erro ao criar ticket:', error);
        throw error;
      }
      return data as Ticket;
    },
    update: async (id: string, updates: Partial<Ticket>) => {
      const { data, error } = await supabase
        .from('tickets')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Ticket;
    },
    delete: async (id: string) => {
      const { error } = await supabase.from('tickets').delete().eq('id', id);
      if (error) throw error;
    },
    addComment: async (ticketId: string, content: string, isInternal = false) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('ticket_comments')
        .insert({ ticket_id: ticketId, author_id: user?.id, content, is_internal: isInternal })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    getStats: async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const sla24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      const [open, inProgress, pending, resolved, total, sla, today, week] = await Promise.all([
        supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
        supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('tickets').select('id', { count: 'exact', head: true }).in('status', ['pending', 'waiting_user', 'waiting_parts', 'waiting_supplier']),
        supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('status', 'resolved'),
        supabase.from('tickets').select('id', { count: 'exact', head: true }),
        supabase.from('tickets').select('id', { count: 'exact', head: true })
          .neq('status', 'resolved')
          .neq('status', 'cancelled')
          .lt('created_at', sla24h),
        supabase.from('tickets').select('id', { count: 'exact', head: true }).gte('created_at', todayStart),
        supabase.from('tickets').select('id', { count: 'exact', head: true }).gte('created_at', weekStart),
      ]);
      return {
        open: open.count || 0,
        inProgress: inProgress.count || 0,
        pending: pending.count || 0,
        resolved: resolved.count || 0,
        total: total.count || 0,
        slaExpired: sla.count || 0,
        today: today.count || 0,
        week: week.count || 0,
      };
    },

    getByMonth: async (months = 12) => {
      const { data, error } = await supabase.rpc('get_tickets_by_month', { months_count: months });
      if (error) {
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - months);
        const { data: fallback } = await supabase
          .from('tickets')
          .select('created_at')
          .gte('created_at', cutoff.toISOString())
          .order('created_at');
        if (!fallback) return [];
        const grouped: Record<string, number> = {};
        fallback.forEach((t) => {
          const d = new Date(t.created_at);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          grouped[key] = (grouped[key] || 0) + 1;
        });
        return Object.entries(grouped).map(([name, value]) => ({ name, value }));
      }
      return data || [];
    },

    getByCategory: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('category:ticket_categories(name)');
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data as any[]).forEach((t) => {
        const name = t.category?.name || 'Sem Categoria';
        counts[name] = (counts[name] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    },

    getByDepartment: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('department:departments(name)');
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data as any[]).forEach((t) => {
        const name = t.department?.name || 'Sem Setor';
        counts[name] = (counts[name] || 0) + 1;
      });
      return Object.entries(counts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    },

    getByPriority: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('priority');
      if (error) throw error;
      const labels: Record<string, string> = { low: 'Baixa', medium: 'Media', high: 'Alta', critical: 'Critica' };
      const counts: Record<string, number> = {};
      (data as any[]).forEach((t) => {
        const name = labels[t.priority] || t.priority;
        counts[name] = (counts[name] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },

    getAvgTimes: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('created_at, resolved_at')
        .not('resolved_at', 'is', null);
      if (error || !data || data.length === 0) {
        return { avgAttendance: 0, avgResolution: 0 };
      }
      let totalAttendance = 0;
      let totalResolution = 0;
      let attendanceCount = 0;
      data.forEach((t) => {
        const created = new Date(t.created_at).getTime();
        const resolved = new Date(t.resolved_at).getTime();
        totalResolution += resolved - created;
      });
      return {
        avgAttendance: 0,
        avgResolution: totalResolution / data.length / (1000 * 60 * 60),
      };
    },

    getRecent: async (limit = 10) => {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id, ticket_number, title, status, priority, created_at,
          requester_name,
          requester:profiles!tickets_requester_id_fkey(full_name),
          category:ticket_categories(name)
        `)
         .order('created_at', { ascending: false })
         .limit(limit);
       if (error) throw error;
       return data as any[];
     },

     getSlaAlerts: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id, ticket_number, title, priority, created_at, status,
          requester_name,
          requester:profiles!tickets_requester_id_fkey(full_name)
        `)
        .neq('status', 'resolved')
        .neq('status', 'cancelled')
        .order('created_at', { ascending: true })
        .limit(20);
      if (error) throw error;
      return data as any[];
    },

    resolveAllExpired: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('id, priority, created_at, status')
        .neq('status', 'resolved')
        .neq('status', 'cancelled');
      if (error) throw error;

      const now = Date.now();
      const expiredTickets = (tickets as any[]).filter((t) => {
        const slaHours = SLA_HOURS[t.priority] || 24;
        const sla = calculateSLARemaining(t.created_at, slaHours);
        return sla.isExpired;
      });

      for (const ticket of expiredTickets) {
        await supabase.from('tickets').update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id,
          solution_applied: 'Chamado resolvido em lote - SLA vencido',
          updated_at: new Date().toISOString(),
        }).eq('id', ticket.id);

        await supabase.from('ticket_history').insert({
          ticket_id: ticket.id,
          user_id: user?.id,
          action: 'status_changed',
          old_value: ticket.status,
          new_value: 'resolved',
        });
      }

      return expiredTickets.length;
    },

    getByPublicToken: async (token: string) => {
      const { data, error } = await supabase.rpc('get_ticket_by_public_token', { p_token: token });
      if (error) throw error;
      return data as any[];
    },

    revokePublicToken: async (ticketId: string) => {
      const { data, error } = await supabase.rpc('revoke_public_token', { p_ticket_id: ticketId });
      if (error) throw error;
      return data as boolean;
    },

    regeneratePublicToken: async (ticketId: string) => {
      const { data, error } = await supabase.rpc('regenerate_public_token', { p_ticket_id: ticketId });
      if (error) throw error;
      return data as string;
    },
  },

  // Assets
  assets: {
    list: async (filters?: { type?: string; status?: string }) => {
      let query = supabase
        .from('assets')
        .select(`
          *,
          user:profiles!assets_user_id_fkey(full_name),
          department:departments(name)
        `)
        .order('created_at', { ascending: false });

      if (filters?.type) query = query.eq('type', filters.type);
      if (filters?.status) query = query.eq('status', filters.status);

      const { data, error } = await query;
      if (error) throw error;
      return data as Asset[];
    },
    get: async (id: string) => {
      const { data, error } = await supabase
        .from('assets')
        .select(`
          *,
          user:profiles!assets_user_id_fkey(full_name, phone),
          department:departments(name)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Asset;
    },
    create: async (asset: Partial<Asset>) => {
      const { data, error } = await supabase
        .from('assets')
        .insert(asset)
        .select()
        .single();
      if (error) throw error;
      return data as Asset;
    },
    update: async (id: string, updates: Partial<Asset>) => {
      const { data, error } = await supabase
        .from('assets')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Asset;
    },
    getStats: async () => {
      const [total, active, maintenance, retired, inStock, byType] = await Promise.all([
        supabase.from('assets').select('id', { count: 'exact', head: true }),
        supabase.from('assets').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('assets').select('id', { count: 'exact', head: true }).eq('status', 'maintenance'),
        supabase.from('assets').select('id', { count: 'exact', head: true }).eq('status', 'retired'),
        supabase.from('assets').select('id', { count: 'exact', head: true }).eq('status', 'in_stock'),
        supabase.from('assets').select('type'),
      ]);

      const typeCounts: Record<string, number> = {};
      (byType.data || []).forEach((a) => {
        typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
      });

      return {
        total: total.count || 0,
        active: active.count || 0,
        maintenance: maintenance.count || 0,
        retired: retired.count || 0,
        inStock: inStock.count || 0,
        byType: Object.entries(typeCounts).map(([type, count]) => ({ type, count })),
      };
    },
  },

  // Departments
  departments: {
    list: async () => {
      const { data, error } = await supabase.from('departments').select('*').order('name');
      if (error) throw error;
      return data as Department[];
    },
  },

  // Categories
  categories: {
    list: async () => {
      const { data, error } = await supabase.from('ticket_categories').select('*').order('name');
      if (error) throw error;
      return data as TicketCategory[];
    },
  },

  // Knowledge Base
  knowledge: {
    list: async (filters?: { category?: string; search?: string }) => {
      let query = supabase
        .from('knowledge_base')
        .select(`
          *,
          author:profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (filters?.category) query = query.eq('category', filters.category);
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as KnowledgeArticle[];
    },
    get: async (id: string) => {
      const { data, error } = await supabase
        .from('knowledge_base')
        .select(`
          *,
          author:profiles(full_name)
        `)
        .eq('id', id)
        .single();
      if (error) throw error;

      await supabase
        .from('knowledge_base')
        .update({ views: (data.views || 0) + 1 })
        .eq('id', id);

      return data as KnowledgeArticle;
    },
    create: async (article: Partial<KnowledgeArticle> & { tags?: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('knowledge_base')
        .insert({ ...article, author_id: user?.id })
        .select()
        .single();
      if (error) throw error;
      return data as KnowledgeArticle;
    },
    update: async (id: string, updates: Partial<KnowledgeArticle>) => {
      const { data, error } = await supabase
        .from('knowledge_base')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as KnowledgeArticle;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('knowledge_base')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
  },

  // Notifications
  notifications: {
    list: async (limit = 50) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as Notification[];
    },
    markAsRead: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      if (error) throw error;
    },
    markAllAsRead: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);
      if (error) throw error;
    },
    delete: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    create: async (notification: { user_id: string; title: string; message: string; type?: string; reference_id?: string; reference_type?: string }) => {
      const { data, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select()
        .single();
      if (error) throw error;
      return data as Notification;
    },
  },

  // Users
  users: {
    list: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      if (error) throw error;
      return data as Profile[];
    },
    updateRole: async (id: string, role: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      // Log audit
      await supabase.from('audit_logs').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: 'user_role_changed',
        entity_type: 'profile',
        entity_id: id,
        new_value: role,
      });

      return data as Profile;
    },
  },

  // Settings
  settings: {
    list: async () => {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      return data as Setting[];
    },
    get: async (key: string) => {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', key)
        .single();
      if (error) throw error;
      return data as Setting;
    },
    upsert: async (key: string, value: unknown) => {
      const { data, error } = await supabase
        .from('settings')
        .upsert({ key, value, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return data as Setting;
    },
  },

  // SLA Rules
  sla: {
    list: async () => {
      const { data, error } = await supabase.from('sla_rules').select('*');
      if (error) throw error;
      return data as SLARule[];
    },
    updateMany: async (rules: { priority: string; hours: number }[]) => {
      for (const rule of rules) {
        const { error } = await supabase
          .from('sla_rules')
          .update({ hours: rule.hours })
          .eq('priority', rule.priority);
        if (error) throw error;
      }
    },
  },

  // Audit Logs
  audit: {
    list: async (limit = 200) => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as AuditLog[];
    },
  },
};
