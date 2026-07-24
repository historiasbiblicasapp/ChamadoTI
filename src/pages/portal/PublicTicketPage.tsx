import { useState } from 'react';
import { Loader2, Send, CheckCircle } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { PRIORITIES } from '../../utils/constants';
import { ThemeToggle } from '../../components/ui/ThemeToggle';
import type { TicketPriority } from '../../types';

const schema = z.object({
  title: z.string().min(5, 'Titulo deve ter no minimo 5 caracteres').max(200),
  description: z.string().min(10, 'Descricao deve ter no minimo 10 caracteres'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  requester_name: z.string().min(2, 'Informe seu nome'),
  requester_phone: z.string().optional(),
  requester_email: z.string().email('Email invalido').optional().or(z.literal('')),
  department: z.string().optional(),
  lgpd_consent: z.literal(true, { errorMap: () => ({ message: 'Voce precisa aceitar a politica de privacidade' }) }),
});

type FormData = z.infer<typeof schema>;

export function PublicTicketPage() {
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ ticket_number: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as TicketPriority,
    requester_name: '',
    requester_phone: '',
    requester_email: '',
    department: '',
    lgpd_consent: false,
  });

  const set = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc('create_public_ticket', {
        p_title: form.title,
        p_description: form.description,
        p_priority: form.priority,
        p_requester_name: form.requester_name,
        p_requester_phone: form.requester_phone || null,
        p_requester_email: form.requester_email || null,
        p_department: form.department || null,
        p_lgpd_consent: true,
      });

      if (error) throw error;
      setSuccess({ ticket_number: data.ticket_number });
    } catch (err: any) {
      setErrors({ submit: err.message || 'Erro ao abrir chamado' });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <ThemeToggle />
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">Chamado Aberto!</h1>
          <p className="text-gray-500 mb-2">Seu chamado foi registrado com sucesso.</p>
          <p className="text-netvision-400 font-mono text-lg mb-6">
            Numero: #{String(success.ticket_number).padStart(4, '0')}
          </p>
          <p className="text-xs text-gray-600 mb-6">
            Guarde este numero para acompanhar seu atendimento.
          </p>
          <button
            onClick={() => {
              setSuccess(null);
              setForm({ title: '', description: '', priority: 'medium', requester_name: '', requester_phone: '', requester_email: '', department: '', lgpd_consent: false });
            }}
            className="btn-primary"
          >
            Abrir outro chamado
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <ThemeToggle />
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <img src="/logo.jpeg" alt="Logo" className="w-16 h-16 rounded-2xl object-cover mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-100">ChamadosTiRaitz</h1>
          <p className="text-sm text-gray-500 mt-1">Abrir Chamado de Suporte</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Seu Nome *</label>
              <input
                type="text"
                value={form.requester_name}
                onChange={(e) => set('requester_name', e.target.value)}
                className="input"
                placeholder="Nome completo"
                disabled={submitting}
              />
              {errors.requester_name && <p className="text-xs text-red-400 mt-1">{errors.requester_name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Telefone</label>
                <input
                  type="text"
                  value={form.requester_phone}
                  onChange={(e) => set('requester_phone', e.target.value)}
                  className="input"
                  placeholder="(11) 99999-9999"
                  disabled={submitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.requester_email}
                  onChange={(e) => set('requester_email', e.target.value)}
                  className="input"
                  placeholder="seu@email.com"
                  disabled={submitting}
                />
                {errors.requester_email && <p className="text-xs text-red-400 mt-1">{errors.requester_email}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Setor</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => set('department', e.target.value)}
                className="input"
                placeholder="Seu setor/departamento"
                disabled={submitting}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Titulo do Problema *</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                className="input"
                placeholder="Resumo do problema"
                disabled={submitting}
                maxLength={200}
              />
              {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Descricao *</label>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className="input resize-none h-28"
                placeholder="Descreva o problema detalhadamente..."
                disabled={submitting}
              />
              {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1.5">Prioridade</label>
              <select
                value={form.priority}
                onChange={(e) => set('priority', e.target.value)}
                className="select"
                disabled={submitting}
              >
                {Object.entries(PRIORITIES).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            </div>

            {/* LGPD Consent */}
            <div className="border-t border-gray-800 pt-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.lgpd_consent}
                  onChange={(e) => set('lgpd_consent', e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-gray-800 text-netvision-500 focus:ring-netvision-500"
                  disabled={submitting}
                />
                <span className="text-xs text-gray-500 leading-relaxed">
                  Li e concordo com a{' '}
                  <a href="/privacidade" target="_blank" className="text-netvision-400 hover:text-netvision-300 underline">
                    Politica de Privacidade
                  </a>
                  . Autorizo o tratamento dos meus dados pessoais conforme a LGPD (Lei 13.709/2018) para fins de abertura e acompanhamento de chamados de suporte tecnico.
                </span>
              </label>
              {errors.lgpd_consent && <p className="text-xs text-red-400 mt-1">{errors.lgpd_consent}</p>}
            </div>

            {errors.submit && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <p className="text-xs text-red-400">{errors.submit}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Abrir Chamado
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          ChamadosTiRaitz v1.0 - Sistema de Suporte de TI
        </p>
      </div>
    </div>
  );
}
