import { useState, type FormEvent } from 'react';
import { HeartPulse, Search, ShieldAlert, UserPlus, Droplet } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { Card, SectionHeader } from '@/components/ui/Primitives';
import { EmergencyTicker, UrgentRequestCard } from '@/components/home/EmergencyTicker';
import { RequestBloodModal } from '@/components/request/RequestBloodModal';
import type { Urgency } from '@/types';

const URGENCY_ORDER: Record<Urgency, number> = { critical: 0, urgent: 1, normal: 2 };

export function HomeScreen({ onSearch }: { onSearch: (query: string) => void }) {
  const { state, registerAsDonor } = useApp();
  const user = state.user!;
  const [query, setQuery] = useState('');
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestUrgency, setRequestUrgency] = useState<Urgency>('normal');

  const openRequest = (urgency: Urgency) => {
    setRequestUrgency(urgency);
    setRequestOpen(true);
  };

  const activeRequests = state.requests
    .filter((r) => r.status !== 'fulfilled' && r.urgency !== 'normal')
    .sort(
      (a, b) =>
        URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency] ||
        Number(b.location.district === user.location.district) - Number(a.location.district === user.location.district) ||
        new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
    );

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim());
  };

  const quickActions = [
    {
      label: 'Request Blood',
      text: 'Post a request',
      icon: Droplet,
      onClick: () => openRequest('urgent'),
      tone: 'bg-white text-gray-900 ring-gray-200',
      iconTone: 'bg-brand-50 text-brand-600',
    },
    {
      label: 'Register as Donor',
      text: 'Save lives',
      icon: UserPlus,
      onClick: registerAsDonor,
      tone: 'bg-white text-gray-900 ring-gray-200',
      iconTone: 'bg-emerald-50 text-emerald-600',
    },
    {
      label: 'Emergency SOS',
      text: 'Critical now',
      icon: ShieldAlert,
      onClick: () => openRequest('critical'),
      tone: 'bg-brand-600 text-white ring-brand-600',
      iconTone: 'bg-white/20 text-white',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">Hello, {user.name.split(' ')[0]}</p>
          <h1 className="truncate text-2xl font-extrabold text-gray-900">
            {user.location.thana}, {user.location.district}
          </h1>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm shadow-brand-600/30">
          <HeartPulse size={22} />
        </div>
      </header>

      <EmergencyTicker requests={activeRequests.filter((r) => r.urgency === 'critical')} />

      <form onSubmit={handleSearch} role="search" className="relative">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search blood group (e.g. O+) or area"
          aria-label="Search blood group or area"
          className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-11 pr-24 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
        <button
          type="submit"
          className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-xl bg-gray-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-gray-800 active:scale-95"
        >
          Find
        </button>
      </form>

      <section className="grid grid-cols-3 gap-3" aria-label="Quick actions">
        {quickActions.map(({ label, text, icon: Icon, onClick, tone, iconTone }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className={`group flex flex-col items-start gap-3 rounded-3xl p-3.5 text-left shadow-sm ring-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] sm:p-4 ${tone}`}
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl transition group-hover:scale-105 ${iconTone}`}>
              <Icon size={20} />
            </span>
            <span>
              <span className="block text-xs font-bold leading-tight sm:text-sm">{label}</span>
              <span className="mt-0.5 block text-[11px] opacity-75">{text}</span>
            </span>
          </button>
        ))}
      </section>

      <section>
        <SectionHeader
          title="Urgent requests near you"
          action={<span className="text-xs font-semibold text-gray-500">{activeRequests.length} active</span>}
        />
        {activeRequests.length === 0 ? (
          <Card className="text-center text-sm text-gray-600">No urgent requests right now. Thank you for staying ready.</Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {activeRequests.map((r) => (
              <UrgentRequestCard key={r.id} request={r} />
            ))}
          </div>
        )}
      </section>

      <RequestBloodModal open={requestOpen} onClose={() => setRequestOpen(false)} defaultUrgency={requestUrgency} />
    </div>
  );
}
