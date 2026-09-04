import React from 'react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SchoolProfileProvider } from './context/SchoolProfileContext';
import { LoginView } from './views/LoginView';
import { DashboardRouter } from './views/DashboardRouter';
import { Loader2 } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-500">Memuat Jurnal 7 KAIH...</p>
        </div>
      </div>
    );
  }

  return user ? <DashboardRouter /> : <LoginView />;
};

export default function App() {
  return (
    <SchoolProfileProvider>
      <AuthProvider>
        <MainApp />
        <SpeedInsights />
        <Analytics />
      </AuthProvider>
    </SchoolProfileProvider>
  );
}
