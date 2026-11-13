import { useState, type FormEvent } from 'react';
import { Check, Clock, Lock, MessageCircle, Phone, ShieldCheck, Send } from 'lucide-react';
import type { Donor } from '@/types';
import { DONATION_COOLDOWN_DAYS } from '@/lib/constants';
import { daysSince, formatDate, useNow } from '@/lib/time';
import { maskPhone } from '@/lib/utils';
import { useApp } from '@/state/AppContext';
import { Badge, BloodDrop, Button, Card, Field, INPUT_CLASS, Modal } from '@/components/ui/Primitives';

export function DonorCard({ donor }: { donor: Donor }) {
  const { canViewContacts, permissionStatusFor } = useApp();
  const now = useNow(60_000);
  const [requestOpen, setRequestOpen] = useState(false);

  const permission = permissionStatusFor(donor.id);
  const unlocked = canViewContacts || permission === 'approved';
  const days = daysSince(donor.lastDonated, now);
  const coolingDays = days === null ? 0 : DONATION_COOLDOWN_DAYS - days;

  const availability = !donor.available
    ? { label: 'Unavailable', className: 'bg-gray-100 text-gray-600' }
    : coolingDays > 0
      ? { label: `Cooling down · ${coolingDays}d`, className: 'bg-amber-50 text-amber-800 ring-1 ring-amber-200' }
      : { label: 'Available now', className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' };

  const digits = donor.phone.replace(/\D/g, '');

  return (
    <Card className="flex flex-col gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start gap-3">
        <BloodDrop group={donor.bloodGroup} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-bold text-gray-900">{donor.name}</h3>
            <Badge className={availability.className}>{availability.label}</Badge>
          </div>
          <p className="mt-0.5 text-xs text-gray-600">
            {donor.location.thana}, {donor.location.district}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {donor.donations} donation{donor.donations === 1 ? '' : 's'} · Last:{' '}
            {donor.lastDonated ? formatDate(donor.lastDonated) : 'Never'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-3.5 py-2.5">
        <span className="flex items-center gap-2 text-xs font-semibold text-gray-700">
          {unlocked ? <ShieldCheck size={14} className="text-emerald-600" /> : <Lock size={14} className="text-gray-400" />}
          {unlocked ? 'Contact unlocked' : 'Contact hidden'}
        </span>
        <span className="font-mono text-xs font-semibold text-gray-800">{unlocked ? donor.phone : maskPhone(donor.phone)}</span>
      </div>

      {unlocked ? (
        <div className="grid grid-cols-2 gap-2.5">
          <a
            href={`tel:+${digits}`}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 active:scale-[0.98]"
          >
            <Phone size={16} /> Call
          </a>
          <a
            href={`https://wa.me/${digits}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98]"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
        </div>
      ) : permission === 'pending' ? (
        <Button variant="outline" block disabled>
          <Clock size={16} /> Permission request pending
        </Button>
      ) : (
        <Button variant={permission === 'denied' ? 'outline' : 'primary'} block onClick={() => setRequestOpen(true)}>
          <Lock size={16} /> {permission === 'denied' ? 'Request again' : 'Request contact'}
        </Button>
      )}

      {permission === 'denied' && <p className="text-center text-xs font-medium text-brand-700">Your last request was declined.</p>}

      <CallPermissionModal open={requestOpen} onClose={() => setRequestOpen(false)} donor={donor} />
    </Card>
  );
}

const PURPOSES = ['Patient emergency', 'Family member needs blood', 'Hospital or organization request', 'Other'];

function CallPermissionModal({ open, onClose, donor }: { open: boolean; onClose: () => void; donor: Donor }) {
  return (
    <Modal open={open} onClose={onClose} title="Request contact access">
      <PermissionForm donor={donor} onDone={onClose} />
    </Modal>
  );
}

function PermissionForm({ donor, onDone }: { donor: Donor; onDone: () => void }) {
  const { requestPermission } = useApp();
  const [purpose, setPurpose] = useState(PURPOSES[0]);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 15) return setError('Please describe the reason in at least 15 characters');
    requestPermission(donor.id, `${purpose}: ${reason.trim()}`);
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex gap-3 rounded-2xl bg-gray-50 p-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Check size={18} />
        </div>
        <p className="text-sm leading-relaxed text-gray-700">
          Donor contact details are private. Send a permission request to the organization admin or a volunteer, who will
          review your reason and share the number if approved.
        </p>
      </div>

      <Field label="Reason for contacting">
        <select className={INPUT_CLASS} value={purpose} onChange={(e) => setPurpose(e.target.value)}>
          {PURPOSES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </Field>

      <Field label="Explain briefly" hint="Include the patient, hospital and urgency if relevant.">
        <textarea
          rows={4}
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            setError(null);
          }}
          placeholder="e.g. My mother needs O+ blood at Square Hospital tonight for surgery."
          className={`${INPUT_CLASS} resize-none`}
        />
      </Field>

      {error && <p className="text-sm font-medium text-brand-700">{error}</p>}

      <Button type="submit" block>
        <Send size={16} /> Send permission request
      </Button>
    </form>
  );
}
