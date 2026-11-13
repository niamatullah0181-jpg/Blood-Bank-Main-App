import { useState, type FormEvent } from 'react';
import { ClipboardList } from 'lucide-react';
import { useApp } from '@/state/AppContext';
import { Badge, Button, Card, EmptyState, Field, INPUT_CLASS } from '@/components/ui/Primitives';
import { LOG_CATEGORY_META } from '@/lib/constants';
import { formatRelative, useNow } from '@/lib/time';
import type { LogCategory } from '@/types';

const CATEGORIES = Object.keys(LOG_CATEGORY_META) as LogCategory[];

export function FieldLogPanel() {
  const { state, addLog } = useApp();
  const now = useNow(60_000);
  const [category, setCategory] = useState<LogCategory>('visit');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const userId = state.user?.id;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (note.trim().length < 10) return setError('Describe the activity in at least 10 characters');
    addLog(category, note.trim());
    setNote('');
    setError(null);
  };

  return (
    <div className="space-y-5">
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">Activity type</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all duration-200 active:scale-95 ${
                    category === c ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {LOG_CATEGORY_META[c]}
                </button>
              ))}
            </div>
          </div>
          <Field label="What happened today?">
            <textarea
              rows={3}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Visited 3 donors in Mirpur and confirmed their availability."
              className={`${INPUT_CLASS} resize-none`}
            />
          </Field>
          {error && <p className="text-sm font-medium text-brand-700">{error}</p>}
          <Button type="submit" block>
            Log activity
          </Button>
        </form>
      </Card>

      <section>
        <h2 className="mb-3 text-base font-bold text-gray-900">Recent activity</h2>
        {state.logs.length === 0 ? (
          <EmptyState icon={<ClipboardList size={22} />} title="No activity yet" text="Log your first field activity above." />
        ) : (
          <ul className="space-y-3">
            {state.logs.map((log) => (
              <li key={log.id}>
                <Card className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge className="bg-gray-100 text-gray-700">{LOG_CATEGORY_META[log.category]}</Badge>
                    <span className="text-xs text-gray-500">
                      {formatRelative(log.createdAt, now)}
                      {log.volunteerId === userId && <span className="ml-2 font-semibold text-brand-700">You</span>}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-700">{log.note}</p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
