import { Check, Circle, MapPin } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { Badge, Card, EmptyState } from '@/components/ui/Primitives';
import { formatCountdown, useNow } from '@/lib/time';

export function TasksPanel() {
  const { state, toggleTask } = useApp();
  const now = useNow();

  const tasks = [...state.tasks].sort((a, b) => Number(a.done) - Number(b.done) || new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

  if (tasks.length === 0) {
    return <EmptyState icon={<Check size={22} />} title="No tasks assigned" text="New assignments from the coordinator will appear here." />;
  }

  return (
    <ul className="space-y-3">
      {tasks.map((task) => {
        const linked = task.requestId ? state.requests.find((r) => r.id === task.requestId) : undefined;
        const countdown = formatCountdown(task.dueAt, now);
        return (
          <li key={task.id}>
            <Card className={`flex items-start gap-3 ${task.done ? 'opacity-60' : ''}`}>
              <button
                type="button"
                onClick={() => toggleTask(task.id)}
                aria-label={task.done ? 'Mark task as open' : 'Mark task as done'}
                aria-pressed={task.done}
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 active:scale-90 ${
                  task.done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-gray-300 text-transparent hover:border-brand-500'
                }`}
              >
                <Check size={14} />
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-bold text-gray-900 ${task.done ? 'line-through' : ''}`}>{task.title}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                  <MapPin size={12} /> {task.location.thana}, {task.location.district}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {linked && (
                    <Badge className="bg-brand-50 text-brand-700">
                      <Circle size={8} className="fill-current" /> {linked.patientName} · {linked.bloodGroup}
                    </Badge>
                  )}
                  {!task.done && (
                    <Badge className={countdown.expired ? 'bg-gray-100 text-gray-600' : 'bg-amber-50 text-amber-800'}>
                      Due {countdown.expired ? 'now' : `in ${countdown.text}`}
                    </Badge>
                  )}
                </div>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
