import { useState, useMemo } from 'react';
import { ArrowLeft, Users, Search, Shield, Mail, Phone, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { Profile } from '../../types';
import { formatDate } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';
import { showToast } from '../../components/ui/Toaster';
import { Loader2 } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador',
  analyst: 'Analista de TI',
  user: 'Usuario',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-400',
  analyst: 'bg-netvision-500/20 text-netvision-400',
  user: 'bg-blue-500/20 text-blue-400',
};

export function UsersPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: users, isLoading } = useQuery<Profile[]>({
    queryKey: ['users'],
    queryFn: () => api.users.list(),
    refetchInterval: 30000,
  });

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => api.users.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('success', 'Perfil Atualizado', 'A role do usuario foi atualizada com sucesso!');
    },
    onError: (error: any) => {
      showToast('error', 'Erro', error.message || 'Nao foi possivel atualizar o perfil.');
    },
  });

  const filtered = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      return !search ||
        u.full_name.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase());
    });
  }, [users, search]);

  const isAdmin = profile?.role === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <button onClick={() => navigate('/dashboard')} className="btn-ghost btn-sm mb-2 -ml-2 flex items-center gap-1 text-gray-400">
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </button>
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Usuarios</h1>
              <p className="text-sm text-gray-500 mt-1">Gerenciamento de usuarios do sistema</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar por nome ou perfil..."
          className="input pl-10"
        />
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="table-header">Usuario</th>
                <th className="table-header">Perfil</th>
                <th className="table-header">Telefone</th>
                <th className="table-header">Criado em</th>
                {isAdmin && <th className="table-header">Acoes</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Carregando...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-500">Nenhum usuario encontrado</td>
                </tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-netvision-600/30 flex items-center justify-center text-netvision-400 text-sm font-bold shrink-0">
                          {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-200">{user.full_name}</p>
                          <p className="text-xs text-gray-500">ID: {user.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[user.role] || ''}`}>
                        <Shield className="w-3 h-3" />
                        {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td className="table-cell text-sm text-gray-400">{user.phone || '-'}</td>
                    <td className="table-cell text-xs text-gray-500">{formatDate(user.created_at)}</td>
                    {isAdmin && (
                      <td className="table-cell">
                        <select
                          value={user.role}
                          onChange={(e) => {
                            if (confirm(`Alterar perfil de ${user.full_name} para ${ROLE_LABELS[e.target.value]}?`)) {
                              updateRole.mutate({ id: user.id, role: e.target.value });
                            }
                          }}
                          className="select !py-1 !px-2 text-xs !w-auto"
                          disabled={user.id === profile?.id}
                        >
                          <option value="user">Usuario</option>
                          <option value="analyst">Analista</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <p className="text-xs text-gray-500">
          <strong>Nota:</strong> Novos usuarios sao criados automaticamente ao fazerem login pela primeira vez.
          Para alterar o perfil de um usuario, selecione a nova role na coluna "Acoes".
        </p>
      </div>
    </div>
  );
}
