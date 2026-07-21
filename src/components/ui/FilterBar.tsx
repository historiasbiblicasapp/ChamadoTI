interface Props {
  filter: string;
  onChange: (filter: string) => void;
  options: { value: string; label: string }[];
}

export function FilterBar({ filter, onChange, options }: Props) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filter === opt.value
              ? 'bg-netvision-600/20 text-netvision-400 border border-netvision-500/30'
              : 'text-gray-500 hover:text-gray-300 bg-gray-800 border border-gray-700 hover:border-gray-600'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
