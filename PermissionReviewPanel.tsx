import { CheckCircle2, Clock, Phone, XCircle } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { Badge, Button, Card, EmptyState } from '@/components/ui/Primitives';
import { formatRelative, useNow } from '@/lib/time';
import type { PermissionStatus } from '@/types';

const STATUS_BADGE: Record<PermissionStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200' },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' },
  denied: { label: 'Denied', className: 'bg-gray-100 text-gray-600' },
};

export function PermissionReviewPanel() {
  const { state, resolvePermission } = useApp();
  const now = useNow(60_000);

  const permissions = [...state.permissions].sort(
    (a, b) => Number(b.status === 'pending') - Number(a.status === 'pending') || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  if (permissions.length === 0) {
    return <EmptyState icon={<Phone size={22} />} title="No contact requests" text="Requests from seekers to reach donors will show here." />;
  }

  return (
    <ul className="space-y-3">
      {permissions.map((p) => {
        const donor = state.donors.find((d) => d.id === p.donorId);
        const badge = STATUS_BADGE[p.status];
        return (
          <li key={p.id}>
            <Card className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900">{p.requesterName}</p>
                  <p className="truncate text-xs text-gray-500">
                    Wants to contact <span className="font-semibold text-gray-700">{donor?.name ?? 'Unknown donor'}</span>{' '}
                    {donor && <span>({donor.bloodGroup})</span>} · {formatRelative(p.createdAt, now)}
                  </p>
                </div>
                <Badge className={badge.className}>{badge.label}</Badge>
              </div>
              <p className="rounded-2xl bg-gray-50 px-3.5 py-3 text-sm leading-relaxed text-gray-700">{p.reason}</p>

              {p.status === 'pending' ? (
                <div className="grid grid-cols-2 gap-2.5">
                  <Button variant="outline" onClick={() => resolvePermission(p.id, 'denied')}>
                    <XCircle size={16} /> Deny
                  </Button>
                  <Button onClick={() => resolvePermission(p.id, 'approved')}>
                    <CheckCircle2 size={16} /> Approve
                  </Button>
                </div>
              ) : (
                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock size={12} />
                  {p.status === 'approved' ? 'Contact shared with the requester' : 'Request declined'}
                </p>
              )}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
