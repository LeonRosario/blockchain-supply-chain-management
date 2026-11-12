import { Suspense, useEffect } from 'react';
import { MotionConfig } from 'motion/react';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui';
import { ErrorBoundary, RouteFallback } from '@/components/common';
import { initializeAppPreferences } from '@/services/settings.service';
import AppRoutes from '@/routes/AppRoutes';

function App() {
  useEffect(() => {
    initializeAppPreferences();
  }, []);

  return (
    <AuthProvider>
      <ToastProvider>
        <ErrorBoundary>
          <MotionConfig reducedMotion="user">
            <Suspense fallback={<RouteFallback />}>
              <AppRoutes />
            </Suspense>
          </MotionConfig>
        </ErrorBoundary>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;