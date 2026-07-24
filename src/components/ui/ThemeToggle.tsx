import { useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [showMenu, setShowMenu] = useState(false);

  const options = [
    { value: 'light' as const, icon: Sun, label: 'Claro' },
    { value: 'dark' as const, icon: Moon, label: 'Escuro' },
    { value: 'system' as const, icon: Monitor, label: 'Sistema' },
  ];

  const current = options.find((o) => o.value === theme) || options[2];

  useEffect(() => {
    if (!showMenu) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showMenu]);

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-2 rounded-xl bg-gray-800/80 backdrop-blur-sm border border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-all"
        title={`Tema: ${current.label}`}
      >
        <current.icon className="w-4 h-4" />
      </button>
      {showMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 mt-2 w-36 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
            {options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => { setTheme(opt.value); setShowMenu(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                  theme === opt.value
                    ? 'bg-netvision-600/20 text-netvision-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
                }`}
              >
                <opt.icon className="w-4 h-4" />
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
