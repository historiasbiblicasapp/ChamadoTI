export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">{title}</h1>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <div className="card flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-gray-500">Em desenvolvimento</p>
          <p className="text-xs text-gray-600 mt-1">Esta pagina sera implementada nas proximas fases</p>
        </div>
      </div>
    </div>
  );
}
