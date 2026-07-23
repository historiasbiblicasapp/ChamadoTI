import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Send, Save, Trash2 } from 'lucide-react';
import { TICKET_CATEGORIES, PRIORITIES } from '../../utils/constants';
import { CameraAttachment } from '../ui/CameraAttachment';
import { useOfflineDraft } from '../../hooks/useOfflineDraft';
import { showToast } from '../ui/Toaster';

export interface CustomFieldDef {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: string[];
  required?: boolean;
}

const ticketSchema = z.object({
  title: z.string().min(5, 'Titulo deve ter no minimo 5 caracteres').max(200),
  description: z.string().min(10, 'Descricao deve ter no minimo 10 caracteres'),
  category_id: z.string().min(1, 'Selecione uma categoria'),
  priority: z.enum(['low', 'medium', 'high', 'critical'], { required_error: 'Selecione a prioridade' }),
  scheduled_date: z.string().optional(),
  location: z.string().optional(),
  custom_fields: z.record(z.any()).optional(),
});

type TicketFormData = z.infer<typeof ticketSchema>;

interface TicketFormProps {
  onSubmit: (data: TicketFormData & { files?: File[] }) => Promise<void>;
  isLoading?: boolean;
  defaultValues?: Partial<TicketFormData>;
  submitLabel?: string;
  customFieldDefs?: CustomFieldDef[];
  customFieldValues?: Record<string, any>;
}

export function TicketForm({ onSubmit, isLoading, defaultValues, submitLabel, customFieldDefs, customFieldValues }: TicketFormProps) {
  const { saveDraft, getSavedDraft, clearDraft, hasDraft } = useOfflineDraft<TicketFormData>('new_ticket');
  const savedDraft = getSavedDraft();
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      priority: 'medium',
      scheduled_date: new Date().toISOString().split('T')[0],
      custom_fields: customFieldValues || {},
      ...savedDraft,
      ...defaultValues,
    },
  });

  const watchAllFields = watch();

  // Auto save draft to LocalStorage when user changes fields
  useEffect(() => {
    if (watchAllFields.title || watchAllFields.description) {
      saveDraft(watchAllFields);
    }
  }, [watchAllFields.title, watchAllFields.description, watchAllFields.category_id, watchAllFields.priority, watchAllFields.location]);

  const customFields = watch('custom_fields') || {};

  const handleCustomFieldChange = (name: string, value: any) => {
    const current = watch('custom_fields') || {};
    setValue('custom_fields', { ...current, [name]: value }, { shouldValidate: false });
  };

  const handleFormSubmit = async (data: TicketFormData) => {
    try {
      await onSubmit({ ...data, files: attachedFiles });
      clearDraft();
    } catch (e) {
      // Form submission error handled by parent
    }
  };

  const handleClearDraft = () => {
    clearDraft();
    reset({
      title: '',
      description: '',
      location: '',
      category_id: '',
      priority: 'medium',
      scheduled_date: new Date().toISOString().split('T')[0],
    });
    setAttachedFiles([]);
    showToast('info', 'Rascunho descartado', 'O formulário foi limpo.');
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {hasDraft() ? (
        <div className="p-3 bg-netvision-600/10 border border-netvision-500/20 rounded-xl flex items-center justify-between text-xs text-netvision-400">
          <div className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            <span>Rascunho salvo automaticamente no dispositivo.</span>
          </div>
          <button
            type="button"
            onClick={handleClearDraft}
            className="text-red-400 hover:text-red-300 font-medium flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Descartar Rascunho
          </button>
        </div>
      ) : null}

      <div>
        <label className="block text-sm font-medium text-gray-400 mb-1.5">Data do Chamado</label>
        <input
          type="date"
          {...register('scheduled_date')}
          className="input max-w-xs"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Titulo *</label>
          <input
            type="text"
            {...register('title')}
            className="input"
            placeholder="Resumo do problema"
            disabled={isLoading}
          />
          {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Local</label>
          <input
            type="text"
            {...register('location')}
            className="input max-w-md"
            placeholder="Sala, andar, predio..."
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-1.5">Descricao *</label>
          <textarea
            {...register('description')}
            className="input resize-none h-32"
            placeholder="Descreva detalhadamente a solicitacao ou problema..."
            disabled={isLoading}
          />
          {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Categoria *</label>
            <select {...register('category_id')} className="select" disabled={isLoading}>
              <option value="">Selecione...</option>
              {TICKET_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
            {errors.category_id && <p className="text-xs text-red-400 mt-1">{errors.category_id.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Prioridade *</label>
            <select {...register('priority')} className="select" disabled={isLoading}>
              {Object.entries(PRIORITIES).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            {errors.priority && <p className="text-xs text-red-400 mt-1">{errors.priority.message}</p>}
          </div>
        </div>

        {/* Camera / File Attachment Section */}
        <div className="border-t border-gray-800 pt-4">
          <label className="block text-sm font-medium text-gray-400 mb-2">Anexos e Fotos da Câmera</label>
          <CameraAttachment files={attachedFiles} onFilesChange={setAttachedFiles} disabled={isLoading} />
        </div>
      </div>

      {customFieldDefs && customFieldDefs.length > 0 && (
        <div className="border-t border-gray-800 pt-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Campos Personalizados</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {customFieldDefs.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">
                  {field.label}{field.required && ' *'}
                </label>
                {field.type === 'text' && (
                  <input
                    type="text"
                    value={customFields[field.name] || ''}
                    onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                    className="input"
                    disabled={isLoading}
                  />
                )}
                {field.type === 'number' && (
                  <input
                    type="number"
                    value={customFields[field.name] || ''}
                    onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                    className="input"
                    disabled={isLoading}
                  />
                )}
                {field.type === 'select' && (
                  <select
                    value={customFields[field.name] || ''}
                    onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                    className="select"
                    disabled={isLoading}
                  >
                    <option value="">Selecione...</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
                {field.type === 'textarea' && (
                  <textarea
                    value={customFields[field.name] || ''}
                    onChange={(e) => handleCustomFieldChange(field.name, e.target.value)}
                    className="input resize-none h-20"
                    disabled={isLoading}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
        <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {submitLabel || 'Abrindo Chamado...'}
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              {submitLabel || 'Abrir Chamado'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}

