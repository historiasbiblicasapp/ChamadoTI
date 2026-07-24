import { useState, useEffect } from 'react';
import { CheckCircle2, X, UserCheck, Wrench, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';

interface ResolveTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { resolvedBy: string; solutionApplied: string; rootCause?: string }) => Promise<void>;
  isLoading?: boolean;
}

export function ResolveTicketModal({ isOpen, onClose, onConfirm, isLoading }: ResolveTicketModalProps) {
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<string>('');
  const [solutionApplied, setSolutionApplied] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [loadingTechs, setLoadingTechs] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      setLoadingTechs(true);
      try {
        const currentUser = (await supabase.auth.getUser()).data.user;
        const allUsers = await api.users.list();
        const techList = allUsers.filter((u) => u.role === 'admin' || u.role === 'analyst');
        setTechnicians(techList.length > 0 ? techList : allUsers);

        if (currentUser) {
          const isTech = techList.some((t) => t.id === currentUser.id);
          setSelectedTechId(isTech ? currentUser.id : techList[0]?.id || currentUser.id);
        } else if (techList.length > 0) {
          setSelectedTechId(techList[0].id);
        }
      } catch (e) {
      } finally {
        setLoadingTechs(false);
      }
    }

    loadData();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solutionApplied.trim()) {
      setError('Por favor, informe a solução aplicada.');
      return;
    }
    if (!selectedTechId) {
      setError('Por favor, selecione o técnico responsável.');
      return;
    }

    setError('');
    await onConfirm({
      resolvedBy: selectedTechId,
      solutionApplied: solutionApplied.trim(),
      rootCause: rootCause.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="text-base font-semibold text-gray-100">Validar e Concluir Atendimento</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-200 rounded-lg hover:bg-gray-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-netvision-400" />
              Técnico / Analista Executor *
            </label>
            {loadingTechs ? (
              <div className="text-xs text-gray-500 flex items-center gap-2 py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Carregando técnicos...
              </div>
            ) : (
              <select
                value={selectedTechId}
                onChange={(e) => setSelectedTechId(e.target.value)}
                className="select text-sm"
                required
              >
                <option value="">Selecione o técnico responsável...</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.full_name} ({tech.role === 'admin' ? 'Administrador' : 'Analista TI'})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5 flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-netvision-400" />
              Solução Aplicada *
            </label>
            <textarea
              value={solutionApplied}
              onChange={(e) => setSolutionApplied(e.target.value)}
              placeholder="Descreva detalhadamente o procedimento realizado para solucionar o chamado..."
              className="input text-sm resize-none h-28"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">
              Causa Raiz (opcional)
            </label>
            <input
              type="text"
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="Ex: Falha de hardware, erro de permissão, bug de software..."
              className="input text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary btn-sm"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-success btn-sm flex items-center gap-1.5"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Validar e Concluir
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
