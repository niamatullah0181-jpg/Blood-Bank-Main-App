import { useState, type FormEvent } from 'react';
import { ArrowRight, Smartphone } from 'lucide-react';
import { Button, Field, INPUT_CLASS } from '@/components/ui/Primitives';

const BD_MOBILE = /^1[3-9]\d{8}$/;

export function PhoneLoginStep({ onSubmit }: { onSubmit: (phone: string) => void }) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const digits = value.replace(/\D/g, '');
    if (!BD_MOBILE.test(digits)) {
      setError('Enter a valid 11-digit mobile number, e.g. 017XXXXXXXX');
      return;
    }
    setError(null);
    onSubmit(`+880${digits.slice(1)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col animate-fade-in">
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-brand-100">
        <Smartphone size={26} />
      </div>
      <h1 className="text-3xl font-extrabold leading-tight text-gray-900">Sign in with your phone</h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        We will send a 6-digit code by SMS to confirm it is you. No password needed.
      </p>

      <div className="mt-8 space-y-2">
        <Field label="Mobile number">
          <div className="flex gap-2">
            <span className="flex items-center rounded-2xl border border-gray-200 bg-gray-50 px-4 text-sm font-semibold text-gray-700">
              +880
            </span>
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="17XXXXXXXX"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={`${INPUT_CLASS} flex-1`}
              aria-invalid={error ? true : undefined}
            />
          </div>
        </Field>
        {error && <p className="text-sm font-medium text-brand-700">{error}</p>}
      </div>

      <div className="mt-auto pt-10">
        <Button type="submit" block>
          Send code <ArrowRight size={18} />
        </Button>
        <p className="mt-4 text-center text-xs text-gray-500">By continuing you agree to donate responsibly and respect donor privacy.</p>
      </div>
    </form>
  );
}
