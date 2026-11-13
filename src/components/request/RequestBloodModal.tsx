import { useState, type FormEvent } from 'react';
import { Minus, Plus, Send } from 'lucide-react';
import { BLOOD_GROUPS, type BloodGroup, type Urgency } from '@/types';
import { DISTRICTS, DISTRICT_THANAS, URGENCY_META } from '@/lib/constants';
import { Button, Field, INPUT_CLASS, Modal } from '@/components/ui/Primitives';
import { hoursFromNow } from '@/lib/utils';
import { useApp } from '@/state/AppContext';

const DEADLINE_OPTIONS = [
  { hours: 3, label: 'Within 3 hours' },
  { hours: 12, label: 'Within 12 hours' },
  { hours: 24, label: 'Within 24 hours' },
  { hours: 72, label: 'Within 3 days' },
];

const URGENCY_OPTIONS: Urgency[] = ['critical', 'urgent', 'normal'];

export function RequestBloodModal({
  open,
  onClose,
  defaultUrgency,
}: {
  open: boolean;
  onClose: () => void;
  defaultUrgency: Urgency;
}) {
  return (
    <Modal open={open} onClose={onClose} title={defaultUrgency === 'critical' ? 'Emergency SOS' : 'Request blood'}>
      <RequestForm defaultUrgency={defaultUrgency} onDone={onClose} />
    </Modal>
  );
}

function RequestForm({ defaultUrgency, onDone }: { defaultUrgency: Urgency; onDone: () => void }) {
  const { addRequest, state } = useApp();
  const user = state.user!;

  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | null>(null);
  const [units, setUnits] = useState(1);
  const [district, setDistrict] = useState(user.location.district);
  const [thana, setThana] = useState(user.location.thana);
  const [hospital, setHospital] = useState('');
  const [urgency, setUrgency] = useState<Urgency>(defaultUrgency);
  const [deadlineHours, setDeadlineHours] = useState(DEADLINE_OPTIONS[1].hours);
  const [contactPhone, setContactPhone] = useState(user.phone);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const thanas = DISTRICT_THANAS[district] ?? [];
  const isSos = defaultUrgency === 'critical';

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (patientName.trim().length < 2) return setError('Enter the patient name');
    if (!bloodGroup) return setError('Select the blood group needed');
    if (hospital.trim().length < 3) return setError('Enter the hospital name');
    if (contactPhone.replace(/\D/g, '').length < 11) return setError('Enter a valid contact number');

    addRequest({
      patientName: patientName.trim(),
      bloodGroup,
      unitsNeeded: units,
      location: { district, thana },
      hospital: hospital.trim(),
      urgency,
      deadline: hoursFromNow(deadlineHours),
      contactPhone: contactPhone.trim(),
      notes: notes.trim(),
    });
    onDone();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isSos && (
        <p className="rounded-2xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800">
          SOS alerts critical blood requests to donors and volunteers in your area immediately.
        </p>
      )}

      <Field label="Patient name">
        <input className={INPUT_CLASS} value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Full name" />
      </Field>

      <div>
        <span className="mb-1.5 block text-sm font-semibold text-gray-700">Blood group needed</span>
        <div className="grid grid-cols-4 gap-2">
          {BLOOD_GROUPS.map((group) => (
            <button
              key={group}
              type="button"
              aria-pressed={bloodGroup === group}
              onClick={() => setBloodGroup(group)}
              className={`rounded-xl py-2.5 text-sm font-bold transition active:scale-95 ${
                bloodGroup === group
                  ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                  : 'border border-gray-200 text-gray-800 hover:border-brand-300'
              }`}
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
        <span className="text-sm font-semibold text-gray-700">Units needed</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Decrease units"
            onClick={() => setUnits((u) => Math.max(1, u - 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition hover:bg-gray-200 active:scale-90"
          >
            <Minus size={16} />
          </button>
          <span className="w-6 text-center text-base font-bold tabular-nums">{units}</span>
          <button
            type="button"
            aria-label="Increase units"
            onClick={() => setUnits((u) => Math.min(10, u + 1))}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 active:scale-90"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="District">
          <select
            className={INPUT_CLASS}
            value={district}
            onChange={(e) => {
              setDistrict(e.target.value);
              setThana(DISTRICT_THANAS[e.target.value][0]);
            }}
          >
            {DISTRICTS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>
        <Field label="Thana">
          <select className={INPUT_CLASS} value={thana} onChange={(e) => setThana(e.target.value)}>
            {thanas.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Hospital">
        <input className={INPUT_CLASS} value={hospital} onChange={(e) => setHospital(e.target.value)} placeholder="Hospital or clinic name" />
      </Field>

      <div>
        <span className="mb-1.5 block text-sm font-semibold text-gray-700">Urgency</span>
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-gray-100 p-1">
          {URGENCY_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={urgency === option}
              onClick={() => setUrgency(option)}
              className={`rounded-xl py-2 text-xs font-bold transition ${
                urgency === option ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {URGENCY_META[option].label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Needed by">
          <select className={INPUT_CLASS} value={deadlineHours} onChange={(e) => setDeadlineHours(Number(e.target.value))}>
            {DEADLINE_OPTIONS.map((o) => (
              <option key={o.hours} value={o.hours}>
                {o.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Contact number">
          <input type="tel" className={INPUT_CLASS} value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
        </Field>
      </div>

      <Field label="Notes (optional)">
        <textarea
          rows={3}
          className={`${INPUT_CLASS} resize-none`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ward, bed number, or other details for donors"
        />
      </Field>

      {error && <p className="text-sm font-medium text-brand-700">{error}</p>}

      <Button type="submit" block variant={isSos ? 'primary' : 'secondary'}>
        <Send size={16} /> {isSos ? 'Send SOS alert' : 'Post blood request'}
      </Button>
    </form>
  );
}
