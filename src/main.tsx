// =========================================================================================
// ENTRY POINT: MAIN.TSX
// PURPOSE: INITIALIZES REACT APP AND AUTHENTICATION STATE
// =========================================================================================

import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { useAuthStore } from './stores/useAuthStore'

// AUTH INITIALIZER COMPONENT
function AuthInitializer() {
  const initialize = useAuthStore((state) => state.initialize);

  useEffect(() => {
    // INITIALIZE AUTH STATE ON APP LOAD
    initialize();
  }, [initialize]);

  return null;
}

// ROOT COMPONENT WITH AUTH INITIALIZATION
function Root() {
  return (
    <StrictMode>
      <AuthInitializer />
      <App />
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<Root />)
