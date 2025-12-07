import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { router } from './routes';
import { useSettings } from './hooks/useSettings';

// Import i18n (must be imported before any component that uses translations)
import './i18n';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Toaster wrapper to get dynamic direction
function ToasterWithDirection() {
  const { language } = useSettings();
  return (
    <Toaster
      position="top-center"
      richColors
      closeButton
      dir={language === 'ar' ? 'rtl' : 'ltr'}
    />
  );
}

// Dynamic document title based on language
function DocumentTitle() {
  const { t } = useTranslation();
  
  useEffect(() => {
    document.title = t('app.title');
  }, [t]);
  
  return null;
}

function AppContent() {
  return (
    <>
      <DocumentTitle />
      <RouterProvider router={router} />
      <ToasterWithDirection />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
