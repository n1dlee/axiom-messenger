import { AppProvider, useApp } from './store/AppContext';
import { useTdlibEvents } from './hooks/useTdlibEvents';
import { AuthScreen } from './components/auth/AuthScreen';
import { AppLayout } from './components/layout/AppLayout';

function AppInner() {
  useTdlibEvents(); // Register all TDLib event listeners — called exactly once
  const { state } = useApp();

  if (state.authStep === 'ready') {
    return <AppLayout />;
  }

  return <AuthScreen />;
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
