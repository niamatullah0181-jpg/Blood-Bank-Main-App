import { Clock, CheckCircle2, LogOut, MapPin, Phone, ShieldCheck, XCircle } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { Badge, BloodDrop, Button, Card, EmptyState, SectionHeader } from '@/components/ui/Primitives';
import { useNow, formatRelative } from '@/lib/time';
import type { PermissionStatus, Role } from '@/types';

const ROLE_LABEL: Record<Role, string> = {
  seeker: 'Seeker',
  donor: 'Donor',
  volunteer: 'Volunteer',
};

const PERMISSION_BADGE: Record<PermissionStatus, { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: 'Pending', className: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200', icon: Clock },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', icon: CheckCircle2 },
  denied: { label: 'Declined', className: 'bg-gray-100 text-gray-600', icon: XCircle },
};

export function ProfileScreen() {
  const { state, signOut } = useApp();
  const now = useNow(60_000);
  const user = state.user!;

  const myPermissions = state.permissions.filter((p) => p.requesterId === user.id);

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-2xl font-extrabold text-gray-900">Profile</h1>
      </header>

      <Card className="flex items-center gap-4">
        <BloodDrop group={user.bloodGroup} size="lg" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-gray-900">{user.name}</p>
          <p className="font-mono text-xs text-gray-500">{user.phone}</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge className="bg-gray-900 text-white">{ROLE_LABEL[user.role]}</Badge>
            {user.verified && (
              <Badge className="bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                <ShieldCheck size={12} /> Verified
              </Badge>
            )}
          </div>
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center gap-3 text-sm text-gray-700">
          <MapPin size={18} className="text-brand-600" />
          {user.location.thana}, {user.location.district}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-700">
          <Phone size={18} className="text-brand-600" />
          Calls and WhatsApp are unlocked for verified volunteers. Other donors need approval.
        </div>
      </Card>

      <section>
        <SectionHeader title="My contact requests" />
        {myPermissions.length === 0 ? (
          <EmptyState icon={<Phone size={22} />} title="No requests yet" text="Ask for a donor's contact from the Find blood tab." />
        ) : (
          <ul className="space-y-3">
            {myPermissions.map((p) => {
              const donor = state.donors.find((d) => d.id === p.donorId);
              const badge = PERMISSION_BADGE[p.status];
              const Icon = badge.icon;
              return (
                <li key={p.id}>
                  <Card className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-gray-900">{donor?.name ?? 'Donor'}</p>
                      <p className="text-xs text-gray-500">{formatRelative(p.createdAt, now)}</p>
                    </div>
                    <Badge className={badge.className}>
                      <Icon size={12} /> {badge.label}
                    </Badge>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Button variant="outline" block onClick={signOut}>
        <LogOut size={16} /> Sign out
      </Button>
    </div>
  );
}
