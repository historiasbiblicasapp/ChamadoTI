import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import type { Ticket, TicketStatus, TicketPriority } from '../types';

interface TicketFilters {
  status?: TicketStatus;
  priority?: TicketPriority;
  assigned_to?: string;
}

export function useTickets(filters?: TicketFilters) {
  const queryClient = useQueryClient();

  const query = useQuery<Ticket[]>({
    queryKey: ['tickets', filters],
    queryFn: () => api.tickets.list(filters),
    refetchInterval: 30000,
  });

  const createTicket = useMutation({
    mutationFn: (ticket: Partial<Ticket>) => api.tickets.create(ticket),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }),
  });

  const updateTicket = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Ticket> }) =>
      api.tickets.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
    },
  });

  const addComment = useMutation({
    mutationFn: ({ ticketId, content, isInternal }: { ticketId: string; content: string; isInternal?: boolean }) =>
      api.tickets.addComment(ticketId, content, isInternal),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticketId] });
    },
  });

  const deleteTicket = useMutation({
    mutationFn: (id: string) => api.tickets.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticket-stats'] });
    },
  });

  return {
    tickets: query.data || [],
    isLoading: query.isLoading,
    error: query.error,
    createTicket,
    updateTicket,
    addComment,
    deleteTicket,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['tickets'] }),
  };
}

export function useTicket(id: string | null) {
  return useQuery<Ticket | null>({
    queryKey: ['ticket', id],
    queryFn: async () => {
      if (!id) return null;
      return api.tickets.get(id);
    },
    enabled: !!id,
  });
}

export function useTicketStats() {
  return useQuery({
    queryKey: ['ticket-stats'],
    queryFn: () => api.tickets.getStats(),
    refetchInterval: 10000,
  });
}

export function useDashboardByMonth(months = 12) {
  return useQuery<{ name: string; value: number }[]>({
    queryKey: ['dashboard-by-month', months],
    queryFn: () => api.tickets.getByMonth(months),
    refetchInterval: 60000,
  });
}

export function useDashboardByCategory() {
  return useQuery<{ name: string; value: number }[]>({
    queryKey: ['dashboard-by-category'],
    queryFn: () => api.tickets.getByCategory(),
    refetchInterval: 60000,
  });
}

export function useDashboardByDepartment() {
  return useQuery<{ name: string; value: number }[]>({
    queryKey: ['dashboard-by-department'],
    queryFn: () => api.tickets.getByDepartment(),
    refetchInterval: 60000,
  });
}

export function useDashboardByPriority() {
  return useQuery<{ name: string; value: number }[]>({
    queryKey: ['dashboard-by-priority'],
    queryFn: () => api.tickets.getByPriority(),
    refetchInterval: 60000,
  });
}

export function useDashboardAvgTimes() {
  return useQuery<{ avgAttendance: number; avgResolution: number }>({
    queryKey: ['dashboard-avg-times'],
    queryFn: () => api.tickets.getAvgTimes(),
    refetchInterval: 60000,
  });
}

export function useDashboardRecent(limit = 10) {
  return useQuery<any[]>({
    queryKey: ['dashboard-recent', limit],
    queryFn: () => api.tickets.getRecent(limit),
    refetchInterval: 15000,
  });
}

export function useDashboardSlaAlerts() {
  return useQuery<any[]>({
    queryKey: ['dashboard-sla-alerts'],
    queryFn: () => api.tickets.getSlaAlerts(),
    refetchInterval: 15000,
  });
}
