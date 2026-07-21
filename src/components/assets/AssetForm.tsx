import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save } from 'lucide-react';
import { ASSET_TYPES, ASSET_STATUS_CONFIG } from '../../utils/constants';

const assetSchema = z.object({
  patrimony: z.string().optional(),
  name: z.string().min(2, 'Nome e obrigatorio'),
  type: z.string().min(1, 'Selecione o tipo'),
  brand: z.string().optional(),
  model: z.string().optional(),
  serial_number: z.string().optional(),
  ip_address: z.string().optional(),
  mac_address: z.string().optional(),
  location: z.string().optional(),
  department_id: z.string().optional(),
  user_id: z.string().optional(),
  operating_system: z.string().optional(),
  processor: z.string().optional(),
  ram_memory: z.string().optional(),
  storage: z.string().optional(),
  warranty_date: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'maintenance', 'retired', 'in_stock']),
});

type AssetFormData = z.infer<typeof assetSchema>;

interface AssetFormProps {
  initialData?: Partial<AssetFormData>;
  onSubmit: (data: AssetFormData) => Promise<void>;
  isLoading?: boolean;
}

export function AssetForm({ initialData, onSubmit, isLoading }: AssetFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      status: 'active',
      ...initialData,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Informacoes Basicas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Nome *</label>
            <input {...register('name')} className="input" placeholder="Nome do equipamento" disabled={isLoading} />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Patrimonio</label>
            <input {...register('patrimony')} className="input" placeholder="PAT-0001" disabled={isLoading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Tipo *</label>
            <select {...register('type')} className="select" disabled={isLoading}>
              <option value="">Selecione...</option>
              {ASSET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {errors.type && <p className="text-xs text-red-400 mt-1">{errors.type.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Status</label>
            <select {...register('status')} className="select" disabled={isLoading}>
              {Object.entries(ASSET_STATUS_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Marca</label>
            <input {...register('brand')} className="input" placeholder="Dell, HP, Lenovo..." disabled={isLoading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Modelo</label>
            <input {...register('model')} className="input" placeholder="Modelo do equipamento" disabled={isLoading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Numero de Serie</label>
            <input {...register('serial_number')} className="input font-mono" placeholder="SN12345678" disabled={isLoading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">IP</label>
            <input {...register('ip_address')} className="input font-mono" placeholder="192.168.0.100" disabled={isLoading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">MAC</label>
            <input {...register('mac_address')} className="input font-mono" placeholder="00:1A:2B:3C:4D:5E" disabled={isLoading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Local</label>
            <input {...register('location')} className="input" placeholder="Sala, andar..." disabled={isLoading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Garantia</label>
            <input {...register('warranty_date')} type="date" className="input" disabled={isLoading} />
          </div>
        </div>
      </div>

      {/* Tech Specs */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Especificacoes Tecnicas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Sistema Operacional</label>
            <input {...register('operating_system')} className="input" placeholder="Windows 11, Ubuntu..." disabled={isLoading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Processador</label>
            <input {...register('processor')} className="input" placeholder="Intel i7, AMD Ryzen 5..." disabled={isLoading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Memoria RAM</label>
            <input {...register('ram_memory')} className="input" placeholder="16GB DDR4" disabled={isLoading} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1.5">Armazenamento</label>
            <input {...register('storage')} className="input" placeholder="512GB SSD NVMe" disabled={isLoading} />
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="card">
        <h3 className="text-sm font-medium text-gray-400 mb-4">Observacoes</h3>
        <textarea {...register('notes')} className="input resize-none h-24" placeholder="Observacoes sobre o equipamento..." disabled={isLoading} />
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
        <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar
            </>
          )}
        </button>
      </div>
    </form>
  );
}
