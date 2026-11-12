import { useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui';
import { initializeAppPreferences } from '@/services/settings.service';
import AppRoutes from '@/routes/AppRoutes';

function App() {
  useEffect(() => {
    initializeAppPreferences();
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;