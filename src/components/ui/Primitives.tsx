import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { X } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700 active:bg-brand-800',
  secondary: 'bg-gray-900 text-white hover:bg-gray-800 active:bg-black',
  outline: 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 active:bg-gray-100',
  ghost: 'text-brand-700 hover:bg-brand-50 active:bg-brand-100',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  block?: boolean;
}

export function Button({ variant = 'primary', block = false, className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${BUTTON_VARIANTS[variant]} ${block ? 'w-full' : ''} ${className}`}
    />
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border border-gray-100 bg-white p-4 shadow-sm ${className}`}>{children}</div>;
}

export function Badge({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

export function BloodDrop({ group, size = 'md' }: { group: string; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'h-16 w-16 text-lg' : size === 'md' ? 'h-12 w-12 text-sm' : 'h-9 w-9 text-xs';
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-brand-600 font-extrabold tracking-tight text-white shadow-sm shadow-brand-600/30 ${dims}`}
      aria-label={`Blood group ${group}`}
    >
      {group}
    </div>
  );
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {action}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-gray-500">{hint}</span>}
    </label>
  );
}

export const INPUT_CLASS =
  'w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100';

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/50 backdrop-blur-sm animate-fade-in sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl animate-sheet-up sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-500">{icon}</div>
      <p className="text-sm font-semibold text-gray-800">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{text}</p>
    </div>
  );
}
