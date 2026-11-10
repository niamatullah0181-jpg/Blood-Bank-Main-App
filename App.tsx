import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AppProvider, useApp } from '@/state/AppContext';
import { AuthFlow } from '@/components/auth/AuthFlow';
import { BottomNav, type TabId } from '@/components/layout/BottomNav';
import { HomeScreen } from '@/components/home/HomeScreen';
import { FindBloodScreen } from '@/components/search/FindBloodScreen';
import { VolunteerDashboard } from '@/components/volunteer/VolunteerDashboard';
import { ProfileScreen } from '@/components/profile/ProfileScreen';

function AppShell() {
  const { state, toast } = useApp();
  const [tab, setTab] = useState<TabId>('home');
  const [searchQuery, setSearchQuery] = useState('');

  if (!state.user) return <AuthFlow />;

  const isVolunteer = state.user.role === 'volunteer';
  const activeTab: TabId = tab === 'duty' && !isVolunteer ? 'home' : tab;

  const openSearch = (query: string) => {
    setSearchQuery(query);
    setTab('search');
  };

  return (
    <div className="min-h-[100dvh] bg-gray-100 sm:py-8">
      <div className="relative mx-auto min-h-[100dvh] max-w-md bg-gray-50 sm:min-h-0 sm:rounded-[2.5rem] sm:shadow-2xl sm:ring-1 sm:ring-gray-200">
        <main className="px-4 pb-32 pt-6 sm:px-5">
          {activeTab === 'home' && <HomeScreen onSearch={openSearch} />}
          {activeTab === 'search' && <FindBloodScreen key={searchQuery} initialQuery={searchQuery} />}
          {activeTab === 'duty' && isVolunteer && <VolunteerDashboard />}
          {activeTab === 'profile' && <ProfileScreen />}
        </main>

        <BottomNav active={activeTab} onChange={setTab} showDuty={isVolunteer} />

        {toast && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-28 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-2xl bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-xl animate-toast-in"
          >
            <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default App;
