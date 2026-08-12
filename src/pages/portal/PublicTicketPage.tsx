import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Send, CheckCircle, Copy, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ ticket_number: number; ticket_id: string; public_token: string } | null>(null);
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
      const ticketId = data.id as string;
      let publicToken = data.public_token as string | undefined;
      if (!publicToken) {
        publicToken = Math.random().toString(36).substring(2, 14).toUpperCase();
        supabase.from('tickets').update({ public_token: publicToken, public_tracking_enabled: true }).eq('id', ticketId).then(() => {});
      }
      setSuccess({ ticket_number: data.ticket_number, ticket_id: ticketId, public_token: publicToken });
      const stored = JSON.parse(localStorage.getItem('my_ticket_ids') || '[]');
      if (!stored.includes(ticketId)) {
        stored.push(ticketId);
        localStorage.setItem('my_ticket_ids', JSON.stringify(stored));
      }
    } catch (err: any) {
      setErrors({ submit: err.message || 'Erro ao abrir chamado' });
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const trackingUrl = `${appUrl}/acompanhar/${success.public_token}`;

    const copyToClipboard = async (text: string, label: string) => {
      await navigator.clipboard.writeText(text);
    };

    const shareTicket = async () => {
      const shareData = {
        title: `Chamado #${String(success.ticket_number).padStart(4, '0')}`,
        text: `Acompanhe seu chamado de TI: ${trackingUrl}`,
        url: trackingUrl,
      };
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(trackingUrl);
      }
    };

    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-start p-4">
        <ThemeToggle />
        <div className="w-full max-w-md text-center pt-8">
          <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">Chamado Aberto!</h1>
          <p className="text-gray-500 mb-4">Seu chamado foi registrado com sucesso.</p>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-4 text-left space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Numero do chamado</p>
              <p className="text-netvision-400 font-mono text-lg font-bold">
                #{String(success.ticket_number).padStart(4, '0')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Codigo de acompanhamento</p>
              <p className="text-gray-200 font-mono text-sm font-medium">{success.public_token}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Link de acompanhamento</p>
              <p className="text-gray-400 text-xs break-all">{trackingUrl}</p>
            </div>
          </div>

          <div className="flex flex-col items-center mb-4">
            <div className="bg-white p-3 rounded-xl mb-2">
              <QRCodeSVG value={trackingUrl} size={160} />
            </div>
            <p className="text-xs text-gray-500">Aponte a camera do celular para acompanhar seu chamado</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => copyToClipboard(trackingUrl, 'Link copiado!')}
              className="btn-primary flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copiar Link
            </button>
            <button
              onClick={() => copyToClipboard(success.public_token, 'Codigo copiado!')}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copiar Codigo
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => window.open(trackingUrl, '_blank')}
              className="btn-success flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Abrir Acompanhamento
            </button>
            <button
              onClick={shareTicket}
              className="btn-secondary flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Compartilhar
            </button>
          </div>

          <button
            onClick={() => {
              setSuccess(null);
              setForm({ title: '', description: '', priority: 'medium', requester_name: '', requester_phone: '', requester_email: '', department: '', lgpd_consent: false });
            }}
            className="btn-secondary w-full"
          >
            Abrir outro chamado
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-start p-4">
      <ThemeToggle />
      <div className="w-full max-w-lg pt-8">
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
