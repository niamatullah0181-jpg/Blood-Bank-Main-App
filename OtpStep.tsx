import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button, INPUT_CLASS } from '@/components/ui/Primitives';

const OTP_LENGTH = 6;
const DEMO_CODE = '123456';
const RESEND_SECONDS = 30;

export function OtpStep({
  phone,
  onBack,
  onVerified,
}: {
  phone: string;
  onBack: () => void;
  onVerified: () => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [verifying, setVerifying] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    if (resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendIn]);

  const masked = phone.slice(0, 5) + '*****' + phone.slice(-3);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (code.length !== OTP_LENGTH) {
      setError('Enter the 6-digit code');
      return;
    }
    setVerifying(true);
    window.setTimeout(() => {
      if (code === DEMO_CODE) {
        onVerified();
      } else {
        setVerifying(false);
        setError('That code is not correct. Please try again.');
      }
    }, 600);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-1 flex-col animate-fade-in">
      <button
        type="button"
        onClick={onBack}
        className="mb-6 flex w-fit items-center gap-1 rounded-full py-1 pr-3 text-sm font-semibold text-gray-600 transition hover:text-gray-900"
      >
        <ArrowLeft size={16} /> Change number
      </button>
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-brand-600 shadow-sm ring-1 ring-brand-100">
        <ShieldCheck size={26} />
      </div>
      <h1 className="text-3xl font-extrabold leading-tight text-gray-900">Enter the code</h1>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        We sent a 6-digit code to <span className="font-semibold text-gray-900">{masked}</span>.
      </p>

      <div className="mt-8">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={OTP_LENGTH}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH));
            setError(null);
          }}
          aria-label="One-time code"
          className={`${INPUT_CLASS} text-center text-2xl font-bold tracking-[0.5em]`}
          placeholder="000000"
        />
        {error && <p className="mt-3 text-sm font-medium text-brand-700">{error}</p>}
        <p className="mt-4 text-sm text-gray-600">
          {resendIn > 0 ? (
            <>Resend code in <span className="font-semibold text-gray-900">{resendIn}s</span></>
          ) : (
            <button
              type="button"
              onClick={() => setResendIn(RESEND_SECONDS)}
              className="font-semibold text-brand-700 hover:underline"
            >
              Resend code
            </button>
          )}
        </p>
        <p className="mt-3 rounded-2xl bg-gray-100 px-4 py-3 text-xs text-gray-600">
          Demo mode: use code <span className="font-bold text-gray-900">{DEMO_CODE}</span>
        </p>
      </div>

      <div className="mt-auto pt-10">
        <Button type="submit" block disabled={verifying}>
          {verifying ? 'Verifying...' : 'Verify and continue'}
        </Button>
      </div>
    </form>
  );
}
