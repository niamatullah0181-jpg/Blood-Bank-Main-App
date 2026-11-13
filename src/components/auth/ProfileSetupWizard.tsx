import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, HeartHandshake, ShieldCheck, UserRound, Users } from 'lucide-react';
import { BLOOD_GROUPS, type BloodGroup, type Role } from '@/types';
import { DISTRICTS, DISTRICT_THANAS } from '@/lib/constants';
import { Button, Field, INPUT_CLASS } from '@/components/ui/Primitives';
import type { ProfileInput } from '@/state/AppContext';

type WizardInput = Omit<ProfileInput, 'phone'>;

const ROLE_OPTIONS: { value: Role; title: string; text: string; icon: typeof UserRound }[] = [
  { value: 'seeker', title: 'Seeker', text: 'I need blood or want to find donors nearby.', icon: UserRound },
  { value: 'donor', title: 'Donor', text: 'I can donate and want to be listed for requests.', icon: HeartHandshake },
  { value: 'volunteer', title: 'Volunteer', text: 'I help coordinate requests and field activities.', icon: Users },
];

const STEP_TITLES = ['About you', 'Where you live', 'Your role'];

export function ProfileSetupWizard({
  phone,
  onComplete,
}: {
  phone: string;
  onComplete: (input: WizardInput) => void;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | null>(null);
  const [district, setDistrict] = useState(DISTRICTS[0]);
  const [thana, setThana] = useState(DISTRICT_THANAS[DISTRICTS[0]][0]);
  const [role, setRole] = useState<Role>('seeker');
  const [errors, setErrors] = useState<string | null>(null);

  const thanas = DISTRICT_THANAS[district] ?? [];

  const next = () => {
    if (step === 0) {
      if (name.trim().length < 2) return setErrors('Please enter your full name');
      if (!bloodGroup) return setErrors('Select your blood group');
    }
    if (step === 1 && !thana) return setErrors('Select your thana');
    setErrors(null);
    setStep((s) => s + 1);
  };

  const submit = () => {
    if (!bloodGroup) return;
    onComplete({ name: name.trim(), bloodGroup, location: { district, thana }, role });
  };

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between text-xs font-semibold text-gray-500">
          <span>
            Step {step + 1} of {STEP_TITLES.length}
          </span>
          <span className="text-gray-400">{phone}</span>
        </div>
        <div className="flex gap-2" aria-hidden>
          {STEP_TITLES.map((title, i) => (
            <div key={title} className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full rounded-full bg-brand-600 transition-all duration-500 ${i <= step ? 'w-full' : 'w-0'}`}
              />
            </div>
          ))}
        </div>
      </div>

      <h1 className="text-3xl font-extrabold leading-tight text-gray-900">{STEP_TITLES[step]}</h1>
      <p className="mt-2 text-sm text-gray-600">
        {step === 0 && 'Tell us who you are and your blood group so matches can be found quickly.'}
        {step === 1 && 'Choose your district and thana so we show you requests close to home.'}
        {step === 2 && 'Pick how you want to use LifeLine. You can change this later.'}
      </p>

      <div className="mt-8 flex-1 space-y-6">
        {step === 0 && (
          <>
            <Field label="Full name">
              <input
                className={INPUT_CLASS}
                placeholder="e.g. Rafiul Islam"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </Field>
            <div>
              <span className="mb-1.5 block text-sm font-semibold text-gray-700">Blood group</span>
              <div className="grid grid-cols-4 gap-2.5">
                {BLOOD_GROUPS.map((group) => {
                  const active = bloodGroup === group;
                  return (
                    <button
                      key={group}
                      type="button"
                      onClick={() => setBloodGroup(group)}
                      aria-pressed={active}
                      className={`rounded-2xl py-3.5 text-base font-extrabold transition-all duration-200 active:scale-95 ${
                        active
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                          : 'border border-gray-200 bg-white text-gray-800 hover:border-brand-300 hover:text-brand-700'
                      }`}
                    >
                      {group}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
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
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Thana / Upazila">
              <select className={INPUT_CLASS} value={thana} onChange={(e) => setThana(e.target.value)}>
                {thanas.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {ROLE_OPTIONS.map(({ value, title, text, icon: Icon }) => {
              const active = role === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-4 rounded-3xl border p-4 text-left transition-all duration-200 active:scale-[0.99] ${
                    active
                      ? 'border-brand-500 bg-brand-50 ring-4 ring-brand-100'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                      active ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Icon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{title}</p>
                    <p className="text-xs leading-relaxed text-gray-600">{text}</p>
                  </div>
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full border ${
                      active ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-300 text-transparent'
                    }`}
                  >
                    <Check size={14} />
                  </div>
                </button>
              );
            })}
            {role === 'volunteer' && (
              <p className="flex gap-2 rounded-2xl bg-gray-100 px-4 py-3 text-xs leading-relaxed text-gray-700">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand-600" />
                Volunteers can view donor contacts directly. In this demo your volunteer account is verified instantly.
              </p>
            )}
          </div>
        )}

        {errors && <p className="text-sm font-medium text-brand-700">{errors}</p>}
      </div>

      <div className="mt-8 flex items-center gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep((s) => s - 1)} aria-label="Back">
            <ArrowLeft size={18} />
          </Button>
        )}
        {step < STEP_TITLES.length - 1 ? (
          <Button block onClick={next}>
            Continue <ArrowRight size={18} />
          </Button>
        ) : (
          <Button block onClick={submit}>
            Finish setup <Check size={18} />
          </Button>
        )}
      </div>
    </div>
  );
}
