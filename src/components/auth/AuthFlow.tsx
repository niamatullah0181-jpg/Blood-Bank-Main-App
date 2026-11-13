import { useState } from 'react';
import { HeartPulse } from 'lucide-react';
import { PhoneLoginStep } from '@/components/auth/PhoneLoginStep';
import { OtpStep } from '@/components/auth/OtpStep';
import { ProfileSetupWizard } from '@/components/auth/ProfileSetupWizard';
import { useApp } from '@/state/AppContext';

type Stage = 'phone' | 'otp' | 'profile';

export function AuthFlow() {
  const { createProfile } = useApp();
  const [stage, setStage] = useState<Stage>('phone');
  const [phone, setPhone] = useState('');

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gradient-to-b from-brand-50 via-white to-white">
      <header className="flex items-center gap-2.5 px-6 pt-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-md shadow-brand-600/30">
          <HeartPulse size={22} />
        </div>
        <div>
          <p className="text-base font-extrabold leading-tight text-gray-900">LifeLine Blood Bank</p>
          <p className="text-xs font-medium text-gray-500">Donate. Request. Save a life.</p>
        </div>
      </header>

      <main className="flex flex-1 flex-col px-6 pb-10 pt-8">
        {stage === 'phone' && (
          <PhoneLoginStep
            onSubmit={(value) => {
              setPhone(value);
              setStage('otp');
            }}
          />
        )}
        {stage === 'otp' && (
          <OtpStep phone={phone} onBack={() => setStage('phone')} onVerified={() => setStage('profile')} />
        )}
        {stage === 'profile' && (
          <ProfileSetupWizard phone={phone} onComplete={(input) => createProfile({ ...input, phone })} />
        )}
      </main>
    </div>
  );
}
