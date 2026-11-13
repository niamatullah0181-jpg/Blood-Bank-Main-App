import { useState, type ReactNode } from 'react';
import { BellRing, ClipboardList, Droplet, ListChecks, ShieldCheck } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { Card, Badge } from '@/components/ui/Primitives';
import { TasksPanel } from '@/components/volunteer/TasksPanel';
import { PermissionReviewPanel } from '@/components/volunteer/PermissionReviewPanel';
import { RequestStatusPanel } from '@/components/volunteer/RequestStatusPanel';
import { FieldLogPanel } from '@/components/volunteer/FieldLogPanel';

type Section = 'tasks' | 'permissions' | 'requests' | 'log';

const SECTIONS: { id: Section; label: string; icon: typeof ListChecks }[] = [
  { id: 'tasks', label: 'Tasks', icon: ListChecks },
  { id: 'permissions', label: 'Permissions', icon: ShieldCheck },
  { id: 'requests', label: 'Requests', icon: Droplet },
  { id: 'log', label: 'Field log', icon: ClipboardList },
];

export function VolunteerDashboard() {
  const { state } = useApp();
  const [section, setSection] = useState<Section>('tasks');

  const pendingPermissions = state.permissions.filter((p) => p.status === 'pending').length;
  const openTasks = state.tasks.filter((t) => !t.done).length;
  const activeCritical = state.requests.filter((r) => r.urgency === 'critical' && r.status !== 'fulfilled').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-gray-500">Volunteer desk</p>
          <h1 className="text-2xl font-extrabold text-gray-900">Today&apos;s duty</h1>
        </div>
        <Badge className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
          <ShieldCheck size={14} /> Verified
        </Badge>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Open tasks" value={openTasks} />
        <StatCard label="Permissions" value={pendingPermissions} highlight={pendingPermissions > 0} icon={<BellRing size={14} />} />
        <StatCard label="Critical" value={activeCritical} highlight={activeCritical > 0} />
      </div>

      <nav className="grid grid-cols-4 gap-1 rounded-2xl bg-gray-100 p-1" aria-label="Volunteer sections">
        {SECTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={section === id}
            onClick={() => setSection(id)}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-bold transition-all duration-200 sm:text-xs ${
              section === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </nav>

      <section key={section} className="animate-fade-in">
        {section === 'tasks' && <TasksPanel />}
        {section === 'permissions' && <PermissionReviewPanel />}
        {section === 'requests' && <RequestStatusPanel />}
        {section === 'log' && <FieldLogPanel />}
      </section>
    </div>
  );
}

function StatCard({ label, value, highlight = false, icon }: { label: string; value: number; highlight?: boolean; icon?: ReactNode }) {
  return (
    <Card className={`p-4 ${highlight ? 'border-brand-200 bg-brand-50' : ''}`}>
      <p className={`flex items-center gap-1 text-xs font-semibold ${highlight ? 'text-brand-700' : 'text-gray-500'}`}>
        {icon} {label}
      </p>
      <p className={`mt-1 text-2xl font-extrabold tabular-nums ${highlight ? 'text-brand-700' : 'text-gray-900'}`}>{value}</p>
    </Card>
  );
}
