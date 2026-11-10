import { AlertTriangle } from 'lucide-react';
import { BloodDrop, Badge } from '@/components/ui/Primitives';
import type { BloodRequest } from '@/types';
import { formatCountdown, useNow } from '@/lib/time';
import { STATUS_META, URGENCY_META } from '@/lib/constants';

export function EmergencyTicker({ requests }: { requests: BloodRequest[] }) {
  if (requests.length === 0) return null;

  const messages = requests.map(
    (r) => `${r.bloodGroup} needed for ${r.patientName} at ${r.hospital}, ${r.location.thana} (${r.unitsNeeded} unit${r.unitsNeeded > 1 ? 's' : ''})`,
  );
  const loop = [...messages, ...messages];

  return (
    <div className="flex items-center gap-3 overflow-hidden rounded-2xl bg-brand-600 py-2.5 pl-3 pr-2 text-white shadow-md shadow-brand-600/20">
      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping-slow rounded-full bg-white" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
        </span>
        Live
      </span>
      <div className="relative min-w-0 flex-1 overflow-hidden" aria-live="off">
        <div className="flex w-max animate-ticker gap-10 whitespace-nowrap text-sm font-medium hover:[animation-play-state:paused]">
          {loop.map((text, i) => (
            <span key={i} className="flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0 opacity-80" />
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function UrgentRequestCard({ request }: { request: BloodRequest }) {
  const now = useNow();
  const { text, expired } = formatCountdown(request.deadline, now);
  const urgency = URGENCY_META[request.urgency];
  const status = STATUS_META[request.status];

  return (
    <article className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3">
        <BloodDrop group={request.bloodGroup} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge className={urgency.badge}>{urgency.label}</Badge>
            <Badge className={status.badge}>{status.label}</Badge>
          </div>
          <h3 className="mt-1.5 truncate text-sm font-bold text-gray-900">{request.patientName}</h3>
          <p className="truncate text-xs text-gray-600">{request.hospital}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {request.location.thana}, {request.location.district} · {request.unitsNeeded} unit
            {request.unitsNeeded > 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-gray-50 px-3.5 py-2.5">
        <span className="text-xs font-semibold text-gray-600">{expired ? 'Deadline passed' : 'Time left'}</span>
        <span
          className={`font-mono text-base font-bold tabular-nums ${expired ? 'text-gray-400' : 'text-brand-700'}`}
          aria-live="off"
        >
          {text}
        </span>
      </div>
    </article>
  );
}
