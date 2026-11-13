import { Clock, MapPin } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { Badge, BloodDrop, Card, EmptyState } from '@/components/ui/Primitives';
import { STATUS_META, URGENCY_META } from '@/lib/constants';
import { formatCountdown, useNow } from '@/lib/time';
import type { RequestStatus } from '@/types';

const STATUS_OPTIONS: RequestStatus[] = ['open', 'in_progress', 'fulfilled'];

export function RequestStatusPanel() {
  const { state, setRequestStatus } = useApp();
  const now = useNow();

  const requests = [...state.requests].sort((a, b) => Number(a.status === 'fulfilled') - Number(b.status === 'fulfilled'));

  if (requests.length === 0) {
    return <EmptyState icon={<Clock size={22} />} title="No blood requests" text="Requests posted by seekers appear here." />;
  }

  return (
    <ul className="space-y-3">
      {requests.map((r) => {
        const countdown = formatCountdown(r.deadline, now);
        const urgency = URGENCY_META[r.urgency];
        return (
          <li key={r.id}>
            <Card className="space-y-4">
              <div className="flex items-start gap-3">
                <BloodDrop group={r.bloodGroup} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge className={urgency.badge}>{urgency.label}</Badge>
                    <Badge className="bg-gray-100 text-gray-700">{r.unitsNeeded} unit{r.unitsNeeded > 1 ? 's' : ''}</Badge>
                  </div>
                  <p className="mt-1.5 truncate text-sm font-bold text-gray-900">{r.patientName}</p>
                  <p className="truncate text-xs text-gray-600">{r.hospital}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                    <MapPin size={12} /> {r.location.thana}, {r.location.district}
                  </p>
                </div>
                <span className={`font-mono text-xs font-bold tabular-nums ${countdown.expired ? 'text-gray-400' : 'text-brand-700'}`}>
                  {countdown.text}
                </span>
              </div>

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
                <div className="grid grid-cols-3 gap-1.5 rounded-2xl bg-gray-100 p-1">
                  {STATUS_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={r.status === option}
                      onClick={() => setRequestStatus(r.id, option)}
                      className={`rounded-xl py-2 text-[11px] font-bold transition-all duration-200 sm:text-xs ${
                        r.status === option ? `${STATUS_META[option].badge} bg-white shadow-sm` : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      {STATUS_META[option].label}
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
