import { useMemo, useState } from 'react';
import { Droplets, MapPin, Search, SlidersHorizontal, X } from 'lucide-react';
import { BLOOD_GROUPS, type BloodGroup } from '@/types';
import { DISTRICTS, DISTRICT_THANAS } from '@/lib/constants';
import { parseBloodGroupQuery } from '@/lib/utils';
import { useApp } from '@/state/AppContext';
import { Badge, EmptyState, Field, INPUT_CLASS } from '@/components/ui/Primitives';
import { DonorCard } from '@/components/search/DonorCard';

export function FindBloodScreen({ initialQuery }: { initialQuery: string }) {
  const { state } = useApp();
  const user = state.user!;

  const [query, setQuery] = useState(() => (parseBloodGroupQuery(initialQuery) ? '' : initialQuery));
  const [group, setGroup] = useState<BloodGroup | null>(() => parseBloodGroupQuery(initialQuery));
  const [district, setDistrict] = useState('');
  const [thana, setThana] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  const thanas = district ? DISTRICT_THANAS[district] : [];

  const results = useMemo(() => {
    const text = query.trim().toLowerCase();
    return state.donors
      .filter((d) => !group || d.bloodGroup === group)
      .filter((d) => !district || d.location.district === district)
      .filter((d) => !thana || d.location.thana === thana)
      .filter((d) => !availableOnly || d.available)
      .filter((d) => !text || d.name.toLowerCase().includes(text) || d.location.thana.toLowerCase().includes(text))
      .sort(
        (a, b) =>
          Number(b.location.district === user.location.district) - Number(a.location.district === user.location.district),
      );
  }, [state.donors, group, district, thana, availableOnly, query, user.location.district]);

  const hasFilters = Boolean(group || district || thana || availableOnly || query.trim());

  const clearFilters = () => {
    setGroup(null);
    setDistrict('');
    setThana('');
    setAvailableOnly(false);
    setQuery('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <header>
        <h1 className="text-2xl font-extrabold text-gray-900">Find blood</h1>
        <p className="mt-1 text-sm text-gray-600">Filter donors by blood group and location. Results update as you type.</p>
      </header>

      <div className="relative">
        <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by donor name or thana"
          aria-label="Search donors"
          className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-sm shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-100"
        />
      </div>

      <section className="space-y-5 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <SlidersHorizontal size={16} /> Filters
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
            >
              <X size={14} /> Clear all
            </button>
          )}
        </div>

        <div>
          <span className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <Droplets size={14} /> Blood group
          </span>
          <div className="grid grid-cols-4 gap-2">
            {BLOOD_GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={group === g}
                onClick={() => setGroup(group === g ? null : g)}
                className={`rounded-xl py-2.5 text-sm font-bold transition-all duration-200 active:scale-95 ${
                  group === g
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                    : 'bg-gray-100 text-gray-800 hover:bg-brand-50 hover:text-brand-700'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="District">
            <select
              className={INPUT_CLASS}
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setThana('');
              }}
            >
              <option value="">All districts</option>
              {DISTRICTS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="Thana">
            <select
              className={INPUT_CLASS}
              value={thana}
              onChange={(e) => setThana(e.target.value)}
              disabled={!district}
            >
              <option value="">All thanas</option>
              {thanas.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
        </div>

        <label className="flex cursor-pointer items-center justify-between rounded-2xl bg-gray-50 px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <MapPin size={16} className="text-brand-600" /> Available donors only
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
            className="peer sr-only"
          />
          <span
            aria-hidden
            className="relative h-6 w-11 shrink-0 rounded-full bg-gray-300 transition-colors duration-200 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:duration-200 peer-checked:bg-emerald-500 peer-checked:after:translate-x-5 peer-focus-visible:ring-4 peer-focus-visible:ring-emerald-100"
          />
        </label>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Donors</h2>
          <Badge className="bg-gray-900 text-white">{results.length} found</Badge>
        </div>

        {results.length === 0 ? (
          <EmptyState
            icon={<Search size={22} />}
            title="No donors match these filters"
            text="Try a different blood group or widen the location."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {results.map((donor) => (
              <DonorCard key={donor.id} donor={donor} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
