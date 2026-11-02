import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';

const AUTH_PATHS = new Set(['/login', '/register', '/forgot-password', '/reset-password']);

export default function useAppBack() {
  const location = useLocation();
  const navigate = useNavigate();
  const lastBackAt = useRef(0);
  const [exitHint, setExitHint] = useState(false);

  const goBack = useCallback(() => {
    if ((window.history.state?.idx ?? 0) > 0) {
      setExitHint(false);
      navigate(-1);
      return;
    }

    const fallback = AUTH_PATHS.has(location.pathname) ? '/login' : '/';
    if (location.pathname !== fallback) {
      setExitHint(false);
      navigate(fallback, { replace: true });
      return;
    }

    if (localStorage.getItem('smart_pkos_double_back_exit') !== 'true' || !Capacitor.isNativePlatform()) return;
    const now = Date.now();
    if (now - lastBackAt.current < 1500) {
      NativeApp.exitApp();
      return;
    }
    lastBackAt.current = now;
    setExitHint(true);
    window.setTimeout(() => setExitHint(false), 1500);
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let listener;
    let disposed = false;
    NativeApp.addListener('backButton', () => goBack()).then((handle) => {
      if (disposed) handle.remove();
      else listener = handle;
    });
    return () => {
      disposed = true;
      listener?.remove();
    };
  }, [goBack]);

  return { goBack, exitHint };
}
