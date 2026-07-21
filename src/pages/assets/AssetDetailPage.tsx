import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Monitor, Edit3, Save, Loader2, User, MapPin, Tag, Calendar, Cpu, HardDrive, Wifi, Server, Info } from 'lucide-react';
import { useAsset, useAssets } from '../../hooks/useAssets';
import type { Asset } from '../../types';
import { AssetQRCode } from '../../components/assets/AssetQRCode';
import { ASSET_TYPES, ASSET_STATUS_CONFIG } from '../../utils/constants';
import { formatDate } from '../../utils/formatters';
import { showToast } from '../../components/ui/Toaster';

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: asset, isLoading } = useAsset(id || null);
  const { updateAsset } = useAssets();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-netvision-400" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate('/assets')} className="btn-ghost btn-sm flex items-center gap-1 text-gray-400">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar
        </button>
        <div className="card flex items-center justify-center min-h-[400px]">
          <p className="text-gray-500">Ativo nao encontrado</p>
        </div>
      </div>
    );
  }

  const getTypeLabel = (type: string) => ASSET_TYPES.find((t) => t.value === type)?.label || type;
  const statusCfg = ASSET_STATUS_CONFIG[asset.status as keyof typeof ASSET_STATUS_CONFIG];

  const handleEdit = () => {
    setEditData({
      name: asset.name,
      patrimony: asset.patrimony || '',
      type: asset.type,
      brand: asset.brand || '',
      model: asset.model || '',
      serial_number: asset.serial_number || '',
      ip_address: asset.ip_address || '',
      mac_address: asset.mac_address || '',
      location: asset.location || '',
      operating_system: asset.operating_system || '',
      processor: asset.processor || '',
      ram_memory: asset.ram_memory || '',
      storage: asset.storage || '',
      notes: asset.notes || '',
      status: asset.status,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAsset.mutateAsync({ id: asset.id, updates: editData as Partial<Asset> });
      showToast('success', 'Ativo Atualizado', 'As informacoes foram salvas com sucesso!');
      setIsEditing(false);
    } catch (error: any) {
      showToast('error', 'Erro ao Salvar', error.message || 'Ocorreu um erro ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate('/assets')} className="btn-ghost btn-sm mb-2 -ml-2 flex items-center gap-1 text-gray-400">
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-netvision-600/20 border border-netvision-500/30 flex items-center justify-center">
              <Monitor className="w-6 h-6 text-netvision-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-100">{asset.name}</h1>
              {asset.patrimony && (
                <p className="text-sm text-gray-500 font-mono">Patrimonio: {asset.patrimony}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="btn-secondary btn-sm">Cancelar</button>
              <button onClick={handleSave} disabled={isSaving} className="btn-primary btn-sm flex items-center gap-1.5">
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Salvar
              </button>
            </>
          ) : (
            <button onClick={handleEdit} className="btn-secondary btn-sm flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5" />
              Editar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="card">
            <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
              <Info className="w-4 h-4" />
              Informacoes Basicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField
                icon={<Tag className="w-3.5 h-3.5" />}
                label="Tipo"
                value={getTypeLabel(asset.type)}
                editing={isEditing}
                field="type"
                onChange={handleFieldChange}
                asSelect
                options={ASSET_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              />
              <InfoField
                icon={<Info className="w-3.5 h-3.5" />}
                label="Status"
                value={statusCfg?.label || asset.status}
                editing={isEditing}
                field="status"
                onChange={handleFieldChange}
                asSelect
                options={Object.entries(ASSET_STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))}
              />
              <InfoField
                icon={<Monitor className="w-3.5 h-3.5" />}
                label="Marca"
                value={asset.brand}
                editing={isEditing}
                field="brand"
                onChange={handleFieldChange}
              />
              <InfoField
                icon={<Monitor className="w-3.5 h-3.5" />}
                label="Modelo"
                value={asset.model}
                editing={isEditing}
                field="model"
                onChange={handleFieldChange}
              />
              <InfoField
                icon={<Tag className="w-3.5 h-3.5" />}
                label="Numero de Serie"
                value={asset.serial_number}
                editing={isEditing}
                field="serial_number"
                onChange={handleFieldChange}
                mono
              />
              <InfoField
                icon={<Calendar className="w-3.5 h-3.5" />}
                label="Garantia"
                value={asset.warranty_date}
                editing={isEditing}
                field="warranty_date"
                onChange={handleFieldChange}
                asDate
              />
            </div>
          </div>

          {/* Tech Specs */}
          <div className="card">
            <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Especificacoes Tecnicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField
                icon={<Server className="w-3.5 h-3.5" />}
                label="Sistema Operacional"
                value={asset.operating_system}
                editing={isEditing}
                field="operating_system"
                onChange={handleFieldChange}
              />
              <InfoField
                icon={<Cpu className="w-3.5 h-3.5" />}
                label="Processador"
                value={asset.processor}
                editing={isEditing}
                field="processor"
                onChange={handleFieldChange}
              />
              <InfoField
                icon={<HardDrive className="w-3.5 h-3.5" />}
                label="Memoria RAM"
                value={asset.ram_memory}
                editing={isEditing}
                field="ram_memory"
                onChange={handleFieldChange}
              />
              <InfoField
                icon={<HardDrive className="w-3.5 h-3.5" />}
                label="Armazenamento"
                value={asset.storage}
                editing={isEditing}
                field="storage"
                onChange={handleFieldChange}
              />
            </div>
          </div>

          {/* Network Info */}
          <div className="card">
            <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              Rede
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField
                icon={<Wifi className="w-3.5 h-3.5" />}
                label="IP"
                value={asset.ip_address}
                editing={isEditing}
                field="ip_address"
                onChange={handleFieldChange}
                mono
              />
              <InfoField
                icon={<Wifi className="w-3.5 h-3.5" />}
                label="MAC"
                value={asset.mac_address}
                editing={isEditing}
                field="mac_address"
                onChange={handleFieldChange}
                mono
              />
            </div>
          </div>

          {/* Location & User */}
          <div className="card">
            <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Localizacao e Usuario
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField
                icon={<MapPin className="w-3.5 h-3.5" />}
                label="Local"
                value={asset.location}
                editing={isEditing}
                field="location"
                onChange={handleFieldChange}
              />
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30">
                <User className="w-3.5 h-3.5 text-gray-500 mt-1 shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Responsavel</p>
                  <p className="text-sm text-gray-200">{asset.user?.full_name || 'Nao atribuido'}</p>
                </div>
              </div>
              {asset.department && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30">
                  <Server className="w-3.5 h-3.5 text-gray-500 mt-1 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Setor</p>
                    <p className="text-sm text-gray-200">{asset.department.name}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {asset.notes && (
            <div className="card">
              <h3 className="text-sm font-medium text-gray-400 mb-3">Observacoes</h3>
              {isEditing ? (
                <textarea
                  value={editData['notes'] || ''}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  className="input resize-none h-24"
                />
              ) : (
                <p className="text-sm text-gray-300 whitespace-pre-wrap">{asset.notes}</p>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* QR Code */}
          <div className="card flex flex-col items-center">
            <h3 className="text-sm font-medium text-gray-400 mb-4">QR Code</h3>
            <AssetQRCode assetId={asset.id} assetName={asset.name} patrimony={asset.patrimony || undefined} />
          </div>

          {/* Metadata */}
          <div className="card">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Metadados</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500">Criado em</p>
                <p className="text-sm text-gray-300">{formatDate(asset.created_at)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Atualizado em</p>
                <p className="text-sm text-gray-300">{formatDate(asset.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface InfoFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  editing: boolean;
  field: string;
  onChange: (field: string, value: string) => void;
  mono?: boolean;
  asSelect?: boolean;
  asDate?: boolean;
  options?: { value: string; label: string }[];
}

function InfoField({ icon, label, value, editing, field, onChange, mono, asSelect, asDate, options }: InfoFieldProps) {
  if (editing) {
    if (asSelect && options) {
      return (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30">
          <div className="text-gray-500 mt-1 shrink-0">{icon}</div>
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <select value={value || ''} onChange={(e) => onChange(field, e.target.value)} className="select !py-1.5 text-sm">
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      );
    }
    return (
      <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30">
        <div className="text-gray-500 mt-1 shrink-0">{icon}</div>
        <div className="flex-1">
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <input
            type={asDate ? 'date' : 'text'}
            value={value || ''}
            onChange={(e) => onChange(field, e.target.value)}
            className={`input !py-1.5 text-sm ${mono ? 'font-mono' : ''}`}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/30">
      <div className="text-gray-500 mt-1 shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`text-sm text-gray-200 ${mono ? 'font-mono' : ''}`}>{value || '-'}</p>
      </div>
    </div>
  );
}
