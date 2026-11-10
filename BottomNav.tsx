import { ClipboardList, Home, Search, UserRound, type LucideIcon } from 'lucide-react';

export type TabId = 'home' | 'search' | 'duty' | 'profile';

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'search', label: 'Find blood', icon: Search },
  { id: 'duty', label: 'Duty', icon: ClipboardList },
  { id: 'profile', label: 'Profile', icon: UserRound },
];

export function BottomNav({
  active,
  onChange,
  showDuty,
}: {
  active: TabId;
  onChange: (tab: TabId) => void;
  showDuty: boolean;
}) {
  const tabs = TABS.filter((t) => t.id !== 'duty' || showDuty);

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 border-t border-gray-200 bg-white/95 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur"
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onChange(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px] font-semibold transition-colors duration-200 ${
                  isActive ? 'text-brand-600' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition-all duration-300 ${
                    isActive ? 'bg-brand-50 scale-100' : 'scale-95'
                  }`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                </span>
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
