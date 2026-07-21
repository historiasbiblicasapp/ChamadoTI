import { useState, useEffect } from 'react';
import { ArrowLeft, Settings, Save, Loader2, Clock, Shield, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import type { SLARule, Setting } from '../../types';
import { PRIORITIES } from '../../utils/constants';
import { showToast } from '../../components/ui/Toaster';

export function SettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const { data: slaRules, isLoading: slaLoading } = useQuery<SLARule[]>({
    queryKey: ['sla-rules'],
    queryFn: () => api.sla.list(),
  });

  const { data: settings, isLoading: settingsLoading } = useQuery<Setting[]>({
    queryKey: ['settings'],
    queryFn: () => api.settings.list(),
  });

  const [slaHours, setSlaHours] = useState<Record<string, number>>({});

  useEffect(() => {
    if (slaRules) {
      const hours: Record<string, number> = {};
      slaRules.forEach((rule) => {
        hours[rule.priority] = rule.hours;
      });
      setSlaHours(hours);
    }
  }, [slaRules]);

  const updateSla = useMutation({
    mutationFn: (rules: { priority: string; hours: number }[]) => api.sla.updateMany(rules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-rules'] });
      showToast('success', 'SLA Atualizado', 'As regras de SLA foram salvas com sucesso!');
    },
    onError: (error: any) => {
      showToast('error', 'Erro', error.message || 'Nao foi possivel salvar as regras de SLA.');
    },
  });

  const handleSaveSla = async () => {
    setIsSaving(true);
    try {
      const rules = Object.entries(slaHours).map(([priority, hours]) => ({
        priority,
        hours: Number(hours),
      }));
      await updateSla.mutateAsync(rules);
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = slaLoading || settingsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/dashboard')} className="btn-ghost btn-sm mb-2 -ml-2 flex items-center gap-1 text-gray-400">
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </button>
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Configuracoes</h1>
              <p className="text-sm text-gray-500 mt-1">Configuracoes gerais do sistema</p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-netvision-400" />
        </div>
      ) : (
        <>
          {/* SLA Rules */}
          <div className="card">
            <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Regras de SLA (horas)
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Configure o tempo maximo de atendimento para cada nivel de prioridade.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(PRIORITIES).map(([key, config]) => (
                <div key={key} className="p-4 rounded-xl bg-gray-800/30 border border-gray-700/50">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full ${config.bgColor.replace('/20', '')}`} />
                    <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={slaHours[key] || 0}
                      onChange={(e) => setSlaHours((prev) => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="input !py-1.5 text-sm w-20"
                    />
                    <span className="text-xs text-gray-500">horas</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={handleSaveSla} disabled={isSaving} className="btn-primary btn-sm flex items-center gap-1.5">
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Salvar SLA
              </button>
            </div>
          </div>

          {/* System Info */}
          <div className="card">
            <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Informacoes do Sistema
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-gray-800/30">
                <p className="text-xs text-gray-500">Nome do Sistema</p>
                <p className="text-sm text-gray-200 font-medium">ChamadosTiRaitz</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-800/30">
                <p className="text-xs text-gray-500">Versao</p>
                <p className="text-sm text-gray-200 font-medium">1.0.0</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-800/30">
                <p className="text-xs text-gray-500">Backend</p>
                <p className="text-sm text-gray-200 font-medium">Supabase</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-800/30">
                <p className="text-xs text-gray-500">Frontend</p>
                <p className="text-sm text-gray-200 font-medium">React + TypeScript + Vite</p>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card border-red-500/30">
            <h3 className="text-sm font-medium text-red-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Zona de Perigo
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Acoes irreversiveis. Tenha cuidado ao utilizar estas funcionalidades.
            </p>
            <div className="flex gap-3">
              <button className="btn-secondary btn-sm text-red-400 border-red-500/30 hover:bg-red-500/10" disabled>
                Limpar Cache do Sistema
              </button>
              <button className="btn-secondary btn-sm text-red-400 border-red-500/30 hover:bg-red-500/10" disabled>
                Resetar Dados de Teste
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
