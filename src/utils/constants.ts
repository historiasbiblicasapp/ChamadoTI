export const TICKET_CATEGORIES = [
  { value: 'computador', label: 'Computador', icon: 'Monitor' },
  { value: 'notebook', label: 'Notebook', icon: 'Laptop' },
  { value: 'monitor', label: 'Monitor', icon: 'Monitor' },
  { value: 'impressora', label: 'Impressora', icon: 'Printer' },
  { value: 'rede', label: 'Rede', icon: 'Network' },
  { value: 'internet', label: 'Internet', icon: 'Globe' },
  { value: 'wifi', label: 'Wi-Fi', icon: 'Wifi' },
  { value: 'telefonia', label: 'Telefonia', icon: 'Phone' },
  { value: 'telefone_voip', label: 'Telefone VoiP', icon: 'Phone' },
  { value: 'smartphone_software', label: 'Smartphone Software', icon: 'Smartphone' },
  { value: 'desenvolvimento_app', label: 'Desenvolvimento APP', icon: 'Code' },
  { value: 'windows', label: 'Windows', icon: 'Monitor' },
  { value: 'microsoft_office', label: 'Microsoft Office', icon: 'FileText' },
  { value: 'email', label: 'E-mail', icon: 'Mail' },
  { value: 'erp', label: 'ERP', icon: 'Database' },
  { value: 'sistema_interno', label: 'Sistema Interno', icon: 'AppWindow' },
  { value: 'hardware', label: 'Hardware', icon: 'Cpu' },
  { value: 'software', label: 'Software', icon: 'Disc' },
  { value: 'servidor', label: 'Servidor', icon: 'Server' },
  { value: 'backup', label: 'Backup', icon: 'HardDrive' },
  { value: 'seguranca', label: 'Seguranca', icon: 'Shield' },
  { value: 'outro', label: 'Outro', icon: 'HelpCircle' },
] as const;

export const PRIORITIES = {
  low: {
    label: 'Baixa',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
  },
  medium: {
    label: 'Média',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500/30',
  },
  high: {
    label: 'Alta',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
  },
  critical: {
    label: 'Crítica',
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
  },
} as const;

export const STATUSES = {
  open: { label: 'Aberta', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  pending: { label: 'Pendente', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  in_progress: { label: 'Em Desenvolvimento', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  waiting_user: { label: 'Aguardando Usuário', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  waiting_parts: { label: 'Aguardando Revisão', color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
  waiting_supplier: { label: 'Aguardando Deploy', color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
  resolved: { label: 'Concluída', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  cancelled: { label: 'Cancelada', color: 'text-red-400', bgColor: 'bg-red-500/20' },
} as const;

export const SLA_HOURS: Record<string, number> = {
  low: 48,
  medium: 24,
  high: 8,
  critical: 2,
};

export const ASSET_TYPES = [
  { value: 'computer', label: 'Computador' },
  { value: 'notebook', label: 'Notebook' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'printer', label: 'Impressora' },
  { value: 'switch', label: 'Switch' },
  { value: 'router', label: 'Roteador' },
  { value: 'access_point', label: 'Access Point' },
  { value: 'server', label: 'Servidor' },
  { value: 'nobreak', label: 'Nobreak' },
  { value: 'other', label: 'Outro' },
] as const;

export const ASSET_STATUS_CONFIG = {
  active: { label: 'Ativo', color: 'text-green-400', bgColor: 'bg-green-500/20' },
  maintenance: { label: 'Manutenção', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
  retired: { label: 'Aposentado', color: 'text-red-400', bgColor: 'bg-red-500/20' },
  in_stock: { label: 'Em Estoque', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
} as const;

export const PERIOD_OPTIONS = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
] as const;

export const KNOWLEDGE_CATEGORIES = [
  { value: 'tutorial', label: 'Tutorial' },
  { value: 'how_to', label: 'Como Fazer' },
  { value: 'faq', label: 'FAQ' },
  { value: 'troubleshooting', label: 'Solucao de Problemas' },
  { value: 'policy', label: 'Politica' },
  { value: 'setup', label: 'Configuracao' },
  { value: 'security', label: 'Seguranca' },
  { value: 'software', label: 'Software' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'network', label: 'Rede' },
  { value: 'other', label: 'Outro' },
] as const;

export const DEFAULT_ANALYST_EMAIL = 'wellington.s@galvanizacaoraitz.com.br';
